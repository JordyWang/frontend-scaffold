import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { useConfig } from './config-context'
import { Empty } from './empty'
import { spinnerIndicatorStyles } from './tailwind-styles'

export type TimelineMode = 'start' | 'end' | 'alternate'
export type TimelinePlacement = 'start' | 'end'
export type TimelineOrientation = 'vertical' | 'horizontal'
export type TimelineLabelWidth = number | `${number}px` | `${number}%`
type TimelinePart =
  'item' | 'marker' | 'dot' | 'rail' | 'label' | 'title' | 'content'
export type TimelineItem = {
  key?: string
  title?: ReactNode
  children: ReactNode
  label?: ReactNode
  color?: 'primary' | 'success' | 'warning' | 'error' | 'gray'
  dot?: ReactNode
  loading?: boolean
  statusText?: string
  placement?: TimelinePlacement
  className?: string
  classNames?: Partial<Record<TimelinePart, string>>
}
export type TimelineProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'dir'
> & {
  items: TimelineItem[]
  mode?: TimelineMode
  orientation?: TimelineOrientation
  reverse?: boolean
  variant?: 'outlined' | 'filled'
  labelWidth?: TimelineLabelWidth
  label?: string
  emptyText?: string
  dir?: 'ltr' | 'rtl'
  classNames?: Partial<Record<'root' | 'list' | TimelinePart, string>>
}

const colors = {
  primary: 'text-primary',
  success: 'text-[var(--ui-color-success)]',
  warning: 'text-[var(--ui-color-warning)]',
  error: 'text-[var(--ui-color-error)]',
  gray: 'text-muted-foreground',
}
const statusTexts = {
  primary: '',
  success: '成功',
  warning: '警告',
  error: '错误',
  gray: '未激活',
}
const wideMarker =
  '@min-[640px]/timeline:col-start-2 @min-[640px]/timeline:row-span-1'
const narrowGrid = 'grid-cols-[1.5rem_minmax(0,1fr)]'
const balancedGrid =
  '@min-[640px]/timeline:grid-cols-[minmax(0,1fr)_1.5rem_minmax(0,1fr)]'
const labelStartGrid =
  '@min-[640px]/timeline:grid-cols-[minmax(0,clamp(5rem,var(--timeline-label-width),40%))_1.5rem_minmax(0,1fr)]'
const labelEndGrid =
  '@min-[640px]/timeline:grid-cols-[minmax(0,1fr)_1.5rem_minmax(0,clamp(5rem,var(--timeline-label-width),40%))]'
const horizontalMarker =
  '@min-[640px]/timeline:col-start-1 @min-[640px]/timeline:row-start-2 @min-[640px]/timeline:row-span-1 @min-[640px]/timeline:h-6 @min-[640px]/timeline:justify-start'

function normalizeLabelWidth(width: TimelineLabelWidth) {
  if (typeof width === 'number')
    return Number.isFinite(width) ? `${Math.max(0, width)}px` : '28%'
  return /^\d+(?:\.\d+)?(?:px|%)$/.test(width) ? width : '28%'
}

/** A single native reading order shared by vertical, alternate and horizontal layouts. */
export function Timeline({
  items,
  mode = 'start',
  orientation = 'vertical',
  reverse = false,
  variant = 'outlined',
  labelWidth = '28%',
  label = '时间轴',
  emptyText = '暂无记录',
  dir,
  classNames,
  className,
  style,
  onFocusCapture,
  onBlurCapture,
  ...props
}: TimelineProps) {
  const config = useConfig()
  const direction = dir ?? config.direction
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const focusedRef = useRef<HTMLElement | null>(null)
  const [scrollable, setScrollable] = useState(false)
  const hintId = useId()
  const displayItems = reverse ? [...items].reverse() : items
  const hasLabels = items.some(
    (item) =>
      item.label !== undefined && item.label !== null && item.label !== false,
  )
  const balanced =
    mode === 'alternate' ||
    items.some((item) => item.placement && item.placement !== mode)
  const horizontal = orientation === 'horizontal'
  const grid = horizontal
    ? narrowGrid
    : cn(
        narrowGrid,
        balanced
          ? balancedGrid
          : hasLabels
            ? mode === 'end'
              ? labelEndGrid
              : labelStartGrid
            : mode === 'end'
              ? '@min-[640px]/timeline:grid-cols-[minmax(0,1fr)_1.5rem]'
              : '',
      )

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const measure = () => setScrollable(list.scrollWidth > list.clientWidth + 1)
    measure()
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(list)
    if (rootRef.current) observer?.observe(rootRef.current)
    window.addEventListener('resize', measure)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [items.length, orientation])

  useLayoutEffect(() => {
    const node = focusedRef.current
    if (!node || !rootRef.current) return
    if (
      document.activeElement !== node &&
      document.activeElement !== document.body
    ) {
      focusedRef.current = null
      return
    }
    if (
      !node.isConnected ||
      node.closest('[hidden], [inert]') ||
      ('disabled' in node && !!node.disabled)
    ) {
      const action = [
        ...rootRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled)',
        ),
      ].find((element) => !element.closest('[hidden], [inert]'))
      ;(action ?? rootRef.current).focus({ preventScroll: true })
    }
  })

  return (
    <div
      {...props}
      ref={rootRef}
      role={props.role ?? 'group'}
      aria-label={props['aria-label'] ?? label}
      tabIndex={props.tabIndex ?? -1}
      dir={direction}
      data-ui-timeline=""
      data-ui-mode={mode}
      data-ui-orientation={orientation}
      data-ui-variant={variant}
      className={cn(
        '@container/timeline min-w-0 text-foreground focus-visible:outline-2 focus-visible:outline-ring',
        classNames?.root,
        className,
      )}
      style={
        {
          '--timeline-label-width': normalizeLabelWidth(labelWidth),
          ...style,
        } as CSSProperties
      }
      onFocusCapture={(event) => {
        focusedRef.current = event.target
        onFocusCapture?.(event)
      }}
      onBlurCapture={(event) => {
        if (
          event.relatedTarget instanceof Node &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          focusedRef.current = null
        onBlurCapture?.(event)
      }}
    >
      {items.length === 0 ? (
        <Empty title={emptyText} size="small" />
      ) : (
        <>
          <ol
            ref={listRef}
            role="list"
            reversed={reverse || undefined}
            aria-label={`${label}记录`}
            aria-describedby={scrollable ? hintId : undefined}
            tabIndex={scrollable ? 0 : undefined}
            data-ui-timeline-list=""
            onKeyDown={(event) => {
              if (
                !scrollable ||
                event.target !== event.currentTarget ||
                event.altKey ||
                event.ctrlKey ||
                event.metaKey ||
                event.shiftKey ||
                event.defaultPrevented
              )
                return
              const list = event.currentTarget
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault()
                list.scrollBy({
                  left:
                    Math.max(48, list.clientWidth / 3) *
                    (event.key === 'ArrowLeft' ? -1 : 1),
                  behavior: 'auto',
                })
              } else if (event.key === 'Home' || event.key === 'End') {
                event.preventDefault()
                list.scrollTo({
                  left:
                    event.key === 'Home'
                      ? 0
                      : list.scrollWidth * (direction === 'rtl' ? -1 : 1),
                  behavior: 'auto',
                })
              }
            }}
            className={cn(
              'm-0 min-w-0 list-none p-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring',
              horizontal &&
                '@min-[640px]/timeline:grid @min-[640px]/timeline:grid-flow-col @min-[640px]/timeline:auto-cols-[minmax(12rem,1fr)] @min-[640px]/timeline:grid-rows-[auto_1.5rem_auto] @min-[640px]/timeline:overflow-x-auto @min-[640px]/timeline:pb-3',
              classNames?.list,
            )}
          >
            {displayItems.map((item, index) => {
              const placement =
                item.placement ??
                (mode === 'end' || (mode === 'alternate' && index % 2 === 1)
                  ? 'end'
                  : 'start')
              const hasLabel =
                item.label !== undefined &&
                item.label !== null &&
                item.label !== false
              const customDot =
                item.dot !== undefined &&
                item.dot !== null &&
                item.dot !== false
              const color = item.color ?? 'primary'
              const text =
                item.statusText ??
                (item.loading ? '进行中' : statusTexts[color])
              const contentPosition = horizontal
                ? placement === 'end'
                  ? '@min-[640px]/timeline:col-start-1 @min-[640px]/timeline:row-start-1 @min-[640px]/timeline:pb-3'
                  : '@min-[640px]/timeline:col-start-1 @min-[640px]/timeline:row-start-3 @min-[640px]/timeline:pt-3'
                : balanced || hasLabels
                  ? placement === 'end'
                    ? '@min-[640px]/timeline:col-start-1 @min-[640px]/timeline:row-start-1 @min-[640px]/timeline:text-end'
                    : '@min-[640px]/timeline:col-start-3 @min-[640px]/timeline:row-start-1'
                  : placement === 'end'
                    ? '@min-[640px]/timeline:col-start-1 @min-[640px]/timeline:row-start-1 @min-[640px]/timeline:text-end'
                    : ''
              const labelPosition = horizontal
                ? placement === 'end'
                  ? '@min-[640px]/timeline:col-start-1 @min-[640px]/timeline:row-start-3 @min-[640px]/timeline:pt-3'
                  : '@min-[640px]/timeline:col-start-1 @min-[640px]/timeline:row-start-1 @min-[640px]/timeline:pb-3'
                : placement === 'end'
                  ? '@min-[640px]/timeline:col-start-3 @min-[640px]/timeline:row-start-1'
                  : '@min-[640px]/timeline:col-start-1 @min-[640px]/timeline:row-start-1 @min-[640px]/timeline:text-end'
              return (
                <li
                  key={
                    item.key ??
                    String(reverse ? items.length - index - 1 : index)
                  }
                  aria-busy={item.loading || undefined}
                  data-ui-timeline-item=""
                  data-ui-placement={placement}
                  className={cn(
                    'relative grid min-h-16 gap-x-3 pb-6 last:pb-0',
                    grid,
                    horizontal &&
                      '@min-[640px]/timeline:row-span-3 @min-[640px]/timeline:grid-cols-1 @min-[640px]/timeline:grid-rows-subgrid @min-[640px]/timeline:gap-x-0 @min-[640px]/timeline:pb-0',
                    classNames?.item,
                    item.className,
                    item.classNames?.item,
                  )}
                >
                  <span
                    aria-hidden="true"
                    data-ui-timeline-marker=""
                    className={cn(
                      'relative col-start-1 row-start-1 row-span-2 flex h-full min-w-0 justify-center',
                      horizontal
                        ? horizontalMarker
                        : (balanced || hasLabels || mode === 'end') &&
                            wideMarker,
                      classNames?.marker,
                      item.classNames?.marker,
                    )}
                  >
                    {index < displayItems.length - 1 && (
                      <span
                        data-ui-timeline-rail=""
                        className={cn(
                          'absolute start-1/2 top-3 -bottom-9 border-s border-border',
                          (item.loading || displayItems[index + 1]?.loading) &&
                            'border-dashed',
                          horizontal &&
                            '@min-[640px]/timeline:start-3 @min-[640px]/timeline:-end-3 @min-[640px]/timeline:bottom-auto @min-[640px]/timeline:border-s-0 @min-[640px]/timeline:border-t',
                          classNames?.rail,
                          item.classNames?.rail,
                        )}
                      />
                    )}
                    <span
                      data-ui-timeline-dot=""
                      className={cn(
                        'relative z-[1] inline-grid size-6 shrink-0 place-items-center',
                        (customDot || item.loading) && 'bg-card',
                        colors[color],
                        classNames?.dot,
                        item.classNames?.dot,
                      )}
                    >
                      {customDot ? (
                        item.dot
                      ) : item.loading ? (
                        <span
                          data-ui-timeline-loading-indicator=""
                          className={cn(
                            spinnerIndicatorStyles,
                            'size-4 border-2',
                          )}
                        />
                      ) : (
                        <span
                          className={cn(
                            'size-3.5 rounded-full border-2 border-current',
                            variant === 'filled' ? 'bg-current' : 'bg-card',
                          )}
                        />
                      )}
                    </span>
                  </span>
                  {hasLabel && (
                    <div
                      data-ui-timeline-label=""
                      className={cn(
                        'col-start-2 row-start-1 min-w-0 text-start text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]',
                        labelPosition,
                        horizontal && '@min-[640px]/timeline:pe-6',
                        classNames?.label,
                        item.classNames?.label,
                      )}
                    >
                      {item.label}
                    </div>
                  )}
                  <div
                    data-ui-timeline-content=""
                    className={cn(
                      'col-start-2 min-w-0 text-start leading-6 [overflow-wrap:anywhere]',
                      hasLabel ? 'row-start-2' : 'row-start-1',
                      contentPosition,
                      horizontal && '@min-[640px]/timeline:pe-6',
                      classNames?.content,
                      item.classNames?.content,
                    )}
                  >
                    {text && <span className="sr-only">{text}：</span>}
                    {item.title !== undefined &&
                      item.title !== null &&
                      item.title !== false && (
                        <h3
                          data-ui-timeline-title=""
                          className={cn(
                            'm-0 mb-1 text-base font-semibold',
                            classNames?.title,
                            item.classNames?.title,
                          )}
                        >
                          {item.title}
                        </h3>
                      )}
                    {item.children}
                  </div>
                </li>
              )
            })}
          </ol>
          <span id={hintId} className="sr-only">
            左右方向键滚动时间轴，Home / End 到首尾，Tab 进入内容操作。
          </span>
        </>
      )}
    </div>
  )
}
