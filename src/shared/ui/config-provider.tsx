import { useContext, useMemo } from 'react'
import { ConfigContext } from './config-context'
import type { ConfigProviderProps } from './config-context'
import { ThemeScope } from './theme-scope'
import type { ConfigContextValue } from './config-context'

/** Project boundary for Ant Design-style global component configuration. */
export function ConfigProvider({
  children,
  prefixCls,
  iconPrefixCls,
  componentSize,
  direction,
  locale,
  theme,
  getPopupContainer,
  className,
  style,
}: ConfigProviderProps) {
  const parent = useContext(ConfigContext)
  const value = useMemo<ConfigContextValue>(
    () => ({
      prefixCls: prefixCls ?? parent.prefixCls,
      iconPrefixCls: iconPrefixCls ?? parent.iconPrefixCls,
      componentSize: componentSize ?? parent.componentSize,
      direction: direction ?? parent.direction,
      locale: locale ?? parent.locale,
      theme: theme ?? parent.theme,
      getPopupContainer: getPopupContainer ?? parent.getPopupContainer,
    }),
    [
      componentSize,
      direction,
      getPopupContainer,
      iconPrefixCls,
      locale,
      parent,
      prefixCls,
      theme,
    ],
  )

  return (
    <ConfigContext.Provider value={value}>
      <ThemeScope
        mode={theme?.mode}
        density={theme?.density}
        tokens={theme?.tokens}
        dir={value.direction}
        data-ui-component-size={value.componentSize}
        className={className}
        style={style}
      >
        {children}
      </ThemeScope>
    </ConfigContext.Provider>
  )
}

export type {
  ConfigContextValue,
  ConfigProviderProps,
  ConfigProviderTheme,
} from './config-context'
