import {
  Children,
  forwardRef,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { Sheet } from './sheet'

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | number
type CollapseSource = 'trigger' | 'breakpoint'

const breakpointWidths = { sm: 640, md: 768, lg: 1024, xl: 1280 }

export type LayoutProps = HTMLAttributes<HTMLDivElement> & {
  hasSider?: boolean
}

export type LayoutSiderProps = Omit<HTMLAttributes<HTMLElement>, 'onChange'> & {
  label: string
  width?: number | string
  collapsedWidth?: number | string
  collapsed?: boolean
  defaultCollapsed?: boolean
  collapsible?: boolean
  collapsedContent?: ReactNode
  trigger?: ReactNode | null
  breakpoint?: Breakpoint
  onBreakpoint?: (broken: boolean) => void
  onCollapse?: (collapsed: boolean, source: CollapseSource) => void
  side?: 'start' | 'end'
}

export type LayoutContentProps = HTMLAttributes<HTMLElement> & {
  as?: 'main' | 'div'
}

function widthValue(value: number | string): string {
  return typeof value === 'number' ? `${Math.max(0, value)}px` : value
}

function breakpointQuery(breakpoint?: Breakpoint) {
  if (breakpoint === undefined) return undefined
  const width =
    typeof breakpoint === 'number' ? breakpoint : breakpointWidths[breakpoint]
  if (!Number.isFinite(width) || width <= 0) return undefined
  return `(max-width: ${Math.max(0, width - 0.02)}px)`
}

function matches(query?: string) {
  return Boolean(
    query &&
    typeof window !== 'undefined' &&
    window.matchMedia?.(query).matches,
  )
}

export const LayoutHeader = forwardRef<
  HTMLElement,
  HTMLAttributes<HTMLElement>
>(function LayoutHeader({ className, ...props }, ref) {
  return (
    <header
      {...props}
      ref={ref}
      className={cn(
        'flex min-h-16 shrink-0 items-center border-b border-border bg-card px-4 text-card-foreground sm:px-6',
        className,
      )}
    />
  )
})

export const LayoutContent = forwardRef<HTMLElement, LayoutContentProps>(
  function LayoutContent({ as = 'main', className, ...props }, ref) {
    const Component = as
    return (
      <Component
        {...props}
        ref={(node) => {
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        className={cn(
          'min-h-0 min-w-0 flex-1 bg-background p-4 text-foreground sm:p-6',
          className,
        )}
      />
    )
  },
)

export const LayoutFooter = forwardRef<
  HTMLElement,
  HTMLAttributes<HTMLElement>
>(function LayoutFooter({ className, ...props }, ref) {
  return (
    <footer
      {...props}
      ref={ref}
      className={cn(
        'shrink-0 border-t border-border bg-card px-4 py-3 text-card-foreground sm:px-6',
        className,
      )}
    />
  )
})

export const LayoutSider = forwardRef<HTMLElement, LayoutSiderProps>(
  function LayoutSider(
    {
      label,
      width = 240,
      collapsedWidth = 0,
      collapsed,
      defaultCollapsed = false,
      collapsible = false,
      collapsedContent,
      trigger,
      breakpoint,
      onBreakpoint,
      onCollapse,
      side = 'start',
      children,
      className,
      style,
      onKeyDown,
      ...props
    },
    ref,
  ) {
    const query = breakpointQuery(breakpoint)
    const [broken, setBroken] = useState(() => matches(query))
    const [internalCollapsed, setInternalCollapsed] = useState(
      () => defaultCollapsed || matches(query),
    )
    const previousBrokenRef = useRef(broken)
    const triggerRef = useRef<HTMLButtonElement | null>(null)
    const currentCollapsed = collapsed ?? internalCollapsed
    const currentCollapsedRef = useRef(currentCollapsed)
    currentCollapsedRef.current = currentCollapsed
    const mobile = Boolean(query && broken)
    const zeroWidth =
      collapsedWidth === 0 || collapsedWidth === '0' || collapsedWidth === '0px'
    const collapsedSize = widthValue(collapsedWidth)
    const expandedSize = widthValue(width)
    const siderId = useId()
    const showTrigger = (collapsible || mobile) && trigger !== null
    const showMobileSheet = mobile && !currentCollapsed
    const detachedTrigger =
      showTrigger && zeroWidth && (mobile || currentCollapsed)
    const wasMobileSheetOpenRef = useRef(showMobileSheet)

    useEffect(() => {
      const wasOpen = wasMobileSheetOpenRef.current
      wasMobileSheetOpenRef.current = showMobileSheet
      if (!wasOpen || showMobileSheet) return
      const frame = window.requestAnimationFrame(() =>
        triggerRef.current?.focus(),
      )
      return () => window.cancelAnimationFrame(frame)
    }, [showMobileSheet])

    useEffect(() => {
      const update = (next: boolean) => {
        if (previousBrokenRef.current === next) return
        previousBrokenRef.current = next
        setBroken(next)
        onBreakpoint?.(next)
        if (currentCollapsedRef.current !== next) {
          if (collapsed === undefined) setInternalCollapsed(next)
          onCollapse?.(next, 'breakpoint')
        }
      }
      if (!query || typeof window === 'undefined' || !window.matchMedia) {
        update(false)
        return
      }
      const media = window.matchMedia(query)
      update(media.matches)
      const listener = (event: MediaQueryListEvent) => update(event.matches)
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    }, [query, collapsed, onBreakpoint, onCollapse])

    function changeCollapsed(next: boolean, source: CollapseSource) {
      if (next === currentCollapsed) return
      if (collapsed === undefined) setInternalCollapsed(next)
      onCollapse?.(next, source)
    }

    function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
      onKeyDown?.(event)
      if (
        event.defaultPrevented ||
        event.key !== 'Escape' ||
        !mobile ||
        currentCollapsed
      )
        return
      event.preventDefault()
      changeCollapsed(true, 'trigger')
    }

    const staticSize = mobile
      ? collapsedSize
      : currentCollapsed
        ? collapsedSize
        : expandedSize
    const triggerButton = showTrigger ? (
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${currentCollapsed ? '展开' : '收起'}${label}`}
        aria-expanded={!currentCollapsed}
        aria-controls={mobile && !showMobileSheet ? undefined : siderId}
        className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] border border-border bg-card px-3 text-base text-card-foreground shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring"
        onClick={() => changeCollapsed(!currentCollapsed, 'trigger')}
      >
        {trigger === undefined ? (
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="size-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            {currentCollapsed ? (
              <path d="M3 5h14M3 10h14M3 15h14" />
            ) : (
              <path d="M12 4 6 10l6 6" />
            )}
          </svg>
        ) : (
          trigger
        )}
      </button>
    ) : null
    const detachedButton = detachedTrigger && (
      <div
        className={cn(
          'relative z-10 w-11 shrink-0 bg-card',
          side === 'start'
            ? 'border-r border-border'
            : 'border-l border-border',
        )}
      >
        {triggerButton}
      </div>
    )

    return (
      <>
        {side === 'end' && detachedButton}
        <aside
          {...props}
          ref={ref}
          aria-label={label}
          data-collapsed={currentCollapsed || undefined}
          data-broken={broken || undefined}
          className={cn(
            'relative flex min-h-0 shrink-0 flex-col bg-card text-card-foreground',
            !detachedTrigger &&
              (side === 'start'
                ? 'border-r border-border'
                : 'border-l border-border'),
            className,
          )}
          style={
            {
              width: staticSize,
              flexBasis: staticSize,
              ...style,
            } as CSSProperties
          }
          onKeyDown={handleKeyDown}
        >
          {!mobile && (!currentCollapsed || !zeroWidth) && (
            <div
              id={siderId}
              className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden"
            >
              {currentCollapsed ? collapsedContent : children}
            </div>
          )}
          {showTrigger && !mobile && !detachedTrigger && (
            <div className="relative shrink-0 p-2">{triggerButton}</div>
          )}
          {showTrigger && mobile && !detachedTrigger && triggerButton}
        </aside>
        {side === 'start' && detachedButton}
        {mobile && (
          <Sheet
            title={label}
            side={side === 'start' ? 'left' : 'right'}
            open={showMobileSheet}
            onOpenChange={(open) => changeCollapsed(!open, 'trigger')}
          >
            <div id={siderId}>{children}</div>
          </Sheet>
        )}
      </>
    )
  },
)

const LayoutRoot = forwardRef<HTMLDivElement, LayoutProps>(function LayoutRoot(
  { hasSider, children, className, ...props },
  ref,
) {
  const containsSider =
    hasSider ??
    Children.toArray(children).some(
      (child) => isValidElement(child) && child.type === LayoutSider,
    )
  return (
    <div
      {...props}
      ref={ref}
      className={cn(
        'flex min-h-0 min-w-0 bg-background text-foreground',
        containsSider ? 'flex-row' : 'flex-col',
        className,
      )}
    >
      {children}
    </div>
  )
})

// eslint-disable-next-line react-refresh/only-export-components -- public compound component API
export const Layout = Object.assign(LayoutRoot, {
  Header: LayoutHeader,
  Sider: LayoutSider,
  Content: LayoutContent,
  Footer: LayoutFooter,
})
