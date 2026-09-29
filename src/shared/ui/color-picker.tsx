import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'
import { resolveComponentSize, useConfig } from './config-context'

export type ColorPickerProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'size'
> & {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  showText?: boolean
  size?: 'small' | 'default' | 'large'
  label?: string
  invalid?: boolean
}

function normalizeColor(value: string | undefined) {
  const candidate = value?.trim() ?? ''
  if (/^#[0-9a-f]{6}$/i.test(candidate)) return candidate.toLowerCase()
  if (/^#[0-9a-f]{3}$/i.test(candidate))
    return `#${candidate
      .slice(1)
      .split('')
      .map((digit) => `${digit}${digit}`)
      .join('')}`.toLowerCase()
  return '#000000'
}

/** A native color input with a stable hex string contract. */
export const ColorPicker = forwardRef<HTMLInputElement, ColorPickerProps>(
  function ColorPicker(
    {
      value,
      defaultValue,
      onChange,
      showText = false,
      size,
      label = '颜色',
      invalid,
      'aria-invalid': ariaInvalid,
      'aria-label': ariaLabel,
      className,
      onBlur,
      onFocus,
      ...props
    },
    ref,
  ) {
    const { componentSize } = useConfig()
    const resolvedSize = resolveComponentSize(componentSize, size)
    const [internalValue, setInternalValue] = useState(
      normalizeColor(defaultValue),
    )
    const current = normalizeColor(value ?? internalValue)
    return (
      <span
        className={cn(
          'ui-color-picker',
          `ui-color-picker--${resolvedSize}`,
          showText && 'ui-color-picker--with-text',
          className,
        )}
      >
        <input
          {...props}
          ref={ref}
          type="color"
          aria-invalid={invalid || ariaInvalid || undefined}
          aria-label={
            ariaLabel ?? (props['aria-labelledby'] ? undefined : label)
          }
          className="ui-color-picker__input"
          value={current}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={(event) => {
            const next = normalizeColor(event.currentTarget.value)
            if (value === undefined) setInternalValue(next)
            onChange?.(next)
          }}
        />
        {showText && (
          <span aria-hidden="true" className="ui-color-picker__text">
            {current}
          </span>
        )}
      </span>
    )
  },
)
