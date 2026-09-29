import { useMemo } from 'react'
import { cn } from '@/shared/lib/utils'
import { useConfig } from './config-context'

export function getPrefixCls(
  suffix?: string,
  customizePrefixCls?: string,
  prefixCls = 'ui',
) {
  if (customizePrefixCls) return customizePrefixCls
  return suffix ? `${prefixCls}-${suffix}` : prefixCls
}

export function usePrefixCls(suffix?: string, customizePrefixCls?: string) {
  const { prefixCls } = useConfig()
  return useMemo(
    () => getPrefixCls(suffix, customizePrefixCls, prefixCls),
    [customizePrefixCls, prefixCls, suffix],
  )
}

export function warning(valid: boolean, message: string) {
  if (valid || typeof console === 'undefined') return
  if (import.meta.env?.DEV) console.warn(`[shared/ui] ${message}`)
}

export function cx(...values: Parameters<typeof cn>) {
  return cn(...values)
}

export const Util = {
  getPrefixCls,
  warning,
  cx,
}
