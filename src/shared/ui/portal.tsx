import { type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { usePortalContainer } from './portal-context'

export function Portal({
  children,
  container,
}: {
  children: ReactNode
  container?: Element | DocumentFragment
}) {
  const scopedContainer = usePortalContainer()
  if (typeof document === 'undefined') return null
  return createPortal(children, container ?? scopedContainer ?? document.body)
}
