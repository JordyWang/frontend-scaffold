import { useId, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export type BreadcrumbItem = {
  key?: string
  title: ReactNode
  href?: string
  onClick?: () => void
  disabled?: boolean
}

export type BreadcrumbProps = {
  items: BreadcrumbItem[]
  separator?: ReactNode
  label?: string
  className?: string
}

/** A semantic breadcrumb trail with touch-sized links and a named landmark. */
export function Breadcrumb({
  items,
  separator = '/',
  label = '面包屑导航',
  className,
}: BreadcrumbProps) {
  return (
    <nav aria-label={label} className={cn('ui-breadcrumb', className)}>
      <ol className="ui-breadcrumb__list">
        {items.map((item, index) => {
          const current = index === items.length - 1
          const key = item.key ?? String(index)
          return (
            <li key={key} className="ui-breadcrumb__item">
              {current ? (
                <span aria-current="page" className="ui-breadcrumb__current">
                  {item.title}
                </span>
              ) : item.href ? (
                <a
                  className={cn(
                    'ui-breadcrumb__link',
                    item.disabled && 'ui-breadcrumb__link--disabled',
                  )}
                  href={item.disabled ? undefined : item.href}
                  aria-disabled={item.disabled || undefined}
                  onClick={
                    item.disabled
                      ? (event) => event.preventDefault()
                      : undefined
                  }
                >
                  {item.title}
                </a>
              ) : (
                <button
                  type="button"
                  className="ui-breadcrumb__link"
                  disabled={item.disabled}
                  onClick={item.onClick}
                >
                  {item.title}
                </button>
              )}
              {!current && (
                <span className="ui-breadcrumb__separator" aria-hidden="true">
                  {separator}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export type StepStatus = 'wait' | 'process' | 'finish' | 'error'

export type StepItem = {
  key?: string
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  status?: StepStatus
  disabled?: boolean
}

export type StepsProps = {
  items: StepItem[]
  current?: number
  status?: StepStatus
  direction?: 'horizontal' | 'vertical'
  label?: string
  onChange?: (current: number) => void
  className?: string
}

function getStepStatus(
  item: StepItem,
  index: number,
  current: number,
  status: StepStatus,
): StepStatus {
  if (item.status) return item.status
  if (index < current) return 'finish'
  if (index === current) return status
  return 'wait'
}

/** A progress sequence that exposes the current step to assistive technology. */
export function Steps({
  items,
  current = 0,
  status = 'process',
  direction = 'horizontal',
  label = '步骤进度',
  onChange,
  className,
}: StepsProps) {
  const safeCurrent = Math.max(
    0,
    Math.min(current, Math.max(items.length - 1, 0)),
  )
  const id = useId()
  return (
    <nav
      aria-label={label}
      className={cn('ui-steps', `ui-steps--${direction}`, className)}
    >
      <ol className="ui-steps__list">
        {items.map((item, index) => {
          const itemStatus = getStepStatus(item, index, safeCurrent, status)
          const stepId = `${id}-step-${index}`
          const clickable = Boolean(onChange) && !item.disabled
          const content = (
            <>
              <span className="ui-steps__indicator" aria-hidden="true">
                {item.icon ?? (itemStatus === 'finish' ? '✓' : index + 1)}
              </span>
              <span className="ui-steps__text">
                <span className="ui-steps__title">{item.title}</span>
                {item.description && (
                  <span className="ui-steps__description">
                    {item.description}
                  </span>
                )}
              </span>
            </>
          )
          return (
            <li
              key={item.key ?? `${index}`}
              className={cn('ui-steps__item', `ui-steps__item--${itemStatus}`)}
              aria-current={index === safeCurrent ? 'step' : undefined}
            >
              {clickable ? (
                <button
                  id={stepId}
                  type="button"
                  className="ui-steps__button"
                  disabled={item.disabled}
                  onClick={() => onChange?.(index)}
                >
                  {content}
                </button>
              ) : (
                <div id={stepId} className="ui-steps__button">
                  {content}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
