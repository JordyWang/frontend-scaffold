import * as SelectPrimitive from '@radix-ui/react-select'
import {
  forwardRef,
  useRef,
  useState,
  type FocusEventHandler,
  type KeyboardEventHandler,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { resolveComponentSize, useConfig } from './config-context'
import { CheckIcon } from './icons'
import { usePortalContainer } from './portal-context'
import { inputSizeStyles, inputStyles } from './tailwind-styles'

export type SelectOption = { value: string; label: string; disabled?: boolean }
export type SelectProps = {
  options: SelectOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  allowClear?: boolean
  label?: string
  placeholder?: string
  size?: 'default' | 'small' | 'large'
  disabled?: boolean
  required?: boolean
  name?: string
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-controls'?: string
  autoFocus?: boolean
  onBlur?: FocusEventHandler<HTMLButtonElement>
  onFocus?: FocusEventHandler<HTMLButtonElement>
  onKeyDown?: KeyboardEventHandler<HTMLButtonElement>
  onKeyUp?: KeyboardEventHandler<HTMLButtonElement>
  tabIndex?: number
  title?: string
  className?: string
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  function Select(allProps, ref) {
    const controlled = Object.prototype.hasOwnProperty.call(allProps, 'value')
    const {
      options,
      value,
      defaultValue,
      onValueChange,
      allowClear = false,
      label,
      placeholder = '请选择',
      size,
      disabled,
      required,
      name,
      id,
      className,
      ...ariaProps
    } = allProps
    const { componentSize, direction } = useConfig()
    const resolvedSize = resolveComponentSize(componentSize, size)
    const portalContainer = usePortalContainer()
    const triggerRef = useRef<HTMLButtonElement>(null)
    const [internalValue, setInternalValue] = useState(defaultValue ?? '')
    const currentValue = controlled ? (value ?? '') : internalValue

    function changeValue(next: string) {
      if (!controlled) setInternalValue(next)
      onValueChange?.(next)
    }

    return (
      <SelectPrimitive.Root
        dir={direction}
        value={currentValue}
        onValueChange={changeValue}
        disabled={disabled}
        required={required}
        name={name}
      >
        <span className="relative inline-flex w-full min-w-0">
          <SelectPrimitive.Trigger
            ref={(element) => {
              triggerRef.current = element
              if (typeof ref === 'function') ref(element)
              else if (ref) ref.current = element
            }}
            id={id}
            dir={direction}
            className={cn(
              inputStyles,
              inputSizeStyles[resolvedSize],
              'flex cursor-pointer touch-manipulation items-center justify-between gap-2 text-start outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 data-[placeholder]:text-muted-foreground data-[disabled]:cursor-not-allowed data-[disabled]:opacity-[0.55] aria-invalid:border-destructive',
              allowClear && currentValue && 'pe-12',
              className,
            )}
            {...ariaProps}
          >
            <SelectPrimitive.Value placeholder={placeholder} />
            <SelectPrimitive.Icon
              aria-hidden="true"
              className="size-5 shrink-0 [&_svg]:size-5"
            >
              <svg viewBox="0 0 20 20" fill="none">
                <path
                  d="m5 7.5 5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          {allowClear && currentValue && !disabled && (
            <button
              type="button"
              aria-label={`清空${label ?? ariaProps['aria-label'] ?? '选择'}`}
              className="absolute inset-y-0 end-0 z-10 flex min-h-11 w-11 touch-manipulation items-center justify-center rounded-[var(--ui-field-radius)] text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
              onClick={() => {
                changeValue('')
                requestAnimationFrame(() => triggerRef.current?.focus())
              }}
            >
              <span aria-hidden="true">×</span>
            </button>
          )}
        </span>
        <SelectPrimitive.Portal container={portalContainer}>
          <SelectPrimitive.Content
            data-select-content=""
            dir={direction}
            className="z-[70] max-h-[min(20rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[var(--radius-md)] border border-border bg-card text-card-foreground shadow-xl"
            position="popper"
            sideOffset={4}
            collisionPadding={8}
          >
            <SelectPrimitive.Viewport className="p-[var(--space-xs)]">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="relative flex min-h-11 touch-manipulation items-center rounded-[var(--radius-sm)] py-2.5 pe-8 ps-3 outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
                >
                  <SelectPrimitive.ItemText>
                    {option.label}
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator
                    aria-hidden="true"
                    className="absolute end-3"
                  >
                    <CheckIcon />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    )
  },
)
