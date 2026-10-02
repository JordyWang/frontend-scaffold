import * as TabsPrimitive from '@radix-ui/react-tabs'
import {
  useCallback,
  forwardRef,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type HTMLAttributes,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { Empty } from './empty'
import { Icon } from './icon'
import { usePickerPosition } from './picker-popup'
import { Portal } from './portal'
import {
  resolveComponentSize,
  useConfig,
  type ControlSize,
} from './config-context'

export type TabItem = {
  value: string
  label: ReactNode
  content: ReactNode
  ariaLabel?: string
  icon?: ReactNode
  disabled?: boolean
  closable?: boolean
  closeIcon?: ReactNode
  closeLabel?: string
  forceRender?: boolean
  destroyOnHidden?: boolean
}
export type TabsPart =
  | 'root'
  | 'header'
  | 'item'
  | 'tab'
  | 'remove'
  | 'add'
  | 'more'
  | 'popup'
  | 'extra'
  | 'indicator'
  | 'body'
  | 'content'
export type TabsIndicator = {
  size?: number | ((origin: number) => number)
  align?: 'start' | 'center' | 'end'
}
export type TabsMoreOptions = {
  label?: string
  icon?: ReactNode
  searchable?: boolean
  searchPlaceholder?: string
  popupRender?: (
    menu: ReactElement,
    info: { restTabs: TabItem[]; onClose: () => void },
  ) => ReactElement
}
export type TabsProps = Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> & {
  items: TabItem[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  orientation?: 'horizontal' | 'vertical'
  placement?: 'top' | 'bottom' | 'start' | 'end'
  activationMode?: 'automatic' | 'manual'
  variant?: 'line' | 'card' | 'editable-card'
  size?: ControlSize
  onAdd?: () => void | boolean
  onRemove?: (value: string) => void | boolean
  addable?: boolean
  addLabel?: string
  addIcon?: ReactNode
  removeIcon?: ReactNode
  destroyOnHidden?: boolean
  emptyTitle?: string
  indicator?: TabsIndicator
  centered?: boolean
  tabBarExtraContent?: ReactNode | { start?: ReactNode; end?: ReactNode }
  more?: TabsMoreOptions | false
  classNames?: Partial<Record<TabsPart, string>>
  className?: string
  label?: string
}

type EditRequest = {
  kind: 'add' | 'remove'
  origin: HTMLElement
  selected: string | undefined
  before: TabItem[]
  value?: string
}
function neighbor(before: TabItem[], items: TabItem[], removed: string) {
  const index = before.findIndex((item) => item.value === removed)
  const candidates = [
    ...before.slice(0, index).reverse(),
    ...before.slice(index + 1),
  ]
  return (
    candidates.find((candidate) =>
      items.some((item) => item.value === candidate.value && !item.disabled),
    )?.value ?? items.find((item) => !item.disabled)?.value
  )
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    items,
    value,
    defaultValue,
    onValueChange,
    orientation = 'horizontal',
    placement,
    activationMode = 'automatic',
    variant = 'line',
    size,
    onAdd,
    onRemove,
    addable = true,
    addLabel = '新增标签页',
    addIcon,
    removeIcon,
    destroyOnHidden = false,
    emptyTitle = '暂无可用标签页',
    indicator,
    centered = false,
    tabBarExtraContent,
    more,
    classNames,
    className,
    label = '内容分组',
    ...props
  },
  forwardedRef,
) {
  const { direction, componentSize } = useConfig()
  const resolvedSize = resolveComponentSize(componentSize, size)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const addRef = useRef<HTMLButtonElement>(null)
  const moreRef = useRef<HTMLButtonElement>(null)
  const morePanelRef = useRef<HTMLDivElement>(null)
  const moreSearchRef = useRef<HTMLInputElement>(null)
  const tabs = useRef(new Map<string, HTMLButtonElement>())
  const itemRefs = useRef(new Map<string, HTMLDivElement>())
  const focused = useRef<HTMLElement | null>(null)
  const focusOwned = useRef(false)
  const request = useRef<EditRequest | null>(null)
  const awaitingFocus = useRef<{ value: string; origin: HTMLElement } | null>(
    null,
  )
  const restoringFocus = useRef(false)
  const [narrow, setNarrow] = useState(false)
  const [overflowed, setOverflowed] = useState<string[]>([])
  const [moreOpen, setMoreOpen] = useState(false)
  const [moreQuery, setMoreQuery] = useState('')
  const [indicatorMetrics, setIndicatorMetrics] = useState<{
    origin: number
    size: number
  } | null>(null)
  const requestedPlacement =
    placement ?? (orientation === 'vertical' ? 'start' : 'top')
  const side = requestedPlacement === 'start' || requestedPlacement === 'end'
  const effectivePlacement =
    side && (variant !== 'line' || (placement !== undefined && narrow))
      ? 'top'
      : requestedPlacement
  const vertical =
    effectivePlacement === 'start' || effectivePlacement === 'end'
  const editable = variant === 'editable-card'
  const moreOptions = more === false ? undefined : (more ?? {})
  const moreSearchable = moreOptions?.searchable ?? false
  const firstEnabledValue = items.find((item) => !item.disabled)?.value
  const [internalValue, setInternalValue] = useState(() =>
    items.some((item) => item.value === defaultValue && !item.disabled)
      ? defaultValue
      : firstEnabledValue,
  )
  const selected = value ?? internalValue
  const activeValue =
    value ??
    (items.some((item) => item.value === internalValue && !item.disabled)
      ? internalValue
      : firstEnabledValue) ??
    ''
  const activeExists = items.some(
    (item) =>
      item.value === activeValue && (value !== undefined || !item.disabled),
  )
  const [history, setHistory] = useState(() => ({
    active: activeValue,
    visited: new Set(activeExists ? [activeValue] : []),
  }))
  const visited = history.visited
  if (
    history.active !== activeValue ||
    (activeExists && !visited.has(activeValue)) ||
    [...visited].some((key) => !items.some((item) => item.value === key))
  ) {
    const next = new Set(
      [...visited].filter((key) => items.some((item) => item.value === key)),
    )
    if (activeExists) next.add(activeValue)
    setHistory({ active: activeValue, visited: next })
  }

  const reveal = useCallback(
    (element: HTMLElement) => {
      const list = scrollRef.current
      if (!list || !list.contains(element)) return
      const box = (
        element.closest<HTMLElement>('[data-tabs-item]') ?? element
      ).getBoundingClientRect()
      const viewport = list.getBoundingClientRect()
      if (vertical) {
        if (box.bottom > viewport.bottom)
          list.scrollTop += box.bottom - viewport.bottom
        else if (box.top < viewport.top)
          list.scrollTop += box.top - viewport.top
      } else {
        const delta =
          box.right > viewport.right
            ? box.right - viewport.right
            : box.left < viewport.left
              ? box.left - viewport.left
              : 0
        if (delta) {
          if (typeof list.scrollBy === 'function')
            list.scrollBy({ left: delta })
          else list.scrollLeft += delta
        }
      }
    },
    [vertical],
  )
  function focusTarget(target: HTMLElement | null | undefined) {
    if (!target || target.hasAttribute('disabled'))
      target = listRef.current ?? rootRef.current
    if (!target) return
    restoringFocus.current = true
    try {
      target.focus({ preventScroll: true })
      reveal(target)
    } finally {
      restoringFocus.current = false
    }
  }
  function availableTab(key: string | undefined) {
    const tab = key === undefined ? undefined : tabs.current.get(key)
    return tab && !tab.disabled ? tab : undefined
  }
  function change(next: string) {
    if (next === selected) return
    if (value === undefined) setInternalValue(next)
    onValueChange?.(next)
  }
  function remove(item: TabItem, origin: HTMLElement) {
    if (
      !editable ||
      !onRemove ||
      item.disabled ||
      item.closable === false ||
      item.closeIcon === null ||
      item.closeIcon === false
    )
      return
    origin.focus({ preventScroll: true })
    awaitingFocus.current = null
    const pending: EditRequest = {
      kind: 'remove',
      origin,
      selected,
      before: items,
      value: item.value,
    }
    request.current = pending
    if (onRemove(item.value) === false && request.current === pending)
      request.current = null
  }

  useLayoutEffect(() => {
    const observe = (event: FocusEvent) => {
      if (!rootRef.current?.contains(event.target as Node))
        focusOwned.current = false
    }
    document.addEventListener('focusin', observe)
    return () => document.removeEventListener('focusin', observe)
  }, [])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || placement === undefined || !side || variant !== 'line') return
    const measure = () => setNarrow(root.getBoundingClientRect().width < 640)
    measure()
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(root)
    window.addEventListener('resize', measure)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [placement, side, variant])

  useLayoutEffect(() => {
    let pending = request.current
    const currentItem = items.find((item) => item.value === pending?.value)
    if (
      pending &&
      (!editable ||
        (pending.kind === 'add' && (!onAdd || !addable)) ||
        (pending.kind === 'remove' &&
          (!onRemove ||
            currentItem?.disabled ||
            currentItem?.closable === false ||
            currentItem?.closeIcon === null ||
            currentItem?.closeIcon === false)))
    ) {
      request.current = null
      pending = null
    }
    const accepted =
      pending?.kind === 'add'
        ? items.find(
            (item) =>
              !item.disabled &&
              !pending.before.some((before) => before.value === item.value),
          )
        : pending && !items.some((item) => item.value === pending.value)
          ? pending
          : undefined
    const previous = focused.current
    const unavailable =
      previous &&
      (!previous.isConnected ||
        previous.hasAttribute('disabled') ||
        previous.closest('[hidden],[inert]'))
    const ownedFocus =
      focusOwned.current &&
      (document.activeElement === previous ||
        (document.activeElement === document.body && unavailable))
    if (accepted && pending) {
      request.current = null
      const targetValue =
        pending.kind === 'add'
          ? (accepted as TabItem).value
          : selected === pending.value
            ? neighbor(pending.before, items, pending.value!)
            : activeValue
      if (
        selected === pending.selected &&
        (targetValue !== undefined ||
          (pending.kind === 'remove' && selected === pending.value))
      )
        change(targetValue ?? '')
      const originOwnsFocus =
        document.activeElement === pending.origin ||
        (ownedFocus && previous === pending.origin)
      if (originOwnsFocus) {
        if (
          pending.kind === 'add' &&
          value !== undefined &&
          activeValue !== targetValue &&
          targetValue !== undefined
        )
          awaitingFocus.current = { value: targetValue, origin: pending.origin }
        else
          focusTarget(
            availableTab(
              value !== undefined && activeExists ? activeValue : targetValue,
            ) ??
              availableTab(firstEnabledValue) ??
              addRef.current ??
              listRef.current,
          )
      }
      return
    }
    const waiting = awaitingFocus.current
    if (
      waiting &&
      (!editable ||
        !waiting.origin.isConnected ||
        document.activeElement !== waiting.origin)
    )
      awaitingFocus.current = null
    else if (waiting && activeValue === waiting.value) {
      awaitingFocus.current = null
      focusTarget(availableTab(waiting.value))
    }
    if (unavailable && ownedFocus)
      focusTarget(
        availableTab(activeValue) ??
          availableTab(firstEnabledValue) ??
          addRef.current ??
          listRef.current,
      )
  })

  useLayoutEffect(() => {
    const active = tabs.current.get(activeValue)
    if (active) reveal(active)
  }, [activeValue, effectivePlacement, direction, overflowed.length, reveal])

  usePickerPosition(
    moreRef,
    morePanelRef,
    moreOpen,
    vertical || direction === 'rtl' ? 'bottomEnd' : 'bottomStart',
    direction,
  )

  useLayoutEffect(() => {
    const scroll = scrollRef.current
    if (!scroll || more === false) {
      setOverflowed([])
      return
    }
    const measure = () => {
      const viewport = scroll.getBoundingClientRect()
      const previous = scroll.scrollLeft
      // Measure from the logical beginning so a user scrolling the strip does
      // not change which items are offered in the more menu.
      scroll.scrollLeft = 0
      const hidden = items
        .filter((item) => {
          const element = itemRefs.current.get(item.value)
          if (!element) return false
          const box = element.getBoundingClientRect()
          return vertical
            ? box.top < viewport.top - 1 || box.bottom > viewport.bottom + 1
            : box.left < viewport.left - 1 || box.right > viewport.right + 1
        })
        .map((item) => item.value)
      scroll.scrollLeft = previous
      setOverflowed((current) =>
        current.length === hidden.length &&
        current.every((value, index) => value === hidden[index])
          ? current
          : hidden,
      )
    }
    measure()
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('resize', measure)
    }
  }, [direction, effectivePlacement, items, more, vertical])

  useLayoutEffect(() => {
    const element = itemRefs.current.get(activeValue)
    if (!element || variant !== 'line') {
      setIndicatorMetrics(null)
      return
    }
    const measure = () => {
      const origin = vertical
        ? element.getBoundingClientRect().height
        : element.getBoundingClientRect().width
      const requested =
        typeof indicator?.size === 'function'
          ? indicator.size(origin)
          : indicator?.size
      const size = Math.max(
        0,
        Math.min(
          origin,
          Number.isFinite(requested ?? NaN) ? requested! : origin,
        ),
      )
      setIndicatorMetrics((current) =>
        current?.origin === origin && current.size === size
          ? current
          : { origin, size },
      )
    }
    measure()
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('resize', measure)
    }
  }, [activeValue, effectivePlacement, indicator, items, variant, vertical])

  useEffect(() => {
    if (!moreOpen) {
      setMoreQuery('')
      return
    }
    const initial = moreSearchable
      ? moreSearchRef.current
      : morePanelRef.current?.querySelector<HTMLButtonElement>(
          '[role="menuitem"]:not(:disabled)',
        )
    initial?.focus()
  }, [moreOpen, moreSearchable])

  const restTabs = items.filter((item) => overflowed.includes(item.value))
  const filteredRestTabs = restTabs.filter((item) => {
    if (!moreQuery.trim()) return true
    const label =
      item.ariaLabel ??
      (typeof item.label === 'string' || typeof item.label === 'number'
        ? String(item.label)
        : item.value)
    return label
      .toLocaleLowerCase()
      .includes(moreQuery.trim().toLocaleLowerCase())
  })
  const closeMore = () => {
    setMoreOpen(false)
    moreRef.current?.focus()
  }
  const selectMore = (item: TabItem) => {
    if (item.disabled) return
    change(item.value)
    setMoreOpen(false)
    tabs.current.get(item.value)?.focus()
  }
  const menu = (
    <div
      role="menu"
      aria-label={moreOptions?.label ?? '更多标签'}
      className="grid max-h-[min(24rem,70dvh)] min-w-56 gap-1 overflow-y-auto rounded-[var(--ui-menu-radius)] bg-card p-1 text-card-foreground shadow-lg ring-1 ring-border"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          closeMore()
          return
        }
        if (event.key === 'Tab') {
          event.preventDefault()
          closeMore()
          return
        }
        const options = [
          ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
            '[role="menuitem"]:not(:disabled)',
          ),
        ]
        if (!options.length) return
        if (
          event.target === moreSearchRef.current &&
          event.key === 'ArrowDown'
        ) {
          event.preventDefault()
          options[0]?.focus()
          return
        }
        const index = options.indexOf(
          document.activeElement as HTMLButtonElement,
        )
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault()
          options[
            (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) %
              options.length
          ]?.focus()
        } else if (event.key === 'Home') {
          event.preventDefault()
          options[0]?.focus()
        } else if (event.key === 'End') {
          event.preventDefault()
          options.at(-1)?.focus()
        }
      }}
    >
      {moreSearchable && (
        <input
          ref={moreSearchRef}
          type="search"
          value={moreQuery}
          placeholder={moreOptions?.searchPlaceholder ?? '搜索标签'}
          aria-label="搜索更多标签"
          className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onChange={(event) => setMoreQuery(event.currentTarget.value)}
        />
      )}
      {filteredRestTabs.length === 0 ? (
        <div className="px-3 py-2 text-sm text-muted-foreground" role="status">
          {moreQuery ? '没有匹配的标签' : '没有更多标签'}
        </div>
      ) : (
        filteredRestTabs.map((item) => (
          <button
            key={item.value}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            className="flex min-h-11 w-full min-w-0 items-center gap-2 rounded-md border-0 bg-transparent px-3 py-2 text-start text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => selectMore(item)}
          >
            {item.icon && <span aria-hidden="true">{item.icon}</span>}
            <span className="min-w-0 truncate">{item.label}</span>
          </button>
        ))
      )}
    </div>
  )
  const extraObject =
    tabBarExtraContent &&
    typeof tabBarExtraContent === 'object' &&
    !Array.isArray(tabBarExtraContent) &&
    !isValidElement(tabBarExtraContent)
      ? (tabBarExtraContent as { start?: ReactNode; end?: ReactNode })
      : undefined
  const extraStart = extraObject
    ? extraObject.start
    : isValidElement(tabBarExtraContent) ||
        tabBarExtraContent === null ||
        typeof tabBarExtraContent !== 'object' ||
        Array.isArray(tabBarExtraContent)
      ? tabBarExtraContent
      : undefined
  const extraEnd = extraObject?.end

  const controlStyles =
    'inline-flex min-h-11 min-w-11 shrink-0 touch-manipulation items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50'
  return (
    <TabsPrimitive.Root
      {...props}
      ref={(node) => {
        rootRef.current = node
        if (typeof forwardedRef === 'function') forwardedRef(node)
        else if (forwardedRef) forwardedRef.current = node
      }}
      tabIndex={props.tabIndex ?? -1}
      value={activeValue}
      onValueChange={(next) => {
        if (restoringFocus.current) return
        request.current = null
        awaitingFocus.current = null
        change(next)
      }}
      orientation={vertical ? 'vertical' : 'horizontal'}
      activationMode={activationMode}
      dir={direction}
      data-ui-tabs=""
      data-ui-variant={variant}
      data-ui-size={resolvedSize}
      data-ui-placement={effectivePlacement}
      onFocusCapture={(event) => {
        focusOwned.current = true
        focused.current = event.target as HTMLElement
        reveal(event.target as HTMLElement)
        props.onFocusCapture?.(event)
      }}
      onBlurCapture={(event) => {
        const target = event.target as HTMLElement
        if (
          !event.currentTarget.contains(event.relatedTarget) &&
          (event.relatedTarget ||
            (target.isConnected &&
              !target.hasAttribute('disabled') &&
              !target.closest('[hidden],[inert]')))
        )
          focusOwned.current = false
        props.onBlurCapture?.(event)
      }}
      className={cn(
        'flex w-full min-w-0 [container-type:inline-size]',
        vertical ? 'flex-row' : 'flex-col',
        classNames?.root,
        className,
      )}
    >
      <TabsPrimitive.List
        ref={listRef}
        tabIndex={-1}
        onFocus={(event) => {
          if (
            event.target === event.currentTarget &&
            (firstEnabledValue === undefined || restoringFocus.current)
          )
            event.preventDefault()
        }}
        aria-label={label}
        className={cn(
          'flex min-w-0 shrink-0 items-stretch gap-2 border-b border-border [scrollbar-width:thin]',
          vertical &&
            'max-h-[min(24rem,70dvh)] min-w-28 max-w-[45%] flex-col items-stretch gap-1 overflow-hidden border-b-0 border-e',
          effectivePlacement === 'end' && 'order-last border-e-0 border-s',
          effectivePlacement === 'bottom' && 'order-last border-b-0 border-t',
          classNames?.header,
        )}
      >
        {extraStart && (
          <div
            role="presentation"
            className={cn(
              'sticky start-0 z-10 inline-flex shrink-0 items-center bg-card ps-1',
              classNames?.extra,
            )}
          >
            {extraStart}
          </div>
        )}
        <div
          ref={scrollRef}
          data-tabs-scroll=""
          className={cn(
            'flex min-w-0 flex-1 gap-2 overflow-x-auto overscroll-x-contain touch-pan-x [scrollbar-width:thin]',
            centered && !vertical && 'justify-center',
            vertical && 'flex-col overflow-x-hidden overflow-y-auto',
          )}
        >
          {items.map((item) => {
            const active = item.value === activeValue
            const close =
              editable &&
              item.closable !== false &&
              item.closeIcon !== null &&
              item.closeIcon !== false
            const name =
              item.ariaLabel ??
              (typeof item.label === 'string' || typeof item.label === 'number'
                ? String(item.label)
                : item.value)
            return (
              <div
                key={item.value}
                ref={(node) => {
                  if (node) itemRefs.current.set(item.value, node)
                  else itemRefs.current.delete(item.value)
                }}
                role="presentation"
                data-tabs-item=""
                data-tabs-value={item.value}
                data-state={active ? 'active' : 'inactive'}
                className={cn(
                  'relative flex min-w-0 shrink-0 items-center',
                  vertical && 'w-full',
                  variant !== 'line' &&
                    'rounded-t-md border border-border bg-muted data-[state=active]:bg-card',
                  variant !== 'line' &&
                    effectivePlacement === 'bottom' &&
                    'rounded-t-none rounded-b-md',
                  classNames?.item,
                )}
              >
                <TabsPrimitive.Trigger
                  ref={(node) => {
                    if (node) tabs.current.set(item.value, node)
                    else tabs.current.delete(item.value)
                  }}
                  value={item.value}
                  aria-label={item.ariaLabel}
                  disabled={item.disabled}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Delete' &&
                      event.target === event.currentTarget &&
                      !event.repeat &&
                      !event.nativeEvent.isComposing &&
                      event.keyCode !== 229 &&
                      !event.ctrlKey &&
                      !event.metaKey &&
                      !event.altKey &&
                      !event.shiftKey &&
                      close &&
                      onRemove &&
                      !item.disabled
                    ) {
                      event.preventDefault()
                      remove(item, event.currentTarget)
                    }
                  }}
                  className={cn(
                    'inline-flex min-h-11 min-w-11 shrink-0 touch-manipulation items-center justify-center gap-2 border-transparent font-semibold text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring data-[state=active]:text-[color-mix(in_srgb,var(--primary)_80%,var(--foreground))] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
                    resolvedSize === 'small'
                      ? 'px-3 py-2.5 text-sm'
                      : resolvedSize === 'large'
                        ? 'min-h-12 px-5 py-3 text-base'
                        : 'px-4 py-2.5 text-sm',
                    vertical ? 'w-full justify-start text-start' : '',
                    effectivePlacement === 'end' && '',
                    effectivePlacement === 'bottom' && '',
                    variant !== 'line' && 'border-0',
                    classNames?.tab,
                  )}
                >
                  {item.icon && (
                    <span
                      aria-hidden="true"
                      className="inline-flex shrink-0 items-center [&_svg]:size-4"
                    >
                      {item.icon}
                    </span>
                  )}
                  <span
                    className={cn(
                      'min-w-0 truncate',
                      editable
                        ? 'max-w-[min(20rem,max(0px,calc(100cqi-10rem)))]'
                        : 'max-w-[min(20rem,max(0px,calc(100cqi-7rem)))]',
                    )}
                  >
                    {item.label}
                  </span>
                </TabsPrimitive.Trigger>
                {close && (
                  <button
                    type="button"
                    disabled={item.disabled || !onRemove}
                    tabIndex={active ? 0 : -1}
                    aria-label={item.closeLabel ?? '关闭' + name}
                    className={cn(controlStyles, 'me-1', classNames?.remove)}
                    onClick={(event) => remove(item, event.currentTarget)}
                  >
                    <span aria-hidden="true">
                      {item.closeIcon ?? removeIcon ?? (
                        <Icon name="close" size={16} />
                      )}
                    </span>
                  </button>
                )}
                {active && variant === 'line' && (
                  <span
                    aria-hidden="true"
                    data-tabs-indicator=""
                    className={cn(
                      'pointer-events-none absolute bg-primary transition-[width,height,transform] duration-200 motion-reduce:transition-none',
                      vertical ? 'w-0.5' : 'h-0.5',
                      classNames?.indicator,
                    )}
                    style={
                      vertical
                        ? {
                            height: indicatorMetrics
                              ? `${indicatorMetrics.size}px`
                              : '100%',
                            top:
                              (indicator?.align ?? 'center') === 'start'
                                ? 0
                                : (indicator?.align ?? 'center') === 'end'
                                  ? undefined
                                  : '50%',
                            bottom:
                              (indicator?.align ?? 'center') === 'end'
                                ? 0
                                : undefined,
                            transform:
                              (indicator?.align ?? 'center') === 'center'
                                ? 'translateY(-50%)'
                                : undefined,
                            insetInlineStart:
                              effectivePlacement === 'end' ? 0 : undefined,
                            insetInlineEnd:
                              effectivePlacement === 'end' ? undefined : 0,
                          }
                        : {
                            width: indicatorMetrics
                              ? `${indicatorMetrics.size}px`
                              : '100%',
                            insetBlockStart:
                              effectivePlacement === 'bottom' ? 0 : undefined,
                            insetBlockEnd:
                              effectivePlacement === 'bottom' ? undefined : 0,
                            insetInlineStart:
                              (indicator?.align ?? 'center') === 'start'
                                ? 0
                                : (indicator?.align ?? 'center') === 'end'
                                  ? undefined
                                  : '50%',
                            insetInlineEnd:
                              (indicator?.align ?? 'center') === 'end'
                                ? 0
                                : undefined,
                            transform:
                              (indicator?.align ?? 'center') === 'center'
                                ? 'translateX(-50%)'
                                : undefined,
                          }
                    }
                  />
                )}
              </div>
            )
          })}
          {editable && addable && (
            <button
              ref={addRef}
              type="button"
              disabled={!onAdd}
              aria-label={addLabel}
              className={cn(controlStyles, 'self-center', classNames?.add)}
              onClick={(event) => {
                event.currentTarget.focus({ preventScroll: true })
                awaitingFocus.current = null
                const pending: EditRequest = {
                  kind: 'add',
                  origin: event.currentTarget,
                  selected,
                  before: items,
                }
                request.current = pending
                if (onAdd?.() === false && request.current === pending)
                  request.current = null
              }}
            >
              <span aria-hidden="true">
                {addIcon ?? <span className="text-xl">+</span>}
              </span>
            </button>
          )}
        </div>
        {(restTabs.length > 0 || extraEnd) && (
          <div
            role="presentation"
            className={cn(
              'sticky end-0 z-10 inline-flex shrink-0 items-center gap-1 bg-card pe-1',
              classNames?.extra,
            )}
          >
            {extraEnd}
            {restTabs.length > 0 && moreOptions && (
              <>
                <button
                  ref={moreRef}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={moreOpen}
                  aria-label={moreOptions.label ?? '更多标签'}
                  className={cn(controlStyles, classNames?.more)}
                  onClick={() => setMoreOpen((open) => !open)}
                >
                  <span aria-hidden="true">
                    {moreOptions.icon ?? <span className="text-xl">…</span>}
                  </span>
                </button>
                {moreOpen && (
                  <Portal>
                    <div
                      ref={morePanelRef}
                      data-ui-tabs-popup=""
                      className={cn('fixed z-50', classNames?.popup)}
                    >
                      {moreOptions.popupRender
                        ? moreOptions.popupRender(menu, {
                            restTabs,
                            onClose: closeMore,
                          })
                        : menu}
                    </div>
                  </Portal>
                )}
              </>
            )}
          </div>
        )}
      </TabsPrimitive.List>
      <div
        className={cn(
          'min-w-0 flex-1',
          vertical
            ? effectivePlacement === 'end'
              ? 'pe-[var(--space-lg)]'
              : 'ps-[var(--space-lg)]'
            : 'py-[var(--space-lg)]',
          classNames?.body,
        )}
      >
        {!activeExists && <Empty title={emptyTitle} />}
        {items.map((item) => {
          const active = item.value === activeValue
          const preserve = !(item.destroyOnHidden ?? destroyOnHidden)
          return (
            <TabsPrimitive.Content
              key={item.value}
              value={item.value}
              forceMount={
                item.forceRender ||
                (preserve && (active || visited.has(item.value))) ||
                undefined
              }
              hidden={!active}
              inert={!active || undefined}
              className={cn(
                'min-w-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                classNames?.content,
              )}
            >
              {item.content}
            </TabsPrimitive.Content>
          )
        })}
      </div>
    </TabsPrimitive.Root>
  )
})
