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
        'ui-avatar',
        `ui-avatar--${shape}`,
        typeof size === 'string' && `ui-avatar--${size}`,
        className,
      )}
      style={
        {
          ...(sizeValue ? { '--ui-avatar-size': `${sizeValue}px` } : {}),
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      {src ? (
        <img src={src} alt="" aria-hidden="true" loading="lazy" />
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
    <section
      className={cn(
        'ui-descriptions',
        bordered && 'ui-descriptions--bordered',
        `ui-descriptions--${layout}`,
        className,
      )}
      style={{ '--ui-description-columns': columns } as CSSProperties}
    >
      {title && <h2 className="ui-descriptions__title">{title}</h2>}
      <dl className="ui-descriptions__list">
        {items.map((item) => (
          <div
            className="ui-descriptions__item"
            key={item.key}
            style={{ '--ui-description-span': item.span ?? 1 } as CSSProperties}
          >
            <dt>{item.label}</dt>
            <dd>{item.children}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
