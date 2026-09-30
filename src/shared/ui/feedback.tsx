import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { Icon } from './icon'

export type ProgressProps = {
  percent?: number
  status?: 'normal' | 'active' | 'success' | 'exception'
  type?: 'line' | 'circle'
  steps?: number
  showInfo?: boolean
  strokeWidth?: number
  label?: string
  format?: (percent: number) => ReactNode
  className?: string
}

/** A token-driven progress indicator with a real progressbar value. */
export function Progress({
  percent = 0,
  status = 'normal',
  type = 'line',
  steps,
  showInfo = true,
  strokeWidth = 8,
  label = '进度',
  format,
  className,
}: ProgressProps) {
  const safePercent = Number.isFinite(percent) ? percent : 0
  const value = Math.max(0, Math.min(safePercent, 100))
  const safeStrokeWidth = Number.isFinite(strokeWidth)
    ? Math.max(1, strokeWidth)
    : 8
  const text = format ? format(value) : `${value}%`
  const style = { '--ui-progress-value': `${value}%` } as CSSProperties
  const stepCount =
    Number.isFinite(steps) && steps !== undefined
      ? Math.max(1, Math.floor(steps))
      : 0
  const color =
    status === 'success'
      ? 'var(--ui-seed-success)'
      : status === 'exception'
        ? 'var(--destructive)'
        : 'var(--primary)'
  if (type === 'circle') {
    return (
      <div
        className={cn('inline-grid size-28 place-items-center', className)}
        style={
          {
            ...style,
            '--ui-progress-stroke': `${safeStrokeWidth}px`,
            '--ui-progress-color': color,
          } as CSSProperties
        }
      >
        <div
          className="relative grid size-full place-items-center rounded-full"
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          style={{
            background:
              'conic-gradient(var(--ui-progress-color) var(--ui-progress-value), var(--secondary) 0)',
          }}
        >
          <span
            aria-hidden="true"
            className="absolute inset-[var(--ui-progress-stroke)] rounded-full bg-card"
          />
          {showInfo && (
            <span className="relative z-[1] text-center font-semibold text-foreground">
              {text}
            </span>
          )}
        </div>
      </div>
    )
  }
  if (stepCount > 0) {
    const progressRatio = (value / 100) * stepCount
    const segmentClass = cn(
      'block h-full rounded-[inherit] transition-[width] duration-200 motion-reduce:transition-none',
      status === 'active' &&
        'bg-gradient-to-r from-primary to-[var(--ui-map-primary-hover)]',
      status === 'success' && 'bg-[var(--ui-seed-success)]',
      status === 'exception' && 'bg-destructive',
      status === 'normal' && 'bg-primary',
    )
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center gap-2">
          <div
            className="flex min-w-0 flex-1 gap-1"
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={value}
            data-ui-progress-steps={stepCount}
          >
            {Array.from({ length: stepCount }, (_, index) => {
              const segmentValue = Math.round(
                Math.min(100, Math.max(0, (progressRatio - index) * 100)),
              )
              return (
                <span
                  key={index}
                  className="min-w-0 flex-1 overflow-hidden rounded-[var(--radius-sm)] bg-secondary"
                  data-ui-progress-step={index}
                >
                  <span
                    className={segmentClass}
                    style={{ width: `${segmentValue}%` }}
                    data-ui-progress-step-value={segmentValue}
                  />
                </span>
              )
            })}
          </div>
          {showInfo && (
            <span className="min-w-12 shrink-0 text-end text-sm tabular-nums text-muted-foreground">
              {text}
            </span>
          )}
        </div>
      </div>
    )
  }
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center gap-2">
        <div
          className="relative min-w-0 flex-1 overflow-hidden rounded-full bg-secondary"
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          style={{ minHeight: safeStrokeWidth }}
        >
          <span
            className={cn(
              'block min-h-[inherit] w-[var(--ui-progress-value)] rounded-[inherit] transition-[width] duration-200 motion-reduce:transition-none',
              status === 'active' &&
                'bg-gradient-to-r from-primary to-[var(--ui-map-primary-hover)]',
              status === 'success' && 'bg-[var(--ui-seed-success)]',
              status === 'exception' && 'bg-destructive',
              status === 'normal' && 'bg-primary',
            )}
            style={style}
          />
        </div>
        {showInfo && (
          <span className="min-w-12 shrink-0 text-end text-sm tabular-nums text-muted-foreground">
            {text}
          </span>
        )}
      </div>
    </div>
  )
}

export type ResultStatus =
  'success' | 'error' | 'info' | 'warning' | '404' | '403' | '500'

export type ResultProps = {
  status?: ResultStatus
  title: ReactNode
  subTitle?: ReactNode
  extra?: ReactNode
  icon?: ReactNode
  className?: string
}

const resultIcon: Record<ResultStatus, 'check' | 'warning' | 'info'> = {
  success: 'check',
  error: 'warning',
  info: 'info',
  warning: 'warning',
  '404': 'info',
  '403': 'warning',
  '500': 'warning',
}

/** A centered outcome state for completed, empty and failed flows. */
export function Result({
  status = 'info',
  title,
  subTitle,
  extra,
  icon,
  className,
}: ResultProps) {
  const iconClassName =
    status === 'success'
      ? 'bg-[var(--ui-map-success-bg)] text-[var(--ui-color-success)]'
      : status === 'error' || status === '500' || status === '403'
        ? 'bg-[var(--ui-map-error-bg)] text-[var(--ui-color-error)]'
        : status === 'warning'
          ? 'bg-[var(--ui-map-warning-bg)] text-[var(--ui-color-warning)]'
          : 'bg-[var(--ui-map-info-bg)] text-primary'
  return (
    <section
      className={cn(
        'grid justify-items-center gap-2 px-6 py-8 text-center',
        className,
      )}
    >
      <div
        className={cn(
          'grid size-[4.5rem] place-items-center rounded-full',
          iconClassName,
        )}
        aria-hidden={icon ? undefined : true}
      >
        {icon ?? <Icon name={resultIcon[status]} size={48} />}
      </div>
      <h2 className="m-0 text-xl leading-tight sm:text-2xl">{title}</h2>
      {subTitle && (
        <p className="m-0 max-w-[40rem] leading-relaxed text-muted-foreground">
          {subTitle}
        </p>
      )}
      {extra && (
        <div className="mt-2 flex flex-wrap justify-center gap-2">{extra}</div>
      )}
    </section>
  )
}
