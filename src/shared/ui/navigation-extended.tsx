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
  const menuRef = useRef<HTMLElement | null>(null)
  const focusWithinRef = useRef(false)
  const selected = selectedKeys ?? internalSelected
  const expanded = expandedKeys ?? internalExpanded

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !menuRef.current?.contains(event.target)
      )
        focusWithinRef.current = false
    }
    document.addEventListener('pointerdown', handlePointerDown, true)
    return () =>
      document.removeEventListener('pointerdown', handlePointerDown, true)
  }, [])

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
        menuRef.current?.contains(document.activeElement))
    )
      itemRefs.current[fallback]?.focus()
  }, [focusedKey, items, visibleItems])

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
    if (event.key === nextKey && !handlesNestedOpen) {
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
      return (
        <li key={item.key} role="none" className="ui-menu__item-wrap">
          <button
            ref={(element) => {
              itemRefs.current[item.key] = element
            }}
            type="button"
            role="menuitem"
            aria-current={isSelected ? 'page' : undefined}
            aria-selected={isSelected}
            aria-disabled={item.disabled || undefined}
            aria-haspopup={hasChildren ? 'menu' : undefined}
            aria-expanded={hasChildren ? isExpanded : undefined}
            disabled={item.disabled}
            tabIndex={item.disabled || item.key !== tabbableKey ? -1 : 0}
            className={cn(
              'ui-menu__item',
              isSelected && 'ui-menu__item--selected',
              level > 0 && 'ui-menu__item--nested',
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
              <span className="ui-menu__expand" aria-hidden="true">
                {isExpanded ? '−' : '+'}
              </span>
            )}
          </button>
          {hasChildren && isExpanded && (
            <ul role="menu" className="ui-menu__submenu">
              {renderItems(item.children ?? [], level + 1)}
            </ul>
          )}
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
      className={cn('ui-menu', `ui-menu--${mode}`, className)}
    >
      <ul role="menu" aria-orientation={mode} className="ui-menu__list">
        {renderItems(items)}
      </ul>
    </nav>
  )
}

export type AnchorLink = { href: string; title: ReactNode }
export type AnchorProps = {
  links: AnchorLink[]
  activeHref?: string
  label?: string
  onChange?: (href: string) => void
  className?: string
}

export function Anchor({
  links,
  activeHref,
  label = '页内导航',
  onChange,
  className,
}: AnchorProps) {
  return (
    <nav aria-label={label} className={cn('ui-anchor', className)}>
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          aria-current={activeHref === link.href ? 'location' : undefined}
          className={cn(
            'ui-anchor__link',
            activeHref === link.href && 'ui-anchor__link--active',
          )}
          onClick={() => onChange?.(link.href)}
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
      className={cn('ui-affix', className)}
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
      className={cn('ui-carousel', className)}
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
      <div className="ui-carousel__viewport">
        {items.map((item, itemIndex) => (
          <div
            key={itemIndex}
            role="group"
            aria-roledescription="slide"
            aria-label={`${itemIndex + 1} / ${items.length}`}
            hidden={itemIndex !== current}
            className="ui-carousel__slide"
          >
            {item}
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <div className="ui-carousel__controls">
          {autoplay && (
            <button
              type="button"
              data-carousel-rotation=""
              className="ui-carousel__control"
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
            className="ui-carousel__control"
            onClick={() => moveTo(current - 1)}
          >
            上一项
          </button>
          <span
            className="ui-carousel__status"
            aria-live={rotating ? 'off' : 'polite'}
          >
            {current + 1} / {items.length}
          </span>
          <button
            type="button"
            className="ui-carousel__control"
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
          className="ui-tree__item"
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
            className="ui-tree__row"
            style={{ '--ui-tree-level': level } as CSSProperties}
          >
            {hasChildren ? (
              <span
                className="ui-tree__toggle"
                data-tree-toggle=""
                aria-hidden="true"
              >
                {isExpanded ? '−' : '+'}
              </span>
            ) : (
              <span className="ui-tree__toggle" aria-hidden="true" />
            )}
            <span
              id={`${panelId}-label`}
              className={cn(
                'ui-tree__label',
                selected === node.key && 'ui-tree__label--selected',
              )}
            >
              {node.title}
            </span>
          </div>
          {hasChildren && isExpanded && (
            <ul id={panelId} role="group" className="ui-tree__group">
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
      className={cn('ui-tree', className)}
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
      <ul role="none" className="ui-tree__list">
        {renderNodes(treeData)}
      </ul>
    </div>
  )
}
