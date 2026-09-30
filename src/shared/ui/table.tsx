import { useMemo, useState, type Key, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { Empty } from './empty'
import { ErrorState, LoadingState } from './feedback-state'

export type TableColumn<T> = {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  sorter?: (left: T, right: T) => number
  sortLabel?: string
  align?: 'left' | 'center' | 'right'
  /** Render this data cell as a row header for assistive technology. */
  rowScope?: 'row' | 'rowgroup'
}

export type TableSort = {
  columnKey: string
  direction: 'asc' | 'desc'
}

function alignmentClassName(align?: TableColumn<unknown>['align']) {
  if (align === 'center') return 'text-center'
  if (align === 'left') return 'text-left'
  if (align === 'right') return 'text-right'
  return 'text-start'
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
  sort?: TableSort | null
  defaultSort?: TableSort | null
  onSortChange?: (sort: TableSort | null) => void
  className?: string
}

export function Table<T>(allProps: TableProps<T>) {
  const controlled = Object.prototype.hasOwnProperty.call(allProps, 'sort')
  const {
    columns,
    rows,
    getRowKey,
    caption,
    loading,
    error,
    onRetry,
    emptyTitle = '暂无数据',
    renderMobileRow,
    sort,
    defaultSort = null,
    onSortChange,
    className,
  } = allProps
  const [internalSort, setInternalSort] = useState<TableSort | null>(
    defaultSort,
  )
  const requestedSort = controlled ? (sort ?? null) : internalSort
  const sortColumn = columns.find(
    (column) => column.key === requestedSort?.columnKey && column.sorter,
  )
  const activeSort = sortColumn ? requestedSort : null
  const sorter = sortColumn?.sorter
  const displayedRows = useMemo(() => {
    if (!activeSort || !sorter) return rows
    const multiplier = activeSort.direction === 'asc' ? 1 : -1
    return rows
      .map((row, index) => ({ row, index }))
      .sort((left, right) => {
        const result = sorter(left.row, right.row)
        return (
          (Number.isFinite(result) ? result * multiplier : 0) ||
          left.index - right.index
        )
      })
      .map(({ row }) => row)
  }, [activeSort, rows, sorter])

  function changeSort(columnKey: string) {
    const next: TableSort | null =
      activeSort?.columnKey !== columnKey
        ? { columnKey, direction: 'asc' }
        : activeSort.direction === 'asc'
          ? { columnKey, direction: 'desc' }
          : null
    if (!controlled) setInternalSort(next)
    onSortChange?.(next)
  }

  function sortButton(column: TableColumn<T>, mobile = false) {
    const direction =
      activeSort?.columnKey === column.key ? activeSort.direction : null
    const name =
      column.sortLabel ??
      (typeof column.header === 'string' ? column.header : column.key)
    const state =
      direction === 'asc' ? '升序' : direction === 'desc' ? '降序' : '未排序'
    return (
      <button
        type="button"
        aria-label={`按${name}排序，${state}`}
        aria-pressed={mobile ? Boolean(direction) : undefined}
        className={cn(
          'inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center gap-2 rounded-[var(--radius-sm)] px-2 text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          mobile &&
            'shrink-0 border border-border bg-card px-3 text-sm font-semibold',
          direction && 'text-primary',
        )}
        onClick={() => changeSort(column.key)}
      >
        <span>{column.header}</span>
        <span aria-hidden="true" className="text-base leading-none">
          {direction === 'asc' ? '↑' : direction === 'desc' ? '↓' : '↕'}
        </span>
      </button>
    )
  }

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
        <table className="min-w-full border-collapse text-start">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-muted">
            <tr className="border-b border-border">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={
                    column.sorter
                      ? activeSort?.columnKey === column.key
                        ? activeSort.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                      : undefined
                  }
                  className={cn(
                    column.sorter
                      ? 'px-2 py-1 text-sm font-semibold'
                      : 'px-4 py-3 text-sm font-semibold',
                    alignmentClassName(column.align),
                  )}
                >
                  {column.sorter ? sortButton(column) : column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayedRows.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((column) =>
                  column.rowScope ? (
                    <th
                      key={column.key}
                      scope={column.rowScope}
                      className={cn(
                        'px-4 py-3 align-middle font-medium',
                        alignmentClassName(column.align),
                      )}
                    >
                      {column.render(row)}
                    </th>
                  ) : (
                    <td
                      key={column.key}
                      className={cn(
                        'px-4 py-3 align-middle',
                        alignmentClassName(column.align),
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
        <div className="sm:hidden">
          {columns.some((column) => column.sorter) && (
            <div
              role="group"
              aria-label={`${caption}排序`}
              className="flex gap-2 overflow-x-auto border-b border-border p-2"
            >
              {columns
                .filter((column) => column.sorter)
                .map((column) => (
                  <span key={column.key}>{sortButton(column, true)}</span>
                ))}
            </div>
          )}
          <ul
            aria-label={caption}
            className="m-0 list-none divide-y divide-border p-0"
          >
            {displayedRows.map((row) => (
              <li key={getRowKey(row)} className="p-[var(--space-md)]">
                {renderMobileRow(row)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
