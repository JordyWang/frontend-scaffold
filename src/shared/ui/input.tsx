import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'
import { useConfig } from './config-context'
import { inputSizeStyles, inputStyles } from './tailwind-styles'

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  invalid?: boolean
  size?: 'default' | 'small' | 'large'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, size, type = 'text', ...props },
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
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(inputStyles, inputSizeStyles[resolvedSize], className)}
      {...props}
    />
  )
})
