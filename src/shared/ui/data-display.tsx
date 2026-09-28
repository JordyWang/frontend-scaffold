import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export type StatisticProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  title: ReactNode
  value: number | string
  prefix?: ReactNode
  suffix?: ReactNode
  precision?: number
  formatter?: (value: number | string) => ReactNode
}

export function Statistic({
  title,
  value,
  prefix,
  suffix,
  precision,
  formatter,
  className,
  ...props
}: StatisticProps) {
  const formatted = formatter
    ? formatter(value)
    : typeof value === 'number' && precision !== undefined
      ? value.toFixed(precision)
      : value
  return (
    <div className={cn('ui-statistic', className)} {...props}>
      <div className="ui-statistic__title">{title}</div>
      <div className="ui-statistic__value">
        {prefix && <span className="ui-statistic__prefix">{prefix}</span>}
        <span>{formatted}</span>
        {suffix && <span className="ui-statistic__suffix">{suffix}</span>}
      </div>
    </div>
  )
}

export type TimelineItem = {
  key?: string
  title?: ReactNode
  children: ReactNode
  color?: 'primary' | 'success' | 'warning' | 'error' | 'gray'
  dot?: ReactNode
}

export type TimelineProps = {
  items: TimelineItem[]
  className?: string
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={cn('ui-timeline', className)}>
      {items.map((item, index) => (
        <li
          className={cn(
            'ui-timeline__item',
            `ui-timeline__item--${item.color ?? 'primary'}`,
          )}
          key={item.key ?? String(index)}
        >
          <span className="ui-timeline__dot" aria-hidden="true">
            {item.dot}
          </span>
          <div className="ui-timeline__content">
            {item.title && <h3 className="ui-timeline__title">{item.title}</h3>}
            <div>{item.children}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}
