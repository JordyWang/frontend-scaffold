import {
  forwardRef,
  useId,
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
import { inputSizeStyles, inputStyles } from './tailwind-styles'
import { Button } from './button'

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
  onChange?: (value: number | undefined) => void
}

/** A numeric field that clamps committed values while keeping native key controls. */
export const InputNumber = forwardRef<HTMLInputElement, InputNumberProps>(
  function InputNumber(
    {
      value,
      defaultValue,
      min,
      max,
      step = 1,
      size,
      prefix,
      suffix,
      invalid,
      'aria-invalid': ariaInvalid,
      className,
      onBlur,
      onChange,
      ...props
    },
    ref,
  ) {
    const { componentSize } = useConfig()
    const resolvedSize = resolveComponentSize(componentSize, size)
    const [draft, setDraft] = useState(
      defaultValue === undefined ? '' : String(defaultValue),
    )
    const displayed = value === undefined ? draft : String(value)

    function clamp(next: number) {
      return Math.min(
        max ?? Number.POSITIVE_INFINITY,
        Math.max(min ?? Number.NEGATIVE_INFINITY, next),
      )
    }

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      const raw = event.currentTarget.value
      setDraft(raw)
      const parsed = raw === '' ? undefined : Number(raw)
      if (parsed !== undefined && !Number.isFinite(parsed)) return
      const next = parsed === undefined ? undefined : clamp(parsed)
      onChange?.(next)
    }

    function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
      const parsed = displayed === '' ? undefined : Number(displayed)
      const next =
        parsed === undefined || !Number.isFinite(parsed)
          ? undefined
          : clamp(parsed)
      if (value === undefined) {
        setDraft(next === undefined ? '' : String(next))
      }
      if (next !== parsed) onChange?.(next)
      onBlur?.(event)
    }

    return (
      <span
        aria-invalid={invalid || ariaInvalid || undefined}
        className={cn(
          'ui-input-number',
          `ui-input-number--${resolvedSize}`,
          className,
        )}
      >
        {prefix && <span className="ui-input-number__prefix">{prefix}</span>}
        <input
          {...props}
          ref={ref}
          type="number"
          className="ui-input-number__input"
          value={displayed}
          min={min}
          max={max}
          step={step}
          aria-invalid={invalid || ariaInvalid || undefined}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        {suffix && <span className="ui-input-number__suffix">{suffix}</span>}
      </span>
    )
  },
)

export type SliderProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'onChange'
> & {
  value?: number
  defaultValue?: number
  min?: number
  max?: number
  step?: number
  onChange?: (value: number) => void
  label?: string
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  {
    value,
    defaultValue = 0,
    min = 0,
    max = 100,
    step = 1,
    onChange,
    label = '数值',
    className,
    ...props
  },
  ref,
) {
  const [internal, setInternal] = useState(defaultValue)
  const safeMin = Number.isFinite(min) ? min : 0
  const safeMax = Number.isFinite(max) ? Math.max(safeMin, max) : safeMin
  const safeStep = Number.isFinite(step) && step > 0 ? step : 1
  const rawCurrent = value ?? internal
  const current = Number.isFinite(rawCurrent)
    ? Math.min(safeMax, Math.max(safeMin, rawCurrent))
    : safeMin
  return (
    <input
      {...props}
      ref={ref}
      type="range"
      className={cn('ui-slider', className)}
      aria-label={props['aria-label'] ?? label}
      value={current}
      min={safeMin}
      max={safeMax}
      step={safeStep}
      onChange={(event) => {
        const next = Math.min(
          safeMax,
          Math.max(safeMin, Number(event.currentTarget.value)),
        )
        if (value === undefined) setInternal(next)
        onChange?.(next)
      }}
    />
  )
})

type NativePickerProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'size'
> & {
  value?: string
  defaultValue?: string
  size?: ControlSize
  onChange?: (value: string) => void
}

const NativePicker = forwardRef<
  HTMLInputElement,
  NativePickerProps & { type: 'date' | 'time' }
>(function NativePicker(
  { type, value, defaultValue, size, onChange, className, ...props },
  ref,
) {
  const { componentSize } = useConfig()
  const resolvedSize = resolveComponentSize(componentSize, size)
  return (
    <input
      {...props}
      ref={ref}
      type={type}
      className={cn(
        'ui-input',
        inputStyles,
        inputSizeStyles[resolvedSize],
        className,
      )}
      value={value}
      defaultValue={defaultValue}
      onChange={(event) => onChange?.(event.currentTarget.value)}
    />
  )
})

export type DatePickerProps = NativePickerProps
export type TimePickerProps = NativePickerProps

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  function DatePicker(props, ref) {
    return <NativePicker {...props} ref={ref} type="date" />
  },
)

export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
  function TimePicker(props, ref) {
    return <NativePicker {...props} ref={ref} type="time" />
  },
)

export type AutoCompleteOption = { value: string; label?: ReactNode }
export type AutoCompleteProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'size'
> & {
  options: AutoCompleteOption[]
  value?: string
  defaultValue?: string
  size?: ControlSize
  onChange?: (value: string) => void
  label?: string
}

export const AutoComplete = forwardRef<HTMLInputElement, AutoCompleteProps>(
  function AutoComplete(
    {
      options,
      value,
      defaultValue,
      size,
      onChange,
      label = '自动完成',
      className,
      ...props
    },
    ref,
  ) {
    const { componentSize } = useConfig()
    const resolvedSize = resolveComponentSize(componentSize, size)
    const id = useId()
    const [focused, setFocused] = useState(false)
    const [internalValue, setInternalValue] = useState(defaultValue ?? '')
    const currentValue = value ?? internalValue
    const filtered = options.filter((option) =>
      String(option.value)
        .toLocaleLowerCase()
        .includes(String(currentValue).toLocaleLowerCase()),
    )
    return (
      <>
        <input
          {...props}
          ref={ref}
          role="combobox"
          aria-label={props['aria-label'] ?? label}
          aria-autocomplete="list"
          aria-expanded={focused && filtered.length > 0}
          aria-controls={focused && filtered.length > 0 ? id : undefined}
          aria-haspopup="listbox"
          list={id}
          className={cn(
            'ui-input',
            inputStyles,
            inputSizeStyles[resolvedSize],
            className,
          )}
          value={value === undefined ? internalValue : value}
          onFocus={(event) => {
            setFocused(true)
            props.onFocus?.(event)
          }}
          onBlur={(event) => {
            setFocused(false)
            props.onBlur?.(event)
          }}
          onChange={(event) => {
            const next = event.currentTarget.value
            if (value === undefined) setInternalValue(next)
            onChange?.(next)
          }}
        />
        <datalist id={id}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </datalist>
      </>
    )
  },
)

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

function optionsAt(options: CascaderOption[], path: string[], depth: number) {
  let current = options
  for (let index = 0; index < depth; index += 1) {
    const selected = current.find((option) => option.value === path[index])
    current = selected?.children ?? []
  }
  return current
}

export function Cascader({
  options,
  value,
  defaultValue = [],
  onChange,
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
  const { componentSize } = useConfig()
  const resolvedSize = resolveComponentSize(componentSize, size)
  const [internal, setInternal] = useState(defaultValue)
  const path = value ?? internal
  const selects: ReactNode[] = []
  let depthIndex = 0
  while (
    depthIndex === 0 ||
    optionsAt(options, path, depthIndex - 1).some((item) => item.children)
  ) {
    const depth = depthIndex
    const choices = optionsAt(options, path, depth)
    if (!choices.length) break
    const selected = path[depth] ?? ''
    selects.push(
      <select
        key={depth}
        className={`ui-select ui-input--${resolvedSize} ui-cascader__select`}
        id={depth === 0 ? id : undefined}
        name={depth === 0 ? name : undefined}
        required={depth === 0 ? required : undefined}
        aria-describedby={depth === 0 ? ariaDescribedBy : undefined}
        aria-invalid={depth === 0 ? ariaInvalid : undefined}
        aria-labelledby={depth === 0 ? ariaLabelledBy : undefined}
        aria-label={`${label}${depth ? `第${depth + 1}级` : ''}`}
        value={selected}
        disabled={disabled}
        onChange={(event) => {
          const next = [...path.slice(0, depth), event.currentTarget.value]
          if (value === undefined) setInternal(next)
          onChange?.(next)
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
      </select>,
    )
    if (!selected) break
    depthIndex += 1
  }
  return <div className={cn('ui-cascader', className)}>{selects}</div>
}

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
    <div className={cn('ui-upload', className)}>
      <input
        ref={inputRef}
        className="ui-upload__input"
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
