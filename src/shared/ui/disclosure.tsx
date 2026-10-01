import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
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
import { Icon } from './icon'

export type CollapseTrigger = 'header' | 'icon' | 'disabled'
export type CollapseIconOptions = {
  key: string
  expanded: boolean
  disabled: boolean
  direction: 'ltr' | 'rtl'
}
type CollapsePart = 'item' | 'header' | 'icon' | 'label' | 'body' | 'extra'

export type CollapseItem = {
  key: string
  label: ReactNode
  children: ReactNode
  disabled?: boolean
  collapsible?: CollapseTrigger
  extra?: ReactNode
  showArrow?: boolean
  forceRender?: boolean
  className?: string
  classNames?: Partial<Record<CollapsePart, string>>
}

export type CollapseProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange' | 'dir'
> & {
  items: CollapseItem[]
  activeKey?: string[]
  defaultActiveKey?: string[]
  accordion?: boolean
  onChange?: (keys: string[]) => void
  size?: ControlSize
  bordered?: boolean
  ghost?: boolean
  collapsible?: CollapseTrigger
  expandIconPlacement?: 'start' | 'end'
  expandIcon?: (options: CollapseIconOptions) => ReactNode
  destroyOnHidden?: boolean
  label?: string
  emptyText?: string
  dir?: 'ltr' | 'rtl'
  classNames?: Partial<Record<'root' | CollapsePart, string>>
}

type PanelElements = {
  section: HTMLElement | null
  trigger: HTMLButtonElement | null
}
type RegisterPanel = <Part extends keyof PanelElements>(
  key: string,
  part: Part,
  node: PanelElements[Part],
) => void

const headerSizes = {
  small: 'min-h-11 px-3 py-0 text-sm',
  default: 'min-h-[52px] px-4 py-1 text-base',
  large: 'min-h-16 px-6 py-2.5 text-lg',
}
const bodySizes = { small: 'p-3', default: 'p-4', large: 'p-6' }
const triggerStyles =
  'touch-manipulation cursor-pointer rounded-sm border-0 bg-transparent text-start font-semibold text-foreground hover:bg-accent active:bg-accent focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50'

function CollapsePanel({
  item,
  expanded,
  size,
  ghost,
  collapsible,
  expandIconPlacement,
  expandIcon,
  destroyOnHidden,
  direction,
  classNames,
  register,
  toggle,
}: {
  item: CollapseItem
  expanded: boolean
  size: ControlSize
  ghost: boolean
  collapsible: CollapseTrigger
  expandIconPlacement: 'start' | 'end'
  expandIcon: CollapseProps['expandIcon']
  destroyOnHidden: boolean
  direction: 'ltr' | 'rtl'
  classNames: CollapseProps['classNames']
  register: RegisterPanel
  toggle: (key: string) => void
}) {
  const id = useId()
  const triggerId = `${id}-trigger`
  const labelId = `${id}-label`
  const panelId = `${id}-panel`
  const [visited, setVisited] = useState(expanded)
  if (expanded && !visited) setVisited(true)
  const sectionRef = useCallback(
    (node: HTMLElement | null) => register(item.key, 'section', node),
    [item.key, register],
  )
  const triggerRef = useCallback(
    (node: HTMLButtonElement | null) => register(item.key, 'trigger', node),
    [item.key, register],
  )
  const mode = item.collapsible ?? collapsible
  const disabled = item.disabled || mode === 'disabled'
  // A hidden arrow must still leave an operable disclosure button.
  const iconOnly = mode === 'icon' && item.showArrow !== false
  const renderContent =
    expanded || item.forceRender || (!destroyOnHidden && visited)
  const icon = item.showArrow !== false && (
    <span
      aria-hidden="true"
      data-ui-collapse-icon=""
      className={cn(
        'inline-flex shrink-0 items-center justify-center text-muted-foreground',
        classNames?.icon,
        item.classNames?.icon,
      )}
    >
      {expandIcon ? (
        expandIcon({ key: item.key, expanded, disabled: !!disabled, direction })
      ) : (
        <Icon
          name={direction === 'rtl' ? 'arrowLeft' : 'arrowRight'}
          size={16}
          className={cn(
            'transition-transform duration-200 motion-reduce:transition-none',
            expanded && (direction === 'rtl' ? '-rotate-90' : 'rotate-90'),
          )}
        />
      )}
    </span>
  )
  const label = (
    <span
      id={labelId}
      className={cn(
        'min-w-0 flex-1 [overflow-wrap:anywhere]',
        classNames?.label,
        item.classNames?.label,
      )}
    >
      {item.label}
    </span>
  )
  const triggerProps = {
    id: triggerId,
    ref: triggerRef,
    type: 'button' as const,
    'aria-expanded': expanded,
    'aria-controls': panelId,
    disabled,
    onClick: () => toggle(item.key),
  }

  return (
    <section
      ref={sectionRef}
      data-ui-collapse-item=""
      data-ui-expanded={expanded}
      className={cn(
        'min-w-0',
        !ghost && 'border-t border-border first:border-t-0',
        classNames?.item,
        item.className,
        item.classNames?.item,
      )}
    >
      <div
        data-ui-collapse-header=""
        className={cn(
          'flex min-w-0 flex-wrap items-center gap-x-2',
          !ghost && 'bg-muted',
          headerSizes[size],
          classNames?.header,
          item.classNames?.header,
        )}
      >
        <h3
          className="m-0 min-w-0 flex-1 text-inherit"
          aria-labelledby={iconOnly ? labelId : undefined}
        >
          {iconOnly ? (
            <span
              className={cn(
                'flex min-w-0 items-center gap-2 font-semibold',
                disabled && 'text-muted-foreground',
              )}
            >
              {expandIconPlacement === 'end' && label}
              <button
                {...triggerProps}
                aria-labelledby={labelId}
                className={cn(
                  'inline-flex size-11 shrink-0 items-center justify-center',
                  triggerStyles,
                )}
              >
                {icon}
              </button>
              {expandIconPlacement === 'start' && label}
            </span>
          ) : (
            <button
              {...triggerProps}
              className={cn(
                'flex min-h-11 w-full items-center gap-2 py-2',
                triggerStyles,
              )}
            >
              {expandIconPlacement === 'start' && icon}
              {label}
              {expandIconPlacement === 'end' && icon}
            </button>
          )}
        </h3>
        {item.extra != null && (
          <div
            data-ui-collapse-extra=""
            className={cn(
              'min-w-0 max-w-full shrink-0 @max-[360px]/collapse:basis-full @max-[360px]/collapse:pb-2 [overflow-wrap:anywhere]',
              classNames?.extra,
              item.classNames?.extra,
            )}
          >
            {item.extra}
          </div>
        )}
      </div>
      <div
        id={panelId}
        role="region"
        aria-labelledby={iconOnly ? labelId : triggerId}
        hidden={!expanded}
        data-ui-collapse-body=""
        className={cn(
          'min-w-0 leading-relaxed [overflow-wrap:anywhere]',
          !ghost && 'border-t border-border',
          bodySizes[size],
          classNames?.body,
          item.classNames?.body,
        )}
      >
        {renderContent && item.children}
      </div>
    </section>
  )
}

/** Native disclosures with independent extra actions and keyboard navigation. */
export function Collapse({
  items,
  activeKey,
  defaultActiveKey = [],
  accordion = false,
  onChange,
  size,
  bordered = true,
  ghost = false,
  collapsible = 'header',
  expandIconPlacement = 'start',
  expandIcon,
  destroyOnHidden = false,
  label = '折叠面板',
  emptyText = '暂无面板',
  dir,
  classNames,
  className,
  onKeyDown,
  onFocusCapture,
  onBlurCapture,
  ...props
}: CollapseProps) {
  const config = useConfig()
  const direction = dir ?? config.direction
  const resolvedSize = resolveComponentSize(config.componentSize, size)
  const [uncontrolledKeys, setUncontrolledKeys] = useState(defaultActiveKey)
  const requestedKeys = activeKey ?? uncontrolledKeys
  const validKeys = new Set(items.map((item) => item.key))
  const availableKeys = [...new Set(requestedKeys)].filter((key) =>
    validKeys.has(key),
  )
  const keys = accordion ? availableKeys.slice(0, 1) : availableKeys
  if (
    activeKey === undefined &&
    (uncontrolledKeys.length !== keys.length ||
      uncontrolledKeys.some((key, index) => key !== keys[index]))
  ) {
    setUncontrolledKeys(keys)
  }
  const rootRef = useRef<HTMLDivElement>(null)
  const panels = useRef(new Map<string, PanelElements>())
  const focused = useRef<{ node: HTMLElement; key?: string } | null>(null)
  const register: RegisterPanel = useCallback((key, part, node) => {
    const panel = panels.current.get(key) ?? { section: null, trigger: null }
    panel[part] = node
    if (panel.section || panel.trigger) panels.current.set(key, panel)
    else panels.current.delete(key)
  }, [])

  function enabledTriggers() {
    return items
      .map((item) => panels.current.get(item.key)?.trigger)
      .filter(
        (trigger): trigger is HTMLButtonElement =>
          !!trigger &&
          trigger.isConnected &&
          !trigger.disabled &&
          !trigger.closest('[hidden], [inert]'),
      )
  }

  useLayoutEffect(() => {
    const previous = focused.current
    if (!previous || !rootRef.current) return
    const node = previous.node
    const unavailable =
      !node.isConnected ||
      !!node.closest('[hidden], [inert]') ||
      ('disabled' in node && !!node.disabled)
    if (
      document.activeElement !== node &&
      document.activeElement !== document.body
    ) {
      focused.current = null
      return
    }
    if (!unavailable) return
    const triggers = enabledTriggers()
    const preferred =
      previous.key !== undefined
        ? panels.current.get(previous.key)?.trigger
        : undefined
    const target =
      preferred && triggers.includes(preferred)
        ? preferred
        : (triggers[0] ?? rootRef.current)
    if (!target.closest('[hidden], [inert]'))
      target.focus({ preventScroll: true })
  })

  function toggle(key: string) {
    const next = keys.includes(key)
      ? keys.filter((item) => item !== key)
      : accordion
        ? [key]
        : [...keys, key]
    if (activeKey === undefined) setUncontrolledKeys(next)
    onChange?.(next)
  }

  return (
    <div
      {...props}
      ref={rootRef}
      role={props.role ?? 'group'}
      aria-label={props['aria-label'] ?? label}
      dir={direction}
      tabIndex={props.tabIndex ?? -1}
      data-ui-collapse=""
      data-ui-size={resolvedSize}
      className={cn(
        '@container/collapse min-w-0 overflow-hidden rounded-[var(--radius-lg)] text-foreground focus-visible:outline-2 focus-visible:outline-ring',
        ghost ? 'bg-transparent' : 'bg-card',
        bordered && !ghost && 'border border-border',
        classNames?.root,
        className,
      )}
      onFocusCapture={(event) => {
        const node = event.target
        const key = items.find((item) =>
          panels.current.get(item.key)?.section?.contains(node),
        )?.key
        focused.current = { node, key }
        onFocusCapture?.(event)
      }}
      onBlurCapture={(event) => {
        if (
          event.relatedTarget instanceof Node &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          focused.current = null
        onBlurCapture?.(event)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (
          event.defaultPrevented ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey
        )
          return
        const triggers = enabledTriggers()
        const index = triggers.findIndex((trigger) => trigger === event.target)
        if (index < 0) return
        let next: number
        switch (event.key) {
          case 'ArrowDown':
            next = (index + 1) % triggers.length
            break
          case 'ArrowUp':
            next = (index - 1 + triggers.length) % triggers.length
            break
          case 'Home':
            next = 0
            break
          case 'End':
            next = triggers.length - 1
            break
          default:
            return
        }
        event.preventDefault()
        triggers[next].focus({ preventScroll: true })
      }}
    >
      {items.length === 0 ? (
        <Empty title={emptyText} size="small" className="border-0" />
      ) : (
        items.map((item) => (
          <CollapsePanel
            key={item.key}
            item={item}
            expanded={keys.includes(item.key)}
            size={resolvedSize}
            ghost={ghost}
            collapsible={collapsible}
            expandIconPlacement={expandIconPlacement}
            expandIcon={expandIcon}
            destroyOnHidden={destroyOnHidden}
            direction={direction}
            classNames={classNames}
            register={register}
            toggle={toggle}
          />
        ))
      )}
    </div>
  )
}
