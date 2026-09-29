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
    <div className={cn('grid gap-1', className)} {...props}>
      <div className="text-sm leading-6 text-muted-foreground">{title}</div>
      <div className="flex items-baseline gap-1 text-[clamp(1.5rem,4vw,2rem)] font-bold leading-tight text-foreground">
        {prefix && (
          <span className="text-[0.875em] font-semibold text-muted-foreground">
            {prefix}
          </span>
        )}
        <span>{formatted}</span>
        {suffix && (
          <span className="text-[0.875em] font-semibold text-muted-foreground">
            {suffix}
          </span>
        )}
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
    <ol className={cn('m-0 list-none p-0', className)}>
      {items.map((item, index) => (
        <li
          className="relative flex min-h-16 gap-4"
          key={item.key ?? String(index)}
        >
          {index < items.length - 1 && (
            <span
              aria-hidden="true"
              className="absolute inset-y-5 start-[0.4375rem] w-px bg-border"
            />
          )}
          <span
            className={cn(
              'relative z-[1] mt-1 inline-grid size-3.5 shrink-0 place-items-center rounded-full border-2 bg-card text-[0.625rem]',
              item.color === 'success' &&
                'border-[var(--ui-color-success)] text-[var(--ui-color-success)]',
              item.color === 'warning' &&
                'border-[var(--ui-color-warning)] text-[var(--ui-color-warning)]',
              item.color === 'error' &&
                'border-[var(--ui-color-error)] text-[var(--ui-color-error)]',
              item.color === 'gray' &&
                'border-muted-foreground text-muted-foreground',
              (!item.color || item.color === 'primary') &&
                'border-primary text-primary',
            )}
            aria-hidden="true"
          >
            {item.dot}
          </span>
          <div className="min-w-0 flex-1 pb-6 leading-normal">
            {item.title && (
              <h3 className="m-0 mb-1 text-base font-semibold">{item.title}</h3>
            )}
            <div>{item.children}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}
