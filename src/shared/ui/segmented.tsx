import {
  useId,
  useState,
  type ChangeEvent,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { useConfig } from './config-context'

export type SegmentedOption = {
  value: string
  label: ReactNode
  disabled?: boolean
}

export type SegmentedProps = Omit<
  HTMLAttributes<HTMLFieldSetElement>,
  'onChange'
> & {
  options: SegmentedOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  size?: 'small' | 'default' | 'large'
  block?: boolean
  disabled?: boolean
  name?: string
  required?: boolean
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-label'?: string
  'aria-labelledby'?: string
}

/** A compact mutually-exclusive choice built on native radio inputs. */
export function Segmented({
  options,
  value,
  defaultValue,
  onChange,
  size,
  block = false,
  disabled = false,
  name,
  required,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  id,
  className,
  ...props
}: SegmentedProps) {
  const { componentSize } = useConfig()
  const resolvedSize =
    size ??
    (componentSize === 'small'
      ? 'small'
      : componentSize === 'large'
        ? 'large'
        : 'default')
  const generatedName = useId()
  const fallback = options.find((option) => !option.disabled)?.value
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? fallback ?? '',
  )
  const selected = value ?? internalValue

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.currentTarget.value
    if (value === undefined) setInternalValue(next)
    onChange?.(next)
  }

  return (
    <fieldset
      {...props}
      className={cn(
        'inline-flex max-w-full items-stretch gap-0.5 overflow-x-auto rounded-[var(--ui-segmented-radius)] border-0 bg-muted p-1 aria-invalid:ring-1 aria-invalid:ring-destructive',
        block && 'flex w-full',
        className,
      )}
      disabled={disabled}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid || undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      {options.map((option) => {
        const optionId = `${generatedName}-${encodeURIComponent(option.value)}`
        const optionDisabled = disabled || option.disabled
        const inputId = id && option === options[0] ? id : optionId
        const labelId = `${optionId}-label`
        return (
          <label
            key={option.value}
            htmlFor={inputId}
            className={cn(
              'relative inline-flex min-w-16 min-h-[max(44px,var(--ui-segmented-height))] grow shrink-0 basis-auto cursor-pointer items-center justify-center rounded-[var(--radius-sm)] px-3.5 py-2.5 text-center whitespace-nowrap text-muted-foreground focus-within:outline-3 focus-within:outline-offset-[-3px] focus-within:outline-ring',
              resolvedSize === 'small' && 'min-h-11 px-2.5',
              resolvedSize === 'large' && 'min-h-12 px-4',
              selected === option.value &&
                'bg-card font-semibold text-foreground shadow-sm',
              optionDisabled && 'cursor-not-allowed opacity-50',
            )}
          >
            <input
              id={inputId}
              className="sr-only"
              type="radio"
              name={name ?? generatedName}
              value={option.value}
              checked={selected === option.value}
              disabled={optionDisabled}
              required={required}
              aria-labelledby={labelId}
              aria-describedby={
                option === options[0] ? ariaDescribedBy : undefined
              }
              aria-invalid={
                option === options[0] ? ariaInvalid || undefined : undefined
              }
              onChange={handleChange}
            />
            <span id={labelId}>{option.label}</span>
          </label>
        )
      })}
    </fieldset>
  )
}
