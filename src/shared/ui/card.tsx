import { type HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-ui-card=""
      className={cn(
        'overflow-hidden rounded-[var(--ui-card-radius)] border border-border bg-card text-card-foreground',
        className,
      )}
      {...props}
    />
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
