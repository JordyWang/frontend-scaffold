import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

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
        'ui-spinner-standalone',
        `ui-spinner-standalone--${size}`,
        className,
      )}
      {...props}
    >
      <span className="ui-spinner" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  )
}
