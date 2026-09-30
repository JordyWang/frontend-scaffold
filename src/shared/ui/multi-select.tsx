import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEventHandler,
  type KeyboardEvent,
} from 'react'
import { cn } from '@/shared/lib/utils'
import {
  resolveComponentSize,
  useConfig,
  type ControlSize,
} from './config-context'
import { Portal } from './portal'
import type { SelectOption } from './select'
import { inputSizeStyles, inputStyles } from './tailwind-styles'

export type MultiSelectProps = {
  options: SelectOption[]
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  label?: string
  placeholder?: string
  showSearch?: boolean
  allowClear?: boolean
  disabled?: boolean
  required?: boolean
  name?: string
  id?: string
  size?: ControlSize
  className?: string
  onBlur?: FocusEventHandler<HTMLSpanElement>
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-label'?: string
  'aria-labelledby'?: string
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

/** Project-owned multi-value select with an optional searchable listbox. */
export const MultiSelect = forwardRef<HTMLButtonElement, MultiSelectProps>(
  function MultiSelect(
    {
      options,
      value,
      defaultValue = [],
      onValueChange,
      label = '多选',
      placeholder = '请选择',
      showSearch = false,
      allowClear = false,
      disabled = false,
      required,
      name,
      id,
      size,
      className,
      onBlur,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
    },
    ref,
  ) {
    const { componentSize, direction } = useConfig()
    const resolvedSize = resolveComponentSize(componentSize, size)
    const generatedId = useId()
    const triggerId = id ?? `multi-select-${generatedId}`
    const listId = `${triggerId}-list`
    const valueId = `${triggerId}-value`
    const triggerRef = useRef<HTMLButtonElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const searchRef = useRef<HTMLInputElement>(null)
    const clearRef = useRef<HTMLButtonElement>(null)
    const touchStartRef = useRef<{ x: number; y: number } | null>(null)
    const suppressClickRef = useRef(false)
    const [internalValue, setInternalValue] = useState(defaultValue)
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [activeValue, setActiveValue] = useState<string | null>(null)
    const selected = [...new Set(value ?? internalValue)]
    const selectedSet = new Set(selected)
    const optionByValue = new Map(
      options.map((option) => [option.value, option]),
    )
    const filtered = options.filter((option) =>
      `${option.label} ${option.value}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
    )
    const activeIndex = filtered.findIndex(
      (option) => option.value === activeValue && !option.disabled,
    )
    const isOpen = open && !disabled

    function close(restoreFocus = false) {
      setOpen(false)
      setQuery('')
      setActiveValue(null)
      if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus())
    }

    function openList() {
      setOpen(true)
      setActiveValue(
        selected.find((key) => {
          const option = optionByValue.get(key)
          return option && !option.disabled
        }) ??
          filtered.find((option) => !option.disabled)?.value ??
          null,
      )
    }

    function changeSelection(next: string[]) {
      const unique = [...new Set(next)]
      if (value === undefined) setInternalValue(unique)
      onValueChange?.(unique)
    }

    function toggleOption(option: SelectOption) {
      if (option.disabled) return
      changeSelection(
        selectedSet.has(option.value)
          ? selected.filter((key) => key !== option.value)
          : [...selected, option.value],
      )
      setActiveValue(option.value)
    }

    function moveActive(offset: -1 | 1) {
      const enabled = filtered.filter((option) => !option.disabled)
      if (!enabled.length) return
      const current = enabled.findIndex(
        (option) => option.value === activeValue,
      )
      const next =
        current < 0
          ? offset === 1
            ? 0
            : enabled.length - 1
          : (current + offset + enabled.length) % enabled.length
      setActiveValue(enabled[next].value)
      if (!isOpen) setOpen(true)
    }

    function handleNavigation(
      event: KeyboardEvent<HTMLElement>,
      inSearch: boolean,
    ) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        moveActive(event.key === 'ArrowDown' ? 1 : -1)
      } else if (event.key === 'Home' && isOpen && !inSearch) {
        event.preventDefault()
        setActiveValue(
          filtered.find((option) => !option.disabled)?.value ?? null,
        )
      } else if (event.key === 'End' && isOpen && !inSearch) {
        event.preventDefault()
        setActiveValue(
          [...filtered].reverse().find((option) => !option.disabled)?.value ??
            null,
        )
      } else if (event.key === 'Escape' && isOpen) {
        event.preventDefault()
        close(true)
      } else if (event.key === 'Enter' || (event.key === ' ' && !inSearch)) {
        event.preventDefault()
        if (!isOpen) openList()
        else if (activeIndex >= 0) toggleOption(filtered[activeIndex])
      } else if (event.key === 'Tab' && inSearch) {
        event.preventDefault()
        const trigger = triggerRef.current
        const panel = panelRef.current
        close()
        if (event.shiftKey) trigger?.focus()
        else if (trigger && panel) focusAfter(trigger, panel)
      }
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
        panel.style.width = `${Math.min(Math.max(anchor.width, 240), rightEdge - leftEdge - 16)}px`
        const popup = panel.getBoundingClientRect()
        const preferredLeft =
          direction === 'rtl' ? anchor.right - popup.width : anchor.left
        panel.style.left = `${Math.max(leftEdge + 8, Math.min(preferredLeft, rightEdge - popup.width - 8))}px`
        const below = bottomEdge - anchor.bottom - 8
        const above = anchor.top - topEdge - 8
        const top =
          below >= popup.height || below >= above
            ? anchor.bottom + 4
            : anchor.top - popup.height - 4
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
      if (isOpen && showSearch)
        searchRef.current?.focus({ preventScroll: true })
    }, [isOpen, showSearch])

    useEffect(() => {
      if (!isOpen) return
      function handlePointerDown(event: PointerEvent) {
        if (
          event.target instanceof Node &&
          !triggerRef.current?.contains(event.target) &&
          !panelRef.current?.contains(event.target) &&
          !clearRef.current?.contains(event.target)
        )
          close()
      }
      document.addEventListener('pointerdown', handlePointerDown, true)
      return () =>
        document.removeEventListener('pointerdown', handlePointerDown, true)
    }, [isOpen])

    useLayoutEffect(() => {
      if (!isOpen || activeIndex < 0) return
      const panel = panelRef.current
      const option = panel?.querySelector<HTMLElement>(
        `[data-option-index="${activeIndex}"]`,
      )
      if (!panel || !option) return
      const top = option.offsetTop
      if (top < panel.scrollTop) panel.scrollTop = top
      else if (top + option.offsetHeight > panel.scrollTop + panel.clientHeight)
        panel.scrollTop = top + option.offsetHeight - panel.clientHeight
    }, [activeIndex, isOpen])

    return (
      <span
        className={cn('relative inline-flex w-full min-w-0', className)}
        onBlur={(event) => {
          const next = event.relatedTarget
          if (
            next instanceof Node &&
            (event.currentTarget.contains(next) ||
              panelRef.current?.contains(next))
          )
            return
          close()
          onBlur?.(event)
        }}
      >
        <button
          ref={(element) => {
            triggerRef.current = element
            if (typeof ref === 'function') ref(element)
            else if (ref) ref.current = element
          }}
          type="button"
          id={triggerId}
          role="combobox"
          aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? label)}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={[ariaDescribedBy, valueId]
            .filter(Boolean)
            .join(' ')}
          aria-invalid={ariaInvalid || undefined}
          aria-required={required || undefined}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={isOpen ? listId : undefined}
          aria-activedescendant={
            isOpen && !showSearch && activeIndex >= 0
              ? `${listId}-option-${activeIndex}`
              : undefined
          }
          disabled={disabled}
          className={cn(
            inputStyles,
            inputSizeStyles[resolvedSize],
            'flex cursor-pointer touch-manipulation flex-wrap items-center gap-1 text-start focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20',
            allowClear && selected.length > 0 && 'pe-12',
          )}
          onClick={() => {
            if (isOpen) close()
            else openList()
          }}
          onKeyDown={(event) => handleNavigation(event, false)}
        >
          <span id={valueId} className="flex min-w-0 flex-1 flex-wrap gap-1">
            {selected.length ? (
              selected.map((key) => (
                <span
                  key={key}
                  className="max-w-full truncate rounded-[var(--radius-sm)] bg-accent px-2 py-0.5 text-sm text-accent-foreground"
                >
                  {optionByValue.get(key)?.label ?? key}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <span aria-hidden="true" className="shrink-0 text-muted-foreground">
            ▾
          </span>
        </button>
        {allowClear && selected.length > 0 && !disabled && (
          <button
            ref={clearRef}
            type="button"
            aria-label={`清空${label}`}
            className="absolute inset-y-0 end-0 z-10 flex min-h-11 w-11 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
            onClick={() => {
              changeSelection([])
              close(true)
            }}
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
        {name && (
          <input
            type="hidden"
            name={name}
            value={JSON.stringify(selected)}
            disabled={disabled}
          />
        )}
        {isOpen && (
          <Portal>
            <div
              ref={panelRef}
              dir={direction}
              className="invisible fixed z-[70] max-h-[min(20rem,calc(100dvh-1rem))] overflow-auto rounded-[var(--ui-menu-radius)] border border-border bg-card p-1 text-card-foreground shadow-xl"
              onPointerDown={(event) => {
                if (!(event.target instanceof HTMLInputElement))
                  event.preventDefault()
              }}
            >
              {showSearch && (
                <input
                  ref={searchRef}
                  type="search"
                  aria-label={`搜索${label}`}
                  aria-controls={listId}
                  aria-activedescendant={
                    activeIndex >= 0
                      ? `${listId}-option-${activeIndex}`
                      : undefined
                  }
                  className={cn(inputStyles, 'mb-1')}
                  value={query}
                  onChange={(event) => {
                    const next = event.currentTarget.value
                    setQuery(next)
                    setActiveValue(
                      options.find(
                        (option) =>
                          !option.disabled &&
                          `${option.label} ${option.value}`
                            .toLocaleLowerCase()
                            .includes(next.trim().toLocaleLowerCase()),
                      )?.value ?? null,
                    )
                  }}
                  onKeyDown={(event) => handleNavigation(event, true)}
                />
              )}
              <div
                id={listId}
                role="listbox"
                aria-label={`${label}选项`}
                aria-multiselectable="true"
              >
                {filtered.length ? (
                  filtered.map((option, index) => (
                    <div
                      key={option.value}
                      id={`${listId}-option-${index}`}
                      role="option"
                      data-option-index={index}
                      data-active={index === activeIndex || undefined}
                      aria-selected={selectedSet.has(option.value)}
                      aria-disabled={option.disabled || undefined}
                      className="flex min-h-11 cursor-pointer touch-manipulation items-center justify-between gap-2 rounded-[var(--radius-sm)] px-3 py-2 data-[active=true]:bg-accent data-[active=true]:text-accent-foreground aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                      onTouchStart={(event) => {
                        const touch = event.touches[0]
                        touchStartRef.current = touch
                          ? { x: touch.clientX, y: touch.clientY }
                          : null
                        suppressClickRef.current = false
                      }}
                      onTouchEnd={(event) => {
                        const start = touchStartRef.current
                        const touch = event.changedTouches[0]
                        touchStartRef.current = null
                        if (
                          !start ||
                          !touch ||
                          Math.hypot(
                            touch.clientX - start.x,
                            touch.clientY - start.y,
                          ) > 8
                        )
                          return
                        event.preventDefault()
                        suppressClickRef.current = true
                        window.setTimeout(() => {
                          suppressClickRef.current = false
                        }, 500)
                        toggleOption(option)
                      }}
                      onTouchCancel={() => {
                        touchStartRef.current = null
                      }}
                      onClick={() => {
                        if (suppressClickRef.current) {
                          suppressClickRef.current = false
                          return
                        }
                        toggleOption(option)
                      }}
                    >
                      <span className="min-w-0 truncate">{option.label}</span>
                      <span
                        aria-hidden="true"
                        className="w-5 shrink-0 text-primary"
                      >
                        {selectedSet.has(option.value) ? '✓' : ''}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="m-0 p-3 text-center text-muted-foreground">
                    暂无匹配项
                  </p>
                )}
              </div>
            </div>
          </Portal>
        )}
      </span>
    )
  },
)
