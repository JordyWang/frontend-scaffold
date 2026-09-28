import { useState, type CSSProperties, type HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'
import { PortalContainerContext } from './portal-context'
import { derivePrimaryTokens } from './theme-colors'

export type ThemeTokens = {
  primary?: string
  onPrimary?: string
  onAccent?: string
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
  const primaryTokens = tokens?.primary
    ? derivePrimaryTokens(tokens.primary, tokens.onPrimary)
    : null
  const tokenStyle = {
    ...(tokens?.primary && { '--ui-seed-primary': tokens.primary }),
    ...((tokens?.onPrimary || primaryTokens?.onPrimary) && {
      '--ui-map-primary-text': tokens?.onPrimary ?? primaryTokens?.onPrimary,
    }),
    ...(primaryTokens?.hover && {
      '--ui-map-primary-hover': primaryTokens.hover,
    }),
    ...(primaryTokens?.active && {
      '--ui-map-primary-active': primaryTokens.active,
    }),
    ...((tokens?.onAccent || tokens?.primary) && {
      '--ui-map-accent-text': tokens?.onAccent ?? 'var(--foreground)',
    }),
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
        data-ui-status-success={tokens?.success ? '' : undefined}
        data-ui-status-warning={tokens?.warning ? '' : undefined}
        data-ui-status-error={tokens?.error ? '' : undefined}
        className={cn('ui-theme-scope', className)}
        style={{ ...tokenStyle, ...style }}
        {...props}
      />
    </PortalContainerContext.Provider>
  )
}
