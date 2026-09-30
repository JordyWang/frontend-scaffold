import {
  forwardRef,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { useConfig } from './config-context'
import { inputSizeStyles, inputStyles } from './tailwind-styles'

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  invalid?: boolean
  size?: 'default' | 'small' | 'large'
  allowClear?: boolean
  clearLabel?: string
  onValueChange?: (value: string) => void
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
      if (!controlled) setInternalValue('')
      onValueChange?.('')
      if (onChange && inputRef.current) {
        const event = {
          target: inputRef.current,
          currentTarget: inputRef.current,
        } as ChangeEvent<HTMLInputElement>
        onChange(event)
      }
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
          aria-invalid={invalid || props['aria-invalid'] || undefined}
          className={cn(
            inputStyles,
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
