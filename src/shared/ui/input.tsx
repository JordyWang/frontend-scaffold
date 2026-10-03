import {
  forwardRef,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { clearNativeInput } from './clear-native-input'
import { useConfig } from './config-context'
import { useNativeFormReset } from './native-form-reset'
import { resolveTextCount, type TextCount } from './text-count'
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
  onClear?: () => void
  onPressEnter?: (event: KeyboardEvent<HTMLInputElement>) => void
  prefix?: ReactNode
  suffix?: ReactNode
  count?: TextCount
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
      onClear,
      onPressEnter,
      prefix,
      suffix,
      count,
      variant = 'outlined',
      status = 'default',
      onChange,
      value,
      defaultValue,
      disabled,
      readOnly,
      onKeyDown,
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
    const countId = useId()
    const [internalValue, setInternalValue] = useState(
      defaultValue === undefined ? '' : String(defaultValue),
    )
    useNativeFormReset(
      inputRef,
      controlled,
      defaultValue === undefined ? '' : String(defaultValue),
      setInternalValue,
    )
    const currentValue = controlled
      ? value === undefined || value === null
        ? ''
        : String(value)
      : internalValue
    const resolvedCount = resolveTextCount(currentValue, count, props.maxLength)
    const hasAffix =
      (prefix !== undefined && prefix !== null) ||
      (suffix !== undefined && suffix !== null) ||
      Boolean(resolvedCount)
    const canClear = Boolean(
      allowClear && currentValue && !disabled && !readOnly,
    )
    const ariaInvalid =
      invalid || status === 'error' || resolvedCount?.exceeded
        ? true
        : props['aria-invalid']
    const isInvalid = Boolean(ariaInvalid && ariaInvalid !== 'false')
    const describedBy =
      [props['aria-describedby'], resolvedCount && countId]
        .filter(Boolean)
        .join(' ') || undefined
    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      if (!controlled) setInternalValue(event.currentTarget.value)
      onValueChange?.(event.currentTarget.value)
      onChange?.(event)
    }
    function clear() {
      if (inputRef.current) clearNativeInput(inputRef.current)
      onClear?.()
      requestAnimationFrame(() => inputRef.current?.focus())
    }
    return (
      <span
        data-ui-input-root=""
        data-disabled={disabled || undefined}
        data-invalid={isInvalid || undefined}
        data-count-exceeded={resolvedCount?.exceeded || undefined}
        className={cn(
          'relative inline-flex w-full min-w-0 items-center',
          hasAffix &&
            'min-h-[max(44px,var(--ui-control-height))] rounded-[var(--ui-field-radius)] border border-input bg-card text-card-foreground focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 data-[disabled=true]:opacity-[0.55] data-[invalid=true]:border-destructive',
          hasAffix && inputVariantStyles[variant],
          hasAffix && inputStatusStyles[status],
          hasAffix &&
            isInvalid &&
            'border-destructive focus-within:border-destructive',
        )}
      >
        {prefix !== undefined && prefix !== null && (
          <span
            data-ui-input-prefix=""
            className="shrink-0 ps-3 text-muted-foreground"
          >
            {prefix}
          </span>
        )}
        <input
          {...props}
          ref={(element) => {
            inputRef.current = element
            if (typeof ref === 'function') ref(element)
            else if (ref) ref.current = element
          }}
          type={type}
          disabled={disabled}
          readOnly={readOnly}
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid}
          aria-describedby={describedBy}
          data-status={status === 'default' ? undefined : status}
          className={cn(
            hasAffix
              ? 'min-h-11 min-w-0 flex-1 rounded-none border-0 bg-transparent px-3 py-2.5 text-base leading-6 text-card-foreground outline-none placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed'
              : inputStyles,
            !hasAffix && inputVariantStyles[variant],
            !hasAffix && inputStatusStyles[status],
            inputSizeStyles[resolvedSize],
            canClear && !hasAffix && 'pe-12',
            className,
          )}
          value={currentValue}
          onChange={handleChange}
          onKeyDown={(event) => {
            onKeyDown?.(event)
            if (
              event.key === 'Enter' &&
              !event.defaultPrevented &&
              !event.nativeEvent.isComposing &&
              event.nativeEvent.keyCode !== 229
            )
              onPressEnter?.(event)
          }}
        />
        {canClear && (
          <button
            type="button"
            aria-label={`${clearLabel}${ariaLabel ? `：${ariaLabel}` : ''}`}
            className={cn(
              'z-10 flex min-h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring',
              !hasAffix && 'absolute inset-y-0 end-0',
            )}
            onClick={clear}
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
        {suffix !== undefined && suffix !== null && (
          <span
            data-ui-input-suffix=""
            className="shrink-0 pe-3 text-muted-foreground"
          >
            {suffix}
          </span>
        )}
        {resolvedCount && (
          <span
            id={countId}
            data-ui-input-count=""
            data-exceeded={resolvedCount.exceeded || undefined}
            aria-label={resolvedCount.description}
            className={cn(
              'max-w-[50%] shrink-0 overflow-hidden text-ellipsis whitespace-nowrap pe-3 text-xs text-muted-foreground',
              resolvedCount.exceeded && 'text-destructive',
            )}
          >
            {resolvedCount.content}
          </span>
        )}
      </span>
    )
  },
)
