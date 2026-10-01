import {
  isValidElement,
  useCallback,
  useEffect,
  useEffectEvent,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { useConfig } from './config-context'
import { Empty } from './empty'
import { Icon } from './icon'

export type CarouselEffect = 'scroll' | 'fade'
export type CarouselDotPlacement = 'top' | 'bottom' | 'start' | 'end'
export type CarouselHandle = {
  goTo: (index: number, options?: { animate?: boolean }) => void
  next: () => void
  prev: () => void
}
type CarouselPart =
  | 'root'
  | 'viewport'
  | 'slide'
  | 'controls'
  | 'arrow'
  | 'dots'
  | 'dot'
  | 'status'
  | 'rotation'
export type CarouselProps = Omit<
  HTMLAttributes<HTMLElement>,
  'children' | 'onChange' | 'dir'
> & {
  ref?: Ref<CarouselHandle>
  items: ReactNode[]
  index?: number
  defaultIndex?: number
  autoplay?: boolean
  interval?: number
  dots?: boolean
  dotPlacement?: CarouselDotPlacement
  dotProgress?: boolean
  arrows?: boolean
  infinite?: boolean
  effect?: CarouselEffect
  speed?: number
  adaptiveHeight?: boolean
  swipe?: boolean
  draggable?: boolean
  label?: string
  emptyText?: string
  dir?: 'ltr' | 'rtl'
  onBeforeChange?: (current: number, next: number) => void
  onChange?: (index: number) => void
  onAfterChange?: (index: number) => void
  classNames?: Partial<Record<CarouselPart, string>>
}

function normalizeIndex(index: number, count: number) {
  return Number.isFinite(index)
    ? Math.max(0, Math.min(Math.floor(index), Math.max(count - 1, 0)))
    : 0
}

const controlStyles =
  'inline-flex min-h-11 min-w-11 touch-manipulation cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-foreground hover:bg-accent active:bg-accent focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50'

/** Retains each slide once; hidden slides are inert, including during transitions. */
export function Carousel({
  ref,
  items,
  index,
  defaultIndex = 0,
  autoplay = false,
  interval = 4000,
  dots = true,
  dotPlacement = 'bottom',
  dotProgress = false,
  arrows = true,
  infinite = true,
  effect = 'scroll',
  speed = 300,
  adaptiveHeight = false,
  swipe = true,
  draggable = false,
  label = '轮播内容',
  emptyText = '暂无轮播内容',
  dir,
  onBeforeChange,
  onChange,
  onAfterChange,
  classNames,
  className,
  onKeyDown,
  onFocusCapture,
  onBlurCapture,
  onMouseEnter,
  onTouchStart,
  ...props
}: CarouselProps) {
  const config = useConfig()
  const direction = dir ?? config.direction
  const count = items.length
  const [internalIndex, setInternalIndex] = useState(defaultIndex)
  const current = normalizeIndex(index ?? internalIndex, count)
  if (index === undefined && internalIndex !== current)
    setInternalIndex(current)
  const [rotationPaused, setRotationPaused] = useState(false)
  const [focusWithin, setFocusWithin] = useState(false)
  const [manualRotation, setManualRotation] = useState(false)
  const [previousAutoplay, setPreviousAutoplay] = useState(autoplay)
  if (previousAutoplay !== autoplay) {
    setPreviousAutoplay(autoplay)
    setRotationPaused(focusWithin)
    setManualRotation(false)
  }
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  )
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === 'undefined' || !document.hidden,
  )
  const rotating =
    autoplay &&
    count > 1 &&
    !rotationPaused &&
    pageVisible &&
    (!reducedMotion || manualRotation) &&
    (infinite || current < count - 1)
  const intervalMs =
    Number.isFinite(interval) && interval > 0
      ? Math.min(2_147_483_647, Math.max(100, Math.floor(interval)))
      : 4000
  const speedMs = Number.isFinite(speed)
    ? Math.max(0, Math.min(10_000, speed))
    : 300
  const sideDots = dotPlacement === 'start' || dotPlacement === 'end'
  const id = useId()
  const viewportRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef(new Map<number, HTMLDivElement>())
  const dotRefs = useRef(new Map<number, HTMLButtonElement>())
  const focusedRef = useRef<HTMLElement | null>(null)
  const rotationPointerRef = useRef<boolean | null>(null)
  const gesture = useRef<{ pointerId: number; x: number; y: number } | null>(
    null,
  )
  const changeHint = useRef<{
    from: number
    to: number
    step: number
    animate: boolean
  } | null>(null)
  const previousIndex = useRef(current)
  const pendingCompletion = useRef<number | null>(null)
  const afterChangeRef = useRef(onAfterChange)

  const requestIndex = useCallback(
    (requested: number, step?: number, animate = true) => {
      if (!count || !Number.isFinite(requested)) return
      const next = infinite
        ? ((Math.floor(requested) % count) + count) % count
        : normalizeIndex(requested, count)
      if (next === current) {
        // An explicit reset may normalize a controlled value clamped by shrinking data.
        if (index !== undefined && index !== next) onChange?.(next)
        return
      }
      changeHint.current = {
        from: current,
        to: next,
        step: step ?? Math.sign(next - current),
        animate,
      }
      onBeforeChange?.(current, next)
      if (index === undefined) setInternalIndex(next)
      onChange?.(next)
    },
    [count, current, index, infinite, onBeforeChange, onChange],
  )

  function pauseRotation() {
    if (autoplay) setRotationPaused(true)
  }
  function moveTo(next: number, step?: number, animate = true) {
    pauseRotation()
    requestIndex(next, step, animate)
  }

  useImperativeHandle(ref, () => ({
    goTo: (next, options) => moveTo(next, undefined, options?.animate),
    next: () => moveTo(current + 1, 1),
    prev: () => moveTo(current - 1, -1),
  }))
  const advance = useEffectEvent(() => requestIndex(current + 1, 1))

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!media) return
    const update = () => {
      setReducedMotion(media.matches)
      setManualRotation(false)
    }
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    const update = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  useEffect(() => {
    if (!rotating) return
    const timer = window.setInterval(advance, intervalMs)
    const fill =
      dotProgress &&
      dotRefs.current
        .get(current)
        ?.querySelector<HTMLElement>('[data-carousel-progress]')
    const animation =
      fill && !reducedMotion && typeof fill.animate === 'function'
        ? fill.animate(
            [
              { transform: sideDots ? 'scaleY(0)' : 'scaleX(0)' },
              { transform: 'scale(1)' },
            ],
            { duration: intervalMs, easing: 'linear', iterations: Infinity },
          )
        : null
    return () => {
      window.clearInterval(timer)
      animation?.cancel()
    }
  }, [
    current,
    direction,
    dotPlacement,
    dotProgress,
    dots,
    intervalMs,
    reducedMotion,
    rotating,
    sideDots,
  ])

  useLayoutEffect(() => {
    afterChangeRef.current = onAfterChange
  })
  useLayoutEffect(() => {
    const from = previousIndex.current
    previousIndex.current = current
    if (from === current) {
      // A configuration change cancels motion but settles the same visible slide.
      if (pendingCompletion.current === current) {
        pendingCompletion.current = null
        afterChangeRef.current?.(current)
      }
      return
    }
    const incoming = slideRefs.current.get(current)
    const outgoing = slideRefs.current.get(from)
    const hint = changeHint.current
    const matchedHint = hint?.from === from && hint.to === current
    changeHint.current = null
    pendingCompletion.current = null
    if (!incoming) return
    if (
      reducedMotion ||
      speedMs === 0 ||
      (matchedHint && !hint.animate) ||
      typeof incoming.animate !== 'function'
    ) {
      afterChangeRef.current?.(current)
      return
    }
    const step = matchedHint ? hint.step : Math.sign(current - from)
    const sign = step * (direction === 'rtl' ? -1 : 1)
    pendingCompletion.current = current
    const animations = [
      incoming.animate(
        effect === 'fade'
          ? [{ opacity: 0 }, { opacity: 1 }]
          : [
              { transform: `translateX(${sign * 100}%)` },
              { transform: 'translateX(0)' },
            ],
        { duration: speedMs, easing: 'ease-out' },
      ),
    ]
    if (outgoing)
      animations.push(
        outgoing.animate(
          effect === 'fade'
            ? [
                { visibility: 'visible', opacity: 1 },
                { visibility: 'visible', opacity: 0 },
              ]
            : [
                { visibility: 'visible', transform: 'translateX(0)' },
                {
                  visibility: 'visible',
                  transform: `translateX(${-sign * 100}%)`,
                },
              ],
          { duration: speedMs, easing: 'ease-out' },
        ),
      )
    let cancelled = false
    void Promise.all(animations.map((animation) => animation.finished))
      .then(() => {
        if (!cancelled) {
          pendingCompletion.current = null
          afterChangeRef.current?.(current)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
      for (const animation of animations) animation.cancel()
    }
  }, [current, direction, effect, reducedMotion, speedMs])

  useLayoutEffect(() => {
    const node = focusedRef.current
    if (!node) return
    if (
      document.activeElement !== node &&
      document.activeElement !== document.body
    ) {
      focusedRef.current = null
      return
    }
    if (
      !node.isConnected ||
      node.closest('[inert], [hidden]') ||
      ('disabled' in node && !!node.disabled)
    )
      viewportRef.current?.focus({ preventScroll: true })
  })

  const dotList = dots && count > 1 && (
    <div
      role="group"
      aria-label="轮播页码"
      data-carousel-dots=""
      data-placement={dotPlacement}
      className={cn(
        'flex min-w-0 flex-wrap items-center justify-center gap-2',
        sideDots
          ? 'max-h-72 flex-col flex-nowrap overflow-y-auto p-2'
          : 'px-3 py-2',
        classNames?.dots,
      )}
    >
      {items.map((_, itemIndex) => (
        <button
          key={itemIndex}
          ref={(element) => {
            if (element) dotRefs.current.set(itemIndex, element)
            else dotRefs.current.delete(itemIndex)
          }}
          type="button"
          aria-label={`切换到第 ${itemIndex + 1} 项`}
          aria-controls={`${id}-slide-${itemIndex}`}
          aria-current={itemIndex === current ? 'true' : undefined}
          tabIndex={itemIndex === current ? 0 : -1}
          className={cn(
            'inline-flex size-11 shrink-0 touch-manipulation cursor-pointer items-center justify-center rounded-md bg-transparent hover:bg-accent active:bg-accent focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring',
            classNames?.dot,
          )}
          onClick={() => moveTo(itemIndex)}
        >
          <span
            aria-hidden="true"
            className={cn(
              'relative overflow-hidden rounded-full',
              itemIndex === current
                ? 'bg-primary/25'
                : 'bg-muted-foreground/40',
              sideDots
                ? itemIndex === current
                  ? 'h-6 w-1'
                  : 'h-4 w-1'
                : itemIndex === current
                  ? 'h-1 w-6'
                  : 'h-1 w-4',
            )}
          >
            {itemIndex === current && (
              <span
                data-carousel-progress=""
                className={cn(
                  'absolute inset-0 bg-primary',
                  sideDots
                    ? 'origin-top'
                    : direction === 'rtl'
                      ? 'origin-right'
                      : 'origin-left',
                )}
              />
            )}
          </span>
        </button>
      ))}
    </div>
  )

  return (
    <section
      {...props}
      dir={direction}
      aria-label={props['aria-label'] ?? label}
      aria-roledescription="carousel"
      data-ui-carousel=""
      data-carousel-effect={effect}
      className={cn(
        '@container/carousel min-w-0 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card text-foreground',
        classNames?.root,
        className,
      )}
      onMouseEnter={(event) => {
        onMouseEnter?.(event)
        if (!event.defaultPrevented) pauseRotation()
      }}
      onFocusCapture={(event) => {
        setFocusWithin(true)
        focusedRef.current = event.target
        pauseRotation()
        onFocusCapture?.(event)
      }}
      onBlurCapture={(event) => {
        setFocusWithin(event.currentTarget.contains(event.relatedTarget))
        if (
          event.relatedTarget instanceof Node &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          focusedRef.current = null
        onBlurCapture?.(event)
      }}
      onTouchStart={(event) => {
        onTouchStart?.(event)
        if (
          !event.defaultPrevented &&
          event.target instanceof Element &&
          !event.target.closest('[data-carousel-rotation]')
        )
          pauseRotation()
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (
          event.defaultPrevented ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          count < 2
        )
          return
        const dotIndex = [...dotRefs.current].find(
          ([, button]) => button === event.target,
        )?.[0]
        if (event.target !== viewportRef.current && dotIndex === undefined)
          return
        const origin = dotIndex ?? current
        let next: number
        let step: number | undefined
        if (event.key === 'Home') next = 0
        else if (event.key === 'End') next = count - 1
        else if (
          event.key === (direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight') ||
          (sideDots && dotIndex !== undefined && event.key === 'ArrowDown')
        ) {
          next = origin + 1
          step = 1
        } else if (
          event.key === (direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft') ||
          (sideDots && dotIndex !== undefined && event.key === 'ArrowUp')
        ) {
          next = origin - 1
          step = -1
        } else return
        event.preventDefault()
        moveTo(next, step)
        if (dotIndex !== undefined) {
          const normalized = infinite
            ? ((next % count) + count) % count
            : normalizeIndex(next, count)
          dotRefs.current.get(normalized)?.focus()
        }
      }}
    >
      {dotPlacement === 'top' && dotList}
      <div className="flex min-w-0 items-center">
        {dotPlacement === 'start' && dotList}
        <div
          ref={viewportRef}
          role="group"
          aria-label="轮播幻灯片"
          tabIndex={0}
          data-carousel-viewport=""
          className={cn(
            'relative grid min-h-28 min-w-0 flex-1 touch-pan-y touch-pinch-zoom overflow-hidden outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring',
            draggable && 'cursor-grab active:cursor-grabbing',
            classNames?.viewport,
          )}
          onPointerDown={(event) => {
            if (!event.isPrimary || event.button !== 0) {
              gesture.current = null
              return
            }
            if (
              (event.pointerType === 'mouse' && !draggable) ||
              (event.pointerType !== 'mouse' && !swipe) ||
              count < 2
            )
              return
            if (
              event.target instanceof Element &&
              event.target.closest(
                'a, button, input, textarea, select, summary, [contenteditable], [data-carousel-no-swipe]',
              )
            )
              return
            pauseRotation()
            gesture.current = {
              pointerId: event.pointerId,
              x: event.clientX,
              y: event.clientY,
            }
            event.currentTarget.setPointerCapture?.(event.pointerId)
            if (event.pointerType === 'mouse') event.preventDefault()
          }}
          onPointerUp={(event) => {
            const start = gesture.current
            gesture.current = null
            if (!start || start.pointerId !== event.pointerId) return
            const x = event.clientX - start.x
            const y = event.clientY - start.y
            const threshold = Math.max(
              30,
              Math.min(60, event.currentTarget.clientWidth * 0.15),
            )
            if (Math.abs(x) < threshold || Math.abs(x) < Math.abs(y) * 1.2)
              return
            const step = (x < 0 ? 1 : -1) * (direction === 'rtl' ? -1 : 1)
            moveTo(current + step, step)
          }}
          onPointerCancel={() => {
            gesture.current = null
          }}
          onLostPointerCapture={() => {
            gesture.current = null
          }}
          onDragStart={(event) => {
            if (draggable) event.preventDefault()
          }}
        >
          {count === 0 ? (
            <Empty title={emptyText} size="small" className="m-4 border-0" />
          ) : (
            items.map((item, itemIndex) => (
              <div
                key={
                  isValidElement(item) && item.key != null
                    ? `key:${item.key}`
                    : `index:${itemIndex}`
                }
                id={`${id}-slide-${itemIndex}`}
                ref={(element) => {
                  if (element) slideRefs.current.set(itemIndex, element)
                  else slideRefs.current.delete(itemIndex)
                }}
                role="group"
                aria-roledescription="slide"
                aria-label={`${itemIndex + 1} / ${count}`}
                aria-hidden={itemIndex !== current || undefined}
                inert={itemIndex !== current}
                data-carousel-slide=""
                data-current={itemIndex === current}
                className={cn(
                  'min-h-28 min-w-0 p-6 [overflow-wrap:anywhere]',
                  itemIndex === current
                    ? 'relative col-start-1 row-start-1'
                    : 'invisible pointer-events-none col-start-1 row-start-1',
                  adaptiveHeight && itemIndex !== current && 'absolute inset-0',
                  classNames?.slide,
                )}
              >
                {item}
              </div>
            ))
          )}
        </div>
        {dotPlacement === 'end' && dotList}
      </div>
      {dotPlacement === 'bottom' && dotList}
      {count > 0 && (
        <div
          data-carousel-controls=""
          className={cn(
            'flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2',
            classNames?.controls,
          )}
        >
          {autoplay && count > 1 && (
            <button
              type="button"
              data-carousel-rotation=""
              className={cn(controlStyles, classNames?.rotation)}
              onPointerDown={() => {
                rotationPointerRef.current = rotating
              }}
              onPointerCancel={() => {
                rotationPointerRef.current = null
              }}
              onKeyDown={() => {
                rotationPointerRef.current = null
              }}
              onBlur={() => {
                rotationPointerRef.current = null
              }}
              onClick={() => {
                const wasRunning = rotationPointerRef.current ?? rotating
                rotationPointerRef.current = null
                if (wasRunning) setRotationPaused(true)
                else {
                  if (!infinite && current === count - 1) requestIndex(0)
                  setManualRotation(true)
                  setRotationPaused(false)
                }
              }}
            >
              {rotating ? '停止自动播放' : '开始自动播放'}
            </button>
          )}
          {arrows && count > 1 && (
            <button
              type="button"
              aria-label="上一项"
              className={cn(controlStyles, classNames?.arrow)}
              disabled={!infinite && current === 0}
              onClick={() => moveTo(current - 1, -1)}
            >
              <Icon
                name={direction === 'rtl' ? 'arrowRight' : 'arrowLeft'}
                size={16}
              />
              <span>上一项</span>
            </button>
          )}
          <span
            data-carousel-status=""
            aria-live={rotating ? 'off' : 'polite'}
            aria-atomic="true"
            className={cn('text-sm text-muted-foreground', classNames?.status)}
          >
            {current + 1} / {count}
          </span>
          {arrows && count > 1 && (
            <button
              type="button"
              aria-label="下一项"
              className={cn(controlStyles, classNames?.arrow)}
              disabled={!infinite && current === count - 1}
              onClick={() => moveTo(current + 1, 1)}
            >
              <span>下一项</span>
              <Icon
                name={direction === 'rtl' ? 'arrowLeft' : 'arrowRight'}
                size={16}
              />
            </button>
          )}
        </div>
      )}
    </section>
  )
}
