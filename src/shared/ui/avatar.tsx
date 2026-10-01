import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  type ReactNode,
  type SyntheticEvent,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { Button } from './button'
import { useConfig } from './config-context'
import { Icon } from './icon'
import { Popover } from './overlay'

export type AvatarSize =
  | 'small'
  | 'default'
  | 'large'
  | number
  | Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl', number>>

export type AvatarProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children' | 'onError'
> & {
  src?: string
  srcSet?: string
  sizes?: string
  alt?: string
  label?: string
  size?: AvatarSize
  shape?: 'circle' | 'square'
  icon?: ReactNode
  gap?: number
  loading?: ImgHTMLAttributes<HTMLImageElement>['loading']
  crossOrigin?: ImgHTMLAttributes<HTMLImageElement>['crossOrigin']
  referrerPolicy?: ImgHTMLAttributes<HTMLImageElement>['referrerPolicy']
  onError?: (event: SyntheticEvent<HTMLImageElement>) => boolean | void
  children?: ReactNode
}

export type AvatarGroupItem = Omit<AvatarProps, 'size' | 'shape' | 'label'> & {
  key: string
  label: string
}

export type AvatarGroupProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> & {
  items: AvatarGroupItem[]
  maxCount?: number
  size?: AvatarSize
  shape?: AvatarProps['shape']
  label?: string
}

const sizeStyles = {
  small: 'size-8',
  default: 'size-10',
  large: 'size-14',
}
const shapeStyles = {
  circle: 'rounded-full',
  square: 'rounded-[var(--radius-md)]',
}
const responsiveSizeStyles =
  'size-[var(--avatar-xs)] sm:size-[var(--avatar-sm)] md:size-[var(--avatar-md)] lg:size-[var(--avatar-lg)] xl:size-[var(--avatar-xl)] 2xl:size-[var(--avatar-xxl)]'

function validSize(value: number | undefined, fallback = 40) {
  return value !== undefined && Number.isFinite(value) && value > 0
    ? value
    : fallback
}

function avatarSizing(size: AvatarSize) {
  if (typeof size === 'string') return { className: sizeStyles[size] }
  if (typeof size === 'number')
    return {
      className: 'size-[var(--avatar-size)]',
      style: { '--avatar-size': `${validSize(size)}px` } as CSSProperties,
    }
  let previous = 40
  const variables: Record<string, string> = {}
  for (const breakpoint of ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const) {
    previous = validSize(size[breakpoint], previous)
    variables[`--avatar-${breakpoint}`] = `${previous}px`
  }
  return { className: responsiveSizeStyles, style: variables as CSSProperties }
}

/** Images fall back to an icon or children; long initials fit the actual width. */
export function Avatar({
  src,
  srcSet,
  sizes,
  alt,
  label,
  size = 'default',
  shape = 'circle',
  icon,
  gap = 4,
  loading = 'lazy',
  crossOrigin,
  referrerPolicy,
  draggable = false,
  onError,
  children,
  className,
  style,
  ...props
}: AvatarProps) {
  const rootRef = useRef<HTMLSpanElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const source = JSON.stringify([src, srcSet])
  const [imageState, setImageState] = useState({ source, failed: false })
  const [scale, setScale] = useState(1)
  // Reset failure for every source change, including returning to a previous URL.
  if (imageState.source !== source) setImageState({ source, failed: false })
  const showImage = Boolean(
    (src || srcSet) && !(imageState.source === source && imageState.failed),
  )
  const fallback = icon ?? children ?? <Icon name="user" />
  const textContent =
    typeof fallback === 'string' || typeof fallback === 'number'
  const textValue = textContent ? fallback : undefined
  const safeGap = Number.isFinite(gap) ? Math.max(0, gap) : 4
  const sizing = avatarSizing(size)
  const accessibleName =
    alt || label || (typeof children === 'string' && children) || '头像'

  useLayoutEffect(() => {
    const root = rootRef.current
    const text = textRef.current
    if (!root || !text || textValue === undefined || showImage) return
    const measure = () => {
      const availableWidth = Math.max(0, root.clientWidth - safeGap * 2)
      const textWidth = text.scrollWidth
      setScale(
        textWidth > 0 && root.clientWidth > 0
          ? Math.min(1, availableWidth / textWidth)
          : 1,
      )
    }
    measure()
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(root)
    observer?.observe(text)
    window.addEventListener('resize', measure)
    // A late-loading font can change initials without resizing their container.
    let disposed = false
    void document.fonts?.ready.then(() => {
      if (!disposed) measure()
    })
    return () => {
      disposed = true
      observer?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [safeGap, showImage, textValue])

  return (
    <span
      ref={rootRef}
      role="img"
      aria-label={accessibleName}
      {...props}
      data-ui-avatar=""
      className={cn(
        'inline-grid shrink-0 grid-cols-[minmax(0,1fr)] place-items-center overflow-hidden bg-accent font-semibold leading-none text-foreground align-middle',
        shapeStyles[shape],
        sizing.className,
        className,
      )}
      style={{ ...sizing.style, ...style }}
    >
      {showImage ? (
        <img
          key={source}
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt=""
          aria-hidden="true"
          loading={loading}
          crossOrigin={crossOrigin}
          referrerPolicy={referrerPolicy}
          draggable={draggable}
          className="size-full object-cover"
          onError={(event) => {
            if (onError?.(event) !== false)
              setImageState({ source, failed: true })
          }}
        />
      ) : (
        <span
          ref={textRef}
          aria-hidden="true"
          className="inline-grid w-max max-w-none place-items-center whitespace-nowrap"
          style={textContent ? { transform: `scale(${scale})` } : undefined}
        >
          {fallback}
        </span>
      )}
    </span>
  )
}

/** A named, overlapping group with keyboard/touch access to every hidden member. */
export function AvatarGroup({
  items,
  maxCount,
  size = 'default',
  shape = 'circle',
  label = '头像组',
  className,
  ...props
}: AvatarGroupProps) {
  const { direction } = useConfig()
  const count =
    maxCount !== undefined && Number.isFinite(maxCount)
      ? Math.max(0, Math.floor(maxCount))
      : items.length
  const visible = items.slice(0, count)
  const hidden = items.slice(count)
  const sizing = avatarSizing(size)

  return (
    <div
      role="group"
      aria-label={label}
      dir={direction}
      {...props}
      className={cn('min-w-0 max-w-full', className)}
    >
      {items.length === 0 ? (
        <p className="m-0 text-sm text-muted-foreground">暂无成员</p>
      ) : (
        <ul className="m-0 flex w-fit max-w-full list-none items-center overflow-x-auto p-1">
          {visible.map(({ key, className: avatarClassName, ...item }) => (
            <li key={key} className="-ms-2 shrink-0 first:ms-0">
              <Avatar
                {...item}
                size={size}
                shape={shape}
                className={cn('ring-2 ring-card', avatarClassName)}
              />
            </li>
          ))}
          {hidden.length > 0 && (
            <li className="-ms-2 shrink-0 first:ms-0">
              <Popover
                title={`${label} · 其余成员`}
                content={
                  <ul className="m-0 grid list-none gap-3 p-0">
                    {hidden.map(({ key, label: memberLabel, ...item }) => (
                      <li key={key} className="flex min-w-0 items-center gap-3">
                        <Avatar
                          {...item}
                          label={memberLabel}
                          size={size}
                          shape={shape}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 text-sm [overflow-wrap:anywhere]">
                          {memberLabel}
                        </span>
                      </li>
                    ))}
                  </ul>
                }
              >
                <Button
                  variant="secondary"
                  aria-label={`查看其余 ${hidden.length} 位成员`}
                  className={cn(
                    'min-h-11 min-w-11 shrink-0 bg-accent p-0 text-foreground ring-2 ring-card focus-visible:outline-offset-[-2px]',
                    sizing.className,
                    shapeStyles[shape],
                  )}
                  style={sizing.style}
                >
                  +{hidden.length}
                </Button>
              </Popover>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
