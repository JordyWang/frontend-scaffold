import { type HTMLAttributes, type ReactNode, type Ref } from 'react'
import { cn } from '@/shared/lib/utils'
import { useConfig } from './config-context'

export type EmptyPart = 'root' | 'image' | 'title' | 'description' | 'action'
export type EmptyProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'title'
> & {
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  image?: ReactNode
  imageAlt?: string
  size?: 'default' | 'small'
  classNames?: Partial<Record<EmptyPart, string>>
  ref?: Ref<HTMLDivElement>
}

export function Empty({
  title = '暂无数据',
  description,
  action,
  image,
  imageAlt,
  size,
  classNames,
  className,
  ref,
  ...props
}: EmptyProps) {
  const { componentSize } = useConfig()
  const resolvedSize = size ?? (componentSize === 'small' ? 'small' : 'default')

  return (
    <div
      {...props}
      ref={ref}
      data-ui-empty=""
      data-ui-size={resolvedSize}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center',
        resolvedSize === 'small' ? 'min-h-32 p-4' : 'min-h-48 p-6',
        classNames?.root,
        className,
      )}
    >
      {image !== null && image !== false && image !== '' && (
        <div
          className={cn(
            'grid place-items-center text-muted-foreground [&_img]:max-h-full [&_img]:max-w-full [&_svg]:max-h-full [&_svg]:max-w-full',
            resolvedSize === 'small' ? 'size-10' : 'size-12',
            classNames?.image,
          )}
        >
          {image === undefined ? (
            <svg
              aria-hidden="true"
              viewBox="0 0 48 48"
              fill="none"
              className="size-full"
            >
              <rect
                x="7"
                y="13"
                width="34"
                height="27"
                rx="5"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M16 13V9a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v4M17 27h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : typeof image === 'string' ? (
            <img
              src={image}
              alt={imageAlt ?? ''}
              loading="lazy"
              className="size-full object-contain"
            />
          ) : (
            image
          )}
        </div>
      )}
      {title !== null && title !== false && (
        <div
          className={cn(
            'min-w-0 max-w-full font-semibold [overflow-wrap:anywhere]',
            classNames?.title,
          )}
        >
          {title}
        </div>
      )}
      {description !== null && description !== false && description !== '' && (
        <div
          className={cn(
            'min-w-0 max-w-full text-muted-foreground [overflow-wrap:anywhere]',
            classNames?.description,
          )}
        >
          {description}
        </div>
      )}
      {action && <div className={cn('mt-1', classNames?.action)}>{action}</div>}
    </div>
  )
}
