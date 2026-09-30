import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { useConfig } from './config-context'

export type EmptyProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'title'
> & {
  title: string
  description?: string
  action?: ReactNode
  image?: ReactNode
  size?: 'default' | 'small'
}

export function Empty({
  title,
  description,
  action,
  image,
  size,
  className,
  ...props
}: EmptyProps) {
  const { componentSize } = useConfig()
  const resolvedSize = size ?? (componentSize === 'small' ? 'small' : 'default')

  return (
    <div
      {...props}
      data-ui-empty=""
      data-ui-size={resolvedSize}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center',
        resolvedSize === 'small' ? 'min-h-32 p-4' : 'min-h-48 p-6',
        className,
      )}
    >
      {image !== null && image !== false && (
        <div
          className={cn(
            'grid place-items-center text-muted-foreground [&_img]:max-h-full [&_img]:max-w-full [&_svg]:max-h-full [&_svg]:max-w-full',
            resolvedSize === 'small' ? 'size-10' : 'size-12',
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
          ) : (
            image
          )}
        </div>
      )}
      <p className="m-0 font-semibold">{title}</p>
      {description && (
        <p className="m-0 text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
