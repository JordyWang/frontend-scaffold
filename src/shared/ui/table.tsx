import { Fragment, useMemo, useState, type Key, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { Checkbox } from './choice'
import { Empty } from './empty'
import { ErrorState, LoadingState } from './feedback-state'
import { scrollHorizontalRegion } from './horizontal-scroll'
import { Pagination } from './pagination'
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

/** Project-owned expandable row contract for detail content below a record. */
export type TableExpandable<T> = {
  expandedRowKeys?: Key[]
  defaultExpandedRowKeys?: Key[]
  onExpandedRowsChange?: (expandedKeys: Key[], expandedRows: T[]) => void
  expandedRowRender: (row: T, index: number) => ReactNode
  rowExpandable?: (row: T) => boolean
  getLabel?: (row: T) => string
}

type TablePaginationBase = {
  onChange?: (page: number, pageSize: number) => void
  showSizeChanger?: boolean
  pageSizeOptions?: number[]
  showQuickJumper?: boolean
  showTotal?: boolean
}

export type TablePagination = TablePaginationBase &
  (
    | {
        page: number
        pageSize: number
        defaultPage?: never
        defaultPageSize?: never
      }
    | {
        page?: never
        pageSize?: never
        defaultPage?: number
        defaultPageSize?: number
      }
  )

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
  expandable?: TableExpandable<T>
  pagination?: TablePagination | false
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
    expandable,
    pagination,
    className,
  } = allProps
  const paginationConfig = pagination === false ? undefined : pagination
  const paginationControlled =
    paginationConfig?.page !== undefined &&
    paginationConfig.pageSize !== undefined
  const [internalPage, setInternalPage] = useState(
    paginationConfig?.defaultPage ?? 1,
  )
  const [internalPageSize, setInternalPageSize] = useState(
    paginationConfig?.defaultPageSize ?? 10,
  )
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
  const requestedPageSize = paginationControlled
    ? paginationConfig?.pageSize
    : internalPageSize
  const pageSize = Number.isFinite(requestedPageSize)
    ? Math.max(1, Math.floor(requestedPageSize!))
    : 10
  const pageCount = Math.max(1, Math.ceil(displayedRows.length / pageSize))
  const requestedPage = paginationControlled
    ? paginationConfig?.page
    : internalPage
  const page = Number.isFinite(requestedPage)
    ? Math.max(1, Math.min(Math.floor(requestedPage!), pageCount))
    : 1
  const pageRows = paginationConfig
    ? displayedRows.slice((page - 1) * pageSize, page * pageSize)
    : displayedRows
  const pageStart = paginationConfig ? (page - 1) * pageSize : 0

  function resetPage() {
    if (!paginationConfig || page === 1) return
    if (!paginationControlled) setInternalPage(1)
    paginationConfig.onChange?.(1, pageSize)
  }

  function changePage(next: number) {
    if (!paginationConfig) return
    if (!paginationControlled) setInternalPage(next)
    paginationConfig.onChange?.(next, pageSize)
  }

  function changePageSize(nextSize: number, nextPage: number) {
    if (!paginationConfig) return
    if (!paginationControlled) {
      setInternalPageSize(nextSize)
      setInternalPage(nextPage)
    }
    paginationConfig.onChange?.(nextPage, nextSize)
  }
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
  const expandedControlled = expandable
    ? Object.prototype.hasOwnProperty.call(expandable, 'expandedRowKeys')
    : false
  const [internalExpandedKeys, setInternalExpandedKeys] = useState<Key[]>(
    expandable?.defaultExpandedRowKeys ?? [],
  )
  const expandedKeys = [
    ...new Set(
      expandedControlled
        ? (expandable?.expandedRowKeys ?? [])
        : internalExpandedKeys,
    ),
  ]
  const expandedSet = new Set(expandedKeys)
  function detailId(key: Key, viewport: 'table' | 'mobile') {
    return `table-${encodeURIComponent(caption)}-${encodeURIComponent(String(key))}-details-${viewport}`
  }
  const selectedSet = new Set(selectedKeys)
  const enabledKeys = selection
    ? pageRows
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
    resetPage()
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

  function isRowExpandable(row: T) {
    return expandable ? (expandable.rowExpandable?.(row) ?? true) : false
  }

  function toggleExpanded(row: T) {
    if (!expandable || !isRowExpandable(row)) return
    const key = getRowKey(row)
    const next = expandedSet.has(key)
      ? expandedKeys.filter((expandedKey) => expandedKey !== key)
      : [...expandedKeys, key]
    if (!expandedControlled) setInternalExpandedKeys(next)
    const nextSet = new Set(next)
    expandable.onExpandedRowsChange?.(
      next,
      rows.filter((candidate) => nextSet.has(getRowKey(candidate))),
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
    resetPage()
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

  function expandButton(row: T, mobile = false) {
    if (!expandable || !isRowExpandable(row)) return null
    const key = getRowKey(row)
    const open = expandedSet.has(key)
    const label = expandable.getLabel?.(row) ?? String(key)
    const contentId = detailId(key, mobile ? 'mobile' : 'table')
    return (
      <button
        type="button"
        aria-label={`${open ? '收起' : '展开'}${label}`}
        aria-expanded={open}
        aria-controls={open ? contentId : undefined}
        className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-[var(--radius-sm)] text-lg text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
        onClick={() => toggleExpanded(row)}
      >
        <span aria-hidden="true">{open ? '⌄' : '›'}</span>
      </button>
    )
  }

  function expandedRow(row: T, index: number, colSpan: number) {
    if (!expandable || !expandedSet.has(getRowKey(row))) return null
    const contentId = detailId(getRowKey(row), 'table')
    return (
      <tr key={`${String(getRowKey(row))}-expanded`}>
        <td
          id={contentId}
          colSpan={colSpan}
          className="border-b border-border bg-muted/40 px-4 py-3"
        >
          {expandable.expandedRowRender(row, index)}
        </td>
      </tr>
    )
  }

  const regionClassName = cn(
    'overflow-hidden rounded-[var(--radius)] border border-border bg-card text-card-foreground',
    className,
  )
  const stateClassName = 'p-[var(--space-lg)]'
  const tableColSpan =
    columns.length + (selection ? 1 : 0) + (expandable ? 1 : 0)

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
        role="region"
        aria-label={`${caption}横向滚动`}
        tabIndex={0}
        onKeyDown={scrollHorizontalRegion}
        className={cn(
          'overflow-x-auto overscroll-x-contain focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring [scrollbar-width:thin]',
          renderMobileRow && 'hidden sm:block',
        )}
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
              {expandable && (
                <th scope="col" className="w-14 px-2 text-start">
                  <span className="sr-only">展开详情</span>
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
                  colSpan={Math.max(1, tableColSpan)}
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
            {pageRows.map((row, index) => (
              <Fragment key={getRowKey(row)}>
                <tr>
                  {selection && (
                    <td className="w-14 px-2">{rowCheckbox(row)}</td>
                  )}
                  {expandable && (
                    <td className="w-14 px-2">{expandButton(row)}</td>
                  )}
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
                {expandedRow(row, pageStart + index, tableColSpan)}
              </Fragment>
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
            {pageRows.map((row, index) => (
              <li
                key={getRowKey(row)}
                className={cn(
                  'p-[var(--space-md)]',
                  selection && 'flex items-start gap-3',
                )}
              >
                {selection && rowCheckbox(row)}
                {expandable && (
                  <div className="shrink-0">{expandButton(row, true)}</div>
                )}
                <div className="min-w-0 flex-1">
                  {renderMobileRow(row)}
                  {expandable && expandedSet.has(getRowKey(row)) && (
                    <div
                      id={detailId(getRowKey(row), 'mobile')}
                      className="mt-3 rounded-[var(--radius-sm)] bg-muted/40 p-3"
                    >
                      {expandable.expandedRowRender(row, pageStart + index)}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {paginationConfig && (
        <Pagination
          label={`${caption}分页`}
          page={page}
          pageSize={pageSize}
          total={displayedRows.length}
          onPageChange={changePage}
          onPageSizeChange={
            paginationConfig.showSizeChanger ? changePageSize : undefined
          }
          pageSizeOptions={paginationConfig.pageSizeOptions}
          showQuickJumper={paginationConfig.showQuickJumper}
          showTotal={paginationConfig.showTotal}
          className="border-t border-border p-3"
        />
      )}
    </section>
  )
}
