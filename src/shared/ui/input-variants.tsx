import { forwardRef, useRef, useState, type InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'
import { useConfig } from './config-context'
import { Icon } from './icon'
import { useNativeFormReset } from './native-form-reset'
import {
  affixActionStyles,
  affixInputStyles,
  affixShellStyles,
  inputSizeStyles,
  spinnerStyles,
} from './tailwind-styles'

type InputSize = 'default' | 'small' | 'large'

export type SearchInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size' | 'value' | 'defaultValue' | 'onChange'
> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  onSearch?: (value: string) => void
  allowClear?: boolean
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
      onSearch,
      allowClear = false,
      loading = false,
      invalid = false,
      size,
      searchLabel = '搜索',
      clearLabel = '清空搜索',
      disabled = false,
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
    useNativeFormReset(inputRef, controlled, defaultValue, setInternalValue)
    const isInvalid = invalid || ariaInvalid === true || ariaInvalid === 'true'

    function change(nextValue: string) {
      if (!controlled) setInternalValue(nextValue)
      onValueChange?.(nextValue)
    }

    function search() {
      if (disabled || loading) return
      onSearch?.(inputRef.current?.value ?? currentValue)
    }

    return (
      <div
        data-invalid={isInvalid || undefined}
        data-disabled={disabled || undefined}
        className={cn(affixShellStyles, className)}
      >
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
          aria-invalid={isInvalid || undefined}
          className={cn(
            affixInputStyles,
            inputSizeStyles[resolvedSize],
            '[&::-webkit-search-cancel-button]:hidden',
          )}
          onChange={(event) => change(event.target.value)}
          onKeyDown={(event) => {
            onKeyDown?.(event)
            if (
              event.key === 'Enter' &&
              !event.defaultPrevented &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault()
              search()
            }
          }}
        />
        {allowClear && currentValue && !disabled && (
          <button
            type="button"
            aria-label={clearLabel}
            className={affixActionStyles}
            onClick={() => {
              change('')
              inputRef.current?.focus()
            }}
          >
            <Icon name="close" size={18} />
          </button>
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
  'type' | 'size'
> & {
  visible?: boolean
  defaultVisible?: boolean
  onVisibleChange?: (visible: boolean) => void
  visibilityToggle?: boolean
  invalid?: boolean
  size?: InputSize
}

/** Password entry with an accessible visibility toggle. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    {
      visible,
      defaultVisible = false,
      onVisibleChange,
      visibilityToggle = true,
      invalid = false,
      size,
      disabled = false,
      className,
      'aria-invalid': ariaInvalid,
      ...inputProps
    },
    ref,
  ) {
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
    const isInvalid = invalid || ariaInvalid === true || ariaInvalid === 'true'

    return (
      <div
        data-invalid={isInvalid || undefined}
        data-disabled={disabled || undefined}
        className={cn(affixShellStyles, className)}
      >
        <input
          {...inputProps}
          ref={ref}
          type={isVisible ? 'text' : 'password'}
          disabled={disabled}
          aria-invalid={isInvalid || undefined}
          className={cn(affixInputStyles, inputSizeStyles[resolvedSize])}
        />
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
