import { type HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

export type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  width?: 'content' | 'wide'
}

export function Container({
  width = 'wide',
  className,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        'page-shell',
        width === 'content' && 'ui-container--content',
        className,
      )}
      {...props}
    />
  )
}
