import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { resolveComponentSize, useConfig } from './config-context'
import { usePortalContainer } from './portal-context'
import { spinnerIndicatorStyles, spinnerSizeStyles } from './tailwind-styles'

export type SpinProps = HTMLAttributes<HTMLDivElement> & {
  spinning?: boolean
  delay?: number
  tip?: ReactNode
  label?: string
  size?: 'small' | 'default' | 'large'
  fullscreen?: boolean
}

/** Loading status for a single control, a content region, or the full screen. */
export const Spin = forwardRef<HTMLDivElement, SpinProps>(function Spin(
  {
    spinning = true,
    delay = 0,
    tip,
    label = '正在加载',
    size,
    fullscreen = false,
    children,
    className,
    ...props
  },
  ref,
) {
  const { componentSize } = useConfig()
  const portalContainer = usePortalContainer()
  const resolvedSize = resolveComponentSize(componentSize, size)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const safeDelay = Number.isFinite(delay) ? Math.max(0, delay) : 0
  const [visible, setVisible] = useState(spinning && safeDelay === 0)

  useEffect(() => {
    if (!spinning) {
      setVisible(false)
      return
    }
    if (safeDelay === 0) {
      setVisible(true)
      return
    }
    const timeout = window.setTimeout(() => setVisible(true), safeDelay)
    return () => window.clearTimeout(timeout)
  }, [spinning, safeDelay])

  const active = spinning && visible
  const indicator = (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="flex flex-col items-center justify-center gap-2 text-primary"
    >
      <span
        aria-hidden="true"
        className={cn(spinnerIndicatorStyles, spinnerSizeStyles[resolvedSize])}
      />
      {(tip || fullscreen) && (
        <span className="text-center text-sm text-foreground">
          {tip ?? label}
        </span>
      )}
    </div>
  )

  if (fullscreen)
    return (
      <div {...props} ref={ref} className={className} aria-busy={active}>
        {children !== undefined && children !== null && (
          <div inert={active} aria-hidden={active || undefined}>
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
              {indicator}
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
        className={cn(
          'inline-flex min-h-11 min-w-11 items-center justify-center',
          className,
        )}
        aria-busy={active}
      >
        {active && indicator}
      </div>
    )

  return (
    <div
      {...props}
      ref={ref}
      className={cn('relative min-w-0', className)}
      aria-busy={active}
      data-spinning={active || undefined}
    >
      <div inert={active} aria-hidden={active || undefined}>
        {children}
      </div>
      {active && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-card/80 p-4 backdrop-blur-[1px]">
          {indicator}
        </div>
      )}
    </div>
  )
})
