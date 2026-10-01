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
      const bounds = panel.getBoundingClientRect()
      // Measuring overflow avoids expanding the panel and clamping its scrollTop.
      const naturalHeight =
        panel.scrollHeight + bounds.height - panel.clientHeight
      const above = rect.top - top - 4
      const below = bottom - rect.bottom - 4
      const preferredAbove = placement.startsWith('top')
      const placeAbove = preferredAbove
        ? above >= naturalHeight || above >= below
        : below < naturalHeight && above > below
      const alignLeft = placement.endsWith('Start') !== (direction === 'rtl')
      // Keep the anchor reachable; taller calendars scroll inside the panel.
      panel.style.maxHeight =
        Math.max(44, Math.min(bottom - top, placeAbove ? above : below)) + 'px'
      const fitted = panel.getBoundingClientRect()
      panel.style.left =
        Math.max(
          left,
          Math.min(
            alignLeft ? rect.left : rect.right - fitted.width,
            right - fitted.width,
          ),
        ) + 'px'
      panel.style.top =
        Math.max(
          top,
          Math.min(
            placeAbove ? rect.top - fitted.height - 4 : rect.bottom + 4,
            bottom - fitted.height,
          ),
        ) + 'px'
      panel.dataset.placement =
        (placeAbove ? 'top' : 'bottom') +
        (placement.endsWith('Start') ? 'Start' : 'End')
      panel.style.visibility = 'visible'
    }
    const onScroll = (event: Event) => {
      // Scrolling dates inside the panel does not move the field anchor.
      if (event.target instanceof Node && panel.contains(event.target)) return
      update()
    }
    update()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)
    window.visualViewport?.addEventListener('resize', update)
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)
    observer?.observe(anchor)
    observer?.observe(panel)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
      window.visualViewport?.removeEventListener('resize', update)
      observer?.disconnect()
    }
  }, [anchorRef, panelRef, open, placement, direction])
}

/** Reveal a focused date within picker scrollers without moving the page. */
export function revealPickerTarget(target: HTMLElement) {
  target.focus({ preventScroll: true })
  let parent = target.parentElement
  while (parent) {
    if (
      parent.hasAttribute('data-picker-scroll') ||
      parent.hasAttribute('data-calendar-scroll')
    ) {
      const box = parent.getBoundingClientRect(),
        bounds = target.getBoundingClientRect()
      if (bounds.top < box.top) parent.scrollTop -= box.top - bounds.top
      else if (bounds.bottom > box.bottom)
        parent.scrollTop += bounds.bottom - box.bottom
      if (bounds.left < box.left) parent.scrollLeft -= box.left - bounds.left
      else if (bounds.right > box.right)
        parent.scrollLeft += bounds.right - box.right
    }
    parent = parent.parentElement
  }
}

export function pickerFocusable(container: HTMLElement) {
  return [
    ...container.querySelectorAll<HTMLElement>(
      'a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])',
    ),
  ].filter((element) => {
    let parent: HTMLElement | null = element
    while (parent) {
      const style = getComputedStyle(parent)
      if (style.display === 'none' || style.visibility === 'hidden')
        return false
      parent = parent.parentElement
    }
    return (
      element.tabIndex >= 0 &&
      !element.closest('[hidden],[inert],[aria-hidden="true"]')
    )
  })
}

export function focusAfterPicker(
  field: HTMLElement,
  panel: HTMLElement,
  skip?: (element: HTMLElement) => boolean,
) {
  const elements = pickerFocusable(field.ownerDocument.body)
  const next = elements.find(
    (element) =>
      Boolean(
        field.compareDocumentPosition(element) &
        Node.DOCUMENT_POSITION_FOLLOWING,
      ) &&
      !panel.contains(element) &&
      !skip?.(element),
  )
  const target = next ?? field
  target.focus({ preventScroll: true })
}
