import type { AiConversation, AiMessage, AiStreamEvent } from './chat-types'

export type AiChatPhase = 'idle' | 'loading' | 'ready' | 'streaming' | 'error'

export type AiChatState = {
  phase: AiChatPhase
  conversations: AiConversation[]
  activeConversationId: string | null
  error?: string
}

export type AiChatEvent =
  | { type: 'load-start' }
  | { type: 'loaded'; conversations: AiConversation[] }
  | { type: 'load-error'; message: string }
  | { type: 'select'; conversationId: string }
  | { type: 'created'; conversation: AiConversation }
  | { type: 'deleted'; conversationId: string }
  | {
      type: 'send-start'
      conversationId: string
      userMessage: AiMessage
      assistantMessage: AiMessage
    }
  | {
      type: 'retry-start'
      conversationId: string
      messageId: string
    }
  | { type: 'stream-event'; conversationId: string; event: AiStreamEvent }
  | {
      type: 'stream-error'
      conversationId: string
      messageId: string
      message: string
    }
  | { type: 'reset' }

export const initialAiChatState: AiChatState = {
  phase: 'idle',
  conversations: [],
  activeConversationId: null,
}

function replaceConversation(
  conversations: AiConversation[],
  next: AiConversation,
) {
  return conversations.map((conversation) =>
    conversation.id === next.id ? next : conversation,
  )
}

function updateConversation(
  state: AiChatState,
  conversationId: string,
  update: (conversation: AiConversation) => AiConversation,
) {
  return state.conversations.map((conversation) =>
    conversation.id === conversationId ? update(conversation) : conversation,
  )
}

function updateMessage(
  conversation: AiConversation,
  messageId: string,
  update: (message: AiMessage) => AiMessage,
) {
  return {
    ...conversation,
    messages: conversation.messages.map((message) =>
      message.id === messageId ? update(message) : message,
    ),
    updatedAt: new Date().toISOString(),
  }
}

export function aiChatReducer(
  state: AiChatState,
  event: AiChatEvent,
): AiChatState {
  switch (event.type) {
    case 'load-start':
      return { ...state, phase: 'loading', error: undefined }
    case 'loaded':
      return {
        phase: 'ready',
        conversations: event.conversations,
        activeConversationId:
          state.activeConversationId &&
          event.conversations.some(
            (conversation) => conversation.id === state.activeConversationId,
          )
            ? state.activeConversationId
            : (event.conversations[0]?.id ?? null),
      }
    case 'load-error':
      return { ...state, phase: 'error', error: event.message }
    case 'select':
      if (!state.conversations.some((item) => item.id === event.conversationId))
        return state
      return {
        ...state,
        activeConversationId: event.conversationId,
        phase: 'ready',
        error: undefined,
      }
    case 'created':
      return {
        ...state,
        phase: 'ready',
        conversations: [event.conversation, ...state.conversations],
        activeConversationId: event.conversation.id,
        error: undefined,
      }
    case 'deleted': {
      const conversations = state.conversations.filter(
        (conversation) => conversation.id !== event.conversationId,
      )
      const activeConversationId =
        state.activeConversationId === event.conversationId
          ? (conversations[0]?.id ?? null)
          : state.activeConversationId
      return {
        ...state,
        conversations,
        activeConversationId,
        phase: 'ready',
      }
    }
    case 'send-start': {
      const conversation = state.conversations.find(
        (item) => item.id === event.conversationId,
      )
      if (!conversation) return state
      const title =
        conversation.messages.length === 0
          ? event.userMessage.content.slice(0, 32)
          : conversation.title
      const nextConversation = {
        ...conversation,
        title,
        messages: [
          ...conversation.messages,
          event.userMessage,
          event.assistantMessage,
        ],
        updatedAt: new Date().toISOString(),
      }
      return {
        ...state,
        phase: 'streaming',
        conversations: replaceConversation(
          state.conversations,
          nextConversation,
        ),
        activeConversationId: event.conversationId,
        error: undefined,
      }
    }
    case 'retry-start': {
      return {
        ...state,
        phase: 'streaming',
        conversations: updateConversation(
          state,
          event.conversationId,
          (conversation) =>
            updateMessage(conversation, event.messageId, (message) => ({
              ...message,
              content: '',
              status: 'thinking',
              error: undefined,
            })),
        ),
        error: undefined,
      }
    }
    case 'stream-event': {
      const { event: streamEvent } = event
      const conversations = updateConversation(
        state,
        event.conversationId,
        (conversation) =>
          updateMessage(conversation, streamEvent.messageId, (message) => {
            if (streamEvent.type === 'thinking')
              return { ...message, status: 'thinking', error: undefined }
            if (streamEvent.type === 'delta')
              return {
                ...message,
                content: message.content + streamEvent.delta,
                status: 'streaming',
                error: undefined,
              }
            if (streamEvent.type === 'complete')
              return { ...message, status: 'complete', error: undefined }
            if (streamEvent.type === 'error')
              return { ...message, status: 'error', error: streamEvent.error }
            return {
              ...message,
              status: 'cancelled',
              error: undefined,
            }
          }),
      )
      const isDone =
        streamEvent.type === 'complete' ||
        streamEvent.type === 'error' ||
        streamEvent.type === 'cancelled'
      return {
        ...state,
        conversations,
        phase: isDone
          ? streamEvent.type === 'error'
            ? 'error'
            : 'ready'
          : 'streaming',
        error: streamEvent.type === 'error' ? streamEvent.error : undefined,
      }
    }
    case 'stream-error':
      return {
        ...state,
        phase: 'error',
        error: event.message,
        conversations: updateConversation(
          state,
          event.conversationId,
          (conversation) =>
            updateMessage(conversation, event.messageId, (message) => ({
              ...message,
              status: 'error',
              error: event.message,
            })),
        ),
      }
    case 'reset':
      return initialAiChatState
  }
}

export function getActiveConversation(state: AiChatState) {
  return (
    state.conversations.find(
      (conversation) => conversation.id === state.activeConversationId,
    ) ?? null
  )
}
