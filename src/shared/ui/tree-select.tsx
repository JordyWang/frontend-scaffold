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
import { Portal } from './portal'

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
      size = 'default',
      id,
      className,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
    },
    forwardedRef,
  ) {
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
      } else if (event.key === 'ArrowRight' && flatNode.node.children?.length) {
        event.preventDefault()
        if (effectiveExpanded.includes(flatNode.node.value)) {
          focusNode(
            visibleNodes.find(
              ({ parentValue, node }) =>
                parentValue === flatNode.node.value && !node.disabled,
            )?.node.value,
          )
        } else toggleExpanded(flatNode.node.value)
      } else if (event.key === 'ArrowLeft') {
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
            className="ui-tree-select__item"
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
              className="ui-tree-select__row"
              style={{ '--ui-tree-select-level': level } as CSSProperties}
            >
              {canToggle ? (
                <span
                  className="ui-tree-select__toggle"
                  data-tree-select-toggle=""
                  aria-hidden="true"
                >
                  {isExpanded ? '−' : '+'}
                </span>
              ) : (
                <span className="ui-tree-select__toggle" aria-hidden="true" />
              )}
              <span
                className={cn(
                  'ui-tree-select__option',
                  isSelected && 'ui-tree-select__option--selected',
                  node.disabled && 'ui-tree-select__option--disabled',
                )}
              >
                <span className="ui-tree-select__check" aria-hidden="true">
                  {multiple && isSelected ? '✓' : ''}
                </span>
                <span id={`${popupId}-${encodeURIComponent(node.value)}-label`}>
                  {node.label}
                </span>
              </span>
            </div>
            {hasChildren && isExpanded && (
              <ul role="group" className="ui-tree-select__group">
                {renderNodes(node.children ?? [], level + 1)}
              </ul>
            )}
          </li>
        )
      })
    }

    const triggerLabel = selectedLabels.length
      ? selectedLabels.map((item, index) => (
          <span key={index} className="ui-tree-select__tag">
            {item}
          </span>
        ))
      : placeholder

    return (
      <span className={cn('ui-tree-select', className)}>
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
            'ui-tree-select__trigger',
            `ui-tree-select--${size}`,
            selectedLabels.length === 0 && 'ui-tree-select__trigger--empty',
            allowClear &&
              selected.length > 0 &&
              'ui-tree-select__trigger--clearable',
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
          <span id={valueId} className="ui-tree-select__value">
            {triggerLabel}
          </span>
          <span className="ui-tree-select__icon" aria-hidden="true">
            ▾
          </span>
        </button>
        {allowClear && selected.length > 0 && !disabled && (
          <button
            type="button"
            className="ui-tree-select__clear"
            aria-label={`清除${label}`}
            onClick={() => updateSelection([])}
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
              className="ui-tree-select__content"
              style={popupStyle}
            >
              {showSearch && (
                <input
                  ref={searchRef}
                  type="search"
                  className="ui-tree-select__search"
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
                className="ui-tree-select__tree"
              >
                {filteredTree.length ? (
                  <ul role="none" className="ui-tree-select__list">
                    {renderNodes(filteredTree)}
                  </ul>
                ) : (
                  <p className="ui-tree-select__empty">暂无匹配项</p>
                )}
              </div>
            </div>
          </Portal>
        )}
      </span>
    )
  },
)
