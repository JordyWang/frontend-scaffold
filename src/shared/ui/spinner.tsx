import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'
import { spinnerStyles } from './tailwind-styles'

export type SpinnerProps = HTMLAttributes<HTMLSpanElement> & {
  label?: string
  size?: 'small' | 'default' | 'large'
}

export function Spinner({
  label = '正在加载',
  size = 'default',
  className,
  ...props
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'ui-spinner-standalone inline-flex size-11 items-center justify-center text-primary',
        `ui-spinner-standalone--${size}`,
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'ui-spinner',
          spinnerStyles,
          size === 'small' && 'size-3',
          size === 'large' && 'size-6',
        )}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}
