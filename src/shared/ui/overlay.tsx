import {
  cloneElement,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type AnchorHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type Ref,
  type ReactElement,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { Button, type ButtonProps } from './button'
import {
  buttonSizeStyles,
  buttonStyles,
  buttonVariantStyles,
} from './button-styles'
import { useConfig } from './config-context'
import { Dialog } from './dialog'
import { Badge, type BadgeProps } from './badge'
import {
  floatButtonControlStyles,
  floatButtonPositionStyles,
  floatButtonShapeStyles,
  floatLinkInteractionStyles,
  type FloatButtonPosition,
} from './float-button-styles'
import { Portal } from './portal'
import { spinnerStyles } from './tailwind-styles'

const floatingPanelStyles =
  'invisible fixed z-[70] max-h-[calc(100dvh-1rem)] min-w-48 max-w-[min(22rem,calc(100vw-1rem))] overflow-auto border border-border bg-card text-card-foreground shadow-[0_12px_30px_rgb(0_0_0_/_0.16)]'

type FloatingPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end'

function useFloatingPosition(
  anchorRef: { current: HTMLElement | null },
  panelRef: { current: HTMLElement | null },
  open: boolean,
  placement: FloatingPlacement,
  direction: 'ltr' | 'rtl' = 'ltr',
) {
  useLayoutEffect(() => {
    if (!open) return
    const anchor = anchorRef.current
    const panel = panelRef.current
    if (!anchor || !panel) return

    const updatePosition = () => {
      const anchorRect = anchor.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      if (
        anchorRect.bottom < 0 ||
        anchorRect.top > viewportHeight ||
        anchorRect.right < 0 ||
        anchorRect.left > viewportWidth
      ) {
        panel.style.visibility = 'hidden'
        return
      }

      const panelRect = panel.getBoundingClientRect()
      const gap = 4
      const margin = 8
      let left: number
      let top: number

      const [side, alignment] = placement.split('-') as [
        'top' | 'bottom' | 'left' | 'right',
        'start' | 'end' | undefined,
      ]
      let actualSide: 'top' | 'bottom' | 'left' | 'right'
      if (side === 'top' || side === 'bottom') {
        left =
          alignment === undefined
            ? anchorRect.left + (anchorRect.width - panelRect.width) / 2
            : (alignment === 'start') === (direction === 'ltr')
              ? anchorRect.left
              : anchorRect.right - panelRect.width
        const roomBelow = viewportHeight - anchorRect.bottom - margin
        const roomAbove = anchorRect.top - margin
        const placeBelow =
          side === 'bottom'
            ? roomBelow >= panelRect.height || roomBelow >= roomAbove
            : roomAbove < panelRect.height && roomBelow > roomAbove
        actualSide = placeBelow ? 'bottom' : 'top'
        top = placeBelow
          ? anchorRect.bottom + gap
          : anchorRect.top - panelRect.height - gap
      } else {
        top =
          alignment === 'start'
            ? anchorRect.top
            : alignment === 'end'
              ? anchorRect.bottom - panelRect.height
              : anchorRect.top + (anchorRect.height - panelRect.height) / 2
        const roomLeft = anchorRect.left - margin
        const roomRight = viewportWidth - anchorRect.right - margin
        const placeRight =
          side === 'right'
            ? roomRight >= panelRect.width || roomRight >= roomLeft
            : roomLeft < panelRect.width && roomRight > roomLeft
        actualSide = placeRight ? 'right' : 'left'
        left = placeRight
          ? anchorRect.right + gap
          : anchorRect.left - panelRect.width - gap
      }

      panel.dataset.uiFloatingPlacement = alignment
        ? `${actualSide}-${alignment}`
        : actualSide
      panel.style.left = `${Math.max(margin, Math.min(left, viewportWidth - panelRect.width - margin))}px`
      panel.style.top = `${Math.max(margin, Math.min(top, viewportHeight - panelRect.height - margin))}px`
      panel.style.visibility = 'visible'
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(updatePosition)
    observer?.observe(anchor)
    observer?.observe(panel)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
      observer?.disconnect()
    }
  }, [anchorRef, panelRef, open, placement, direction])
}

type TriggerElement = ReactElement<{
  onClick?: (event: MouseEvent) => void
  onKeyDown?: (event: KeyboardEvent) => void
  onFocus?: (event: FocusEvent) => void
  onBlur?: (event: FocusEvent) => void
  onPointerDown?: (event: ReactPointerEvent) => void
  'aria-expanded'?: boolean
  'aria-controls'?: string
  'aria-haspopup'?: string
  'aria-describedby'?: string
  disabled?: boolean
  'data-ui-tooltip-trigger'?: string
  'data-ui-dropdown-trigger'?: string
  'data-ui-popover-trigger'?: string
}>

function callHandler<T extends { defaultPrevented: boolean }>(
  handler: ((event: T) => void) | undefined,
  event: T,
) {
  handler?.(event)
  return !event.defaultPrevented
}

const focusableSelector =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

function getFocusable(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>(focusableSelector)].filter(
    (element) => {
      const style = getComputedStyle(element)
      return (
        !element.closest('[hidden], [inert], [aria-hidden="true"]') &&
        element.getAttribute('aria-disabled') !== 'true' &&
        style.display !== 'none' &&
        style.visibility !== 'hidden'
      )
    },
  )
}

function focusAdjacentToTrigger(
  trigger: HTMLElement,
  panel: HTMLElement,
  backwards = false,
) {
  const focusable = getFocusable(trigger.ownerDocument.body)
  const triggerIndex = focusable.indexOf(trigger)
  if (triggerIndex < 0) {
    trigger.focus()
    return
  }
  const adjacent = backwards
    ? focusable
        .slice(0, triggerIndex)
        .reverse()
        .find((element) => !panel.contains(element))
    : focusable
        .slice(triggerIndex + 1)
        .find((element) => !panel.contains(element))
  if (adjacent) adjacent.focus()
  else trigger.focus()
}

export type DropdownActionItem = {
  type?: 'item'
  key: string
  label: ReactNode
  disabled?: boolean
  danger?: boolean
  onSelect?: () => void
}

export type DropdownItem =
  | DropdownActionItem
  | { type: 'divider'; key: string }
  | {
      type: 'group'
      key: string
      label: ReactNode
      children: DropdownActionItem[]
    }

export type DropdownProps = {
  items: DropdownItem[]
  trigger: TriggerElement
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  placement?: 'bottom-start' | 'bottom-end'
  label?: string
  className?: string
  selectionMode?: 'none' | 'single' | 'multiple'
  selectedKeys?: readonly string[]
  defaultSelectedKeys?: readonly string[]
  onSelectionChange?: (keys: string[]) => void
  closeOnSelect?: boolean
}

/** A keyboard navigable menu that stays inside the nearest theme scope. */
export function Dropdown({
  items,
  trigger,
  open,
  defaultOpen = false,
  onOpenChange,
  placement = 'bottom-start',
  label = '菜单',
  className,
  selectionMode = 'none',
  selectedKeys,
  defaultSelectedKeys = [],
  onSelectionChange,
  closeOnSelect,
}: DropdownProps) {
  const { direction } = useConfig()
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<string[]>(
    () => [...defaultSelectedKeys],
  )
  const currentSelectedKeys = selectedKeys ?? internalSelectedKeys
  const isOpen = open ?? internalOpen
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [focusLastOnOpen, setFocusLastOnOpen] = useState(false)
  const triggerId = useId()
  const menuId = `${triggerId}-menu`
  const groupId = `${menuId}-group`
  useFloatingPosition(rootRef, menuRef, isOpen, placement, direction)

  const setOpen = useCallback(
    (next: boolean) => {
      if (open === undefined) setInternalOpen(next)
      onOpenChange?.(next)
    },
    [onOpenChange, open],
  )

  useEffect(() => {
    if (!isOpen) return
    const options = menuRef.current?.querySelectorAll<HTMLButtonElement>(
      '[data-ui-dropdown-action]:not(:disabled)',
    )
    const initialFocus = focusLastOnOpen
      ? options?.[options.length - 1]
      : options?.[0]
    initialFocus?.focus()
  }, [focusLastOnOpen, isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      )
        setOpen(false)
    }
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        rootRef.current
          ?.querySelector<HTMLElement>('[data-ui-dropdown-trigger]')
          ?.focus()
        return
      }
      if (!menuRef.current?.contains(event.target as Node)) return
      if (event.key === 'Tab') {
        event.preventDefault()
        const trigger = rootRef.current?.querySelector<HTMLElement>(
          '[data-ui-dropdown-trigger]',
        )
        if (trigger && menuRef.current)
          focusAdjacentToTrigger(trigger, menuRef.current, event.shiftKey)
        setOpen(false)
        return
      }
      const options = [
        ...menuRef.current.querySelectorAll<HTMLButtonElement>(
          '[data-ui-dropdown-action]:not(:disabled)',
        ),
      ]
      if (!options.length) return
      const currentIndex = options.indexOf(
        document.activeElement as HTMLButtonElement,
      )
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const offset = event.key === 'ArrowDown' ? 1 : -1
        options[
          (currentIndex + offset + options.length) % options.length
        ]?.focus()
      } else if (event.key === 'Home') {
        event.preventDefault()
        options[0]?.focus()
      } else if (event.key === 'End') {
        event.preventDefault()
        options.at(-1)?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, setOpen])

  const handleItemSelect = (item: DropdownActionItem) => {
    item.onSelect?.()
    if (selectionMode !== 'none') {
      const next =
        selectionMode === 'single'
          ? [item.key]
          : currentSelectedKeys.includes(item.key)
            ? currentSelectedKeys.filter((key) => key !== item.key)
            : [...currentSelectedKeys, item.key]
      if (selectedKeys === undefined) setInternalSelectedKeys(next)
      onSelectionChange?.(next)
    }
    if (closeOnSelect ?? selectionMode !== 'multiple') {
      setOpen(false)
      rootRef.current
        ?.querySelector<HTMLElement>('[data-ui-dropdown-trigger]')
        ?.focus()
    }
  }

  const renderAction = (item: DropdownActionItem) => {
    const selected = currentSelectedKeys.includes(item.key)
    return (
      <button
        key={item.key}
        type="button"
        role={
          selectionMode === 'single'
            ? 'menuitemradio'
            : selectionMode === 'multiple'
              ? 'menuitemcheckbox'
              : 'menuitem'
        }
        aria-checked={selectionMode !== 'none' ? selected : undefined}
        data-ui-dropdown-action=""
        data-ui-dropdown-key={item.key}
        className={cn(
          'flex w-full min-h-11 touch-manipulation cursor-pointer items-center justify-between gap-2 rounded-[var(--radius-sm)] border-0 bg-transparent px-3 py-2.5 text-start text-inherit hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50',
          item.danger &&
            'text-destructive hover:text-destructive focus-visible:text-destructive',
          selected &&
            selectionMode !== 'none' &&
            'bg-accent text-accent-foreground',
        )}
        disabled={item.disabled}
        onClick={() => handleItemSelect(item)}
      >
        <span className="min-w-0 break-words">{item.label}</span>
        {selected && selectionMode !== 'none' && (
          <span aria-hidden="true" className="shrink-0 text-primary">
            ✓
          </span>
        )}
      </button>
    )
  }

  const handleTriggerClick = (event: MouseEvent) => {
    if (!callHandler(trigger.props.onClick, event)) return
    setFocusLastOnOpen(false)
    setOpen(!isOpen)
  }
  const handleTriggerKeyDown = (event: KeyboardEvent) => {
    if (!callHandler(trigger.props.onKeyDown, event)) return
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setFocusLastOnOpen(true)
      if (!isOpen) setOpen(true)
      return
    }
    if (
      event.key === 'ArrowDown' ||
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault()
      setFocusLastOnOpen(false)
      if (!isOpen) setOpen(true)
    }
  }
  const enhancedTrigger = cloneElement(trigger, {
    'aria-haspopup': 'menu',
    'aria-expanded': isOpen,
    'aria-controls': isOpen ? menuId : undefined,
    'data-ui-dropdown-trigger': '',
    onClick: handleTriggerClick,
    onKeyDown: handleTriggerKeyDown,
  })

  return (
    <div
      ref={rootRef}
      dir={direction}
      className={cn('relative inline-flex max-w-full', className)}
    >
      {enhancedTrigger}
      {isOpen && (
        <Portal>
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            dir={direction}
            aria-label={label}
            aria-multiselectable={
              selectionMode === 'multiple' ? true : undefined
            }
            className={cn(
              floatingPanelStyles,
              'rounded-[var(--ui-menu-radius)] p-[var(--space-xs)]',
            )}
          >
            {items.map((item, index) => {
              if (item.type === 'divider')
                return (
                  <div
                    key={item.key}
                    role="separator"
                    className="my-1 border-t border-border"
                  />
                )
              if (item.type === 'group') {
                const headingId = `${groupId}-${index}`
                return (
                  <div key={item.key} role="group" aria-labelledby={headingId}>
                    <div
                      id={headingId}
                      className="px-3 py-1 text-xs font-semibold text-muted-foreground"
                    >
                      {item.label}
                    </div>
                    {item.children.map(renderAction)}
                  </div>
                )
              }
              return renderAction(item)
            })}
          </div>
        </Portal>
      )}
    </div>
  )
}

export type TooltipProps = {
  title: ReactNode
  children: TriggerElement
  placement?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  mouseEnterDelay?: number
  mouseLeaveDelay?: number
}

/** Optional contextual help that also appears when its trigger receives focus. */
export function Tooltip({
  title,
  children,
  placement = 'top',
  className,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  mouseEnterDelay = 0,
  mouseLeaveDelay = 0,
}: TooltipProps) {
  const { direction } = useConfig()
  const id = useId()
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const enabled =
    !disabled &&
    title !== null &&
    title !== undefined &&
    title !== false &&
    title !== ''
  const [previousEnabled, setPreviousEnabled] = useState(enabled)
  if (previousEnabled !== enabled) {
    setPreviousEnabled(enabled)
    if (!enabled && controlledOpen === undefined) setInternalOpen(false)
  }
  const open = enabled && (controlledOpen ?? internalOpen)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelHoverTimer = useCallback(() => {
    if (hoverTimer.current === null) return
    clearTimeout(hoverTimer.current)
    hoverTimer.current = null
  }, [])
  const setOpen = useCallback(
    (next: boolean) => {
      if (!enabled || next === open) return
      if (controlledOpen === undefined) setInternalOpen(next)
      onOpenChange?.(next)
    },
    [controlledOpen, enabled, onOpenChange, open],
  )
  const scheduleHover = (next: boolean, delay: number) => {
    cancelHoverTimer()
    if (!enabled) return
    const milliseconds =
      Number.isFinite(delay) && delay > 0 ? Math.min(delay, 60) * 1000 : 0
    if (milliseconds === 0) setOpen(next)
    else hoverTimer.current = setTimeout(() => setOpen(next), milliseconds)
  }
  useEffect(() => cancelHoverTimer, [cancelHoverTimer])
  useEffect(() => {
    if (!enabled) cancelHoverTimer()
  }, [cancelHoverTimer, enabled])
  const rootRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLSpanElement>(null)
  useFloatingPosition(rootRef, tooltipRef, open, placement)
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        cancelHoverTimer()
        setOpen(false)
      }
    }
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        cancelHoverTimer()
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [cancelHoverTimer, open, setOpen])
  const describedBy = [children.props['aria-describedby'], id]
    .filter(Boolean)
    .join(' ')
  const trigger = cloneElement(children, {
    'aria-describedby': open ? describedBy : children.props['aria-describedby'],
    'data-ui-tooltip-trigger': '',
  })
  return (
    <span
      ref={rootRef}
      className={cn('relative inline-flex max-w-full', className)}
      onFocus={(event) => {
        if (event.defaultPrevented) return
        cancelHoverTimer()
        setOpen(true)
      }}
      onBlur={(event) => {
        if (event.defaultPrevented) return
        cancelHoverTimer()
        setOpen(false)
      }}
      onPointerDown={(event) => {
        if (event.defaultPrevented) return
        cancelHoverTimer()
        setOpen(true)
      }}
      onMouseEnter={() => scheduleHover(true, mouseEnterDelay)}
      onMouseLeave={() => {
        if (rootRef.current?.contains(document.activeElement)) return
        scheduleHover(false, mouseLeaveDelay)
      }}
    >
      {trigger}
      {open && (
        <Portal>
          <span
            ref={tooltipRef}
            id={id}
            role="tooltip"
            dir={direction}
            className="pointer-events-none invisible fixed z-[75] w-max max-w-[min(20rem,calc(100vw-1rem))] rounded-[var(--radius-sm)] bg-foreground px-3 py-2 text-sm leading-[1.4] text-background"
          >
            {title}
          </span>
        </Portal>
      )}
    </span>
  )
}

export type PopoverPlacement = FloatingPlacement

export type PopoverProps = {
  title?: ReactNode
  label?: string
  content: ReactNode
  children: TriggerElement
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  placement?: PopoverPlacement
  trigger?: 'click' | 'hover' | 'focus'
  className?: string
}

/** Click/tap disclosure for non-essential contextual content. */
export function Popover({
  title,
  label = '补充信息',
  content,
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  placement = 'bottom-start',
  trigger: triggerMode = 'click',
  className,
}: PopoverProps) {
  const { direction } = useConfig()
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isOpen = open ?? internalOpen
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipNextFocusOpen = useRef(false)
  const id = useId()
  const titleId = `${id}-title`
  useFloatingPosition(rootRef, panelRef, isOpen, placement, direction)
  const setOpen = useCallback(
    (next: boolean) => {
      if (next === isOpen) return
      if (open === undefined) setInternalOpen(next)
      onOpenChange?.(next)
    },
    [isOpen, onOpenChange, open],
  )
  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current === null) return
    clearTimeout(closeTimer.current)
    closeTimer.current = null
  }, [])
  const scheduleHoverClose = () => {
    if (triggerMode !== 'hover') return
    clearCloseTimer()
    closeTimer.current = setTimeout(() => {
      const active = document.activeElement
      if (
        !rootRef.current?.contains(active) &&
        !panelRef.current?.contains(active)
      )
        setOpen(false)
    }, 100)
  }
  useEffect(() => clearCloseTimer, [clearCloseTimer])
  useEffect(() => {
    if (!isOpen) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        !rootRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        clearCloseTimer()
        setOpen(false)
      }
    }
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        clearCloseTimer()
        setOpen(false)
        const trigger = rootRef.current?.querySelector<HTMLElement>(
          '[data-ui-popover-trigger]',
        )
        if (trigger && document.activeElement !== trigger) {
          skipNextFocusOpen.current = true
          trigger.focus()
        }
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [clearCloseTimer, isOpen, setOpen])
  const trigger = cloneElement(children, {
    'aria-expanded': isOpen,
    'aria-controls': isOpen ? id : undefined,
    'aria-haspopup': 'dialog',
    'data-ui-popover-trigger': '',
  })
  return (
    <div
      ref={rootRef}
      dir={direction}
      className={cn('relative inline-flex max-w-full', className)}
      onClick={(event) => {
        if (event.defaultPrevented || !(event.target instanceof Element)) return
        const clickedTrigger = event.target.closest('[data-ui-popover-trigger]')
        if (!clickedTrigger || !event.currentTarget.contains(clickedTrigger))
          return
        clearCloseTimer()
        setOpen(triggerMode === 'click' ? !isOpen : true)
      }}
      onPointerEnter={(event) => {
        if (triggerMode !== 'hover' || event.pointerType === 'touch') return
        clearCloseTimer()
        setOpen(true)
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse' || event.pointerType === 'pen')
          scheduleHoverClose()
      }}
      onFocus={() => {
        if (skipNextFocusOpen.current) {
          skipNextFocusOpen.current = false
          return
        }
        if (triggerMode === 'click') return
        clearCloseTimer()
        setOpen(true)
      }}
      onBlur={(event) => {
        if (triggerMode === 'click') return
        const next = event.relatedTarget
        if (
          next instanceof Node &&
          (rootRef.current?.contains(next) || panelRef.current?.contains(next))
        )
          return
        if (triggerMode === 'hover') scheduleHoverClose()
        else setOpen(false)
      }}
      onKeyDown={(event) => {
        if (event.defaultPrevented || event.key !== 'Tab' || !isOpen) return
        if (event.shiftKey) {
          setOpen(false)
          return
        }
        const first = panelRef.current && getFocusable(panelRef.current)[0]
        if (!first) {
          setOpen(false)
          return
        }
        event.preventDefault()
        first.focus()
      }}
    >
      {trigger}
      {isOpen && (
        <Portal>
          <div
            ref={panelRef}
            id={id}
            role="dialog"
            dir={direction}
            aria-label={title ? undefined : label}
            aria-labelledby={title ? titleId : undefined}
            onPointerEnter={() => clearCloseTimer()}
            onPointerLeave={(event) => {
              if (event.pointerType === 'mouse' || event.pointerType === 'pen')
                scheduleHoverClose()
            }}
            onFocus={() => clearCloseTimer()}
            onBlur={(event) => {
              event.stopPropagation()
              if (triggerMode === 'click') return
              const next = event.relatedTarget
              if (
                next instanceof Node &&
                (rootRef.current?.contains(next) ||
                  panelRef.current?.contains(next))
              )
                return
              if (triggerMode === 'hover') scheduleHoverClose()
              else setOpen(false)
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Tab') return
              const focusable = getFocusable(event.currentTarget)
              const target = event.target as HTMLElement
              if (event.shiftKey && target === focusable[0]) {
                event.preventDefault()
                rootRef.current
                  ?.querySelector<HTMLElement>('[data-ui-popover-trigger]')
                  ?.focus()
              } else if (!event.shiftKey && target === focusable.at(-1)) {
                event.preventDefault()
                setOpen(false)
                const trigger = rootRef.current?.querySelector<HTMLElement>(
                  '[data-ui-popover-trigger]',
                )
                if (trigger && panelRef.current)
                  focusAdjacentToTrigger(trigger, panelRef.current)
              }
            }}
            className={cn(
              floatingPanelStyles,
              'grid min-w-60 gap-[var(--space-sm)] rounded-[var(--ui-overlay-radius)] p-[var(--space-md)] leading-normal',
            )}
          >
            {title && (
              <div id={titleId} className="font-[650]">
                {title}
              </div>
            )}
            <div>{content}</div>
          </div>
        </Portal>
      )}
    </div>
  )
}

export type PopconfirmProps = {
  title: ReactNode
  description?: ReactNode
  children: TriggerElement
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  okText?: string
  cancelText?: string
  showCancel?: boolean
  okButtonProps?: Omit<ButtonProps, 'children' | 'onClick'>
  cancelButtonProps?: Omit<ButtonProps, 'children' | 'onClick'>
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
}

/** Confirmation for destructive or irreversible actions, with Dialog focus management. */
export function Popconfirm({
  title,
  description,
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  okText = '确定',
  cancelText = '取消',
  showCancel = true,
  okButtonProps,
  cancelButtonProps,
  onConfirm,
  onCancel,
}: PopconfirmProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const [loading, setLoading] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = useCallback(
    (next: boolean) => {
      if (controlledOpen === undefined) setInternalOpen(next)
      onOpenChange?.(next)
    },
    [controlledOpen, onOpenChange],
  )
  return (
    <Dialog
      title={title}
      description={typeof description === 'string' ? description : undefined}
      open={open}
      onOpenChange={setOpen}
      trigger={cloneElement(children, {
        disabled: disabled || children.props.disabled,
        onClick: (event) => {
          if (disabled) return
          if (!callHandler(children.props.onClick, event)) return
          setOpen(true)
        },
      })}
      footer={
        <>
          {showCancel && (
            <Button
              {...cancelButtonProps}
              variant={cancelButtonProps?.variant ?? 'outline'}
              onClick={() => {
                onCancel?.()
                setOpen(false)
              }}
            >
              {cancelText}
            </Button>
          )}
          <Button
            {...okButtonProps}
            loading={loading}
            onClick={async () => {
              setLoading(true)
              try {
                await onConfirm?.()
                setOpen(false)
              } finally {
                setLoading(false)
              }
            }}
          >
            {okText}
          </Button>
        </>
      }
    >
      {typeof description === 'string' ? null : description}
    </Dialog>
  )
}

type FloatButtonCommonProps = {
  label: string
  shape?: 'circle' | 'square'
  position?: FloatButtonPosition
  tooltip?: ReactNode
  badge?: Omit<BadgeProps, 'children' | 'className'>
  containerClassName?: string
  className?: string
  variant?: ButtonProps['variant']
  danger?: boolean
  disabled?: boolean
  loading?: boolean
  icon?: ReactNode
  iconPosition?: ButtonProps['iconPosition']
  children?: ReactNode
}

export type FloatButtonButtonProps = FloatButtonCommonProps &
  Omit<
    ButtonProps,
    | 'size'
    | 'shape'
    | 'className'
    | 'variant'
    | 'danger'
    | 'disabled'
    | 'loading'
    | 'icon'
    | 'iconPosition'
    | 'children'
  > & {
    href?: never
    linkTarget?: never
  }

export type FloatButtonLinkProps = FloatButtonCommonProps &
  Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    'children' | 'className' | 'href' | 'target' | 'onClick'
  > & {
    href: string
    linkTarget?: string
    onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
  }

export type FloatButtonProps = FloatButtonButtonProps | FloatButtonLinkProps

export const FloatButton = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  FloatButtonProps
>(function FloatButton(
  {
    label,
    shape = 'circle',
    position = 'bottom-right',
    tooltip,
    badge,
    containerClassName,
    className,
    ...nativeProps
  },
  ref,
) {
  let control: ReactElement
  if (nativeProps.href !== undefined) {
    const {
      href,
      linkTarget,
      disabled = false,
      loading = false,
      variant = 'primary',
      danger = false,
      icon,
      iconPosition = 'start',
      children,
      onClick,
      ...anchorProps
    } = nativeProps as FloatButtonLinkProps
    const inactive = disabled || loading
    const resolvedVariant = danger ? 'destructive' : variant
    control = (
      <a
        {...anchorProps}
        ref={ref as Ref<HTMLAnchorElement>}
        href={inactive ? undefined : href}
        target={linkTarget}
        rel={
          anchorProps.rel ??
          (linkTarget === '_blank' ? 'noopener noreferrer' : undefined)
        }
        role={inactive ? 'link' : undefined}
        tabIndex={inactive ? -1 : anchorProps.tabIndex}
        aria-label={anchorProps['aria-label'] ?? label}
        aria-disabled={inactive || undefined}
        aria-busy={loading || undefined}
        data-ui-float-button-link=""
        className={cn(
          buttonStyles,
          buttonVariantStyles[resolvedVariant],
          buttonSizeStyles.icon,
          !inactive && floatLinkInteractionStyles[resolvedVariant],
          inactive && 'cursor-not-allowed opacity-[0.55]',
          'relative',
          floatButtonControlStyles,
          floatButtonShapeStyles[shape],
          className,
        )}
        onClick={(event) => {
          if (inactive) {
            event.preventDefault()
            return
          }
          onClick?.(event)
        }}
      >
        {iconPosition === 'start' && icon}
        {loading && <span className={spinnerStyles} aria-hidden="true" />}
        {children}
        {iconPosition === 'end' && icon}
      </a>
    )
  } else {
    control = (
      <Button
        {...(nativeProps as ButtonProps)}
        ref={ref as Ref<HTMLButtonElement>}
        size="icon"
        aria-label={nativeProps['aria-label'] ?? label}
        className={cn(
          'relative',
          floatButtonControlStyles,
          floatButtonShapeStyles[shape],
          className,
        )}
      />
    )
  }
  const withTooltip = tooltip ? (
    <Tooltip title={tooltip}>{control as TriggerElement}</Tooltip>
  ) : (
    control
  )

  return (
    <span
      data-ui-float-button-container=""
      className={cn(
        'fixed z-[60]',
        floatButtonPositionStyles[position],
        containerClassName,
      )}
    >
      {badge ? <Badge {...badge}>{withTooltip}</Badge> : withTooltip}
    </span>
  )
})
