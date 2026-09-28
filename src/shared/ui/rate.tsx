import {
  useId,
  useState,
  type ChangeEvent,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'

export type RateProps = Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> & {
  count?: number
  value?: number
  defaultValue?: number
  onChange?: (value: number | undefined) => void
  allowClear?: boolean
  disabled?: boolean
  character?: ReactNode
  tooltips?: string[]
  name?: string
  required?: boolean
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-label'?: string
  'aria-labelledby'?: string
}

function normalizeValue(value: number | undefined, count: number) {
  if (value === undefined || !Number.isFinite(value)) return undefined
  return Math.min(count, Math.max(0, Math.round(value)))
}

/** A keyboard-friendly star rating with native radio semantics. */
export function Rate({
  count = 5,
  value,
  defaultValue = 0,
  onChange,
  allowClear = true,
  disabled = false,
  character = '★',
  tooltips,
  name,
  required,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-label': ariaLabel = '评分',
  'aria-labelledby': ariaLabelledBy,
  id,
  className,
  ...props
}: RateProps) {
  const safeCount = Math.min(20, Math.max(1, Math.floor(count)))
  const generatedName = useId()
  const [internalValue, setInternalValue] = useState(
    normalizeValue(defaultValue, safeCount) ?? 0,
  )
  const selected = normalizeValue(value, safeCount) ?? internalValue

  function update(next: number | undefined) {
    const normalized = normalizeValue(next, safeCount)
    if (value === undefined) setInternalValue(normalized ?? 0)
    onChange?.(normalized)
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = Number(event.currentTarget.value)
    if (allowClear && selected === next) update(undefined)
    else update(next)
  }

  return (
    <div
      {...props}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid || undefined}
      className={cn('ui-rate', disabled && 'ui-rate--disabled', className)}
    >
      {Array.from({ length: safeCount }, (_, index) => {
        const score = index + 1
        const optionId = `${generatedName}-${score}`
        const optionLabel = tooltips?.[index] ?? `${score} 星`
        const inputId = id && score === 1 ? id : optionId
        return (
          <label
            key={score}
            htmlFor={inputId}
            className={cn(
              'ui-rate__option',
              score <= selected && 'ui-rate__option--selected',
            )}
            title={optionLabel}
          >
            <input
              id={inputId}
              className="ui-rate__input"
              type="radio"
              name={name ?? generatedName}
              value={score}
              checked={selected === score}
              disabled={disabled}
              required={required}
              aria-label={optionLabel}
              aria-describedby={score === 1 ? ariaDescribedBy : undefined}
              aria-invalid={score === 1 ? ariaInvalid || undefined : undefined}
              title={optionLabel}
              onClick={(event) => {
                if (allowClear && selected === score) {
                  event.preventDefault()
                  update(undefined)
                }
              }}
              onChange={handleChange}
            />
            <span aria-hidden="true" className="ui-rate__star">
              {character}
            </span>
          </label>
        )
      })}
    </div>
  )
}
