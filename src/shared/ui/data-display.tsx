import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { useConfig } from './config-context'
import { Skeleton } from './display'

function formatStatisticNumber(
  value: number,
  locale: string,
  precision?: number,
  groupSeparator?: string,
  decimalSeparator?: string,
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
  let formatter: Intl.NumberFormat
  try {
    formatter = new Intl.NumberFormat(locale, options)
  } catch {
    formatter = new Intl.NumberFormat('zh-CN', options)
  }
  return formatter
    .formatToParts(value)
    .map((part) => {
      if (part.type === 'group') return groupSeparator ?? part.value
      if (part.type === 'decimal') return decimalSeparator ?? part.value
      return part.value
    })
    .join('')
}

export type StatisticPart =
  'root' | 'header' | 'title' | 'content' | 'value' | 'prefix' | 'suffix'

export type StatisticProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'title' | 'prefix'
> & {
  title: ReactNode
  value: number | string
  prefix?: ReactNode
  suffix?: ReactNode
  precision?: number
  groupSeparator?: string
  decimalSeparator?: string
  formatter?: (value: number | string) => ReactNode
  locale?: string
  loading?: boolean
  classNames?: Partial<Record<StatisticPart, string>>
}

export function Statistic({
  title,
  value,
  prefix,
  suffix,
  precision,
  groupSeparator,
  decimalSeparator,
  formatter,
  locale,
  loading = false,
  classNames,
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
            groupSeparator,
            decimalSeparator,
          )
        : value
  return (
    <div
      {...props}
      data-ui-statistic=""
      className={cn('grid min-w-0 gap-1', classNames?.root, className)}
      aria-busy={loading ? true : props['aria-busy']}
    >
      <div data-ui-statistic-header="" className={classNames?.header}>
        <div
          data-ui-statistic-title=""
          className={cn(
            'text-sm leading-6 text-muted-foreground',
            classNames?.title,
          )}
        >
          {title}
        </div>
      </div>
      <div
        data-ui-statistic-content=""
        className={cn(
          'flex min-w-0 items-baseline gap-1 text-[clamp(1.5rem,4vw,2rem)] font-bold leading-tight text-foreground tabular-nums',
          classNames?.content,
        )}
      >
        {loading ? (
          <div
            data-ui-statistic-value=""
            className={cn('w-full', classNames?.value)}
          >
            <Skeleton
              label={
                typeof title === 'string'
                  ? `${title}正在加载`
                  : '统计值正在加载'
              }
              className="h-8 w-3/5"
            />
          </div>
        ) : (
          <>
            {prefix !== undefined && prefix !== null && prefix !== false && (
              <span
                data-ui-statistic-prefix=""
                className={cn(
                  'text-[0.875em] font-semibold text-muted-foreground',
                  classNames?.prefix,
                )}
              >
                {prefix}
              </span>
            )}
            <span
              data-ui-statistic-value=""
              className={cn('min-w-0 break-words', classNames?.value)}
            >
              {formatted}
            </span>
            {suffix !== undefined && suffix !== null && suffix !== false && (
              <span
                data-ui-statistic-suffix=""
                className={cn(
                  'text-[0.875em] font-semibold text-muted-foreground',
                  classNames?.suffix,
                )}
              >
                {suffix}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}
