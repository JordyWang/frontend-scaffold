import {
  forwardRef,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { clearNativeInput } from './clear-native-input'
import { useConfig } from './config-context'
import {
  inputSizeStyles,
  inputStatusStyles,
  inputStyles,
  inputVariantStyles,
} from './tailwind-styles'

export type InputVariant = keyof typeof inputVariantStyles
export type InputStatus = keyof typeof inputStatusStyles

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  invalid?: boolean
  size?: 'default' | 'small' | 'large'
  allowClear?: boolean
  clearLabel?: string
  onValueChange?: (value: string) => void
  variant?: InputVariant
  status?: InputStatus
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(allProps, ref) {
    const controlled = Object.prototype.hasOwnProperty.call(allProps, 'value')
    const {
      className,
      invalid,
      size,
      type = 'text',
      allowClear = false,
      clearLabel = '清空输入',
      onValueChange,
      variant = 'outlined',
      status = 'default',
      onChange,
      value,
      defaultValue,
      disabled,
      'aria-label': ariaLabel,
      ...props
    } = allProps
    const { componentSize } = useConfig()
    const resolvedSize =
      size ??
      (componentSize === 'small'
        ? 'small'
        : componentSize === 'large'
          ? 'large'
          : 'default')
    const inputRef = useRef<HTMLInputElement>(null)
    const [internalValue, setInternalValue] = useState(
      defaultValue === undefined ? '' : String(defaultValue),
    )
    const currentValue = controlled
      ? value === undefined || value === null
        ? ''
        : String(value)
      : internalValue
    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      if (!controlled) setInternalValue(event.currentTarget.value)
      onValueChange?.(event.currentTarget.value)
      onChange?.(event)
    }
    function clear() {
      if (inputRef.current) clearNativeInput(inputRef.current)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
    return (
      <span className="relative inline-flex w-full min-w-0">
        <input
          {...props}
          ref={(element) => {
            inputRef.current = element
            if (typeof ref === 'function') ref(element)
            else if (ref) ref.current = element
          }}
          type={type}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-invalid={
            invalid || status === 'error' || props['aria-invalid'] || undefined
          }
          data-status={status === 'default' ? undefined : status}
          className={cn(
            inputStyles,
            inputVariantStyles[variant],
            inputStatusStyles[status],
            inputSizeStyles[resolvedSize],
            allowClear && currentValue && 'pe-12',
            className,
          )}
          value={currentValue}
          onChange={handleChange}
        />
        {allowClear && currentValue && !disabled && (
          <button
            type="button"
            aria-label={`${clearLabel}${ariaLabel ? `：${ariaLabel}` : ''}`}
            className="absolute inset-y-0 end-0 z-10 flex min-h-11 w-11 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
            onClick={clear}
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
      </span>
    )
  },
)
