import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEventHandler,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import {
  resolveComponentSize,
  useConfig,
  type ControlSize,
} from './config-context'
import type { InputStatus, InputVariant } from './input'
import {
  inputSizeStyles,
  inputStatusStyles,
  inputStyles,
  inputVariantStyles,
} from './tailwind-styles'
import { Button } from './button'
import { Portal } from './portal'

const inputNumberSizeStyles = {
  default: '',
  small: 'min-h-11',
  large: 'min-h-12',
} as const

export type InputNumberFormatInfo = {
  userTyping: boolean
  input: string
}
export type InputNumberStepInfo = {
  offset: number
  type: 'up' | 'down'
}
export type InputNumberProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'size'
> & {
  value?: number
  defaultValue?: number
  min?: number
  max?: number
  step?: number
  size?: ControlSize
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  invalid?: boolean
  variant?: InputVariant
  status?: InputStatus
  onChange?: (value: number | undefined) => void
  precision?: number
  formatter?: (value: number | undefined, info: InputNumberFormatInfo) => string
  parser?: (value: string) => number | undefined
  controls?: boolean | { upIcon?: ReactNode; downIcon?: ReactNode }
  keyboard?: boolean
  changeOnWheel?: boolean
  onStep?: (value: number, info: InputNumberStepInfo) => void
}

/** A numeric field with Ant Design compatible precision, formatting and step controls. */
export const InputNumber = forwardRef<HTMLInputElement, InputNumberProps>(
  function InputNumber(allProps, ref) {
    const controlled = Object.prototype.hasOwnProperty.call(allProps, 'value')
    const {
      value,
      defaultValue,
      min,
      max,
      step = 1,
      size,
      prefix,
      suffix,
      invalid,
      variant = 'outlined',
      status = 'default',
      precision,
      formatter,
      parser,
      controls = true,
      keyboard = true,
      changeOnWheel = false,
      onStep,
      'aria-invalid': ariaInvalid,
      className,
      disabled,
      onBlur,
      onFocus,
      onChange,
      ...props
    } = allProps
    const { componentSize } = useConfig()
    const resolvedSize = resolveComponentSize(componentSize, size)
    const [draft, setDraft] = useState(
      defaultValue === undefined ? '' : String(defaultValue),
    )
    const [editing, setEditing] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    useEffect(() => {
      if (controlled) return
      const form = inputRef.current?.form
      if (!form) return
      const reset = () => {
        setDraft(defaultValue === undefined ? '' : String(defaultValue))
        setEditing(false)
      }
      form.addEventListener('reset', reset)
      return () => form.removeEventListener('reset', reset)
    }, [controlled, defaultValue])

    function round(next: number) {
      if (precision === undefined || !Number.isFinite(precision)) return next
      const digits = Math.max(0, Math.floor(precision))
      const factor = 10 ** digits
      return Math.round((next + Number.EPSILON) * factor) / factor
    }

    function parse(raw: string) {
      const parsed = parser ? parser(raw) : raw === '' ? undefined : Number(raw)
      return parsed === undefined || !Number.isFinite(parsed)
        ? undefined
        : round(parsed)
    }

    function format(raw: string, userTyping: boolean) {
      if (!formatter) return raw
      const parsed = parse(raw)
      return formatter(parsed, { userTyping, input: raw })
    }

    const current = controlled ? value : parse(draft)
    const committed = current === undefined ? '' : String(current)
    const displayed = editing ? draft : format(committed, false)

    function clamp(next: number) {
      return round(
        Math.min(
          max ?? Number.POSITIVE_INFINITY,
          Math.max(min ?? Number.NEGATIVE_INFINITY, next),
        ),
      )
    }

    function publish(next: number | undefined) {
      const value = next === undefined ? undefined : clamp(next)
      if (!controlled) setDraft(value === undefined ? '' : String(value))
      setEditing(false)
      onChange?.(value)
      return value
    }

    function stepBy(direction: 1 | -1) {
      const offset = Math.abs(step) || 1
      const base = current ?? min ?? 0
      const next = publish(base + direction * offset)
      if (next !== undefined)
        onStep?.(next, {
          offset: direction * offset,
          type: direction > 0 ? 'up' : 'down',
        })
    }

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      const raw = event.currentTarget.value
      const nextDraft = formatter ? format(raw, true) : raw
      setDraft(nextDraft)
      const parsed = parse(raw)
      onChange?.(parsed)
    }

    function handleFocus(event: React.FocusEvent<HTMLInputElement>) {
      setDraft(event.currentTarget.value)
      setEditing(true)
      onFocus?.(event)
    }

    function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
      const raw = event.currentTarget.value
      const parsed = parse(raw)
      const next = parsed === undefined ? undefined : clamp(parsed)
      setEditing(false)
      if (!controlled) setDraft(next === undefined ? '' : String(next))
      if (next !== parsed || (parsed === undefined && raw !== ''))
        onChange?.(next)
      onBlur?.(event)
    }

    return (
      <span
        aria-invalid={invalid || status === 'error' || ariaInvalid || undefined}
        data-status={status === 'default' ? undefined : status}
        data-disabled={disabled || undefined}
        className={cn(
          'inline-flex w-full min-h-[max(44px,var(--ui-control-height))] items-center gap-[var(--space-xs)] rounded-[var(--ui-field-radius)] border border-input bg-card px-3 text-card-foreground focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 aria-invalid:border-destructive data-disabled:cursor-not-allowed data-disabled:opacity-[0.55]',
          inputVariantStyles[variant],
          inputStatusStyles[status],
          inputNumberSizeStyles[resolvedSize],
          className,
        )}
      >
        {prefix && (
          <span className="leading-none text-muted-foreground">{prefix}</span>
        )}
        <input
          {...props}
          ref={(element) => {
            inputRef.current = element
            if (typeof ref === 'function') ref(element)
            else if (ref) ref.current = element
          }}
          type={formatter || parser ? 'text' : 'number'}
          role="spinbutton"
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-inherit outline-none"
          value={displayed}
          min={min}
          max={max}
          step={step}
          aria-valuenow={current}
          aria-valuemin={min}
          aria-valuemax={max}
          disabled={disabled}
          aria-invalid={
            invalid || status === 'error' || ariaInvalid || undefined
          }
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onWheel={(event) => {
            props.onWheel?.(event)
            if (
              !changeOnWheel ||
              document.activeElement !== event.currentTarget
            )
              return
            event.preventDefault()
            stepBy(event.deltaY < 0 ? 1 : -1)
          }}
          onKeyDown={(event) => {
            props.onKeyDown?.(event)
            if (
              keyboard &&
              !event.defaultPrevented &&
              (event.key === 'ArrowUp' || event.key === 'ArrowDown')
            ) {
              event.preventDefault()
              stepBy(event.key === 'ArrowUp' ? 1 : -1)
            }
          }}
        />
        {controls && (
          <span className="flex min-h-11 shrink-0 items-stretch border-s border-input">
            <button
              type="button"
              tabIndex={-1}
              aria-label={(props['aria-label'] ?? '数值') + '增加'}
              disabled={
                disabled ||
                (max !== undefined && current !== undefined && current >= max)
              }
              className="flex min-h-11 w-11 touch-manipulation items-center justify-center border-e border-input text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => stepBy(1)}
            >
              {typeof controls === 'object' ? (
                (controls.upIcon ?? <span aria-hidden="true">+</span>)
              ) : (
                <span aria-hidden="true">+</span>
              )}
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label={(props['aria-label'] ?? '数值') + '减少'}
              disabled={
                disabled ||
                (min !== undefined && current !== undefined && current <= min)
              }
              className="flex min-h-11 w-11 touch-manipulation items-center justify-center text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => stepBy(-1)}
            >
              {typeof controls === 'object' ? (
                (controls.downIcon ?? <span aria-hidden="true">−</span>)
              ) : (
                <span aria-hidden="true">−</span>
              )}
            </button>
          </span>
        )}
        {suffix && (
          <span className="leading-none text-muted-foreground">{suffix}</span>
        )}
      </span>
    )
  },
)

export { Slider } from './slider'
export type { SliderProps } from './slider'

export { TimePicker } from './time-picker'
export type { TimePickerProps } from './time-picker'

export { DatePicker } from './date-picker'
export type { DatePickerProps } from './date-picker'

export type AutoCompleteOption = {
  value: string
  label?: ReactNode
  disabled?: boolean
}
export type AutoCompleteProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'onSelect' | 'size'
> & {
  options: AutoCompleteOption[]
  value?: string
  defaultValue?: string
  size?: ControlSize
  variant?: InputVariant
  status?: InputStatus
  onChange?: (value: string) => void
  onSelect?: (value: string, option: AutoCompleteOption) => void
  label?: string
}

export const AutoComplete = forwardRef<HTMLInputElement, AutoCompleteProps>(
  function AutoComplete(
    {
      options,
      value,
      defaultValue,
      size,
      variant = 'outlined',
      status = 'default',
      onChange,
      onSelect,
      label = '自动完成',
      className,
      ...props
    },
    ref,
  ) {
    const { componentSize, direction } = useConfig()
    const resolvedSize = resolveComponentSize(componentSize, size)
    const id = useId()
    const listId = `${id}-list`
    const inputRef = useRef<HTMLInputElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const touchStartRef = useRef<{ x: number; y: number } | null>(null)
    const suppressFocusOpenRef = useRef(false)
    const [open, setOpen] = useState(false)
    const [activeValue, setActiveValue] = useState<string | null>(null)
    const [internalValue, setInternalValue] = useState(defaultValue ?? '')
    const currentValue = value === undefined ? internalValue : value
    const filtered = options.filter((option) =>
      option.value
        .toLocaleLowerCase()
        .includes(currentValue.toLocaleLowerCase()),
    )
    const visible = open && !props.disabled && filtered.length > 0
    const activeIndex = filtered.findIndex(
      (option) => option.value === activeValue && !option.disabled,
    )

    useLayoutEffect(() => {
      if (!visible) return
      const input = inputRef.current
      const panel = panelRef.current
      if (!input || !panel) return

      const position = () => {
        const anchor = input.getBoundingClientRect()
        const viewport = window.visualViewport
        const viewportLeft = viewport?.offsetLeft ?? 0
        const viewportTop = viewport?.offsetTop ?? 0
        const viewportWidth = viewport?.width ?? window.innerWidth
        const viewportHeight = viewport?.height ?? window.innerHeight
        const viewportRight = viewportLeft + viewportWidth
        const viewportBottom = viewportTop + viewportHeight
        if (
          anchor.bottom < viewportTop ||
          anchor.top > viewportBottom ||
          anchor.right < viewportLeft ||
          anchor.left > viewportRight
        ) {
          panel.style.visibility = 'hidden'
          return
        }
        panel.style.width = `${Math.min(Math.max(anchor.width, 192), viewportWidth - 16)}px`
        const popup = panel.getBoundingClientRect()
        const preferredLeft =
          direction === 'rtl' ? anchor.right - popup.width : anchor.left
        const left = Math.max(
          viewportLeft + 8,
          Math.min(preferredLeft, viewportRight - popup.width - 8),
        )
        const roomBelow = viewportBottom - anchor.bottom - 8
        const roomAbove = anchor.top - viewportTop - 8
        const top =
          roomBelow >= popup.height || roomBelow >= roomAbove
            ? anchor.bottom + 4
            : anchor.top - popup.height - 4
        panel.style.left = `${left}px`
        panel.style.top = `${Math.max(viewportTop + 8, Math.min(top, viewportBottom - popup.height - 8))}px`
        panel.style.visibility = 'visible'
      }

      position()
      window.addEventListener('scroll', position, true)
      window.addEventListener('resize', position)
      window.visualViewport?.addEventListener('resize', position)
      window.visualViewport?.addEventListener('scroll', position)
      const observer =
        typeof ResizeObserver === 'undefined'
          ? null
          : new ResizeObserver(position)
      observer?.observe(input)
      observer?.observe(panel)
      return () => {
        window.removeEventListener('scroll', position, true)
        window.removeEventListener('resize', position)
        window.visualViewport?.removeEventListener('resize', position)
        window.visualViewport?.removeEventListener('scroll', position)
        observer?.disconnect()
      }
    }, [direction, visible])

    function selectOption(option: AutoCompleteOption) {
      if (option.disabled) return
      if (value === undefined) setInternalValue(option.value)
      onChange?.(option.value)
      onSelect?.(option.value, option)
      setOpen(false)
      setActiveValue(null)
      if (inputRef.current && document.activeElement !== inputRef.current) {
        suppressFocusOpenRef.current = true
        inputRef.current.focus()
        suppressFocusOpenRef.current = false
      }
    }

    return (
      <>
        <input
          {...props}
          ref={(element) => {
            inputRef.current = element
            if (typeof ref === 'function') ref(element)
            else if (ref) ref.current = element
          }}
          role="combobox"
          aria-label={props['aria-label'] ?? label}
          aria-autocomplete="list"
          aria-expanded={visible}
          aria-controls={visible ? listId : undefined}
          aria-activedescendant={
            visible && activeIndex >= 0
              ? `${id}-option-${activeIndex}`
              : undefined
          }
          aria-haspopup="listbox"
          autoComplete={props.autoComplete ?? 'off'}
          className={cn(
            inputStyles,
            inputVariantStyles[variant],
            inputStatusStyles[status],
            inputSizeStyles[resolvedSize],
            className,
          )}
          aria-invalid={
            status === 'error' || props['aria-invalid'] || undefined
          }
          data-status={status === 'default' ? undefined : status}
          value={currentValue}
          onFocus={(event) => {
            event.currentTarget.scrollIntoView?.({
              block: 'nearest',
              inline: 'nearest',
            })
            if (!suppressFocusOpenRef.current) setOpen(true)
            props.onFocus?.(event)
          }}
          onBlur={(event) => {
            setOpen(false)
            setActiveValue(null)
            props.onBlur?.(event)
          }}
          onChange={(event) => {
            const next = event.currentTarget.value
            if (value === undefined) setInternalValue(next)
            setActiveValue(null)
            setOpen(true)
            onChange?.(next)
          }}
          onKeyDown={(event) => {
            props.onKeyDown?.(event)
            if (event.defaultPrevented) return
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              const enabled = filtered
                .map((option, index) => (!option.disabled ? index : -1))
                .filter((index) => index >= 0)
              if (!enabled.length) return
              event.preventDefault()
              const current = enabled.indexOf(activeIndex)
              const next =
                current < 0
                  ? event.key === 'ArrowDown'
                    ? 0
                    : enabled.length - 1
                  : (current +
                      (event.key === 'ArrowDown' ? 1 : -1) +
                      enabled.length) %
                    enabled.length
              setActiveValue(filtered[enabled[next]].value)
              setOpen(true)
            } else if (event.key === 'Enter' && visible && activeIndex >= 0) {
              event.preventDefault()
              selectOption(filtered[activeIndex])
            } else if (event.key === 'Escape' && visible) {
              event.preventDefault()
              setOpen(false)
              setActiveValue(null)
            }
          }}
        />
        {visible && (
          <Portal>
            <div
              ref={panelRef}
              id={listId}
              role="listbox"
              aria-label={`${label}建议`}
              dir={direction}
              className="invisible fixed z-[70] max-h-[min(20rem,calc(100dvh-1rem))] overflow-auto rounded-[var(--radius-md)] border border-border bg-card p-[var(--space-xs)] text-card-foreground shadow-xl"
              onPointerDown={(event) => event.preventDefault()}
            >
              {filtered.map((option, index) => (
                <div
                  key={option.value}
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={option.value === currentValue}
                  aria-disabled={option.disabled || undefined}
                  className={cn(
                    'flex min-h-11 cursor-pointer touch-manipulation items-center rounded-[var(--radius-sm)] px-3 py-2.5 text-sm',
                    activeIndex === index && 'bg-accent text-accent-foreground',
                    option.disabled && 'cursor-not-allowed opacity-50',
                  )}
                  onPointerEnter={() => {
                    if (!option.disabled) setActiveValue(option.value)
                  }}
                  onTouchStart={(event) => {
                    const touch = event.touches[0]
                    touchStartRef.current = touch
                      ? { x: touch.clientX, y: touch.clientY }
                      : null
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
                    selectOption(option)
                  }}
                  onTouchCancel={() => {
                    touchStartRef.current = null
                  }}
                  onClick={() => selectOption(option)}
                >
                  {option.label ?? option.value}
                </div>
              ))}
            </div>
          </Portal>
        )}
      </>
    )
  },
)

export type UploadProps = {
  accept?: string
  multiple?: boolean
  disabled?: boolean
  label?: string
  children?: ReactNode
  id?: string
  name?: string
  required?: boolean
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-label'?: string
  'aria-labelledby'?: string
  onBlur?: FocusEventHandler<HTMLInputElement>
  onFocus?: FocusEventHandler<HTMLInputElement>
  tabIndex?: number
  beforeUpload?: (file: File) => boolean | Promise<boolean>
  onFiles?: (files: File[]) => void
  className?: string
}

export function Upload({
  accept,
  multiple = false,
  disabled,
  label = '选择文件',
  children,
  id,
  name,
  required,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  onBlur,
  onFocus,
  tabIndex,
  beforeUpload,
  onFiles,
  className,
}: UploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className={cn('inline-flex max-w-full', className)}>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        id={id}
        name={name}
        required={required}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid || undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        onBlur={onBlur}
        onFocus={onFocus}
        tabIndex={tabIndex ?? -1}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={async (event) => {
          const files = Array.from(event.currentTarget.files ?? [])
          const accepted: File[] = []
          for (const file of files) {
            if (!beforeUpload || (await beforeUpload(file))) accepted.push(file)
          }
          onFiles?.(accepted)
          event.currentTarget.value = ''
        }}
      />
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid || undefined}
        aria-label={ariaLabel}
        onClick={() => inputRef.current?.click()}
      >
        {children ?? label}
      </Button>
    </div>
  )
}
