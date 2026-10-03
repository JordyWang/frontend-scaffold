import { useId } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { useConfig } from './config-context'
import { Icon } from './icon'

export type ProgressSteps = number | { count: number; gap?: number }

export type ProgressProps = {
  percent?: number
  successPercent?: number
  status?: 'normal' | 'active' | 'success' | 'exception'
  type?: 'line' | 'circle' | 'dashboard'
  size?: 'default' | 'small'
  steps?: ProgressSteps
  gapDegree?: number
  gapPlacement?: 'top' | 'bottom' | 'start' | 'end'
  showInfo?: boolean
  strokeWidth?: number
  label?: string
  format?: (percent: number, successPercent?: number) => ReactNode
  className?: string
}

const progressSize = 112

function progressArcPath(
  start: number,
  sweep: number,
  radius: number,
  canvasSize = progressSize,
) {
  if (sweep <= 0) return ''
  const point = (angle: number) => {
    const radians = (angle * Math.PI) / 180
    const x = canvasSize / 2 + radius * Math.sin(radians)
    const y = canvasSize / 2 - radius * Math.cos(radians)
    return `${x.toFixed(3)} ${y.toFixed(3)}`
  }
  if (sweep >= 360) {
    return `M ${point(start)} A ${radius} ${radius} 0 1 1 ${point(start + 180)} A ${radius} ${radius} 0 1 1 ${point(start + 360)}`
  }
  return `M ${point(start)} A ${radius} ${radius} 0 ${sweep > 180 ? 1 : 0} 1 ${point(start + sweep)}`
}

/** A token-driven progress indicator with a real progressbar value. */
export function Progress({
  percent = 0,
  successPercent,
  status = 'normal',
  type = 'line',
  size,
  steps,
  gapDegree = 75,
  gapPlacement = 'bottom',
  showInfo = true,
  strokeWidth,
  label = '进度',
  format,
  className,
}: ProgressProps) {
  const { direction, componentSize } = useConfig()
  const resolvedSize = size ?? (componentSize === 'small' ? 'small' : 'default')
  const canvasSize = resolvedSize === 'small' ? 64 : progressSize
  const safePercent = Number.isFinite(percent) ? percent : 0
  const value = Math.max(0, Math.min(safePercent, 100))
  const completed =
    successPercent !== undefined && Number.isFinite(successPercent)
      ? Math.max(0, Math.min(successPercent, value))
      : undefined
  const safeStrokeWidth =
    typeof strokeWidth === 'number' && Number.isFinite(strokeWidth)
      ? Math.max(1, strokeWidth)
      : resolvedSize === 'small'
        ? 6
        : 8
  const text = format ? format(value, completed) : `${value}%`
  const valueText =
    completed === undefined ? undefined : `${value}%，其中已完成 ${completed}%`
  const requestedSteps = typeof steps === 'number' ? steps : steps?.count
  const stepCount =
    requestedSteps !== undefined &&
    Number.isFinite(requestedSteps) &&
    requestedSteps > 0
      ? Math.min(100, Math.max(1, Math.floor(requestedSteps)))
      : 0
  const requestedGap = typeof steps === 'object' ? steps.gap : undefined
  const ringColorClass =
    status === 'success'
      ? 'text-[var(--ui-seed-success)]'
      : status === 'exception'
        ? 'text-destructive'
        : 'text-primary'
  if (type === 'circle' || type === 'dashboard') {
    const stroke = Math.min(safeStrokeWidth, canvasSize === 64 ? 28 : 48)
    const radius = (canvasSize - stroke) / 2
    const safeGapDegree =
      Number.isFinite(gapDegree) && type === 'dashboard'
        ? Math.max(0, Math.min(295, gapDegree))
        : type === 'dashboard'
          ? 75
          : 0
    const gapCenter =
      gapPlacement === 'top'
        ? 0
        : gapPlacement === 'start'
          ? direction === 'rtl'
            ? 90
            : 270
          : gapPlacement === 'end'
            ? direction === 'rtl'
              ? 270
              : 90
            : 180
    const start = type === 'dashboard' ? gapCenter + safeGapDegree / 2 : 0
    const sweep = 360 - safeGapDegree
    const defaultGap = 2
    const gap =
      requestedGap !== undefined && Number.isFinite(requestedGap)
        ? Math.max(0, requestedGap)
        : defaultGap
    const maxGap =
      stepCount > 1
        ? (radius * ((sweep * Math.PI) / 180) * 0.8) / (stepCount - 1)
        : 0
    const effectiveGap = Math.min(gap, maxGap)
    const gapAngle = (effectiveGap / (2 * Math.PI * radius)) * 360
    const stepSweep =
      stepCount > 0 ? (sweep - gapAngle * (stepCount - 1)) / stepCount : 0
    const progressRatio = (value / 100) * stepCount
    const trackPath = progressArcPath(start, sweep, radius, canvasSize)
    const valuePath = progressArcPath(
      start,
      (sweep * value) / 100,
      radius,
      canvasSize,
    )
    const successPath =
      completed === undefined
        ? ''
        : progressArcPath(start, (sweep * completed) / 100, radius, canvasSize)
    return (
      <div
        className={cn(
          'relative inline-grid place-items-center',
          resolvedSize === 'small' ? 'size-16' : 'size-28',
          ringColorClass,
          className,
        )}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-valuetext={valueText}
        data-ui-progress-type={type}
        data-ui-progress-size={resolvedSize}
        data-ui-progress-success-percent={completed}
        data-ui-progress-steps={stepCount || undefined}
        data-ui-progress-gap-degree={
          type === 'dashboard' ? safeGapDegree : undefined
        }
        data-ui-progress-gap-placement={
          type === 'dashboard' ? gapPlacement : undefined
        }
        data-ui-progress-step-gap={stepCount > 0 ? effectiveGap : undefined}
      >
        <svg
          aria-hidden="true"
          className="absolute inset-0 size-full"
          viewBox={`0 0 ${canvasSize} ${canvasSize}`}
          fill="none"
        >
          {stepCount > 0 ? (
            Array.from({ length: stepCount }, (_, index) => {
              const segmentValue = Math.round(
                Math.min(100, Math.max(0, (progressRatio - index) * 100)),
              )
              const successSegmentValue = Math.round(
                Math.min(
                  100,
                  Math.max(0, ((completed ?? 0) / 100) * stepCount - index) *
                    100,
                ),
              )
              const segmentStart = start + index * (stepSweep + gapAngle)
              return (
                <g
                  key={index}
                  data-ui-progress-step={index}
                  data-ui-progress-step-value={segmentValue}
                >
                  <path
                    d={progressArcPath(
                      segmentStart,
                      stepSweep,
                      radius,
                      canvasSize,
                    )}
                    stroke="var(--secondary)"
                    strokeWidth={stroke}
                    data-ui-progress-track=""
                  />
                  {segmentValue > 0 && (
                    <path
                      d={progressArcPath(
                        segmentStart,
                        (stepSweep * segmentValue) / 100,
                        radius,
                        canvasSize,
                      )}
                      stroke="currentColor"
                      strokeWidth={stroke}
                      data-ui-progress-fill=""
                    />
                  )}
                  {successSegmentValue > 0 && (
                    <path
                      d={progressArcPath(
                        segmentStart,
                        (stepSweep * successSegmentValue) / 100,
                        radius,
                        canvasSize,
                      )}
                      stroke="var(--ui-seed-success)"
                      strokeWidth={stroke}
                      data-ui-progress-success=""
                    />
                  )}
                </g>
              )
            })
          ) : (
            <>
              <path
                d={trackPath}
                stroke="var(--secondary)"
                strokeWidth={stroke}
                data-ui-progress-track=""
              />
              {value > 0 && (
                <path
                  d={valuePath}
                  stroke="currentColor"
                  strokeWidth={stroke}
                  data-ui-progress-fill=""
                />
              )}
              {successPath && (
                <path
                  d={successPath}
                  stroke="var(--ui-seed-success)"
                  strokeWidth={stroke}
                  data-ui-progress-success=""
                />
              )}
            </>
          )}
        </svg>
        {showInfo && (
          <span
            aria-hidden="true"
            className={cn(
              'relative text-center font-semibold text-foreground',
              resolvedSize === 'small' && 'text-sm',
            )}
          >
            {text}
          </span>
        )}
      </div>
    )
  }
  if (stepCount > 0) {
    const progressRatio = (value / 100) * stepCount
    const segmentClass = cn(
      'absolute inset-y-0 start-0 rounded-[inherit] transition-[width] duration-200 motion-reduce:transition-none',
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
            aria-valuetext={valueText}
            data-ui-progress-size={resolvedSize}
            data-ui-progress-success-percent={completed}
            data-ui-progress-steps={stepCount}
            style={
              requestedGap !== undefined && Number.isFinite(requestedGap)
                ? { gap: Math.max(0, requestedGap) }
                : undefined
            }
          >
            {Array.from({ length: stepCount }, (_, index) => {
              const segmentValue = Math.round(
                Math.min(100, Math.max(0, (progressRatio - index) * 100)),
              )
              const successSegmentValue = Math.round(
                Math.min(
                  100,
                  Math.max(0, ((completed ?? 0) / 100) * stepCount - index) *
                    100,
                ),
              )
              return (
                <span
                  key={index}
                  className="relative min-w-0 flex-1 overflow-hidden rounded-[var(--radius-sm)] bg-secondary"
                  data-ui-progress-step={index}
                  style={{ minHeight: safeStrokeWidth }}
                >
                  <span
                    className={segmentClass}
                    style={{ width: `${segmentValue}%` }}
                    data-ui-progress-step-value={segmentValue}
                  />
                  {successSegmentValue > 0 && (
                    <span
                      className="absolute inset-y-0 start-0 rounded-[inherit] bg-[var(--ui-seed-success)]"
                      style={{ width: `${successSegmentValue}%` }}
                      data-ui-progress-success=""
                    />
                  )}
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
          aria-valuetext={valueText}
          data-ui-progress-size={resolvedSize}
          data-ui-progress-success-percent={completed}
          style={{ minHeight: safeStrokeWidth }}
        >
          <span
            className={cn(
              'absolute inset-y-0 start-0 rounded-[inherit] transition-[width] duration-200 motion-reduce:transition-none',
              status === 'active' &&
                'bg-gradient-to-r from-primary to-[var(--ui-map-primary-hover)]',
              status === 'success' && 'bg-[var(--ui-seed-success)]',
              status === 'exception' && 'bg-destructive',
              status === 'normal' && 'bg-primary',
            )}
            style={{ width: `${value}%` }}
            data-ui-progress-fill=""
          />
          {completed !== undefined && completed > 0 && (
            <span
              className="absolute inset-y-0 start-0 rounded-[inherit] bg-[var(--ui-seed-success)]"
              style={{ width: `${completed}%` }}
              data-ui-progress-success=""
            />
          )}
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
  title?: ReactNode
  subTitle?: ReactNode
  extra?: ReactNode
  children?: ReactNode
  icon?: ReactNode
  size?: 'default' | 'small'
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
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

const resultTitle: Record<ResultStatus, string> = {
  success: '操作成功',
  error: '操作失败',
  info: '提示',
  warning: '请注意',
  '404': '页面不存在',
  '403': '无权访问',
  '500': '服务暂时不可用',
}

const resultCodeDescription: Partial<Record<ResultStatus, string>> = {
  '404': '请检查页面地址，或返回工作台。',
  '403': '当前账号没有访问该页面的权限。',
  '500': '服务暂时无法处理请求，请稍后重试。',
}

/** A centered outcome state for completed, empty and failed flows. */
export function Result({
  status = 'info',
  title,
  subTitle,
  extra,
  children,
  icon,
  size = 'default',
  headingLevel = 2,
  className,
}: ResultProps) {
  const titleId = useId()
  const Heading = `h${headingLevel}` as const
  const resolvedTitle = title ?? resultTitle[status]
  const resolvedSubTitle = subTitle ?? resultCodeDescription[status]
  const statusCode = status === '403' || status === '404' || status === '500'
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
      aria-labelledby={titleId}
      data-ui-result-status={status}
      data-ui-result-size={size}
      className={cn(
        'grid min-w-0 max-w-full justify-items-center gap-2 px-6 py-8 text-center [overflow-wrap:anywhere]',
        size === 'small' && 'px-4 py-4',
        className,
      )}
    >
      <div
        className={cn(
          'grid size-[4.5rem] place-items-center rounded-full',
          size === 'small' && 'size-12',
          iconClassName,
        )}
        aria-hidden="true"
      >
        {icon ??
          (statusCode ? (
            <span
              className={cn(
                'text-xl font-bold',
                size !== 'small' && 'text-2xl',
              )}
            >
              {status}
            </span>
          ) : (
            <Icon name={resultIcon[status]} size={size === 'small' ? 32 : 48} />
          ))}
      </div>
      <Heading
        id={titleId}
        className={cn(
          'm-0 text-xl leading-tight sm:text-2xl',
          size === 'small' && 'text-lg sm:text-xl',
        )}
      >
        {resolvedTitle}
      </Heading>
      {resolvedSubTitle && (
        <p className="m-0 max-w-[40rem] leading-relaxed text-muted-foreground">
          {resolvedSubTitle}
        </p>
      )}
      {extra && (
        <div className="mt-2 flex max-w-full flex-wrap justify-center gap-2">
          {extra}
        </div>
      )}
      {children && (
        <div className="mt-4 min-w-0 w-full max-w-2xl rounded-lg bg-secondary/50 p-4 text-start sm:p-6">
          {children}
        </div>
      )}
    </section>
  )
}
