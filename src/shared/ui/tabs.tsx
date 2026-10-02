import * as TabsPrimitive from '@radix-ui/react-tabs'
import {
  useCallback,
  forwardRef,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type HTMLAttributes,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { Empty } from './empty'
import { Icon } from './icon'
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
  'root' | 'header' | 'item' | 'tab' | 'remove' | 'add' | 'body' | 'content'
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
  const addRef = useRef<HTMLButtonElement>(null)
  const tabs = useRef(new Map<string, HTMLButtonElement>())
  const focused = useRef<HTMLElement | null>(null)
  const focusOwned = useRef(false)
  const request = useRef<EditRequest | null>(null)
  const awaitingFocus = useRef<{ value: string; origin: HTMLElement } | null>(
    null,
  )
  const restoringFocus = useRef(false)
  const [narrow, setNarrow] = useState(false)
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
      const list = listRef.current
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
        if (box.right > viewport.right)
          list.scrollLeft += box.right - viewport.right
        else if (box.left < viewport.left)
          list.scrollLeft += box.left - viewport.left
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
  }, [activeValue, effectivePlacement, direction, reveal])

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
          'flex min-w-0 shrink-0 gap-2 overflow-x-auto overscroll-x-contain border-b border-border [scrollbar-width:thin]',
          vertical &&
            'max-h-[min(24rem,70dvh)] min-w-28 max-w-[45%] flex-col items-stretch gap-1 overflow-x-hidden overflow-y-auto border-b-0 border-e',
          effectivePlacement === 'end' && 'order-last border-e-0 border-s',
          effectivePlacement === 'bottom' && 'order-last border-b-0 border-t',
          classNames?.header,
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
              role="presentation"
              data-tabs-item=""
              data-state={active ? 'active' : 'inactive'}
              className={cn(
                'flex min-w-0 shrink-0 items-center',
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
                  vertical
                    ? 'w-full justify-start border-e-2 text-start data-[state=active]:border-e-primary'
                    : 'border-b-2 data-[state=active]:border-b-primary',
                  effectivePlacement === 'end' &&
                    'border-e-0 border-s-2 data-[state=active]:border-s-primary',
                  effectivePlacement === 'bottom' &&
                    'border-b-0 border-t-2 data-[state=active]:border-t-primary',
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
                <span className="min-w-0 max-w-[min(20rem,max(0px,calc(100cqi-7rem)))] truncate">
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
