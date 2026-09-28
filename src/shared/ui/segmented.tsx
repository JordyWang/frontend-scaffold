import {
  useId,
  useState,
  type ChangeEvent,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'

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
  size = 'default',
  block = false,
  disabled = false,
  name,
  required,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
  ...props
}: SegmentedProps) {
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
        'ui-segmented',
        `ui-segmented--${size}`,
        block && 'ui-segmented--block',
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
        return (
          <label
            key={option.value}
            htmlFor={optionId}
            className={cn(
              'ui-segmented__option',
              selected === option.value && 'ui-segmented__option--selected',
              optionDisabled && 'ui-segmented__option--disabled',
            )}
          >
            <input
              id={optionId}
              className="ui-segmented__input"
              type="radio"
              name={name ?? generatedName}
              value={option.value}
              checked={selected === option.value}
              disabled={optionDisabled}
              required={required}
              onChange={handleChange}
            />
            <span className="ui-segmented__label">{option.label}</span>
          </label>
        )
      })}
    </fieldset>
  )
}
