import {
  Children,
  useId,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { GridCol, GridRow } from './grid-layout'

type Gap = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type Alignment = 'start' | 'center' | 'end' | 'stretch'

const gapStyles = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
} as const

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
} as const

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
      className={cn(
        'flex',
        direction === 'row' ? 'flex-row' : 'flex-col',
        gapStyles[gap],
        alignStyles[align],
        justifyStyles[justify],
        wrap && 'flex-wrap',
        className,
      )}
      style={style}
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

export type SpaceCompactProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> & {
  children?: ReactNode
  direction?: 'horizontal' | 'vertical'
  block?: boolean
}

const spaceGap: Record<'small' | 'middle' | 'large', Gap> = {
  small: 'sm',
  middle: 'md',
  large: 'lg',
}

/** Ant Design-like spacing primitive; unlike Stack it defaults to a row. */
function SpaceBase({
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
      className={cn(
        'inline-flex max-w-full gap-[var(--ui-space-gap)]',
        direction === 'vertical' ? 'flex-col' : 'flex-row',
        alignStyles[align],
        wrap && 'flex-wrap',
        className,
      )}
      style={{ '--ui-space-gap': gap, ...style } as CSSProperties}
      {...props}
    >
      {content.map((child, index) => (
        <span
          className="inline-flex min-w-0 items-center gap-[var(--ui-space-gap)]"
          key={`space-${index}`}
        >
          {child}
          {split && index < content.length - 1 && (
            <span className="text-muted-foreground" aria-hidden="true">
              {split}
            </span>
          )}
        </span>
      ))}
    </div>
  )
}

/** Joined controls for compact toolbars while preserving each child's semantics. */
export function SpaceCompact({
  direction = 'horizontal',
  block = false,
  children,
  className,
  role,
  ...props
}: SpaceCompactProps) {
  return (
    <div
      data-ui-space-compact=""
      role={role ?? (props['aria-label'] ? 'group' : undefined)}
      className={cn(
        'inline-flex max-w-full [&>*]:rounded-none [&>*]:whitespace-nowrap [&>*]:focus-visible:z-10 [&>*+*]:-ms-px [&>*:first-child]:rounded-s-[var(--ui-field-radius)] [&>*:last-child]:rounded-e-[var(--ui-field-radius)]',
        '[&>[data-ui-input-root]]:w-auto [&>[data-ui-input-root]:focus-within]:z-10 [&>[data-ui-input-root]>input]:max-w-full [&>[data-ui-input-root]>input]:rounded-none [&>[data-ui-input-root]:first-child>input]:rounded-s-[var(--ui-field-radius)] [&>[data-ui-input-root]:last-child>input]:rounded-e-[var(--ui-field-radius)]',
        '[&>[data-ui-select-root]]:w-auto [&>[data-ui-select-root]:focus-within]:z-10 [&>[data-ui-select-root]>button:first-child]:rounded-none [&>[data-ui-select-root]:first-child>button:first-child]:rounded-s-[var(--ui-field-radius)] [&>[data-ui-select-root]:last-child>button:first-child]:rounded-e-[var(--ui-field-radius)]',
        '[&>[data-ui-affix-root]]:w-auto [&>[data-ui-affix-root]:focus-within]:z-10',
        '[&>[data-ui-textarea-root]]:w-auto [&>[data-ui-textarea-root]:focus-within]:z-10 [&>[data-ui-textarea-root]>span>textarea]:rounded-none [&>[data-ui-textarea-root]:first-child>span>textarea]:rounded-s-[var(--ui-field-radius)] [&>[data-ui-textarea-root]:last-child>span>textarea]:rounded-e-[var(--ui-field-radius)]',
        direction === 'vertical'
          ? 'flex-col [&>*+*]:-mt-px [&>*+*]:-ms-0 [&>*:first-child]:rounded-s-none [&>*:first-child]:rounded-t-[var(--ui-field-radius)] [&>*:last-child]:rounded-e-none [&>*:last-child]:rounded-b-[var(--ui-field-radius)] [&>[data-ui-input-root]:first-child>input]:rounded-s-none [&>[data-ui-input-root]:first-child>input]:rounded-t-[var(--ui-field-radius)] [&>[data-ui-input-root]:last-child>input]:rounded-e-none [&>[data-ui-input-root]:last-child>input]:rounded-b-[var(--ui-field-radius)] [&>[data-ui-select-root]:first-child>button:first-child]:rounded-s-none [&>[data-ui-select-root]:first-child>button:first-child]:rounded-t-[var(--ui-field-radius)] [&>[data-ui-select-root]:last-child>button:first-child]:rounded-e-none [&>[data-ui-select-root]:last-child>button:first-child]:rounded-b-[var(--ui-field-radius)] [&>[data-ui-textarea-root]:first-child>span>textarea]:rounded-s-none [&>[data-ui-textarea-root]:first-child>span>textarea]:rounded-t-[var(--ui-field-radius)] [&>[data-ui-textarea-root]:last-child>span>textarea]:rounded-e-none [&>[data-ui-textarea-root]:last-child>span>textarea]:rounded-b-[var(--ui-field-radius)]'
          : 'flex-row',
        block &&
          'flex w-full [&>[data-ui-input-root]]:min-w-0 [&>[data-ui-input-root]]:flex-1 [&>[data-ui-affix-root]]:min-w-0 [&>[data-ui-affix-root]]:flex-1',
        className,
      )}
      {...props}
    >
      {Children.toArray(children)}
    </div>
  )
}

export const Space = Object.assign(SpaceBase, { Compact: SpaceCompact })

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
      className={cn(
        'grid grid-cols-[repeat(auto-fit,minmax(min(100%,var(--ui-grid-min)),1fr))]',
        gapStyles[gap],
        className,
      )}
      style={
        {
          '--ui-grid-min': minItemWidth,
          ...style,
        } as CSSProperties
      }
      {...props}
    />
  )
}

Grid.Row = GridRow
Grid.Col = GridCol

type DividerBaseProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  variant?: 'solid' | 'dashed' | 'dotted'
}

export type DividerProps = DividerBaseProps &
  (
    | {
        orientation?: 'horizontal'
        children?: ReactNode
        titlePlacement?: 'start' | 'center' | 'end'
        plain?: boolean
      }
    | {
        orientation: 'vertical'
        children?: never
        titlePlacement?: never
        plain?: never
      }
  )

const dividerLineStyles = {
  solid: 'border-solid',
  dashed: 'border-dashed',
  dotted: 'border-dotted',
} as const

export function Divider({
  orientation = 'horizontal',
  variant = 'solid',
  titlePlacement = 'center',
  plain = false,
  children,
  className,
  ...props
}: DividerProps) {
  const titleId = useId()
  const hasTitle =
    orientation === 'horizontal' &&
    children !== undefined &&
    children !== null &&
    children !== false &&
    children !== ''

  if (hasTitle) {
    return (
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-labelledby={
          props['aria-label'] || props['aria-labelledby'] ? undefined : titleId
        }
        className={cn('my-4 flex w-full min-w-0 items-center gap-3', className)}
        {...props}
      >
        <span
          aria-hidden="true"
          className={cn(
            'min-w-0 border-t border-border',
            dividerLineStyles[variant],
            titlePlacement === 'start' ? 'w-4 shrink-0' : 'flex-1',
          )}
        />
        <span
          id={titleId}
          className={cn(
            'min-w-0 max-w-[80%] break-words text-center text-sm',
            plain
              ? 'font-normal text-muted-foreground'
              : 'font-semibold text-foreground',
          )}
        >
          {children}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'min-w-0 border-t border-border',
            dividerLineStyles[variant],
            titlePlacement === 'end' ? 'w-4 shrink-0' : 'flex-1',
          )}
        />
      </div>
    )
  }

  return (
    <hr
      aria-orientation={orientation}
      className={cn(
        orientation === 'vertical'
          ? 'mx-2 my-0 h-auto w-px self-stretch border-0 border-s border-border'
          : 'mx-0 my-4 border-0 border-t border-border',
        dividerLineStyles[variant],
        className,
      )}
      {...props}
    />
  )
}
