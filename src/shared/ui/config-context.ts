import { createContext, useContext } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { ThemeTokens } from './theme-scope'

export type ConfigProviderTheme = {
  mode?: 'auto' | 'light' | 'dark'
  density?: 'default' | 'compact'
  tokens?: ThemeTokens
}

export type ConfigProviderProps = {
  children: ReactNode
  prefixCls?: string
  iconPrefixCls?: string
  componentSize?: 'small' | 'middle' | 'large'
  direction?: 'ltr' | 'rtl'
  locale?: string
  theme?: ConfigProviderTheme
  getPopupContainer?: (trigger?: HTMLElement) => HTMLElement
  className?: string
  style?: CSSProperties
}

export type ControlSize = 'default' | 'small' | 'large'

export function resolveComponentSize(
  componentSize: ConfigProviderProps['componentSize'],
  explicit?: ControlSize,
): ControlSize {
  if (explicit) return explicit
  if (componentSize === 'small') return 'small'
  if (componentSize === 'large') return 'large'
  return 'default'
}

export type ConfigContextValue = {
  prefixCls: string
  iconPrefixCls: string
  componentSize: NonNullable<ConfigProviderProps['componentSize']>
  direction: NonNullable<ConfigProviderProps['direction']>
  locale?: string
  theme?: ConfigProviderTheme
  getPopupContainer: (trigger?: HTMLElement) => HTMLElement
}

const defaultPopupContainer = (trigger?: HTMLElement) =>
  trigger?.closest<HTMLElement>('[data-ui-scope]') ?? document.body

export const ConfigContext = createContext<ConfigContextValue>({
  prefixCls: 'ui',
  iconPrefixCls: 'uiicon',
  componentSize: 'middle',
  direction: 'ltr',
  getPopupContainer: defaultPopupContainer,
})

export function useConfig() {
  return useContext(ConfigContext)
}
