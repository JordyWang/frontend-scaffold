import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'
import { inputSizeStyles, inputStyles } from './tailwind-styles'

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean
  size?: 'default' | 'small'
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalid, size = 'default', ...props }, ref) {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          'ui-input ui-textarea',
          inputStyles,
          inputSizeStyles[size],
          'min-h-28 resize-y',
          className,
        )}
        {...props}
      />
    )
  },
)
