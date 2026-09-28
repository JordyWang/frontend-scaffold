import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

export type ThemeScopeProps = HTMLAttributes<HTMLDivElement> & {
  mode?: 'auto' | 'light' | 'dark'
  density?: 'default' | 'compact'
}

/** CSS tokens inherit, so a scope can theme one section without changing the app. */
export function ThemeScope({
  mode = 'auto',
  density = 'default',
  className,
  ...props
}: ThemeScopeProps) {
  return (
    <div
      data-ui-theme={mode === 'auto' ? undefined : mode}
      data-ui-density={density}
      className={cn('ui-theme-scope', className)}
      {...props}
    />
  )
}
