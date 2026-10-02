export type TypographyCopyFormat = 'text/plain' | 'text/html'

/** Clipboard API first; legacy plain-text copying preserves focus and selection. */
export async function writeTypographyClipboard(
  text: string,
  format: TypographyCopyFormat,
) {
  if (format === 'text/html') {
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined')
      throw new Error('当前浏览器不支持复制 HTML')
    await navigator.clipboard.write([
      new ClipboardItem({ 'text/html': new Blob([text], { type: format }) }),
    ])
    return
  }
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  if (!document.execCommand) throw new Error('当前浏览器不支持复制')
  const active = document.activeElement as HTMLElement | null
  const inputSelection =
    active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement
      ? ([
          active.selectionStart,
          active.selectionEnd,
          active.selectionDirection,
        ] as const)
      : null
  const selection = document.getSelection()
  const ranges = selection
    ? Array.from({ length: selection.rangeCount }, (_, index) =>
        selection.getRangeAt(index).cloneRange(),
      )
    : []
  const field = document.createElement('textarea')
  field.value = text
  field.setAttribute('aria-hidden', 'true')
  field.tabIndex = -1
  Object.assign(field.style, { position: 'fixed', opacity: '0', top: '0' })
  document.body.append(field)
  try {
    field.select()
    if (!document.execCommand('copy')) throw new Error('复制失败')
  } finally {
    field.remove()
    if (active?.isConnected) {
      active.focus({ preventScroll: true })
      if (
        inputSelection &&
        inputSelection[0] !== null &&
        inputSelection[1] !== null
      )
        (active as HTMLInputElement | HTMLTextAreaElement).setSelectionRange(
          inputSelection[0],
          inputSelection[1],
          inputSelection[2] ?? undefined,
        )
    }
    selection?.removeAllRanges()
    for (const range of ranges) selection?.addRange(range)
  }
}
