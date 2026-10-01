import * as SelectPrimitive from '@radix-ui/react-select'
import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FocusEventHandler,
  type KeyboardEventHandler,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { resolveComponentSize, useConfig } from './config-context'
import { CheckIcon } from './icons'
import { usePortalContainer } from './portal-context'
import {
  inputSizeStyles,
  inputStatusStyles,
  inputStyles,
  inputVariantStyles,
} from './tailwind-styles'
import type { InputStatus, InputVariant } from './input'

export type SelectOption = { value: string; label: string; disabled?: boolean }

function firstEnabledIndex(items: SelectOption[]) {
  return items.findIndex((option) => !option.disabled)
}

function lastEnabledIndex(items: SelectOption[]) {
  for (let index = items.length - 1; index >= 0; index--)
    if (!items[index].disabled) return index
  return -1
}

export type SelectProps = {
  options: SelectOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  showSearch?: boolean
  filterOption?: (inputValue: string, option: SelectOption) => boolean
  allowClear?: boolean
  label?: string
  placeholder?: string
  variant?: InputVariant
  status?: InputStatus
  size?: 'default' | 'small' | 'large'
  disabled?: boolean
  required?: boolean
  name?: string
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-controls'?: string
  autoFocus?: boolean
  onBlur?: FocusEventHandler<HTMLButtonElement>
  onFocus?: FocusEventHandler<HTMLButtonElement>
  onKeyDown?: KeyboardEventHandler<HTMLButtonElement>
  onKeyUp?: KeyboardEventHandler<HTMLButtonElement>
  tabIndex?: number
  title?: string
  className?: string
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  function Select(allProps, ref) {
    const controlled = Object.prototype.hasOwnProperty.call(allProps, 'value')
    const {
      options,
      value,
      defaultValue,
      onValueChange,
      showSearch = false,
      filterOption,
      allowClear = false,
      label,
      placeholder = '请选择',
      variant = 'outlined',
      status = 'default',
      size,
      disabled,
      required,
      name,
      id,
      className,
      'aria-invalid': ariaInvalid,
      ...ariaProps
    } = allProps
    const { componentSize, direction } = useConfig()
    const resolvedSize = resolveComponentSize(componentSize, size)
    const portalContainer = usePortalContainer()
    const generatedId = useId()
    const triggerId = id ?? `select-${generatedId}`
    const listId = `${triggerId}-list`
    const triggerRef = useRef<HTMLButtonElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const viewportRef = useRef<HTMLDivElement>(null)
    const searchRef = useRef<HTMLInputElement>(null)
    const composing = useRef(false)
    const closeFocusTarget = useRef<HTMLElement | null>(null)
    const [internalValue, setInternalValue] = useState(defaultValue ?? '')
    const [open, setOpen] = useState(false)
    const [searchValue, setSearchValue] = useState('')
    const [activeSearchIndex, setActiveSearchIndex] = useState(-1)
    const currentValue = controlled ? (value ?? '') : internalValue
    const isOpen = open && !disabled
    const selectedLabel = options.find(
      (option) => option.value === currentValue,
    )?.label
    const filteredOptions = useMemo(
      () =>
        options.filter((option) =>
          showSearch && searchValue
            ? (filterOption?.(searchValue, option) ??
              `${option.label} ${option.value}`
                .toLocaleLowerCase()
                .includes(searchValue.trim().toLocaleLowerCase()))
            : true,
        ),
      [filterOption, options, searchValue, showSearch],
    )

    function focusOption(index: number) {
      const option = filteredOptions[index]
      if (!option || option.disabled) return
      setActiveSearchIndex(index)
      const element = contentRef.current?.querySelector<HTMLElement>(
        `[data-select-option-index="${index}"]`,
      )
      element?.focus({ preventScroll: true })
      const viewport = viewportRef.current
      if (!element || !viewport) return
      const itemBox = element.getBoundingClientRect()
      const viewportBox = viewport.getBoundingClientRect()
      if (itemBox.top < viewportBox.top)
        viewport.scrollTop += itemBox.top - viewportBox.top
      else if (itemBox.bottom > viewportBox.bottom)
        viewport.scrollTop += itemBox.bottom - viewportBox.bottom
    }

    useEffect(() => {
      if (!isOpen || !showSearch) return
      const frame = requestAnimationFrame(() =>
        searchRef.current?.focus({ preventScroll: true }),
      )
      return () => cancelAnimationFrame(frame)
    }, [isOpen, showSearch])

    useEffect(() => {
      if (!isOpen || !showSearch) return
      setActiveSearchIndex(firstEnabledIndex(filteredOptions))
    }, [filteredOptions, isOpen, showSearch])

    useEffect(() => {
      if (!disabled) return
      setOpen(false)
      setSearchValue('')
      setActiveSearchIndex(-1)
      composing.current = false
    }, [disabled])

    function changeOpen(nextOpen: boolean) {
      setOpen(nextOpen)
      if (!nextOpen) {
        setSearchValue('')
        setActiveSearchIndex(-1)
        composing.current = false
      } else closeFocusTarget.current = null
    }

    function closeToNextControl() {
      const trigger = triggerRef.current
      if (trigger) {
        const controls = [
          ...trigger.ownerDocument.querySelectorAll<HTMLElement>(
            'a[href], button, input, select, textarea, [tabindex]',
          ),
        ].filter(
          (element) =>
            element.tabIndex >= 0 &&
            !element.matches(':disabled') &&
            !element.closest('[inert], [hidden]') &&
            element.getClientRects().length > 0 &&
            getComputedStyle(element).visibility !== 'hidden' &&
            !contentRef.current?.contains(element),
        )
        closeFocusTarget.current =
          controls[controls.indexOf(trigger) + 1] ?? trigger
      }
      changeOpen(false)
    }

    function changeValue(next: string) {
      if (!controlled) setInternalValue(next)
      onValueChange?.(next)
    }

    return (
      <SelectPrimitive.Root
        dir={direction}
        open={isOpen}
        value={currentValue}
        onValueChange={changeValue}
        onOpenChange={changeOpen}
        disabled={disabled}
        required={required}
        name={name}
      >
        <span className="relative inline-flex w-full min-w-0">
          <SelectPrimitive.Trigger
            ref={(element) => {
              triggerRef.current = element
              if (typeof ref === 'function') ref(element)
              else if (ref) ref.current = element
            }}
            id={triggerId}
            dir={direction}
            className={cn(
              inputStyles,
              inputVariantStyles[variant],
              inputStatusStyles[status],
              inputSizeStyles[resolvedSize],
              'flex cursor-pointer touch-manipulation items-center justify-between gap-2 text-start outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 data-[placeholder]:text-muted-foreground data-[disabled]:cursor-not-allowed data-[disabled]:opacity-[0.55] aria-invalid:border-destructive',
              allowClear && currentValue && 'pe-12',
              className,
            )}
            {...ariaProps}
            aria-controls={
              ariaProps['aria-controls'] ?? (isOpen ? listId : undefined)
            }
            aria-invalid={status === 'error' || ariaInvalid || undefined}
            data-status={status === 'default' ? undefined : status}
          >
            <span className="min-w-0 flex-1 truncate">
              <SelectPrimitive.Value placeholder={placeholder}>
                {currentValue ? (
                  <span className="block truncate">
                    {selectedLabel ?? currentValue}
                  </span>
                ) : undefined}
              </SelectPrimitive.Value>
            </span>
            <SelectPrimitive.Icon
              aria-hidden="true"
              className="size-5 shrink-0 [&_svg]:size-5"
            >
              <svg viewBox="0 0 20 20" fill="none">
                <path
                  d="m5 7.5 5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          {allowClear && currentValue && !disabled && (
            <button
              type="button"
              aria-label={`清空${label ?? ariaProps['aria-label'] ?? '选择'}`}
              className="absolute inset-y-0 end-0 z-10 flex min-h-11 w-11 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
              onClick={() => {
                changeValue('')
                requestAnimationFrame(() => triggerRef.current?.focus())
              }}
            >
              <span aria-hidden="true">×</span>
            </button>
          )}
        </span>
        <SelectPrimitive.Portal container={portalContainer}>
          <SelectPrimitive.Content
            ref={contentRef}
            id={listId}
            data-select-content=""
            dir={direction}
            className="z-[70] max-h-[min(20rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-content-available-width)] overflow-hidden rounded-[var(--radius-md)] border border-border bg-card text-card-foreground shadow-xl"
            position="popper"
            sideOffset={4}
            collisionPadding={8}
            onEscapeKeyDown={(event) => {
              if (
                composing.current ||
                event.isComposing ||
                event.keyCode === 229
              )
                event.preventDefault()
            }}
            onCloseAutoFocus={(event) => {
              const target = closeFocusTarget.current
              closeFocusTarget.current = null
              if (!target) return
              event.preventDefault()
              target.focus({ preventScroll: true })
            }}
            onKeyDownCapture={(event) => {
              if (
                !showSearch ||
                composing.current ||
                event.nativeEvent.isComposing ||
                event.keyCode === 229
              )
                return
              const inSearch = event.target === searchRef.current
              if (event.key === 'Tab') {
                event.preventDefault()
                event.stopPropagation()
                if (event.shiftKey) {
                  if (!inSearch)
                    searchRef.current?.focus({ preventScroll: true })
                  else changeOpen(false)
                } else if (
                  inSearch &&
                  firstEnabledIndex(filteredOptions) >= 0
                ) {
                  focusOption(firstEnabledIndex(filteredOptions))
                } else closeToNextControl()
              } else if (
                event.key === 'ArrowUp' &&
                !inSearch &&
                event.target ===
                  contentRef.current?.querySelector(
                    `[data-select-option-index="${firstEnabledIndex(filteredOptions)}"]`,
                  )
              ) {
                event.preventDefault()
                event.stopPropagation()
                searchRef.current?.focus({ preventScroll: true })
              }
            }}
          >
            {showSearch && (
              <div className="p-[var(--space-xs)]">
                <input
                  ref={searchRef}
                  type="search"
                  role="searchbox"
                  aria-label={`搜索${label ?? ariaProps['aria-label'] ?? '选择'}`}
                  aria-controls={listId}
                  className={cn(inputStyles, 'min-h-11')}
                  value={searchValue}
                  onCompositionStart={() => {
                    composing.current = true
                  }}
                  onCompositionEnd={() => {
                    composing.current = false
                  }}
                  onChange={(event) =>
                    setSearchValue(event.currentTarget.value)
                  }
                  onKeyDown={(event) => {
                    // The input owns text editing and IME keys; Radix owns item keys.
                    event.stopPropagation()
                    if (
                      composing.current ||
                      event.nativeEvent.isComposing ||
                      event.keyCode === 229
                    )
                      return
                    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                      event.preventDefault()
                      const index =
                        event.key === 'ArrowDown'
                          ? firstEnabledIndex(filteredOptions)
                          : lastEnabledIndex(filteredOptions)
                      focusOption(index)
                    } else if (event.key === 'Enter') {
                      event.preventDefault()
                      const option = filteredOptions[activeSearchIndex]
                      if (!option || option.disabled) return
                      contentRef.current
                        ?.querySelector<HTMLElement>(
                          `[data-select-option-index="${activeSearchIndex}"]`,
                        )
                        ?.click()
                    } else if (event.key === 'Escape') {
                      event.preventDefault()
                      changeOpen(false)
                    }
                  }}
                />
              </div>
            )}
            <SelectPrimitive.Viewport
              ref={viewportRef}
              className="p-[var(--space-xs)]"
            >
              {filteredOptions.length === 0 ? (
                <div
                  role="status"
                  className="px-3 py-2.5 text-muted-foreground"
                >
                  无匹配选项
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <SelectPrimitive.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    data-select-option-index={index}
                    className="relative flex min-h-11 touch-manipulation items-center rounded-[var(--radius-sm)] py-2.5 pe-8 ps-3 outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
                  >
                    <span className="min-w-0 wrap-anywhere">
                      <SelectPrimitive.ItemText>
                        {option.label}
                      </SelectPrimitive.ItemText>
                    </span>
                    <SelectPrimitive.ItemIndicator
                      aria-hidden="true"
                      className="absolute end-3"
                    >
                      <CheckIcon />
                    </SelectPrimitive.ItemIndicator>
                  </SelectPrimitive.Item>
                ))
              )}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    )
  },
)
