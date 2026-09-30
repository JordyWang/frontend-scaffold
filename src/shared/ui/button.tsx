import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { useConfig } from './config-context'
import { spinnerStyles } from './tailwind-styles'

const buttonStyles =
  'inline-flex min-h-[max(44px,var(--ui-button-height))] min-w-11 touch-manipulation cursor-pointer items-center justify-center gap-[var(--space-sm)] rounded-[var(--ui-button-radius)] border border-transparent px-4 py-2.5 font-semibold leading-tight transition-[background-color,border-color,opacity] duration-180 ease-in-out enabled:hover:opacity-90 enabled:active:opacity-80 disabled:cursor-not-allowed disabled:opacity-[0.55]'

const variantStyles = {
  primary:
    'bg-primary text-primary-foreground enabled:hover:bg-[var(--ui-map-primary-hover)] enabled:hover:opacity-100 enabled:active:bg-[var(--ui-map-primary-active)] enabled:active:opacity-100',
  secondary: 'bg-secondary text-secondary-foreground',
  outline: 'border-border bg-card text-card-foreground',
  ghost: 'bg-transparent text-foreground',
  destructive: 'bg-destructive text-[var(--ui-map-danger-text)]',
} as const

const sizeStyles = {
  default: '',
  small: 'px-3',
  large: 'min-h-12 px-5 py-3',
  icon: 'w-11 p-0 text-2xl font-normal',
} as const

const shapeStyles = {
  default: '',
  round: 'rounded-full',
  circle: 'rounded-full p-0',
} as const

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'small' | 'large' | 'icon'
  loading?: boolean
  danger?: boolean
  block?: boolean
  shape?: keyof typeof shapeStyles
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
          variantStyles[danger ? 'destructive' : variant],
          sizeStyles[resolvedSize],
          shapeStyles[shape],
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
