import { type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export type AvatarProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  src?: string
  alt?: string
  label?: string
  size?: 'small' | 'default' | 'large' | number
  shape?: 'circle' | 'square'
  children?: ReactNode
}

const avatarSizeStyles = {
  small: 'size-8',
  default: 'size-10',
  large: 'size-14',
} as const

const avatarShapeStyles = {
  circle: 'rounded-full',
  square: 'rounded-[var(--radius-md)]',
} as const

export function Avatar({
  src,
  alt,
  label,
  size = 'default',
  shape = 'circle',
  children,
  className,
  style,
  ...props
}: AvatarProps) {
  const accessibleName =
    alt ?? label ?? (typeof children === 'string' ? children : '头像')
  const sizeValue = typeof size === 'number' ? size : undefined
  return (
    <span
      role="img"
      aria-label={accessibleName}
      className={cn(
        'inline-grid shrink-0 place-items-center overflow-hidden bg-accent font-semibold leading-none text-accent-foreground align-middle',
        avatarShapeStyles[shape],
        typeof size === 'string' ? avatarSizeStyles[size] : 'size-10',
        className,
      )}
      style={
        {
          ...(sizeValue
            ? { width: `${sizeValue}px`, height: `${sizeValue}px` }
            : {}),
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="size-full object-cover"
        />
      ) : (
        children
      )}
    </span>
  )
}

export type DescriptionItem = {
  key: string
  label: ReactNode
  children: ReactNode
  span?: number
}

export type DescriptionsProps = {
  title?: ReactNode
  items: DescriptionItem[]
  column?: number
  bordered?: boolean
  layout?: 'horizontal' | 'vertical'
  className?: string
}

/** Semantic description pairs that reflow to one column on narrow screens. */
export function Descriptions({
  title,
  items,
  column = 3,
  bordered = false,
  layout = 'horizontal',
  className,
}: DescriptionsProps) {
  const columns = Math.max(1, Math.floor(column))
  return (
    <section className={cn('w-full', className)}>
      {title && <h2 className="m-0 mb-4 text-lg font-semibold">{title}</h2>}
      <dl
        className="m-0 grid grid-cols-[repeat(var(--ui-description-columns),minmax(0,1fr))] max-sm:grid-cols-1"
        style={{ '--ui-description-columns': columns } as CSSProperties}
      >
        {items.map((item) => (
          <div
            className={cn(
              'col-span-[var(--ui-description-span)] grid min-w-0 max-sm:col-span-1',
              layout === 'vertical'
                ? 'grid-cols-1'
                : 'grid-cols-[minmax(6rem,0.5fr)_minmax(0,1fr)]',
              bordered && 'border-border border-s border-t',
            )}
            key={item.key}
            style={{ '--ui-description-span': item.span ?? 1 } as CSSProperties}
          >
            <dt
              className={cn(
                'm-0 min-w-0 px-4 py-2 leading-normal text-muted-foreground [overflow-wrap:anywhere]',
                bordered && 'bg-muted',
              )}
            >
              {item.label}
            </dt>
            <dd
              className={cn(
                'm-0 min-w-0 px-4 py-2 leading-normal text-foreground [overflow-wrap:anywhere]',
                bordered && 'border-s border-border',
                layout === 'vertical' && 'pt-0',
              )}
            >
              {item.children}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
