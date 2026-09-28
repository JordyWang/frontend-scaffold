import {
  forwardRef,
  useEffect,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
} from 'react'
import { cn } from '@/shared/lib/utils'

export type InputNumberProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'size'
> & {
  value?: number
  defaultValue?: number
  min?: number
  max?: number
  step?: number
  size?: 'default' | 'small'
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  onChange?: (value: number | undefined) => void
}

/** A numeric field that clamps committed values while keeping native key controls. */
export const InputNumber = forwardRef<HTMLInputElement, InputNumberProps>(
  function InputNumber(
    {
      value,
      defaultValue,
      min,
      max,
      step = 1,
      size = 'default',
      prefix,
      suffix,
      className,
      onBlur,
      onChange,
      ...props
    },
    ref,
  ) {
    const [internal, setInternal] = useState<number | undefined>(defaultValue)
    const current = value ?? internal
    const [draft, setDraft] = useState(
      current === undefined ? '' : String(current),
    )

    useEffect(() => {
      setDraft(current === undefined ? '' : String(current))
    }, [current])

    function clamp(next: number) {
      return Math.min(
        max ?? Number.POSITIVE_INFINITY,
        Math.max(min ?? Number.NEGATIVE_INFINITY, next),
      )
    }

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      const raw = event.currentTarget.value
      setDraft(raw)
      const parsed = raw === '' ? undefined : Number(raw)
      if (parsed !== undefined && !Number.isFinite(parsed)) return
      const next = parsed === undefined ? undefined : clamp(parsed)
      if (value === undefined) setInternal(next)
      onChange?.(next)
    }

    function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
      const parsed = draft === '' ? undefined : Number(draft)
      const next =
        parsed === undefined || !Number.isFinite(parsed)
          ? undefined
          : clamp(parsed)
      setDraft(next === undefined ? '' : String(next))
      if (value === undefined) setInternal(next)
      if (next !== parsed) onChange?.(next)
      onBlur?.(event)
    }

    return (
      <span
        className={cn('ui-input-number', `ui-input-number--${size}`, className)}
      >
        {prefix && <span className="ui-input-number__prefix">{prefix}</span>}
        <input
          {...props}
          ref={ref}
          type="number"
          className="ui-input-number__input"
          value={draft}
          min={min}
          max={max}
          step={step}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        {suffix && <span className="ui-input-number__suffix">{suffix}</span>}
      </span>
    )
  },
)

export type SliderProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'onChange'
> & {
  value?: number
  defaultValue?: number
  min?: number
  max?: number
  step?: number
  onChange?: (value: number) => void
  label?: string
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  {
    value,
    defaultValue = 0,
    min = 0,
    max = 100,
    step = 1,
    onChange,
    label = '数值',
    className,
    ...props
  },
  ref,
) {
  const [internal, setInternal] = useState(defaultValue)
  const current = value ?? internal
  return (
    <input
      {...props}
      ref={ref}
      type="range"
      className={cn('ui-slider', className)}
      aria-label={props['aria-label'] ?? label}
      value={current}
      min={min}
      max={max}
      step={step}
      onChange={(event) => {
        const next = Number(event.currentTarget.value)
        if (value === undefined) setInternal(next)
        onChange?.(next)
      }}
    />
  )
})
