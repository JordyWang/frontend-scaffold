import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { Button, type ButtonProps } from './button'
import {
  floatButtonControlStyles,
  floatButtonPositionStyles,
  floatButtonShapeStyles,
  type FloatButtonPosition,
} from './float-button-styles'

export type FloatButtonGroupItem = {
  key: string
  label: string
  icon: ReactNode
  disabled?: boolean
}

export type FloatButtonGroupProps = {
  items: FloatButtonGroupItem[]
  label?: string
  trigger?: 'always' | 'click' | 'hover'
  position?: FloatButtonPosition
  placement?: 'top' | 'bottom' | 'left' | 'right'
  shape?: 'circle' | 'square'
  variant?: ButtonProps['variant']
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onSelect?: (key: string) => void
  className?: string
}

function resolvePlacement(
  position: FloatButtonPosition,
  placement: NonNullable<FloatButtonGroupProps['placement']>,
) {
  if (position.startsWith('bottom') && placement === 'bottom') return 'top'
  if (position.startsWith('top') && placement === 'top') return 'bottom'
  if (position.endsWith('left') && placement === 'left') return 'right'
  if (position.endsWith('right') && placement === 'right') return 'left'
  return placement
}

function TriggerIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M10 4v12M4 10h12" className={open ? 'hidden' : ''} />
      {open && <path d="M5 5l10 10M15 5 5 15" />}
    </svg>
  )
}

/** A fixed collection of touch-sized actions, optionally opened as a menu. */
export function FloatButtonGroup({
  items,
  label = '快捷操作',
  trigger = 'always',
  position = 'bottom-right',
  placement = 'top',
  shape = 'circle',
  variant = 'primary',
  open,
  defaultOpen = false,
  onOpenChange,
  onSelect,
  className,
}: FloatButtonGroupProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isOpen = trigger === 'always' || (open ?? internalOpen)
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const pointerTypeRef = useRef<string | null>(null)
  const suppressFocusOpenRef = useRef(false)
  const resolvedPlacement = resolvePlacement(position, placement)

  const changeOpen = useCallback(
    (next: boolean) => {
      if (trigger === 'always' || isOpen === next) return
      if (open === undefined) setInternalOpen(next)
      onOpenChange?.(next)
    },
    [trigger, isOpen, open, onOpenChange],
  )

  useEffect(() => {
    if (!isOpen || trigger === 'always') return
    const onOutsidePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) changeOpen(false)
    }
    document.addEventListener('pointerdown', onOutsidePointerDown)
    return () =>
      document.removeEventListener('pointerdown', onOutsidePointerDown)
  }, [isOpen, trigger, changeOpen])

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (trigger === 'always') return
    if (!rootRef.current?.contains(event.relatedTarget as Node | null)) {
      changeOpen(false)
    }
  }

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={label}
      data-ui-float-button-group=""
      className={cn(
        'fixed z-[60]',
        floatButtonPositionStyles[position],
        className,
      )}
      onPointerEnter={(event) => {
        if (trigger === 'hover' && event.pointerType === 'mouse') {
          changeOpen(true)
        }
      }}
      onPointerLeave={(event) => {
        if (
          trigger === 'hover' &&
          event.pointerType === 'mouse' &&
          !rootRef.current?.contains(document.activeElement)
        ) {
          changeOpen(false)
        }
      }}
      onFocusCapture={(event) => {
        if (
          trigger === 'hover' &&
          !suppressFocusOpenRef.current &&
          (event.target as HTMLElement).matches(':focus-visible')
        ) {
          changeOpen(true)
        }
      }}
      onBlurCapture={onBlur}
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || !isOpen || trigger === 'always') return
        event.preventDefault()
        event.stopPropagation()
        changeOpen(false)
        triggerRef.current?.focus()
      }}
    >
      {trigger !== 'always' && (
        <Button
          ref={triggerRef}
          size="icon"
          variant={variant}
          disabled={items.length === 0}
          aria-label={label}
          aria-expanded={isOpen}
          aria-controls={isOpen ? listId : undefined}
          data-ui-float-button-trigger=""
          className={cn(
            floatButtonControlStyles,
            floatButtonShapeStyles[shape],
          )}
          onPointerDown={(event) => {
            pointerTypeRef.current = event.pointerType
          }}
          onClick={(event) => {
            if (
              trigger === 'hover' &&
              event.detail > 0 &&
              pointerTypeRef.current === 'mouse'
            ) {
              changeOpen(true)
            } else {
              changeOpen(!isOpen)
            }
          }}
        >
          <TriggerIcon open={isOpen} />
        </Button>
      )}
      {isOpen && items.length > 0 && (
        <div
          id={listId}
          data-ui-float-button-list=""
          data-placement={trigger === 'always' ? undefined : resolvedPlacement}
          className={cn(
            'flex gap-2 overflow-auto',
            trigger === 'always'
              ? cn(
                  'max-h-[calc(100dvh-2rem)]',
                  position.startsWith('bottom')
                    ? 'flex-col-reverse'
                    : 'flex-col',
                )
              : cn(
                  'absolute max-h-[calc(100dvh-6rem)] max-w-[calc(100vw-2rem)]',
                  (resolvedPlacement === 'top' ||
                    resolvedPlacement === 'bottom') &&
                    (position.endsWith('right') ? 'right-0' : 'left-0'),
                  (resolvedPlacement === 'left' ||
                    resolvedPlacement === 'right') &&
                    (position.startsWith('bottom') ? 'bottom-0' : 'top-0'),
                  resolvedPlacement === 'top' &&
                    'bottom-full pb-2 flex-col-reverse',
                  resolvedPlacement === 'bottom' && 'top-full pt-2 flex-col',
                  resolvedPlacement === 'left' &&
                    'right-full pr-2 flex-row-reverse',
                  resolvedPlacement === 'right' && 'left-full pl-2 flex-row',
                ),
          )}
        >
          {items.map((item) => (
            <Button
              key={item.key}
              size="icon"
              variant="outline"
              disabled={item.disabled}
              aria-label={item.label}
              title={item.label}
              data-ui-float-button-item={item.key}
              className={cn(
                floatButtonControlStyles,
                floatButtonShapeStyles[shape],
              )}
              onClick={() => {
                onSelect?.(item.key)
                changeOpen(false)
                if (trigger !== 'always') {
                  suppressFocusOpenRef.current = true
                  triggerRef.current?.focus()
                  queueMicrotask(() => {
                    suppressFocusOpenRef.current = false
                  })
                }
              }}
            >
              {item.icon}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
