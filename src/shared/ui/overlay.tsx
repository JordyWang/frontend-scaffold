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
  type ReactElement,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { Button, type ButtonProps } from './button'
import { Dialog } from './dialog'

type TriggerElement = ReactElement<{
  onClick?: (event: MouseEvent) => void
  onKeyDown?: (event: KeyboardEvent) => void
  onFocus?: (event: FocusEvent) => void
  onBlur?: (event: FocusEvent) => void
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
    <div ref={rootRef} className={cn('ui-dropdown', className)}>
      {enhancedTrigger}
      <div
        ref={menuRef}
        id={menuId}
        role="menu"
        aria-label={label}
        hidden={!isOpen}
        className={cn('ui-dropdown__menu', `ui-dropdown__menu--${placement}`)}
      >
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            role="menuitem"
            className={cn(
              'ui-dropdown__item',
              item.danger && 'ui-dropdown__item--danger',
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
  })
  return (
    <span
      className={cn('ui-tooltip', `ui-tooltip--${placement}`, className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {trigger}
      <span
        id={id}
        role="tooltip"
        aria-hidden={!open}
        className="ui-tooltip__content"
      >
        {title}
      </span>
    </span>
  )
}

export type PopoverProps = {
  title?: ReactNode
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
  content,
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  placement = 'bottom-start',
  className,
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isOpen = open ?? internalOpen
  const rootRef = useRef<HTMLDivElement>(null)
  const id = useId()
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
    <div ref={rootRef} className={cn('ui-popover', className)}>
      {trigger}
      <div
        id={id}
        role="dialog"
        hidden={!isOpen}
        className={cn(
          'ui-popover__content',
          `ui-popover__content--${placement}`,
        )}
      >
        {title && <div className="ui-popover__title">{title}</div>}
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
        'ui-float-button',
        `ui-float-button--${shape}`,
        `ui-float-button--${position}`,
        className,
      )}
    />
  )
}
