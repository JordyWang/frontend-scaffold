import { Button } from '@/shared/ui'
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
      className={`ui-ai-message ui-ai-message--${message.role}`}
      aria-label={isUser ? '用户消息' : 'AI 消息'}
      data-status={message.status}
    >
      <div className="ui-ai-message__meta">
        {isUser ? '你' : 'AI'}
        <time dateTime={message.createdAt}>
          {new Intl.DateTimeFormat('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(message.createdAt))}
        </time>
      </div>
      <div className="ui-ai-message__body">
        {isThinking ? (
          <ThinkingIndicator />
        ) : (
          <p className="ui-ai-message__content">{message.content}</p>
        )}
        {message.status === 'cancelled' && (
          <p className="ui-ai-message__hint">已取消生成</p>
        )}
        {message.status === 'error' && (
          <div className="ui-ai-message__error" role="alert">
            <p>{message.error ?? '生成失败'}</p>
            {onRetry && (
              <Button
                size="small"
                variant="outline"
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
