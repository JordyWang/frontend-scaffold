import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import {
  buttonDangerStyles,
  buttonShapeStyles,
  buttonSizeStyles,
  buttonStyles,
  buttonVariantStyles,
} from './button-styles'
import { useConfig } from './config-context'
import { spinnerStyles } from './tailwind-styles'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'small' | 'large' | 'icon'
  loading?: boolean
  danger?: boolean
  block?: boolean
  shape?: keyof typeof buttonShapeStyles
  icon?: ReactNode
  iconPosition?: 'start' | 'end'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = 'primary',
      size,
      loading = false,
      danger = false,
      block = false,
      shape = 'default',
      icon,
      iconPosition = 'start',
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) {
    const { componentSize } = useConfig()
    const resolvedSize =
      size ??
      (componentSize === 'small'
        ? 'small'
        : componentSize === 'large'
          ? 'large'
          : 'default')
    const visualVariant = danger
      ? buttonDangerStyles[variant]
      : buttonVariantStyles[variant]
    const leadingIndicator = loading ? (
      <span className={spinnerStyles} aria-hidden="true" />
    ) : (
      icon
    )
    return (
      <button
        {...props}
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading ? true : props['aria-busy']}
        data-ui-button=""
        data-ui-size={resolvedSize}
        data-ui-variant={variant}
        data-ui-danger={danger || undefined}
        className={cn(
          buttonStyles,
          visualVariant,
          buttonSizeStyles[resolvedSize],
          buttonShapeStyles[shape],
          block && 'w-full',
          className,
        )}
      >
        {iconPosition === 'start' && leadingIndicator}
        {children}
        {iconPosition === 'end' && leadingIndicator}
      </button>
    )
  },
)
