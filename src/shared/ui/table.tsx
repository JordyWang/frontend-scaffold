import { type Key, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { Empty } from './empty'
import { ErrorState, LoadingState } from './feedback-state'

export type TableColumn<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  align?: 'left' | 'center' | 'right'
}
export type TableProps<T> = {
  columns: TableColumn<T>[]
  rows: T[]
  getRowKey: (row: T) => Key
  caption: string
  loading?: boolean
  error?: string
  onRetry?: () => void
  emptyTitle?: string
  renderMobileRow?: (row: T) => ReactNode
  className?: string
}

export function Table<T>({
  columns,
  rows,
  getRowKey,
  caption,
  loading,
  error,
  onRetry,
  emptyTitle = '暂无数据',
  renderMobileRow,
  className,
}: TableProps<T>) {
  if (loading) return <LoadingState />
  if (error) return <ErrorState description={error} onRetry={onRetry} />
  if (rows.length === 0) return <Empty title={emptyTitle} />
  return (
    <div className={cn('ui-table-wrap', className)}>
      <div
        className={
          renderMobileRow
            ? 'ui-table-scroll ui-table-scroll--desktop'
            : 'ui-table-scroll'
        }
      >
        <table className="ui-table">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`ui-table__${column.align ?? 'left'}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`ui-table__${column.align ?? 'left'}`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {renderMobileRow && (
        <ul aria-label={caption} className="ui-table-mobile">
          {rows.map((row) => (
            <li key={getRowKey(row)} className="ui-table-mobile__item">
              {renderMobileRow(row)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
