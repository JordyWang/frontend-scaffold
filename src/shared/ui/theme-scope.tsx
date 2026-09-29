import { useState, type CSSProperties, type HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'
import { PortalContainerContext } from './portal-context'
import { derivePrimaryTokens, deriveStatusTokens } from './theme-colors'

export type ThemeTokens = {
  primary?: string
  onPrimary?: string
  onAccent?: string
  success?: string
  onSuccess?: string
  warning?: string
  onWarning?: string
  error?: string
  onError?: string
  radius?: string
  components?: {
    button?: { radius?: string; height?: string }
    field?: { radius?: string; height?: string }
    card?: { radius?: string }
    overlay?: { radius?: string }
    menu?: { radius?: string }
    segmented?: { radius?: string; height?: string }
    transfer?: { radius?: string; listHeight?: string }
  }
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
  const errorTokens = tokens?.error
    ? deriveStatusTokens(tokens.error, tokens.onError)
    : null
  const successTokens = tokens?.success
    ? deriveStatusTokens(tokens.success, tokens.onSuccess)
    : null
  const warningTokens = tokens?.warning
    ? deriveStatusTokens(tokens.warning, tokens.onWarning)
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
    ...(successTokens?.onStatus && {
      '--ui-map-success-text': successTokens.onStatus,
    }),
    ...(tokens?.warning && { '--ui-seed-warning': tokens.warning }),
    ...(warningTokens?.onStatus && {
      '--ui-map-warning-text': warningTokens.onStatus,
    }),
    ...(tokens?.error && { '--ui-seed-error': tokens.error }),
    ...(errorTokens?.onStatus && {
      '--ui-map-error-text': errorTokens.onStatus,
    }),
    ...(tokens?.error && { '--destructive': tokens.error }),
    ...(errorTokens?.onStatus && {
      '--ui-map-danger-text': errorTokens.onStatus,
    }),
    ...(tokens?.radius && { '--ui-seed-radius': tokens.radius }),
    ...(tokens?.components?.button?.radius && {
      '--ui-button-radius-override': tokens.components.button.radius,
    }),
    ...(tokens?.components?.button?.height && {
      '--ui-button-height-override': tokens.components.button.height,
    }),
    ...(tokens?.components?.field?.radius && {
      '--ui-field-radius-override': tokens.components.field.radius,
    }),
    ...(tokens?.components?.field?.height && {
      '--ui-field-height-override': tokens.components.field.height,
    }),
    ...(tokens?.components?.card?.radius && {
      '--ui-card-radius-override': tokens.components.card.radius,
    }),
    ...(tokens?.components?.overlay?.radius && {
      '--ui-overlay-radius-override': tokens.components.overlay.radius,
    }),
    ...(tokens?.components?.menu?.radius && {
      '--ui-menu-radius-override': tokens.components.menu.radius,
    }),
    ...(tokens?.components?.segmented?.radius && {
      '--ui-segmented-radius-override': tokens.components.segmented.radius,
    }),
    ...(tokens?.components?.segmented?.height && {
      '--ui-segmented-height-override': tokens.components.segmented.height,
    }),
    ...(tokens?.components?.transfer?.radius && {
      '--ui-transfer-radius-override': tokens.components.transfer.radius,
    }),
    ...(tokens?.components?.transfer?.listHeight && {
      '--ui-transfer-list-height-override':
        tokens.components.transfer.listHeight,
    }),
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
        className={cn(
          'ui-theme-scope bg-background text-foreground',
          className,
        )}
        style={{ ...tokenStyle, ...style }}
        {...props}
      />
    </PortalContainerContext.Provider>
  )
}
