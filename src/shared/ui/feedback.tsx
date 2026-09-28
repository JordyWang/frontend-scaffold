import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { Icon } from './icon'

export type ProgressProps = {
  percent?: number
  status?: 'normal' | 'active' | 'success' | 'exception'
  type?: 'line' | 'circle'
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
  showInfo = true,
  strokeWidth = 8,
  label = '进度',
  format,
  className,
}: ProgressProps) {
  const value = Math.max(0, Math.min(percent, 100))
  const text = format ? format(value) : `${value}%`
  const style = { '--ui-progress-value': `${value}%` } as CSSProperties
  if (type === 'circle') {
    return (
      <div
        className={cn(
          'ui-progress ui-progress--circle',
          `ui-progress--${status}`,
          className,
        )}
        style={
          {
            ...style,
            '--ui-progress-stroke': `${strokeWidth}px`,
          } as CSSProperties
        }
      >
        <div
          className="ui-progress__circle"
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
        >
          {showInfo && <span className="ui-progress__info">{text}</span>}
        </div>
      </div>
    )
  }
  return (
    <div className={cn('ui-progress', `ui-progress--${status}`, className)}>
      <div className="ui-progress__line">
        <div
          className="ui-progress__track"
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          style={{ minHeight: strokeWidth }}
        >
          <span className="ui-progress__bar" style={style} />
        </div>
        {showInfo && <span className="ui-progress__info">{text}</span>}
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
  return (
    <section className={cn('ui-result', `ui-result--${status}`, className)}>
      <div className="ui-result__icon" aria-hidden={icon ? undefined : true}>
        {icon ?? <Icon name={resultIcon[status]} size={48} />}
      </div>
      <h2 className="ui-result__title">{title}</h2>
      {subTitle && <p className="ui-result__subtitle">{subTitle}</p>}
      {extra && <div className="ui-result__extra">{extra}</div>}
    </section>
  )
}
