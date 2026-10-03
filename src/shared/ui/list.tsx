import { useState, type CSSProperties, type Key, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import {
  resolveComponentSize,
  useConfig,
  type ControlSize,
} from './config-context'
import { Empty } from './empty'
import { ErrorState, LoadingState } from './feedback-state'
import { Pagination } from './pagination'

export type ListPart =
  'root' | 'header' | 'state' | 'list' | 'item' | 'footer' | 'pagination'
export type ListDisplayState = 'loading' | 'error' | 'empty' | 'ready'
export type ListSemanticInfo<T> = {
  props: ListProps<T>
  size: ControlSize
  state: ListDisplayState
}
export type ListClassNames<T> =
  | Partial<Record<ListPart, string>>
  | ((info: ListSemanticInfo<T>) => Partial<Record<ListPart, string>>)
export type ListStyles<T> =
  | Partial<Record<ListPart, CSSProperties>>
  | ((info: ListSemanticInfo<T>) => Partial<Record<ListPart, CSSProperties>>)

export type ListGrid = {
  /** Minimum item width in CSS pixels before the container wraps to fewer columns. */
  minItemWidth?: number
  /** Space between grid items in CSS pixels. */
  gap?: number
}

type ListPaginationBase = {
  onChange?: (page: number, pageSize: number) => void
  showSizeChanger?: boolean
  pageSizeOptions?: number[]
  showQuickJumper?: boolean
  showTotal?: boolean
}

export type ListPagination = ListPaginationBase &
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

export type ListProps<T> = {
  items: T[]
  getKey: (item: T) => Key
  renderItem: (item: T, index: number) => ReactNode
  header?: ReactNode | ((visibleItems: T[]) => ReactNode)
  footer?: ReactNode | ((visibleItems: T[]) => ReactNode)
  size?: ControlSize
  bordered?: boolean
  split?: boolean
  grid?: ListGrid
  pagination?: ListPagination | false
  loading?: boolean
  error?: string
  onRetry?: () => void | Promise<void>
  emptyTitle?: string
  className?: string
  style?: CSSProperties
  classNames?: ListClassNames<T>
  styles?: ListStyles<T>
  label?: string
}

const itemPadding = {
  small: 'p-3',
  default: 'p-4',
  large: 'p-6',
} satisfies Record<ControlSize, string>

export function List<T>(allProps: ListProps<T>) {
  const {
    items,
    getKey,
    renderItem,
    header,
    footer,
    size,
    bordered = true,
    split = true,
    grid,
    pagination,
    loading,
    error,
    onRetry,
    emptyTitle = '暂无内容',
    className,
    style,
    classNames,
    styles,
    label,
  } = allProps
  const { componentSize } = useConfig()
  const resolvedSize = resolveComponentSize(componentSize, size)
  const state: ListDisplayState = loading
    ? 'loading'
    : error
      ? 'error'
      : items.length === 0
        ? 'empty'
        : 'ready'
  const info: ListSemanticInfo<T> = {
    props: allProps,
    size: resolvedSize,
    state,
  }
  const slots = typeof classNames === 'function' ? classNames(info) : classNames
  const slotStyles = typeof styles === 'function' ? styles(info) : styles
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
  const requestedPageSize = paginationControlled
    ? paginationConfig?.pageSize
    : internalPageSize
  const pageSize = Number.isFinite(requestedPageSize)
    ? Math.max(1, Math.floor(requestedPageSize!))
    : 10
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const requestedPage = paginationControlled
    ? paginationConfig?.page
    : internalPage
  const page = Number.isFinite(requestedPage)
    ? Math.max(1, Math.min(Math.floor(requestedPage!), pageCount))
    : 1
  const pageStart = paginationConfig ? (page - 1) * pageSize : 0
  const visibleItems = paginationConfig
    ? items.slice(pageStart, pageStart + pageSize)
    : items
  const headerContent =
    typeof header === 'function' ? header(visibleItems) : header
  const footerContent =
    typeof footer === 'function' ? footer(visibleItems) : footer
  const minItemWidth =
    grid && Number.isFinite(grid.minItemWidth) && grid.minItemWidth! > 0
      ? grid.minItemWidth!
      : 220
  const gap =
    grid && Number.isFinite(grid.gap) && grid.gap! >= 0 ? grid.gap! : 12

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

  return (
    <section
      aria-label={label}
      aria-busy={loading || undefined}
      data-ui-list=""
      data-ui-list-state={state}
      data-ui-size={resolvedSize}
      data-ui-bordered={bordered}
      data-ui-split={split}
      className={cn(
        'min-w-0 overflow-hidden rounded-[var(--radius-lg)] bg-card text-card-foreground',
        bordered && 'border border-border',
        slots?.root,
        className,
      )}
      style={{ ...slotStyles?.root, ...style }}
    >
      {headerContent != null && headerContent !== false && (
        <div
          className={cn(
            'border-b border-border px-4 py-3 font-semibold',
            slots?.header,
          )}
          style={slotStyles?.header}
        >
          {headerContent}
        </div>
      )}
      {state !== 'ready' ? (
        <div
          role={state === 'empty' ? 'status' : undefined}
          className={cn('p-4', slots?.state)}
          style={slotStyles?.state}
        >
          {state === 'loading' ? (
            <LoadingState />
          ) : state === 'error' ? (
            <ErrorState description={error!} onRetry={onRetry} />
          ) : (
            <Empty title={emptyTitle} />
          )}
        </div>
      ) : (
        <ul
          aria-label={label}
          className={cn(
            'm-0 list-none p-0',
            grid ? 'grid' : split && 'divide-y divide-border',
            slots?.list,
          )}
          style={{
            ...slotStyles?.list,
            ...(grid && {
              gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minItemWidth}px), 1fr))`,
              gap,
            }),
          }}
        >
          {visibleItems.map((item, index) => (
            <li
              key={getKey(item)}
              className={cn(
                'min-w-0',
                itemPadding[resolvedSize],
                grid && 'rounded-[var(--radius-sm)] border border-border',
                slots?.item,
              )}
              style={slotStyles?.item}
            >
              {renderItem(item, pageStart + index)}
            </li>
          ))}
        </ul>
      )}
      {footerContent != null && footerContent !== false && (
        <div
          className={cn(
            'border-t border-border px-4 py-3 text-sm text-muted-foreground',
            slots?.footer,
          )}
          style={slotStyles?.footer}
        >
          {footerContent}
        </div>
      )}
      {paginationConfig && state === 'ready' && (
        <Pagination
          label={`${label ?? '列表'}分页`}
          page={page}
          pageSize={pageSize}
          total={items.length}
          onPageChange={changePage}
          onPageSizeChange={
            paginationConfig.showSizeChanger ? changePageSize : undefined
          }
          pageSizeOptions={paginationConfig.pageSizeOptions}
          showQuickJumper={paginationConfig.showQuickJumper}
          showTotal={paginationConfig.showTotal}
          className={cn('border-t border-border p-3', slots?.pagination)}
          style={slotStyles?.pagination}
        />
      )}
    </section>
  )
}
