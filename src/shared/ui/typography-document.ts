import {
  Children,
  Fragment,
  cloneElement,
  createElement,
  isValidElement,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { typographyText } from './typography-ellipsis'

const tableStyles =
  'w-full border-collapse text-base leading-normal [:where(&)_caption]:mb-2 [:where(&)_caption]:text-start [:where(&)_caption]:font-semibold [:where(&)_th]:border [:where(&)_th]:border-border [:where(&)_th]:bg-muted [:where(&)_th]:px-3 [:where(&)_th]:py-2.5 [:where(&)_th]:text-start [:where(&)_th]:font-semibold [:where(&)_td]:border [:where(&)_td]:border-border [:where(&)_td]:px-3 [:where(&)_td]:py-2.5 [:where(&)_td]:align-top'

function scrollTable(event: KeyboardEvent<HTMLElement>) {
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

/** Wrap native tables without mounting a second tree or invoking custom React components. */
export function typographyDocument(
  node: ReactNode,
  label: string,
  classNames?: { table?: string; tableWrapper?: string },
): ReactNode {
  return Children.map(node, (child) => {
    if (
      !isValidElement<HTMLAttributes<HTMLElement>>(child) ||
      (typeof child.type !== 'string' && child.type !== Fragment)
    )
      return child
    const children = typographyDocument(child.props.children, label, classNames)
    if (child.type !== 'table')
      return children === child.props.children
        ? child
        : cloneElement(child, undefined, children)
    const caption = Children.toArray(child.props.children).find(
      (item) => isValidElement(item) && item.type === 'caption',
    )
    const captionText = typographyText(caption)
    return createElement(
      'span',
      {
        role: 'region',
        'aria-label': `${captionText || label}表格滚动区域`,
        tabIndex: 0,
        'data-typography-table-wrapper': '',
        onKeyDown: scrollTable,
        className: cn(
          'block min-w-0 max-w-full overflow-x-auto overscroll-x-contain rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [scrollbar-width:thin]',
          classNames?.tableWrapper,
        ),
      },
      cloneElement(
        child,
        {
          className: cn(tableStyles, classNames?.table, child.props.className),
        },
        children,
      ),
    )
  })
}

export function typographyHtmlText(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
