import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'
import { inputSizeStyles, inputStyles } from './tailwind-styles'

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  invalid?: boolean
  size?: 'default' | 'small'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, size = 'default', type = 'text', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn('ui-input', inputStyles, inputSizeStyles[size], className)}
      {...props}
    />
  )
})
