import { forwardRef, useId, useState, type FocusEventHandler } from 'react'
import { cn } from '@/shared/lib/utils'
import {
  resolveComponentSize,
  useConfig,
  type ControlSize,
} from './config-context'
import { inputSizeStyles, inputStyles } from './tailwind-styles'

export type DateRange = [start: string, end: string]

export type DateRangePickerProps = {
  value?: DateRange
  defaultValue?: DateRange
  onChange?: (value: DateRange) => void
  onBlur?: FocusEventHandler<HTMLFieldSetElement>
  label?: string
  startLabel?: string
  endLabel?: string
  min?: string
  max?: string
  name?: string
  id?: string
  size?: ControlSize
  required?: boolean
  disabled?: boolean
  className?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-label'?: string
  'aria-labelledby'?: string
}

/** Two native date inputs with one controlled range value. */
export const DateRangePicker = forwardRef<
  HTMLInputElement,
  DateRangePickerProps
>(function DateRangePicker(
  {
    value,
    defaultValue = ['', ''],
    onChange,
    onBlur,
    label = '日期范围',
    startLabel = '开始日期',
    endLabel = '结束日期',
    min,
    max,
    name,
    id,
    size,
    required,
    disabled,
    className,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
  },
  ref,
) {
  const { componentSize, direction } = useConfig()
  const resolvedSize = resolveComponentSize(componentSize, size)
  const generatedId = useId()
  const startId = id ?? `date-range-${generatedId}-start`
  const endId = `date-range-${generatedId}-end`
  const [internalValue, setInternalValue] = useState<DateRange>(defaultValue)
  const [start = '', end = ''] = value ?? internalValue

  function update(next: DateRange) {
    if (value === undefined) setInternalValue(next)
    onChange?.(next)
  }

  return (
    <fieldset
      role="group"
      dir={direction}
      aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? label)}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid || undefined}
      aria-required={required || undefined}
      disabled={disabled}
      className={cn('m-0 min-w-0 border-0 p-0', className)}
      onBlur={(event) => {
        if (
          event.relatedTarget instanceof Node &&
          event.currentTarget.contains(event.relatedTarget)
        )
          return
        onBlur?.(event)
      }}
    >
      <div className="grid min-w-0 grid-cols-1 items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="grid min-w-0 gap-1">
          <label htmlFor={startId} className="text-sm text-muted-foreground">
            {startLabel}
          </label>
          <input
            ref={ref}
            id={startId}
            type="date"
            value={start}
            min={min}
            max={max}
            required={required}
            disabled={disabled}
            aria-invalid={ariaInvalid || undefined}
            aria-describedby={ariaDescribedBy}
            className={cn(
              inputStyles,
              inputSizeStyles[resolvedSize],
              'min-w-0 touch-manipulation focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20',
            )}
            onChange={(event) => {
              const nextStart = event.currentTarget.value
              update([
                nextStart,
                nextStart && end && nextStart > end ? '' : end,
              ])
            }}
          />
        </div>
        <span
          aria-hidden="true"
          className="hidden min-h-11 items-center text-muted-foreground sm:flex"
        >
          –
        </span>
        <div className="grid min-w-0 gap-1">
          <label htmlFor={endId} className="text-sm text-muted-foreground">
            {endLabel}
          </label>
          <input
            id={endId}
            type="date"
            value={end}
            min={min}
            max={max}
            required={required}
            disabled={disabled}
            aria-invalid={ariaInvalid || undefined}
            aria-describedby={ariaDescribedBy}
            className={cn(
              inputStyles,
              inputSizeStyles[resolvedSize],
              'min-w-0 touch-manipulation focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20',
            )}
            onChange={(event) => {
              const nextEnd = event.currentTarget.value
              update([
                nextEnd && start && nextEnd < start ? '' : start,
                nextEnd,
              ])
            }}
          />
        </div>
      </div>
      {name && (
        <input
          type="hidden"
          name={name}
          value={JSON.stringify([start, end])}
          disabled={disabled}
        />
      )}
    </fieldset>
  )
})
