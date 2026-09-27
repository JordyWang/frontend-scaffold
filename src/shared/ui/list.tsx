import { type Key, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { Empty } from './empty'

export type ListProps<T> = {
  items: T[]
  getKey: (item: T) => Key
  renderItem: (item: T) => ReactNode
  loading?: boolean
  emptyTitle?: string
  className?: string
  label?: string
}

export function List<T>({
  items,
  getKey,
  renderItem,
  loading,
  emptyTitle = '暂无内容',
  className,
  label,
}: ListProps<T>) {
  if (loading)
    return (
      <p role="status" className="ui-data-status">
        正在加载…
      </p>
    )
  if (items.length === 0) return <Empty title={emptyTitle} />
  return (
    <ul aria-label={label} className={cn('ui-list', className)}>
      {items.map((item) => (
        <li key={getKey(item)} className="ui-list__item">
          {renderItem(item)}
        </li>
      ))}
    </ul>
  )
}
