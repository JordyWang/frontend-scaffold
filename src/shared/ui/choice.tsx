import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

type ChoiceProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size'
> & {
  label: string
  size?: 'default' | 'small'
  invalid?: boolean
}

export type CheckboxProps = ChoiceProps
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    { label, size = 'default', invalid, required, className, ...props },
    ref,
  ) {
    return (
      <label className={cn('ui-choice', `ui-choice--${size}`, className)}>
        <input
          ref={ref}
          type="checkbox"
          aria-invalid={invalid || undefined}
          required={required}
          {...props}
        />
        <span className="ui-choice__mark" aria-hidden="true" />
        <span>
          {label}
          {required && (
            <span className="ui-field__required" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </span>
      </label>
    )
  },
)

export type RadioProps = ChoiceProps
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, size = 'default', invalid, className, ...props },
  ref,
) {
  return (
    <label className={cn('ui-choice', `ui-choice--${size}`, className)}>
      <input
        ref={ref}
        type="radio"
        aria-invalid={invalid || undefined}
        {...props}
      />
      <span
        className="ui-choice__mark ui-choice__mark--radio"
        aria-hidden="true"
      />
      <span>{label}</span>
    </label>
  )
})

export type RadioGroupProps = {
  label: string
  options: { value: string; label: string; disabled?: boolean }[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  name?: string
  id?: string
  required?: boolean
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  disabled?: boolean
  className?: string
}

export function RadioGroup({
  label,
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  id,
  required,
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  disabled,
  className,
}: RadioGroupProps) {
  const generatedName = useId()
  return (
    <fieldset
      id={id}
      className={cn('ui-radio-group', className)}
      disabled={disabled}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
    >
      <legend className="ui-radio-group__legend">
        {label}
        {required && (
          <span className="ui-field__required" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </legend>
      <div className="ui-radio-group__options">
        {options.map((option) => (
          <Radio
            key={option.value}
            name={name ?? generatedName}
            value={option.value}
            label={option.label}
            required={required}
            invalid={invalid}
            {...(value === undefined
              ? { defaultChecked: defaultValue === option.value }
              : { checked: value === option.value })}
            disabled={option.disabled}
            onChange={() => onValueChange?.(option.value)}
          />
        ))}
      </div>
    </fieldset>
  )
}

export type SwitchProps = ChoiceProps
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, size = 'default', invalid, required, className, ...props },
  ref,
) {
  return (
    <label className={cn('ui-switch', `ui-switch--${size}`, className)}>
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        aria-invalid={invalid || undefined}
        required={required}
        {...props}
      />
      <span className="ui-switch__track" aria-hidden="true" />
      <span>
        {label}
        {required && (
          <span className="ui-field__required" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </span>
    </label>
  )
})
