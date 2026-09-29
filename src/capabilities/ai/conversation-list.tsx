import { Button, Empty } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import type { AiConversation } from './chat-types'

export type ConversationListProps = {
  conversations: AiConversation[]
  activeConversationId: string | null
  onSelect: (conversationId: string) => void
  onCreate: () => void | Promise<void>
  onDelete?: (conversationId: string) => void | Promise<void>
  loading?: boolean
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelect,
  onCreate,
  onDelete,
  loading,
}: ConversationListProps) {
  return (
    <nav
      className="min-w-0 border-r border-border pr-[var(--space-lg)] max-md:border-r-0 max-md:border-b max-md:pr-0 max-md:pb-[var(--space-md)]"
      aria-label="会话列表"
    >
      <div className="mb-[var(--space-md)] flex items-center justify-between gap-[var(--space-sm)]">
        <h3 className="m-0">会话</h3>
        <Button size="small" variant="outline" onClick={() => void onCreate()}>
          新建
        </Button>
      </div>
      {loading ? (
        <p role="status" className="text-sm text-muted-foreground">
          正在加载会话…
        </p>
      ) : conversations.length === 0 ? (
        <Empty title="暂无会话" description="新建一个对话开始使用。" />
      ) : (
        <ul className="m-0 grid list-none gap-[var(--space-xs)] p-0 max-md:flex max-md:max-w-full max-md:overflow-x-auto max-md:pb-[var(--space-xs)]">
          {conversations.map((conversation) => (
            <li key={conversation.id} className="max-md:min-w-48">
              <div
                className={cn(
                  'flex min-w-0 items-stretch rounded-[var(--radius-md)]',
                  conversation.id === activeConversationId &&
                    'bg-accent text-accent-foreground',
                )}
              >
                <button
                  type="button"
                  className="grid min-h-11 min-w-0 flex-1 touch-manipulation cursor-pointer content-center gap-0.5 rounded-[var(--radius-md)] border-0 bg-transparent px-3 py-2.5 text-start text-inherit"
                  aria-current={
                    conversation.id === activeConversationId
                      ? 'page'
                      : undefined
                  }
                  onClick={() => onSelect(conversation.id)}
                >
                  <span className="truncate font-semibold">
                    {conversation.title}
                  </span>
                  <small
                    className={cn(
                      'truncate text-xs text-muted-foreground',
                      conversation.id === activeConversationId &&
                        'text-inherit opacity-75',
                    )}
                  >
                    {conversation.messages.length} 条消息
                  </small>
                </button>
                {onDelete && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="min-w-11 text-inherit"
                    aria-label={`删除会话 ${conversation.title}`}
                    onClick={() => void onDelete(conversation.id)}
                  >
                    ×
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </nav>
  )
}
