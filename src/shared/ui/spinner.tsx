import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'
import { resolveComponentSize, useConfig } from './config-context'
import { spinnerIndicatorStyles, spinnerSizeStyles } from './tailwind-styles'

export type SpinnerProps = HTMLAttributes<HTMLSpanElement> & {
  label?: string
  size?: 'small' | 'default' | 'large'
}

export function Spinner({
  label = '正在加载',
  size,
  className,
  ...props
}: SpinnerProps) {
  const { componentSize } = useConfig()
  const resolvedSize = resolveComponentSize(componentSize, size)
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn(
        'inline-flex size-11 items-center justify-center text-primary',
        className,
      )}
      {...props}
    >
      <span
        className={cn(spinnerIndicatorStyles, spinnerSizeStyles[resolvedSize])}
        aria-hidden="true"
      />
    </span>
  )
}
