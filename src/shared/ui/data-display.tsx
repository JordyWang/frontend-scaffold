import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { useConfig } from './config-context'
import { Skeleton } from './display'

function formatStatisticNumber(
  value: number,
  locale: string,
  precision?: number,
) {
  if (!Number.isFinite(value)) return '—'
  const digits =
    precision !== undefined && Number.isFinite(precision)
      ? Math.min(20, Math.max(0, Math.floor(precision)))
      : undefined
  const options: Intl.NumberFormatOptions =
    digits === undefined
      ? {}
      : { minimumFractionDigits: digits, maximumFractionDigits: digits }
  try {
    return new Intl.NumberFormat(locale, options).format(value)
  } catch {
    return new Intl.NumberFormat('zh-CN', options).format(value)
  }
}

export type StatisticProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  title: ReactNode
  value: number | string
  prefix?: ReactNode
  suffix?: ReactNode
  precision?: number
  formatter?: (value: number | string) => ReactNode
  locale?: string
  loading?: boolean
}

export function Statistic({
  title,
  value,
  prefix,
  suffix,
  precision,
  formatter,
  locale,
  loading = false,
  className,
  ...props
}: StatisticProps) {
  const { locale: configuredLocale } = useConfig()
  const formatted = loading
    ? null
    : formatter
      ? formatter(value)
      : typeof value === 'number'
        ? formatStatisticNumber(
            value,
            locale ?? configuredLocale ?? 'zh-CN',
            precision,
          )
        : value
  return (
    <div
      {...props}
      data-ui-statistic=""
      className={cn('grid gap-1', className)}
      aria-busy={loading ? true : props['aria-busy']}
    >
      <div className="text-sm leading-6 text-muted-foreground">{title}</div>
      {loading ? (
        <Skeleton
          label={
            typeof title === 'string' ? `${title}正在加载` : '统计值正在加载'
          }
          className="h-8 w-3/5"
        />
      ) : (
        <div className="flex items-baseline gap-1 text-[clamp(1.5rem,4vw,2rem)] font-bold leading-tight text-foreground tabular-nums">
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
      )}
    </div>
  )
}
