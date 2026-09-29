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
    <Card className="min-w-0">
      <CardContent
        className="grid min-w-0 grid-cols-[minmax(12rem,15rem)_minmax(0,1fr)] gap-[var(--space-lg)] max-md:grid-cols-1 max-md:gap-[var(--space-md)]"
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
        <section
          className="grid min-h-[30rem] min-w-0 grid-rows-[auto_minmax(16rem,1fr)_auto_auto] gap-[var(--space-md)] max-md:min-h-[26rem]"
          aria-label={`当前会话：${activeTitle}`}
        >
          <header className="flex items-center justify-between gap-[var(--space-sm)] border-b border-border pb-[var(--space-md)]">
            <div>
              <p className="mb-0.5 text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
                AI 对话
              </p>
              <h3 className="m-0">{activeTitle}</h3>
            </div>
            <span className="text-sm text-muted-foreground" role="status">
              {isStreaming ? '正在生成' : '就绪'}
            </span>
          </header>
          <div
            className="grid max-h-[34rem] min-h-64 min-w-0 content-start gap-[var(--space-md)] overflow-auto p-[var(--space-xs)] scroll-smooth motion-reduce:scroll-auto max-md:max-h-[28rem] max-md:min-h-52"
            role="log"
            aria-live="polite"
          >
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
            <p className="m-0 text-sm text-destructive" role="alert">
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
