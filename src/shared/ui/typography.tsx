import { createElement, type HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

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
      'ui-typography',
      `ui-typography--${variant}`,
      `ui-typography--${tone}`,
      className,
    ),
    ...props,
  })
}
