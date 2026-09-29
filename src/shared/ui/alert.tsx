import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { Icon } from './icon'

const toneStyles = {
  info: '',
  success: 'border-[var(--ui-color-success)] bg-[var(--ui-map-success-bg)]',
  warning: 'border-[var(--ui-color-warning)] bg-[var(--ui-map-warning-bg)]',
  error: 'border-[var(--ui-color-error)] bg-[var(--ui-map-error-bg)]',
} as const

export type AlertProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  title: string
  description?: ReactNode
  action?: ReactNode
  tone?: 'info' | 'success' | 'warning' | 'error'
}

export function Alert({
  title,
  description,
  action,
  tone = 'info',
  className,
  ...props
}: AlertProps) {
  return (
    <div
      role={tone === 'error' || tone === 'warning' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-md border border-border bg-[var(--ui-map-info-bg)] p-4 text-foreground',
        toneStyles[tone],
        className,
      )}
      {...props}
    >
      <Icon
        name={
          tone === 'warning' || tone === 'error'
            ? 'warning'
            : tone === 'success'
              ? 'check'
              : 'info'
        }
      />
      <div className="min-w-0 flex-1 leading-6">
        <strong>{title}</strong>
        {description && <div>{description}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
