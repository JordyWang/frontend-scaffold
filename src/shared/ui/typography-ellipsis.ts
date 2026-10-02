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
  const [layout, setLayout] = useState({
    overflow: false,
    tailHeight: 0,
  })
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
      const styles = getComputedStyle(element)
      const lineHeight =
        parseFloat(styles.lineHeight) ||
        (parseFloat(styles.fontSize) || 16) * 1.5
      const paddingFields = [
        'paddingTop',
        'paddingBottom',
        'borderTopWidth',
        'borderBottomWidth',
      ] as const
      const blockPadding = paddingFields.reduce(
        (sum, property) => sum + (parseFloat(styles[property]) || 0),
        0,
      )
      const probe = element.cloneNode(true) as HTMLElement
      probe.removeAttribute('id')
      probe.setAttribute('aria-hidden', 'true')
      probe.setAttribute('inert', '')
      for (const child of probe.querySelectorAll('[id],[name]')) {
        child.removeAttribute('id')
        child.removeAttribute('name')
      }
      for (const decoration of probe.querySelectorAll<HTMLElement>(
        '[data-typography-tail],[data-typography-tail-spacer]',
      ))
        decoration.style.display = 'none'
      const suffix = probe.querySelector<HTMLElement>(
        '[data-typography-suffix-source]',
      )
      if (suffix) {
        suffix.classList.remove('sr-only')
        Object.assign(suffix.style, {
          display: 'inline',
          position: 'static',
          width: 'auto',
          height: 'auto',
          margin: '0',
          clip: 'auto',
          overflow: 'visible',
          whiteSpace: 'pre-wrap',
        })
      }
      const flow = probe.querySelector<HTMLElement>('[data-typography-layout]')
      if (flow)
        Object.assign(flow.style, {
          display: 'block',
          maxHeight: 'none',
          webkitLineClamp: 'unset',
          overflow: 'visible',
        })
      Object.assign(probe.style, {
        position: 'absolute',
        visibility: 'hidden',
        pointerEvents: 'none',
        width: `${width}px`,
        maxWidth: 'none',
        height: 'auto',
        maxHeight: `${rows * lineHeight + blockPadding}px`,
        display: 'block',
        webkitLineClamp: 'unset',
        overflow: 'hidden',
      })
      element.parentElement?.append(probe)
      const next = probe.scrollHeight > probe.clientHeight + 1
      probe.remove()
      const tailHeight =
        element
          .querySelector<HTMLElement>('[data-typography-tail]')
          ?.getBoundingClientRect().height ?? 0
      setLayout((previous) =>
        previous.overflow === next && previous.tailHeight === tailHeight
          ? previous
          : { overflow: next, tailHeight },
      )
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
  return {
    overflow: enabled && layout.overflow,
    tailHeight: layout.tailHeight,
  }
}
