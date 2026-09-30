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

const choiceSizeStyles = {
  default: 'gap-2',
  small: 'gap-1 text-sm',
} as const

const choiceLabelStyles =
  'relative inline-flex min-h-11 touch-manipulation items-center has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-[0.55]'

const choiceInputStyles = 'peer absolute size-px opacity-0'

const choiceMarkStyles =
  'grid size-5 shrink-0 place-items-center rounded border-2 border-input bg-card transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:[&>span:first-child]:opacity-100 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring peer-aria-[invalid=true]:border-destructive'

export type CheckboxProps = ChoiceProps & {
  indeterminate?: boolean
  hideLabel?: boolean
}
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    {
      label,
      size = 'default',
      invalid,
      required,
      hideLabel = false,
      indeterminate = false,
      className,
      ...props
    },
    ref,
  ) {
    return (
      <label
        className={cn(choiceLabelStyles, choiceSizeStyles[size], className)}
      >
        <input
          ref={(element) => {
            if (element) element.indeterminate = indeterminate
            if (typeof ref === 'function') ref(element)
            else if (ref) ref.current = element
          }}
          type="checkbox"
          className={choiceInputStyles}
          aria-invalid={invalid || undefined}
          required={required}
          {...props}
          aria-checked={indeterminate ? 'mixed' : props['aria-checked']}
        />
        <span
          className={cn(
            choiceMarkStyles,
            'peer-indeterminate:border-primary peer-indeterminate:bg-primary peer-indeterminate:[&>span:first-child]:opacity-0 peer-indeterminate:[&>span:last-child]:opacity-100',
          )}
          aria-hidden="true"
        >
          <span className="size-2.5 -translate-y-px rotate-45 border-b-2 border-r-2 border-primary-foreground opacity-0 transition-opacity" />
          <span className="absolute h-0.5 w-2.5 rounded bg-primary-foreground opacity-0 transition-opacity" />
        </span>
        <span className={hideLabel ? 'sr-only' : undefined}>
          {label}
          {required && (
            <span className="text-destructive" aria-hidden="true">
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
    <label className={cn(choiceLabelStyles, choiceSizeStyles[size], className)}>
      <input
        ref={ref}
        type="radio"
        className={choiceInputStyles}
        aria-invalid={invalid || undefined}
        {...props}
      />
      <span className={cn(choiceMarkStyles, 'rounded-full')} aria-hidden="true">
        <span className="size-2 rounded-full bg-primary-foreground opacity-0 transition-opacity" />
      </span>
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
  'aria-labelledby'?: string
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
  'aria-labelledby': labelledBy,
  disabled,
  className,
}: RadioGroupProps) {
  const generatedName = useId()
  return (
    <fieldset
      id={id}
      className={cn('min-w-0 border-0 p-0', className)}
      disabled={disabled}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      aria-labelledby={labelledBy}
    >
      <legend className="mb-1 font-semibold">
        {label}
        {required && (
          <span className="text-destructive" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </legend>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
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
    <label className={cn(choiceLabelStyles, choiceSizeStyles[size], className)}>
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        className={choiceInputStyles}
        aria-invalid={invalid || undefined}
        required={required}
        {...props}
      />
      <span
        className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-input bg-secondary p-0.5 transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring peer-aria-[invalid=true]:border-destructive [&>span]:size-4 [&>span]:rounded-full [&>span]:bg-card-foreground [&>span]:transition-transform peer-checked:[&>span]:translate-x-[1.2rem] rtl:peer-checked:[&>span]:-translate-x-[1.2rem] peer-checked:[&>span]:bg-primary-foreground"
        aria-hidden="true"
      >
        <span />
      </span>
      <span>
        {label}
        {required && (
          <span className="text-destructive" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </span>
    </label>
  )
})
