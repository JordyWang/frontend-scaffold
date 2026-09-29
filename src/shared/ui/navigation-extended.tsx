import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
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
        if (item.children?.length && expanded.includes(item.key))
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

  function select(key: string) {
    if (selectedKeys === undefined) setInternalSelected([key])
    onSelect?.(key)
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
    if (event.key === 'Escape') {
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

  function renderItems(current: MenuItem[], level = 0): ReactNode {
    return current.map((item) => {
      const hasChildren = Boolean(item.children?.length)
      const isExpanded = expanded.includes(item.key)
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
              select(item.key)
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
              {renderItems(item.children ?? [], level + 1)}
            </HorizontalMenuPopup>
          ) : hasChildren && isExpanded ? (
            <ul
              id={submenuId}
              role="menu"
              aria-labelledby={triggerId}
              className="m-0 list-none ps-[var(--space-md)]"
            >
              {renderItems(item.children ?? [], level + 1)}
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
    window.addEventListener('resize', updateFromScroll)
    window.addEventListener('hashchange', updateFromScroll)
    return () => {
      window.removeEventListener('scroll', updateFromScroll)
      window.removeEventListener('resize', updateFromScroll)
      window.removeEventListener('hashchange', updateFromScroll)
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
  children: ReactNode
  className?: string
}

export function Affix({ offsetTop = 0, children, className }: AffixProps) {
  return (
    <div
      className={cn('sticky z-20 top-[var(--ui-affix-offset)]', className)}
      style={{ '--ui-affix-offset': `${offsetTop}px` } as CSSProperties}
    >
      {children}
    </div>
  )
}

export type CarouselProps = {
  items: ReactNode[]
  index?: number
  defaultIndex?: number
  autoplay?: boolean
  interval?: number
  label?: string
  onChange?: (index: number) => void
  className?: string
}

export function Carousel({
  items,
  index,
  defaultIndex = 0,
  autoplay = false,
  interval = 4000,
  label = '轮播内容',
  onChange,
  className,
}: CarouselProps) {
  const [internalIndex, setInternalIndex] = useState(defaultIndex)
  const [rotationPaused, setRotationPaused] = useState(false)
  const [manualRotation, setManualRotation] = useState(false)
  const rotationWasRunningRef = useRef(false)
  const rotationPointerRef = useRef(false)
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches),
  )
  const current = Math.max(
    0,
    Math.min(index ?? internalIndex, Math.max(items.length - 1, 0)),
  )
  const setIndex = useCallback(
    (next: number) => {
      const normalized = items.length ? (next + items.length) % items.length : 0
      if (index === undefined) setInternalIndex(normalized)
      onChange?.(normalized)
    },
    [index, items.length, onChange],
  )
  const rotating =
    autoplay &&
    items.length > 1 &&
    !rotationPaused &&
    (!reducedMotion || manualRotation)

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!media) return
    const update = () => setReducedMotion(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!rotating) return
    const timer = window.setInterval(() => setIndex(current + 1), interval)
    return () => window.clearInterval(timer)
  }, [current, interval, rotating, setIndex])

  function pauseRotation() {
    if (autoplay && !rotationPaused) setRotationPaused(true)
  }

  function moveTo(next: number) {
    pauseRotation()
    setIndex(next)
  }

  return (
    <section
      aria-label={label}
      aria-roledescription="carousel"
      className={cn(
        'overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card',
        className,
      )}
      onMouseEnter={pauseRotation}
      onFocusCapture={pauseRotation}
      onTouchStart={(event) => {
        if (
          event.target instanceof Element &&
          !event.target.closest('[data-carousel-rotation]')
        )
          pauseRotation()
      }}
    >
      <div className="min-h-28">
        {items.map((item, itemIndex) => (
          <div
            key={itemIndex}
            role="group"
            aria-roledescription="slide"
            aria-label={`${itemIndex + 1} / ${items.length}`}
            hidden={itemIndex !== current}
            className="min-h-28 p-[var(--space-lg)]"
          >
            {item}
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-[var(--space-sm)] border-t border-border px-[var(--space-md)] py-[var(--space-sm)]">
          {autoplay && (
            <button
              type="button"
              data-carousel-rotation=""
              className="min-h-11 touch-manipulation cursor-pointer rounded-[var(--radius-sm)] border border-border bg-card px-3 py-2 text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              onPointerDown={() => {
                rotationWasRunningRef.current = rotating
                rotationPointerRef.current = true
              }}
              onFocus={() => {
                if (!rotationPointerRef.current)
                  rotationWasRunningRef.current = rotating
                pauseRotation()
              }}
              onClick={() => {
                const wasRunning = rotationPointerRef.current
                  ? rotationWasRunningRef.current
                  : rotating
                if (wasRunning) setRotationPaused(true)
                else {
                  setManualRotation(true)
                  setRotationPaused(false)
                }
                rotationWasRunningRef.current = false
                rotationPointerRef.current = false
              }}
            >
              {rotating ? '停止自动播放' : '开始自动播放'}
            </button>
          )}
          <button
            type="button"
            className="min-h-11 touch-manipulation cursor-pointer rounded-[var(--radius-sm)] border border-border bg-card px-3 py-2 text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            onClick={() => moveTo(current - 1)}
          >
            上一项
          </button>
          <span
            data-carousel-status=""
            className="text-sm text-muted-foreground"
            aria-live={rotating ? 'off' : 'polite'}
          >
            {current + 1} / {items.length}
          </span>
          <button
            type="button"
            className="min-h-11 touch-manipulation cursor-pointer rounded-[var(--radius-sm)] border border-border bg-card px-3 py-2 text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            onClick={() => moveTo(current + 1)}
          >
            下一项
          </button>
        </div>
      )}
    </section>
  )
}

export type TreeNode = {
  key: string
  title: ReactNode
  children?: TreeNode[]
  disabled?: boolean
}
export type TreeProps = {
  treeData: TreeNode[]
  expandedKeys?: string[]
  defaultExpandedKeys?: string[]
  onExpand?: (keys: string[]) => void
  selectedKey?: string
  defaultSelectedKey?: string
  onSelect?: (key: string) => void
  label?: string
  className?: string
}

export function Tree({
  treeData,
  expandedKeys,
  defaultExpandedKeys = [],
  onExpand,
  selectedKey,
  defaultSelectedKey,
  onSelect,
  label = '树形导航',
  className,
}: TreeProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpandedKeys)
  const [internalSelected, setInternalSelected] = useState<string | undefined>(
    defaultSelectedKey,
  )
  const [focusedKey, setFocusedKey] = useState<string>()
  const expanded = expandedKeys ?? internalExpanded
  const selected = selectedKey ?? internalSelected
  const id = useId()
  const treeRef = useRef<HTMLDivElement>(null)
  const focusWithinRef = useRef(false)
  const nodeRefs = useRef<Record<string, HTMLLIElement | null>>({})

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !treeRef.current?.contains(event.target)
      )
        focusWithinRef.current = false
    }
    document.addEventListener('pointerdown', handlePointerDown, true)
    return () =>
      document.removeEventListener('pointerdown', handlePointerDown, true)
  }, [])

  const visibleNodes = useMemo(() => {
    const nodes: Array<{
      key: string
      parentKey?: string
      hasChildren: boolean
      disabled: boolean
    }> = []
    function collect(current: TreeNode[], parentKey?: string) {
      for (const node of current) {
        const hasChildren = Boolean(node.children?.length)
        nodes.push({
          key: node.key,
          parentKey,
          hasChildren,
          disabled: Boolean(node.disabled),
        })
        if (hasChildren && expanded.includes(node.key))
          collect(node.children ?? [], node.key)
      }
    }
    collect(treeData)
    return nodes
  }, [expanded, treeData])
  const tabbableKey =
    [focusedKey, selected].find((key) =>
      visibleNodes.some((node) => node.key === key && !node.disabled),
    ) ?? visibleNodes.find((node) => !node.disabled)?.key

  useLayoutEffect(() => {
    if (
      !focusedKey ||
      visibleNodes.some((node) => node.key === focusedKey && !node.disabled)
    )
      return

    function findAncestors(nodes: TreeNode[], ancestors: string[]): string[] {
      for (const node of nodes) {
        if (node.key === focusedKey) return ancestors
        const found = findAncestors(node.children ?? [], [
          ...ancestors,
          node.key,
        ])
        if (found.length) return found
      }
      return []
    }

    const ancestor = findAncestors(treeData, [])
      .reverse()
      .find((key) =>
        visibleNodes.some((node) => node.key === key && !node.disabled),
      )
    const fallback =
      ancestor ?? visibleNodes.find((node) => !node.disabled)?.key
    if (
      focusWithinRef.current &&
      fallback &&
      (document.activeElement === document.body ||
        treeRef.current?.contains(document.activeElement))
    )
      nodeRefs.current[fallback]?.focus()
  }, [focusedKey, treeData, visibleNodes])

  function toggle(key: string) {
    const next = expanded.includes(key)
      ? expanded.filter((item) => item !== key)
      : [...expanded, key]
    if (expandedKeys === undefined) setInternalExpanded(next)
    onExpand?.(next)
  }

  function select(key: string) {
    if (selectedKey === undefined) setInternalSelected(key)
    onSelect?.(key)
  }

  function focusNode(key: string | undefined) {
    if (key && visibleNodes.some((node) => node.key === key && !node.disabled))
      nodeRefs.current[key]?.focus()
  }

  function focusByOffset(start: number, offset: -1 | 1) {
    for (
      let index = start + offset;
      index >= 0 && index < visibleNodes.length;
      index += offset
    ) {
      if (!visibleNodes[index].disabled) {
        focusNode(visibleNodes[index].key)
        return
      }
    }
  }

  function handleNodeKeyDown(
    event: KeyboardEvent<HTMLLIElement>,
    node: TreeNode,
  ) {
    if (event.target !== event.currentTarget) return
    const currentIndex = visibleNodes.findIndex((item) => item.key === node.key)
    const current = visibleNodes[currentIndex]
    if (!current) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusByOffset(currentIndex, 1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusByOffset(currentIndex, -1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusNode(visibleNodes.find((item) => !item.disabled)?.key)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusNode(visibleNodes.filter((item) => !item.disabled).at(-1)?.key)
    } else if (event.key === 'ArrowRight' && current.hasChildren) {
      event.preventDefault()
      if (!expanded.includes(node.key)) toggle(node.key)
      else {
        const child = visibleNodes.find(
          (item) => item.parentKey === node.key && !item.disabled,
        )
        focusNode(child?.key)
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      if (current.hasChildren && expanded.includes(node.key)) toggle(node.key)
      else focusNode(current.parentKey)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      select(node.key)
    }
  }

  function renderNodes(nodes: TreeNode[], level = 0): ReactNode {
    return nodes.map((node) => {
      const hasChildren = Boolean(node.children?.length)
      const isExpanded = expanded.includes(node.key)
      const panelId = `${id}-${encodeURIComponent(node.key)}`
      return (
        <li
          key={node.key}
          role="treeitem"
          ref={(element) => {
            nodeRefs.current[node.key] = element
          }}
          className="group/treeitem"
          tabIndex={node.disabled ? -1 : node.key === tabbableKey ? 0 : -1}
          aria-labelledby={`${panelId}-label`}
          aria-selected={selected === node.key}
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-disabled={node.disabled || undefined}
          aria-controls={hasChildren && isExpanded ? panelId : undefined}
          onFocus={(event) => {
            if (event.target === event.currentTarget) setFocusedKey(node.key)
          }}
          onClick={(event) => {
            if (event.target instanceof Element) {
              if (
                event.target.closest('[role="treeitem"]') !==
                event.currentTarget
              )
                return
              if (node.disabled) return
              event.currentTarget.focus()
              if (event.target.closest('[data-tree-toggle]')) toggle(node.key)
              else select(node.key)
            }
          }}
          onKeyDown={(event) => handleNodeKeyDown(event, node)}
        >
          <div
            className="group/treerow flex min-h-11 items-center gap-[var(--space-xs)] ps-[calc(var(--ui-tree-level)*var(--space-lg))]"
            style={{ '--ui-tree-level': level } as CSSProperties}
          >
            {hasChildren ? (
              <span
                className={cn(
                  'grid size-11 shrink-0 touch-manipulation cursor-pointer place-items-center text-muted-foreground',
                  node.disabled && 'cursor-not-allowed opacity-50',
                )}
                data-tree-toggle=""
                aria-hidden="true"
              >
                {isExpanded ? '−' : '+'}
              </span>
            ) : (
              <span className="size-11 shrink-0" aria-hidden="true" />
            )}
            <span
              id={`${panelId}-label`}
              data-tree-label=""
              className={cn(
                'min-h-11 min-w-0 flex-1 rounded-[var(--radius-sm)] p-2 text-start text-foreground group-focus-visible/treeitem:bg-accent group-focus-visible/treeitem:text-accent-foreground group-focus-visible/treeitem:outline-[3px] group-focus-visible/treeitem:outline-offset-[-3px] group-focus-visible/treeitem:outline-ring',
                node.disabled
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer group-hover/treerow:bg-accent group-hover/treerow:text-accent-foreground',
                selected === node.key && 'bg-accent text-accent-foreground',
              )}
            >
              {node.title}
            </span>
          </div>
          {hasChildren && isExpanded && (
            <ul id={panelId} role="group" className="m-0 list-none p-0">
              {renderNodes(node.children ?? [], level + 1)}
            </ul>
          )}
        </li>
      )
    })
  }

  return (
    <div
      ref={treeRef}
      role="tree"
      aria-label={label}
      className={cn(
        'w-full overflow-auto rounded-[var(--radius-md)] border border-border bg-card p-[var(--space-xs)]',
        className,
      )}
      onFocusCapture={() => {
        focusWithinRef.current = true
      }}
      onBlurCapture={(event) => {
        if (
          event.target.isConnected &&
          event.relatedTarget instanceof Node &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          focusWithinRef.current = false
      }}
    >
      <ul role="none" className="m-0 list-none p-0">
        {renderNodes(treeData)}
      </ul>
    </div>
  )
}
