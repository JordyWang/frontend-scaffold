import {
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { useConfig } from './config-context'
import { Empty } from './empty'
import { Icon } from './icon'
import { Button } from './button'
import { spinnerIndicatorStyles } from './tailwind-styles'
import { useTreeLoader, type TreeLoadChildren } from './tree-loader'
import { useTreeVirtualizer, type TreeScrollOptions } from './tree-virtualizer'
import {
  checkBoundary,
  changeCheck,
  conductChecks,
  indexTree,
  treeOrderedKeys,
} from './tree-state'

type TreePart =
  | 'item'
  | 'row'
  | 'switcher'
  | 'checkbox'
  | 'icon'
  | 'title'
  | 'group'
  | 'loading'
  | 'error'
export type TreeNode = {
  key: string
  title: ReactNode
  textValue?: string
  children?: TreeNode[]
  isLeaf?: boolean
  disabled?: boolean
  selectable?: boolean
  checkable?: boolean
  disableCheckbox?: boolean
  icon?: ReactNode
  className?: string
  classNames?: Partial<Record<TreePart, string>>
}
export type TreeCheckInfo = {
  node: TreeNode
  checked: boolean
  halfCheckedKeys: string[]
}
export type TreeSelectionInfo = { node: TreeNode; selected: boolean }
export type TreeSwitcherInfo = {
  node: TreeNode
  expanded: boolean
  direction: 'ltr' | 'rtl'
}
export type TreeHandle = {
  scrollTo: (options: TreeScrollOptions) => void
  getNodePath: (key: string) => TreeNode[]
}
const emptyKeys: string[] = []
export type TreeProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onSelect' | 'onLoad' | 'dir'
> & {
  treeData: TreeNode[]
  expandedKeys?: string[]
  defaultExpandedKeys?: string[]
  defaultExpandAll?: boolean
  defaultExpandParent?: boolean
  autoExpandParent?: boolean
  onExpand?: (keys: string[]) => void
  selectedKey?: string
  defaultSelectedKey?: string
  onSelect?: (key: string) => void
  selectedKeys?: string[]
  defaultSelectedKeys?: string[]
  onSelectionChange?: (keys: string[], info: TreeSelectionInfo) => void
  multiple?: boolean
  selectable?: boolean
  checkable?: boolean
  checkedKeys?: string[]
  defaultCheckedKeys?: string[]
  halfCheckedKeys?: string[]
  checkStrictly?: boolean
  onCheck?: (keys: string[], info: TreeCheckInfo) => void
  disabled?: boolean
  showLine?: boolean
  showIcon?: boolean
  blockNode?: boolean
  switcherIcon?: (info: TreeSwitcherInfo) => ReactNode
  loadChildren?: TreeLoadChildren
  loadVersion?: string | number
  onLoad?: (node: TreeNode, children: TreeNode[]) => void
  onLoadError?: (error: unknown, node: TreeNode) => void
  height?: number
  virtual?: boolean
  estimatedItemHeight?: number
  overscan?: number
  ref?: Ref<TreeHandle>
  label?: string
  emptyText?: string
  dir?: 'ltr' | 'rtl'
  classNames?: Partial<Record<'root' | TreePart, string>>
}

function expandAncestors(
  keys: string[],
  entries: ReturnType<typeof indexTree>,
) {
  const result = new Set(keys)
  for (const key of keys)
    for (const ancestor of [...(entries.get(key)?.ancestors ?? [])].reverse()) {
      if (entries.get(ancestor)?.node.disabled) break
      result.add(ancestor)
    }
  return [...result]
}

/** One roving tree entry; selection and checkbox state have independent contracts. */
export function Tree(allProps: TreeProps) {
  const {
    treeData: sourceData,
    expandedKeys,
    defaultExpandedKeys = emptyKeys,
    defaultExpandAll = false,
    defaultExpandParent = true,
    autoExpandParent = false,
    onExpand,
    selectedKey,
    defaultSelectedKey,
    onSelect,
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    multiple = false,
    selectable = true,
    checkable = false,
    checkedKeys,
    defaultCheckedKeys = emptyKeys,
    halfCheckedKeys = emptyKeys,
    checkStrictly = false,
    onCheck,
    disabled = false,
    showLine = false,
    showIcon = false,
    blockNode = true,
    switcherIcon,
    loadChildren,
    loadVersion = 0,
    onLoad,
    onLoadError,
    height,
    virtual = true,
    estimatedItemHeight = 44,
    overscan = 3,
    ref,
    label = '树形导航',
    emptyText = '暂无节点',
    dir,
    classNames,
    className,
    onFocusCapture,
    onBlurCapture,
    onScroll,
    style,
    ...props
  } = allProps
  const config = useConfig()
  const direction = dir ?? config.direction
  const loader = useTreeLoader({
    treeData: sourceData,
    loadChildren,
    loadVersion,
    disabled,
    onLoad,
    onLoadError,
  })
  const treeData = loader.treeData
  const { expandable } = loader
  const entries = useMemo(() => indexTree(treeData), [treeData])
  const [internalExpanded, setInternalExpanded] = useState(() =>
    defaultExpandAll
      ? [...entries.values()]
          .filter(({ node }) => loader.expandable(node))
          .map(({ node }) => node.key)
      : defaultExpandParent
        ? expandAncestors(defaultExpandedKeys, entries)
        : defaultExpandedKeys,
  )
  const [internalSelected, setInternalSelected] = useState(
    defaultSelectedKeys ??
      (defaultSelectedKey === undefined ? [] : [defaultSelectedKey]),
  )
  const [internalChecked, setInternalChecked] = useState(defaultCheckedKeys)
  const [focusedKey, setFocusedKey] = useState<string>()
  const selectedControlled =
    'selectedKeys' in allProps || 'selectedKey' in allProps
  const requestedSelection =
    'selectedKeys' in allProps
      ? (selectedKeys ?? [])
      : 'selectedKey' in allProps
        ? selectedKey === undefined
          ? []
          : [selectedKey]
        : internalSelected
  const selected = requestedSelection
    .filter((key) => entries.has(key))
    .slice(0, multiple ? undefined : 1)
  const requestedExpanded = expandedKeys ?? internalExpanded
  const expanded = useMemo(
    () =>
      (autoExpandParent
        ? expandAncestors(requestedExpanded, entries)
        : requestedExpanded
      ).filter((key) => {
        const node = entries.get(key)?.node
        return node && expandable(node)
      }),
    [autoExpandParent, requestedExpanded, entries, expandable],
  )
  const expandedSet = useMemo(() => new Set(expanded), [expanded])
  const checks = useMemo(
    () =>
      conductChecks(
        checkedKeys ?? internalChecked,
        entries,
        checkStrictly,
        halfCheckedKeys,
      ),
    [checkedKeys, internalChecked, entries, checkStrictly, halfCheckedKeys],
  )
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef(new Map<string, HTMLLIElement>())
  const focused = useRef<{
    key?: string
    ancestors: string[]
    node: HTMLElement
  } | null>(null)
  const typeahead = useRef({ text: '', time: 0 })
  const activeLoads = useRef(new Set<string>())
  const pendingFocus = useRef<string | undefined>(undefined)
  const pendingScroll = useRef<TreeScrollOptions | null>(null)
  const constrainedHeight =
    height !== undefined && Number.isFinite(height) && height > 0
      ? Math.max(44, height)
      : undefined
  const virtualEnabled = virtual && constrainedHeight !== undefined

  // Removed keys cannot silently reappear in uncontrolled state when data is reused.
  const prune = (keys: string[]) => keys.filter((key) => entries.has(key))
  if (
    expandedKeys === undefined &&
    internalExpanded.some((key) => !entries.has(key))
  )
    setInternalExpanded(prune(internalExpanded))
  if (!selectedControlled && internalSelected.some((key) => !entries.has(key)))
    setInternalSelected(prune(internalSelected))
  if (
    checkedKeys === undefined &&
    internalChecked.some((key) => !entries.has(key))
  )
    setInternalChecked(prune(internalChecked))

  const visible = useMemo(
    () =>
      [...entries.values()].filter(({ ancestors }) =>
        ancestors.every((key) => expandedSet.has(key)),
      ),
    [entries, expandedSet],
  )
  const visibleKeys = useMemo(
    () => visible.map(({ node }) => node.key),
    [visible],
  )
  const available = useMemo(
    () => visible.filter(({ node }) => !disabled && !node.disabled),
    [visible, disabled],
  )
  const tabbableKey =
    [focusedKey, ...selected].find((key) =>
      available.some(({ node }) => node.key === key),
    ) ?? available[0]?.node.key
  const windowing = useTreeVirtualizer({
    keys: visibleKeys,
    enabled: virtualEnabled,
    height: constrainedHeight ?? 320,
    estimate: estimatedItemHeight,
    overscan,
    keepKey: tabbableKey,
    rootRef,
    nodeRefs,
  })

  useLayoutEffect(() => {
    const request = pendingScroll.current
    if (request && !entries.has(request.key)) pendingScroll.current = null
    else if (request && visibleKeys.includes(request.key)) {
      pendingScroll.current = null
      scrollToVisible(request)
    }
    const key = pendingFocus.current
    const element = key ? nodeRefs.current.get(key) : undefined
    if (element) {
      pendingFocus.current = undefined
      element.focus({ preventScroll: true })
    } else if (key && !available.some(({ node }) => node.key === key))
      pendingFocus.current = undefined
  })

  useImperativeHandle(ref, () => ({
    scrollTo(options) {
      const entry = entries.get(options.key)
      if (!entry) return
      if (visibleKeys.includes(options.key)) scrollToVisible(options)
      else if (
        options.autoExpand &&
        !disabled &&
        !entry.ancestors.some((key) => entries.get(key)?.node.disabled)
      ) {
        pendingScroll.current = options
        const next = [...new Set([...expanded, ...entry.ancestors])]
        if (expandedKeys === undefined) setInternalExpanded(next)
        onExpand?.(next)
      }
    },
    getNodePath(key) {
      const entry = entries.get(key)
      return entry
        ? [...entry.ancestors, key].map((key) => entries.get(key)!.node)
        : []
    },
  }))

  useLayoutEffect(() => {
    const activeKeys = new Set(
      available
        .filter(({ node }) => expandedSet.has(node.key))
        .map(({ node }) => node.key),
    )
    for (const [key, status] of loader.statuses)
      if (status === 'loading' && !activeKeys.has(key)) loader.cancel(key)
    for (const key of activeKeys)
      if (
        !loader.statuses.has(key) ||
        (loader.statuses.get(key) === 'cancelled' &&
          !activeLoads.current.has(key))
      )
        void loader.request(key)
    activeLoads.current = activeKeys
  })

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      )
        focused.current = null
    }
    document.addEventListener('pointerdown', handlePointerDown, true)
    return () =>
      document.removeEventListener('pointerdown', handlePointerDown, true)
  }, [])

  useLayoutEffect(() => {
    const previous = focused.current
    if (!previous || !rootRef.current || pendingFocus.current) return
    if (
      document.activeElement !== previous.node &&
      document.activeElement !== document.body
    ) {
      focused.current = null
      return
    }
    const current = available.find(({ node }) => node.key === previous.key)
    if (
      previous.node.isConnected &&
      (current || previous.node === rootRef.current)
    )
      return
    const ancestor = [...previous.ancestors]
      .reverse()
      .find((key) => available.some(({ node }) => node.key === key))
    const fallback = current?.node.key ?? ancestor ?? available[0]?.node.key
    if (fallback) focusNode(fallback)
    else rootRef.current.focus({ preventScroll: true })
  })

  function toggle(key: string) {
    const next = expanded.includes(key)
      ? expanded.filter(
          (item) =>
            item !== key &&
            !(autoExpandParent && entries.get(item)?.ancestors.includes(key)),
        )
      : [...expanded, key]
    if (expandedKeys === undefined) setInternalExpanded(next)
    onExpand?.(next)
  }

  function select(node: TreeNode) {
    if (disabled || node.disabled || !selectable || node.selectable === false)
      return
    const next = multiple
      ? selected.includes(node.key)
        ? selected.filter((key) => key !== node.key)
        : [...selected, node.key]
      : [node.key]
    if (!selectedControlled) setInternalSelected(next)
    onSelect?.(node.key)
    onSelectionChange?.(next, { node, selected: next.includes(node.key) })
  }

  function check(node: TreeNode) {
    if (!checkable || disabled || checkBoundary(node)) return
    const next = changeCheck(node.key, checks.checked, entries, checkStrictly)
    const nextHalf = halfCheckedKeys.filter((key) => key !== node.key)
    const result = conductChecks([...next], entries, checkStrictly, nextHalf)
    const keys = treeOrderedKeys(result.checked, entries)
    if (checkedKeys === undefined) setInternalChecked(keys)
    onCheck?.(keys, {
      node,
      checked: result.checked.has(node.key),
      halfCheckedKeys: treeOrderedKeys(result.halfChecked, entries),
    })
  }

  function focusNode(key: string | undefined) {
    if (!key || !available.some(({ node }) => node.key === key)) return
    if (virtualEnabled) {
      pendingFocus.current = key
      setFocusedKey(key)
      windowing.scrollTo({ key })
    } else nodeRefs.current.get(key)?.focus()
  }

  function scrollToVisible(options: TreeScrollOptions) {
    if (virtualEnabled) windowing.scrollTo(options)
    else {
      const element = nodeRefs.current.get(options.key)
      const root = rootRef.current
      if (element && root) {
        const top =
          element.getBoundingClientRect().top -
          root.getBoundingClientRect().top +
          root.scrollTop -
          root.clientTop
        const rowHeight =
          element.querySelector('[data-ui-tree-row]')?.getBoundingClientRect()
            .height ?? 44
        const current = root.scrollTop
        const offset = Number.isFinite(options.offset) ? options.offset! : 0
        const align = options.align ?? 'auto'
        const next =
          align === 'start'
            ? top
            : align === 'center'
              ? top - (root.clientHeight - rowHeight) / 2
              : align === 'end'
                ? top + rowHeight - root.clientHeight
                : top < current
                  ? top
                  : top + rowHeight > current + root.clientHeight
                    ? top + rowHeight - root.clientHeight
                    : current
        root.scrollTop = Math.max(0, next + offset)
      }
    }
    if (
      options.focus &&
      available.some(({ node }) => node.key === options.key)
    ) {
      pendingFocus.current = options.key
      setFocusedKey(options.key)
      if (!virtualEnabled) {
        pendingFocus.current = undefined
        nodeRefs.current.get(options.key)?.focus({ preventScroll: true })
      }
    }
  }

  function handleKey(event: KeyboardEvent<HTMLLIElement>, node: TreeNode) {
    if (
      event.target !== event.currentTarget ||
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      disabled ||
      node.disabled
    )
      return
    const index = available.findIndex((entry) => entry.node.key === node.key)
    const expandKey = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
    const collapseKey = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
    if (event.key.length !== 1 || event.key === ' ') typeahead.current.text = ''
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      focusNode(
        available[index + (event.key === 'ArrowDown' ? 1 : -1)]?.node.key,
      )
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      focusNode(
        event.key === 'Home'
          ? available[0]?.node.key
          : available.at(-1)?.node.key,
      )
    } else if (event.key === expandKey && loader.expandable(node)) {
      event.preventDefault()
      if (!expanded.includes(node.key)) toggle(node.key)
      else if (
        loader.statuses.get(node.key) === 'error' ||
        loader.statuses.get(node.key) === 'cancelled'
      )
        void loader.request(node.key)
      else
        focusNode(
          available.find((entry) => entry.parent === node.key)?.node.key,
        )
    } else if (event.key === collapseKey) {
      event.preventDefault()
      if (loader.expandable(node) && expanded.includes(node.key))
        toggle(node.key)
      else {
        const ancestor = [...(entries.get(node.key)?.ancestors ?? [])]
          .reverse()
          .find((key) => available.some((entry) => entry.node.key === key))
        focusNode(ancestor)
      }
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (event.key === ' ' && checkable && node.checkable !== false)
        check(node)
      else select(node)
    } else if (event.key.length === 1 && !event.nativeEvent.isComposing) {
      const time = event.timeStamp
      const character = event.key.toLowerCase()
      const previous =
        time - typeahead.current.time < 700 ? typeahead.current.text : ''
      const text =
        previous && [...previous].every((value) => value === character)
          ? character
          : previous + character
      typeahead.current = { text, time }
      const candidates = [
        ...available.slice(index + 1),
        ...available.slice(0, index + 1),
      ]
      const match = candidates.find(({ node: candidate }) => {
        const title =
          candidate.textValue ??
          (typeof candidate.title === 'string' ||
          typeof candidate.title === 'number'
            ? String(candidate.title)
            : nodeRefs.current
                .get(candidate.key)
                ?.querySelector('[data-tree-label]')?.textContent)
        return title?.trim().toLowerCase().startsWith(text)
      })
      if (match) {
        event.preventDefault()
        focusNode(match.node.key)
      }
    }
  }

  function renderNodes(nodes: TreeNode[], level = 0): ReactNode {
    return nodes.map((node, position) =>
      renderNode(node, position, nodes.length, level),
    )
  }
  function renderNode(
    node: TreeNode,
    position: number,
    setSize: number,
    level: number,
    top?: number,
  ): ReactNode {
    const hasChildren = loader.expandable(node)
    const loadStatus = loader.statuses.get(node.key)
    const nodeName =
      typeof node.title === 'string' || typeof node.title === 'number'
        ? String(node.title)
        : '子节点'
    const isExpanded = expandedSet.has(node.key)
    const isDisabled = disabled || !!node.disabled
    const isSelectable = selectable && node.selectable !== false
    const isCheckable = checkable && node.checkable !== false
    const isChecked = checks.checked.has(node.key)
    const isMixed = checks.halfChecked.has(node.key)
    const panelId = `${id}-${encodeURIComponent(node.key)}`
    const part = (name: TreePart) =>
      cn(classNames?.[name], node.classNames?.[name])
    return (
      <li
        key={node.key}
        role="treeitem"
        ref={(element) => {
          if (element) nodeRefs.current.set(node.key, element)
          else nodeRefs.current.delete(node.key)
        }}
        className={cn(
          'relative min-w-0 focus-visible:outline-none! focus-visible:[&>[data-ui-tree-row]>[data-tree-label]]:outline-[3px] focus-visible:[&>[data-ui-tree-row]>[data-tree-label]]:outline-offset-[-3px] focus-visible:[&>[data-ui-tree-row]>[data-tree-label]]:outline-ring',
          part('item'),
          node.className,
          virtualEnabled && 'absolute inset-x-0',
        )}
        data-ui-tree-item=""
        style={{ '--ui-tree-level': level, top } as CSSProperties}
        tabIndex={isDisabled ? -1 : node.key === tabbableKey ? 0 : -1}
        aria-labelledby={`${panelId}-label`}
        aria-selected={isSelectable ? selected.includes(node.key) : undefined}
        aria-checked={
          isCheckable
            ? isChecked
              ? true
              : isMixed
                ? 'mixed'
                : false
            : undefined
        }
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-busy={loadStatus === 'loading' || undefined}
        aria-describedby={
          loadStatus === 'error' && isExpanded ? `${panelId}-error` : undefined
        }
        aria-description={
          isCheckable && node.disableCheckbox
            ? !isDisabled && isSelectable
              ? '勾选已禁用，仍可选择节点'
              : '勾选已禁用'
            : undefined
        }
        aria-disabled={isDisabled || undefined}
        aria-level={level + 1}
        aria-posinset={position + 1}
        aria-setsize={setSize}
        aria-controls={
          !virtualEnabled && hasChildren && isExpanded ? panelId : undefined
        }
        onFocus={(event) => {
          if (event.target === event.currentTarget) setFocusedKey(node.key)
        }}
        onClick={(event) => {
          if (
            !(event.target instanceof Element) ||
            event.target.closest('[role="treeitem"]') !== event.currentTarget ||
            isDisabled
          )
            return
          if (
            event.target.closest(
              'button, a, input, select, textarea, [contenteditable="true"]',
            )
          )
            return
          event.currentTarget.focus({ preventScroll: true })
          if (event.target.closest('[data-tree-toggle]')) toggle(node.key)
          else if (event.target.closest('[data-tree-checkbox]')) check(node)
          else select(node)
        }}
        onKeyDown={(event) => handleKey(event, node)}
      >
        {showLine && level > 0 && (
          <span
            aria-hidden="true"
            data-ui-tree-line=""
            className={cn(
              'pointer-events-none absolute inset-y-0 start-[calc(min(calc(var(--ui-tree-level)*1.5rem),25%)-2px)] w-6 border-s border-border before:absolute before:start-0 before:top-[22px] before:w-6 before:border-t before:border-border',
              position === setSize - 1 && 'bottom-auto h-[22px]',
            )}
          />
        )}
        {virtualEnabled &&
          showLine &&
          entries.get(node.key)?.ancestors.map((key, depth) => {
            const ancestor = entries.get(key)!
            return depth > 0 && ancestor.position < ancestor.setSize - 1 ? (
              <span
                key={key}
                aria-hidden="true"
                data-ui-tree-ancestor-line=""
                className="pointer-events-none absolute inset-y-0 start-[calc(min(calc(var(--ui-tree-line-level)*1.5rem),25%)-2px)] border-s border-border"
                style={{ '--ui-tree-line-level': depth } as CSSProperties}
              />
            ) : null
          })}
        {virtualEnabled &&
          showLine &&
          isExpanded &&
          Boolean(node.children?.length) && (
            <span
              aria-hidden="true"
              data-ui-tree-parent-line=""
              className="pointer-events-none absolute bottom-0 top-[22px] start-[calc(min(calc(var(--ui-tree-level)*1.5rem),25%)+22px)] border-s border-border"
            />
          )}
        <div
          data-ui-tree-row=""
          className={cn(
            'group/treerow relative flex min-h-11 min-w-0 items-start ps-[min(calc(var(--ui-tree-level)*1.5rem),25%)]',
            isDisabled && 'opacity-50',
            part('row'),
          )}
        >
          <span
            className={cn(
              'grid size-11 shrink-0 place-items-center text-muted-foreground',
              hasChildren && !isDisabled
                ? 'touch-manipulation cursor-pointer rounded-sm hover:bg-accent'
                : 'cursor-default',
              part('switcher'),
            )}
            data-tree-toggle={hasChildren ? '' : undefined}
            aria-hidden="true"
          >
            {loadStatus === 'loading' ? (
              <span
                data-ui-tree-loading-indicator=""
                className={cn(spinnerIndicatorStyles, 'size-4 border-2')}
              />
            ) : (
              hasChildren &&
              (switcherIcon ? (
                switcherIcon({ node, expanded: isExpanded, direction })
              ) : (
                <Icon
                  name={direction === 'rtl' ? 'arrowLeft' : 'arrowRight'}
                  size={16}
                  className={cn(
                    'transition-transform duration-200 motion-reduce:transition-none',
                    isExpanded &&
                      (direction === 'rtl' ? '-rotate-90' : 'rotate-90'),
                  )}
                />
              ))
            )}
          </span>
          {isCheckable && (
            <span
              data-tree-checkbox=""
              data-ui-checked={
                isMixed && !isChecked ? 'mixed' : String(isChecked)
              }
              aria-hidden="true"
              className={cn(
                'grid size-11 shrink-0 place-items-center touch-manipulation',
                node.disableCheckbox || isDisabled
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer',
                part('checkbox'),
              )}
            >
              <span
                className={cn(
                  'grid size-5 place-items-center rounded border-2',
                  isChecked || isMixed
                    ? 'border-primary bg-primary'
                    : 'border-input bg-card',
                )}
              >
                {isChecked ? (
                  <span className="size-2.5 -translate-y-px rotate-45 border-b-2 border-r-2 border-primary-foreground" />
                ) : isMixed ? (
                  <span className="h-0.5 w-2.5 rounded bg-primary-foreground" />
                ) : null}
              </span>
            </span>
          )}
          <span
            id={`${panelId}-label`}
            data-tree-label=""
            className={cn(
              'flex min-h-11 min-w-0 items-start gap-2 rounded-[var(--radius-sm)] px-2 py-2.5 text-start text-foreground [overflow-wrap:anywhere]',
              blockNode && 'flex-1',
              isDisabled
                ? 'cursor-not-allowed'
                : isSelectable
                  ? 'cursor-pointer group-hover/treerow:bg-accent'
                  : 'cursor-default',
              selected.includes(node.key) &&
                isSelectable &&
                'bg-accent text-accent-foreground',
              part('title'),
            )}
          >
            {showIcon && (
              <span
                aria-hidden="true"
                className={cn('mt-1 inline-flex shrink-0', part('icon'))}
              >
                {node.icon ?? (
                  <Icon name={hasChildren ? 'folder' : 'file'} size={16} />
                )}
              </span>
            )}
            {node.title}
          </span>
        </div>
        {isExpanded &&
          (loadStatus === 'loading' ||
            loadStatus === 'error' ||
            loadStatus === 'cancelled') && (
            <div
              className={cn(
                'flex min-w-0 flex-wrap items-center gap-2 ps-[min(calc(var(--ui-tree-level)*1.5rem+2.75rem),25%)] pb-2 text-sm',
                part(loadStatus === 'error' ? 'error' : 'loading'),
              )}
            >
              {loadStatus !== 'error' ? (
                <>
                  <span
                    role="status"
                    aria-label={`${nodeName}加载状态`}
                    className="text-muted-foreground"
                  >
                    {loadStatus === 'loading'
                      ? '正在加载子节点…'
                      : '加载已取消。'}
                  </span>
                  <Button
                    variant="outline"
                    size="small"
                    disabled={isDisabled}
                    onClick={() => {
                      if (loadStatus === 'loading') {
                        loader.cancel(node.key, true)
                        toggle(node.key)
                      } else void loader.request(node.key)
                    }}
                  >
                    {loadStatus === 'loading' ? '取消加载' : '继续加载'}
                    {nodeName}
                  </Button>
                </>
              ) : (
                <>
                  <span
                    id={`${panelId}-error`}
                    role="alert"
                    className="text-destructive"
                  >
                    子节点加载失败，请重试。
                  </span>
                  <Button
                    variant="outline"
                    size="small"
                    disabled={isDisabled}
                    onClick={() => {
                      void loader.request(node.key)
                    }}
                  >
                    重试加载{nodeName}
                  </Button>
                </>
              )}
            </div>
          )}
        {!virtualEnabled && hasChildren && isExpanded && (
          <ul
            id={panelId}
            role="group"
            className={cn(
              'm-0 list-none p-0',
              showLine &&
                Boolean(node.children?.length) &&
                'relative before:pointer-events-none before:absolute before:-top-[22px] before:start-[calc(min(calc(var(--ui-tree-level)*1.5rem),25%)+22px)] before:h-[22px] before:border-s before:border-border',
              part('group'),
            )}
          >
            {renderNodes(node.children ?? [], level + 1)}
          </ul>
        )}
      </li>
    )
  }

  return (
    <div
      {...props}
      ref={rootRef}
      role="tree"
      aria-label={props['aria-label'] ?? label}
      aria-multiselectable={multiple || undefined}
      aria-disabled={disabled || undefined}
      dir={direction}
      tabIndex={props.tabIndex ?? (available.length ? -1 : 0)}
      data-ui-tree=""
      data-ui-tree-virtual={virtualEnabled || undefined}
      style={{ ...style, height: constrainedHeight ?? style?.height }}
      className={cn(
        'min-w-0 w-full overflow-auto rounded-[var(--radius-md)] border border-border bg-card p-[var(--space-xs)] text-foreground focus-visible:outline-2 focus-visible:outline-ring',
        classNames?.root,
        className,
        virtualEnabled &&
          'touch-pan-y overflow-x-hidden overscroll-contain [overflow-anchor:none]',
      )}
      onScroll={(event) => {
        if (virtualEnabled) windowing.onScroll()
        onScroll?.(event)
      }}
      onFocusCapture={(event) => {
        const item = event.target.closest<HTMLElement>('[data-ui-tree-item]')
        const key = [...nodeRefs.current].find(
          ([, element]) => element === item,
        )?.[0]
        focused.current = {
          key,
          ancestors: entries.get(key ?? '')?.ancestors ?? [],
          node: event.target,
        }
        if (key) setFocusedKey(key)
        onFocusCapture?.(event)
      }}
      onBlurCapture={(event) => {
        if (
          event.relatedTarget instanceof Node &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          focused.current = null
        onBlurCapture?.(event)
      }}
    >
      {treeData.length ? (
        <ul
          role="none"
          className={cn(
            'm-0 list-none p-0',
            virtualEnabled && 'relative',
            virtualEnabled && classNames?.group,
          )}
          style={virtualEnabled ? { height: windowing.totalHeight } : undefined}
        >
          {virtualEnabled
            ? windowing.items.map((slot) => {
                const entry = visible[slot.index]
                return renderNode(
                  entry.node,
                  entry.position,
                  entry.setSize,
                  entry.ancestors.length,
                  slot.start,
                )
              })
            : renderNodes(treeData)}
        </ul>
      ) : (
        <Empty title={emptyText} size="small" />
      )}
    </div>
  )
}
