import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'
import { useConfig } from './config-context'
import { inputSizeStyles, inputStyles } from './tailwind-styles'

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean
  size?: 'default' | 'small' | 'large'
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalid, size, ...props }, ref) {
    const { componentSize } = useConfig()
    const resolvedSize =
      size ??
      (componentSize === 'small'
        ? 'small'
        : componentSize === 'large'
          ? 'large'
          : 'default')
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          'ui-input ui-textarea',
          inputStyles,
          inputSizeStyles[resolvedSize],
          'min-h-28 resize-y',
          className,
        )}
        {...props}
      />
    )
  },
)
