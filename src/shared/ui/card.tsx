import {
  createContext,
  useContext,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { useConfig } from './config-context'
import { Tabs, type TabsProps } from './tabs'

type CardSize = 'default' | 'small'
export type CardVariant = 'outlined' | 'borderless'
export type CardAppearance = 'default' | 'inner'
const CardContext = createContext<{
  size: CardSize
  appearance: CardAppearance
}>({ size: 'default', appearance: 'default' })

export type CardPart =
  | 'root'
  | 'header'
  | 'title'
  | 'extra'
  | 'cover'
  | 'body'
  | 'actions'
  | 'action'
  | 'loading'
  | 'tabs'
export type CardSemanticInfo = { props: CardProps }
export type CardClassNames =
  | Partial<Record<CardPart, string>>
  | ((info: CardSemanticInfo) => Partial<Record<CardPart, string>>)
export type CardStyles =
  | Partial<Record<CardPart, CSSProperties>>
  | ((info: CardSemanticInfo) => Partial<Record<CardPart, CSSProperties>>)

function useCardSize() {
  return useContext(CardContext).size
}

type CardBaseProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'title' | 'children'
> & {
  title?: ReactNode
  extra?: ReactNode
  cover?: ReactNode
  actions?: ReactNode[]
  hoverable?: boolean
  loading?: boolean
  variant?: CardVariant
  appearance?: CardAppearance
  /** @deprecated Use variant="outlined" or variant="borderless". */
  bordered?: boolean
  size?: CardSize
  classNames?: CardClassNames
  styles?: CardStyles
}

export type CardTabsProps = Omit<TabsProps, 'children'>
export type CardProps = CardBaseProps &
  (
    | { tabs: CardTabsProps; children?: never }
    | { tabs?: undefined; children?: ReactNode }
  )

/** A project-owned card that supports both compound children and Ant-style slots. */
export function Card(cardProps: CardProps) {
  const {
    title,
    extra,
    cover,
    actions,
    hoverable = false,
    loading = false,
    variant,
    appearance = 'default',
    bordered,
    size,
    tabs,
    classNames,
    styles,
    className,
    style: rootStyle,
    children,
    ...props
  } = cardProps
  const { componentSize } = useConfig()
  const resolvedSize = size ?? (componentSize === 'small' ? 'small' : 'default')
  const resolvedVariant =
    variant ?? (bordered === false ? 'borderless' : 'outlined')
  const semanticInfo: CardSemanticInfo = { props: cardProps }
  const semanticClassNames =
    typeof classNames === 'function' ? classNames(semanticInfo) : classNames
  const semanticStyles =
    typeof styles === 'function' ? styles(semanticInfo) : styles
  const hasTitle = title !== undefined && title !== null && title !== false
  const hasExtra = extra !== undefined && extra !== null && extra !== false
  const hasCover = cover !== undefined && cover !== null && cover !== false
  return (
    <CardContext.Provider value={{ size: resolvedSize, appearance }}>
      <div
        {...props}
        data-ui-card=""
        data-ui-size={resolvedSize}
        data-ui-variant={resolvedVariant}
        data-ui-appearance={appearance}
        data-ui-card-hoverable={hoverable || undefined}
        data-ui-card-loading={loading || undefined}
        aria-busy={loading ? true : props['aria-busy']}
        className={cn(
          'overflow-hidden rounded-[var(--ui-card-radius)] bg-card text-card-foreground',
          appearance === 'inner' && 'rounded-[var(--radius-md)]',
          resolvedVariant === 'outlined' && 'border border-border',
          hoverable &&
            'transition-shadow duration-180 hover:shadow-[0_8px_24px_rgb(15_23_42_/_0.12)] motion-reduce:transition-none',
          semanticClassNames?.root,
          className,
        )}
        style={{ ...semanticStyles?.root, ...rootStyle }}
      >
        {hasCover && (
          <div
            data-ui-card-cover=""
            className={cn('overflow-hidden', semanticClassNames?.cover)}
            style={semanticStyles?.cover}
          >
            {cover}
          </div>
        )}
        {(hasTitle || hasExtra) && (
          <CardHeader
            data-ui-card-header=""
            className={cn(
              'flex items-start justify-between gap-[var(--space-md)]',
              semanticClassNames?.header,
            )}
            style={semanticStyles?.header}
          >
            <div className="min-w-0">
              {hasTitle && (
                <CardTitle
                  data-ui-card-title=""
                  className={semanticClassNames?.title}
                  style={semanticStyles?.title}
                >
                  {title}
                </CardTitle>
              )}
            </div>
            {hasExtra && (
              <div
                data-ui-card-extra=""
                className={cn('shrink-0', semanticClassNames?.extra)}
                style={semanticStyles?.extra}
              >
                {extra}
              </div>
            )}
          </CardHeader>
        )}
        <div
          data-ui-card-body=""
          className={semanticClassNames?.body}
          style={semanticStyles?.body}
        >
          {loading ? (
            <div
              role="status"
              aria-label="正在加载"
              data-ui-card-loading-placeholder=""
              className={cn(
                'grid gap-3',
                resolvedSize === 'small'
                  ? 'p-[var(--space-md)]'
                  : 'p-[var(--space-lg)]',
                semanticClassNames?.loading,
              )}
              style={semanticStyles?.loading}
            >
              <span className="h-4 w-2/5 animate-pulse rounded bg-secondary motion-reduce:animate-none" />
              <span className="h-4 w-full animate-pulse rounded bg-secondary motion-reduce:animate-none" />
              <span className="h-4 w-4/5 animate-pulse rounded bg-secondary motion-reduce:animate-none" />
            </div>
          ) : tabs ? (
            <Tabs
              {...tabs}
              size={tabs.size ?? resolvedSize}
              className={cn(semanticClassNames?.tabs, tabs.className)}
              style={{ ...semanticStyles?.tabs, ...tabs.style }}
              classNames={{
                ...tabs.classNames,
                header: cn(
                  resolvedSize === 'small'
                    ? 'px-[var(--space-md)]'
                    : 'px-[var(--space-lg)]',
                  tabs.classNames?.header,
                ),
                body: cn(
                  resolvedSize === 'small'
                    ? 'px-[var(--space-md)] py-[var(--space-md)]'
                    : 'px-[var(--space-lg)] py-[var(--space-lg)]',
                  tabs.classNames?.body,
                ),
              }}
            />
          ) : (
            children
          )}
        </div>
        {actions?.length ? (
          <CardFooter
            data-ui-card-actions=""
            className={cn(
              'grid grid-flow-col auto-cols-fr p-0 pt-0',
              semanticClassNames?.actions,
            )}
            style={semanticStyles?.actions}
          >
            {actions.map((action, index) => (
              <div
                key={index}
                data-ui-card-action=""
                className={cn(
                  'flex min-h-11 items-center justify-center border-s border-border px-3 py-2 first:border-s-0',
                  semanticClassNames?.action,
                )}
                style={semanticStyles?.action}
              >
                {action}
              </div>
            ))}
          </CardFooter>
        ) : null}
      </div>
    </CardContext.Provider>
  )
}
export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { size, appearance } = useContext(CardContext)
  return (
    <div
      className={cn(
        'grid gap-[var(--space-xs)]',
        size === 'small' ? 'p-[var(--space-md)]' : 'p-[var(--space-lg)]',
        'pb-0',
        appearance === 'inner' &&
          'border-b border-border bg-muted/40 pb-[var(--space-md)]',
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
  const { size, appearance } = useContext(CardContext)
  return (
    <h3
      className={cn(
        'm-0 font-[650]',
        size === 'small' || appearance === 'inner' ? 'text-base' : 'text-lg',
        className,
      )}
      {...props}
    />
  )
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
  const size = useCardSize()
  return (
    <div
      className={cn(
        size === 'small' ? 'p-[var(--space-md)]' : 'p-[var(--space-lg)]',
        className,
      )}
      {...props}
    />
  )
}
export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const size = useCardSize()
  return (
    <div
      className={cn(
        'flex flex-wrap gap-[var(--space-sm)]',
        size === 'small' ? 'p-[var(--space-md)]' : 'p-[var(--space-lg)]',
        'pt-0',
        className,
      )}
      {...props}
    />
  )
}

export type CardMetaPart =
  'root' | 'avatar' | 'section' | 'title' | 'description'
export type CardMetaSemanticInfo = { props: CardMetaProps }
export type CardMetaClassNames =
  | Partial<Record<CardMetaPart, string>>
  | ((info: CardMetaSemanticInfo) => Partial<Record<CardMetaPart, string>>)
export type CardMetaStyles =
  | Partial<Record<CardMetaPart, CSSProperties>>
  | ((
      info: CardMetaSemanticInfo,
    ) => Partial<Record<CardMetaPart, CSSProperties>>)

export type CardMetaProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  avatar?: ReactNode
  title?: ReactNode
  description?: ReactNode
  headingLevel?: 3 | 4 | 5 | 6
  classNames?: CardMetaClassNames
  styles?: CardMetaStyles
}

/** Avatar, title and description content for a Card body. */
export function CardMeta(metaProps: CardMetaProps) {
  const {
    avatar,
    title,
    description,
    headingLevel = 3,
    classNames,
    styles,
    className,
    style: rootStyle,
    ...props
  } = metaProps
  const size = useCardSize()
  const Heading = `h${headingLevel}` as const
  const semanticInfo: CardMetaSemanticInfo = { props: metaProps }
  const semanticClassNames =
    typeof classNames === 'function' ? classNames(semanticInfo) : classNames
  const semanticStyles =
    typeof styles === 'function' ? styles(semanticInfo) : styles
  return (
    <div
      {...props}
      data-ui-card-meta=""
      className={cn(
        'flex min-w-0 items-start',
        size === 'small' ? 'gap-[var(--space-sm)]' : 'gap-[var(--space-md)]',
        semanticClassNames?.root,
        className,
      )}
      style={{ ...semanticStyles?.root, ...rootStyle }}
    >
      {avatar != null && avatar !== false && (
        <div
          data-ui-card-meta-avatar=""
          className={cn('shrink-0', semanticClassNames?.avatar)}
          style={semanticStyles?.avatar}
        >
          {avatar}
        </div>
      )}
      <div
        data-ui-card-meta-section=""
        className={cn('min-w-0 flex-1', semanticClassNames?.section)}
        style={semanticStyles?.section}
      >
        {title != null && title !== false && (
          <Heading
            data-ui-card-meta-title=""
            className={cn(
              'm-0 break-words font-semibold leading-6',
              size === 'small' ? 'text-sm' : 'text-base',
              semanticClassNames?.title,
            )}
            style={semanticStyles?.title}
          >
            {title}
          </Heading>
        )}
        {description != null && description !== false && (
          <div
            data-ui-card-meta-description=""
            className={cn(
              'min-w-0 break-words text-sm leading-6 text-muted-foreground',
              semanticClassNames?.description,
            )}
            style={semanticStyles?.description}
          >
            {description}
          </div>
        )}
      </div>
    </div>
  )
}

const cardGridColumns = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 @min-[30rem]/card-grid:grid-cols-2',
  3: 'grid-cols-1 @min-[30rem]/card-grid:grid-cols-2 @min-[48rem]/card-grid:grid-cols-3',
  4: 'grid-cols-1 @min-[30rem]/card-grid:grid-cols-2 @min-[48rem]/card-grid:grid-cols-3 @min-[64rem]/card-grid:grid-cols-4',
} as const

export type CardGridGroupProps = HTMLAttributes<HTMLDivElement> & {
  columns?: 1 | 2 | 3 | 4
  classNames?: { root?: string; grid?: string }
}

/** A card-local responsive list of equal-width tiles. */
export function CardGridGroup({
  columns = 3,
  classNames,
  className,
  children,
  ...props
}: CardGridGroupProps) {
  return (
    <div
      {...props}
      role="list"
      data-ui-card-grid-group=""
      data-ui-columns={columns}
      className={cn(
        '@container/card-grid min-w-0',
        classNames?.root,
        className,
      )}
    >
      <div
        data-ui-card-grid-layout=""
        className={cn(
          'grid gap-px border-y border-border bg-border',
          cardGridColumns[columns],
          classNames?.grid,
        )}
      >
        {children}
      </div>
    </div>
  )
}

export type CardGridProps = HTMLAttributes<HTMLDivElement> & {
  hoverable?: boolean
}

/** A tile inside CardGridGroup; put links or buttons in children. */
export function CardGrid({
  hoverable = true,
  className,
  ...props
}: CardGridProps) {
  const size = useCardSize()
  return (
    <div
      {...props}
      role="listitem"
      data-ui-card-grid=""
      data-ui-card-grid-hoverable={hoverable || undefined}
      className={cn(
        'min-w-0 break-words bg-card',
        size === 'small' ? 'p-[var(--space-md)]' : 'p-[var(--space-lg)]',
        hoverable &&
          'transition-colors duration-180 hover:bg-muted/40 focus-within:bg-muted/40 motion-reduce:transition-none',
        className,
      )}
    />
  )
}
