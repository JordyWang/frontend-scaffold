import { type Key, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { Empty } from './empty'
import { ErrorState, LoadingState } from './feedback-state'

export type TableColumn<T> = {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  align?: 'left' | 'center' | 'right'
  /** Render this data cell as a row header for assistive technology. */
  rowScope?: 'row' | 'rowgroup'
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
  const regionClassName = cn(
    'overflow-hidden rounded-[var(--radius)] border border-border bg-card text-card-foreground',
    className,
  )
  const stateClassName = 'p-[var(--space-lg)]'

  if (loading)
    return (
      <section
        aria-busy="true"
        aria-label={caption}
        className={regionClassName}
      >
        <div className={stateClassName}>
          <LoadingState />
        </div>
      </section>
    )
  if (error)
    return (
      <section aria-label={caption} className={regionClassName}>
        <div className={stateClassName}>
          <ErrorState description={error} onRetry={onRetry} />
        </div>
      </section>
    )
  if (rows.length === 0)
    return (
      <section aria-label={caption} className={regionClassName}>
        <div role="status" className={stateClassName}>
          <Empty title={emptyTitle} />
        </div>
      </section>
    )

  return (
    <section aria-label={caption} className={regionClassName}>
      <div
        className={cn('overflow-x-auto', renderMobileRow && 'hidden sm:block')}
      >
        <table className="min-w-full border-collapse text-left">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-muted">
            <tr className="border-b border-border">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'px-4 py-3 text-sm font-semibold',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((column) =>
                  column.rowScope ? (
                    <th
                      key={column.key}
                      scope={column.rowScope}
                      className={cn(
                        'px-4 py-3 align-middle font-medium',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right',
                      )}
                    >
                      {column.render(row)}
                    </th>
                  ) : (
                    <td
                      key={column.key}
                      className={cn(
                        'px-4 py-3 align-middle',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right',
                      )}
                    >
                      {column.render(row)}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {renderMobileRow && (
        <ul
          aria-label={caption}
          className="m-0 list-none divide-y divide-border p-0 sm:hidden"
        >
          {rows.map((row) => (
            <li key={getRowKey(row)} className="p-[var(--space-md)]">
              {renderMobileRow(row)}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
