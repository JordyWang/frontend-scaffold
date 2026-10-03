import {
  useId,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import {
  resolveComponentSize,
  useConfig,
  type ControlSize,
} from './config-context'
import { Empty } from './empty'

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
type Responsive<T> = Partial<Record<Breakpoint, T>>
export type DescriptionColumns = number | Responsive<number>
export type DescriptionSpan = number | 'filled' | Responsive<number | 'filled'>
export type DescriptionItem = {
  key: string
  label: ReactNode
  children: ReactNode
  span?: DescriptionSpan
  className?: string
  labelClassName?: string
  contentClassName?: string
}

export type DescriptionPart =
  | 'root'
  | 'header'
  | 'title'
  | 'extra'
  | 'body'
  | 'item'
  | 'label'
  | 'content'
  | 'empty'
export type DescriptionSemanticInfo = {
  props: DescriptionsProps
  size: ControlSize
  state: 'ready' | 'empty'
}
export type DescriptionClassNames =
  | Partial<Record<DescriptionPart, string>>
  | ((
      info: DescriptionSemanticInfo,
    ) => Partial<Record<DescriptionPart, string>>)
export type DescriptionStyles =
  | Partial<Record<DescriptionPart, CSSProperties>>
  | ((
      info: DescriptionSemanticInfo,
    ) => Partial<Record<DescriptionPart, CSSProperties>>)
export type DescriptionsProps = Omit<
  HTMLAttributes<HTMLElement>,
  'title' | 'children'
> & {
  title?: ReactNode
  extra?: ReactNode
  items: DescriptionItem[]
  column?: DescriptionColumns
  bordered?: boolean
  layout?: 'horizontal' | 'vertical'
  size?: ControlSize
  colon?: boolean
  emptyText?: string
  classNames?: DescriptionClassNames
  styles?: DescriptionStyles
}

const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const
const columnStyles =
  'grid-cols-[repeat(var(--description-columns-xs),minmax(0,1fr))] @min-[640px]/descriptions:grid-cols-[repeat(var(--description-columns-sm),minmax(0,1fr))] @min-[768px]/descriptions:grid-cols-[repeat(var(--description-columns-md),minmax(0,1fr))] @min-[1024px]/descriptions:grid-cols-[repeat(var(--description-columns-lg),minmax(0,1fr))] @min-[1280px]/descriptions:grid-cols-[repeat(var(--description-columns-xl),minmax(0,1fr))] @min-[1536px]/descriptions:grid-cols-[repeat(var(--description-columns-xxl),minmax(0,1fr))]'
const positionStyles =
  'col-start-[var(--description-start-xs)] col-span-[var(--description-span-xs)] row-start-[var(--description-row-xs)] @min-[640px]/descriptions:col-start-[var(--description-start-sm)] @min-[640px]/descriptions:col-span-[var(--description-span-sm)] @min-[640px]/descriptions:row-start-[var(--description-row-sm)] @min-[768px]/descriptions:col-start-[var(--description-start-md)] @min-[768px]/descriptions:col-span-[var(--description-span-md)] @min-[768px]/descriptions:row-start-[var(--description-row-md)] @min-[1024px]/descriptions:col-start-[var(--description-start-lg)] @min-[1024px]/descriptions:col-span-[var(--description-span-lg)] @min-[1024px]/descriptions:row-start-[var(--description-row-lg)] @min-[1280px]/descriptions:col-start-[var(--description-start-xl)] @min-[1280px]/descriptions:col-span-[var(--description-span-xl)] @min-[1280px]/descriptions:row-start-[var(--description-row-xl)] @min-[1536px]/descriptions:col-start-[var(--description-start-xxl)] @min-[1536px]/descriptions:col-span-[var(--description-span-xxl)] @min-[1536px]/descriptions:row-start-[var(--description-row-xxl)]'
const cellSizeStyles = {
  small: 'px-3 py-2 text-sm',
  default: 'px-4 py-3 text-base',
  large: 'px-6 py-4 text-base',
}

function positiveInteger(value: number | undefined, fallback: number) {
  return value !== undefined &&
    Number.isFinite(value) &&
    Number.isSafeInteger(Math.floor(value))
    ? Math.max(1, Math.floor(value))
    : fallback
}

function resolveColumns(column: DescriptionColumns) {
  const columns = {} as Record<Breakpoint, number>
  let previous = 1
  for (const breakpoint of breakpoints) {
    previous =
      typeof column === 'number'
        ? breakpoint === 'xs'
          ? 1
          : positiveInteger(column, 3)
        : positiveInteger(column[breakpoint], previous)
    columns[breakpoint] = previous
  }
  return columns
}

function resolveSpans(span: DescriptionSpan = 1) {
  const spans = {} as Record<Breakpoint, number | 'filled'>
  let previous: number | 'filled' = 1
  for (const breakpoint of breakpoints) {
    const requested = typeof span === 'object' ? span[breakpoint] : span
    if (requested === 'filled') previous = 'filled'
    else if (requested !== undefined)
      previous = positiveInteger(
        requested,
        typeof previous === 'number' ? previous : 1,
      )
    spans[breakpoint] = previous
  }
  return spans
}

function descriptionLayout(
  items: DescriptionItem[],
  column: DescriptionColumns,
  vertical: boolean,
) {
  const columns = resolveColumns(column)
  const spans = items.map((item) => resolveSpans(item.span))
  const bodyStyle: Record<string, number> = {}
  const itemStyles = items.map(() => ({}) as Record<string, number>)
  for (const breakpoint of breakpoints) {
    const count = columns[breakpoint]
    bodyStyle[`--description-columns-${breakpoint}`] = count
    let row = 1
    let occupied = 0
    const cells: { row: number; start: number; span: number }[] = []
    for (const span of spans) {
      const requested = span[breakpoint]
      const width =
        requested === 'filled' ? count - occupied : Math.min(count, requested)
      if (occupied > 0 && width > count - occupied) {
        // Fill the preceding row before moving a wide item to the next one.
        cells[cells.length - 1].span += count - occupied
        row++
        occupied = 0
      }
      cells.push({ row, start: occupied + 1, span: width })
      occupied += width
      if (occupied === count) {
        occupied = 0
        row++
      }
    }
    if (occupied > 0) cells[cells.length - 1].span += count - occupied
    cells.forEach((cell, index) => {
      itemStyles[index][`--description-start-${breakpoint}`] = cell.start
      itemStyles[index][`--description-span-${breakpoint}`] = cell.span
      itemStyles[index][`--description-row-${breakpoint}`] = vertical
        ? cell.row * 2 - 1
        : cell.row
    })
  }
  return {
    bodyStyle: bodyStyle as CSSProperties,
    itemStyles: itemStyles as CSSProperties[],
  }
}

/** Read-only field pairs, with responsive rows and a single semantic reading order. */
export function Descriptions(descriptionProps: DescriptionsProps) {
  const {
    title,
    extra,
    items,
    column = 3,
    bordered = false,
    layout = 'horizontal',
    size,
    colon = true,
    emptyText = '暂无详情',
    className,
    classNames,
    styles,
    style: rootStyle,
    ...props
  } = descriptionProps
  const id = useId()
  const { componentSize, direction } = useConfig()
  const resolvedSize = resolveComponentSize(componentSize, size)
  const semanticInfo: DescriptionSemanticInfo = {
    props: descriptionProps,
    size: resolvedSize,
    state: items.length ? 'ready' : 'empty',
  }
  const semanticClassNames =
    typeof classNames === 'function' ? classNames(semanticInfo) : classNames
  const semanticStyles =
    typeof styles === 'function' ? styles(semanticInfo) : styles
  const vertical = layout === 'vertical'
  const { bodyStyle, itemStyles } = descriptionLayout(items, column, vertical)
  const hasTitle =
    title !== undefined &&
    title !== null &&
    typeof title !== 'boolean' &&
    title !== ''
  const titleId = `${id}-title`
  return (
    <section
      dir={direction}
      aria-labelledby={hasTitle && !props['aria-label'] ? titleId : undefined}
      {...props}
      data-ui-descriptions=""
      data-ui-size={resolvedSize}
      data-ui-layout={layout}
      className={cn(
        '@container/descriptions min-w-0 w-full',
        semanticClassNames?.root,
        className,
      )}
      style={{ ...semanticStyles?.root, ...rootStyle }}
    >
      {(hasTitle || extra) && (
        <div
          className={cn(
            'mb-4 flex flex-wrap items-center gap-3',
            semanticClassNames?.header,
          )}
          style={semanticStyles?.header}
        >
          {hasTitle && (
            <h2
              id={titleId}
              className={cn(
                'm-0 min-w-0 flex-1 text-lg font-semibold [overflow-wrap:anywhere]',
                semanticClassNames?.title,
              )}
              style={semanticStyles?.title}
            >
              {title}
            </h2>
          )}
          {extra && (
            <div
              className={cn(
                'ms-auto flex min-w-0 flex-wrap items-center gap-2',
                semanticClassNames?.extra,
              )}
              style={semanticStyles?.extra}
            >
              {extra}
            </div>
          )}
        </div>
      )}
      {items.length === 0 ? (
        <Empty
          title={emptyText}
          size="small"
          className={semanticClassNames?.empty}
          style={semanticStyles?.empty}
        />
      ) : (
        <dl
          className={cn(
            'm-0 grid min-w-0',
            columnStyles,
            bordered
              ? 'gap-px overflow-hidden rounded-[var(--radius-lg)] bg-border p-px'
              : 'gap-x-4 gap-y-4',
            semanticClassNames?.body,
          )}
          style={{ ...semanticStyles?.body, ...bodyStyle }}
        >
          {items.map((item, index) => {
            return (
              <div
                key={item.key}
                data-ui-description-item=""
                className={cn(
                  'grid min-w-0',
                  positionStyles,
                  vertical
                    ? 'row-span-2 grid-cols-1 grid-rows-subgrid'
                    : 'grid-cols-[minmax(min(6rem,45%),1fr)_minmax(0,2fr)]',
                  bordered && 'bg-card',
                  semanticClassNames?.item,
                  item.className,
                )}
                style={{ ...semanticStyles?.item, ...itemStyles[index] }}
              >
                <dt
                  className={cn(
                    'm-0 flex min-w-0 items-start gap-1 leading-normal text-muted-foreground [overflow-wrap:anywhere]',
                    cellSizeStyles[resolvedSize],
                    !bordered && 'px-0',
                    bordered && 'bg-muted',
                    bordered && !vertical && 'border-e border-border',
                    semanticClassNames?.label,
                    item.labelClassName,
                  )}
                  style={semanticStyles?.label}
                >
                  <span className="min-w-0">{item.label}</span>
                  {colon && !bordered && (
                    <span aria-hidden="true" className="shrink-0">
                      :
                    </span>
                  )}
                </dt>
                <dd
                  className={cn(
                    'm-0 min-w-0 leading-normal text-foreground [overflow-wrap:anywhere]',
                    cellSizeStyles[resolvedSize],
                    !bordered && 'px-0',
                    bordered && 'bg-card',
                    vertical && !bordered && 'pt-0',
                    semanticClassNames?.content,
                    item.contentClassName,
                  )}
                  style={semanticStyles?.content}
                >
                  {item.children}
                </dd>
              </div>
            )
          })}
        </dl>
      )}
    </section>
  )
}
