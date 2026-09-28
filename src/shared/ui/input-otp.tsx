import {
  forwardRef,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
} from 'react'
import { cn } from '@/shared/lib/utils'

export type InputOTPProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'defaultValue' | 'onChange'
> & {
  length?: number
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onComplete?: (value: string) => void
  label?: string
  name?: string
  inputMode?: 'numeric' | 'text'
  mask?: boolean
  disabled?: boolean
  readOnly?: boolean
  invalid?: boolean
  required?: boolean
  autoFocus?: boolean
}

function normalize(
  value: string,
  length: number,
  inputMode: 'numeric' | 'text',
) {
  const characters = Array.from(value)
  const accepted = characters.filter((character) =>
    inputMode === 'numeric'
      ? /^[0-9]$/.test(character)
      : /^[0-9a-zA-Z]$/.test(character),
  )
  return accepted.slice(0, length).join('')
}

/** A project-owned one-time-code input with native focus and paste behavior. */
export const InputOTP = forwardRef<HTMLDivElement, InputOTPProps>(
  function InputOTP(
    {
      length = 6,
      value,
      defaultValue = '',
      onChange,
      onComplete,
      label,
      name,
      inputMode = 'numeric',
      mask = false,
      disabled = false,
      readOnly = false,
      invalid = false,
      required = false,
      autoFocus = false,
      className,
      id,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      ...props
    },
    ref,
  ) {
    const slotCount = Math.max(1, Math.min(12, Math.trunc(length) || 6))
    const [internalValue, setInternalValue] = useState(() =>
      normalize(defaultValue, slotCount, inputMode),
    )
    const currentValue = normalize(value ?? internalValue, slotCount, inputMode)
    const slotsRef = useRef<Array<HTMLInputElement | null>>([])
    const generatedId = useId()
    const labelId = label ? `${id ?? generatedId}-label` : undefined
    const groupName = label ?? ariaLabel ?? '验证码'

    function update(nextValue: string, focusIndex?: number) {
      const next = normalize(nextValue, slotCount, inputMode)
      if (next !== currentValue) {
        if (value === undefined) setInternalValue(next)
        onChange?.(next)
        if (next.length === slotCount) onComplete?.(next)
      }
      if (focusIndex !== undefined)
        slotsRef.current[
          Math.min(slotCount - 1, Math.max(0, focusIndex))
        ]?.focus()
    }

    function insert(index: number, rawValue: string) {
      const added = normalize(rawValue, slotCount, inputMode)
      if (!added) return
      const start = Math.min(index, currentValue.length)
      const next =
        currentValue.slice(0, start) +
        added +
        currentValue.slice(start + added.length)
      update(next, Math.min(slotCount - 1, start + added.length))
    }

    function handleKeyDown(
      event: KeyboardEvent<HTMLInputElement>,
      index: number,
    ) {
      if (disabled || readOnly) return
      const key = event.key
      if (key === 'ArrowLeft' || key === 'ArrowRight') {
        event.preventDefault()
        const direction = key === 'ArrowLeft' ? -1 : 1
        slotsRef.current[
          Math.min(slotCount - 1, Math.max(0, index + direction))
        ]?.focus()
      } else if (key === 'Home' || key === 'End') {
        event.preventDefault()
        slotsRef.current[key === 'Home' ? 0 : slotCount - 1]?.focus()
      } else if (key === 'Backspace' || key === 'Delete') {
        event.preventDefault()
        const target =
          key === 'Backspace' && index >= currentValue.length
            ? Math.max(0, currentValue.length - 1)
            : index
        if (target < currentValue.length)
          update(
            currentValue.slice(0, target) + currentValue.slice(target + 1),
            target,
          )
        else slotsRef.current[target]?.focus()
      }
    }

    return (
      <div
        {...props}
        ref={ref}
        id={id}
        role="group"
        aria-label={
          ariaLabelledBy || labelId ? undefined : (ariaLabel ?? groupName)
        }
        aria-labelledby={ariaLabelledBy ?? labelId}
        aria-describedby={ariaDescribedBy}
        aria-invalid={invalid || ariaInvalid || undefined}
        aria-required={required || undefined}
        className={cn('ui-input-otp', className)}
      >
        {label && (
          <span id={labelId} className="ui-input-otp__label">
            {label}
          </span>
        )}
        <div className="ui-input-otp__slots">
          {Array.from({ length: slotCount }, (_, index) => (
            <input
              key={index}
              ref={(node) => {
                slotsRef.current[index] = node
              }}
              type={mask ? 'password' : 'text'}
              inputMode={inputMode}
              pattern={inputMode === 'numeric' ? '[0-9]*' : '[0-9A-Za-z]*'}
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              autoFocus={autoFocus && index === 0}
              aria-label={`${groupName}第 ${index + 1} 位，共 ${slotCount} 位`}
              aria-invalid={invalid || ariaInvalid || undefined}
              aria-describedby={ariaDescribedBy}
              value={currentValue[index] ?? ''}
              disabled={disabled}
              readOnly={readOnly}
              className="ui-input-otp__slot"
              onChange={(event) => {
                const raw = event.target.value
                if (!raw) {
                  if (index < currentValue.length)
                    update(
                      currentValue.slice(0, index) +
                        currentValue.slice(index + 1),
                      index,
                    )
                  return
                }
                const previous = currentValue[index]
                const typed =
                  previous && raw.length === 2 && raw.startsWith(previous)
                    ? raw.slice(1)
                    : raw
                insert(index, typed)
              }}
              onPaste={(event) => {
                event.preventDefault()
                insert(index, event.clipboardData.getData('text'))
              }}
              onKeyDown={(event) => handleKeyDown(event, index)}
              onFocus={(event) => event.currentTarget.select()}
            />
          ))}
        </div>
        {name && <input type="hidden" name={name} value={currentValue} />}
      </div>
    )
  },
)
