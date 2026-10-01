import {
  useState,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'

type Tone = 'default' | 'success' | 'warning' | 'error'

const tagToneStyles = {
  default: 'border-border bg-muted text-foreground',
  success:
    'border-[var(--ui-color-success)] bg-[var(--ui-map-success-bg)] text-[var(--ui-color-success)]',
  warning:
    'border-[var(--ui-color-warning)] bg-[var(--ui-map-warning-bg)] text-[var(--ui-color-warning)]',
  error:
    'border-[var(--ui-color-error)] bg-[var(--ui-map-error-bg)] text-[var(--ui-color-error)]',
} as const

const badgeToneStyles = {
  default: 'bg-primary text-primary-foreground',
  success: 'bg-[var(--ui-seed-success)] text-[var(--ui-map-success-text)]',
  warning: 'bg-[var(--ui-seed-warning)] text-[var(--ui-map-warning-text)]',
  error: 'bg-[var(--ui-seed-error)] text-[var(--ui-map-error-text)]',
} as const

export type TagProps = HTMLAttributes<HTMLSpanElement> & { tone?: Tone }
export function Tag({ tone = 'default', className, ...props }: TagProps) {
  return (
    <span
      data-ui-tone={tone}
      className={cn(
        'inline-flex items-center rounded-[0.35rem] border px-2 py-0.5 text-sm font-semibold',
        tagToneStyles[tone],
        className,
      )}
      {...props}
    />
  )
}

export type BadgeProps = {
  count?: number
  max?: number
  dot?: boolean
  tone?: Tone
  children?: ReactNode
  label?: string
  className?: string
}
export function Badge({
  count,
  max = 99,
  dot = false,
  tone = 'default',
  children,
  label,
  className,
}: BadgeProps) {
  const hasAnchor =
    children !== undefined && children !== null && children !== false
  const text = dot
    ? ''
    : count === undefined
      ? hasAnchor
        ? ''
        : (label ?? '')
      : count > max
        ? `${max}+`
        : String(count)
  return (
    <span
      data-ui-badge=""
      className={cn('relative inline-flex w-fit', className)}
    >
      {children}
      {(dot || count !== undefined || label) && (
        <span
          data-ui-badge-tone={tone}
          className={cn(
            'grid h-5 min-w-5 place-items-center rounded-full px-[0.2rem] text-xs font-bold leading-none',
            hasAnchor &&
              'absolute end-0 top-0 translate-x-[40%] -translate-y-[40%] rtl:-translate-x-[40%]',
            badgeToneStyles[tone],
            dot && 'size-2.5 min-w-0 p-0',
          )}
          aria-label={
            label ?? (count === undefined ? undefined : `${count} 条通知`)
          }
          aria-hidden={!label && count === undefined ? true : undefined}
        >
          {text}
        </span>
      )}
    </span>
  )
}

export type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'alt'> & {
  alt: string
  fallback?: ReactNode
}
export function Image({
  src,
  alt,
  fallback,
  className,
  onError,
  loading = 'lazy',
  ...props
}: ImageProps) {
  const [failure, setFailure] = useState<{
    src: string | undefined
    failed: boolean
  }>({ src, failed: false })
  if (failure.src === src && failure.failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'block min-h-24 max-w-full rounded-[var(--radius-md)] border border-dashed border-border bg-muted p-4 text-muted-foreground',
          className,
        )}
      >
        {fallback ?? alt}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      className={cn('block max-w-full rounded-[var(--radius-md)]', className)}
      onError={(event) => {
        setFailure({ src, failed: true })
        onError?.(event)
      }}
      {...props}
    />
  )
}

export type SkeletonParagraph = {
  rows?: number
  width?: string | number | Array<string | number>
}

export type SkeletonProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  width?: string | number
  height?: string | number
  shape?: 'line' | 'circle' | 'block' | 'content'
  label?: string
  loading?: boolean
  active?: boolean
  avatar?: boolean | { size?: number; shape?: 'circle' | 'square' }
  title?: boolean | { width?: string | number }
  paragraph?: boolean | SkeletonParagraph
  round?: boolean
}
export function Skeleton({
  width,
  height,
  shape = 'line',
  label = '正在加载',
  loading = true,
  active = true,
  avatar = false,
  title = true,
  paragraph = true,
  round = false,
  children,
  className,
  style,
  ...props
}: SkeletonProps) {
  if (!loading) return <>{children}</>

  const animationClass = active && 'animate-pulse motion-reduce:animate-none'
  if (shape === 'content') {
    const avatarConfig = typeof avatar === 'object' ? avatar : undefined
    const avatarSize =
      avatarConfig?.size !== undefined && Number.isFinite(avatarConfig.size)
        ? Math.max(16, Math.min(160, avatarConfig.size))
        : 48
    const titleWidth = typeof title === 'object' ? title.width : undefined
    const paragraphConfig =
      typeof paragraph === 'object' ? paragraph : undefined
    const requestedRows = paragraphConfig?.rows
    const rows =
      requestedRows !== undefined && Number.isFinite(requestedRows)
        ? Math.max(1, Math.min(20, Math.floor(requestedRows)))
        : 3
    const paragraphWidth = paragraphConfig?.width
    return (
      <div
        role="status"
        aria-label={label}
        data-ui-skeleton="content"
        className={cn('flex w-full max-w-full items-start gap-4', className)}
        style={style}
        {...props}
      >
        {avatar && (
          <span
            aria-hidden="true"
            data-ui-skeleton-avatar=""
            className={cn(
              'shrink-0 bg-secondary',
              avatarConfig?.shape === 'square'
                ? 'rounded-[var(--radius-sm)]'
                : 'rounded-full',
              animationClass,
            )}
            style={{ width: avatarSize, height: avatarSize }}
          />
        )}
        <span aria-hidden="true" className="min-w-0 flex-1 space-y-3">
          {title !== false && (
            <span
              data-ui-skeleton-title=""
              className={cn(
                'block h-5 max-w-full bg-secondary',
                round ? 'rounded-full' : 'rounded-[var(--radius-sm)]',
                animationClass,
              )}
              style={{ width: titleWidth ?? '40%' }}
            />
          )}
          {paragraph !== false && (
            <span data-ui-skeleton-paragraph="" className="block space-y-2">
              {Array.from({ length: rows }, (_, index) => {
                const rowWidth = Array.isArray(paragraphWidth)
                  ? (paragraphWidth[index] ?? '100%')
                  : index === rows - 1
                    ? (paragraphWidth ?? '60%')
                    : '100%'
                return (
                  <span
                    key={index}
                    data-ui-skeleton-row={index}
                    className={cn(
                      'block h-4 max-w-full bg-secondary',
                      round ? 'rounded-full' : 'rounded-[var(--radius-sm)]',
                      animationClass,
                    )}
                    style={{ width: rowWidth }}
                  />
                )
              })}
            </span>
          )}
        </span>
      </div>
    )
  }
  const shapeStyles = {
    line: 'h-4 w-full rounded-[var(--radius-sm)]',
    circle: 'size-12 rounded-full',
    block: 'h-24 w-full rounded-[var(--radius-sm)]',
  } as const
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        'bg-secondary',
        animationClass,
        shapeStyles[shape],
        className,
      )}
      style={{ width, height, ...style }}
      {...props}
    />
  )
}
