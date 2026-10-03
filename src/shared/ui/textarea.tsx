import {
  forwardRef,
  useRef,
  useState,
  type ChangeEvent,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { clearNativeInput } from './clear-native-input'
import { useConfig } from './config-context'
import { useNativeFormReset } from './native-form-reset'
import {
  inputSizeStyles,
  inputStatusStyles,
  inputStyles,
  inputVariantStyles,
} from './tailwind-styles'
import type { InputStatus, InputVariant } from './input'

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean
  size?: 'default' | 'small' | 'large'
  allowClear?: boolean
  clearLabel?: string
  onValueChange?: (value: string) => void
  variant?: InputVariant
  status?: InputStatus
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(allProps, ref) {
    const controlled = Object.prototype.hasOwnProperty.call(allProps, 'value')
    const {
      className,
      invalid,
      size,
      allowClear = false,
      clearLabel = '清空输入',
      onValueChange,
      variant = 'outlined',
      status = 'default',
      onChange,
      value,
      defaultValue,
      disabled,
      readOnly,
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
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [internalValue, setInternalValue] = useState(
      defaultValue === undefined ? '' : String(defaultValue),
    )
    useNativeFormReset(
      textareaRef,
      controlled,
      defaultValue === undefined ? '' : String(defaultValue),
      setInternalValue,
    )
    const currentValue = controlled
      ? value === undefined || value === null
        ? ''
        : String(value)
      : internalValue
    function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
      if (!controlled) setInternalValue(event.currentTarget.value)
      onValueChange?.(event.currentTarget.value)
      onChange?.(event)
    }
    function clear() {
      if (textareaRef.current) clearNativeInput(textareaRef.current)
      requestAnimationFrame(() => textareaRef.current?.focus())
    }
    return (
      <span className="relative inline-flex w-full min-w-0">
        <textarea
          {...props}
          ref={(element) => {
            textareaRef.current = element
            if (typeof ref === 'function') ref(element)
            else if (ref) ref.current = element
          }}
          disabled={disabled}
          readOnly={readOnly}
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
            'min-h-28 resize-y',
            allowClear && currentValue && 'pe-12',
            className,
          )}
          value={currentValue}
          onChange={handleChange}
        />
        {allowClear && currentValue && !disabled && !readOnly && (
          <button
            type="button"
            aria-label={`${clearLabel}${ariaLabel ? `：${ariaLabel}` : ''}`}
            className="absolute end-0 top-0 z-10 flex h-11 w-11 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
            onClick={clear}
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
      </span>
    )
  },
)
