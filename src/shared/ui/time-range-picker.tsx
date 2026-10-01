import { forwardRef, useId, useState, type FocusEventHandler } from 'react'
import { cn } from '@/shared/lib/utils'
import {
  resolveComponentSize,
  useConfig,
  type ControlSize,
} from './config-context'
import type { InputStatus, InputVariant } from './input'
import {
  inputSizeStyles,
  inputStatusStyles,
  inputStyles,
  inputVariantStyles,
} from './tailwind-styles'

type RangeValue = [start: string, end: string]
export type TimeRange = RangeValue

type NativeRangePickerProps = {
  inputType: 'date' | 'time'
  value?: RangeValue
  defaultValue?: RangeValue
  onChange?: (value: RangeValue) => void
  onBlur?: FocusEventHandler<HTMLFieldSetElement>
  label?: string
  startLabel?: string
  endLabel?: string
  min?: string
  max?: string
  step?: number
  name?: string
  id?: string
  size?: ControlSize
  variant?: InputVariant
  status?: InputStatus
  required?: boolean
  disabled?: boolean
  className?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-label'?: string
  'aria-labelledby'?: string
}

export type TimeRangePickerProps = Omit<NativeRangePickerProps, 'inputType'>

function compareRangeValues(a: string, b: string, type: 'date' | 'time') {
  if (type === 'date') return a < b ? -1 : a > b ? 1 : 0
  const seconds = (value: string) => {
    const [hour = 0, minute = 0, second = 0] = value.split(':').map(Number)
    return hour * 3600 + minute * 60 + second
  }
  return seconds(a) - seconds(b)
}

const NativeRangePicker = forwardRef<HTMLInputElement, NativeRangePickerProps>(
  function NativeRangePicker(
    {
      inputType,
      value,
      defaultValue = ['', ''],
      onChange,
      onBlur,
      label = inputType === 'date' ? '日期范围' : '时间范围',
      startLabel = inputType === 'date' ? '开始日期' : '开始时间',
      endLabel = inputType === 'date' ? '结束日期' : '结束时间',
      min,
      max,
      step,
      name,
      id,
      size,
      variant = 'outlined',
      status = 'default',
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
    const startId = id ?? `${inputType}-range-${generatedId}-start`
    const endId = `${inputType}-range-${generatedId}-end`
    const [internalValue, setInternalValue] = useState<RangeValue>(defaultValue)
    const [start = '', end = ''] = value ?? internalValue

    function update(next: RangeValue) {
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
        aria-invalid={status === 'error' || ariaInvalid || undefined}
        data-status={status === 'default' ? undefined : status}
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
              type={inputType}
              value={start}
              min={min}
              max={max}
              step={step}
              required={required}
              disabled={disabled}
              aria-invalid={status === 'error' || ariaInvalid || undefined}
              aria-describedby={ariaDescribedBy}
              className={cn(
                inputStyles,
                inputVariantStyles[variant],
                inputStatusStyles[status],
                inputSizeStyles[resolvedSize],
                'min-w-0 touch-manipulation focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20',
              )}
              onChange={(event) => {
                const nextStart = event.currentTarget.value
                update([
                  nextStart,
                  nextStart &&
                  end &&
                  compareRangeValues(nextStart, end, inputType) > 0
                    ? ''
                    : end,
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
              type={inputType}
              value={end}
              min={min}
              max={max}
              step={step}
              required={required}
              disabled={disabled}
              aria-invalid={status === 'error' || ariaInvalid || undefined}
              aria-describedby={ariaDescribedBy}
              className={cn(
                inputStyles,
                inputVariantStyles[variant],
                inputStatusStyles[status],
                inputSizeStyles[resolvedSize],
                'min-w-0 touch-manipulation focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20',
              )}
              onChange={(event) => {
                const nextEnd = event.currentTarget.value
                update([
                  nextEnd &&
                  start &&
                  compareRangeValues(nextEnd, start, inputType) < 0
                    ? ''
                    : start,
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
  },
)

/** A same-day time interval with native keyboard and touch pickers. */
export const TimeRangePicker = forwardRef<
  HTMLInputElement,
  TimeRangePickerProps
>(function TimeRangePicker(props, ref) {
  return <NativeRangePicker {...props} inputType="time" ref={ref} />
})
