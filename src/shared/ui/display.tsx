import {
  useState,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'

type Tone = 'default' | 'success' | 'warning' | 'error'

export type TagProps = HTMLAttributes<HTMLSpanElement> & { tone?: Tone }
export function Tag({ tone = 'default', className, ...props }: TagProps) {
  return (
    <span className={cn('ui-tag', `ui-tag--${tone}`, className)} {...props} />
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
  const text = dot
    ? ''
    : count === undefined
      ? ''
      : count > max
        ? `${max}+`
        : String(count)
  return (
    <span className={cn('ui-badge', className)}>
      {children}
      {(dot || count !== undefined || label) && (
        <span
          className={cn(
            'ui-badge__count',
            `ui-badge__count--${tone}`,
            dot && 'ui-badge__count--dot',
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
        className={cn('ui-image__fallback', className)}
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
      className={cn('ui-image', className)}
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
  return (
    <div
      role="status"
      aria-label={label}
      className={cn('ui-skeleton', `ui-skeleton--${shape}`, className)}
      style={{ width, height, ...style }}
      {...props}
    />
  )
}
