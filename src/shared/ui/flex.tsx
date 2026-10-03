import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

export type FlexGap = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number

export type FlexProps = Omit<HTMLAttributes<HTMLDivElement>, 'align'> & {
  direction?: 'row' | 'column'
  gap?: FlexGap
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
}

const alignStyles = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
} as const

const justifyStyles = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
} as const

function resolveGap(gap: FlexGap) {
  if (typeof gap === 'number') {
    return `${Number.isFinite(gap) ? Math.max(0, gap) : 0}px`
  }
  return `var(--space-${gap})`
}

/** Horizontal by default; Stack remains the vertical-first composition primitive. */
export const Flex = forwardRef<HTMLDivElement, FlexProps>(function Flex(
  {
    direction = 'row',
    gap = 0,
    align = 'stretch',
    justify = 'start',
    wrap = false,
    className,
    style,
    ...props
  },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      data-ui-flex=""
      className={cn(
        'flex min-w-0 gap-[var(--ui-flex-gap)]',
        direction === 'row' ? 'flex-row' : 'flex-col',
        alignStyles[align],
        justifyStyles[justify],
        wrap && 'flex-wrap',
        className,
      )}
      style={{ '--ui-flex-gap': resolveGap(gap), ...style } as CSSProperties}
    />
  )
})
