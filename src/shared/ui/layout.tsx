import type { CSSProperties, HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

type Gap = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type Alignment = 'start' | 'center' | 'end' | 'stretch'

export type StackProps = HTMLAttributes<HTMLDivElement> & {
  direction?: 'row' | 'column'
  gap?: Gap
  align?: Alignment
  justify?: 'start' | 'center' | 'end' | 'between'
  wrap?: boolean
}

export function Stack({
  direction = 'column',
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className,
  style,
  ...props
}: StackProps) {
  return (
    <div
      className={cn('ui-stack', className)}
      data-direction={direction}
      data-align={align}
      data-justify={justify}
      data-wrap={wrap || undefined}
      style={
        { '--ui-stack-gap': `var(--space-${gap})`, ...style } as CSSProperties
      }
      {...props}
    />
  )
}

export const Flex = Stack

export type GridProps = HTMLAttributes<HTMLDivElement> & {
  minItemWidth?: string
  gap?: Gap
}

export function Grid({
  minItemWidth = '15rem',
  gap = 'md',
  className,
  style,
  ...props
}: GridProps) {
  return (
    <div
      className={cn('ui-grid', className)}
      style={
        {
          '--ui-grid-min': minItemWidth,
          '--ui-grid-gap': `var(--space-${gap})`,
          ...style,
        } as CSSProperties
      }
      {...props}
    />
  )
}

export type DividerProps = HTMLAttributes<HTMLHRElement> & {
  orientation?: 'horizontal' | 'vertical'
}

export function Divider({
  orientation = 'horizontal',
  className,
  ...props
}: DividerProps) {
  return (
    <hr
      aria-orientation={orientation}
      className={cn('ui-divider', `ui-divider--${orientation}`, className)}
      {...props}
    />
  )
}
