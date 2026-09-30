import {
  forwardRef,
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
import { resolveComponentSize, useConfig } from './config-context'
import { Portal } from './portal'
import { inputSizeStyles, inputStyles } from './tailwind-styles'

export type TreeSelectOption = {
  value: string
  label: ReactNode
  searchText?: string
  children?: TreeSelectOption[]
  disabled?: boolean
}

export type TreeSelectValue = string | string[]

export type TreeSelectProps = {
  treeData: TreeSelectOption[]
  value?: TreeSelectValue
  defaultValue?: TreeSelectValue
  onChange?: (value: TreeSelectValue | undefined) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  placeholder?: string
  multiple?: boolean
  showSearch?: boolean
  allowClear?: boolean
  treeDefaultExpandAll?: boolean
  defaultExpandedValues?: string[]
  disabled?: boolean
  required?: boolean
  name?: string
  label?: string
  size?: 'small' | 'default' | 'large'
  id?: string
  className?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-label'?: string
  'aria-labelledby'?: string
}

type FlatNode = {
  node: TreeSelectOption
  parentValue?: string
  level: number
}

function getNodeText(label: ReactNode): string {
  if (typeof label === 'string' || typeof label === 'number')
    return String(label)
  if (Array.isArray(label)) return label.map(getNodeText).join('')
  return ''
}

function normalizeSelected(
  value: TreeSelectValue | undefined,
  multiple: boolean,
): string[] {
  if (multiple) {
    if (Array.isArray(value)) return value
    return value === undefined ? [] : [value]
  }
  if (Array.isArray(value)) return value.slice(0, 1)
  return value === undefined ? [] : [value]
}

function filterTree(
  nodes: TreeSelectOption[],
  query: string,
): TreeSelectOption[] {
  const normalized = query.trim().toLocaleLowerCase()
  if (!normalized) return nodes
  return nodes.flatMap((node) => {
    const children = filterTree(node.children ?? [], query)
    const text = (
      node.searchText ?? getNodeText(node.label)
    ).toLocaleLowerCase()
    if (text.includes(normalized) || children.length)
      return [{ ...node, children }]
    return []
  })
}

function flattenVisible(
  nodes: TreeSelectOption[],
  expanded: string[],
  level = 0,
  parentValue?: string,
): FlatNode[] {
  return nodes.flatMap((node) => {
    const current: FlatNode[] = [{ node, parentValue, level }]
    if (node.children?.length && expanded.includes(node.value))
      current.push(
        ...flattenVisible(node.children, expanded, level + 1, node.value),
      )
    return current
  })
}

function flattenAll(nodes: TreeSelectOption[]): TreeSelectOption[] {
  return nodes.flatMap((node) => [node, ...flattenAll(node.children ?? [])])
}

/** A keyboard-friendly tree combobox with single and multiple selection modes. */
export const TreeSelect = forwardRef<HTMLButtonElement, TreeSelectProps>(
  function TreeSelect(
    {
      treeData,
      value,
      defaultValue,
      onChange,
      open,
      defaultOpen = false,
      onOpenChange,
      placeholder = '请选择',
      multiple = false,
      showSearch = false,
      allowClear = false,
      treeDefaultExpandAll = false,
      defaultExpandedValues = [],
      disabled = false,
      required,
      name,
      label = '树形选择',
      size,
      id,
      className,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
    },
    forwardedRef,
  ) {
    const { componentSize, direction } = useConfig()
    const resolvedSize = resolveComponentSize(componentSize, size)
    const generatedId = useId()
    const triggerId = id ?? `tree-select-${generatedId}`
    const valueId = `${triggerId}-value`
    const popupId = `${triggerId}-popup`
    const treeId = `${triggerId}-tree`
    const triggerRef = useRef<HTMLButtonElement | null>(null)
    const contentRef = useRef<HTMLDivElement | null>(null)
    const searchRef = useRef<HTMLInputElement | null>(null)
    const nodeRefs = useRef<Record<string, HTMLLIElement | null>>({})
    const [internalValue, setInternalValue] = useState<
      TreeSelectValue | undefined
    >(defaultValue)
    const [internalOpen, setInternalOpen] = useState(defaultOpen)
    const [search, setSearch] = useState('')
    const [activeValue, setActiveValue] = useState<string>()
    const [popupStyle, setPopupStyle] = useState<CSSProperties>()
    const [expanded, setExpanded] = useState(() =>
      treeDefaultExpandAll
        ? flattenAll(treeData)
            .filter((node) => node.children?.length)
            .map((node) => node.value)
        : defaultExpandedValues,
    )

    const isOpen = open ?? internalOpen
    const selectedValue = value ?? internalValue
    const selected = normalizeSelected(selectedValue, multiple)
    const filteredTree = useMemo(
      () => filterTree(treeData, search),
      [search, treeData],
    )
    const effectiveExpanded = useMemo(
      () =>
        search.trim()
          ? [
              ...new Set([
                ...expanded,
                ...flattenAll(filteredTree)
                  .filter((node) => node.children?.length)
                  .map((node) => node.value),
              ]),
            ]
          : expanded,
      [expanded, filteredTree, search],
    )
    const visibleNodes = useMemo(
      () => flattenVisible(filteredTree, effectiveExpanded),
      [effectiveExpanded, filteredTree],
    )
    const allNodes = useMemo(() => flattenAll(treeData), [treeData])
    const selectedLabels = selected
      .map((key) => allNodes.find((node) => node.value === key)?.label)
      .filter((node): node is ReactNode => node !== undefined)
    const firstEnabled = visibleNodes.find(({ node }) => !node.disabled)?.node
      .value

    const setOpenState = useCallback(
      (next: boolean, restoreFocus = true) => {
        if (disabled) return
        if (open === undefined) setInternalOpen(next)
        onOpenChange?.(next)
        if (!next) {
          setSearch('')
          if (restoreFocus) triggerRef.current?.focus()
        }
      },
      [disabled, onOpenChange, open],
    )

    function updateSelection(next: string[]) {
      const normalized = multiple ? next : next.slice(0, 1)
      const nextValue = multiple ? normalized : normalized[0]
      if (value === undefined) setInternalValue(nextValue)
      onChange?.(nextValue)
      if (!multiple) setOpenState(false)
    }

    function selectNode(node: TreeSelectOption) {
      if (node.disabled) return
      if (multiple) {
        const next = selected.includes(node.value)
          ? selected.filter((key) => key !== node.value)
          : [...selected, node.value]
        updateSelection(next)
      } else if (allowClear && selected[0] === node.value) {
        updateSelection([])
      } else updateSelection([node.value])
    }

    function toggleExpanded(valueToToggle: string) {
      setExpanded((current) =>
        current.includes(valueToToggle)
          ? current.filter((key) => key !== valueToToggle)
          : [...current, valueToToggle],
      )
    }

    function focusNode(valueToFocus: string | undefined) {
      if (!valueToFocus) return
      setActiveValue(valueToFocus)
      nodeRefs.current[valueToFocus]?.focus()
    }

    function focusOffset(start: number, offset: -1 | 1) {
      for (
        let index = start + offset;
        index >= 0 && index < visibleNodes.length;
        index += offset
      ) {
        if (!visibleNodes[index].node.disabled) {
          focusNode(visibleNodes[index].node.value)
          return
        }
      }
    }

    function handleNodeKeyDown(
      event: KeyboardEvent<HTMLLIElement>,
      flatNode: FlatNode,
    ) {
      if (event.target !== event.currentTarget) return
      const expandKey = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
      const collapseKey = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
      const index = visibleNodes.findIndex(
        ({ node }) => node.value === flatNode.node.value,
      )
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        focusOffset(index, 1)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        focusOffset(index, -1)
      } else if (event.key === 'Home') {
        event.preventDefault()
        focusNode(firstEnabled)
      } else if (event.key === 'End') {
        event.preventDefault()
        focusNode(
          visibleNodes.filter(({ node }) => !node.disabled).at(-1)?.node.value,
        )
      } else if (event.key === expandKey && flatNode.node.children?.length) {
        event.preventDefault()
        if (effectiveExpanded.includes(flatNode.node.value)) {
          focusNode(
            visibleNodes.find(
              ({ parentValue, node }) =>
                parentValue === flatNode.node.value && !node.disabled,
            )?.node.value,
          )
        } else toggleExpanded(flatNode.node.value)
      } else if (event.key === collapseKey) {
        event.preventDefault()
        if (
          !search.trim() &&
          flatNode.node.children?.length &&
          effectiveExpanded.includes(flatNode.node.value)
        )
          toggleExpanded(flatNode.node.value)
        else focusNode(flatNode.parentValue)
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        selectNode(flatNode.node)
      } else if (event.key === 'Escape') {
        event.preventDefault()
        setOpenState(false)
      }
    }

    function updatePopupPosition() {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      const width = Math.min(rect.width, window.innerWidth - 16)
      const visualTop = window.visualViewport?.offsetTop ?? 0
      const visualBottom =
        visualTop + (window.visualViewport?.height ?? window.innerHeight)
      const spaceBelow = visualBottom - rect.bottom - 8
      const spaceAbove = rect.top - visualTop - 8
      const openAbove = spaceBelow < 220 && spaceAbove > spaceBelow
      const availableHeight = openAbove ? spaceAbove : spaceBelow
      setPopupStyle({
        position: 'fixed',
        ...(openAbove
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
        left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        width,
        maxHeight: Math.max(44, availableHeight),
      })
    }

    useLayoutEffect(() => {
      if (!isOpen) return
      updatePopupPosition()
      const update = () => updatePopupPosition()
      window.addEventListener('resize', update)
      window.addEventListener('scroll', update, true)
      window.visualViewport?.addEventListener('resize', update)
      window.visualViewport?.addEventListener('scroll', update)
      return () => {
        window.removeEventListener('resize', update)
        window.removeEventListener('scroll', update, true)
        window.visualViewport?.removeEventListener('resize', update)
        window.visualViewport?.removeEventListener('scroll', update)
      }
    }, [isOpen])

    useLayoutEffect(() => {
      if (
        isOpen &&
        !showSearch &&
        document.activeElement === triggerRef.current
      )
        nodeRefs.current[activeValue ?? firstEnabled ?? '']?.focus()
    }, [activeValue, firstEnabled, isOpen, showSearch])

    useLayoutEffect(() => {
      if (isOpen && showSearch)
        searchRef.current?.focus({ preventScroll: true })
    }, [isOpen, showSearch])

    useEffect(() => {
      if (!isOpen) return
      const first = visibleNodes.find(({ node }) => !node.disabled)?.node.value
      if (
        !activeValue ||
        !visibleNodes.some(({ node }) => node.value === activeValue)
      )
        setActiveValue(first)
    }, [activeValue, isOpen, visibleNodes])

    useEffect(() => {
      if (!isOpen) return
      function handlePointerDown(event: PointerEvent) {
        if (
          event.target instanceof Node &&
          !triggerRef.current?.contains(event.target) &&
          !contentRef.current?.contains(event.target)
        )
          setOpenState(false, false)
      }
      document.addEventListener('pointerdown', handlePointerDown, true)
      return () =>
        document.removeEventListener('pointerdown', handlePointerDown, true)
    }, [isOpen, setOpenState])

    function renderNodes(nodes: TreeSelectOption[], level = 0): ReactNode {
      return nodes.map((node) => {
        const hasChildren = Boolean(node.children?.length)
        const canToggle = hasChildren && !search.trim()
        const isExpanded = effectiveExpanded.includes(node.value)
        const isSelected = selected.includes(node.value)
        const flatNode = visibleNodes.find(
          ({ node: item }) => item.value === node.value,
        )
        return (
          <li
            key={node.value}
            ref={(element) => {
              nodeRefs.current[node.value] = element
            }}
            id={`${popupId}-${encodeURIComponent(node.value)}`}
            role="treeitem"
            className="outline-none"
            aria-labelledby={`${popupId}-${encodeURIComponent(node.value)}-label`}
            aria-selected={isSelected}
            aria-expanded={hasChildren ? isExpanded : undefined}
            aria-disabled={node.disabled || undefined}
            tabIndex={node.disabled || node.value !== activeValue ? -1 : 0}
            onFocus={(event) => {
              if (event.target === event.currentTarget)
                setActiveValue(node.value)
            }}
            onClick={(event) => {
              if (!(event.target instanceof Element) || node.disabled) return
              if (
                event.target.closest('[role="treeitem"]') !==
                event.currentTarget
              )
                return
              event.currentTarget.focus()
              if (event.target.closest('[data-tree-select-toggle]'))
                toggleExpanded(node.value)
              else selectNode(node)
            }}
            onKeyDown={(event) =>
              flatNode && handleNodeKeyDown(event, flatNode)
            }
          >
            <div
              className="flex min-h-11 items-center gap-1 ps-[calc(var(--ui-tree-select-level)*var(--space-lg))]"
              style={{ '--ui-tree-select-level': level } as CSSProperties}
            >
              {canToggle ? (
                <span
                  className="inline-grid size-11 shrink-0 place-items-center rounded-[var(--radius-sm)] border-0 bg-transparent text-muted-foreground hover:bg-accent"
                  data-tree-select-toggle=""
                  aria-hidden="true"
                >
                  {isExpanded ? '−' : '+'}
                </span>
              ) : (
                <span
                  className="inline-grid size-11 shrink-0"
                  aria-hidden="true"
                />
              )}
              <span
                className={cn(
                  'flex min-w-0 min-h-11 flex-1 cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border-0 bg-transparent px-2.5 py-2 text-start text-foreground focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-ring hover:bg-accent hover:text-accent-foreground',
                  isSelected && 'bg-accent text-accent-foreground',
                  node.disabled && 'cursor-not-allowed opacity-50',
                )}
              >
                <span
                  className="inline-grid w-5 shrink-0 place-items-center font-bold"
                  aria-hidden="true"
                >
                  {multiple && isSelected ? '✓' : ''}
                </span>
                <span id={`${popupId}-${encodeURIComponent(node.value)}-label`}>
                  {node.label}
                </span>
              </span>
            </div>
            {hasChildren && isExpanded && (
              <ul role="group" className="m-0 list-none p-0">
                {renderNodes(node.children ?? [], level + 1)}
              </ul>
            )}
          </li>
        )
      })
    }

    const triggerLabel = selectedLabels.length
      ? selectedLabels.map((item, index) => (
          <span
            key={index}
            className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
          >
            {item}
          </span>
        ))
      : placeholder

    return (
      <span className={cn('relative inline-flex w-full min-w-0', className)}>
        <button
          ref={(element) => {
            triggerRef.current = element
            if (typeof forwardedRef === 'function') forwardedRef(element)
            else if (forwardedRef) forwardedRef.current = element
          }}
          id={triggerId}
          type="button"
          role="combobox"
          aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : label)}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={[ariaDescribedBy, valueId]
            .filter(Boolean)
            .join(' ')}
          aria-invalid={ariaInvalid || undefined}
          aria-required={required || undefined}
          aria-expanded={isOpen}
          aria-controls={isOpen ? treeId : undefined}
          aria-haspopup="tree"
          disabled={disabled}
          className={cn(
            inputStyles,
            inputSizeStyles[resolvedSize],
            'flex cursor-pointer touch-manipulation items-center justify-between gap-2 text-start outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20',
            selectedLabels.length === 0 && 'text-muted-foreground',
            allowClear && selected.length > 0 && 'pe-16',
          )}
          onClick={() => setOpenState(!isOpen)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && isOpen) {
              event.preventDefault()
              setOpenState(false)
            } else if (
              (event.key === 'Enter' ||
                event.key === ' ' ||
                event.key === 'ArrowDown') &&
              !isOpen
            ) {
              event.preventDefault()
              setOpenState(true)
              setActiveValue(activeValue ?? firstEnabled)
            }
          }}
        >
          <span
            id={valueId}
            className="flex min-w-0 flex-1 flex-wrap items-center gap-1 overflow-hidden"
          >
            {triggerLabel}
          </span>
          <span className="shrink-0 text-muted-foreground" aria-hidden="true">
            ▾
          </span>
        </button>
        {allowClear && selected.length > 0 && !disabled && (
          <button
            type="button"
            className="absolute end-7 top-1/2 z-[1] inline-grid size-11 -translate-y-1/2 place-items-center rounded-full border-0 bg-transparent text-xl text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label={`清除${label}`}
            onClick={() => {
              updateSelection([])
              if (multiple) setOpenState(false)
            }}
          >
            ×
          </button>
        )}
        {name && (
          <input
            type="hidden"
            name={name}
            value={multiple ? selected.join(',') : (selected[0] ?? '')}
            required={required}
            readOnly
          />
        )}
        {isOpen && (
          <Portal>
            <div
              ref={contentRef}
              id={popupId}
              dir={direction}
              className="z-[90] max-h-[min(22rem,calc(100dvh-1rem))] overflow-auto rounded-[var(--ui-menu-radius)] border border-border bg-card p-1 text-foreground shadow-[0_12px_30px_rgb(0_0_0_/_0.16)]"
              style={popupStyle}
            >
              {showSearch && (
                <input
                  ref={searchRef}
                  type="search"
                  className={cn(inputStyles, 'mb-1')}
                  aria-label={`搜索${label}`}
                  value={search}
                  onChange={(event) => setSearch(event.currentTarget.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      event.preventDefault()
                      setOpenState(false)
                    } else if (event.key === 'ArrowDown') {
                      event.preventDefault()
                      focusNode(activeValue ?? firstEnabled)
                    }
                  }}
                />
              )}
              <div
                id={treeId}
                role="tree"
                aria-label={label}
                aria-multiselectable={multiple || undefined}
                className="outline-none"
              >
                {filteredTree.length ? (
                  <ul role="none" className="m-0 list-none p-0">
                    {renderNodes(filteredTree)}
                  </ul>
                ) : (
                  <p className="m-0 p-4 text-center text-muted-foreground">
                    暂无匹配项
                  </p>
                )}
              </div>
            </div>
          </Portal>
        )}
      </span>
    )
  },
)
