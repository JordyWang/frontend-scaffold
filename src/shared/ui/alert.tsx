import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { Icon } from './icon'

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
      className={cn('ui-alert', `ui-alert--${tone}`, className)}
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
      <div className="ui-alert__content">
        <strong>{title}</strong>
        {description && <div>{description}</div>}
      </div>
      {action && <div className="ui-alert__action">{action}</div>}
    </div>
  )
}
