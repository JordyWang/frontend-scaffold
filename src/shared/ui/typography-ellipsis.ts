import {
  Children,
  isValidElement,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'

export function typographyText(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number')
        return String(child)
      if (!isValidElement<{ children?: ReactNode }>(child)) return ''
      return child.type === 'br' ? '\n' : typographyText(child.props.children)
    })
    .join('')
}

export function typographyRows(value: number | undefined, fallback = 1) {
  return value !== undefined && Number.isFinite(value)
    ? Math.max(1, Math.floor(value))
    : fallback
}

/** Measure the same DOM without mounting a second React tree or exposing duplicate controls. */
export function useTypographyOverflow(
  content: RefObject<HTMLElement | null>,
  enabled: boolean,
  rows: number,
  source: unknown,
  onEllipsis?: (overflow: boolean) => void,
) {
  const [overflow, setOverflow] = useState(false)
  const callback = useRef(onEllipsis)
  const reported = useRef<boolean | null>(null)
  useLayoutEffect(() => {
    callback.current = onEllipsis
  }, [onEllipsis])
  useLayoutEffect(() => {
    if (!enabled || !content.current) {
      if (reported.current === true) callback.current?.(false)
      reported.current = false
      return
    }
    const element = content.current
    let disposed = false
    const measure = () => {
      if (disposed || !element.isConnected) return
      const width = element.getBoundingClientRect().width
      if (!width) return
      const probe = element.cloneNode(true) as HTMLElement
      probe.removeAttribute('id')
      probe.setAttribute('aria-hidden', 'true')
      probe.setAttribute('inert', '')
      for (const child of probe.querySelectorAll('[id],[name]')) {
        child.removeAttribute('id')
        child.removeAttribute('name')
      }
      Object.assign(probe.style, {
        position: 'absolute',
        visibility: 'hidden',
        pointerEvents: 'none',
        width: `${width}px`,
        maxWidth: 'none',
        height: 'auto',
        maxHeight: 'none',
        display: '-webkit-box',
        webkitBoxOrient: 'vertical',
        webkitLineClamp: String(rows),
        overflow: 'hidden',
      })
      element.parentElement?.append(probe)
      const next = probe.scrollHeight > probe.clientHeight + 1
      probe.remove()
      setOverflow(next)
      if (reported.current !== next) {
        reported.current = next
        callback.current?.(next)
      }
    }
    measure()
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(element)
    // A rich child can change its own text while the clamped box stays the same size.
    const mutations =
      typeof MutationObserver === 'undefined'
        ? null
        : new MutationObserver(measure)
    mutations?.observe(element, {
      subtree: true,
      characterData: true,
      childList: true,
      attributes: true,
    })
    const root = element.closest('[data-typography]')
    if (root) mutations?.observe(root, { attributes: true })
    window.addEventListener('resize', measure)
    document.fonts?.addEventListener?.('loadingdone', measure)
    void document.fonts?.ready.then(measure)
    return () => {
      disposed = true
      observer?.disconnect()
      mutations?.disconnect()
      window.removeEventListener('resize', measure)
      document.fonts?.removeEventListener?.('loadingdone', measure)
    }
  }, [content, enabled, rows, source])
  return enabled && overflow
}
