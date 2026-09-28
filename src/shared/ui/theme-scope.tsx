import { useState, type CSSProperties, type HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'
import { PortalContainerContext } from './portal-context'

export type ThemeTokens = {
  primary?: string
  onPrimary?: string
  success?: string
  warning?: string
  error?: string
  radius?: string
}

export type ThemeScopeProps = HTMLAttributes<HTMLDivElement> & {
  mode?: 'auto' | 'light' | 'dark'
  density?: 'default' | 'compact'
  tokens?: ThemeTokens
}

/** CSS tokens inherit, so a scope can theme one section without changing the app. */
export function ThemeScope({
  mode = 'auto',
  density = 'default',
  tokens,
  className,
  style,
  ...props
}: ThemeScopeProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const tokenStyle = {
    ...(tokens?.primary && { '--ui-seed-primary': tokens.primary }),
    ...(tokens?.onPrimary && { '--ui-map-primary-text': tokens.onPrimary }),
    ...(tokens?.success && { '--ui-seed-success': tokens.success }),
    ...(tokens?.warning && { '--ui-seed-warning': tokens.warning }),
    ...(tokens?.error && { '--ui-seed-error': tokens.error }),
    ...(tokens?.radius && { '--ui-seed-radius': tokens.radius }),
  } as CSSProperties
  return (
    <PortalContainerContext.Provider value={container}>
      <div
        ref={setContainer}
        data-ui-theme={mode === 'auto' ? undefined : mode}
        data-ui-density={density}
        className={cn('ui-theme-scope', className)}
        style={{ ...tokenStyle, ...style }}
        {...props}
      />
    </PortalContainerContext.Provider>
  )
}
