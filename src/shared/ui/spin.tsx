import {
  forwardRef,
  useEffect,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { resolveComponentSize, useConfig } from './config-context'
import { Portal } from './portal'

export type SpinProps = HTMLAttributes<HTMLDivElement> & {
  spinning?: boolean
  delay?: number
  tip?: ReactNode
  label?: string
  size?: 'small' | 'default' | 'large'
  fullscreen?: boolean
}

const indicatorSizes = {
  small: 'size-4',
  default: 'size-6',
  large: 'size-9',
} as const

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
  const resolvedSize = resolveComponentSize(componentSize, size)
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
        className={cn(
          'shrink-0 animate-spin rounded-full border-[3px] border-current border-r-transparent motion-reduce:animate-none',
          indicatorSizes[resolvedSize],
        )}
      />
      {tip && (
        <span className="text-center text-sm text-foreground">{tip}</span>
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
        {active && (
          <Portal>
            <div className="fixed inset-0 z-[60] flex min-h-dvh items-center justify-center bg-background/80 px-4 backdrop-blur-[2px]">
              {indicator}
            </div>
          </Portal>
        )}
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
