/** Dispatch a real input event so React and native form listeners see the cleared value. */
export function clearNativeInput(
  element: HTMLInputElement | HTMLTextAreaElement,
) {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(element, '')
  element.dispatchEvent(new Event('input', { bubbles: true }))
}
