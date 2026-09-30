import {
  useState,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { Button } from './button'
import { Icon } from './icon'
import { CloseIcon } from './icons'

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
  closable?: boolean
  closeLabel?: string
  onDismiss?: (event: MouseEvent<HTMLButtonElement>) => void
}

export function Alert({
  title,
  description,
  action,
  tone = 'info',
  closable = false,
  closeLabel,
  onDismiss,
  className,
  ...props
}: AlertProps) {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

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
      <div className="flex min-w-0 flex-1 flex-wrap items-start gap-x-3 gap-y-2">
        <div className="min-w-0 flex-[1_1_12rem] break-words leading-6">
          <strong>{title}</strong>
          {description && <div>{description}</div>}
        </div>
        {action && <div className="max-w-full shrink-0">{action}</div>}
      </div>
      {closable && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={closeLabel ?? `关闭${title}`}
          className="-my-2 -me-2 shrink-0 text-muted-foreground"
          onClick={(event) => {
            setVisible(false)
            onDismiss?.(event)
          }}
        >
          <CloseIcon />
        </Button>
      )}
    </div>
  )
}
