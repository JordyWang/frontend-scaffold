import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Key,
  type ReactNode,
  type UIEventHandler,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { Empty } from './empty'
import { ErrorState, LoadingState } from './feedback-state'

export type ListyProps<T> = {
  items: T[]
  getKey: (item: T, index: number) => Key
  renderItem: (item: T, index: number) => ReactNode
  itemHeight: number
  height: number | string
  overscan?: number
  endReachedThreshold?: number
  onEndReached?: () => void
  loading?: boolean
  error?: string
  onRetry?: () => void | Promise<void>
  emptyTitle?: string
  className?: string
  label?: string
  onScroll?: UIEventHandler<HTMLDivElement>
}

const listyStyles =
  'relative min-w-0 touch-pan-y overflow-y-auto overscroll-contain rounded-[var(--ui-card-radius)] border border-border bg-card text-card-foreground'

function ListyViewport<T>({
  items,
  getKey,
  renderItem,
  itemHeight,
  height,
  overscan = 3,
  endReachedThreshold = 160,
  onEndReached,
  className,
  label,
  onScroll,
}: ListyProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const [measuredHeight, setMeasuredHeight] = useState(
    typeof height === 'number' ? height : 0,
  )
  const listRef = useRef<HTMLDivElement>(null)
  const endReachedRef = useRef(false)
  const safeItemHeight =
    Number.isFinite(itemHeight) && itemHeight > 0 ? itemHeight : 1
  const safeOverscan = Math.max(0, Math.floor(overscan))
  const viewportHeight = typeof height === 'number' ? height : measuredHeight
  const totalHeight = items.length * safeItemHeight
  const maxScrollTop = Math.max(0, totalHeight - viewportHeight)
  const effectiveScrollTop = Math.min(scrollTop, maxScrollTop)
  const range = useMemo(() => {
    const first = Math.max(
      0,
      Math.floor(effectiveScrollTop / safeItemHeight) - safeOverscan,
    )
    const last = Math.min(
      items.length,
      Math.ceil((effectiveScrollTop + viewportHeight) / safeItemHeight) +
        safeOverscan,
    )
    return { first, last }
  }, [
    effectiveScrollTop,
    items.length,
    safeItemHeight,
    safeOverscan,
    viewportHeight,
  ])

  useLayoutEffect(() => {
    const element = listRef.current
    if (!element || element.scrollTop <= maxScrollTop) return
    element.scrollTop = maxScrollTop
    setScrollTop(maxScrollTop)
  }, [maxScrollTop])

  useLayoutEffect(() => {
    const element = listRef.current
    if (!element) return
    const measure = () => setMeasuredHeight(element.clientHeight)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [height])

  const handleScroll: UIEventHandler<HTMLDivElement> = (event) => {
    const nextScrollTop = event.currentTarget.scrollTop
    setMeasuredHeight(event.currentTarget.clientHeight)
    setScrollTop(nextScrollTop)
    onScroll?.(event)
    const remaining =
      totalHeight - nextScrollTop - event.currentTarget.clientHeight
    if (remaining <= endReachedThreshold) {
      if (!endReachedRef.current) {
        endReachedRef.current = true
        onEndReached?.()
      }
    } else {
      endReachedRef.current = false
    }
  }

  return (
    <div
      role="list"
      ref={listRef}
      aria-label={label}
      className={cn(listyStyles, className)}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div className="relative w-full" style={{ height: totalHeight }}>
        {items.slice(range.first, range.last).map((item, offset) => {
          const index = range.first + offset
          return (
            <div
              key={getKey(item, index)}
              role="listitem"
              className="absolute inset-x-0 flex min-h-0 items-stretch border-b border-border last:border-b-0"
              style={{ height: safeItemHeight, top: index * safeItemHeight }}
            >
              {renderItem(item, index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Fixed-height virtual list for dense data sets; the row renderer stays project-owned. */
export function Listy<T>(props: ListyProps<T>) {
  const {
    items,
    height,
    loading,
    error,
    onRetry,
    emptyTitle = '暂无内容',
    className,
    label,
  } = props

  if (loading || error || items.length === 0)
    return (
      <div
        role="list"
        aria-label={label}
        aria-busy={loading || undefined}
        className={cn(listyStyles, className)}
        style={{ height }}
      >
        <div className="p-4">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState description={error} onRetry={onRetry} />
          ) : (
            <div role="status">
              <Empty title={emptyTitle} />
            </div>
          )}
        </div>
      </div>
    )

  return <ListyViewport {...props} />
}
