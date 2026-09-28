import {
  Children,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
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

export type SpaceProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  children?: ReactNode
  direction?: 'horizontal' | 'vertical'
  size?: Gap | 'small' | 'middle' | 'large' | number
  align?: Alignment
  wrap?: boolean
  split?: ReactNode
}

const spaceGap: Record<'small' | 'middle' | 'large', Gap> = {
  small: 'sm',
  middle: 'md',
  large: 'lg',
}

/** Ant Design-like spacing primitive; unlike Stack it defaults to a row. */
export function Space({
  direction = 'horizontal',
  size = 'middle',
  align = 'center',
  wrap = false,
  split,
  children,
  className,
  style,
  ...props
}: SpaceProps) {
  const gap =
    typeof size === 'number'
      ? `${size}px`
      : `var(--space-${spaceGap[size as keyof typeof spaceGap] ?? size})`
  const content = Children.toArray(children)
  return (
    <div
      className={cn('ui-space', className)}
      data-direction={direction}
      data-align={align}
      data-wrap={wrap || undefined}
      style={{ '--ui-space-gap': gap, ...style } as CSSProperties}
      {...props}
    >
      {content.map((child, index) => (
        <span className="ui-space__item" key={`space-${index}`}>
          {child}
          {split && index < content.length - 1 && (
            <span className="ui-space__split" aria-hidden="true">
              {split}
            </span>
          )}
        </span>
      ))}
    </div>
  )
}

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
