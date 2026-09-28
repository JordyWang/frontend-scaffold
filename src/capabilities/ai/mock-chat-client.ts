import type { AiConversation, AiMessage, AiSessionClient } from './chat-types'

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason ?? new DOMException('已取消', 'AbortError'))
      return
    }
    const timer = window.setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(signal.reason ?? new DOMException('已取消', 'AbortError'))
      },
      { once: true },
    )
  })

const cloneConversation = (conversation: AiConversation): AiConversation => ({
  ...conversation,
  messages: conversation.messages.map((message) => ({ ...message })),
})

export function createMockAiChatClient(): AiSessionClient & {
  fixtures: AiConversation[]
} {
  let sequence = 0
  const welcome: AiConversation = {
    id: 'mock-conversation-welcome',
    title: '欢迎使用 AI 工作台',
    updatedAt: new Date().toISOString(),
    messages: [],
  }
  const conversations = new Map<string, AiConversation>([[welcome.id, welcome]])
  const failedPrompts = new Set<string>()

  const createConversation = (title?: string): AiConversation => {
    const now = new Date().toISOString()
    return {
      id: `mock-conversation-${++sequence}`,
      title: title || '新对话',
      updatedAt: now,
      messages: [],
    }
  }

  const getReply = (content: string) =>
    `这是针对「${content}」的 Mock 流式回复。你可以观察思考中、增量输出、取消、失败和重试状态。`

  return {
    fixtures: [cloneConversation(welcome)],
    async listConversations({ signal }) {
      await wait(80, signal)
      return [...conversations.values()]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .map(cloneConversation)
    },
    async createConversation({ title }, { signal }) {
      await wait(60, signal)
      const conversation = createConversation(title)
      conversations.set(conversation.id, conversation)
      return cloneConversation(conversation)
    },
    async deleteConversation(id, { signal }) {
      await wait(60, signal)
      conversations.delete(id)
    },
    async sendMessage(conversationId, input, { signal, onEvent }) {
      const conversation = conversations.get(conversationId)
      if (!conversation) throw new Error('会话不存在')
      const messageId = input.messageId ?? `mock-assistant-${++sequence}`
      const userId = `mock-user-${messageId}`
      if (conversation.messages.length === 0)
        conversation.title = input.content.slice(0, 32)
      if (!conversation.messages.some((message) => message.id === userId)) {
        conversation.messages.push({
          id: userId,
          conversationId,
          role: 'user',
          content: input.content,
          status: 'complete',
          createdAt: new Date().toISOString(),
        })
      }
      conversation.updatedAt = new Date().toISOString()
      onEvent({ type: 'thinking', messageId })
      await wait(140, signal)
      if (
        /失败|fail/i.test(input.content) &&
        !failedPrompts.has(input.content)
      ) {
        failedPrompts.add(input.content)
        conversation.messages = conversation.messages
          .filter((item) => item.id !== messageId)
          .concat({
            id: messageId,
            conversationId,
            role: 'assistant',
            content: '',
            status: 'error',
            createdAt: new Date().toISOString(),
            error: 'Mock 对话失败，请点击重试。',
          })
        onEvent({
          type: 'error',
          messageId,
          error: 'Mock 对话失败，请点击重试。',
        })
        return
      }
      const reply = getReply(input.content)
      const chunks = reply.match(/.{1,12}/gu) ?? [reply]
      let content = ''
      for (const chunk of chunks) {
        await wait(70, signal)
        content += chunk
        onEvent({ type: 'delta', messageId, delta: chunk })
      }
      await wait(30, signal)
      onEvent({ type: 'complete', messageId })
      const message: AiMessage = {
        id: messageId,
        conversationId,
        role: 'assistant',
        content,
        status: 'complete',
        createdAt: new Date().toISOString(),
      }
      conversation.messages = conversation.messages
        .filter((item) => item.id !== messageId)
        .concat(message)
      conversation.updatedAt = new Date().toISOString()
    },
  }
}
