import { useCallback, useEffect, useReducer, useRef } from 'react'
import {
  aiChatReducer,
  getActiveConversation,
  initialAiChatState,
} from './chat-machine'
import type { AiMessage, AiSessionClient } from './chat-types'

const now = () => new Date().toISOString()
const createMessageId = (prefix: string) => {
  const suffix =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-${suffix}`
}

export function useAiChat(client: AiSessionClient) {
  const [state, dispatch] = useReducer(aiChatReducer, initialAiChatState)
  const requestRef = useRef<AbortController | null>(null)
  const activeRequestRef = useRef<{
    conversationId: string
    messageId: string
  } | null>(null)

  const stopRequest = useCallback(() => {
    requestRef.current?.abort()
    requestRef.current = null
    activeRequestRef.current = null
  }, [])

  const load = useCallback(async () => {
    stopRequest()
    const controller = new AbortController()
    requestRef.current = controller
    dispatch({ type: 'load-start' })
    try {
      const conversations = await client.listConversations({
        signal: controller.signal,
      })
      if (!controller.signal.aborted)
        dispatch({ type: 'loaded', conversations })
    } catch (error) {
      if (!controller.signal.aborted)
        dispatch({
          type: 'load-error',
          message: error instanceof Error ? error.message : '加载会话失败',
        })
    } finally {
      if (requestRef.current === controller) requestRef.current = null
    }
  }, [client, stopRequest])

  useEffect(() => {
    void load()
    return stopRequest
  }, [load, stopRequest])

  const createConversation = useCallback(
    async (title?: string) => {
      const controller = new AbortController()
      try {
        const conversation = await client.createConversation(
          { title },
          { signal: controller.signal },
        )
        if (!controller.signal.aborted)
          dispatch({ type: 'created', conversation })
        return conversation
      } catch (error) {
        dispatch({
          type: 'load-error',
          message: error instanceof Error ? error.message : '创建会话失败',
        })
        return null
      }
    },
    [client],
  )

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      const controller = new AbortController()
      try {
        await client.deleteConversation(conversationId, {
          signal: controller.signal,
        })
        if (!controller.signal.aborted)
          dispatch({ type: 'deleted', conversationId })
      } catch (error) {
        dispatch({
          type: 'load-error',
          message: error instanceof Error ? error.message : '删除会话失败',
        })
      }
    },
    [client],
  )

  const selectConversation = useCallback((conversationId: string) => {
    dispatch({ type: 'select', conversationId })
  }, [])

  const send = useCallback(
    async (content: string) => {
      const value = content.trim()
      if (!value || state.phase === 'streaming') return
      stopRequest()
      let conversation = getActiveConversation(state)
      if (!conversation)
        conversation = await createConversation(value.slice(0, 32))
      if (!conversation) return

      const userId = createMessageId('user')
      const messageId = createMessageId('assistant')
      const userMessage: AiMessage = {
        id: userId,
        conversationId: conversation.id,
        role: 'user',
        content: value,
        status: 'complete',
        createdAt: now(),
      }
      const assistantMessage: AiMessage = {
        id: messageId,
        conversationId: conversation.id,
        role: 'assistant',
        content: '',
        status: 'thinking',
        createdAt: now(),
      }
      dispatch({
        type: 'send-start',
        conversationId: conversation.id,
        userMessage,
        assistantMessage,
      })
      const controller = new AbortController()
      requestRef.current = controller
      activeRequestRef.current = {
        conversationId: conversation.id,
        messageId,
      }
      try {
        await client.sendMessage(
          conversation.id,
          { content: value, messageId },
          {
            signal: controller.signal,
            onEvent: (event) => {
              if (!controller.signal.aborted)
                dispatch({
                  type: 'stream-event',
                  conversationId: conversation.id,
                  event,
                })
            },
          },
        )
      } catch (error) {
        if (!controller.signal.aborted)
          dispatch({
            type: 'stream-error',
            conversationId: conversation.id,
            messageId,
            message: error instanceof Error ? error.message : '消息发送失败',
          })
        else
          dispatch({
            type: 'stream-event',
            conversationId: conversation.id,
            event: { type: 'cancelled', messageId },
          })
      } finally {
        if (requestRef.current === controller) requestRef.current = null
        activeRequestRef.current = null
      }
    },
    [client, createConversation, state, stopRequest],
  )

  const retry = useCallback(
    async (messageId: string) => {
      if (state.phase === 'streaming') return
      const conversation = getActiveConversation(state)
      if (!conversation) return
      const assistant = conversation.messages.find(
        (message) => message.id === messageId,
      )
      if (!assistant || assistant.role !== 'assistant') return
      const assistantIndex = conversation.messages.indexOf(assistant)
      const userMessage = conversation.messages
        .slice(0, assistantIndex)
        .reverse()
        .find((message) => message.role === 'user')
      if (!userMessage) return
      stopRequest()
      dispatch({
        type: 'retry-start',
        conversationId: conversation.id,
        messageId,
      })
      const controller = new AbortController()
      requestRef.current = controller
      activeRequestRef.current = {
        conversationId: conversation.id,
        messageId,
      }
      try {
        await client.sendMessage(
          conversation.id,
          { content: userMessage.content, messageId },
          {
            signal: controller.signal,
            onEvent: (event) => {
              if (!controller.signal.aborted)
                dispatch({
                  type: 'stream-event',
                  conversationId: conversation.id,
                  event,
                })
            },
          },
        )
      } catch (error) {
        if (!controller.signal.aborted)
          dispatch({
            type: 'stream-error',
            conversationId: conversation.id,
            messageId,
            message: error instanceof Error ? error.message : '重试消息失败',
          })
        else
          dispatch({
            type: 'stream-event',
            conversationId: conversation.id,
            event: { type: 'cancelled', messageId },
          })
      } finally {
        if (requestRef.current === controller) requestRef.current = null
        activeRequestRef.current = null
      }
    },
    [client, state, stopRequest],
  )

  const cancel = useCallback(() => {
    const active = activeRequestRef.current
    requestRef.current?.abort()
    requestRef.current = null
    if (active)
      dispatch({
        type: 'stream-event',
        conversationId: active.conversationId,
        event: { type: 'cancelled', messageId: active.messageId },
      })
    activeRequestRef.current = null
  }, [])

  return {
    ...state,
    activeConversation: getActiveConversation(state),
    load,
    createConversation,
    deleteConversation,
    selectConversation,
    send,
    retry,
    cancel,
    reset: () => {
      stopRequest()
      dispatch({ type: 'reset' })
    },
  }
}
