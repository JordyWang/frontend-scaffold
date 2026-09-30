import { type Key, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { Empty } from './empty'
import { ErrorState, LoadingState } from './feedback-state'

export type ListProps<T> = {
  items: T[]
  getKey: (item: T) => Key
  renderItem: (item: T) => ReactNode
  loading?: boolean
  error?: string
  onRetry?: () => void | Promise<void>
  emptyTitle?: string
  className?: string
  label?: string
}

export function List<T>({
  items,
  getKey,
  renderItem,
  loading,
  error,
  onRetry,
  emptyTitle = '暂无内容',
  className,
  label,
}: ListProps<T>) {
  return (
    <section
      aria-label={label}
      aria-busy={loading || undefined}
      className={cn(
        'overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card',
        className,
      )}
    >
      {loading ? (
        <div className="p-4">
          <LoadingState />
        </div>
      ) : error ? (
        <div className="p-4">
          <ErrorState description={error} onRetry={onRetry} />
        </div>
      ) : items.length === 0 ? (
        <div role="status" className="p-4">
          <Empty title={emptyTitle} />
        </div>
      ) : (
        <ul
          aria-label={label}
          className="m-0 list-none divide-y divide-border p-0"
        >
          {items.map((item) => (
            <li key={getKey(item)} className="p-4">
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
