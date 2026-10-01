import { pickerFocusable, revealPickerTarget } from './picker-popup'

/** Focus the currently visible portion of a combined date/time panel. */
export function focusDateTimePanel(panel: HTMLElement | null) {
  const part = panel?.querySelector<HTMLElement>(
    '[data-datetime-part="' +
      (panel.dataset.datetimeActivePart ?? 'date') +
      '"]',
  )
  const target =
    part?.querySelector<HTMLElement>(
      '[data-calendar-date][tabindex="0"],[data-time-unit][tabindex="0"]',
    ) ?? (part ? pickerFocusable(part)[0] : undefined)
  if (target) revealPickerTarget(target)
  else
    panel
      ?.querySelector<HTMLElement>('button:not(:disabled)')
      ?.focus({ preventScroll: true })
}
