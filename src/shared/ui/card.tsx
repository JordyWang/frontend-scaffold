import {
  createContext,
  useContext,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { useConfig } from './config-context'

type CardSize = 'default' | 'small'
const CardSizeContext = createContext<CardSize>('default')

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

function useCardSize() {
  return useContext(CardSizeContext)
}

export type CardProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  title?: ReactNode
  extra?: ReactNode
  cover?: ReactNode
  actions?: ReactNode[]
  hoverable?: boolean
  loading?: boolean
  bordered?: boolean
  size?: CardSize
  classNames?: Partial<Record<CardPart, string>>
}

/** A project-owned card that supports both compound children and Ant-style slots. */
export function Card({
  title,
  extra,
  cover,
  actions,
  hoverable = false,
  loading = false,
  bordered = true,
  size,
  classNames,
  className,
  children,
  ...props
}: CardProps) {
  const { componentSize } = useConfig()
  const resolvedSize = size ?? (componentSize === 'small' ? 'small' : 'default')
  return (
    <CardSizeContext.Provider value={resolvedSize}>
      <div
        {...props}
        data-ui-card=""
        data-ui-size={resolvedSize}
        data-ui-card-hoverable={hoverable || undefined}
        data-ui-card-loading={loading || undefined}
        aria-busy={loading ? true : props['aria-busy']}
        className={cn(
          'overflow-hidden rounded-[var(--ui-card-radius)] bg-card text-card-foreground',
          bordered && 'border border-border',
          hoverable &&
            'transition-shadow duration-180 hover:shadow-[0_8px_24px_rgb(15_23_42_/_0.12)] motion-reduce:transition-none',
          classNames?.root,
          className,
        )}
      >
        {cover && (
          <div
            data-ui-card-cover=""
            className={cn('overflow-hidden', classNames?.cover)}
          >
            {cover}
          </div>
        )}
        {(title || extra) && (
          <CardHeader
            data-ui-card-header=""
            className={cn(
              'flex items-start justify-between gap-[var(--space-md)]',
              classNames?.header,
            )}
          >
            <div className="min-w-0">
              {title && (
                <CardTitle data-ui-card-title="" className={classNames?.title}>
                  {title}
                </CardTitle>
              )}
            </div>
            {extra && (
              <div
                data-ui-card-extra=""
                className={cn('shrink-0', classNames?.extra)}
              >
                {extra}
              </div>
            )}
          </CardHeader>
        )}
        <div data-ui-card-body="" className={classNames?.body}>
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
                classNames?.loading,
              )}
            >
              <span className="h-4 w-2/5 animate-pulse rounded bg-secondary motion-reduce:animate-none" />
              <span className="h-4 w-full animate-pulse rounded bg-secondary motion-reduce:animate-none" />
              <span className="h-4 w-4/5 animate-pulse rounded bg-secondary motion-reduce:animate-none" />
            </div>
          ) : (
            children
          )}
        </div>
        {actions?.length ? (
          <CardFooter
            data-ui-card-actions=""
            className={cn(
              'grid grid-flow-col auto-cols-fr p-0 pt-0',
              classNames?.actions,
            )}
          >
            {actions.map((action, index) => (
              <div
                key={index}
                data-ui-card-action=""
                className={cn(
                  'flex min-h-11 items-center justify-center border-s border-border px-3 py-2 first:border-s-0',
                  classNames?.action,
                )}
              >
                {action}
              </div>
            ))}
          </CardFooter>
        ) : null}
      </div>
    </CardSizeContext.Provider>
  )
}
export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const size = useCardSize()
  return (
    <div
      className={cn(
        'grid gap-[var(--space-xs)]',
        size === 'small' ? 'p-[var(--space-md)]' : 'p-[var(--space-lg)]',
        'pb-0',
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
  const size = useCardSize()
  return (
    <h3
      className={cn(
        'm-0 font-[650]',
        size === 'small' ? 'text-base' : 'text-lg',
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

export type CardMetaProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  avatar?: ReactNode
  title?: ReactNode
  description?: ReactNode
  headingLevel?: 3 | 4 | 5 | 6
  classNames?: Partial<Record<CardMetaPart, string>>
}

/** Avatar, title and description content for a Card body. */
export function CardMeta({
  avatar,
  title,
  description,
  headingLevel = 3,
  classNames,
  className,
  ...props
}: CardMetaProps) {
  const size = useCardSize()
  const Heading = `h${headingLevel}` as const
  return (
    <div
      {...props}
      data-ui-card-meta=""
      className={cn(
        'flex min-w-0 items-start',
        size === 'small' ? 'gap-[var(--space-sm)]' : 'gap-[var(--space-md)]',
        classNames?.root,
        className,
      )}
    >
      {avatar != null && avatar !== false && (
        <div
          data-ui-card-meta-avatar=""
          className={cn('shrink-0', classNames?.avatar)}
        >
          {avatar}
        </div>
      )}
      <div
        data-ui-card-meta-section=""
        className={cn('min-w-0 flex-1', classNames?.section)}
      >
        {title != null && title !== false && (
          <Heading
            data-ui-card-meta-title=""
            className={cn(
              'm-0 break-words font-semibold leading-6',
              size === 'small' ? 'text-sm' : 'text-base',
              classNames?.title,
            )}
          >
            {title}
          </Heading>
        )}
        {description != null && description !== false && (
          <div
            data-ui-card-meta-description=""
            className={cn(
              'min-w-0 break-words text-sm leading-6 text-muted-foreground',
              classNames?.description,
            )}
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
