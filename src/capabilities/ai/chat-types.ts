export type AiMessageRole = 'user' | 'assistant' | 'system'

export type AiMessageStatus =
  'thinking' | 'streaming' | 'complete' | 'error' | 'cancelled'

export type AiMessage = {
  id: string
  conversationId: string
  role: AiMessageRole
  content: string
  status: AiMessageStatus
  createdAt: string
  error?: string
}

export type AiConversation = {
  id: string
  title: string
  messages: AiMessage[]
  updatedAt: string
}

export type AiSendInput = {
  content: string
  messageId?: string
}

export type AiStreamEvent =
  | { type: 'thinking'; messageId: string }
  | { type: 'delta'; messageId: string; delta: string }
  | { type: 'complete'; messageId: string }
  | { type: 'error'; messageId: string; error: string }
  | { type: 'cancelled'; messageId: string }

export type AiSessionClient = {
  listConversations: (options: {
    signal: AbortSignal
  }) => Promise<AiConversation[]>
  createConversation: (
    input: { title?: string },
    options: { signal: AbortSignal },
  ) => Promise<AiConversation>
  deleteConversation: (
    conversationId: string,
    options: { signal: AbortSignal },
  ) => Promise<void>
  sendMessage: (
    conversationId: string,
    input: AiSendInput,
    options: {
      signal: AbortSignal
      onEvent: (event: AiStreamEvent) => void
    },
  ) => Promise<void>
}
