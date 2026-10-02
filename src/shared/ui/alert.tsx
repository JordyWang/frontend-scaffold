import {
  useEffect,
  useRef,
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
  info: 'border-primary/40',
  success: 'border-[var(--ui-color-success)] bg-[var(--ui-map-success-bg)]',
  warning: 'border-[var(--ui-color-warning)] bg-[var(--ui-map-warning-bg)]',
  error: 'border-[var(--ui-color-error)] bg-[var(--ui-map-error-bg)]',
} as const

export type AlertProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  tone?: 'info' | 'success' | 'warning' | 'error'
  banner?: boolean
  showIcon?: boolean
  icon?: ReactNode
  closable?: boolean
  closeIcon?: ReactNode
  closeLabel?: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onDismiss?: (event: MouseEvent<HTMLButtonElement>) => void
  afterClose?: () => void
}

export function Alert({
  title,
  description,
  action,
  tone = 'info',
  banner = false,
  showIcon = true,
  icon,
  closable = false,
  closeIcon,
  closeLabel,
  open,
  defaultOpen = true,
  onOpenChange,
  onDismiss,
  afterClose,
  className,
  ...props
}: AlertProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const visible = open ?? internalOpen
  const previousOpen = useRef(visible)

  useEffect(() => {
    if (previousOpen.current && !visible) afterClose?.()
    previousOpen.current = visible
  }, [afterClose, visible])

  if (!visible) return null

  const defaultIcon = (
    <Icon
      name={
        tone === 'warning' || tone === 'error'
          ? 'warning'
          : tone === 'success'
            ? 'check'
            : 'info'
      }
    />
  )
  const titleLabel = typeof title === 'string' ? title : '提示'

  return (
    <div
      role={tone === 'error' || tone === 'warning' ? 'alert' : 'status'}
      data-alert=""
      data-alert-banner={banner || undefined}
      className={cn(
        'flex items-start gap-2 rounded-md border border-border bg-[var(--ui-map-info-bg)] p-4 text-foreground',
        toneStyles[tone],
        banner && 'rounded-none border-x-0',
        className,
      )}
      {...props}
    >
      {showIcon && (
        <span
          data-alert-icon=""
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-current"
        >
          {icon === undefined ? defaultIcon : icon}
        </span>
      )}
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
          aria-label={closeLabel ?? `关闭${titleLabel}`}
          className="-my-2 -me-2 shrink-0 text-muted-foreground"
          onClick={(event) => {
            if (open === undefined) setInternalOpen(false)
            onOpenChange?.(false)
            onDismiss?.(event)
          }}
        >
          {closeIcon === undefined ? <CloseIcon /> : closeIcon}
        </Button>
      )}
    </div>
  )
}
