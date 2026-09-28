import { useMemo } from 'react'
import { Card, CardContent, LoadingState } from '@/shared/ui'
import { useAiChat } from './chat-client'
import { ConversationList } from './conversation-list'
import { MessageBubble } from './message-bubble'
import type { AiSessionClient } from './chat-types'
import { PromptComposer } from './prompt-composer'
import { PromptSuggestions } from './prompt-suggestions'
import { WelcomePanel } from './welcome-panel'

const suggestions = [
  '帮我整理今天的工作重点',
  '把这段内容改写得更清晰',
  '给我一个可执行的方案',
] as const

export type AiChatWorkbenchProps = {
  client: AiSessionClient
}

export function AiChatWorkbench({ client }: AiChatWorkbenchProps) {
  const chat = useAiChat(client)
  const messages = chat.activeConversation?.messages ?? []
  const isLoading = chat.phase === 'idle' || chat.phase === 'loading'
  const isStreaming = chat.phase === 'streaming'
  const activeTitle = useMemo(
    () => chat.activeConversation?.title ?? '新对话',
    [chat.activeConversation?.title],
  )

  return (
    <Card className="ui-ai-chat-card">
      <CardContent
        className="ui-ai-chat-workbench"
        role="region"
        aria-label="AI 对话工作台"
      >
        <ConversationList
          conversations={chat.conversations}
          activeConversationId={chat.activeConversationId}
          onSelect={chat.selectConversation}
          onCreate={() => {
            void chat.createConversation()
          }}
          onDelete={isStreaming ? undefined : chat.deleteConversation}
          loading={isLoading}
        />
        <section className="ui-ai-chat" aria-label={`当前会话：${activeTitle}`}>
          <header className="ui-ai-chat__header">
            <div>
              <p className="ui-ai-chat__eyebrow">AI 对话</p>
              <h3>{activeTitle}</h3>
            </div>
            <span className="ui-ai-chat__state" role="status">
              {isStreaming ? '正在生成' : '就绪'}
            </span>
          </header>
          <div className="ui-ai-chat__messages" role="log" aria-live="polite">
            {isLoading ? (
              <LoadingState label="正在加载对话…" />
            ) : messages.length === 0 ? (
              <WelcomePanel />
            ) : (
              messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onRetry={(messageId) => void chat.retry(messageId)}
                />
              ))
            )}
          </div>
          {chat.error && (
            <p className="ui-ai-chat__error" role="alert">
              {chat.error}
            </p>
          )}
          <PromptSuggestions
            items={suggestions}
            disabled={isLoading || isStreaming}
            onSelect={(prompt) => void chat.send(prompt)}
          />
          <PromptComposer
            loading={isStreaming}
            disabled={isLoading || !chat.activeConversationId}
            onSubmit={(content) => void chat.send(content)}
            onCancel={chat.cancel}
          />
        </section>
      </CardContent>
    </Card>
  )
}
