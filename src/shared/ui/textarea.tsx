import {
  forwardRef,
  useLayoutEffect,
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

function normalizeRows(value: number | undefined, fallback: number) {
  return value !== undefined && Number.isFinite(value)
    ? Math.max(1, Math.floor(value))
    : fallback
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean
  size?: 'default' | 'small' | 'large'
  allowClear?: boolean
  clearLabel?: string
  onValueChange?: (value: string) => void
  onClear?: () => void
  autoSize?: boolean | { minRows?: number; maxRows?: number }
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
      onClear,
      autoSize = false,
      variant = 'outlined',
      status = 'default',
      onChange,
      value,
      defaultValue,
      disabled,
      readOnly,
      rows,
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
    const canClear = Boolean(
      allowClear && currentValue && !disabled && !readOnly,
    )
    const minRows =
      typeof autoSize === 'object' && autoSize.minRows !== undefined
        ? normalizeRows(autoSize.minRows, 2)
        : normalizeRows(rows, 2)
    const maxRows =
      typeof autoSize === 'object' && autoSize.maxRows !== undefined
        ? Math.max(minRows, normalizeRows(autoSize.maxRows, minRows))
        : Infinity
    useLayoutEffect(() => {
      const field = textareaRef.current
      if (!field || !autoSize) return
      const previousHeight = field.style.height
      const previousOverflow = field.style.overflowY
      function resize() {
        if (!field) return
        const styles = getComputedStyle(field)
        const lineHeight = parseFloat(styles.lineHeight) || 24
        const padding =
          (parseFloat(styles.paddingTop) || 0) +
          (parseFloat(styles.paddingBottom) || 0)
        const border =
          (parseFloat(styles.borderTopWidth) || 0) +
          (parseFloat(styles.borderBottomWidth) || 0)
        field.style.height = '0px'
        const maximum = maxRows * lineHeight + padding + border
        const height = Math.min(
          Math.max(
            field.scrollHeight + border,
            minRows * lineHeight + padding + border,
          ),
          maximum,
        )
        field.style.height = `${height}px`
        field.style.overflowY =
          field.scrollHeight + border > maximum ? 'auto' : 'hidden'
      }
      resize()
      let previousWidth = field.getBoundingClientRect().width
      let resizeFrame = 0
      const observer =
        typeof ResizeObserver === 'undefined'
          ? null
          : new ResizeObserver(() => {
              const width = field.getBoundingClientRect().width
              if (width !== previousWidth) {
                previousWidth = width
                cancelAnimationFrame(resizeFrame)
                resizeFrame = requestAnimationFrame(resize)
              }
            })
      observer?.observe(field)
      return () => {
        observer?.disconnect()
        cancelAnimationFrame(resizeFrame)
        field.style.height = previousHeight
        field.style.overflowY = previousOverflow
      }
    }, [autoSize, currentValue, minRows, maxRows])
    function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
      if (!controlled) setInternalValue(event.currentTarget.value)
      onValueChange?.(event.currentTarget.value)
      onChange?.(event)
    }
    function clear() {
      if (textareaRef.current) clearNativeInput(textareaRef.current)
      onClear?.()
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
          rows={rows}
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
            autoSize ? 'min-h-0 resize-none' : 'min-h-28 resize-y',
            canClear && 'pe-12',
            className,
          )}
          value={currentValue}
          onChange={handleChange}
        />
        {canClear && (
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
