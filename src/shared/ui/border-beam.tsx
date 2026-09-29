import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export type BorderBeamProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> & {
  children: ReactNode
  color?: string
  duration?: number
  borderWidth?: number
  anchor?: number
  reverse?: boolean
}

/** Decorative animated border that keeps content semantics and touch behavior intact. */
export function BorderBeam({
  children,
  color = 'var(--primary)',
  duration = 6,
  borderWidth = 1,
  anchor = 0,
  reverse = false,
  className,
  style,
  ...props
}: BorderBeamProps) {
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 6
  const safeWidth =
    Number.isFinite(borderWidth) && borderWidth > 0 ? borderWidth : 1
  const safeAnchor = Number.isFinite(anchor) ? anchor : 0
  const gradient = `conic-gradient(from ${safeAnchor}deg, transparent 0deg, transparent 300deg, ${color} 340deg, transparent 360deg)`

  return (
    <div
      {...props}
      data-border-beam=""
      className={cn(
        'relative isolate overflow-hidden rounded-[var(--ui-card-radius)] p-px',
        className,
      )}
      style={{ ...style, padding: safeWidth }}
    >
      <span
        aria-hidden="true"
        data-border-beam-light=""
        className="pointer-events-none absolute inset-[-200%] motion-safe:animate-spin"
        style={{
          background: gradient,
          animationDuration: `${safeDuration}s`,
          animationDirection: reverse ? 'reverse' : 'normal',
        }}
      />
      <div className="relative z-[1] min-w-0 rounded-[calc(var(--ui-card-radius)-var(--ui-radius-adjustment))] bg-card text-card-foreground">
        {children}
      </div>
    </div>
  )
}
