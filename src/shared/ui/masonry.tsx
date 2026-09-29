import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl'

export type MasonryColumns =
  number | ({ base?: number } & Partial<Record<Breakpoint, number>>)

export type MasonryItem = {
  key: string
  content: ReactNode
  /** Zero-based column to keep an item in a specific lane. */
  column?: number
  /** Used only before the item's height can be measured. */
  estimatedHeight?: number
  className?: string
}

export type MasonryPlacement = { key: string; column: number }

export type MasonryProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  items: MasonryItem[]
  /** Breakpoints use the Masonry container width, not the viewport. */
  columns?: MasonryColumns
  /** Horizontal and vertical gaps in pixels. */
  gap?: number | [horizontal: number, vertical: number]
  onLayoutChange?: (placements: MasonryPlacement[]) => void
}

type Position = MasonryPlacement & {
  left: number
  top: number
  height: number
}

type Layout = {
  width: number
  columnWidth: number
  columns: number
  height: number
  positions: Position[]
}

const breakpointWidths: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
}
const defaultColumns: MasonryColumns = { base: 1, sm: 2, lg: 3 }

function positiveColumnCount(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value!)) : 1
}

function columnCount(columns: MasonryColumns, width: number): number {
  if (typeof columns === 'number') return positiveColumnCount(columns)
  let count = columns.base ?? 1
  for (const breakpoint of ['sm', 'md', 'lg', 'xl'] as const) {
    if (width >= breakpointWidths[breakpoint])
      count = columns[breakpoint] ?? count
  }
  return positiveColumnCount(count)
}

function nonnegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0
}

function sameLayout(previous: Layout | null, next: Layout): boolean {
  return (
    previous !== null &&
    previous.width === next.width &&
    previous.columnWidth === next.columnWidth &&
    previous.columns === next.columns &&
    previous.height === next.height &&
    previous.positions.length === next.positions.length &&
    previous.positions.every((position, index) => {
      const candidate = next.positions[index]
      return (
        position.key === candidate.key &&
        position.column === candidate.column &&
        position.left === candidate.left &&
        position.top === candidate.top &&
        position.height === candidate.height
      )
    })
  )
}

/** Places each card in the shortest column and remeasures when content changes. */
export const Masonry = forwardRef<HTMLDivElement, MasonryProps>(
  function Masonry(
    {
      items,
      columns = defaultColumns,
      gap = 12,
      onLayoutChange,
      className,
      style,
      role = 'list',
      ...props
    },
    forwardedRef,
  ) {
    const rootRef = useRef<HTMLDivElement | null>(null)
    const [layout, setLayout] = useState<Layout | null>(null)
    const lastAssignmentsRef = useRef('')
    const [horizontalGap, verticalGap] = Array.isArray(gap)
      ? [nonnegative(gap[0]), nonnegative(gap[1])]
      : [nonnegative(gap), nonnegative(gap)]

    useLayoutEffect(() => {
      const root = rootRef.current
      if (!root) return
      let frame = 0
      let observedWidth = -1

      const measure = () => {
        const width = root.getBoundingClientRect().width || root.clientWidth
        if (width <= 0) return
        const count = columnCount(columns, width)
        const columnWidth = Math.max(
          0,
          (width - horizontalGap * (count - 1)) / count,
        )
        const elements = Array.from(
          root.querySelectorAll<HTMLElement>('[data-masonry-item]'),
        )
        for (const element of elements) element.style.width = `${columnWidth}px`

        const heights = Array<number>(count).fill(0)
        const positions = items.map((item, index) => {
          const column =
            item.column !== undefined &&
            Number.isInteger(item.column) &&
            item.column >= 0 &&
            item.column < count
              ? item.column
              : heights.indexOf(Math.min(...heights))
          const measured = elements[index]?.getBoundingClientRect().height ?? 0
          const height = measured || nonnegative(item.estimatedHeight ?? 0)
          const position = {
            key: item.key,
            column,
            left: column * (columnWidth + horizontalGap),
            top: heights[column],
            height,
          }
          heights[column] += height + verticalGap
          return position
        })
        const next: Layout = {
          width,
          columnWidth,
          columns: count,
          height: items.length ? Math.max(...heights) - verticalGap : 0,
          positions,
        }
        setLayout((previous) => (sameLayout(previous, next) ? previous : next))
      }

      const schedule = () => {
        window.cancelAnimationFrame(frame)
        frame = window.requestAnimationFrame(measure)
      }
      measure()
      const ResizeObserverClass = window.ResizeObserver
      const itemObserver = ResizeObserverClass
        ? new ResizeObserverClass(schedule)
        : null
      const rootObserver = ResizeObserverClass
        ? new ResizeObserverClass((entries) => {
            const width = entries[0]?.contentRect.width
            if (width !== undefined && width !== observedWidth) {
              observedWidth = width
              schedule()
            }
          })
        : null
      rootObserver?.observe(root)
      for (const element of root.querySelectorAll('[data-masonry-item]'))
        itemObserver?.observe(element)
      root.addEventListener('load', schedule, true)
      window.addEventListener('resize', schedule)
      return () => {
        window.cancelAnimationFrame(frame)
        rootObserver?.disconnect()
        itemObserver?.disconnect()
        root.removeEventListener('load', schedule, true)
        window.removeEventListener('resize', schedule)
      }
    }, [items, columns, horizontalGap, verticalGap])

    useEffect(() => {
      if (!layout) return
      const assignments = layout.positions.map(({ key, column }) => ({
        key,
        column,
      }))
      const signature = JSON.stringify(assignments)
      if (signature === lastAssignmentsRef.current) return
      lastAssignmentsRef.current = signature
      onLayoutChange?.(assignments)
    }, [layout, onLayoutChange])

    const positions = new Map(layout?.positions.map((item) => [item.key, item]))
    return (
      <div
        {...props}
        role={role}
        ref={(node) => {
          rootRef.current = node
          if (typeof forwardedRef === 'function') forwardedRef(node)
          else if (forwardedRef) forwardedRef.current = node
        }}
        className={cn('relative w-full min-w-0', className)}
        style={{ ...style, height: layout?.height ?? undefined }}
      >
        {items.map((item) => {
          const position = positions.get(item.key)
          return (
            <div
              key={item.key}
              role="listitem"
              data-masonry-item=""
              data-column={position?.column}
              className={cn('absolute min-w-0', item.className)}
              style={
                {
                  top: position?.top ?? 0,
                  left: position?.left ?? 0,
                  width: layout?.columnWidth ?? '100%',
                  visibility: position ? 'visible' : 'hidden',
                } as CSSProperties
              }
            >
              {item.content}
            </div>
          )
        })}
      </div>
    )
  },
)
