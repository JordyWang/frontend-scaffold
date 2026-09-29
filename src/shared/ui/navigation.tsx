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

const stepStatusLabels: Record<StepStatus, string> = {
  wait: '待处理',
  process: '进行中',
  finish: '已完成',
  error: '错误',
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
      className={cn(
        'w-full',
        direction === 'horizontal' ? 'overflow-x-auto' : 'overflow-visible',
        className,
      )}
    >
      <ol
        className={cn(
          'm-0 flex min-w-max list-none p-0',
          direction === 'vertical' && 'min-w-0 flex-col',
        )}
      >
        {items.map((item, index) => {
          const itemStatus = getStepStatus(item, index, safeCurrent, status)
          const stepId = `${id}-step-${index}`
          const statusId = `${stepId}-status`
          const clickable = Boolean(onChange)
          const content = (
            <>
              <span
                className={cn(
                  'inline-grid size-9 shrink-0 place-items-center rounded-full border border-border bg-card font-bold text-inherit',
                  (itemStatus === 'process' || itemStatus === 'finish') &&
                    'border-primary bg-primary text-primary-foreground',
                  itemStatus === 'error' &&
                    'border-destructive text-destructive',
                )}
                aria-hidden="true"
              >
                {item.icon ?? (itemStatus === 'finish' ? '✓' : index + 1)}
              </span>
              <span className="grid min-w-0 gap-0.5 pt-1 pe-4">
                <span className="font-semibold">{item.title}</span>
                {item.description && (
                  <span className="text-sm leading-[1.4] text-muted-foreground">
                    {item.description}
                  </span>
                )}
              </span>
            </>
          )
          return (
            <li
              key={item.key ?? `${index}`}
              data-status={itemStatus}
              aria-disabled={item.disabled || undefined}
              aria-current={index === safeCurrent ? 'step' : undefined}
              className={cn(
                direction === 'vertical'
                  ? "relative flex min-h-16 min-w-0 flex-1 text-muted-foreground after:absolute after:bottom-0 after:start-[18px] after:end-auto after:top-9 after:h-auto after:w-px after:bg-border after:content-[''] last:after:hidden"
                  : "relative flex min-w-40 flex-1 text-muted-foreground after:absolute after:start-10 after:end-0 after:top-[18px] after:h-px after:bg-border after:content-[''] last:after:hidden max-sm:min-w-[8.5rem]",
                'data-[status=finish]:text-foreground data-[status=finish]:after:bg-primary data-[status=process]:text-foreground data-[status=error]:text-destructive',
                item.disabled && 'opacity-50',
              )}
            >
              {clickable ? (
                <button
                  id={stepId}
                  type="button"
                  aria-describedby={statusId}
                  className="relative z-[1] flex min-h-11 w-full touch-manipulation items-start gap-2 border-0 bg-transparent p-0 text-left text-inherit outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={item.disabled}
                  onClick={() => onChange?.(index)}
                >
                  {content}
                </button>
              ) : (
                <div
                  id={stepId}
                  aria-describedby={statusId}
                  className="relative z-[1] flex min-h-11 w-full items-start gap-2 text-left text-inherit"
                >
                  {content}
                </div>
              )}
              <span id={statusId} className="sr-only">
                {stepStatusLabels[itemStatus]}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
