import { type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export function Portal({
  children,
  container,
}: {
  children: ReactNode
  container?: Element | DocumentFragment
}) {
  if (typeof document === 'undefined') return null
  return createPortal(children, container ?? document.body)
}
