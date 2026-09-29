import {
  forwardRef,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'

export type SplitterPanel = {
  key: string
  label: string
  content: ReactNode
  minSize?: number
  maxSize?: number
  resizable?: boolean
  collapsible?: boolean
  className?: string
}

export type SplitterProps = Omit<HTMLAttributes<HTMLDivElement>, 'onResize'> & {
  panels: SplitterPanel[]
  orientation?: 'horizontal' | 'vertical'
  sizes?: number[]
  defaultSizes?: number[]
  onResize?: (sizes: number[]) => void
  onResizeStart?: (sizes: number[]) => void
  onResizeEnd?: (sizes: number[]) => void
  onCollapse?: (collapsed: boolean[], sizes: number[]) => void
  step?: number
  disabled?: boolean
  label?: string
}

type DragState = {
  index: number
  pointerId: number
  start: number
  sizes: number[]
  latest: number[]
  moved: boolean
}

const trackSize = 8

function normalizedSizes(input: number[] | undefined, count: number): number[] {
  if (count === 0) return []
  const values =
    input?.length === count &&
    input.every((size) => Number.isFinite(size) && size >= 0)
      ? input
      : Array<number>(count).fill(1)
  const total = values.reduce((sum, size) => sum + size, 0)
  if (Math.abs(total - 100) < 0.001) return [...values]
  return total > 0
    ? values.map((size) => (size / total) * 100)
    : Array<number>(count).fill(100 / count)
}

function limits(panel: SplitterPanel) {
  const min = Math.max(0, Math.min(100, panel.minSize ?? 0))
  const max = Math.max(min, Math.min(100, panel.maxSize ?? 100))
  return { min, max }
}

function pairRange(panels: SplitterPanel[], sizes: number[], index: number) {
  const start = limits(panels[index])
  const end = limits(panels[index + 1])
  const total = sizes[index] + sizes[index + 1]
  const min = Math.max(start.min, total - end.max)
  const max = Math.min(start.max, total - end.min)
  return min <= max ? { min, max } : { min: sizes[index], max: sizes[index] }
}

function resizePair(
  sizes: number[],
  index: number,
  desired: number,
  min: number,
  max: number,
) {
  const next = [...sizes]
  const total = sizes[index] + sizes[index + 1]
  next[index] = Math.max(min, Math.min(max, desired))
  next[index + 1] = total - next[index]
  return next
}

function sameSizes(left: number[], right: number[]) {
  return left.every((size, index) => Math.abs(size - right[index]) < 0.001)
}

/** Resizable adjacent panels with percent sizes, keyboard support and touch handles. */
export const Splitter = forwardRef<HTMLDivElement, SplitterProps>(
  function Splitter(
    {
      panels,
      orientation = 'horizontal',
      sizes,
      defaultSizes,
      onResize,
      onResizeStart,
      onResizeEnd,
      onCollapse,
      step = 5,
      disabled = false,
      label = '可调整面板',
      className,
      ...props
    },
    ref,
  ) {
    const [internalSizes, setInternalSizes] = useState(() =>
      normalizedSizes(defaultSizes, panels.length),
    )
    const currentSizes = normalizedSizes(sizes ?? internalSizes, panels.length)
    const defaults = normalizedSizes(defaultSizes, panels.length)
    const rootRef = useRef<HTMLDivElement | null>(null)
    const dragRef = useRef<DragState | null>(null)
    const expandedRef = useRef(new Map<string, number>())
    const generatedId = useId()
    const horizontal = orientation === 'horizontal'
    const keyStep = Math.max(
      0.1,
      Math.min(25, Number.isFinite(step) ? step : 5),
    )

    function publish(next: number[], previous = currentSizes) {
      if (sameSizes(next, previous)) return false
      if (sizes === undefined) setInternalSizes(next)
      onResize?.(next)
      return true
    }

    function finish(next: number[]) {
      onResizeEnd?.(next)
    }

    function handlePointerDown(
      event: PointerEvent<HTMLDivElement>,
      index: number,
    ) {
      if (
        disabled ||
        panels[index].resizable === false ||
        panels[index + 1].resizable === false
      )
        return
      if ((event.button ?? 0) !== 0) return
      event.preventDefault()
      event.currentTarget.setPointerCapture?.(event.pointerId)
      dragRef.current = {
        index,
        pointerId: event.pointerId,
        start: horizontal ? event.clientX : event.clientY,
        sizes: currentSizes,
        latest: currentSizes,
        moved: false,
      }
      onResizeStart?.(currentSizes)
    }

    function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== event.pointerId) return
      const root = rootRef.current
      if (!root) return
      const length =
        (horizontal ? root.clientWidth : root.clientHeight) -
        Math.max(0, panels.length - 1) * trackSize
      if (length <= 0) return
      const delta =
        (((horizontal ? event.clientX : event.clientY) - drag.start) / length) *
        100
      const range = pairRange(panels, drag.sizes, drag.index)
      const next = resizePair(
        drag.sizes,
        drag.index,
        drag.sizes[drag.index] + delta,
        range.min,
        range.max,
      )
      if (sameSizes(next, drag.latest)) return
      drag.latest = next
      drag.moved = true
      publish(next, drag.sizes)
    }

    function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== event.pointerId) return
      if (event.currentTarget.hasPointerCapture?.(event.pointerId))
        event.currentTarget.releasePointerCapture(event.pointerId)
      dragRef.current = null
      if (drag.moved) finish(drag.latest)
    }

    function handleKeyDown(
      event: React.KeyboardEvent<HTMLDivElement>,
      index: number,
    ) {
      if (event.target !== event.currentTarget || disabled) return
      if (
        panels[index].resizable === false ||
        panels[index + 1].resizable === false
      )
        return
      const range = pairRange(panels, currentSizes, index)
      let desired: number | undefined
      const amount = keyStep * (event.shiftKey ? 5 : 1)
      if (event.key === 'Home') desired = range.min
      else if (event.key === 'End') desired = range.max
      else if (horizontal && event.key === 'ArrowRight')
        desired = currentSizes[index] + amount
      else if (horizontal && event.key === 'ArrowLeft')
        desired = currentSizes[index] - amount
      else if (!horizontal && event.key === 'ArrowDown')
        desired = currentSizes[index] + amount
      else if (!horizontal && event.key === 'ArrowUp')
        desired = currentSizes[index] - amount
      if (desired === undefined) return
      event.preventDefault()
      const next = resizePair(
        currentSizes,
        index,
        desired,
        range.min,
        range.max,
      )
      if (publish(next)) finish(next)
    }

    function resetPair(index: number) {
      if (
        disabled ||
        panels[index].resizable === false ||
        panels[index + 1].resizable === false
      )
        return
      const total = currentSizes[index] + currentSizes[index + 1]
      const defaultTotal = defaults[index] + defaults[index + 1]
      const desired =
        defaultTotal > 0 ? (defaults[index] / defaultTotal) * total : total / 2
      const range = pairRange(panels, currentSizes, index)
      const next = resizePair(
        currentSizes,
        index,
        desired,
        range.min,
        range.max,
      )
      if (publish(next)) finish(next)
    }

    function toggleCollapse(panelIndex: number, handleIndex: number) {
      if (disabled) return
      const partner = panelIndex === handleIndex ? handleIndex + 1 : handleIndex
      const pairTotal = currentSizes[panelIndex] + currentSizes[partner]
      const collapsed = currentSizes[panelIndex] <= 0.001
      let desired: number
      if (collapsed) {
        const saved = expandedRef.current.get(panels[panelIndex].key)
        desired = saved ?? defaults[panelIndex] ?? pairTotal / 2
      } else {
        expandedRef.current.set(
          panels[panelIndex].key,
          currentSizes[panelIndex],
        )
        desired = 0
      }
      const next = [...currentSizes]
      const targetLimit = limits(panels[panelIndex])
      const partnerLimit = limits(panels[partner])
      const minimum = collapsed ? targetLimit.min : 0
      const maximum = Math.min(targetLimit.max, pairTotal - partnerLimit.min)
      if (maximum < minimum) return
      const value = Math.max(minimum, Math.min(maximum, desired))
      if (pairTotal - value > partnerLimit.max) return
      next[panelIndex] = value
      next[partner] = pairTotal - value
      if (!publish(next)) return
      onCollapse?.(
        next.map((size) => size <= 0.001),
        next,
      )
      finish(next)
    }

    return (
      <div
        {...props}
        ref={(node) => {
          rootRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        role="group"
        aria-label={label}
        className={cn(
          'flex h-64 w-full min-w-0 overflow-hidden rounded-[var(--ui-card-radius)] border border-border bg-card text-card-foreground',
          horizontal ? 'flex-row' : 'flex-col',
          className,
        )}
      >
        {panels.map((panel, index) => {
          const next = panels[index + 1]
          const range = next ? pairRange(panels, currentSizes, index) : null
          const canDrag =
            !disabled && panel.resizable !== false && next?.resizable !== false
          return (
            <div key={panel.key} className="contents">
              <div
                id={`${generatedId}-panel-${index}`}
                role="region"
                aria-label={panel.label}
                className={cn('min-h-0 min-w-0 overflow-auto', panel.className)}
                style={{ flexGrow: currentSizes[index], flexBasis: 0 }}
              >
                {panel.content}
              </div>
              {next && range && (
                <div
                  className={cn(
                    'relative z-10 shrink-0',
                    horizontal ? 'w-2' : 'h-2',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'pointer-events-none absolute bg-border',
                      horizontal
                        ? 'left-1/2 top-0 h-full w-px -translate-x-1/2'
                        : 'left-0 top-1/2 h-px w-full -translate-y-1/2',
                    )}
                  />
                  <div
                    role="separator"
                    tabIndex={canDrag ? 0 : -1}
                    aria-label={`${panel.label}与${next.label}分隔条`}
                    aria-controls={`${generatedId}-panel-${index} ${generatedId}-panel-${index + 1}`}
                    aria-orientation={horizontal ? 'vertical' : 'horizontal'}
                    aria-valuemin={Math.round(
                      Math.min(range.min, currentSizes[index]),
                    )}
                    aria-valuemax={Math.round(
                      Math.max(range.max, currentSizes[index]),
                    )}
                    aria-valuenow={Math.round(currentSizes[index])}
                    aria-valuetext={`${Math.round(currentSizes[index])}%`}
                    aria-disabled={!canDrag || undefined}
                    className={cn(
                      'absolute z-10 flex touch-none items-center justify-center focus-visible:outline-2 focus-visible:outline-ring',
                      horizontal
                        ? 'left-1/2 top-0 h-full w-11 -translate-x-1/2 cursor-col-resize'
                        : 'left-0 top-1/2 h-11 w-full -translate-y-1/2 cursor-row-resize',
                      !canDrag && 'cursor-default',
                    )}
                    onPointerDown={(event) => handlePointerDown(event, index)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerEnd}
                    onPointerCancel={handlePointerEnd}
                    onKeyDown={(event) => handleKeyDown(event, index)}
                    onDoubleClick={() => resetPair(index)}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'rounded-full bg-muted-foreground/70',
                        horizontal ? 'h-8 w-1' : 'h-1 w-8',
                      )}
                    />
                  </div>
                  {(panel.collapsible || next.collapsible) && (
                    <div
                      className={cn(
                        'pointer-events-none absolute z-20 flex gap-2',
                        horizontal
                          ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex-col'
                          : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex-row',
                      )}
                    >
                      {[panel, next].map((item, side) =>
                        item.collapsible ? (
                          <button
                            key={item.key}
                            type="button"
                            disabled={disabled}
                            aria-label={`${currentSizes[index + side] <= 0.001 ? '展开' : '折叠'}${item.label}`}
                            className="pointer-events-auto inline-flex size-11 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] border border-border bg-card text-sm text-card-foreground shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-[0.55]"
                            onPointerDown={(event) => event.stopPropagation()}
                            onDoubleClick={(event) => event.stopPropagation()}
                            onClick={() => toggleCollapse(index + side, index)}
                          >
                            {currentSizes[index + side] <= 0.001 ? '+' : '−'}
                          </button>
                        ) : null,
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  },
)
