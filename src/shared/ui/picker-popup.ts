import { useLayoutEffect, type RefObject } from 'react'

export type PickerPlacement =
  'bottomStart' | 'bottomEnd' | 'topStart' | 'topEnd'

/** Picker panels follow the visual viewport, including mobile keyboard resizing. */
export function usePickerPosition(
  anchorRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  open: boolean,
  placement: PickerPlacement,
  direction: 'ltr' | 'rtl',
) {
  useLayoutEffect(() => {
    const anchor = anchorRef.current
    const panel = panelRef.current
    if (!open || !anchor || !panel) return
    const update = () => {
      const view = window.visualViewport
      const left = (view?.offsetLeft ?? 0) + 8
      const top = (view?.offsetTop ?? 0) + 8
      const right = left + (view?.width ?? window.innerWidth) - 16
      const bottom = top + (view?.height ?? window.innerHeight) - 16
      const rect = anchor.getBoundingClientRect()
      if (
        rect.bottom < top - 8 ||
        rect.top > bottom + 8 ||
        rect.right < left - 8 ||
        rect.left > right + 8
      ) {
        panel.style.visibility = 'hidden'
        return
      }
      panel.style.maxWidth = Math.max(0, right - left) + 'px'
      panel.style.maxHeight = Math.max(0, bottom - top) + 'px'
      const bounds = panel.getBoundingClientRect()
      const above = rect.top - top - 4
      const below = bottom - rect.bottom - 4
      const preferredAbove = placement.startsWith('top')
      const placeAbove = preferredAbove
        ? above >= bounds.height || above >= below
        : below < bounds.height && above > below
      const alignLeft = placement.endsWith('Start') !== (direction === 'rtl')
      panel.style.left =
        Math.max(
          left,
          Math.min(
            alignLeft ? rect.left : rect.right - bounds.width,
            right - bounds.width,
          ),
        ) + 'px'
      panel.style.top =
        Math.max(
          top,
          Math.min(
            placeAbove ? rect.top - bounds.height - 4 : rect.bottom + 4,
            bottom - bounds.height,
          ),
        ) + 'px'
      panel.dataset.placement =
        (placeAbove ? 'top' : 'bottom') +
        (placement.endsWith('Start') ? 'Start' : 'End')
      panel.style.visibility = 'visible'
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)
    window.visualViewport?.addEventListener('resize', update)
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)
    observer?.observe(anchor)
    observer?.observe(panel)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
      window.visualViewport?.removeEventListener('resize', update)
      observer?.disconnect()
    }
  }, [anchorRef, panelRef, open, placement, direction])
}

export function pickerFocusable(container: HTMLElement) {
  return [
    ...container.querySelectorAll<HTMLElement>(
      'a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])',
    ),
  ].filter((element) => {
    const style = getComputedStyle(element)
    return (
      element.tabIndex >= 0 &&
      !element.closest('[hidden],[inert],[aria-hidden="true"]') &&
      style.display !== 'none' &&
      style.visibility !== 'hidden'
    )
  })
}

export function focusAfterPicker(field: HTMLElement, panel: HTMLElement) {
  const elements = pickerFocusable(field.ownerDocument.body)
  const index = elements.indexOf(field)
  const next = elements
    .slice(index + 1)
    .find((element) => !panel.contains(element))
  const target = next ?? field
  target.focus({ preventScroll: true })
}
