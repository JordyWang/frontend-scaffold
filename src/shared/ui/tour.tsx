import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type RefObject,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { Button, type ButtonProps } from './button'
import { Portal } from './portal'

export type TourPlacement =
  | 'center'
  | 'top'
  | 'topLeft'
  | 'topRight'
  | 'bottom'
  | 'bottomLeft'
  | 'bottomRight'
  | 'left'
  | 'leftTop'
  | 'leftBottom'
  | 'right'
  | 'rightTop'
  | 'rightBottom'

export type TourTarget = HTMLElement | null | (() => HTMLElement | null)

export type TourStep = {
  key: string
  target?: TourTarget
  title: ReactNode
  description?: ReactNode
  cover?: ReactNode
  placement?: TourPlacement
  mask?: boolean
  type?: 'default' | 'primary'
  nextButtonProps?: Omit<ButtonProps, 'children' | 'onClick'>
  prevButtonProps?: Omit<ButtonProps, 'children' | 'onClick'>
}

export type TourProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange'
> & {
  steps: TourStep[]
  open?: boolean
  defaultOpen?: boolean
  current?: number
  defaultCurrent?: number
  onChange?: (current: number) => void
  onClose?: () => void
  onFinish?: () => void
  mask?: boolean | { color?: string; className?: string }
  maskClosable?: boolean
  keyboard?: boolean
  placement?: TourPlacement
  gap?: number | [offset: number, radius: number]
  scrollIntoViewOptions?: boolean | ScrollIntoViewOptions
  closeLabel?: string
  nextLabel?: string
  prevLabel?: string
  finishLabel?: string
  indicatorsRender?: (current: number, total: number) => ReactNode
  returnFocusRef?: RefObject<HTMLElement | null>
}

type Rect = {
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
}

const defaultRect: Rect = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: 0,
  height: 0,
}

function targetElement(target?: TourTarget): HTMLElement | null {
  if (typeof target === 'function') return target()
  return target ?? null
}

function safeNumber(value: number | undefined, fallback: number) {
  return Number.isFinite(value) ? value! : fallback
}

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function focusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return []
  return [
    ...(container.matches(focusableSelector) ? [container] : []),
    ...container.querySelectorAll<HTMLElement>(focusableSelector),
  ].filter(
    (element) =>
      !element.closest('[aria-hidden="true"], [hidden], [inert]') &&
      element.getClientRects().length > 0 &&
      getComputedStyle(element).visibility !== 'hidden',
  )
}

function placementPosition(
  placement: TourPlacement,
  target: Rect,
  width: number,
  height: number,
  gap: number,
  viewport: { width: number; height: number },
) {
  if (placement === 'center' || target.width === 0) {
    return {
      left: Math.max(12, (viewport.width - width) / 2),
      top: Math.max(12, (viewport.height - height) / 2),
    }
  }
  const horizontal = (align: 'start' | 'center' | 'end') => {
    if (align === 'start') return target.left
    if (align === 'end') return target.right - width
    return target.left + (target.width - width) / 2
  }
  const vertical = (align: 'start' | 'center' | 'end') => {
    if (align === 'start') return target.top
    if (align === 'end') return target.bottom - height
    return target.top + (target.height - height) / 2
  }
  const side: 'top' | 'bottom' | 'left' | 'right' = placement.startsWith('top')
    ? 'top'
    : placement.startsWith('bottom')
      ? 'bottom'
      : placement.startsWith('left')
        ? 'left'
        : 'right'
  const room = {
    top: target.top - gap - 12,
    bottom: viewport.height - target.bottom - gap - 12,
    left: target.left - gap - 12,
    right: viewport.width - target.right - gap - 12,
  }
  const opposite = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
  } as const
  const reverse = opposite[side]
  const cross: ('top' | 'bottom' | 'left' | 'right')[] =
    side === 'top' || side === 'bottom' ? ['right', 'left'] : ['bottom', 'top']
  const candidates = [side, reverse, ...cross]
  const fits = (candidate: (typeof candidates)[number]) =>
    room[candidate] >=
    (candidate === 'top' || candidate === 'bottom' ? height : width)
  const chosen =
    candidates.find(fits) ?? (room[reverse] > room[side] ? reverse : side)
  const sameAxis =
    (side === 'top' || side === 'bottom') ===
    (chosen === 'top' || chosen === 'bottom')
  const suffix = sameAxis ? placement.slice(side.length) : ''
  const left =
    chosen === 'left'
      ? target.left - width - gap
      : chosen === 'right'
        ? target.right + gap
        : horizontal(
            suffix === 'Left' ? 'start' : suffix === 'Right' ? 'end' : 'center',
          )
  const top =
    chosen === 'top'
      ? target.top - height - gap
      : chosen === 'bottom'
        ? target.bottom + gap
        : vertical(
            suffix === 'Top' ? 'start' : suffix === 'Bottom' ? 'end' : 'center',
          )
  return {
    left: Math.max(
      12,
      Math.min(left, Math.max(12, viewport.width - width - 12)),
    ),
    top: Math.max(
      12,
      Math.min(top, Math.max(12, viewport.height - height - 12)),
    ),
  }
}

/** Guided steps with a target highlight, keyboard navigation and touch-friendly actions. */
export const Tour = forwardRef<HTMLDivElement, TourProps>(function Tour(
  {
    steps,
    open,
    defaultOpen = false,
    current,
    defaultCurrent = 0,
    onChange,
    onClose,
    onFinish,
    mask = true,
    maskClosable = true,
    keyboard = true,
    placement: defaultPlacement = 'bottom',
    gap = [6, 8],
    scrollIntoViewOptions = true,
    closeLabel = '关闭引导',
    nextLabel = '下一步',
    prevLabel = '上一步',
    finishLabel = '完成',
    indicatorsRender,
    returnFocusRef,
    className,
    ...props
  },
  forwardedRef,
) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const [internalCurrent, setInternalCurrent] = useState(defaultCurrent)
  const [targetRect, setTargetRect] = useState<Rect>(defaultRect)
  const [cardHeight, setCardHeight] = useState(180)
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))
  const cardRef = useRef<HTMLDivElement | null>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const openSessionRef = useRef(false)
  const isOpen = open ?? internalOpen
  const stepIndex = Math.max(
    0,
    Math.min(current ?? internalCurrent, Math.max(0, steps.length - 1)),
  )
  const step = steps[stepIndex]
  const [offset, radius] = Array.isArray(gap)
    ? [Math.max(0, safeNumber(gap[0], 6)), Math.max(0, safeNumber(gap[1], 8))]
    : [Math.max(0, safeNumber(gap, 6)), 8]
  const hasMask = mask !== false && step?.mask !== false

  const setStep = useCallback(
    (next: number) => {
      const bounded = Math.max(0, Math.min(next, steps.length - 1))
      if (current === undefined) setInternalCurrent(bounded)
      onChange?.(bounded)
    },
    [current, onChange, steps.length],
  )
  const close = useCallback(
    (finish = false) => {
      if (open === undefined) setInternalOpen(false)
      if (finish) onFinish?.()
      else onClose?.()
      // A controlled owner may reject the close request. Restore focus only
      // after the card has actually left the document, including when the
      // owner unmounts Tour in response to this callback.
      requestAnimationFrame(() => {
        const card = cardRef.current
        if (!card?.isConnected) {
          ;(restoreFocusRef.current ?? returnFocusRef?.current)?.focus()
          return
        }
        const active = document.activeElement
        const target = targetElement(step?.target)
        if (hasMask && !card.contains(active) && !target?.contains(active)) {
          card.querySelector<HTMLButtonElement>('[data-tour-close]')?.focus()
        }
      })
    },
    [hasMask, onClose, onFinish, open, returnFocusRef, step],
  )

  useLayoutEffect(() => {
    if (!isOpen || !step) return
    const element = targetElement(step.target)
    if (scrollIntoViewOptions && element) {
      element.scrollIntoView(
        scrollIntoViewOptions === true
          ? { block: 'nearest', inline: 'nearest' }
          : scrollIntoViewOptions,
      )
    }
    const measure = () => {
      setViewport((previous) =>
        previous.width === window.innerWidth &&
        previous.height === window.innerHeight
          ? previous
          : { width: window.innerWidth, height: window.innerHeight },
      )
      const rect = element?.getBoundingClientRect()
      setTargetRect(
        rect
          ? {
              top: rect.top,
              left: rect.left,
              right: rect.right,
              bottom: rect.bottom,
              width: rect.width,
              height: rect.height,
            }
          : defaultRect,
      )
      const nextCardHeight = cardRef.current?.getBoundingClientRect().height
      if (nextCardHeight) setCardHeight(nextCardHeight)
    }
    measure()
    const frame = window.requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    if (element) observer?.observe(element)
    if (cardRef.current) observer?.observe(cardRef.current)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      observer?.disconnect()
    }
  }, [isOpen, step, scrollIntoViewOptions])

  useEffect(() => {
    if (!isOpen) {
      if (openSessionRef.current) {
        requestAnimationFrame(() =>
          (restoreFocusRef.current ?? returnFocusRef?.current)?.focus(),
        )
      }
      openSessionRef.current = false
      return
    }
    if (openSessionRef.current) return
    const active = document.activeElement as HTMLElement | null
    restoreFocusRef.current = active && active !== document.body ? active : null
    openSessionRef.current = true
  }, [isOpen, returnFocusRef])

  useEffect(() => {
    if (!isOpen) return
    const focusTarget = targetElement(step?.target)
    const frame = window.requestAnimationFrame(() => {
      const closeButton =
        cardRef.current?.querySelector<HTMLButtonElement>('[data-tour-close]')
      closeButton?.focus()
      if (focusTarget && !hasMask)
        focusTarget.setAttribute('data-tour-focus-target', '')
    })
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (hasMask && event.key === 'Tab') {
        const focusable = [
          ...focusableElements(cardRef.current),
          ...focusableElements(focusTarget),
        ]
        event.preventDefault()
        if (focusable.length === 0) {
          cardRef.current?.focus()
          return
        }
        const index = focusable.indexOf(document.activeElement as HTMLElement)
        const nextIndex =
          index < 0
            ? event.shiftKey
              ? focusable.length - 1
              : 0
            : (index + (event.shiftKey ? -1 : 1) + focusable.length) %
              focusable.length
        focusable[nextIndex].focus()
        return
      }
      const active = document.activeElement
      const editing =
        active instanceof HTMLElement &&
        (active.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName))
      if (keyboard && event.key === 'Escape') {
        event.preventDefault()
        close()
      } else if (keyboard && !editing && event.key === 'ArrowRight') {
        event.preventDefault()
        if (stepIndex === steps.length - 1) close(true)
        else setStep(stepIndex + 1)
      } else if (keyboard && !editing && event.key === 'ArrowLeft') {
        event.preventDefault()
        if (stepIndex > 0) setStep(stepIndex - 1)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', handleKeyDown)
      if (focusTarget) focusTarget.removeAttribute('data-tour-focus-target')
    }
  }, [isOpen, stepIndex, steps.length, keyboard, hasMask, step, close, setStep])

  if (!isOpen || !step) return null
  const cardWidth = Math.min(360, Math.max(0, viewport.width - 24))
  const placement = step.placement ?? defaultPlacement
  const position = placementPosition(
    placement,
    targetRect,
    cardWidth,
    cardHeight,
    offset + 8,
    viewport,
  )
  const maskColor = typeof mask === 'object' ? mask.color : undefined
  const maskClassName = typeof mask === 'object' ? mask.className : undefined
  const targetStyle = targetRect.width
    ? {
        top: targetRect.top - offset,
        left: targetRect.left - offset,
        width: targetRect.width + offset * 2,
        height: targetRect.height + offset * 2,
        borderRadius: radius,
      }
    : undefined
  const actionButtonProps = step.nextButtonProps

  return (
    <Portal>
      <div
        {...props}
        ref={forwardedRef}
        data-tour-root=""
        className={cn('pointer-events-none fixed inset-0 z-[70]', className)}
        aria-label="页面引导"
      >
        {hasMask && targetStyle && (
          <>
            <div
              data-tour-mask=""
              aria-hidden="true"
              className={cn(
                'fixed inset-x-0 top-0 pointer-events-auto bg-slate-950/55',
                maskClassName,
              )}
              style={{
                height: Math.max(0, targetRect.top - offset),
                backgroundColor: maskColor,
              }}
              onClick={() => maskClosable && close()}
            />
            <div
              data-tour-mask=""
              aria-hidden="true"
              className={cn(
                'fixed bottom-0 left-0 pointer-events-auto bg-slate-950/55',
                maskClassName,
              )}
              style={{
                top: targetRect.bottom + offset,
                width: '100%',
                backgroundColor: maskColor,
              }}
              onClick={() => maskClosable && close()}
            />
            <div
              data-tour-mask=""
              aria-hidden="true"
              className={cn(
                'fixed left-0 pointer-events-auto bg-slate-950/55',
                maskClassName,
              )}
              style={{
                top: targetRect.top - offset,
                width: Math.max(0, targetRect.left - offset),
                height: targetRect.height + offset * 2,
                backgroundColor: maskColor,
              }}
              onClick={() => maskClosable && close()}
            />
            <div
              data-tour-mask=""
              aria-hidden="true"
              className={cn(
                'fixed right-0 pointer-events-auto bg-slate-950/55',
                maskClassName,
              )}
              style={{
                top: targetRect.top - offset,
                width: Math.max(0, viewport.width - targetRect.right - offset),
                height: targetRect.height + offset * 2,
                backgroundColor: maskColor,
              }}
              onClick={() => maskClosable && close()}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none fixed border-2 border-primary shadow-[0_0_0_2px_color-mix(in_srgb,var(--primary)_35%,transparent)]"
              style={targetStyle}
            />
          </>
        )}
        {hasMask && !targetStyle && (
          <div
            data-tour-mask=""
            aria-hidden="true"
            className={cn(
              'fixed inset-0 pointer-events-auto bg-slate-950/55',
              maskClassName,
            )}
            style={{ backgroundColor: maskColor }}
            onClick={() => maskClosable && close()}
          />
        )}
        <div
          ref={cardRef}
          role="dialog"
          tabIndex={-1}
          aria-modal={hasMask && !targetRect.width ? true : undefined}
          aria-label={typeof step.title === 'string' ? step.title : '页面引导'}
          data-tour-card=""
          className={cn(
            'pointer-events-auto fixed z-[71] max-h-[calc(100dvh-24px)] max-w-[calc(100vw-24px)] overflow-y-auto overscroll-contain rounded-xl border p-4 text-sm shadow-xl outline-none sm:p-5',
            step.type === 'primary'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card text-card-foreground',
          )}
          style={{ width: cardWidth, left: position.left, top: position.top }}
        >
          <button
            type="button"
            data-tour-close=""
            aria-label={closeLabel}
            className="absolute end-2 top-2 inline-flex size-11 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] text-current/70 hover:bg-black/10 hover:text-current focus-visible:outline-2 focus-visible:outline-ring"
            onClick={() => close()}
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ×
            </span>
          </button>
          {step.cover && (
            <div className="mb-3 overflow-hidden rounded-lg">{step.cover}</div>
          )}
          <div className="pe-9 font-semibold">{step.title}</div>
          {step.description && (
            <div className="mt-2 leading-6 text-current/80">
              {step.description}
            </div>
          )}
          <div className="mt-4 flex min-h-11 items-center justify-between gap-3">
            <div
              className="inline-flex items-center gap-1"
              aria-label={`第 ${stepIndex + 1} 步，共 ${steps.length} 步`}
            >
              {indicatorsRender
                ? indicatorsRender(stepIndex, steps.length)
                : steps.map((item, index) => (
                    <span
                      key={item.key}
                      aria-hidden="true"
                      className={cn(
                        'size-2 rounded-full bg-current/25',
                        index === stepIndex && 'bg-current',
                      )}
                    />
                  ))}
            </div>
            <div className="flex items-center gap-2">
              {stepIndex > 0 && (
                <Button
                  variant={step.type === 'primary' ? 'ghost' : 'outline'}
                  size="small"
                  {...step.prevButtonProps}
                  onClick={() => setStep(stepIndex - 1)}
                >
                  {prevLabel}
                </Button>
              )}
              <Button
                variant={step.type === 'primary' ? 'secondary' : 'primary'}
                size="small"
                {...actionButtonProps}
                onClick={() =>
                  stepIndex === steps.length - 1
                    ? close(true)
                    : setStep(stepIndex + 1)
                }
              >
                {stepIndex === steps.length - 1 ? finishLabel : nextLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
})
