import { cloneElement, useContext, useId, type ReactElement } from 'react'
import { cn } from '@/shared/lib/utils'
import { FormLayoutContext } from './form-layout-context'

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
  const layout = useContext(FormLayoutContext)
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
    <div
      className={cn(
        'grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1',
        layout === 'horizontal' &&
          'sm:grid-cols-[minmax(7rem,0.35fr)_minmax(0,1fr)] sm:items-start',
        layout === 'inline' && 'min-w-[min(100%,12rem)] flex-[1_1_12rem]',
        className,
      )}
    >
      {label && (
        <label id={labelId} htmlFor={controlId} className="font-semibold">
          {label}
          {required && (
            <span className="font-bold text-destructive" aria-hidden="true">
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
        <p
          id={hintId}
          className={cn(
            'm-0 text-sm leading-normal text-muted-foreground',
            layout === 'horizontal' && 'sm:col-start-2',
          )}
        >
          {description}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className={cn(
            'm-0 text-sm leading-normal text-destructive',
            layout === 'horizontal' && 'sm:col-start-2',
          )}
        >
          {error}
        </p>
      )}
    </div>
  )
}
