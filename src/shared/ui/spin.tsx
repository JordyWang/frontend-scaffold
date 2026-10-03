import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ForwardedRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { resolveComponentSize, useConfig } from './config-context'
import { usePortalContainer } from './portal-context'
import { spinnerIndicatorStyles, spinnerSizeStyles } from './tailwind-styles'

export type SpinSemanticSlot =
  'root' | 'section' | 'indicator' | 'description' | 'container'
export type SpinSemanticInfo = { props: SpinProps }
export type SpinClassNames =
  | Partial<Record<SpinSemanticSlot, string>>
  | ((info: SpinSemanticInfo) => Partial<Record<SpinSemanticSlot, string>>)
export type SpinStyles =
  | Partial<Record<SpinSemanticSlot, CSSProperties>>
  | ((
      info: SpinSemanticInfo,
    ) => Partial<Record<SpinSemanticSlot, CSSProperties>>)

export type SpinProps = HTMLAttributes<HTMLDivElement> & {
  spinning?: boolean
  delay?: number
  tip?: ReactNode
  description?: ReactNode
  indicator?: ReactNode
  percent?: number | 'auto'
  label?: string
  size?: 'small' | 'default' | 'large'
  fullscreen?: boolean
  classNames?: SpinClassNames
  styles?: SpinStyles
}

const progressCircumference = 2 * Math.PI * 18

/** Loading status for a single control, a content region, or the full screen. */
function SpinComponent(
  spinProps: SpinProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    spinning = true,
    delay = 0,
    tip,
    description,
    indicator,
    percent,
    label = '正在加载',
    size,
    fullscreen = false,
    classNames,
    styles,
    children,
    className,
    style: rootStyle,
    ...props
  } = spinProps
  const { componentSize } = useConfig()
  const portalContainer = usePortalContainer()
  const resolvedSize = resolveComponentSize(componentSize, size)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const safeDelay = Number.isFinite(delay) ? Math.max(0, delay) : 0
  const [delayState, setDelayState] = useState({
    spinning,
    delay: safeDelay,
    visible: spinning && safeDelay === 0,
  })
  if (delayState.spinning !== spinning || delayState.delay !== safeDelay) {
    setDelayState({
      spinning,
      delay: safeDelay,
      visible: spinning && safeDelay === 0,
    })
  }
  const autoEnabled = spinning && percent === 'auto'
  const [autoState, setAutoState] = useState({ enabled: autoEnabled, value: 0 })
  if (autoState.enabled !== autoEnabled) {
    setAutoState({ enabled: autoEnabled, value: 0 })
  }
  const semanticInfo: SpinSemanticInfo = { props: spinProps }
  const semanticClassNames =
    typeof classNames === 'function' ? classNames(semanticInfo) : classNames
  const semanticStyles =
    typeof styles === 'function' ? styles(semanticInfo) : styles

  useEffect(() => {
    if (!spinning || safeDelay === 0) return
    const timeout = window.setTimeout(
      () =>
        setDelayState((current) =>
          current.spinning === spinning && current.delay === safeDelay
            ? { ...current, visible: true }
            : current,
        ),
      safeDelay,
    )
    return () => window.clearTimeout(timeout)
  }, [spinning, safeDelay])

  useEffect(() => {
    if (!autoEnabled) return
    const started = Date.now()
    const update = () => {
      const elapsed = Math.max(0, Date.now() - started)
      const value = Math.min(
        99,
        Math.floor(99 * (1 - Math.exp(-elapsed / 12_000))),
      )
      setAutoState((current) =>
        current.enabled && current.value !== value
          ? { ...current, value }
          : current,
      )
    }
    const timer = window.setInterval(update, 250)
    return () => window.clearInterval(timer)
  }, [autoEnabled])

  const active = spinning && delayState.visible
  const progress =
    percent === 'auto'
      ? autoState.value
      : typeof percent === 'number' && Number.isFinite(percent)
        ? Math.round(Math.max(0, Math.min(100, percent)))
        : undefined
  const resolvedDescription = description ?? tip ?? (fullscreen ? label : null)
  const indicatorNode =
    progress === undefined ? (
      <span
        data-spin-indicator=""
        aria-hidden={indicator === undefined ? undefined : true}
        className={cn('inline-flex', semanticClassNames?.indicator)}
        style={semanticStyles?.indicator}
      >
        {indicator === undefined ? (
          <span
            aria-hidden="true"
            className={cn(
              spinnerIndicatorStyles,
              spinnerSizeStyles[resolvedSize],
            )}
          />
        ) : (
          indicator
        )}
      </span>
    ) : (
      <span
        data-spin-indicator=""
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-valuetext={percent === 'auto' ? `${progress}%（估算）` : undefined}
        className={cn(
          'relative inline-grid size-11 shrink-0 place-items-center',
          semanticClassNames?.indicator,
        )}
        style={semanticStyles?.indicator}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 44 44"
          className="size-11 -rotate-90"
        >
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeWidth="4"
          />
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={progressCircumference}
            strokeDashoffset={progressCircumference * (1 - progress / 100)}
            className="transition-[stroke-dashoffset] duration-200 motion-reduce:transition-none"
          />
        </svg>
        <span
          aria-hidden="true"
          className="absolute text-[10px] font-semibold tabular-nums"
        >
          {progress}%
        </span>
      </span>
    )
  const status = (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      data-spin-section=""
      className={cn(
        'flex flex-col items-center justify-center gap-2 text-primary',
        semanticClassNames?.section,
      )}
      style={semanticStyles?.section}
    >
      {indicatorNode}
      {resolvedDescription !== null && (
        <span
          data-spin-description=""
          className={cn(
            'text-center text-sm text-foreground',
            semanticClassNames?.description,
          )}
          style={semanticStyles?.description}
        >
          {resolvedDescription}
        </span>
      )}
    </div>
  )

  if (fullscreen)
    return (
      <div
        {...props}
        ref={ref}
        data-ui-spin=""
        className={cn(semanticClassNames?.root, className)}
        style={{ ...semanticStyles?.root, ...rootStyle }}
        aria-busy={active}
      >
        {children !== undefined && children !== null && (
          <div
            inert={active}
            aria-hidden={active || undefined}
            className={semanticClassNames?.container}
            style={semanticStyles?.container}
          >
            {children}
          </div>
        )}
        <DialogPrimitive.Root open={active}>
          <DialogPrimitive.Portal container={portalContainer}>
            <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-background/80 backdrop-blur-[2px]" />
            <DialogPrimitive.Content
              aria-describedby={undefined}
              className="fixed inset-0 z-[91] flex min-h-dvh items-center justify-center px-4 outline-none"
              onOpenAutoFocus={() => {
                returnFocusRef.current =
                  document.activeElement instanceof HTMLElement
                    ? document.activeElement
                    : null
              }}
              onCloseAutoFocus={(event) => {
                event.preventDefault()
                if (returnFocusRef.current?.isConnected)
                  returnFocusRef.current.focus()
                returnFocusRef.current = null
              }}
              onEscapeKeyDown={(event) => event.preventDefault()}
              onPointerDownOutside={(event) => event.preventDefault()}
            >
              <DialogPrimitive.Title className="sr-only">
                {label}
              </DialogPrimitive.Title>
              {status}
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      </div>
    )

  if (children === undefined || children === null)
    return (
      <div
        {...props}
        ref={ref}
        data-ui-spin=""
        className={cn(
          'inline-flex min-h-11 min-w-11 items-center justify-center',
          semanticClassNames?.root,
          className,
        )}
        style={{ ...semanticStyles?.root, ...rootStyle }}
        aria-busy={active}
      >
        {active && status}
      </div>
    )

  return (
    <div
      {...props}
      ref={ref}
      data-ui-spin=""
      className={cn('relative min-w-0', semanticClassNames?.root, className)}
      style={{ ...semanticStyles?.root, ...rootStyle }}
      aria-busy={active}
      data-spinning={active || undefined}
    >
      <div
        inert={active}
        aria-hidden={active || undefined}
        className={semanticClassNames?.container}
        style={semanticStyles?.container}
      >
        {children}
      </div>
      {active && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-card/80 p-4 backdrop-blur-[1px]">
          {status}
        </div>
      )}
    </div>
  )
}

export const Spin = forwardRef<HTMLDivElement, SpinProps>(SpinComponent)
