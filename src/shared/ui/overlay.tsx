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
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { Button, type ButtonProps } from './button'
import { useConfig } from './config-context'
import { Dialog } from './dialog'
import { Badge, type BadgeProps } from './display'
import {
  floatButtonControlStyles,
  floatButtonPositionStyles,
  floatButtonShapeStyles,
  type FloatButtonPosition,
} from './float-button-styles'
import { Portal } from './portal'

const floatingPanelStyles =
  'invisible fixed z-[70] max-h-[calc(100dvh-1rem)] min-w-48 max-w-[min(22rem,calc(100vw-1rem))] overflow-auto border border-border bg-card text-card-foreground shadow-[0_12px_30px_rgb(0_0_0_/_0.16)]'

type FloatingPlacement =
  'bottom-start' | 'bottom-end' | 'top' | 'bottom' | 'left' | 'right'

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

      if (placement === 'bottom-start' || placement === 'bottom-end') {
        const alignLeft =
          (placement === 'bottom-start') !== (direction === 'rtl')
        left = alignLeft ? anchorRect.left : anchorRect.right - panelRect.width
        const roomBelow = viewportHeight - anchorRect.bottom - margin
        const roomAbove = anchorRect.top - margin
        top =
          roomBelow >= panelRect.height || roomBelow >= roomAbove
            ? anchorRect.bottom + gap
            : anchorRect.top - panelRect.height - gap
      } else if (placement === 'top' || placement === 'bottom') {
        left = anchorRect.left + (anchorRect.width - panelRect.width) / 2
        const roomBelow = viewportHeight - anchorRect.bottom - margin
        const roomAbove = anchorRect.top - margin
        const placeBelow =
          placement === 'bottom'
            ? roomBelow >= panelRect.height || roomBelow >= roomAbove
            : roomAbove < panelRect.height && roomBelow > roomAbove
        top = placeBelow
          ? anchorRect.bottom + gap
          : anchorRect.top - panelRect.height - gap
      } else {
        top = anchorRect.top + (anchorRect.height - panelRect.height) / 2
        const roomLeft = anchorRect.left - margin
        const roomRight = viewportWidth - anchorRect.right - margin
        const placeRight =
          placement === 'right'
            ? roomRight >= panelRect.width || roomRight >= roomLeft
            : roomLeft < panelRect.width && roomRight > roomLeft
        left = placeRight
          ? anchorRect.right + gap
          : anchorRect.left - panelRect.width - gap
      }

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

export type DropdownItem = {
  key: string
  label: ReactNode
  disabled?: boolean
  danger?: boolean
  onSelect?: () => void
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
}: DropdownProps) {
  const { direction } = useConfig()
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isOpen = open ?? internalOpen
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [focusLastOnOpen, setFocusLastOnOpen] = useState(false)
  const triggerId = useId()
  const menuId = `${triggerId}-menu`
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
      'button:not(:disabled)',
    )
    const initialFocus = focusLastOnOpen
      ? options?.[options.length - 1]
      : options?.[0]
    initialFocus?.focus()
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
          'button:not(:disabled)',
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
  }, [focusLastOnOpen, isOpen, setOpen])

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
            className={cn(
              floatingPanelStyles,
              'rounded-[var(--ui-menu-radius)] p-[var(--space-xs)]',
            )}
          >
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                className={cn(
                  'flex w-full min-h-11 touch-manipulation cursor-pointer items-center rounded-[var(--radius-sm)] border-0 bg-transparent px-3 py-2.5 text-start text-inherit hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50',
                  item.danger &&
                    'text-destructive hover:text-destructive focus-visible:text-destructive',
                )}
                disabled={item.disabled}
                onClick={() => {
                  item.onSelect?.()
                  setOpen(false)
                  rootRef.current
                    ?.querySelector<HTMLElement>('[data-ui-dropdown-trigger]')
                    ?.focus()
                }}
              >
                {item.label}
              </button>
            ))}
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
}

/** Optional contextual help that also appears when its trigger receives focus. */
export function Tooltip({
  title,
  children,
  placement = 'top',
  className,
}: TooltipProps) {
  const { direction } = useConfig()
  const id = useId()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLSpanElement>(null)
  useFloatingPosition(rootRef, tooltipRef, open, placement)
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])
  const describedBy = [children.props['aria-describedby'], id]
    .filter(Boolean)
    .join(' ')
  const trigger = cloneElement(children, {
    'aria-describedby': open ? describedBy : children.props['aria-describedby'],
    'data-ui-tooltip-trigger': '',
    onFocus: (event) => {
      children.props.onFocus?.(event)
      setOpen(true)
    },
    onBlur: (event) => {
      children.props.onBlur?.(event)
      setOpen(false)
    },
    onPointerDown: (event) => {
      children.props.onPointerDown?.(event)
      // Pointer down is the reliable activation signal on touch browsers;
      // opening for mouse down as well keeps the control usable before hover
      // styles are applied and does not change the focus/hover close rules.
      setOpen(true)
    },
  })
  return (
    <span
      ref={rootRef}
      className={cn('relative inline-flex max-w-full', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
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

export type PopoverProps = {
  title?: ReactNode
  label?: string
  content: ReactNode
  children: TriggerElement
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  placement?: 'bottom-start' | 'bottom-end'
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
  className,
}: PopoverProps) {
  const { direction } = useConfig()
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isOpen = open ?? internalOpen
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const id = useId()
  const titleId = `${id}-title`
  useFloatingPosition(rootRef, panelRef, isOpen, placement, direction)
  const setOpen = useCallback(
    (next: boolean) => {
      if (open === undefined) setInternalOpen(next)
      onOpenChange?.(next)
    },
    [onOpenChange, open],
  )
  useEffect(() => {
    if (!isOpen) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        !rootRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      )
        setOpen(false)
    }
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        rootRef.current
          ?.querySelector<HTMLElement>('[data-ui-popover-trigger]')
          ?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, setOpen])
  const handleTriggerClick = (event: MouseEvent) => {
    if (!callHandler(children.props.onClick, event)) return
    setOpen(!isOpen)
  }
  const trigger = cloneElement(children, {
    'aria-expanded': isOpen,
    'aria-controls': isOpen ? id : undefined,
    'aria-haspopup': 'dialog',
    'data-ui-popover-trigger': '',
    onClick: handleTriggerClick,
  })
  return (
    <div
      ref={rootRef}
      dir={direction}
      className={cn('relative inline-flex max-w-full', className)}
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
  okText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
}

/** Confirmation for destructive or irreversible actions, with Dialog focus management. */
export function Popconfirm({
  title,
  description,
  children,
  okText = '确定',
  cancelText = '取消',
  onConfirm,
  onCancel,
}: PopconfirmProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  return (
    <Dialog
      title={title}
      description={typeof description === 'string' ? description : undefined}
      open={open}
      onOpenChange={setOpen}
      trigger={cloneElement(children, {
        onClick: (event) => {
          if (!callHandler(children.props.onClick, event)) return
          setOpen(true)
        },
      })}
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => {
              onCancel?.()
              setOpen(false)
            }}
          >
            {cancelText}
          </Button>
          <Button
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

export type FloatButtonProps = Omit<ButtonProps, 'size' | 'shape'> & {
  label: string
  shape?: 'circle' | 'square'
  position?: FloatButtonPosition
  tooltip?: ReactNode
  badge?: Omit<BadgeProps, 'children' | 'className'>
  containerClassName?: string
}

export const FloatButton = forwardRef<HTMLButtonElement, FloatButtonProps>(
  function FloatButton(
    {
      label,
      shape = 'circle',
      position = 'bottom-right',
      tooltip,
      badge,
      containerClassName,
      className,
      ...props
    },
    ref,
  ) {
    const control = (
      <Button
        {...props}
        ref={ref}
        size="icon"
        aria-label={props['aria-label'] ?? label}
        className={cn(
          'relative',
          floatButtonControlStyles,
          floatButtonShapeStyles[shape],
          className,
        )}
      />
    )
    const withTooltip = tooltip ? (
      <Tooltip title={tooltip}>{control}</Tooltip>
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
  },
)
