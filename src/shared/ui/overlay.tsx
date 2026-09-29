import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
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

const floatingPanelStyles =
  'absolute z-[70] top-[calc(100%+var(--space-xs))] min-w-48 max-w-[min(22rem,calc(100vw-2rem))] overflow-auto border border-border bg-card text-card-foreground shadow-[0_12px_30px_rgb(0_0_0_/_0.16)]'

const tooltipPlacementStyles = {
  top: 'bottom-[calc(100%+var(--space-xs))] left-1/2 -translate-x-1/2',
  bottom: 'top-[calc(100%+var(--space-xs))] left-1/2 -translate-x-1/2',
  left: 'top-1/2 right-[calc(100%+var(--space-xs))] -translate-y-1/2',
  right: 'top-1/2 left-[calc(100%+var(--space-xs))] -translate-y-1/2',
} as const

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
  const triggerId = useId()
  const menuId = `${triggerId}-menu`

  const setOpen = useCallback(
    (next: boolean) => {
      if (open === undefined) setInternalOpen(next)
      onOpenChange?.(next)
    },
    [onOpenChange, open],
  )

  useEffect(() => {
    if (!isOpen) return
    const first = menuRef.current?.querySelector<HTMLButtonElement>(
      'button:not(:disabled)',
    )
    first?.focus()
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
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
      if (!menuRef.current?.contains(document.activeElement)) return
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
  }, [isOpen, setOpen])

  const enhancedTrigger = cloneElement(trigger, {
    'aria-haspopup': 'menu',
    'aria-expanded': isOpen,
    'aria-controls': isOpen ? menuId : undefined,
    'data-ui-dropdown-trigger': '',
    onClick: (event) => {
      if (!callHandler(trigger.props.onClick, event)) return
      setOpen(!isOpen)
    },
    onKeyDown: (event) => {
      if (!callHandler(trigger.props.onKeyDown, event)) return
      if (
        event.key === 'ArrowDown' ||
        event.key === 'Enter' ||
        event.key === ' '
      ) {
        event.preventDefault()
        setOpen(true)
      }
    },
  })

  return (
    <div
      ref={rootRef}
      dir={direction}
      className={cn('relative inline-flex max-w-full', className)}
    >
      {enhancedTrigger}
      <div
        ref={menuRef}
        id={menuId}
        role="menu"
        aria-label={label}
        hidden={!isOpen}
        className={cn(
          floatingPanelStyles,
          'rounded-[var(--ui-menu-radius)] p-[var(--space-xs)]',
          placement === 'bottom-start' ? 'start-0' : 'end-0',
          !isOpen && 'hidden',
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
  const id = useId()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLSpanElement>(null)
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
      <span
        id={id}
        role="tooltip"
        aria-hidden={!open}
        className={cn(
          'pointer-events-none invisible absolute z-[75] w-max max-w-[min(20rem,calc(100vw-2rem))] rounded-[var(--radius-sm)] bg-foreground px-3 py-2 text-sm leading-[1.4] text-background opacity-0 transition-opacity duration-150 ease-out motion-reduce:transition-none',
          tooltipPlacementStyles[placement],
          open && 'visible opacity-100',
        )}
      >
        {title}
      </span>
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
  const id = useId()
  const titleId = `${id}-title`
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
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
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
  const trigger = cloneElement(children, {
    'aria-expanded': isOpen,
    'aria-controls': isOpen ? id : undefined,
    'aria-haspopup': 'dialog',
    'data-ui-popover-trigger': '',
    onClick: (event) => {
      if (!callHandler(children.props.onClick, event)) return
      setOpen(!isOpen)
    },
  })
  return (
    <div
      ref={rootRef}
      dir={direction}
      className={cn('relative inline-flex max-w-full', className)}
    >
      {trigger}
      <div
        id={id}
        role="dialog"
        aria-label={title ? undefined : label}
        aria-labelledby={title ? titleId : undefined}
        hidden={!isOpen}
        className={cn(
          floatingPanelStyles,
          'min-w-60 gap-[var(--space-sm)] rounded-[var(--ui-overlay-radius)] p-[var(--space-md)] leading-normal',
          placement === 'bottom-start' ? 'start-0' : 'end-0',
          isOpen ? 'grid' : 'hidden',
        )}
      >
        {title && (
          <div id={titleId} className="font-[650]">
            {title}
          </div>
        )}
        <div>{content}</div>
      </div>
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

export type FloatButtonProps = Omit<ButtonProps, 'size'> & {
  label: string
  shape?: 'circle' | 'square'
  position?: 'bottom-right' | 'bottom-left'
}

export function FloatButton({
  label,
  shape = 'circle',
  position = 'bottom-right',
  className,
  ...props
}: FloatButtonProps) {
  return (
    <Button
      {...props}
      size="icon"
      aria-label={props['aria-label'] ?? label}
      className={cn(
        'fixed z-[60] right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] left-auto size-[max(44px,var(--ui-button-height))] border-border shadow-[0_8px_24px_rgb(0_0_0_/_0.18)]',
        shape === 'circle' ? 'rounded-full' : 'rounded-[var(--radius-md)]',
        position === 'bottom-left' &&
          'right-auto left-[max(1rem,env(safe-area-inset-left))]',
        className,
      )}
    />
  )
}
