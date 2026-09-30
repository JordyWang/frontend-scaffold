import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import {
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
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        data-ui-button=""
        data-ui-size={resolvedSize}
        data-ui-variant={variant}
        className={cn(
          buttonStyles,
          buttonVariantStyles[danger ? 'destructive' : variant],
          buttonSizeStyles[resolvedSize],
          buttonShapeStyles[shape],
          block && 'w-full',
          className,
        )}
        {...props}
      >
        {iconPosition === 'start' && icon}
        {loading && <span className={spinnerStyles} aria-hidden="true" />}
        {children}
        {iconPosition === 'end' && icon}
      </button>
    )
  },
)
