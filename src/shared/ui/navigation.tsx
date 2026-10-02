import { useId, useState, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { useConfig } from './config-context'

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
  maxItems?: number
  expanded?: boolean
  defaultExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  className?: string
}

const breadcrumbItemStyles =
  'inline-flex min-h-11 max-w-full items-center rounded-[var(--radius-sm)] px-2 py-2 leading-[1.4] text-inherit no-underline'

const breadcrumbActionStyles =
  'touch-manipulation cursor-pointer border-0 bg-transparent outline-none hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** A semantic breadcrumb trail with touch-sized links and a named landmark. */
export function Breadcrumb({
  items,
  separator = '/',
  label = '面包屑导航',
  maxItems,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  className,
}: BreadcrumbProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)
  const isExpanded = expanded ?? internalExpanded
  const id = useId()
  const visibleCount =
    maxItems !== undefined && Number.isFinite(maxItems)
      ? Math.max(3, Math.floor(maxItems))
      : items.length
  const hasOverflow = items.length > visibleCount
  const hiddenEnd = items.length - visibleCount + 1
  const hiddenCount = hasOverflow ? hiddenEnd - 1 : 0
  const hiddenIds = Array.from(
    { length: hiddenCount },
    (_, index) => `${id}-hidden-${index + 1}`,
  )

  return (
    <nav
      aria-label={label}
      className={cn('text-sm text-muted-foreground', className)}
    >
      <ol className="m-0 flex list-none flex-wrap items-center gap-1 p-0">
        {items.map((item, index) => {
          const current = index === items.length - 1
          const key = item.key ?? String(index)
          const isMiddle = hasOverflow && index > 0 && index < hiddenEnd
          return (
            <li
              key={key}
              id={isMiddle ? `${id}-hidden-${index}` : undefined}
              hidden={isMiddle && !isExpanded}
              className={cn(
                'inline-flex min-w-0 items-center gap-1',
                isMiddle && !isExpanded && 'hidden',
              )}
            >
              {current ? (
                <span
                  aria-current="page"
                  className={cn(
                    breadcrumbItemStyles,
                    'font-semibold text-foreground',
                  )}
                >
                  {item.title}
                </span>
              ) : item.disabled ? (
                <span
                  aria-disabled="true"
                  className={cn(breadcrumbItemStyles, 'opacity-50')}
                >
                  {item.title}
                </span>
              ) : item.href ? (
                <a
                  className={cn(breadcrumbItemStyles, breadcrumbActionStyles)}
                  href={item.href}
                  onClick={() => item.onClick?.()}
                >
                  {item.title}
                </a>
              ) : item.onClick ? (
                <button
                  type="button"
                  className={cn(breadcrumbItemStyles, breadcrumbActionStyles)}
                  onClick={item.onClick}
                >
                  {item.title}
                </button>
              ) : (
                <span className={breadcrumbItemStyles}>{item.title}</span>
              )}
              {!current && (
                <span
                  className="select-none text-muted-foreground"
                  aria-hidden="true"
                >
                  {separator}
                </span>
              )}
              {index === 0 && hasOverflow && (
                <span className="inline-flex min-w-0 items-center gap-1">
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={hiddenIds.join(' ')}
                    aria-label={
                      isExpanded
                        ? '收起中间路径'
                        : `展开完整路径，隐藏 ${hiddenCount} 项`
                    }
                    className={cn(
                      breadcrumbItemStyles,
                      breadcrumbActionStyles,
                      'min-w-11 justify-center',
                    )}
                    onClick={() => {
                      if (expanded === undefined)
                        setInternalExpanded(!isExpanded)
                      onExpandedChange?.(!isExpanded)
                    }}
                  >
                    {isExpanded ? '收起' : '…'}
                  </button>
                  <span
                    className="select-none text-muted-foreground"
                    aria-hidden="true"
                  >
                    {separator}
                  </span>
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
  defaultCurrent?: number
  status?: StepStatus
  direction?: 'horizontal' | 'vertical'
  size?: 'default' | 'small'
  percent?: number
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
  current,
  defaultCurrent = 0,
  status = 'process',
  direction = 'horizontal',
  size,
  percent,
  label = '步骤进度',
  onChange,
  className,
}: StepsProps) {
  const { componentSize } = useConfig()
  const resolvedSize = size ?? (componentSize === 'small' ? 'small' : 'default')
  const [internalCurrent, setInternalCurrent] = useState(defaultCurrent)
  const requestedCurrent = current ?? internalCurrent
  const safeCurrent = Number.isFinite(requestedCurrent)
    ? Math.max(0, Math.min(Math.trunc(requestedCurrent), items.length - 1))
    : 0
  const safePercent =
    percent !== undefined && Number.isFinite(percent)
      ? Math.max(0, Math.min(100, percent))
      : undefined
  const id = useId()
  const ringLength = 2 * Math.PI * 19
  return (
    <nav
      aria-label={label}
      data-ui-steps-size={resolvedSize}
      className={cn(
        'w-full',
        direction === 'horizontal' ? 'overflow-x-auto' : 'overflow-visible',
        className,
      )}
    >
      <ol
        className={cn(
          'm-0 flex min-w-max list-none p-0',
          direction === 'horizontal' && safePercent !== undefined && 'p-1',
          direction === 'vertical' && 'min-w-0 flex-col',
        )}
      >
        {items.map((item, index) => {
          const itemStatus = getStepStatus(item, index, safeCurrent, status)
          const stepPercent =
            index === safeCurrent && itemStatus === 'process'
              ? safePercent
              : undefined
          const stepId = `${id}-step-${index}`
          const statusId = `${stepId}-status`
          const clickable = Boolean(onChange)
          const content = (
            <>
              <span
                className={cn(
                  'relative inline-grid shrink-0 place-items-center rounded-full border border-border bg-card font-bold text-inherit',
                  resolvedSize === 'small' ? 'size-7 text-sm' : 'size-9',
                  (itemStatus === 'process' || itemStatus === 'finish') &&
                    'border-primary bg-primary text-primary-foreground',
                  itemStatus === 'error' &&
                    'border-destructive text-destructive',
                )}
                aria-hidden="true"
              >
                {item.icon ?? (itemStatus === 'finish' ? '✓' : index + 1)}
                {stepPercent !== undefined && (
                  <svg
                    viewBox="0 0 44 44"
                    className="pointer-events-none absolute -inset-1 size-[calc(100%+0.5rem)] -rotate-90 overflow-visible"
                    aria-hidden="true"
                  >
                    <circle
                      cx="22"
                      cy="22"
                      r="19"
                      fill="none"
                      strokeWidth="3"
                      className="stroke-border"
                    />
                    {stepPercent > 0 && (
                      <circle
                        cx="22"
                        cy="22"
                        r="19"
                        fill="none"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={ringLength}
                        strokeDashoffset={ringLength * (1 - stepPercent / 100)}
                        className="stroke-primary"
                      />
                    )}
                  </svg>
                )}
              </span>
              <span
                className={cn(
                  'grid min-w-0 gap-0.5 pe-4',
                  resolvedSize === 'small' ? 'pt-0.5 text-sm' : 'pt-1',
                )}
              >
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
              data-ui-step-percent={stepPercent}
              aria-disabled={item.disabled || undefined}
              aria-current={index === safeCurrent ? 'step' : undefined}
              className={cn(
                direction === 'vertical'
                  ? cn(
                      "relative flex min-h-16 min-w-0 flex-1 text-muted-foreground after:absolute after:bottom-0 after:end-auto after:h-auto after:w-px after:bg-border after:content-[''] last:after:hidden",
                      resolvedSize === 'small'
                        ? 'after:start-[14px] after:top-7'
                        : 'after:start-[18px] after:top-9',
                    )
                  : cn(
                      "relative flex flex-1 text-muted-foreground after:absolute after:end-0 after:h-px after:bg-border after:content-[''] last:after:hidden",
                      resolvedSize === 'small'
                        ? 'min-w-36 after:start-8 after:top-[14px] max-sm:min-w-32'
                        : 'min-w-40 after:start-10 after:top-[18px] max-sm:min-w-[8.5rem]',
                    ),
                'data-[status=finish]:text-foreground data-[status=finish]:after:bg-primary data-[status=process]:text-foreground data-[status=error]:text-destructive',
                item.disabled && 'opacity-50',
              )}
            >
              {clickable ? (
                <button
                  id={stepId}
                  type="button"
                  aria-describedby={statusId}
                  className="relative z-[1] flex min-h-11 w-full touch-manipulation items-start gap-2 border-0 bg-transparent p-0 text-start text-inherit outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={item.disabled}
                  onClick={() => {
                    if (current === undefined) setInternalCurrent(index)
                    onChange?.(index)
                  }}
                >
                  {content}
                </button>
              ) : (
                <div
                  id={stepId}
                  aria-describedby={statusId}
                  className="relative z-[1] flex min-h-11 w-full items-start gap-2 text-start text-inherit"
                >
                  {content}
                </div>
              )}
              <span id={statusId} className="sr-only">
                {stepStatusLabels[itemStatus]}
                {stepPercent !== undefined && `，已完成 ${stepPercent}%`}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
