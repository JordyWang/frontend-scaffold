import {
  createContext,
  useContext,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { useConfig } from './config-context'

type CardSize = 'default' | 'small'
const CardSizeContext = createContext<CardSize>('default')

function useCardSize() {
  return useContext(CardSizeContext)
}

export type CardProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  title?: ReactNode
  extra?: ReactNode
  cover?: ReactNode
  actions?: ReactNode[]
  hoverable?: boolean
  loading?: boolean
  bordered?: boolean
  size?: CardSize
}

/** A project-owned card that supports both compound children and Ant-style slots. */
export function Card({
  title,
  extra,
  cover,
  actions,
  hoverable = false,
  loading = false,
  bordered = true,
  size,
  className,
  children,
  ...props
}: CardProps) {
  const { componentSize } = useConfig()
  const resolvedSize = size ?? (componentSize === 'small' ? 'small' : 'default')
  return (
    <CardSizeContext.Provider value={resolvedSize}>
      <div
        data-ui-card=""
        data-ui-size={resolvedSize}
        data-ui-card-hoverable={hoverable || undefined}
        data-ui-card-loading={loading || undefined}
        className={cn(
          'overflow-hidden rounded-[var(--ui-card-radius)] bg-card text-card-foreground',
          bordered && 'border border-border',
          hoverable &&
            'transition-shadow duration-180 hover:shadow-[0_8px_24px_rgb(15_23_42_/_0.12)]',
          className,
        )}
        {...props}
      >
        {cover && <div className="overflow-hidden">{cover}</div>}
        {(title || extra) && (
          <CardHeader className="flex items-start justify-between gap-[var(--space-md)]">
            <div className="min-w-0">
              {title && <CardTitle>{title}</CardTitle>}
            </div>
            {extra && <div className="shrink-0">{extra}</div>}
          </CardHeader>
        )}
        {loading ? (
          <div
            role="status"
            aria-label="正在加载"
            className={cn(
              'grid gap-3',
              resolvedSize === 'small'
                ? 'p-[var(--space-md)]'
                : 'p-[var(--space-lg)]',
            )}
          >
            <span className="h-4 w-2/5 animate-pulse rounded bg-secondary motion-reduce:animate-none" />
            <span className="h-4 w-full animate-pulse rounded bg-secondary motion-reduce:animate-none" />
            <span className="h-4 w-4/5 animate-pulse rounded bg-secondary motion-reduce:animate-none" />
          </div>
        ) : (
          children
        )}
        {actions?.length ? (
          <CardFooter className="grid grid-flow-col auto-cols-fr p-0 pt-0">
            {actions.map((action, index) => (
              <div
                key={index}
                className="flex min-h-11 items-center justify-center border-s border-border px-3 py-2 first:border-s-0"
              >
                {action}
              </div>
            ))}
          </CardFooter>
        ) : null}
      </div>
    </CardSizeContext.Provider>
  )
}
export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const size = useCardSize()
  return (
    <div
      className={cn(
        'grid gap-[var(--space-xs)]',
        size === 'small' ? 'p-[var(--space-md)]' : 'p-[var(--space-lg)]',
        'pb-0',
        className,
      )}
      {...props}
    />
  )
}
export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  const size = useCardSize()
  return (
    <h3
      className={cn(
        'm-0 font-[650]',
        size === 'small' ? 'text-base' : 'text-lg',
        className,
      )}
      {...props}
    />
  )
}
export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('m-0 text-muted-foreground', className)} {...props} />
}
export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const size = useCardSize()
  return (
    <div
      className={cn(
        size === 'small' ? 'p-[var(--space-md)]' : 'p-[var(--space-lg)]',
        className,
      )}
      {...props}
    />
  )
}
export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const size = useCardSize()
  return (
    <div
      className={cn(
        'flex flex-wrap gap-[var(--space-sm)]',
        size === 'small' ? 'p-[var(--space-md)]' : 'p-[var(--space-lg)]',
        'pt-0',
        className,
      )}
      {...props}
    />
  )
}
