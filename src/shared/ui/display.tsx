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

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  width?: string | number
  height?: string | number
  shape?: 'line' | 'circle' | 'block'
  label?: string
}
export function Skeleton({
  width,
  height,
  shape = 'line',
  label = '正在加载',
  className,
  style,
  ...props
}: SkeletonProps) {
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
        'animate-pulse bg-secondary motion-reduce:animate-none',
        shapeStyles[shape],
        className,
      )}
      style={{ width, height, ...style }}
      {...props}
    />
  )
}
