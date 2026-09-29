import { type HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'
import { pageShellStyles } from './tailwind-styles'

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
        pageShellStyles,
        width === 'content' && 'max-w-3xl',
        className,
      )}
      {...props}
    />
  )
}
