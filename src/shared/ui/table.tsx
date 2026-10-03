import {
  Fragment,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Key,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { Checkbox, Radio } from './choice'
import {
  resolveComponentSize,
  useConfig,
  type ControlSize,
} from './config-context'
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
  hidden?: boolean
  /** Show this column when the Table container reaches this width in CSS pixels. */
  minContainerWidth?: number
  /** Use true when the owner sorts rows in manual data mode. */
  sorter?: ((left: T, right: T) => number) | true
  sortLabel?: string
  filterOptions?: TableFilterOption<T>[]
  filterLabel?: string
  /** Accessible label for this column in the H5 summary when header is rich content. */
  summaryLabel?: string
  align?: 'left' | 'center' | 'right'
  /** Render this data cell as a row header for assistive technology. */
  rowScope?: 'row' | 'rowgroup'
}

export type TableColumnGroup<T> = {
  key: string
  header: ReactNode
  children: TableColumnNode<T>[]
  hidden?: boolean
  /** Show this group and its descendants when the Table container reaches this width. */
  minContainerWidth?: number
  align?: 'left' | 'center' | 'right'
}

export type TableColumnNode<T> = TableColumn<T> | TableColumnGroup<T>

type ColumnLayoutNode<T> = {
  column: TableColumnNode<T>
  children?: ColumnLayoutNode<T>[]
  leafCount: number
  depth: number
}

type ColumnHeaderCell<T> = {
  column: TableColumnNode<T>
  group: boolean
  colSpan: number
  rowSpan: number
}

function isColumnGroup<T>(
  column: TableColumnNode<T>,
): column is TableColumnGroup<T> {
  return 'children' in column
}

function hasResponsiveColumns<T>(columns: TableColumnNode<T>[]): boolean {
  return columns.some(
    (column) =>
      column.minContainerWidth !== undefined ||
      (isColumnGroup(column) && hasResponsiveColumns(column.children)),
  )
}

function buildColumnLayout<T>(
  columns: TableColumnNode<T>[],
  containerWidth: number | null,
) {
  function build(column: TableColumnNode<T>): ColumnLayoutNode<T> | null {
    if (
      column.hidden ||
      (containerWidth !== null &&
        column.minContainerWidth !== undefined &&
        containerWidth < column.minContainerWidth)
    )
      return null
    if (!isColumnGroup(column)) return { column, leafCount: 1, depth: 1 }
    const children = column.children
      .map(build)
      .filter((child): child is ColumnLayoutNode<T> => child !== null)
    if (!children.length) return null
    return {
      column,
      children,
      leafCount: children.reduce((count, child) => count + child.leafCount, 0),
      depth: 1 + Math.max(...children.map((child) => child.depth)),
    }
  }

  const roots = columns
    .map(build)
    .filter((column): column is ColumnLayoutNode<T> => column !== null)
  const depth = Math.max(1, ...roots.map((root) => root.depth))
  const headerRows: ColumnHeaderCell<T>[][] = Array.from(
    { length: depth },
    () => [],
  )
  const leafColumns: TableColumn<T>[] = []
  const headerPaths = new Map<string, string[]>()
  function visit(
    nodes: ColumnLayoutNode<T>[],
    level: number,
    ancestors: string[],
  ) {
    nodes.forEach((node) => {
      const group = Boolean(node.children)
      headerRows[level].push({
        column: node.column,
        group,
        colSpan: node.leafCount,
        rowSpan: group ? 1 : depth - level,
      })
      if (node.children)
        visit(node.children, level + 1, [...ancestors, node.column.key])
      else {
        leafColumns.push(node.column as TableColumn<T>)
        headerPaths.set(node.column.key, [...ancestors, node.column.key])
      }
    })
  }
  visit(roots, 0, [])
  return { headerRows, leafColumns, headerPaths, depth }
}

export type TableSort = {
  columnKey: string
  direction: 'asc' | 'desc'
}

export type TableSelection<T> = {
  mode?: 'multiple' | 'single'
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

export type TablePagination = TablePaginationBase & { total?: never } & (
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

export type TableManualPagination = TablePaginationBase & {
  page: number
  pageSize: number
  total: number
  onChange: (page: number, pageSize: number) => void
  defaultPage?: never
  defaultPageSize?: never
}

export type TablePart =
  | 'root'
  | 'state'
  | 'selectionSummary'
  | 'title'
  | 'scrollRegion'
  | 'table'
  | 'header'
  | 'headerRow'
  | 'headerCell'
  | 'body'
  | 'summary'
  | 'summaryCell'
  | 'row'
  | 'cell'
  | 'expandedRow'
  | 'expandedCell'
  | 'mobile'
  | 'mobileToolbar'
  | 'mobileList'
  | 'mobileRow'
  | 'mobileDetail'
  | 'mobileSummary'
  | 'mobileSummaryItem'
  | 'footer'
  | 'pagination'

export type TableDisplayState =
  'loading' | 'error' | 'empty' | 'filtered-empty' | 'ready'

export type TableSemanticInfo<T> = {
  props: TableProps<T>
  size: ControlSize
  state: TableDisplayState
}
export type TableClassNames<T> =
  | Partial<Record<TablePart, string>>
  | ((info: TableSemanticInfo<T>) => Partial<Record<TablePart, string>>)
export type TableStyles<T> =
  | Partial<Record<TablePart, CSSProperties>>
  | ((info: TableSemanticInfo<T>) => Partial<Record<TablePart, CSSProperties>>)

function alignmentClassName(align?: TableColumn<unknown>['align']) {
  if (align === 'center') return 'text-center'
  if (align === 'left') return 'text-left'
  if (align === 'right') return 'text-right'
  return 'text-start'
}

type TableCommonProps<T> = {
  columns: TableColumnNode<T>[]
  rows: T[]
  getRowKey: (row: T) => Key
  caption: string
  title?: ReactNode | ((visibleRows: T[]) => ReactNode)
  footer?: ReactNode | ((visibleRows: T[]) => ReactNode)
  summary?: (visibleRows: T[]) => Partial<Record<string, ReactNode>>
  size?: ControlSize
  bordered?: boolean
  rowHoverable?: boolean
  loading?: boolean
  error?: string
  onRetry?: () => void | Promise<void>
  emptyTitle?: string
  renderMobileRow?: (row: T, context: TableMobileRowContext) => ReactNode
  sort?: TableSort | null
  defaultSort?: TableSort | null
  onSortChange?: (sort: TableSort | null) => void
  filters?: TableFilters
  defaultFilters?: TableFilters
  onFiltersChange?: (filters: TableFilters) => void
  selection?: TableSelection<T>
  expandable?: TableExpandable<T>
  className?: string
  style?: CSSProperties
  classNames?: TableClassNames<T>
  styles?: TableStyles<T>
  rowClassName?: (row: T, index: number) => string | undefined
}

export type TableMobileRowContext = {
  visibleColumnKeys: readonly string[]
  /** Measured outer width of the Table container; null before measurement. */
  containerWidth: number | null
}

export type TableProps<T> = TableCommonProps<T> &
  (
    | { dataMode?: 'local'; pagination?: TablePagination | false }
    | { dataMode: 'manual'; pagination?: TableManualPagination | false }
  )

export function Table<T>(allProps: TableProps<T>) {
  const radioGroupName = useId()
  const rootRef = useRef<HTMLElement>(null)
  const focusedBeforeResizeRef = useRef<HTMLElement | null>(null)
  const lastMeasuredWidthRef = useRef<number | null>(null)
  const [containerWidth, setContainerWidth] = useState<number | null>(null)
  const controlled = Object.prototype.hasOwnProperty.call(allProps, 'sort')
  const {
    columns,
    rows,
    getRowKey,
    caption,
    title,
    footer,
    summary,
    dataMode = 'local',
    size,
    bordered = false,
    rowHoverable = true,
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
    style,
    classNames,
    styles,
    rowClassName,
  } = allProps
  const responsiveColumns = hasResponsiveColumns(columns)
  const measureContainer = responsiveColumns || Boolean(renderMobileRow)
  useLayoutEffect(() => {
    if (!measureContainer) return
    const root = rootRef.current
    if (!root) return
    const measure = () => {
      const width = root.getBoundingClientRect().width
      if (
        width <= 0 ||
        !Number.isFinite(width) ||
        lastMeasuredWidthRef.current === width
      )
        return
      lastMeasuredWidthRef.current = width
      const active = document.activeElement
      focusedBeforeResizeRef.current =
        active instanceof HTMLElement && root.contains(active) ? active : null
      setContainerWidth(width)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    return () => observer.disconnect()
  }, [measureContainer])
  useLayoutEffect(() => {
    const focused = focusedBeforeResizeRef.current
    focusedBeforeResizeRef.current = null
    if (focused && !focused.isConnected) rootRef.current?.focus()
  }, [containerWidth])
  const {
    headerRows,
    leafColumns,
    headerPaths,
    depth: headerDepth,
  } = useMemo(
    () => buildColumnLayout(columns, containerWidth),
    [columns, containerWidth],
  )
  const mobileRowContext: TableMobileRowContext = {
    visibleColumnKeys: leafColumns.map((column) => column.key),
    containerWidth,
  }
  function headerId(key: string) {
    return `${radioGroupName}-column-${encodeURIComponent(key)}`
  }
  function cellHeaders(key: string) {
    return headerPaths.get(key)?.map(headerId).join(' ')
  }
  const { componentSize } = useConfig()
  const resolvedSize = resolveComponentSize(componentSize, size)
  const cellPadding = {
    small: 'px-3 py-2',
    default: 'px-4 py-3',
    large: 'px-6 py-4',
  }[resolvedSize]
  const sortHeaderPadding = {
    small: 'px-1 py-0',
    default: 'px-2 py-1',
    large: 'px-3 py-2',
  }[resolvedSize]
  const mobilePadding = {
    small: 'p-2',
    default: 'p-[var(--space-md)]',
    large: 'p-6',
  }[resolvedSize]
  const cellBorder = bordered && 'border border-border'
  const rowHover = rowHoverable ? 'hover:bg-accent/50' : undefined
  const tableAttributes = {
    'data-ui-table': '',
    'data-ui-size': resolvedSize,
    'data-ui-bordered': bordered,
    'data-ui-row-hoverable': rowHoverable,
    'data-ui-data-mode': dataMode,
  }
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
  const sortColumn = leafColumns.find(
    (column) => column.key === requestedSort?.columnKey && column.sorter,
  )
  const activeSort = sortColumn ? requestedSort : null
  const sorter = sortColumn?.sorter
  const [internalFilters, setInternalFilters] =
    useState<TableFilters>(defaultFilters)
  const activeFilters = filters ?? internalFilters
  const hasActiveFilters = leafColumns.some((column) =>
    Boolean(activeFilters[column.key]?.length),
  )
  const displayedRows = useMemo(() => {
    if (dataMode === 'manual') return rows
    const filteredRows = rows.filter((row) =>
      leafColumns.every((column) => {
        const values = activeFilters[column.key]
        if (!values?.length || !column.filterOptions) return true
        return values.some((value) =>
          column.filterOptions
            ?.find((option) => option.value === value)
            ?.matches?.(row),
        )
      }),
    )
    if (!activeSort || typeof sorter !== 'function') return filteredRows
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
  }, [activeFilters, activeSort, dataMode, leafColumns, rows, sorter])
  const requestedPageSize = paginationControlled
    ? paginationConfig?.pageSize
    : internalPageSize
  const pageSize = Number.isFinite(requestedPageSize)
    ? Math.max(1, Math.floor(requestedPageSize!))
    : 10
  const paginationTotal =
    dataMode === 'manual' && paginationConfig
      ? typeof paginationConfig.total === 'number' &&
        Number.isFinite(paginationConfig.total)
        ? Math.max(0, Math.floor(paginationConfig.total))
        : 0
      : displayedRows.length
  const pageCount = Math.max(1, Math.ceil(paginationTotal / pageSize))
  const requestedPage = paginationControlled
    ? paginationConfig?.page
    : internalPage
  const page = Number.isFinite(requestedPage)
    ? Math.max(1, Math.min(Math.floor(requestedPage!), pageCount))
    : 1
  const pageRows =
    paginationConfig && dataMode === 'local'
      ? displayedRows.slice((page - 1) * pageSize, page * pageSize)
      : displayedRows
  const pageStart = paginationConfig ? (page - 1) * pageSize : 0
  const displayState: TableDisplayState = loading
    ? 'loading'
    : error
      ? 'error'
      : displayedRows.length === 0
        ? hasActiveFilters
          ? 'filtered-empty'
          : 'empty'
        : 'ready'
  const rowClassNames =
    displayState === 'ready'
      ? pageRows.map((row, index) => rowClassName?.(row, pageStart + index))
      : []
  const semanticInfo: TableSemanticInfo<T> = {
    props: allProps,
    size: resolvedSize,
    state: displayState,
  }
  const semanticClassNames =
    typeof classNames === 'function' ? classNames(semanticInfo) : classNames
  const semanticStyles =
    typeof styles === 'function' ? styles(semanticInfo) : styles
  const titleContent = typeof title === 'function' ? title(pageRows) : title
  const footerContent = typeof footer === 'function' ? footer(pageRows) : footer
  const summaryValues =
    displayState === 'ready' || displayState === 'filtered-empty'
      ? summary?.(pageRows)
      : undefined
  const hasSummary =
    summaryValues !== undefined &&
    leafColumns.some((column) => summaryValues[column.key] != null)

  function tableTitle() {
    if (titleContent == null || titleContent === false) return null
    return (
      <div
        className={cn(
          'border-b border-border px-4 py-3 font-semibold',
          semanticClassNames?.title,
        )}
        style={semanticStyles?.title}
      >
        {titleContent}
      </div>
    )
  }

  function tableFooter() {
    if (footerContent == null || footerContent === false) return null
    return (
      <div
        className={cn(
          'border-t border-border px-4 py-3 text-sm text-muted-foreground',
          semanticClassNames?.footer,
        )}
        style={semanticStyles?.footer}
      >
        {footerContent}
      </div>
    )
  }

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
  const requestedSelectedKeys = [
    ...new Set(
      selectionControlled
        ? (selection?.selectedKeys ?? [])
        : internalSelectedKeys,
    ),
  ]
  const singleSelection = selection?.mode === 'single'
  const selectedKeys = singleSelection
    ? requestedSelectedKeys.slice(0, 1)
    : requestedSelectedKeys
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
    if (singleSelection) unique.splice(1)
    if (!selectionControlled) setInternalSelectedKeys(unique)
    const nextSet = new Set(unique)
    selection?.onChange?.(
      unique,
      rows.filter((row) => nextSet.has(getRowKey(row))),
    )
  }

  function toggleRow(key: Key) {
    if (singleSelection) {
      if (!selectedSet.has(key)) changeSelection([key])
      return
    }
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

  function rowSelector(row: T, mobile = false) {
    const key = getRowKey(row)
    const label = `选择${selection?.getLabel?.(row) ?? String(key)}`
    if (singleSelection)
      return (
        <Radio
          label={label}
          hideLabel
          name={`${radioGroupName}-${mobile ? 'mobile' : 'table'}`}
          checked={selectedSet.has(key)}
          disabled={selection?.disabled?.(row)}
          className="min-w-11 justify-center"
          onChange={() => toggleRow(key)}
        />
      )
    return (
      <Checkbox
        label={label}
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
      <tr
        key={`${String(getRowKey(row))}-expanded`}
        className={semanticClassNames?.expandedRow}
        style={semanticStyles?.expandedRow}
      >
        <td
          id={contentId}
          colSpan={colSpan}
          className={cn(
            'bg-muted/40',
            cellPadding,
            cellBorder,
            !bordered && 'border-b border-border',
            semanticClassNames?.expandedCell,
          )}
          style={semanticStyles?.expandedCell}
        >
          {expandable.expandedRowRender(row, index)}
        </td>
      </tr>
    )
  }

  const regionClassName = cn(
    'min-w-0 overflow-hidden rounded-[var(--radius)] border border-border bg-card text-card-foreground focus:outline-2 focus:outline-offset-[-2px] focus:outline-ring',
    semanticClassNames?.root,
    className,
  )
  const rootStyle = { ...semanticStyles?.root, ...style }
  const stateClassName = cn('p-[var(--space-lg)]', semanticClassNames?.state)
  const tableColSpan =
    leafColumns.length + (selection ? 1 : 0) + (expandable ? 1 : 0)

  if (loading)
    return (
      <section
        ref={rootRef}
        tabIndex={-1}
        {...tableAttributes}
        aria-busy="true"
        aria-label={caption}
        className={regionClassName}
        style={rootStyle}
      >
        {tableTitle()}
        <div className={stateClassName} style={semanticStyles?.state}>
          <LoadingState />
        </div>
        {tableFooter()}
      </section>
    )
  if (error)
    return (
      <section
        ref={rootRef}
        tabIndex={-1}
        {...tableAttributes}
        aria-label={caption}
        className={regionClassName}
        style={rootStyle}
      >
        {tableTitle()}
        <div className={stateClassName} style={semanticStyles?.state}>
          <ErrorState description={error} onRetry={onRetry} />
        </div>
        {tableFooter()}
      </section>
    )
  if (
    displayedRows.length === 0 &&
    !hasActiveFilters &&
    (dataMode === 'local' || paginationTotal === 0)
  )
    return (
      <section
        ref={rootRef}
        tabIndex={-1}
        {...tableAttributes}
        aria-label={caption}
        className={regionClassName}
        style={rootStyle}
      >
        {tableTitle()}
        <div
          role="status"
          className={stateClassName}
          style={semanticStyles?.state}
        >
          <Empty title={emptyTitle} />
        </div>
        {tableFooter()}
      </section>
    )

  return (
    <section
      ref={rootRef}
      tabIndex={-1}
      {...tableAttributes}
      aria-label={caption}
      className={regionClassName}
      style={rootStyle}
    >
      {tableTitle()}
      {selection && (
        <div
          aria-live="polite"
          className={cn(
            'border-b border-border px-4 py-2 text-sm text-muted-foreground',
            semanticClassNames?.selectionSummary,
          )}
          style={semanticStyles?.selectionSummary}
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
          semanticClassNames?.scrollRegion,
        )}
        style={semanticStyles?.scrollRegion}
      >
        <table
          className={cn(
            'min-w-full border-collapse text-start',
            semanticClassNames?.table,
          )}
          style={semanticStyles?.table}
        >
          <caption className="sr-only">{caption}</caption>
          <thead
            className={cn('bg-muted', semanticClassNames?.header)}
            style={semanticStyles?.header}
          >
            {headerRows.map((headerRow, level) => (
              <tr
                key={level}
                className={cn(
                  'border-b border-border',
                  semanticClassNames?.headerRow,
                )}
                style={semanticStyles?.headerRow}
              >
                {level === 0 && selection && (
                  <th
                    scope="col"
                    rowSpan={headerDepth}
                    className={cn(
                      'w-14 px-2 text-start',
                      cellBorder,
                      semanticClassNames?.headerCell,
                    )}
                    style={semanticStyles?.headerCell}
                  >
                    {singleSelection ? (
                      <span className="sr-only">选择一行</span>
                    ) : (
                      selectAllCheckbox()
                    )}
                  </th>
                )}
                {level === 0 && expandable && (
                  <th
                    scope="col"
                    rowSpan={headerDepth}
                    className={cn(
                      'w-14 px-2 text-start',
                      cellBorder,
                      semanticClassNames?.headerCell,
                    )}
                    style={semanticStyles?.headerCell}
                  >
                    <span className="sr-only">展开详情</span>
                  </th>
                )}
                {headerRow.map(({ column, group, colSpan, rowSpan }) => {
                  const leaf = group ? undefined : (column as TableColumn<T>)
                  return (
                    <th
                      key={column.key}
                      id={headerId(column.key)}
                      scope={group ? 'colgroup' : 'col'}
                      colSpan={group ? colSpan : undefined}
                      rowSpan={rowSpan > 1 ? rowSpan : undefined}
                      aria-sort={
                        leaf?.sorter
                          ? activeSort?.columnKey === leaf.key
                            ? activeSort.direction === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : 'none'
                          : undefined
                      }
                      className={cn(
                        'text-sm font-semibold',
                        leaf?.sorter ? sortHeaderPadding : cellPadding,
                        cellBorder,
                        alignmentClassName(column.align),
                        semanticClassNames?.headerCell,
                      )}
                      style={semanticStyles?.headerCell}
                    >
                      {leaf ? (
                        <span className="inline-flex items-center gap-1">
                          {leaf.sorter ? sortButton(leaf) : leaf.header}
                          {filterButton(leaf)}
                        </span>
                      ) : (
                        column.header
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody
            className={cn(
              !bordered && 'divide-y divide-border',
              semanticClassNames?.body,
            )}
            style={semanticStyles?.body}
          >
            {displayedRows.length === 0 && (
              <tr>
                <td
                  colSpan={Math.max(1, tableColSpan)}
                  className={cn(
                    'p-[var(--space-lg)]',
                    cellBorder,
                    semanticClassNames?.cell,
                  )}
                  style={semanticStyles?.cell}
                >
                  <div
                    role="status"
                    className={semanticClassNames?.state}
                    style={semanticStyles?.state}
                  >
                    <Empty
                      title={emptyTitle}
                      description={
                        hasActiveFilters
                          ? '调整或清空筛选条件以查看数据。'
                          : '当前页暂无数据，请切换页码。'
                      }
                    />
                  </div>
                </td>
              </tr>
            )}
            {pageRows.map((row, index) => (
              <Fragment key={getRowKey(row)}>
                <tr
                  aria-selected={
                    selection ? selectedSet.has(getRowKey(row)) : undefined
                  }
                  className={cn(
                    selection && selectedSet.has(getRowKey(row)) && rowHoverable
                      ? 'hover:bg-primary/15'
                      : rowHover,
                    selection &&
                      selectedSet.has(getRowKey(row)) &&
                      'bg-primary/10',
                    semanticClassNames?.row,
                    rowClassNames[index],
                  )}
                  style={semanticStyles?.row}
                >
                  {selection && (
                    <td
                      className={cn(
                        'w-14 px-2',
                        cellBorder,
                        semanticClassNames?.cell,
                      )}
                      style={semanticStyles?.cell}
                    >
                      {rowSelector(row)}
                    </td>
                  )}
                  {expandable && (
                    <td
                      className={cn(
                        'w-14 px-2',
                        cellBorder,
                        semanticClassNames?.cell,
                      )}
                      style={semanticStyles?.cell}
                    >
                      {expandButton(row)}
                    </td>
                  )}
                  {leafColumns.map((column) =>
                    column.rowScope ? (
                      <th
                        key={column.key}
                        headers={cellHeaders(column.key)}
                        scope={column.rowScope}
                        className={cn(
                          'align-middle font-medium',
                          cellPadding,
                          cellBorder,
                          alignmentClassName(column.align),
                          semanticClassNames?.cell,
                        )}
                        style={semanticStyles?.cell}
                      >
                        {column.render(row)}
                      </th>
                    ) : (
                      <td
                        key={column.key}
                        headers={cellHeaders(column.key)}
                        className={cn(
                          'align-middle',
                          cellPadding,
                          cellBorder,
                          alignmentClassName(column.align),
                          semanticClassNames?.cell,
                        )}
                        style={semanticStyles?.cell}
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
          {hasSummary && (
            <tfoot
              className={cn(
                'border-t border-border bg-muted/40',
                semanticClassNames?.summary,
              )}
              style={semanticStyles?.summary}
            >
              <tr>
                {selection && (
                  <td
                    className={cn(cellBorder, semanticClassNames?.summaryCell)}
                    style={semanticStyles?.summaryCell}
                  />
                )}
                {expandable && (
                  <td
                    className={cn(cellBorder, semanticClassNames?.summaryCell)}
                    style={semanticStyles?.summaryCell}
                  />
                )}
                {leafColumns.map((column) => (
                  <td
                    key={column.key}
                    headers={cellHeaders(column.key)}
                    className={cn(
                      'font-medium',
                      cellPadding,
                      cellBorder,
                      alignmentClassName(column.align),
                      semanticClassNames?.summaryCell,
                    )}
                    style={semanticStyles?.summaryCell}
                  >
                    {summaryValues?.[column.key]}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {renderMobileRow && (
        <div
          className={cn('sm:hidden', semanticClassNames?.mobile)}
          style={semanticStyles?.mobile}
        >
          {((selection && !singleSelection) ||
            leafColumns.some(
              (column) => column.sorter || column.filterOptions?.length,
            )) && (
            <div
              className={cn(
                'flex flex-wrap items-center gap-2 border-b border-border p-2',
                semanticClassNames?.mobileToolbar,
              )}
              style={semanticStyles?.mobileToolbar}
            >
              {selection && !singleSelection && selectAllCheckbox(true)}
              {(leafColumns.some((column) => column.sorter) ||
                leafColumns.some((column) => column.filterOptions?.length)) && (
                <div
                  role="group"
                  aria-label={`${caption}筛选和排序`}
                  className="flex min-w-0 gap-2 overflow-x-auto"
                >
                  {leafColumns.flatMap((column) => [
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
            className={cn(
              'm-0 list-none p-0',
              bordered ? 'grid gap-2 p-2' : 'divide-y divide-border',
              semanticClassNames?.mobileList,
            )}
            style={semanticStyles?.mobileList}
          >
            {displayedRows.length === 0 && (
              <li
                className={cn(
                  mobilePadding,
                  bordered && 'rounded-[var(--radius-sm)] border border-border',
                  semanticClassNames?.mobileRow,
                )}
                style={semanticStyles?.mobileRow}
              >
                <div
                  role="status"
                  className={semanticClassNames?.state}
                  style={semanticStyles?.state}
                >
                  <Empty
                    title={emptyTitle}
                    description={
                      hasActiveFilters
                        ? '调整或清空筛选条件以查看数据。'
                        : '当前页暂无数据，请切换页码。'
                    }
                  />
                </div>
              </li>
            )}
            {pageRows.map((row, index) => (
              <li
                key={getRowKey(row)}
                data-ui-selected={
                  (selection && selectedSet.has(getRowKey(row))) || undefined
                }
                className={cn(
                  mobilePadding,
                  bordered && 'rounded-[var(--radius-sm)] border border-border',
                  selection && selectedSet.has(getRowKey(row)) && rowHoverable
                    ? 'hover:bg-primary/15'
                    : rowHover,
                  selection &&
                    selectedSet.has(getRowKey(row)) &&
                    'bg-primary/10',
                  selection && 'flex items-start gap-3',
                  semanticClassNames?.mobileRow,
                  rowClassNames[index],
                )}
                style={semanticStyles?.mobileRow}
              >
                {selection && rowSelector(row, true)}
                {expandable && (
                  <div className="shrink-0">{expandButton(row, true)}</div>
                )}
                <div className="min-w-0 flex-1">
                  {renderMobileRow(row, mobileRowContext)}
                  {expandable && expandedSet.has(getRowKey(row)) && (
                    <div
                      id={detailId(getRowKey(row), 'mobile')}
                      className={cn(
                        'mt-3 rounded-[var(--radius-sm)] bg-muted/40 p-3',
                        semanticClassNames?.mobileDetail,
                      )}
                      style={semanticStyles?.mobileDetail}
                    >
                      {expandable.expandedRowRender(row, pageStart + index)}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {hasSummary && (
            <div
              role="group"
              aria-label={`${caption}汇总`}
              className={cn(
                'border-t border-border bg-muted/40',
                mobilePadding,
                semanticClassNames?.mobileSummary,
              )}
              style={semanticStyles?.mobileSummary}
            >
              <dl className="m-0 grid gap-2">
                {leafColumns
                  .filter((column) => summaryValues?.[column.key] != null)
                  .map((column) => (
                    <div
                      key={column.key}
                      className={cn(
                        'flex min-w-0 items-start justify-between gap-3',
                        semanticClassNames?.mobileSummaryItem,
                      )}
                      style={semanticStyles?.mobileSummaryItem}
                    >
                      <dt className="text-sm text-muted-foreground">
                        {column.summaryLabel ??
                          (typeof column.header === 'string'
                            ? column.header
                            : column.key)}
                      </dt>
                      <dd className="m-0 min-w-0 text-end font-medium [overflow-wrap:anywhere]">
                        {summaryValues?.[column.key]}
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>
          )}
        </div>
      )}
      {tableFooter()}
      {paginationConfig && (
        <Pagination
          label={`${caption}分页`}
          page={page}
          pageSize={pageSize}
          total={paginationTotal}
          onPageChange={changePage}
          onPageSizeChange={
            paginationConfig.showSizeChanger ? changePageSize : undefined
          }
          pageSizeOptions={paginationConfig.pageSizeOptions}
          showQuickJumper={paginationConfig.showQuickJumper}
          showTotal={paginationConfig.showTotal}
          className={cn(
            'border-t border-border p-3',
            semanticClassNames?.pagination,
          )}
          style={semanticStyles?.pagination}
        />
      )}
    </section>
  )
}
