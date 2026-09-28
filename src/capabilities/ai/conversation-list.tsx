import { Button, Empty } from '@/shared/ui'
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
    <nav className="ui-ai-conversations" aria-label="会话列表">
      <div className="ui-ai-conversations__header">
        <h3>会话</h3>
        <Button size="small" variant="outline" onClick={() => void onCreate()}>
          新建
        </Button>
      </div>
      {loading ? (
        <p role="status" className="ui-ai-conversations__status">
          正在加载会话…
        </p>
      ) : conversations.length === 0 ? (
        <Empty title="暂无会话" description="新建一个对话开始使用。" />
      ) : (
        <ul className="ui-ai-conversations__list">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <div
                className={`ui-ai-conversation${
                  conversation.id === activeConversationId
                    ? ' ui-ai-conversation--active'
                    : ''
                }`}
              >
                <button
                  type="button"
                  className="ui-ai-conversation__select"
                  aria-current={
                    conversation.id === activeConversationId
                      ? 'page'
                      : undefined
                  }
                  onClick={() => onSelect(conversation.id)}
                >
                  <span>{conversation.title}</span>
                  <small>{conversation.messages.length} 条消息</small>
                </button>
                {onDelete && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="ui-ai-conversation__delete"
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
