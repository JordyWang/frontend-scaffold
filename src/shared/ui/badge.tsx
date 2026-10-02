import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

type BadgeTone = 'default' | 'success' | 'warning' | 'error'
export type BadgeStatus = BadgeTone | 'processing'

const badgeToneStyles = {
  default: 'bg-primary text-primary-foreground',
  success: 'bg-[var(--ui-seed-success)] text-[var(--ui-map-success-text)]',
  warning: 'bg-[var(--ui-seed-warning)] text-[var(--ui-map-warning-text)]',
  error: 'bg-[var(--ui-seed-error)] text-[var(--ui-map-error-text)]',
} as const

const badgeStatusStyles = {
  default: 'bg-muted-foreground',
  success: 'bg-[var(--ui-seed-success)]',
  processing: 'bg-primary',
  warning: 'bg-[var(--ui-seed-warning)]',
  error: 'bg-[var(--ui-seed-error)]',
} as const

const badgeStatusLabels = {
  default: '默认状态',
  success: '成功状态',
  processing: '进行中',
  warning: '警告状态',
  error: '错误状态',
} as const

export type BadgeProps = {
  count?: number | string
  max?: number
  showZero?: boolean
  dot?: boolean
  tone?: BadgeTone
  size?: 'default' | 'small'
  status?: BadgeStatus
  text?: ReactNode
  offset?: readonly [number, number]
  children?: ReactNode
  label?: string
  className?: string
}

export function Badge({
  count,
  max = 99,
  showZero = false,
  dot = false,
  tone = 'default',
  size = 'default',
  status,
  text,
  offset,
  children,
  label,
  className,
}: BadgeProps) {
  if (status) {
    return (
      <span
        data-ui-badge=""
        data-ui-badge-status={status}
        className={cn('inline-flex max-w-full items-center gap-2', className)}
      >
        {children}
        <span
          role="img"
          aria-label={label ?? badgeStatusLabels[status]}
          data-ui-badge-status-dot=""
          className={cn(
            'relative size-2.5 shrink-0 rounded-full',
            badgeStatusStyles[status],
            status === 'processing' &&
              'after:absolute after:inset-0 after:rounded-full after:bg-primary/50 after:animate-ping motion-reduce:after:animate-none',
          )}
        />
        {text != null && <span className="min-w-0 break-words">{text}</span>}
      </span>
    )
  }

  const hasAnchor =
    children !== undefined && children !== null && children !== false
  const validCount =
    typeof count === 'number' && (!Number.isFinite(count) || count < 0)
      ? undefined
      : count
  const isZero = validCount === 0
  const hasBadge =
    (dot || validCount !== undefined || Boolean(label)) && (!isZero || showZero)
  const limit = Number.isFinite(max) ? Math.max(0, Math.floor(max)) : 99
  const visibleText = dot
    ? ''
    : typeof validCount === 'number' && validCount > limit
      ? `${limit}+`
      : validCount === undefined
        ? hasAnchor
          ? ''
          : (label ?? '')
        : String(validCount)
  const offsetInline = offset?.[0]
  const offsetBlock = offset?.[1]

  return (
    <span
      data-ui-badge=""
      className={cn('relative inline-flex w-fit max-w-full', className)}
    >
      {children}
      {hasBadge && (
        <span
          data-ui-badge-tone={tone}
          data-ui-badge-size={size}
          className={cn(
            'grid h-5 min-w-5 max-w-32 place-items-center overflow-hidden text-ellipsis whitespace-nowrap rounded-full px-[0.2rem] text-xs font-bold leading-none',
            size === 'small' && 'h-4 min-w-4',
            hasAnchor &&
              'absolute end-0 top-0 translate-x-[40%] -translate-y-[40%] rtl:-translate-x-[40%]',
            badgeToneStyles[tone],
            dot && 'size-2.5 min-w-0 p-0',
            dot && size === 'small' && 'size-2',
          )}
          style={
            hasAnchor && offset
              ? {
                  insetInlineEnd:
                    typeof offsetInline === 'number' &&
                    Number.isFinite(offsetInline)
                      ? -offsetInline
                      : undefined,
                  top:
                    typeof offsetBlock === 'number' &&
                    Number.isFinite(offsetBlock)
                      ? offsetBlock
                      : undefined,
                }
              : undefined
          }
          aria-label={
            label ??
            (typeof validCount === 'number'
              ? `${validCount} 条通知`
              : validCount)
          }
          role={label || validCount !== undefined ? 'status' : undefined}
          aria-hidden={!label && validCount === undefined ? true : undefined}
        >
          {visibleText}
        </span>
      )}
    </span>
  )
}

export type BadgeRibbonProps = HTMLAttributes<HTMLDivElement> & {
  text: ReactNode
  tone?: BadgeTone
  placement?: 'start' | 'end'
  children: ReactNode
}

export function BadgeRibbon({
  text,
  tone = 'default',
  placement = 'end',
  children,
  className,
  ...props
}: BadgeRibbonProps) {
  return (
    <div
      data-ui-badge-ribbon-wrapper=""
      className={cn('relative inline-block max-w-full', className)}
      {...props}
    >
      {children}
      <span
        data-ui-badge-ribbon={placement}
        data-ui-badge-ribbon-tone={tone}
        className={cn(
          'absolute top-2 z-10 max-w-[calc(100%-1rem)] truncate px-3 py-1.5 text-sm font-semibold shadow-sm',
          placement === 'start' ? 'start-0 rounded-e-md' : 'end-0 rounded-s-md',
          badgeToneStyles[tone],
        )}
      >
        {text}
      </span>
    </div>
  )
}

Badge.Ribbon = BadgeRibbon
