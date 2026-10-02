import type { KeyboardEvent } from 'react'

/** Scroll a focused overflow region without taking keys from its child controls. */
export function scrollHorizontalRegion(event: KeyboardEvent<HTMLElement>) {
  if (
    event.target !== event.currentTarget ||
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  )
    return
  const element = event.currentTarget
  const max = element.scrollWidth - element.clientWidth
  if (max <= 1) return
  const rtl = getComputedStyle(element).direction === 'rtl'
  let position: number
  switch (event.key) {
    case 'ArrowLeft':
      position = element.scrollLeft - 44
      break
    case 'ArrowRight':
      position = element.scrollLeft + 44
      break
    case 'Home':
      position = 0
      break
    case 'End':
      position = rtl ? -max : max
      break
    default:
      return
  }
  event.preventDefault()
  element.scrollLeft = position
}
