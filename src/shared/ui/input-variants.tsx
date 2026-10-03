import {
  forwardRef,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { clearNativeInput } from './clear-native-input'
import { useConfig } from './config-context'
import { Icon } from './icon'
import { useNativeFormReset } from './native-form-reset'
import { resolveTextCount, type TextCount } from './text-count'
import {
  affixActionStyles,
  affixInputStyles,
  affixShellStyles,
  affixStatusStyles,
  affixVariantStyles,
  inputSizeStyles,
  spinnerStyles,
} from './tailwind-styles'
import type { InputStatus, InputVariant } from './input'

type InputSize = 'default' | 'small' | 'large'

export type SearchInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size' | 'value' | 'defaultValue'
> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  onClear?: () => void
  onSearch?: (value: string) => void
  allowClear?: boolean
  prefix?: ReactNode
  suffix?: ReactNode
  count?: TextCount
  variant?: InputVariant
  status?: InputStatus
  loading?: boolean
  invalid?: boolean
  size?: InputSize
  searchLabel?: string
  clearLabel?: string
}

/** Search entry with a project-owned value and submit contract. */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(allProps, ref) {
    const controlled = Object.prototype.hasOwnProperty.call(allProps, 'value')
    const {
      value,
      defaultValue = '',
      onValueChange,
      onChange,
      onClear,
      onSearch,
      allowClear = false,
      prefix,
      suffix,
      count,
      variant = 'outlined',
      status = 'default',
      loading = false,
      invalid = false,
      size,
      searchLabel = '搜索',
      clearLabel = '清空搜索',
      disabled = false,
      readOnly = false,
      className,
      onKeyDown,
      'aria-invalid': ariaInvalid,
      ...inputProps
    } = allProps
    const { componentSize } = useConfig()
    const resolvedSize =
      size ??
      (componentSize === 'small'
        ? 'small'
        : componentSize === 'large'
          ? 'large'
          : 'default')
    const [internalValue, setInternalValue] = useState(defaultValue)
    const currentValue = controlled ? (value ?? '') : internalValue
    const inputRef = useRef<HTMLInputElement | null>(null)
    const countId = useId()
    useNativeFormReset(inputRef, controlled, defaultValue, setInternalValue)
    const resolvedCount = resolveTextCount(
      currentValue,
      count,
      inputProps.maxLength,
    )
    const resolvedAriaInvalid =
      invalid || status === 'error' || resolvedCount?.exceeded
        ? true
        : ariaInvalid
    const isInvalid = Boolean(
      resolvedAriaInvalid && resolvedAriaInvalid !== 'false',
    )
    const describedBy =
      [inputProps['aria-describedby'], resolvedCount && countId]
        .filter(Boolean)
        .join(' ') || undefined
    const canClear = Boolean(
      allowClear && currentValue && !disabled && !readOnly,
    )

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

    function search() {
      if (disabled || loading) return
      onSearch?.(inputRef.current?.value ?? currentValue)
    }

    return (
      <div
        data-ui-affix-root=""
        data-invalid={isInvalid || undefined}
        data-disabled={disabled || undefined}
        data-status={status === 'default' ? undefined : status}
        data-count-exceeded={resolvedCount?.exceeded || undefined}
        className={cn(
          affixShellStyles,
          affixVariantStyles[variant],
          affixStatusStyles[status],
          isInvalid && 'border-destructive focus-within:border-destructive',
          className,
        )}
      >
        {prefix !== undefined && prefix !== null && (
          <span className="shrink-0 ps-3 text-muted-foreground">{prefix}</span>
        )}
        <input
          {...inputProps}
          ref={(node) => {
            inputRef.current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) ref.current = node
          }}
          type="search"
          value={currentValue}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={resolvedAriaInvalid}
          aria-describedby={describedBy}
          data-status={status === 'default' ? undefined : status}
          className={cn(
            affixInputStyles,
            inputSizeStyles[resolvedSize],
            '[&::-webkit-search-cancel-button]:hidden',
          )}
          onChange={handleChange}
          onKeyDown={(event) => {
            onKeyDown?.(event)
            if (
              event.key === 'Enter' &&
              !event.defaultPrevented &&
              !event.nativeEvent.isComposing &&
              event.nativeEvent.keyCode !== 229
            ) {
              event.preventDefault()
              search()
            }
          }}
        />
        {canClear && (
          <button
            type="button"
            aria-label={clearLabel}
            className={affixActionStyles}
            onClick={clear}
          >
            <Icon name="close" size={18} />
          </button>
        )}
        {suffix !== undefined && suffix !== null && (
          <span className="shrink-0 pe-3 text-muted-foreground">{suffix}</span>
        )}
        {resolvedCount && (
          <span
            id={countId}
            data-ui-search-count=""
            data-exceeded={resolvedCount.exceeded || undefined}
            aria-label={resolvedCount.description}
            className={cn(
              'max-w-[40%] shrink-0 overflow-hidden text-ellipsis whitespace-nowrap pe-2 text-xs text-muted-foreground',
              resolvedCount.exceeded && 'text-destructive',
            )}
          >
            {resolvedCount.content}
          </span>
        )}
        <button
          type="button"
          aria-label={searchLabel}
          aria-busy={loading || undefined}
          disabled={disabled || loading}
          className={cn(
            affixActionStyles,
            'bg-primary text-primary-foreground hover:bg-primary hover:brightness-95',
          )}
          onClick={search}
        >
          {loading ? (
            <span className={spinnerStyles} aria-hidden="true" />
          ) : (
            <Icon name="search" size={20} />
          )}
        </button>
      </div>
    )
  },
)

export type PasswordInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size' | 'value' | 'defaultValue'
> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  onClear?: () => void
  allowClear?: boolean
  clearLabel?: string
  prefix?: ReactNode
  suffix?: ReactNode
  count?: TextCount
  variant?: InputVariant
  status?: InputStatus
  visible?: boolean
  defaultVisible?: boolean
  onVisibleChange?: (visible: boolean) => void
  visibilityToggle?: boolean
  invalid?: boolean
  size?: InputSize
}

/** Password entry with an accessible visibility toggle. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(allProps, ref) {
    const controlled = Object.prototype.hasOwnProperty.call(allProps, 'value')
    const {
      value,
      defaultValue = '',
      onChange,
      onValueChange,
      onClear,
      allowClear = false,
      clearLabel = '清空密码',
      prefix,
      suffix,
      count,
      variant = 'outlined',
      status = 'default',
      visible,
      defaultVisible = false,
      onVisibleChange,
      visibilityToggle = true,
      invalid = false,
      size,
      disabled = false,
      readOnly = false,
      className,
      'aria-invalid': ariaInvalid,
      ...inputProps
    } = allProps
    const { componentSize } = useConfig()
    const resolvedSize =
      size ??
      (componentSize === 'small'
        ? 'small'
        : componentSize === 'large'
          ? 'large'
          : 'default')
    const [internalVisible, setInternalVisible] = useState(defaultVisible)
    const isVisible = visible ?? internalVisible
    const inputRef = useRef<HTMLInputElement | null>(null)
    const countId = useId()
    const [internalValue, setInternalValue] = useState(defaultValue)
    useNativeFormReset(inputRef, controlled, defaultValue, setInternalValue)
    const currentValue = controlled ? (value ?? '') : internalValue
    const resolvedCount = resolveTextCount(
      currentValue,
      count,
      inputProps.maxLength,
    )
    const resolvedAriaInvalid =
      invalid || status === 'error' || resolvedCount?.exceeded
        ? true
        : ariaInvalid
    const isInvalid = Boolean(
      resolvedAriaInvalid && resolvedAriaInvalid !== 'false',
    )
    const describedBy =
      [inputProps['aria-describedby'], resolvedCount && countId]
        .filter(Boolean)
        .join(' ') || undefined
    const canClear = Boolean(
      allowClear && currentValue && !disabled && !readOnly,
    )

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
      <div
        data-ui-affix-root=""
        data-invalid={isInvalid || undefined}
        data-disabled={disabled || undefined}
        data-status={status === 'default' ? undefined : status}
        data-count-exceeded={resolvedCount?.exceeded || undefined}
        className={cn(
          affixShellStyles,
          affixVariantStyles[variant],
          affixStatusStyles[status],
          isInvalid && 'border-destructive focus-within:border-destructive',
          className,
        )}
      >
        {prefix !== undefined && prefix !== null && (
          <span className="shrink-0 ps-3 text-muted-foreground">{prefix}</span>
        )}
        <input
          {...inputProps}
          ref={(node) => {
            inputRef.current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) ref.current = node
          }}
          type={isVisible ? 'text' : 'password'}
          value={currentValue}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={resolvedAriaInvalid}
          aria-describedby={describedBy}
          data-status={status === 'default' ? undefined : status}
          className={cn(affixInputStyles, inputSizeStyles[resolvedSize])}
          onChange={handleChange}
        />
        {canClear && (
          <button
            type="button"
            aria-label={clearLabel}
            className={affixActionStyles}
            onClick={clear}
          >
            <Icon name="close" size={18} />
          </button>
        )}
        {suffix !== undefined && suffix !== null && (
          <span className="shrink-0 pe-3 text-muted-foreground">{suffix}</span>
        )}
        {resolvedCount && (
          <span
            id={countId}
            data-ui-password-count=""
            data-exceeded={resolvedCount.exceeded || undefined}
            aria-label={resolvedCount.description}
            className={cn(
              'max-w-[40%] shrink-0 overflow-hidden text-ellipsis whitespace-nowrap pe-2 text-xs text-muted-foreground',
              resolvedCount.exceeded && 'text-destructive',
            )}
          >
            {resolvedCount.content}
          </span>
        )}
        {visibilityToggle && (
          <button
            type="button"
            aria-label={isVisible ? '隐藏密码' : '显示密码'}
            aria-pressed={isVisible}
            disabled={disabled}
            className={affixActionStyles}
            onClick={() => {
              if (visible === undefined) setInternalVisible(!isVisible)
              onVisibleChange?.(!isVisible)
            }}
          >
            <Icon name={isVisible ? 'eyeOff' : 'eye'} size={20} />
          </button>
        )}
      </div>
    )
  },
)
