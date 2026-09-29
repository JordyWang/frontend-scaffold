import { Button } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import type { AiMessage } from './chat-types'
import { ThinkingIndicator } from './thinking-indicator'

export type MessageBubbleProps = {
  message: AiMessage
  onRetry?: (messageId: string) => void
}

export function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isThinking =
    !isUser &&
    (message.status === 'thinking' ||
      (message.status === 'streaming' && !message.content))
  return (
    <article
      className={cn(
        'grid max-w-[min(100%,42rem)] gap-1',
        isUser && 'justify-self-end justify-items-end',
      )}
      aria-label={isUser ? '用户消息' : 'AI 消息'}
      data-status={message.status}
    >
      <div className="flex items-baseline gap-[var(--space-sm)] text-xs text-muted-foreground">
        {isUser ? '你' : 'AI'}
        <time dateTime={message.createdAt} className="tabular-nums">
          {new Intl.DateTimeFormat('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(message.createdAt))}
        </time>
      </div>
      <div
        className={cn(
          'min-w-0 rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3',
          isUser && 'border-primary bg-primary text-primary-foreground',
        )}
      >
        {isThinking ? (
          <ThinkingIndicator />
        ) : (
          <p className="m-0 leading-[1.6] whitespace-pre-wrap [overflow-wrap:anywhere]">
            {message.content}
          </p>
        )}
        {message.status === 'cancelled' && (
          <p
            className={cn(
              'm-0 text-sm leading-[1.6] whitespace-pre-wrap [overflow-wrap:anywhere]',
              isUser ? 'text-inherit opacity-80' : 'text-muted-foreground',
            )}
          >
            已取消生成
          </p>
        )}
        {message.status === 'error' && (
          <div
            className="grid justify-items-start gap-[var(--space-sm)] text-destructive"
            role="alert"
          >
            <p className="m-0 leading-[1.6] whitespace-pre-wrap [overflow-wrap:anywhere]">
              {message.error ?? '生成失败'}
            </p>
            {onRetry && (
              <Button
                size="small"
                variant="outline"
                className="text-foreground"
                onClick={() => onRetry(message.id)}
              >
                重试
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
