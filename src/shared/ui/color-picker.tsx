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
        className={cn('inline-flex max-w-full items-center gap-2', className)}
      >
        <input
          {...props}
          ref={ref}
          type="color"
          aria-invalid={invalid || ariaInvalid || undefined}
          aria-label={
            ariaLabel ?? (props['aria-labelledby'] ? undefined : label)
          }
          className={cn(
            'size-11 shrink-0 cursor-pointer touch-manipulation rounded-[var(--ui-field-radius)] border border-input bg-card p-1 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-[0.55]',
            resolvedSize === 'large' && 'size-12',
          )}
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
          <span
            aria-hidden="true"
            className="text-sm leading-6 text-foreground tabular-nums"
          >
            {current}
          </span>
        )}
      </span>
    )
  },
)
