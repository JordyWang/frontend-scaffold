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
  onRetry?: () => void
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
  if (loading) return <LoadingState />
  if (error) return <ErrorState description={error} onRetry={onRetry} />
  if (items.length === 0) return <Empty title={emptyTitle} />
  return (
    <ul
      aria-label={label}
      className={cn(
        'm-0 list-none divide-y divide-border overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card p-0',
        className,
      )}
    >
      {items.map((item) => (
        <li key={getKey(item)} className="p-4">
          {renderItem(item)}
        </li>
      ))}
    </ul>
  )
}
