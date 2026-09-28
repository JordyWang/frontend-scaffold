import * as SelectPrimitive from '@radix-ui/react-select'
import {
  forwardRef,
  type FocusEventHandler,
  type KeyboardEventHandler,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { CheckIcon } from './icons'
import { usePortalContainer } from './portal-context'

export type SelectOption = { value: string; label: string; disabled?: boolean }
export type SelectProps = {
  options: SelectOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  size?: 'default' | 'small'
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
  function Select(
    {
      options,
      value,
      defaultValue,
      onValueChange,
      placeholder = '请选择',
      size = 'default',
      disabled,
      required,
      name,
      id,
      className,
      ...ariaProps
    },
    ref,
  ) {
    const portalContainer = usePortalContainer()
    return (
      <SelectPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        required={required}
        name={name}
      >
        <SelectPrimitive.Trigger
          ref={ref}
          id={id}
          className={cn('ui-select', `ui-input--${size}`, className)}
          {...ariaProps}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon aria-hidden="true" className="ui-select__icon">
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
        <SelectPrimitive.Portal container={portalContainer}>
          <SelectPrimitive.Content
            className="ui-select__content"
            position="popper"
            sideOffset={4}
            collisionPadding={8}
          >
            <SelectPrimitive.Viewport className="ui-select__viewport">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="ui-select__item"
                >
                  <SelectPrimitive.ItemText>
                    {option.label}
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator
                    aria-hidden="true"
                    className="ui-select__check"
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
