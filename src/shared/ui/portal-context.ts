import { createContext, useContext } from 'react'

/** A themed portal stays in the nearest ThemeScope's DOM subtree. */
export const PortalContainerContext = createContext<HTMLElement | null>(null)

export function usePortalContainer() {
  return useContext(PortalContainerContext) ?? undefined
}
