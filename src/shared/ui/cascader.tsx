import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import {
  resolveComponentSize,
  useConfig,
  type ControlSize,
} from './config-context'
import { Portal } from './portal'
import { inputSizeStyles, inputStyles } from './tailwind-styles'

export type CascaderOption = {
  value: string
  label: ReactNode
  children?: CascaderOption[]
  disabled?: boolean
}

export type CascaderProps = {
  options: CascaderOption[]
  value?: string[]
  defaultValue?: string[]
  onChange?: (value: string[]) => void
  mode?: 'popup' | 'inline'
  allowClear?: boolean
  placeholder?: string
  label?: string
  id?: string
  name?: string
  required?: boolean
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-labelledby'?: string
  disabled?: boolean
  size?: ControlSize
  className?: string
}

type Level = { choices: CascaderOption[]; selected?: CascaderOption }

function cascaderLevels(options: CascaderOption[], path: string[]): Level[] {
  const levels: Level[] = []
  let choices = options
  let depth = 0
  while (true) {
    const selected = choices.find(
      (option) => option.value === path[depth] && !option.disabled,
    )
    levels.push({ choices, selected })
    if (!selected?.children?.length) break
    choices = selected.children
    depth += 1
  }
  return levels
}

function validPathFor(options: CascaderOption[], path: string[]) {
  return cascaderLevels(options, path)
    .map(({ selected }) => selected?.value)
    .filter((item): item is string => item !== undefined)
}

function InlineLevels({
  options,
  path,
  onChange,
  label,
  id,
  required,
  ariaDescribedBy,
  ariaInvalid,
  ariaLabelledBy,
  disabled,
  size,
}: {
  options: CascaderOption[]
  path: string[]
  onChange: (value: string[]) => void
  label: string
  id?: string
  required?: boolean
  ariaDescribedBy?: string
  ariaInvalid?: boolean
  ariaLabelledBy?: string
  disabled?: boolean
  size: ControlSize
}) {
  const levels = cascaderLevels(options, path)
  const validPath = validPathFor(options, path)
  return (
    <div className="flex min-w-0 flex-wrap gap-2">
      {levels.map(({ choices, selected }, depth) => (
        <select
          key={depth}
          className={cn(
            inputStyles,
            inputSizeStyles[size],
            'min-w-[min(100%,10rem)] flex-[1_1_10rem] cursor-pointer touch-manipulation focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20',
            size === 'large'
              ? 'h-[max(48px,var(--ui-control-height))]'
              : 'h-[max(44px,var(--ui-control-height))]',
          )}
          id={depth === 0 ? id : undefined}
          required={required && depth === levels.length - 1}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          aria-labelledby={depth === 0 ? ariaLabelledBy : undefined}
          aria-label={`${label}${depth ? `第${depth + 1}级` : ''}`}
          value={selected?.value ?? ''}
          disabled={disabled}
          onChange={(event) => {
            const chosen = event.currentTarget.value
            onChange(
              chosen
                ? [...validPath.slice(0, depth), chosen]
                : validPath.slice(0, depth),
            )
          }}
        >
          <option value="">请选择</option>
          {choices.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  )
}

const focusableSelector =
  'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function focusAfter(trigger: HTMLElement, panel: HTMLElement) {
  const focusable = [
    ...trigger.ownerDocument.querySelectorAll<HTMLElement>(focusableSelector),
  ].filter((element) =>
    Boolean(element.getClientRects().length && !panel.contains(element)),
  )
  const index = focusable.indexOf(trigger)
  ;(focusable[index + 1] ?? trigger).focus()
}

/** A path selector with a single popup trigger and an optional native inline mode. */
export function Cascader({
  options,
  value,
  defaultValue = [],
  onChange,
  mode = 'popup',
  allowClear = false,
  placeholder = '请选择',
  label = '级联选择',
  id,
  name,
  required,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-labelledby': ariaLabelledBy,
  disabled,
  size,
  className,
}: CascaderProps) {
  const { componentSize, direction } = useConfig()
  const resolvedSize = resolveComponentSize(componentSize, size)
  const generatedId = useId()
  const triggerId = id ?? `cascader-${generatedId}`
  const valueId = `${triggerId}-value`
  const popupId = `${triggerId}-popup`
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [internal, setInternal] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const path = value ?? internal
  const levels = cascaderLevels(options, path)
  const validPath = validPathFor(options, path)
  const selectedLabels = levels
    .map(({ selected }) => selected?.label)
    .filter((item): item is ReactNode => item !== undefined)
  const isOpen = open && !disabled

  function close(restoreFocus = true) {
    setOpen(false)
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus())
  }

  function changePath(next: string[]) {
    if (value === undefined) setInternal(next)
    onChange?.(next)
    if (mode !== 'popup') return
    const nextLevels = cascaderLevels(options, next)
    const last = nextLevels.at(-1)?.selected
    if (!next.length || (last && !last.children?.length)) {
      close()
      return
    }
    requestAnimationFrame(() => {
      const selects = panelRef.current?.querySelectorAll('select')
      selects?.[Math.min(next.length, selects.length - 1)]?.focus()
    })
  }

  useLayoutEffect(() => {
    if (!isOpen) return
    const trigger = triggerRef.current
    const panel = panelRef.current
    if (!trigger || !panel) return

    const position = () => {
      const anchor = trigger.getBoundingClientRect()
      const viewport = window.visualViewport
      const leftEdge = viewport?.offsetLeft ?? 0
      const topEdge = viewport?.offsetTop ?? 0
      const rightEdge = leftEdge + (viewport?.width ?? window.innerWidth)
      const bottomEdge = topEdge + (viewport?.height ?? window.innerHeight)
      if (
        anchor.bottom < topEdge ||
        anchor.top > bottomEdge ||
        anchor.right < leftEdge ||
        anchor.left > rightEdge
      ) {
        panel.style.visibility = 'hidden'
        return
      }
      const width = Math.min(
        Math.max(anchor.width, 360),
        rightEdge - leftEdge - 16,
      )
      panel.style.width = `${width}px`
      const popup = panel.getBoundingClientRect()
      const preferredLeft =
        direction === 'rtl' ? anchor.right - popup.width : anchor.left
      const left = Math.max(
        leftEdge + 8,
        Math.min(preferredLeft, rightEdge - popup.width - 8),
      )
      const below = bottomEdge - anchor.bottom - 8
      const above = anchor.top - topEdge - 8
      const top =
        below >= popup.height || below >= above
          ? anchor.bottom + 4
          : anchor.top - popup.height - 4
      panel.style.left = `${left}px`
      panel.style.top = `${Math.max(topEdge + 8, Math.min(top, bottomEdge - popup.height - 8))}px`
      panel.style.visibility = 'visible'
    }

    position()
    window.addEventListener('resize', position)
    window.addEventListener('scroll', position, true)
    window.visualViewport?.addEventListener('resize', position)
    window.visualViewport?.addEventListener('scroll', position)
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(position)
    observer?.observe(trigger)
    observer?.observe(panel)
    return () => {
      window.removeEventListener('resize', position)
      window.removeEventListener('scroll', position, true)
      window.visualViewport?.removeEventListener('resize', position)
      window.visualViewport?.removeEventListener('scroll', position)
      observer?.disconnect()
    }
  }, [direction, isOpen])

  useLayoutEffect(() => {
    if (isOpen)
      panelRef.current
        ?.querySelector<HTMLSelectElement>('select:not(:disabled)')
        ?.focus()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !triggerRef.current?.contains(event.target) &&
        !panelRef.current?.contains(event.target)
      )
        close(false)
    }
    document.addEventListener('pointerdown', handlePointerDown, true)
    return () =>
      document.removeEventListener('pointerdown', handlePointerDown, true)
  }, [isOpen])

  const field = (
    <InlineLevels
      options={options}
      path={path}
      onChange={changePath}
      label={label}
      id={mode === 'inline' ? triggerId : undefined}
      required={mode === 'inline' ? required : undefined}
      ariaDescribedBy={ariaDescribedBy}
      ariaInvalid={ariaInvalid}
      ariaLabelledBy={mode === 'inline' ? ariaLabelledBy : undefined}
      disabled={disabled}
      size={resolvedSize}
    />
  )

  if (mode === 'inline')
    return (
      <div className={cn('min-w-0', className)}>
        {name && (
          <input
            type="hidden"
            name={name}
            value={JSON.stringify(validPath)}
            disabled={disabled}
          />
        )}
        {field}
      </div>
    )

  return (
    <span className={cn('relative inline-flex w-full min-w-0', className)}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-label={ariaLabelledBy ? undefined : label}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={[ariaDescribedBy, valueId].filter(Boolean).join(' ')}
        aria-invalid={ariaInvalid || undefined}
        aria-required={required || undefined}
        aria-expanded={isOpen}
        aria-controls={isOpen ? popupId : undefined}
        aria-haspopup="dialog"
        disabled={disabled}
        className={cn(
          inputStyles,
          inputSizeStyles[resolvedSize],
          'flex cursor-pointer touch-manipulation items-center justify-between gap-2 text-start focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20',
          allowClear && validPath.length > 0 && 'pe-12',
          selectedLabels.length === 0 && 'text-muted-foreground',
        )}
        onClick={() => {
          if (isOpen) close()
          else {
            triggerRef.current?.scrollIntoView?.({ block: 'nearest' })
            setOpen(true)
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !isOpen) {
            event.preventDefault()
            setOpen(true)
          } else if (event.key === 'Escape' && isOpen) {
            event.preventDefault()
            close()
          }
        }}
      >
        <span id={valueId} className="min-w-0 truncate">
          {selectedLabels.length
            ? selectedLabels.map((item, index) => (
                <span key={index}>
                  {index > 0 && <span aria-hidden="true"> / </span>}
                  {item}
                </span>
              ))
            : placeholder}
        </span>
        {(!allowClear || validPath.length === 0) && (
          <span aria-hidden="true" className="shrink-0 text-muted-foreground">
            ▾
          </span>
        )}
      </button>
      {allowClear && validPath.length > 0 && (
        <button
          type="button"
          aria-label={`清空${label}`}
          disabled={disabled}
          className="absolute inset-y-0 end-0 z-10 flex min-h-11 w-11 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-[0.55]"
          onClick={() => changePath([])}
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
      {name && (
        <input
          type="hidden"
          name={name}
          value={JSON.stringify(validPath)}
          disabled={disabled}
        />
      )}
      {isOpen && (
        <Portal>
          <div
            ref={panelRef}
            id={popupId}
            role="dialog"
            aria-label={`${label}选项`}
            dir={direction}
            className="invisible fixed z-[70] max-h-[min(24rem,calc(100dvh-1rem))] overflow-auto rounded-[var(--ui-menu-radius)] border border-border bg-card p-3 text-card-foreground shadow-xl"
            onKeyDownCapture={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                close()
              } else if (event.key === 'Tab') {
                const selects = [
                  ...panelRef.current!.querySelectorAll(
                    'select:not(:disabled)',
                  ),
                ]
                if (event.shiftKey && event.target === selects[0]) {
                  event.preventDefault()
                  close()
                } else if (
                  !event.shiftKey &&
                  event.target === selects[selects.length - 1]
                ) {
                  event.preventDefault()
                  const trigger = triggerRef.current
                  const panel = panelRef.current
                  close(false)
                  if (trigger && panel) focusAfter(trigger, panel)
                }
              }
            }}
          >
            {field}
          </div>
        </Portal>
      )}
    </span>
  )
}
