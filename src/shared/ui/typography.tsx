import { createElement, type HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

const variantStyles = {
  body: '',
  caption: 'text-sm',
  title: 'text-lg font-semibold leading-[1.35]',
  heading: 'text-[clamp(1.5rem,2vw,2rem)] font-bold leading-tight',
} as const

const toneStyles = {
  default: '',
  muted: 'text-muted-foreground',
  danger: 'text-destructive',
} as const

export type TypographyProps = HTMLAttributes<HTMLElement> & {
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4'
  variant?: 'body' | 'caption' | 'title' | 'heading'
  tone?: 'default' | 'muted' | 'danger'
}

export function Typography({
  as = 'p',
  variant = 'body',
  tone = 'default',
  className,
  ...props
}: TypographyProps) {
  return createElement(as, {
    className: cn(
      'm-0 leading-normal',
      variantStyles[variant],
      toneStyles[tone],
      className,
    ),
    ...props,
  })
}
