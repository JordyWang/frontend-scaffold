import { createContext, useContext } from 'react'
import { useConfig } from './config-context'

/** A themed portal stays in the nearest ThemeScope's DOM subtree. */
export const PortalContainerContext = createContext<HTMLElement | null>(null)

export function usePortalContainer() {
  const scopedContainer = useContext(PortalContainerContext)
  const { getPopupContainer } = useConfig()

  // Portals can render during SSR, where no DOM container exists yet.
  if (typeof document === 'undefined') return undefined

  return (
    getPopupContainer(scopedContainer ?? undefined) ??
    scopedContainer ??
    document.body
  )
}
