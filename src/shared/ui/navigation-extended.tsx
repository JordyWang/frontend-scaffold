import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { useConfig } from './config-context'
import { Portal } from './portal'

export type MenuItem = {
  key: string
  label: ReactNode
  icon?: ReactNode
  disabled?: boolean
  children?: MenuItem[]
}

export type MenuProps = {
  items: MenuItem[]
  selectedKeys?: string[]
  defaultSelectedKeys?: string[]
  expandedKeys?: string[]
  defaultExpandedKeys?: string[]
  mode?: 'vertical' | 'horizontal'
  label?: string
  onSelect?: (key: string) => void
  onExpand?: (keys: string[]) => void
  className?: string
}

function HorizontalMenuPopup({
  id,
  triggerId,
  direction,
  getTrigger,
  register,
  children,
}: {
  id: string
  triggerId: string
  direction: 'ltr' | 'rtl'
  getTrigger: () => HTMLButtonElement | null
  register: (element: HTMLUListElement | null) => void
  children: ReactNode
}) {
  const panelRef = useRef<HTMLUListElement | null>(null)

  useLayoutEffect(() => {
    const trigger = getTrigger()
    const panel = panelRef.current
    if (!trigger || !panel) return

    function updatePosition() {
      if (!trigger || !panel) return
      const triggerRect = trigger.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      if (
        triggerRect.bottom < 0 ||
        triggerRect.top > viewportHeight ||
        triggerRect.right < 0 ||
        triggerRect.left > viewportWidth
      ) {
        panel.style.visibility = 'hidden'
        return
      }
      panel.style.minWidth = `${Math.min(Math.max(triggerRect.width, 192), viewportWidth - 16)}px`
      const panelRect = panel.getBoundingClientRect()
      const preferredLeft =
        direction === 'rtl'
          ? triggerRect.right - panelRect.width
          : triggerRect.left
      const left = Math.max(
        8,
        Math.min(preferredLeft, viewportWidth - panelRect.width - 8),
      )
      const roomBelow = viewportHeight - triggerRect.bottom - 8
      const roomAbove = triggerRect.top - 8
      const preferredTop =
        roomBelow >= panelRect.height || roomBelow >= roomAbove
          ? triggerRect.bottom + 4
          : Math.max(8, triggerRect.top - panelRect.height - 4)
      const top = Math.max(
        8,
        Math.min(preferredTop, viewportHeight - panelRect.height - 8),
      )
      panel.style.left = `${left}px`
      panel.style.top = `${top}px`
      panel.style.visibility = 'visible'
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(updatePosition)
    observer?.observe(trigger)
    observer?.observe(panel)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
      observer?.disconnect()
    }
  }, [direction, getTrigger])

  return (
    <Portal>
      <ul
        id={id}
        role="menu"
        aria-labelledby={triggerId}
        dir={direction}
        ref={(element) => {
          panelRef.current = element
          register(element)
        }}
        className="invisible fixed z-[70] m-0 max-h-[min(22rem,calc(100dvh-1rem))] min-w-48 max-w-[calc(100vw-1rem)] list-none overflow-auto rounded-[var(--radius-md)] border border-border bg-card p-[var(--space-xs)] text-foreground shadow-[0_12px_30px_rgb(0_0_0_/_0.16)]"
      >
        {children}
      </ul>
    </Portal>
  )
}

/** A semantic menu with roving arrow-key focus and optional nested groups. */
export function Menu({
  items,
  selectedKeys,
  defaultSelectedKeys = [],
  expandedKeys,
  defaultExpandedKeys = [],
  mode = 'vertical',
  label = '主导航',
  onSelect,
  onExpand,
  className,
}: MenuProps) {
  const { direction } = useConfig()
  const [internalSelected, setInternalSelected] = useState(defaultSelectedKeys)
  const [internalExpanded, setInternalExpanded] =
    useState<string[]>(defaultExpandedKeys)
  const [focusedKey, setFocusedKey] = useState<string>()
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const popupRefs = useRef<Record<string, HTMLUListElement | null>>({})
  const menuRef = useRef<HTMLElement | null>(null)
  const focusWithinRef = useRef(false)
  const pendingChildFocus = useRef<string | null>(null)
  const menuId = useId()
  const selected = selectedKeys ?? internalSelected
  const expanded = expandedKeys ?? internalExpanded

  const isWithinMenu = useCallback((node: Node | null) => {
    if (!node) return false
    return Boolean(
      menuRef.current?.contains(node) ||
      Object.values(popupRefs.current).some((panel) => panel?.contains(node)),
    )
  }, [])

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node) || isWithinMenu(event.target)) return
      focusWithinRef.current = false
      if (mode === 'horizontal' && expanded.length) {
        if (expandedKeys === undefined) setInternalExpanded([])
        onExpand?.([])
      }
    }
    document.addEventListener('pointerdown', handlePointerDown, true)
    return () =>
      document.removeEventListener('pointerdown', handlePointerDown, true)
  }, [expanded.length, expandedKeys, isWithinMenu, mode, onExpand])

  const visibleItems = useMemo(() => {
    const result: Array<{ item: MenuItem; parentKey?: string }> = []
    function collect(current: MenuItem[], parentKey?: string) {
      for (const item of current) {
        result.push({ item, parentKey })
        if (
          !item.disabled &&
          item.children?.length &&
          expanded.includes(item.key)
        )
          collect(item.children, item.key)
      }
    }
    collect(items)
    return result
  }, [expanded, items])
  const tabbableKey =
    [focusedKey, ...selected].find((key) =>
      visibleItems.some(({ item }) => item.key === key && !item.disabled),
    ) ?? visibleItems.find(({ item }) => !item.disabled)?.item.key

  useLayoutEffect(() => {
    const parentKey = pendingChildFocus.current
    if (!parentKey) return
    const parent = itemRefs.current[parentKey]
    if (document.activeElement !== parent) {
      pendingChildFocus.current = null
      return
    }
    const child = visibleItems.find(
      ({ item, parentKey: candidateParent }) =>
        candidateParent === parentKey && !item.disabled,
    )
    if (!child) {
      if (expanded.includes(parentKey)) pendingChildFocus.current = null
      return
    }
    pendingChildFocus.current = null
    itemRefs.current[child.item.key]?.focus()
  }, [expanded, visibleItems])

  useLayoutEffect(() => {
    if (
      !focusedKey ||
      visibleItems.some(({ item }) => item.key === focusedKey && !item.disabled)
    )
      return

    function findAncestors(current: MenuItem[], ancestors: string[]): string[] {
      for (const item of current) {
        if (item.key === focusedKey) return ancestors
        const found = findAncestors(item.children ?? [], [
          ...ancestors,
          item.key,
        ])
        if (found.length) return found
      }
      return []
    }

    const ancestor = findAncestors(items, [])
      .reverse()
      .find((key) =>
        visibleItems.some(({ item }) => item.key === key && !item.disabled),
      )
    const fallback =
      ancestor ?? visibleItems.find(({ item }) => !item.disabled)?.item.key
    if (
      focusWithinRef.current &&
      fallback &&
      (document.activeElement === document.body ||
        isWithinMenu(document.activeElement))
    )
      itemRefs.current[fallback]?.focus()
  }, [focusedKey, isWithinMenu, items, visibleItems])

  function select(key: string, parentKey?: string) {
    if (selectedKeys === undefined) setInternalSelected([key])
    onSelect?.(key)
    if (mode === 'horizontal' && parentKey && expanded.length) {
      if (expandedKeys === undefined) setInternalExpanded([])
      onExpand?.([])
    }
  }

  function toggleExpanded(key: string) {
    const next = expanded.includes(key)
      ? expanded.filter((item) => item !== key)
      : [...expanded, key]
    if (expandedKeys === undefined) setInternalExpanded(next)
    onExpand?.(next)
  }

  function focusOffset(start: number, offset: -1 | 1) {
    for (
      let index = start + offset;
      index >= 0 && index < visibleItems.length;
      index += offset
    ) {
      const candidate = visibleItems[index].item
      if (!candidate.disabled) {
        itemRefs.current[candidate.key]?.focus()
        return
      }
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, key: string) {
    const index = visibleItems.findIndex(({ item }) => item.key === key)
    const current = visibleItems[index]
    if (!current || current.item.disabled) return
    const nextKey =
      mode === 'horizontal'
        ? direction === 'rtl'
          ? 'ArrowLeft'
          : 'ArrowRight'
        : 'ArrowDown'
    const previousKey =
      mode === 'horizontal'
        ? direction === 'rtl'
          ? 'ArrowRight'
          : 'ArrowLeft'
        : 'ArrowUp'
    const openKey = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
    const closeKey = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
    const handlesNestedOpen =
      event.key === openKey && current.item.children?.length
    const handlesNestedClose =
      event.key === closeKey &&
      (Boolean(current.parentKey) ||
        (Boolean(current.item.children?.length) && expanded.includes(key)))
    if (
      mode === 'horizontal' &&
      event.key === 'ArrowDown' &&
      current.item.children?.length
    ) {
      event.preventDefault()
      if (!expanded.includes(key)) {
        pendingChildFocus.current = key
        toggleExpanded(key)
      } else {
        const child = visibleItems.find(
          ({ item, parentKey }) => parentKey === key && !item.disabled,
        )
        itemRefs.current[child?.item.key ?? '']?.focus()
      }
    } else if (
      mode === 'horizontal' &&
      current.parentKey &&
      (event.key === 'ArrowDown' || event.key === 'ArrowUp')
    ) {
      event.preventDefault()
      const siblings = visibleItems.filter(
        ({ item, parentKey }) =>
          parentKey === current.parentKey && !item.disabled,
      )
      const position = siblings.findIndex(({ item }) => item.key === key)
      const offset = event.key === 'ArrowDown' ? 1 : -1
      const next = siblings[position + offset]
      itemRefs.current[next?.item.key ?? '']?.focus()
    } else if (event.key === 'Escape') {
      const parent = current.parentKey ?? (expanded.includes(key) ? key : null)
      if (parent) {
        event.preventDefault()
        toggleExpanded(parent)
        itemRefs.current[parent]?.focus()
      }
    } else if (event.key === nextKey && !handlesNestedOpen) {
      event.preventDefault()
      focusOffset(index, 1)
    } else if (event.key === previousKey && !handlesNestedClose) {
      event.preventDefault()
      focusOffset(index, -1)
    } else if (event.key === openKey && current.item.children?.length) {
      event.preventDefault()
      if (!expanded.includes(key)) toggleExpanded(key)
      else {
        const child = visibleItems.find(
          ({ item, parentKey }) => parentKey === key && !item.disabled,
        )
        itemRefs.current[child?.item.key ?? '']?.focus()
      }
    } else if (event.key === closeKey) {
      event.preventDefault()
      if (current.item.children?.length && expanded.includes(key))
        toggleExpanded(key)
      else itemRefs.current[current.parentKey ?? '']?.focus()
    } else if (event.key === 'Home') {
      event.preventDefault()
      itemRefs.current[
        visibleItems.find(({ item }) => !item.disabled)?.item.key ?? ''
      ]?.focus()
    } else if (event.key === 'End') {
      event.preventDefault()
      itemRefs.current[
        visibleItems.filter(({ item }) => !item.disabled).at(-1)?.item.key ?? ''
      ]?.focus()
    }
  }

  function renderItems(
    current: MenuItem[],
    level = 0,
    parentKey?: string,
  ): ReactNode {
    return current.map((item) => {
      const hasChildren = Boolean(item.children?.length)
      const isExpanded = !item.disabled && expanded.includes(item.key)
      const isSelected = selected.includes(item.key)
      const triggerId = `${menuId}-${encodeURIComponent(item.key)}-trigger`
      const submenuId = `${menuId}-${encodeURIComponent(item.key)}-submenu`
      return (
        <li key={item.key} role="none" className="relative min-w-0">
          <button
            ref={(element) => {
              itemRefs.current[item.key] = element
            }}
            type="button"
            id={triggerId}
            role="menuitem"
            aria-current={isSelected ? 'page' : undefined}
            aria-selected={isSelected}
            aria-disabled={item.disabled || undefined}
            aria-haspopup={hasChildren ? 'menu' : undefined}
            aria-expanded={hasChildren ? isExpanded : undefined}
            aria-controls={hasChildren && isExpanded ? submenuId : undefined}
            disabled={item.disabled}
            tabIndex={item.disabled || item.key !== tabbableKey ? -1 : 0}
            className={cn(
              'flex min-h-11 w-full touch-manipulation cursor-pointer items-center gap-[var(--space-sm)] rounded-[var(--ui-menu-radius)] border-0 bg-transparent px-3 py-2.5 text-start text-foreground outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50',
              isSelected && 'bg-accent text-accent-foreground',
              level > 0 && 'text-[0.9375rem]',
            )}
            onClick={() => {
              if (hasChildren) {
                toggleExpanded(item.key)
              }
              select(item.key, parentKey)
            }}
            onFocus={() => {
              focusWithinRef.current = true
              setFocusedKey(item.key)
            }}
            onKeyDown={(event) => handleKeyDown(event, item.key)}
          >
            {item.icon && <span aria-hidden="true">{item.icon}</span>}
            <span>{item.label}</span>
            {hasChildren && (
              <span
                className="ms-auto text-muted-foreground"
                aria-hidden="true"
              >
                {isExpanded ? '−' : '+'}
              </span>
            )}
          </button>
          {hasChildren && isExpanded && mode === 'horizontal' && level === 0 ? (
            <HorizontalMenuPopup
              id={submenuId}
              triggerId={triggerId}
              direction={direction}
              getTrigger={() => itemRefs.current[item.key]}
              register={(element) => {
                popupRefs.current[item.key] = element
              }}
            >
              {renderItems(item.children ?? [], level + 1, item.key)}
            </HorizontalMenuPopup>
          ) : hasChildren && isExpanded ? (
            <ul
              id={submenuId}
              role="menu"
              aria-labelledby={triggerId}
              className="m-0 list-none ps-[var(--space-md)]"
            >
              {renderItems(item.children ?? [], level + 1, item.key)}
            </ul>
          ) : null}
        </li>
      )
    })
  }

  return (
    <nav
      ref={(element) => {
        menuRef.current = element
      }}
      aria-label={label}
      className={cn('w-full', mode === 'vertical' && 'max-w-80', className)}
    >
      <ul
        role="menu"
        aria-orientation={mode}
        className={cn(
          'm-0 list-none p-0',
          mode === 'horizontal' && 'flex flex-wrap gap-[var(--space-sm)]',
        )}
      >
        {renderItems(items)}
      </ul>
    </nav>
  )
}

export type AnchorLink = { href: string; title: ReactNode }
export type AnchorProps = {
  links: AnchorLink[]
  activeHref?: string
  offsetTop?: number
  label?: string
  onChange?: (href: string) => void
  className?: string
}

export function Anchor({
  links,
  activeHref,
  offsetTop = 0,
  label = '页内导航',
  onChange,
  className,
}: AnchorProps) {
  const [internalActive, setInternalActive] = useState<string | undefined>(
    () => links[0]?.href,
  )
  const activeRef = useRef(internalActive)
  const effectiveActive =
    activeHref ??
    (links.some((link) => link.href === internalActive)
      ? internalActive
      : links[0]?.href)

  useEffect(() => {
    if (activeHref !== undefined) return

    function updateFromScroll() {
      const targets = links
        .filter((link) => link.href.startsWith('#') && link.href.length > 1)
        .map((link) => {
          let id: string
          try {
            id = decodeURIComponent(link.href.slice(1))
          } catch {
            return undefined
          }
          const element = document.getElementById(id)
          return element
            ? { href: link.href, top: element.getBoundingClientRect().top }
            : undefined
        })
        .filter((target): target is { href: string; top: number } =>
          Boolean(target),
        )
        .sort((a, b) => a.top - b.top)
      if (!targets.length) return

      const threshold = Math.max(0, offsetTop) + 1
      const next =
        targets.filter((target) => target.top <= threshold).at(-1)?.href ??
        targets[0].href
      if (next === activeRef.current) return
      activeRef.current = next
      setInternalActive(next)
      onChange?.(next)
    }

    updateFromScroll()
    window.addEventListener('scroll', updateFromScroll, { passive: true })
    document.addEventListener('scroll', updateFromScroll, {
      capture: true,
      passive: true,
    })
    window.addEventListener('resize', updateFromScroll)
    window.addEventListener('hashchange', updateFromScroll)
    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(updateFromScroll)
    if (observer)
      for (const link of links) {
        if (!link.href.startsWith('#') || link.href.length < 2) continue
        try {
          const target = document.getElementById(
            decodeURIComponent(link.href.slice(1)),
          )
          if (target) observer.observe(target)
        } catch {
          continue
        }
      }
    return () => {
      window.removeEventListener('scroll', updateFromScroll)
      document.removeEventListener('scroll', updateFromScroll, true)
      window.removeEventListener('resize', updateFromScroll)
      window.removeEventListener('hashchange', updateFromScroll)
      observer?.disconnect()
    }
  }, [activeHref, links, offsetTop, onChange])

  return (
    <nav
      aria-label={label}
      className={cn('grid gap-1 border-s border-border', className)}
    >
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          aria-current={effectiveActive === link.href ? 'location' : undefined}
          className="-ms-px flex min-h-11 touch-manipulation items-center border-s-2 border-transparent px-[var(--space-md)] py-2 text-muted-foreground no-underline outline-none hover:border-primary hover:text-foreground focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-[current=location]:border-primary aria-[current=location]:text-foreground"
          onClick={() => {
            if (activeHref === undefined) {
              activeRef.current = link.href
              setInternalActive(link.href)
            }
            onChange?.(link.href)
          }}
        >
          {link.title}
        </a>
      ))}
    </nav>
  )
}

export type AffixProps = {
  offsetTop?: number
  offsetBottom?: number
  target?: () => HTMLElement | Window | null
  onChange?: (affixed: boolean) => void
  children: ReactNode
  className?: string
}

function isWindowTarget(target: Window | HTMLElement): target is Window {
  return 'document' in target
}

type AffixViewport = {
  top: number
  right: number
  bottom: number
  left: number
}

function getAffixViewport(target: Window | HTMLElement): AffixViewport {
  if (isWindowTarget(target)) {
    return {
      top: 0,
      right: target.innerWidth,
      bottom: target.innerHeight,
      left: 0,
    }
  }
  const rect = target.getBoundingClientRect()
  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
  }
}

/** A scroll-aware sticky surface that keeps its layout space while affixed. */
export function Affix({
  offsetTop,
  offsetBottom,
  target,
  onChange,
  children,
  className,
}: AffixProps) {
  const holderRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [affixed, setAffixed] = useState(false)
  const affixedRef = useRef(false)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useLayoutEffect(() => {
    const holder = holderRef.current
    const content = contentRef.current
    const scrollTarget = target ? target() : window
    if (!holder || !content || !scrollTarget) return

    const resolvedOffsetTop =
      offsetTop === undefined && offsetBottom === undefined ? 0 : offsetTop
    const resolvedOffsetBottom = offsetBottom
    let frame = 0

    const update = () => {
      frame = 0
      const holderRect = holder.getBoundingClientRect()
      const contentRect = content.getBoundingClientRect()
      const height = Math.max(
        holder.offsetHeight,
        content.offsetHeight,
        contentRect.height,
      )
      const width = Math.max(contentRect.width, content.offsetWidth)
      const viewport = getAffixViewport(scrollTarget)
      const topBoundary = viewport.top + Math.max(0, resolvedOffsetTop ?? 0)
      const bottomBoundary =
        viewport.bottom - Math.max(0, resolvedOffsetBottom ?? 0)
      const shouldAffixTop =
        resolvedOffsetTop !== undefined &&
        holderRect.top <= topBoundary &&
        holderRect.bottom > topBoundary
      const shouldAffixBottom =
        resolvedOffsetBottom !== undefined &&
        holderRect.bottom >= bottomBoundary &&
        holderRect.top < bottomBoundary
      const nextAffixed = shouldAffixTop || shouldAffixBottom

      if (!nextAffixed) {
        holder.style.height = ''
        content.style.position = ''
        content.style.top = ''
        content.style.left = ''
        content.style.width = ''
        content.style.zIndex = ''
      } else {
        holder.style.height = `${height}px`
        const top = shouldAffixBottom ? bottomBoundary - height : topBoundary
        const maxWidth = Math.max(0, viewport.right - viewport.left)
        const fixedWidth = Math.min(width, maxWidth || width)
        const left = Math.min(
          Math.max(contentRect.left, viewport.left),
          Math.max(viewport.left, viewport.right - fixedWidth),
        )
        content.style.position = 'fixed'
        content.style.top = `${Math.max(viewport.top, top)}px`
        content.style.left = `${left}px`
        content.style.width = `${fixedWidth}px`
        content.style.zIndex = '20'
      }

      if (affixedRef.current === nextAffixed) return
      affixedRef.current = nextAffixed
      setAffixed(nextAffixed)
      onChangeRef.current?.(nextAffixed)
    }

    const scheduleUpdate = () => {
      if (!window.requestAnimationFrame) {
        update()
        return
      }
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }

    update()
    scrollTarget.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    if (!isWindowTarget(scrollTarget))
      window.addEventListener('scroll', scheduleUpdate, true)

    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(scheduleUpdate)
    observer?.observe(holder)
    observer?.observe(content)
    if (!isWindowTarget(scrollTarget)) observer?.observe(scrollTarget)

    return () => {
      scrollTarget.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      if (!isWindowTarget(scrollTarget))
        window.removeEventListener('scroll', scheduleUpdate, true)
      observer?.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
      holder.style.height = ''
      content.style.position = ''
      content.style.top = ''
      content.style.left = ''
      content.style.width = ''
      content.style.zIndex = ''
    }
  }, [offsetBottom, offsetTop, target])

  return (
    <div ref={holderRef} data-affix-holder data-affixed={affixed}>
      <div
        ref={contentRef}
        data-affix-content
        className={cn('touch-manipulation', className)}
      >
        {children}
      </div>
    </div>
  )
}
