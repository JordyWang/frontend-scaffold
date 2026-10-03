import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
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
export type TourArrow = boolean | { pointAtCenter?: boolean }
export type TourMask =
  boolean | { color?: string; className?: string; style?: CSSProperties }
export type TourSemanticSlot =
  | 'root'
  | 'mask'
  | 'highlight'
  | 'arrow'
  | 'card'
  | 'close'
  | 'cover'
  | 'title'
  | 'description'
  | 'indicators'
  | 'actions'
export type TourClassNames = Partial<Record<TourSemanticSlot, string>>
export type TourStyles = Partial<Record<TourSemanticSlot, CSSProperties>>

export type TourStep = {
  key: string
  target?: TourTarget
  title: ReactNode
  description?: ReactNode
  cover?: ReactNode
  placement?: TourPlacement
  mask?: TourMask
  arrow?: TourArrow
  closeIcon?: ReactNode
  type?: 'default' | 'primary'
  nextButtonProps?: ButtonProps
  prevButtonProps?: ButtonProps
  onClose?: () => void
  scrollIntoViewOptions?: boolean | ScrollIntoViewOptions
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
  mask?: TourMask
  maskClosable?: boolean
  closeIcon?: ReactNode
  disabledInteraction?: boolean
  arrow?: TourArrow
  type?: 'default' | 'primary'
  keyboard?: boolean
  placement?: TourPlacement
  gap?: number | [offset: number, radius: number]
  scrollIntoViewOptions?: boolean | ScrollIntoViewOptions
  closeLabel?: string
  nextLabel?: string
  prevLabel?: string
  finishLabel?: string
  indicatorsRender?: (current: number, total: number) => ReactNode
  actionsRender?: (
    defaultActions: ReactNode,
    info: { current: number; total: number },
  ) => ReactNode
  getPopupContainer?: (target: HTMLElement) => HTMLElement
  zIndex?: number
  classNames?: TourClassNames
  styles?: TourStyles
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
      side: null,
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
    side: chosen,
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
    closeIcon = true,
    disabledInteraction = false,
    arrow = true,
    type = 'default',
    keyboard = true,
    placement: defaultPlacement = 'bottom',
    gap = [6, 8],
    scrollIntoViewOptions = true,
    closeLabel = '关闭引导',
    nextLabel = '下一步',
    prevLabel = '上一步',
    finishLabel = '完成',
    indicatorsRender,
    actionsRender,
    getPopupContainer,
    zIndex = 70,
    classNames,
    styles,
    returnFocusRef,
    className,
    style: rootStyle,
    'aria-label': tourLabel = '页面引导',
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
  const resolvedMask = step?.mask === undefined ? mask : step.mask
  const hasMask = resolvedMask !== false
  const maskOptions =
    typeof step?.mask === 'object'
      ? step.mask
      : typeof mask === 'object'
        ? mask
        : undefined
  const resolvedCloseIcon =
    step?.closeIcon === undefined ? closeIcon : step.closeIcon
  const resolvedScrollIntoViewOptions =
    step?.scrollIntoViewOptions ?? scrollIntoViewOptions

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
      else {
        step?.onClose?.()
        onClose?.()
      }
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
        if (
          hasMask &&
          !card.contains(active) &&
          (disabledInteraction || !target?.contains(active))
        ) {
          const preferred =
            card.querySelector<HTMLElement>('[data-tour-close]') ??
            card.querySelector<HTMLElement>(focusableSelector) ??
            card
          preferred.focus()
        }
      })
    },
    [
      disabledInteraction,
      hasMask,
      onClose,
      onFinish,
      open,
      returnFocusRef,
      step,
    ],
  )

  useLayoutEffect(() => {
    if (!isOpen || !step) return
    const element = targetElement(step.target)
    if (resolvedScrollIntoViewOptions && element) {
      element.scrollIntoView(
        resolvedScrollIntoViewOptions === true
          ? { block: 'nearest', inline: 'nearest' }
          : resolvedScrollIntoViewOptions,
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
  }, [isOpen, step, resolvedScrollIntoViewOptions])

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
    if (!isOpen || !step || !disabledInteraction) return
    const target = targetElement(step.target)
    if (!target || (cardRef.current && target.contains(cardRef.current))) return
    const wasInert = target.hasAttribute('inert')
    target.setAttribute('inert', '')
    return () => {
      if (!wasInert) target.removeAttribute('inert')
    }
  }, [disabledInteraction, isOpen, step])

  useEffect(() => {
    if (!isOpen) return
    const focusTarget = targetElement(step?.target)
    const frame = window.requestAnimationFrame(() => {
      const preferred =
        cardRef.current?.querySelector<HTMLElement>('[data-tour-close]') ??
        cardRef.current?.querySelector<HTMLElement>(focusableSelector) ??
        cardRef.current
      preferred?.focus()
      if (focusTarget && !hasMask && !disabledInteraction)
        focusTarget.setAttribute('data-tour-focus-target', '')
    })
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (hasMask && event.key === 'Tab') {
        const focusable = [
          ...focusableElements(cardRef.current),
          ...(disabledInteraction ? [] : focusableElements(focusTarget)),
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
  }, [
    isOpen,
    stepIndex,
    steps.length,
    keyboard,
    hasMask,
    disabledInteraction,
    step,
    close,
    setStep,
  ])

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
  const resolvedType = step.type ?? type
  const resolvedArrow = step.arrow ?? arrow
  const showArrow = resolvedArrow !== false && position.side !== null
  const pointAtCenter =
    typeof resolvedArrow === 'object' && resolvedArrow.pointAtCenter === true
  const arrowSize = 12
  const arrowInset = 16
  const targetInsetX = Math.min(12, targetRect.width / 2)
  const targetInsetY = Math.min(12, targetRect.height / 2)
  const arrowAimX = pointAtCenter
    ? targetRect.left + targetRect.width / 2
    : Math.max(
        targetRect.left + targetInsetX,
        Math.min(
          position.left + cardWidth / 2,
          targetRect.right - targetInsetX,
        ),
      )
  const arrowAimY = pointAtCenter
    ? targetRect.top + targetRect.height / 2
    : Math.max(
        targetRect.top + targetInsetY,
        Math.min(
          position.top + cardHeight / 2,
          targetRect.bottom - targetInsetY,
        ),
      )
  const arrowX = Math.max(
    position.left + arrowInset,
    Math.min(
      arrowAimX - arrowSize / 2,
      position.left + cardWidth - arrowInset - arrowSize,
    ),
  )
  const arrowY = Math.max(
    position.top + arrowInset,
    Math.min(
      arrowAimY - arrowSize / 2,
      position.top + cardHeight - arrowInset - arrowSize,
    ),
  )
  const arrowStyle =
    position.side === 'top'
      ? { left: arrowX, top: position.top + cardHeight - arrowSize / 2 }
      : position.side === 'bottom'
        ? { left: arrowX, top: position.top - arrowSize / 2 }
        : position.side === 'left'
          ? { left: position.left + cardWidth - arrowSize / 2, top: arrowY }
          : { left: position.left - arrowSize / 2, top: arrowY }
  const maskClassName = maskOptions?.className
  const maskStyle: CSSProperties = {
    ...styles?.mask,
    ...maskOptions?.style,
    ...(maskOptions?.color ? { backgroundColor: maskOptions.color } : {}),
  }
  const targetStyle = targetRect.width
    ? {
        top: targetRect.top - offset,
        left: targetRect.left - offset,
        width: targetRect.width + offset * 2,
        height: targetRect.height + offset * 2,
        borderRadius: radius,
      }
    : undefined
  const nextButtonProps = step.nextButtonProps
  const prevButtonProps = step.prevButtonProps
  const defaultActions = (
    <>
      {stepIndex > 0 && (
        <Button
          variant={resolvedType === 'primary' ? 'ghost' : 'outline'}
          size="small"
          {...prevButtonProps}
          onClick={(event) => {
            prevButtonProps?.onClick?.(event)
            if (!event.defaultPrevented) setStep(stepIndex - 1)
          }}
        >
          {prevButtonProps?.children ?? prevLabel}
        </Button>
      )}
      <Button
        variant={resolvedType === 'primary' ? 'secondary' : 'primary'}
        size="small"
        {...nextButtonProps}
        onClick={(event) => {
          nextButtonProps?.onClick?.(event)
          if (event.defaultPrevented) return
          if (stepIndex === steps.length - 1) close(true)
          else setStep(stepIndex + 1)
        }}
      >
        {nextButtonProps?.children ??
          (stepIndex === steps.length - 1 ? finishLabel : nextLabel)}
      </Button>
    </>
  )
  const renderedActions = actionsRender
    ? actionsRender(defaultActions, { current: stepIndex, total: steps.length })
    : defaultActions
  const popupContainer = getPopupContainer?.(
    targetElement(step.target) ?? document.body,
  )

  return (
    <Portal container={popupContainer}>
      <div
        {...props}
        ref={forwardedRef}
        data-tour-root=""
        className={cn(
          'pointer-events-none fixed inset-0',
          classNames?.root,
          className,
        )}
        style={{ ...styles?.root, ...rootStyle, zIndex }}
        aria-label={tourLabel}
      >
        {hasMask && targetStyle && (
          <>
            <div
              data-tour-mask=""
              aria-hidden="true"
              className={cn(
                'fixed inset-x-0 top-0 pointer-events-auto bg-slate-950/55',
                maskClassName,
                classNames?.mask,
              )}
              style={{
                ...maskStyle,
                height: Math.max(0, targetRect.top - offset),
              }}
              onClick={() => maskClosable && close()}
            />
            <div
              data-tour-mask=""
              aria-hidden="true"
              className={cn(
                'fixed bottom-0 left-0 pointer-events-auto bg-slate-950/55',
                maskClassName,
                classNames?.mask,
              )}
              style={{
                ...maskStyle,
                top: targetRect.bottom + offset,
                width: '100%',
              }}
              onClick={() => maskClosable && close()}
            />
            <div
              data-tour-mask=""
              aria-hidden="true"
              className={cn(
                'fixed left-0 pointer-events-auto bg-slate-950/55',
                maskClassName,
                classNames?.mask,
              )}
              style={{
                ...maskStyle,
                top: targetRect.top - offset,
                width: Math.max(0, targetRect.left - offset),
                height: targetRect.height + offset * 2,
              }}
              onClick={() => maskClosable && close()}
            />
            <div
              data-tour-mask=""
              aria-hidden="true"
              className={cn(
                'fixed right-0 pointer-events-auto bg-slate-950/55',
                maskClassName,
                classNames?.mask,
              )}
              style={{
                ...maskStyle,
                top: targetRect.top - offset,
                width: Math.max(0, viewport.width - targetRect.right - offset),
                height: targetRect.height + offset * 2,
              }}
              onClick={() => maskClosable && close()}
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
              classNames?.mask,
            )}
            style={maskStyle}
            onClick={() => maskClosable && close()}
          />
        )}
        {targetStyle && (hasMask || disabledInteraction) && (
          <div
            aria-hidden="true"
            data-tour-highlight=""
            className={cn(
              'pointer-events-none fixed border-2 border-primary shadow-[0_0_0_2px_color-mix(in_srgb,var(--primary)_35%,transparent)]',
              disabledInteraction && 'pointer-events-auto cursor-not-allowed',
              classNames?.highlight,
            )}
            style={{ ...styles?.highlight, ...targetStyle }}
          />
        )}
        {showArrow && (
          <div
            aria-hidden="true"
            data-tour-arrow={position.side}
            className={cn(
              'pointer-events-none fixed z-[71] size-3 rotate-45 border',
              resolvedType === 'primary'
                ? 'border-primary bg-primary'
                : 'border-border bg-card',
              classNames?.arrow,
            )}
            style={{ ...styles?.arrow, ...arrowStyle }}
          />
        )}
        <div
          ref={cardRef}
          role="dialog"
          tabIndex={-1}
          aria-modal={
            hasMask && (!targetRect.width || disabledInteraction)
              ? true
              : undefined
          }
          aria-label={typeof step.title === 'string' ? step.title : tourLabel}
          data-tour-card=""
          className={cn(
            'pointer-events-auto fixed z-[71] max-h-[calc(100dvh-24px)] max-w-[calc(100vw-24px)] overflow-y-auto overscroll-contain rounded-xl border p-4 text-sm shadow-xl outline-none sm:p-5',
            resolvedType === 'primary'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card text-card-foreground',
            classNames?.card,
          )}
          style={{
            ...styles?.card,
            width: cardWidth,
            left: position.left,
            top: position.top,
          }}
        >
          {resolvedCloseIcon !== false && resolvedCloseIcon !== null && (
            <button
              type="button"
              data-tour-close=""
              aria-label={closeLabel}
              className={cn(
                'absolute end-2 top-2 inline-flex size-11 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] text-current/70 hover:bg-black/10 hover:text-current focus-visible:outline-2 focus-visible:outline-ring',
                classNames?.close,
              )}
              style={styles?.close}
              onClick={() => close()}
            >
              <span aria-hidden="true" className="text-xl leading-none">
                {resolvedCloseIcon === true ? '×' : resolvedCloseIcon}
              </span>
            </button>
          )}
          {step.cover && (
            <div
              data-tour-cover=""
              className={cn(
                'mb-3 overflow-hidden rounded-lg',
                classNames?.cover,
              )}
              style={styles?.cover}
            >
              {step.cover}
            </div>
          )}
          <div
            data-tour-title=""
            className={cn(
              'font-semibold',
              resolvedCloseIcon !== false &&
                resolvedCloseIcon !== null &&
                'pe-9',
              classNames?.title,
            )}
            style={styles?.title}
          >
            {step.title}
          </div>
          {step.description && (
            <div
              data-tour-description=""
              className={cn(
                'mt-2 leading-6 text-current/80',
                classNames?.description,
              )}
              style={styles?.description}
            >
              {step.description}
            </div>
          )}
          <div className="mt-4 flex min-h-11 items-center justify-between gap-3">
            <div
              data-tour-indicators=""
              className={cn(
                'inline-flex items-center gap-1',
                classNames?.indicators,
              )}
              style={styles?.indicators}
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
            <div
              data-tour-actions=""
              className={cn('flex items-center gap-2', classNames?.actions)}
              style={styles?.actions}
            >
              {renderedActions}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
})
