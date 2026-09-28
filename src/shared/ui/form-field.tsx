import { cloneElement, useId, type ReactElement } from 'react'
import { cn } from '@/shared/lib/utils'

type FieldControlProps = {
  id?: string
  required?: boolean
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-labelledby'?: string
}

export type FormFieldProps = {
  label?: string
  control: ReactElement<FieldControlProps>
  id?: string
  description?: string
  error?: string
  required?: boolean
  className?: string
}

export function FormField({
  label,
  control,
  id,
  description,
  error,
  required,
  className,
}: FormFieldProps) {
  const generatedId = useId()
  const controlId = id ?? control.props.id ?? `field-${generatedId}`
  const hintId = description ? `${controlId}-hint` : undefined
  const errorId = error ? `${controlId}-error` : undefined
  const labelId = label ? `${controlId}-label` : undefined
  const describedBy =
    [control.props['aria-describedby'], hintId, errorId]
      .filter(Boolean)
      .join(' ') || undefined
  const labelledBy =
    [control.props['aria-labelledby'], labelId].filter(Boolean).join(' ') ||
    undefined

  return (
    <div className={cn('ui-field', className)}>
      {label && (
        <label id={labelId} htmlFor={controlId} className="ui-field__label">
          {label}
          {required && (
            <span className="ui-field__required" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      )}
      {cloneElement(control, {
        id: controlId,
        required: required || control.props.required,
        'aria-describedby': describedBy,
        'aria-invalid': Boolean(error) || control.props['aria-invalid'],
        'aria-labelledby': labelledBy,
      })}
      {description && (
        <p id={hintId} className="ui-field__hint">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="ui-field__error">
          {error}
        </p>
      )}
    </div>
  )
}
