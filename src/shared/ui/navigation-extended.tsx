import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'

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
  mode?: 'vertical' | 'horizontal'
  label?: string
  onSelect?: (key: string) => void
  className?: string
}

/** A semantic menu with roving arrow-key focus and optional nested groups. */
export function Menu({
  items,
  selectedKeys,
  defaultSelectedKeys = [],
  mode = 'vertical',
  label = '主导航',
  onSelect,
  className,
}: MenuProps) {
  const [internalSelected, setInternalSelected] = useState(defaultSelectedKeys)
  const [expanded, setExpanded] = useState<string[]>([])
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const selected = selectedKeys ?? internalSelected

  const visibleKeys = items.flatMap((item) =>
    expanded.includes(item.key) && item.children
      ? [item.key, ...item.children.map((child) => child.key)]
      : [item.key],
  )

  function select(key: string) {
    if (selectedKeys === undefined) setInternalSelected([key])
    onSelect?.(key)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, key: string) {
    const index = visibleKeys.indexOf(key)
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault()
      itemRefs.current[visibleKeys[(index + 1) % visibleKeys.length]]?.focus()
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault()
      itemRefs.current[
        visibleKeys[(index - 1 + visibleKeys.length) % visibleKeys.length]
      ]?.focus()
    } else if (event.key === 'Home') {
      event.preventDefault()
      itemRefs.current[visibleKeys[0]]?.focus()
    } else if (event.key === 'End') {
      event.preventDefault()
      itemRefs.current[visibleKeys.at(-1) ?? '']?.focus()
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
            aria-expanded={hasChildren ? isExpanded : undefined}
            disabled={item.disabled}
            className={cn(
              'ui-menu__item',
              isSelected && 'ui-menu__item--selected',
              level > 0 && 'ui-menu__item--nested',
            )}
            onClick={() => {
              if (hasChildren) {
                setExpanded((keys) =>
                  keys.includes(item.key)
                    ? keys.filter((key) => key !== item.key)
                    : [...keys, item.key],
                )
              }
              select(item.key)
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
      aria-label={label}
      className={cn('ui-menu', `ui-menu--${mode}`, className)}
    >
      <ul role="menu" className="ui-menu__list">
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

  useEffect(() => {
    if (!autoplay || items.length < 2) return
    const timer = window.setInterval(() => setIndex(current + 1), interval)
    return () => window.clearInterval(timer)
  }, [autoplay, current, interval, items.length, setIndex])

  return (
    <section
      aria-label={label}
      aria-roledescription="carousel"
      className={cn('ui-carousel', className)}
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
          <button
            type="button"
            className="ui-carousel__control"
            onClick={() => setIndex(current - 1)}
          >
            上一项
          </button>
          <span className="ui-carousel__status" aria-live="polite">
            {current + 1} / {items.length}
          </span>
          <button
            type="button"
            className="ui-carousel__control"
            onClick={() => setIndex(current + 1)}
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
  onSelect,
  label = '树形导航',
  className,
}: TreeProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpandedKeys)
  const expanded = expandedKeys ?? internalExpanded
  const id = useId()
  const nodeRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const visibleNodes = useMemo(() => {
    const nodes: Array<{
      key: string
      parentKey?: string
      hasChildren: boolean
    }> = []
    function collect(current: TreeNode[], parentKey?: string) {
      for (const node of current) {
        const hasChildren = Boolean(node.children?.length)
        nodes.push({ key: node.key, parentKey, hasChildren })
        if (hasChildren && expanded.includes(node.key))
          collect(node.children ?? [], node.key)
      }
    }
    collect(treeData)
    return nodes
  }, [expanded, treeData])

  function toggle(key: string) {
    const next = expanded.includes(key)
      ? expanded.filter((item) => item !== key)
      : [...expanded, key]
    if (expandedKeys === undefined) setInternalExpanded(next)
    onExpand?.(next)
  }

  function focusNode(key: string | undefined) {
    if (key) nodeRefs.current[key]?.focus()
  }

  function handleNodeKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    node: TreeNode,
  ) {
    const currentIndex = visibleNodes.findIndex((item) => item.key === node.key)
    const current = visibleNodes[currentIndex]
    if (!current) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusNode(visibleNodes[currentIndex + 1]?.key)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusNode(visibleNodes[currentIndex - 1]?.key)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusNode(visibleNodes[0]?.key)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusNode(visibleNodes.at(-1)?.key)
    } else if (event.key === 'ArrowRight' && current.hasChildren) {
      event.preventDefault()
      if (!expanded.includes(node.key)) toggle(node.key)
      else focusNode(visibleNodes[currentIndex + 1]?.key)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      if (current.hasChildren && expanded.includes(node.key)) toggle(node.key)
      else focusNode(current.parentKey)
    }
  }

  function renderNodes(nodes: TreeNode[], level = 0): ReactNode {
    return nodes.map((node) => {
      const hasChildren = Boolean(node.children?.length)
      const isExpanded = expanded.includes(node.key)
      const panelId = `${id}-${node.key}`
      return (
        <li key={node.key} role="none" className="ui-tree__item">
          <div
            className="ui-tree__row"
            style={{ '--ui-tree-level': level } as CSSProperties}
          >
            {hasChildren ? (
              <button
                type="button"
                className="ui-tree__toggle"
                aria-label={
                  isExpanded
                    ? `收起 ${String(node.title)}`
                    : `展开 ${String(node.title)}`
                }
                aria-expanded={isExpanded}
                aria-controls={isExpanded ? panelId : undefined}
                onClick={() => toggle(node.key)}
              >
                {isExpanded ? '−' : '+'}
              </button>
            ) : (
              <span className="ui-tree__toggle" aria-hidden="true" />
            )}
            <button
              type="button"
              role="treeitem"
              ref={(element) => {
                nodeRefs.current[node.key] = element
              }}
              className={cn(
                'ui-tree__label',
                selectedKey === node.key && 'ui-tree__label--selected',
              )}
              aria-selected={selectedKey === node.key}
              aria-expanded={hasChildren ? isExpanded : undefined}
              disabled={node.disabled}
              onClick={() => onSelect?.(node.key)}
              onKeyDown={(event) => handleNodeKeyDown(event, node)}
            >
              {node.title}
            </button>
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
    <div role="tree" aria-label={label} className={cn('ui-tree', className)}>
      <ul className="ui-tree__list">{renderNodes(treeData)}</ul>
    </div>
  )
}
