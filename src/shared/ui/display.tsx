import {
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { CloseIcon } from './icons'

type Tone = 'default' | 'success' | 'warning' | 'error'

const tagToneStyles = {
  default: 'border-border bg-muted text-foreground',
  success:
    'border-[var(--ui-color-success)] bg-[var(--ui-map-success-bg)] text-[var(--ui-color-success)]',
  warning:
    'border-[var(--ui-color-warning)] bg-[var(--ui-map-warning-bg)] text-[var(--ui-color-warning)]',
  error:
    'border-[var(--ui-color-error)] bg-[var(--ui-map-error-bg)] text-[var(--ui-color-error)]',
} as const

export type TagProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone
  selectable?: boolean
  selected?: boolean
  defaultSelected?: boolean
  onSelectedChange?: (selected: boolean) => void
  closable?: boolean
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onClose?: (event: MouseEvent<HTMLButtonElement>) => void
  closeIcon?: ReactNode
  closeLabel?: string
  disabled?: boolean
}

function nextTagFocusTarget(root: HTMLElement): HTMLElement | null {
  const parent = root.parentElement
  if (!parent) return null
  const focusable = Array.from(
    parent.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href], input:not(:disabled), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(
    (element) =>
      !root.contains(element) &&
      element.tabIndex >= 0 &&
      !element.closest('[hidden]') &&
      element.getAttribute('aria-disabled') !== 'true',
  )
  return (
    focusable.find(
      (element) =>
        root.compareDocumentPosition(element) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ) ??
    focusable.at(-1) ??
    null
  )
}

export function Tag({
  tone = 'default',
  selectable = false,
  selected,
  defaultSelected = false,
  onSelectedChange,
  closable = false,
  open,
  defaultOpen = true,
  onOpenChange,
  onClose,
  closeIcon,
  closeLabel,
  disabled = false,
  children,
  className,
  ...props
}: TagProps) {
  const [internalSelected, setInternalSelected] = useState(defaultSelected)
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const visible = open ?? internalOpen
  const isSelected = selected ?? internalSelected
  const focusTarget = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (visible || !focusTarget.current) return
    if (focusTarget.current.isConnected) focusTarget.current.focus()
    focusTarget.current = null
  }, [visible])

  useEffect(
    () => () => {
      if (focusTarget.current?.isConnected) focusTarget.current.focus()
    },
    [],
  )

  if (!visible) return null

  return (
    <span
      data-ui-tag=""
      data-ui-tone={tone}
      data-ui-selected={selectable ? isSelected : undefined}
      className={cn(
        'inline-flex items-center rounded-[0.35rem] border px-2 py-0.5 text-sm font-semibold',
        tagToneStyles[tone],
        selectable && 'gap-2 p-0',
        closable && !selectable && 'gap-2 pe-0',
        isSelected &&
          selectable &&
          'border-primary bg-primary text-primary-foreground',
        disabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      {selectable ? (
        <button
          type="button"
          aria-pressed={isSelected}
          disabled={disabled}
          className="min-h-11 min-w-11 rounded-[0.35rem] px-3 py-2 text-start outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring enabled:cursor-pointer enabled:active:opacity-75"
          onClick={() => {
            if (selected === undefined) setInternalSelected(!isSelected)
            onSelectedChange?.(!isSelected)
          }}
        >
          {children}
        </button>
      ) : (
        children
      )}
      {closable && (
        <button
          type="button"
          aria-label={
            closeLabel ??
            (typeof children === 'string' ? `关闭${children}` : '关闭标签')
          }
          disabled={disabled}
          className="inline-grid size-11 shrink-0 place-items-center rounded-[0.35rem] outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring enabled:cursor-pointer enabled:active:opacity-75"
          onClick={(event) => {
            const root = event.currentTarget.parentElement
            focusTarget.current = root ? nextTagFocusTarget(root) : null
            onClose?.(event)
            if (event.defaultPrevented) {
              focusTarget.current = null
              return
            }
            if (open === undefined) setInternalOpen(false)
            onOpenChange?.(false)
          }}
        >
          {closeIcon ?? <CloseIcon />}
        </button>
      )}
    </span>
  )
}

export type SkeletonParagraph = {
  rows?: number
  width?: string | number | Array<string | number>
}

export type SkeletonProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  width?: string | number
  height?: string | number
  shape?: 'line' | 'circle' | 'block' | 'content'
  label?: string
  loading?: boolean
  active?: boolean
  avatar?: boolean | { size?: number; shape?: 'circle' | 'square' }
  title?: boolean | { width?: string | number }
  paragraph?: boolean | SkeletonParagraph
  round?: boolean
}
export function Skeleton({
  width,
  height,
  shape = 'line',
  label = '正在加载',
  loading = true,
  active = true,
  avatar = false,
  title = true,
  paragraph = true,
  round = false,
  children,
  className,
  style,
  ...props
}: SkeletonProps) {
  if (!loading) return <>{children}</>

  const animationClass = active && 'animate-pulse motion-reduce:animate-none'
  if (shape === 'content') {
    const avatarConfig = typeof avatar === 'object' ? avatar : undefined
    const avatarSize =
      avatarConfig?.size !== undefined && Number.isFinite(avatarConfig.size)
        ? Math.max(16, Math.min(160, avatarConfig.size))
        : 48
    const titleWidth = typeof title === 'object' ? title.width : undefined
    const paragraphConfig =
      typeof paragraph === 'object' ? paragraph : undefined
    const requestedRows = paragraphConfig?.rows
    const rows =
      requestedRows !== undefined && Number.isFinite(requestedRows)
        ? Math.max(1, Math.min(20, Math.floor(requestedRows)))
        : 3
    const paragraphWidth = paragraphConfig?.width
    return (
      <div
        role="status"
        aria-label={label}
        data-ui-skeleton="content"
        className={cn('flex w-full max-w-full items-start gap-4', className)}
        style={style}
        {...props}
      >
        {avatar && (
          <span
            aria-hidden="true"
            data-ui-skeleton-avatar=""
            className={cn(
              'shrink-0 bg-secondary',
              avatarConfig?.shape === 'square'
                ? 'rounded-[var(--radius-sm)]'
                : 'rounded-full',
              animationClass,
            )}
            style={{ width: avatarSize, height: avatarSize }}
          />
        )}
        <span aria-hidden="true" className="min-w-0 flex-1 space-y-3">
          {title !== false && (
            <span
              data-ui-skeleton-title=""
              className={cn(
                'block h-5 max-w-full bg-secondary',
                round ? 'rounded-full' : 'rounded-[var(--radius-sm)]',
                animationClass,
              )}
              style={{ width: titleWidth ?? '40%' }}
            />
          )}
          {paragraph !== false && (
            <span data-ui-skeleton-paragraph="" className="block space-y-2">
              {Array.from({ length: rows }, (_, index) => {
                const rowWidth = Array.isArray(paragraphWidth)
                  ? (paragraphWidth[index] ?? '100%')
                  : index === rows - 1
                    ? (paragraphWidth ?? '60%')
                    : '100%'
                return (
                  <span
                    key={index}
                    data-ui-skeleton-row={index}
                    className={cn(
                      'block h-4 max-w-full bg-secondary',
                      round ? 'rounded-full' : 'rounded-[var(--radius-sm)]',
                      animationClass,
                    )}
                    style={{ width: rowWidth }}
                  />
                )
              })}
            </span>
          )}
        </span>
      </div>
    )
  }
  const shapeStyles = {
    line: 'h-4 w-full rounded-[var(--radius-sm)]',
    circle: 'size-12 rounded-full',
    block: 'h-24 w-full rounded-[var(--radius-sm)]',
  } as const
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        'bg-secondary',
        animationClass,
        shapeStyles[shape],
        className,
      )}
      style={{ width, height, ...style }}
      {...props}
    />
  )
}
