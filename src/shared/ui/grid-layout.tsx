import type { CSSProperties, HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

export type GridBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
export type GridResponsive<T> = Partial<Record<GridBreakpoint, T>>
export type GridSpan = number | GridResponsive<number>
export type GridGutter =
  | number
  | readonly [number, number]
  | GridResponsive<number | readonly [number, number]>

export type GridRowProps = HTMLAttributes<HTMLDivElement> & {
  gutter?: GridGutter
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
}

export type GridColProps = HTMLAttributes<HTMLDivElement> & {
  span?: GridSpan
  offset?: GridSpan
}

const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const
const rowGutterStyles =
  '[--grid-gap-x:var(--grid-gap-x-xs)] [--grid-gap-y:var(--grid-gap-y-xs)] @min-[640px]/grid-row:[--grid-gap-x:var(--grid-gap-x-sm)] @min-[640px]/grid-row:[--grid-gap-y:var(--grid-gap-y-sm)] @min-[768px]/grid-row:[--grid-gap-x:var(--grid-gap-x-md)] @min-[768px]/grid-row:[--grid-gap-y:var(--grid-gap-y-md)] @min-[1024px]/grid-row:[--grid-gap-x:var(--grid-gap-x-lg)] @min-[1024px]/grid-row:[--grid-gap-y:var(--grid-gap-y-lg)] @min-[1280px]/grid-row:[--grid-gap-x:var(--grid-gap-x-xl)] @min-[1280px]/grid-row:[--grid-gap-y:var(--grid-gap-y-xl)] @min-[1536px]/grid-row:[--grid-gap-x:var(--grid-gap-x-xxl)] @min-[1536px]/grid-row:[--grid-gap-y:var(--grid-gap-y-xxl)]'
const columnLayoutStyles =
  'w-[var(--grid-col-width-xs)] [margin-inline-start:var(--grid-col-offset-xs)] @min-[640px]/grid-row:w-[var(--grid-col-width-sm)] @min-[640px]/grid-row:[margin-inline-start:var(--grid-col-offset-sm)] @min-[768px]/grid-row:w-[var(--grid-col-width-md)] @min-[768px]/grid-row:[margin-inline-start:var(--grid-col-offset-md)] @min-[1024px]/grid-row:w-[var(--grid-col-width-lg)] @min-[1024px]/grid-row:[margin-inline-start:var(--grid-col-offset-lg)] @min-[1280px]/grid-row:w-[var(--grid-col-width-xl)] @min-[1280px]/grid-row:[margin-inline-start:var(--grid-col-offset-xl)] @min-[1536px]/grid-row:w-[var(--grid-col-width-xxl)] @min-[1536px]/grid-row:[margin-inline-start:var(--grid-col-offset-xxl)]'
const visibilityStyles: Record<GridBreakpoint, { show: string; hide: string }> =
  {
    xs: { show: 'block', hide: 'hidden' },
    sm: {
      show: '@min-[640px]/grid-row:block',
      hide: '@min-[640px]/grid-row:hidden',
    },
    md: {
      show: '@min-[768px]/grid-row:block',
      hide: '@min-[768px]/grid-row:hidden',
    },
    lg: {
      show: '@min-[1024px]/grid-row:block',
      hide: '@min-[1024px]/grid-row:hidden',
    },
    xl: {
      show: '@min-[1280px]/grid-row:block',
      hide: '@min-[1280px]/grid-row:hidden',
    },
    xxl: {
      show: '@min-[1536px]/grid-row:block',
      hide: '@min-[1536px]/grid-row:hidden',
    },
  }
const alignStyles = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
} as const
const justifyStyles = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
} as const

function responsiveValues<T>(
  value: T | GridResponsive<T>,
  fallback: T,
): Record<GridBreakpoint, T> {
  const responsive =
    value !== null && typeof value === 'object' && !Array.isArray(value)
      ? (value as GridResponsive<T>)
      : undefined
  const resolved = {} as Record<GridBreakpoint, T>
  let previous = fallback
  for (const breakpoint of breakpoints) {
    previous =
      responsive?.[breakpoint] ?? (responsive ? previous : (value as T))
    resolved[breakpoint] = previous
  }
  return resolved
}

function safeSpan(value: number) {
  return Number.isFinite(value)
    ? Math.max(0, Math.min(24, Math.floor(value)))
    : 24
}

function safeGutter(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.min(256, value)) : 0
}

function gutterPair(value: number | readonly [number, number]) {
  return typeof value === 'number'
    ? [safeGutter(value), 0]
    : [safeGutter(value[0]), safeGutter(value[1])]
}

/** A 24-column row whose breakpoints follow its own available width. */
export function GridRow({
  gutter = 0,
  align = 'stretch',
  justify = 'start',
  className,
  style,
  children,
  ...props
}: GridRowProps) {
  const gutters = responsiveValues(gutter, 0)
  const variables: Record<string, string> = {}
  for (const breakpoint of breakpoints) {
    const [horizontal, vertical] = gutterPair(gutters[breakpoint])
    variables[`--grid-gap-x-${breakpoint}`] = `${horizontal}px`
    variables[`--grid-gap-y-${breakpoint}`] = `${vertical}px`
  }

  return (
    <div
      data-grid-row=""
      className={cn('@container/grid-row min-w-0 w-full', className)}
      style={{ ...variables, ...style } as CSSProperties}
      {...props}
    >
      <div
        data-grid-row-inner=""
        className={cn(
          'flex min-w-0 w-full flex-wrap gap-y-[var(--grid-gap-y)]',
          rowGutterStyles,
          alignStyles[align],
          justifyStyles[justify],
        )}
      >
        {children}
      </div>
    </div>
  )
}

/** Columns keep DOM order; span zero removes the item at that breakpoint. */
export function GridCol({
  span = 24,
  offset = 0,
  className,
  style,
  ...props
}: GridColProps) {
  const spans = responsiveValues(span, 24)
  const offsets = responsiveValues(offset, 0)
  const variables: Record<string, string> = {}
  const visibility: string[] = []
  for (const breakpoint of breakpoints) {
    const count = safeSpan(spans[breakpoint])
    const requestedOffset = safeSpan(offsets[breakpoint])
    const appliedOffset =
      count === 0 ? 0 : Math.min(requestedOffset, 24 - count)
    variables[`--grid-col-width-${breakpoint}`] = `${(count / 24) * 100}%`
    variables[`--grid-col-offset-${breakpoint}`] =
      `${(appliedOffset / 24) * 100}%`
    visibility.push(visibilityStyles[breakpoint][count === 0 ? 'hide' : 'show'])
  }

  return (
    <div
      data-grid-col=""
      className={cn(
        'min-w-0 flex-none px-[calc(var(--grid-gap-x,0px)/2)]',
        columnLayoutStyles,
        visibility,
        className,
      )}
      style={{ ...variables, ...style } as CSSProperties}
      {...props}
    />
  )
}
