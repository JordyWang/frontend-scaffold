import { useMemo, useState, type Key, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { Checkbox } from './choice'
import { Empty } from './empty'
import { ErrorState, LoadingState } from './feedback-state'
import {
  TableFilterControl,
  type TableFilterOption,
  type TableFilters,
} from './table-filter'

export type TableColumn<T> = {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  sorter?: (left: T, right: T) => number
  sortLabel?: string
  filterOptions?: TableFilterOption<T>[]
  filterLabel?: string
  align?: 'left' | 'center' | 'right'
  /** Render this data cell as a row header for assistive technology. */
  rowScope?: 'row' | 'rowgroup'
}

export type TableSort = {
  columnKey: string
  direction: 'asc' | 'desc'
}

export type TableSelection<T> = {
  selectedKeys?: Key[]
  defaultSelectedKeys?: Key[]
  onChange?: (selectedKeys: Key[], selectedRows: T[]) => void
  disabled?: (row: T) => boolean
  getLabel?: (row: T) => string
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
  onRetry?: () => void | Promise<void>
  emptyTitle?: string
  renderMobileRow?: (row: T) => ReactNode
  sort?: TableSort | null
  defaultSort?: TableSort | null
  onSortChange?: (sort: TableSort | null) => void
  filters?: TableFilters
  defaultFilters?: TableFilters
  onFiltersChange?: (filters: TableFilters) => void
  selection?: TableSelection<T>
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
    filters,
    defaultFilters = {},
    onFiltersChange,
    selection,
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
  const [internalFilters, setInternalFilters] =
    useState<TableFilters>(defaultFilters)
  const activeFilters = filters ?? internalFilters
  const hasActiveFilters = Object.values(activeFilters).some(
    (values) => values.length > 0,
  )
  const displayedRows = useMemo(() => {
    const filteredRows = rows.filter((row) =>
      columns.every((column) => {
        const values = activeFilters[column.key]
        if (!values?.length || !column.filterOptions) return true
        return values.some((value) =>
          column.filterOptions
            ?.find((option) => option.value === value)
            ?.matches(row),
        )
      }),
    )
    if (!activeSort || !sorter) return filteredRows
    const multiplier = activeSort.direction === 'asc' ? 1 : -1
    return filteredRows
      .map((row, index) => ({ row, index }))
      .sort((left, right) => {
        const result = sorter(left.row, right.row)
        return (
          (Number.isFinite(result) ? result * multiplier : 0) ||
          left.index - right.index
        )
      })
      .map(({ row }) => row)
  }, [activeFilters, activeSort, columns, rows, sorter])
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<Key[]>(
    selection?.defaultSelectedKeys ?? [],
  )
  const selectionControlled = selection
    ? Object.prototype.hasOwnProperty.call(selection, 'selectedKeys')
    : false
  const selectedKeys = [
    ...new Set(
      selectionControlled
        ? (selection?.selectedKeys ?? [])
        : internalSelectedKeys,
    ),
  ]
  const selectedSet = new Set(selectedKeys)
  const enabledKeys = selection
    ? displayedRows
        .filter((row) => !selection.disabled?.(row))
        .map((row) => getRowKey(row))
    : []
  const enabledKeySet = new Set(enabledKeys)
  const allSelected =
    enabledKeys.length > 0 && enabledKeys.every((key) => selectedSet.has(key))
  const someSelected = enabledKeys.some((key) => selectedSet.has(key))

  function changeFilter(columnKey: string, values: string[]) {
    const next = { ...activeFilters }
    if (values.length) next[columnKey] = values
    else delete next[columnKey]
    if (filters === undefined) setInternalFilters(next)
    onFiltersChange?.(next)
  }

  function changeSelection(next: Key[]) {
    const unique = [...new Set(next)]
    if (!selectionControlled) setInternalSelectedKeys(unique)
    const nextSet = new Set(unique)
    selection?.onChange?.(
      unique,
      rows.filter((row) => nextSet.has(getRowKey(row))),
    )
  }

  function toggleRow(key: Key) {
    changeSelection(
      selectedSet.has(key)
        ? selectedKeys.filter((selectedKey) => selectedKey !== key)
        : [...selectedKeys, key],
    )
  }

  function toggleAll() {
    changeSelection(
      allSelected
        ? selectedKeys.filter((key) => !enabledKeySet.has(key))
        : [...selectedKeys, ...enabledKeys],
    )
  }

  function rowCheckbox(row: T) {
    const key = getRowKey(row)
    return (
      <Checkbox
        label={`选择${selection?.getLabel?.(row) ?? String(key)}`}
        hideLabel
        checked={selectedSet.has(key)}
        disabled={selection?.disabled?.(row)}
        className="min-w-11 justify-center"
        onChange={() => toggleRow(key)}
      />
    )
  }

  function selectAllCheckbox(mobile = false) {
    return (
      <Checkbox
        label={mobile ? '全选' : `全选${caption}当前可选行`}
        aria-label={`全选${caption}当前可选行`}
        hideLabel={!mobile}
        checked={allSelected}
        indeterminate={!allSelected && someSelected}
        disabled={enabledKeys.length === 0}
        className="min-w-11 justify-center"
        onChange={toggleAll}
      />
    )
  }

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

  function filterButton(column: TableColumn<T>, mobile = false) {
    if (!column.filterOptions?.length) return null
    return (
      <TableFilterControl
        label={
          column.filterLabel ??
          (typeof column.header === 'string' ? column.header : column.key)
        }
        options={column.filterOptions}
        selectedValues={activeFilters[column.key] ?? []}
        onApply={(values) => changeFilter(column.key, values)}
        mobile={mobile}
      />
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
  if (displayedRows.length === 0 && !hasActiveFilters)
    return (
      <section aria-label={caption} className={regionClassName}>
        <div role="status" className={stateClassName}>
          <Empty title={emptyTitle} />
        </div>
      </section>
    )

  return (
    <section aria-label={caption} className={regionClassName}>
      {selection && (
        <div
          aria-live="polite"
          className="border-b border-border px-4 py-2 text-sm text-muted-foreground"
        >
          已选 {selectedKeys.length} 项
        </div>
      )}
      <div
        className={cn('overflow-x-auto', renderMobileRow && 'hidden sm:block')}
      >
        <table className="min-w-full border-collapse text-start">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-muted">
            <tr className="border-b border-border">
              {selection && (
                <th scope="col" className="w-14 px-2 text-start">
                  {selectAllCheckbox()}
                </th>
              )}
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
                  <span className="inline-flex items-center gap-1">
                    {column.sorter ? sortButton(column) : column.header}
                    {filterButton(column)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayedRows.length === 0 && (
              <tr>
                <td
                  colSpan={Math.max(1, columns.length + (selection ? 1 : 0))}
                  className="p-[var(--space-lg)]"
                >
                  <div role="status">
                    <Empty
                      title={emptyTitle}
                      description="调整或清空筛选条件以查看数据。"
                    />
                  </div>
                </td>
              </tr>
            )}
            {displayedRows.map((row) => (
              <tr key={getRowKey(row)}>
                {selection && <td className="w-14 px-2">{rowCheckbox(row)}</td>}
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
          {(selection ||
            columns.some(
              (column) => column.sorter || column.filterOptions?.length,
            )) && (
            <div className="flex flex-wrap items-center gap-2 border-b border-border p-2">
              {selection && selectAllCheckbox(true)}
              {(columns.some((column) => column.sorter) ||
                columns.some((column) => column.filterOptions?.length)) && (
                <div
                  role="group"
                  aria-label={`${caption}筛选和排序`}
                  className="flex min-w-0 gap-2 overflow-x-auto"
                >
                  {columns.flatMap((column) => [
                    column.sorter ? (
                      <span key={`${column.key}-sort`}>
                        {sortButton(column, true)}
                      </span>
                    ) : null,
                    column.filterOptions?.length ? (
                      <span key={`${column.key}-filter`}>
                        {filterButton(column, true)}
                      </span>
                    ) : null,
                  ])}
                </div>
              )}
            </div>
          )}
          <ul
            aria-label={caption}
            className="m-0 list-none divide-y divide-border p-0"
          >
            {displayedRows.length === 0 && (
              <li className="p-[var(--space-md)]">
                <div role="status">
                  <Empty
                    title={emptyTitle}
                    description="调整或清空筛选条件以查看数据。"
                  />
                </div>
              </li>
            )}
            {displayedRows.map((row) => (
              <li
                key={getRowKey(row)}
                className={cn(
                  'p-[var(--space-md)]',
                  selection && 'flex items-start gap-3',
                )}
              >
                {selection && rowCheckbox(row)}
                <div className="min-w-0 flex-1">{renderMobileRow(row)}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
