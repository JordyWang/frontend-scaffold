import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export type CardProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  title?: ReactNode
  extra?: ReactNode
  cover?: ReactNode
  actions?: ReactNode[]
  hoverable?: boolean
  loading?: boolean
  bordered?: boolean
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
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      data-ui-card=""
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
          className="grid gap-3 p-[var(--space-lg)]"
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
  )
}
export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'grid gap-[var(--space-xs)] p-[var(--space-lg)] pb-0',
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
  return <h3 className={cn('m-0 text-lg font-[650]', className)} {...props} />
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
  return <div className={cn('p-[var(--space-lg)]', className)} {...props} />
}
export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-wrap gap-[var(--space-sm)] p-[var(--space-lg)] pt-0',
        className,
      )}
      {...props}
    />
  )
}
