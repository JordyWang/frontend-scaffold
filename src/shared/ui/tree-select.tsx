import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEventHandler,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { resolveComponentSize, useConfig } from './config-context'
import { Portal } from './portal'
import { Icon } from './icon'
import type { InputStatus, InputVariant } from './input'
import { Tree, type TreeHandle } from './tree'
import {
  changeCheck,
  checkBoundary,
  conductChecks,
  indexTree,
} from './tree-state'
import {
  filterTreeSelect,
  limitTreeSelectNodes,
  treeSelectCheckedValues,
  treeSelectNodes,
  type TreeSelectCheckedStrategy,
} from './tree-select-state'
import {
  inputSizeStyles,
  inputStatusStyles,
  inputStyles,
  inputVariantStyles,
} from './tailwind-styles'

export type TreeSelectOption = {
  value: string
  label: ReactNode
  searchText?: string
  children?: TreeSelectOption[]
  disabled?: boolean
  selectable?: boolean
  checkable?: boolean
  disableCheckbox?: boolean
  isLeaf?: boolean
  icon?: ReactNode
}
export type TreeSelectValue = string | string[]
export type TreeSelectPlacement =
  'bottomStart' | 'bottomEnd' | 'topStart' | 'topEnd'
export type TreeSelectPart =
  | 'root'
  | 'trigger'
  | 'value'
  | 'tag'
  | 'remove'
  | 'prefix'
  | 'suffix'
  | 'clear'
  | 'popup'
  | 'search'
  | 'tree'
  | 'item'
  | 'title'
  | 'switcher'
  | 'checkbox'
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
  checkable?: boolean
  checkStrictly?: boolean
  checkedStrategy?: TreeSelectCheckedStrategy
  maxCount?: number
  maxTagCount?: number
  removable?: boolean
  showSearch?: boolean
  searchValue?: string
  defaultSearchValue?: string
  onSearch?: (value: string) => void
  clearSearchOnSelect?: boolean
  allowClear?: boolean
  onClear?: () => void
  treeDefaultExpandAll?: boolean
  defaultExpandedValues?: string[]
  expandedValues?: string[]
  onExpand?: (values: string[]) => void
  showLine?: boolean
  showIcon?: boolean
  listHeight?: number
  virtual?: boolean
  placement?: TreeSelectPlacement
  popupWidth?: number
  variant?: InputVariant
  status?: InputStatus
  prefix?: ReactNode
  suffixIcon?: ReactNode
  emptyText?: string
  disabled?: boolean
  required?: boolean
  name?: string
  label?: string
  size?: 'small' | 'default' | 'large'
  id?: string
  className?: string
  classNames?: Partial<Record<TreeSelectPart, string>>
  onBlur?: FocusEventHandler<HTMLSpanElement>
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-label'?: string
  'aria-labelledby'?: string
}

const emptyValues: string[] = []
function normalized(value: TreeSelectValue | undefined, multiple: boolean) {
  const keys =
    typeof value === 'string' ? [value] : Array.isArray(value) ? value : []
  const unique = [...new Set(keys)]
  return multiple ? unique : unique.slice(0, 1)
}
function focusNext(trigger: HTMLElement, popup: HTMLElement | null) {
  const elements = [
    ...document.querySelectorAll<HTMLElement>(
      'button, a[href], input:not([type="hidden"]), select, textarea, [tabindex]',
    ),
  ].filter((element) => !popup?.contains(element))
  const next = elements
    .slice(elements.indexOf(trigger) + 1)
    .find(
      (element) =>
        element.tabIndex >= 0 &&
        !element.matches(':disabled, [inert] *') &&
        element.getClientRects().length,
    )
  ;(next ?? trigger).focus({ preventScroll: true })
}

/** Project values and checking rules; the popup shares Tree's keyboard and windowing behavior. */
export const TreeSelect = forwardRef<HTMLButtonElement, TreeSelectProps>(
  function TreeSelect(allProps, forwardedRef) {
    const {
      treeData,
      value,
      defaultValue,
      onChange,
      open,
      defaultOpen = false,
      onOpenChange,
      placeholder = '请选择',
      multiple = false,
      checkable = false,
      checkStrictly = false,
      checkedStrategy = 'leaf',
      maxCount,
      maxTagCount,
      removable = true,
      showSearch = false,
      searchValue,
      defaultSearchValue = '',
      onSearch,
      clearSearchOnSelect = false,
      allowClear = false,
      onClear,
      treeDefaultExpandAll = false,
      defaultExpandedValues = emptyValues,
      expandedValues,
      onExpand,
      showLine = false,
      showIcon = false,
      listHeight = 256,
      virtual = true,
      placement = 'bottomStart',
      popupWidth,
      variant = 'outlined',
      status = 'default',
      prefix,
      suffixIcon,
      emptyText = '暂无匹配项',
      disabled = false,
      required,
      name,
      label = '树形选择',
      size,
      id,
      className,
      classNames,
      onBlur,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
    } = allProps
    const { componentSize, direction } = useConfig()
    const resolvedSize = resolveComponentSize(componentSize, size)
    const generatedId = useId()
    const triggerId = id ?? 'tree-select-' + generatedId
    const valueId = triggerId + '-value'
    const popupId = triggerId + '-popup'
    const treeId = triggerId + '-tree'
    const limitId = triggerId + '-limit'
    const triggerRef = useRef<HTMLButtonElement | null>(null)
    const rootRef = useRef<HTMLSpanElement | null>(null)
    const popupRef = useRef<HTMLDivElement | null>(null)
    const searchRef = useRef<HTMLInputElement | null>(null)
    const treeRef = useRef<TreeHandle | null>(null)
    const lastFocus = useRef<HTMLElement | null>(null)
    const previousOpen = useRef(false)
    const closing = useRef(false)
    const [internalValue, setInternalValue] = useState<
      TreeSelectValue | undefined
    >(defaultValue)
    const [internalOpen, setInternalOpen] = useState(defaultOpen)
    const [internalSearch, setInternalSearch] = useState(defaultSearchValue)
    const [feedback, setFeedback] = useState('')
    const [popupStyle, setPopupStyle] = useState<CSSProperties>()
    const [actualPlacement, setActualPlacement] = useState(placement)
    const nodes = useMemo(() => treeSelectNodes(treeData), [treeData])
    const entries = useMemo(() => indexTree(nodes), [nodes])
    const [internalExpanded, setInternalExpanded] = useState(() =>
      treeDefaultExpandAll
        ? [...entries.values()]
            .filter(({ node }) => node.children?.length)
            .map(({ node }) => node.key)
        : defaultExpandedValues,
    )
    const isMultiple = multiple || checkable
    const valueControlled = Object.prototype.hasOwnProperty.call(
      allProps,
      'value',
    )
    const searchControlled = Object.prototype.hasOwnProperty.call(
      allProps,
      'searchValue',
    )
    const selected = normalized(
      valueControlled ? value : internalValue,
      isMultiple,
    )
    const search = searchControlled ? (searchValue ?? '') : internalSearch
    const isOpen = (open ?? internalOpen) && !disabled
    const expanded = expandedValues ?? internalExpanded
    const checks = useMemo(
      () => conductChecks(selected, entries, checkStrictly),
      [selected, entries, checkStrictly],
    )
    const unresolved = selected.filter((key) => !entries.has(key))
    const checkedValues = checkable
      ? [
          ...treeSelectCheckedValues(
            checks.checked,
            entries,
            checkedStrategy,
            checkStrictly,
          ),
          ...unresolved,
        ]
      : selected
    const count = checkable
      ? treeSelectCheckedValues(checks.checked, entries, 'leaf', checkStrictly)
          .length + unresolved.length
      : selected.length
    const limit =
      isMultiple && maxCount !== undefined && Number.isFinite(maxCount)
        ? Math.max(0, Math.floor(maxCount))
        : undefined
    const tagLimit =
      maxTagCount !== undefined && Number.isFinite(maxTagCount)
        ? Math.max(0, Math.floor(maxTagCount))
        : undefined
    const displayed =
      tagLimit === undefined || !isMultiple
        ? checkedValues
        : checkedValues.slice(0, tagLimit)
    const omitted = checkedValues.length - displayed.length
    const limitedNodes = limitTreeSelectNodes(
      nodes,
      entries,
      new Set(selected),
      checks.checked,
      count,
      limit,
      checkable,
      checkStrictly,
    )
    const filtered = filterTreeSelect(limitedNodes, search)
    const filteredEntries = useMemo(() => indexTree(filtered), [filtered])
    const effectiveExpanded = search.trim()
      ? [
          ...new Set([
            ...expanded,
            ...[...filteredEntries.values()]
              .filter(({ node }) => node.children?.length)
              .map(({ node }) => node.key),
          ]),
        ]
      : expanded
    const available = [...filteredEntries.values()].filter(
      ({ node, ancestors }) =>
        !node.disabled &&
        ancestors.every((key) => effectiveExpanded.includes(key)),
    )
    const firstEnabled = available[0]?.node.key
    const popupHeight = Math.max(
      44,
      Math.min(
        Number.isFinite(listHeight) && listHeight > 0 ? listHeight : 256,
        Number(popupStyle?.maxHeight ?? 352) - (showSearch ? 56 : 8),
      ),
    )

    if (!valueControlled && selected.some((key) => !entries.has(key))) {
      const remaining = selected.filter((key) => entries.has(key))
      setInternalValue(isMultiple ? remaining : remaining[0])
    }
    if (
      expandedValues === undefined &&
      internalExpanded.some((key) => !entries.has(key))
    )
      setInternalExpanded(internalExpanded.filter((key) => entries.has(key)))
    if (disabled && open === undefined && internalOpen) setInternalOpen(false)

    function setSearch(next: string) {
      if (!searchControlled) setInternalSearch(next)
      if (next !== search) onSearch?.(next)
    }
    function setOpenState(next: boolean, restoreFocus = false) {
      if (disabled && next) return
      closing.current = !next
      if (!next)
        queueMicrotask(() => {
          closing.current = false
        })
      if (open === undefined) setInternalOpen(next)
      onOpenChange?.(next)
      if (!next) {
        setSearch('')
        if (restoreFocus) triggerRef.current?.focus({ preventScroll: true })
      }
    }
    function changeSelection(next: string[], close = !isMultiple) {
      const unique = [...new Set(next)]
      const nextValue = isMultiple ? unique : unique[0]
      if (!valueControlled) setInternalValue(nextValue)
      setFeedback('')
      onChange?.(nextValue)
      if (close) setOpenState(false, true)
      else if (clearSearchOnSelect) setSearch('')
    }
    function changeChecks(key: string) {
      const node = entries.get(key)?.node
      if (!node || checkBoundary(node)) return
      const next = conductChecks(
        [...changeCheck(key, checks.checked, entries, checkStrictly)],
        entries,
        checkStrictly,
      )
      const nextCount =
        treeSelectCheckedValues(next.checked, entries, 'leaf', checkStrictly)
          .length + unresolved.length
      if (limit !== undefined && nextCount > limit && nextCount > count) {
        setFeedback('最多选择 ' + limit + ' 项，请先取消已有选择。')
        return
      }
      changeSelection([
        ...treeSelectCheckedValues(
          next.checked,
          entries,
          checkedStrategy,
          checkStrictly,
        ),
        ...unresolved,
      ])
    }
    function changeSelected(next: string[]) {
      if (
        limit !== undefined &&
        next.length > limit &&
        next.length > selected.length
      ) {
        setFeedback('最多选择 ' + limit + ' 项，请先取消已有选择。')
        return
      }
      // Preserve the existing single-value allowClear behavior.
      if (!isMultiple && allowClear && next[0] === selected[0])
        changeSelection([])
      else changeSelection(next)
    }
    function removeValue(key: string) {
      if (disabled) return
      if (checkable && entries.has(key)) {
        const node = entries.get(key)!.node
        const next = checkBoundary(node)
          ? new Set([...checks.checked].filter((value) => value !== key))
          : changeCheck(key, checks.checked, entries, checkStrictly)
        const result = conductChecks([...next], entries, checkStrictly)
        changeSelection(
          [
            ...treeSelectCheckedValues(
              result.checked,
              entries,
              checkedStrategy,
              checkStrictly,
            ),
            ...unresolved,
          ],
          false,
        )
      } else
        changeSelection(
          selected.filter((value) => value !== key),
          false,
        )
      triggerRef.current?.focus({ preventScroll: true })
    }
    function focusTree(key = firstEnabled) {
      if (key) treeRef.current?.scrollTo({ key, focus: true })
      else
        popupRef.current
          ?.querySelector<HTMLElement>('[role="tree"]')
          ?.focus({ preventScroll: true })
    }
    function inside(element: Node) {
      // Tree may focus in a child layout effect before the popup ref attaches.
      return (
        rootRef.current?.contains(element) ||
        popupRef.current?.contains(element) ||
        document.getElementById(popupId)?.contains(element)
      )
    }

    useLayoutEffect(() => {
      if (!isOpen) return
      const position = () => {
        const anchor = triggerRef.current?.getBoundingClientRect()
        if (!anchor) return
        const viewport = window.visualViewport
        const leftEdge = viewport?.offsetLeft ?? 0
        const topEdge = viewport?.offsetTop ?? 0
        const rightEdge = leftEdge + (viewport?.width ?? window.innerWidth)
        const bottomEdge = topEdge + (viewport?.height ?? window.innerHeight)
        const width = Math.max(
          0,
          Math.min(
            popupWidth !== undefined &&
              Number.isFinite(popupWidth) &&
              popupWidth > 0
              ? popupWidth
              : anchor.width,
            rightEdge - leftEdge - 16,
          ),
        )
        const below = bottomEdge - anchor.bottom - 8
        const above = anchor.top - topEdge - 8
        const preferredAbove = placement.startsWith('top')
        const preferredSpace = preferredAbove ? above : below
        const oppositeSpace = preferredAbove ? below : above
        const desiredHeight = Math.min(
          (Number.isFinite(listHeight) && listHeight > 0 ? listHeight : 256) +
            (showSearch ? 56 : 8),
          220,
        )
        const openAbove =
          preferredSpace < desiredHeight && oppositeSpace > preferredSpace
            ? !preferredAbove
            : preferredAbove
        const height = Math.max(44, openAbove ? above : below)
        const endAligned = placement.endsWith('End')
        const preferredLeft =
          (direction === 'rtl') !== endAligned
            ? anchor.right - width
            : anchor.left
        setActualPlacement(
          ((openAbove ? 'top' : 'bottom') +
            (endAligned ? 'End' : 'Start')) as TreeSelectPlacement,
        )
        setPopupStyle({
          position: 'fixed',
          left: Math.max(
            leftEdge + 8,
            Math.min(preferredLeft, rightEdge - width - 8),
          ),
          ...(openAbove
            ? { bottom: window.innerHeight - anchor.top + 4 }
            : { top: anchor.bottom + 4 }),
          width,
          maxHeight: height,
          visibility:
            anchor.bottom < topEdge ||
            anchor.top > bottomEdge ||
            anchor.right < leftEdge ||
            anchor.left > rightEdge
              ? 'hidden'
              : 'visible',
        })
      }
      position()
      const observer =
        typeof ResizeObserver === 'undefined'
          ? null
          : new ResizeObserver(position)
      if (triggerRef.current) observer?.observe(triggerRef.current)
      window.addEventListener('resize', position)
      window.addEventListener('scroll', position, true)
      window.visualViewport?.addEventListener('resize', position)
      window.visualViewport?.addEventListener('scroll', position)
      return () => {
        observer?.disconnect()
        window.removeEventListener('resize', position)
        window.removeEventListener('scroll', position, true)
        window.visualViewport?.removeEventListener('resize', position)
        window.visualViewport?.removeEventListener('scroll', position)
      }
    }, [isOpen, direction, placement, popupWidth, listHeight, showSearch])

    useLayoutEffect(() => {
      const before = previousOpen.current
      previousOpen.current = isOpen
      if (isOpen && !before) {
        if (showSearch) searchRef.current?.focus({ preventScroll: true })
        else {
          const key = selected.find((key) =>
            available.some(({ node }) => node.key === key),
          )
          focusTree(key ?? firstEnabled)
        }
      } else if (
        !isOpen &&
        before &&
        lastFocus.current &&
        !lastFocus.current.isConnected &&
        document.activeElement === document.body &&
        !disabled
      ) {
        triggerRef.current?.focus({ preventScroll: true })
      }
    })
    useEffect(() => {
      if (!isOpen) return
      const outside = (event: PointerEvent) => {
        if (event.target instanceof Node && !inside(event.target))
          setOpenState(false)
      }
      document.addEventListener('pointerdown', outside, true)
      return () => document.removeEventListener('pointerdown', outside, true)
    })

    return (
      <span
        ref={rootRef}
        dir={direction}
        className={cn(
          'relative inline-flex w-full min-w-0 self-start',
          classNames?.root,
          className,
        )}
        onFocusCapture={(event) => {
          lastFocus.current = event.target
        }}
        onKeyDown={(event) => {
          if (
            event.key !== 'Tab' ||
            event.defaultPrevented ||
            !(event.target instanceof HTMLButtonElement) ||
            !rootRef.current?.contains(event.target)
          )
            return
          // Keep explicit composite controls reachable on mobile WebKit too.
          const buttons = [
            ...rootRef.current.querySelectorAll<HTMLButtonElement>(
              'button:not(:disabled)',
            ),
          ]
          const next =
            buttons[buttons.indexOf(event.target) + (event.shiftKey ? -1 : 1)]
          if (next) {
            event.preventDefault()
            next.focus({ preventScroll: true })
          }
        }}
        onBlur={(event) => {
          if (
            event.relatedTarget instanceof Node &&
            inside(event.relatedTarget)
          )
            return
          if (event.relatedTarget) lastFocus.current = null
          if (isOpen && !closing.current) setOpenState(false)
          onBlur?.(event)
        }}
      >
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
          aria-describedby={[
            ariaDescribedBy,
            valueId,
            limit !== undefined ? limitId : undefined,
          ]
            .filter(Boolean)
            .join(' ')}
          aria-invalid={status === 'error' || ariaInvalid || undefined}
          data-status={status === 'default' ? undefined : status}
          aria-required={required || undefined}
          aria-expanded={isOpen}
          aria-controls={isOpen ? treeId : undefined}
          aria-haspopup="tree"
          disabled={disabled}
          className={cn(
            inputStyles,
            inputVariantStyles[variant],
            inputStatusStyles[status],
            inputSizeStyles[resolvedSize],
            'absolute inset-0 h-full cursor-pointer touch-manipulation text-start outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20',
            checkedValues.length === 0 && 'text-muted-foreground',
            allowClear && checkedValues.length > 0 && 'pe-16',
            classNames?.trigger,
          )}
          onClick={() => setOpenState(!isOpen)}
          onKeyDown={(event) => {
            if (
              isMultiple &&
              removable &&
              checkedValues.length &&
              ['Backspace', 'Delete'].includes(event.key)
            ) {
              event.preventDefault()
              removeValue(checkedValues.at(-1)!)
            } else if (event.key === 'Escape' && isOpen) {
              event.preventDefault()
              setOpenState(false, true)
            } else if (
              !isOpen &&
              ['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)
            ) {
              event.preventDefault()
              setOpenState(true)
            } else if (isOpen && event.key === 'ArrowDown') {
              event.preventDefault()
              focusTree()
            }
          }}
        >
          <span id={valueId} className="sr-only">
            {checkedValues.length
              ? checkedValues.map((key) => (
                  <span key={key}>{entries.get(key)?.node.title ?? key} </span>
                ))
              : placeholder}
            {omitted > 0 && <> +{omitted}</>}
            {limit !== undefined && (
              <>
                {' '}
                {count}/{limit}
              </>
            )}
          </span>
        </button>
        <span
          className={cn(
            'pointer-events-none relative flex min-h-[max(44px,var(--ui-control-height))] w-full min-w-0 items-center justify-between gap-2 border border-transparent px-3 py-2.5 text-start text-base leading-6 text-card-foreground',
            inputSizeStyles[resolvedSize],
            checkedValues.length === 0 && 'text-muted-foreground',
            allowClear && checkedValues.length > 0 && 'pe-16',
            disabled && 'opacity-[0.55]',
          )}
        >
          {prefix && (
            <span
              aria-hidden="true"
              className={cn('shrink-0', classNames?.prefix)}
            >
              {prefix}
            </span>
          )}
          <span
            className={cn(
              'flex min-w-0 flex-1 flex-wrap items-center gap-1 overflow-hidden',
              classNames?.value,
            )}
          >
            {checkedValues.length ? (
              <>
                {displayed.map((key) => (
                  <span
                    key={key}
                    className={cn(
                      'inline-flex max-w-full min-w-0 items-center gap-1',
                      isMultiple &&
                        'rounded-[var(--radius-sm)] bg-accent px-2 py-0.5 text-sm text-accent-foreground',
                      classNames?.tag,
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
                    >
                      {entries.get(key)?.node.title ?? key}
                    </span>
                    {isMultiple && removable && !disabled && (
                      <button
                        type="button"
                        aria-label={
                          '移除' + (entries.get(key)?.node.textValue ?? key)
                        }
                        className={cn(
                          'pointer-events-auto inline-grid size-11 shrink-0 touch-manipulation place-items-center rounded-[var(--radius-sm)] text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring',
                          classNames?.remove,
                        )}
                        onClick={() => removeValue(key)}
                      >
                        <Icon name="close" size={14} />
                      </button>
                    )}
                  </span>
                ))}
                {omitted > 0 && (
                  <span
                    aria-label={'另有 ' + omitted + ' 项'}
                    className="text-sm text-muted-foreground"
                  >
                    +{omitted}
                  </span>
                )}
              </>
            ) : (
              <span aria-hidden="true">{placeholder}</span>
            )}
          </span>
          {limit !== undefined && (
            <span
              className="shrink-0 text-sm text-muted-foreground"
              aria-hidden="true"
            >
              {count}/{limit}
            </span>
          )}
          <span
            className={cn('shrink-0 text-muted-foreground', classNames?.suffix)}
            aria-hidden="true"
          >
            {suffixIcon ?? (
              <Icon name="arrowRight" size={16} className="rotate-90" />
            )}
          </span>
        </span>
        {limit !== undefined && (
          <span id={limitId} className="sr-only">
            已选择 {count} 项，最多选择 {limit} 项
          </span>
        )}
        {allowClear && checkedValues.length > 0 && !disabled && (
          <button
            type="button"
            aria-label={'清除' + label}
            className={cn(
              'absolute end-7 top-1/2 z-[1] inline-grid size-11 -translate-y-1/2 touch-manipulation place-items-center rounded-full border-0 bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring',
              classNames?.clear,
            )}
            onClick={() => {
              changeSelection([], true)
              onClear?.()
            }}
          >
            <Icon name="close" size={16} />
          </button>
        )}
        {name && (
          <input
            type="hidden"
            name={name}
            value={isMultiple ? selected.join(',') : (selected[0] ?? '')}
            disabled={disabled}
            readOnly
          />
        )}
        <span role="status" aria-live="polite" className="sr-only">
          {feedback}
        </span>
        {isOpen && (
          <Portal>
            <div
              ref={popupRef}
              id={popupId}
              data-placement={actualPlacement}
              dir={direction}
              className={cn(
                'z-[90] flex min-w-0 flex-col overflow-auto rounded-[var(--ui-menu-radius)] border border-border bg-card p-1 text-foreground shadow-[0_12px_30px_rgb(0_0_0_/_0.16)]',
                classNames?.popup,
              )}
              style={popupStyle}
              onKeyDownCapture={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault()
                  event.stopPropagation()
                  setOpenState(false, true)
                } else if (event.key === 'Tab') {
                  const inSearch = event.target === searchRef.current
                  if (inSearch && !event.shiftKey && available.length) return
                  if (!inSearch && event.shiftKey && showSearch) {
                    event.preventDefault()
                    searchRef.current?.focus({ preventScroll: true })
                    return
                  }
                  event.preventDefault()
                  const popup = popupRef.current
                  setOpenState(false)
                  if (event.shiftKey)
                    triggerRef.current?.focus({ preventScroll: true })
                  else if (triggerRef.current)
                    focusNext(triggerRef.current, popup)
                } else if (
                  checkable &&
                  event.key === 'Enter' &&
                  !event.altKey &&
                  !event.ctrlKey &&
                  !event.metaKey &&
                  !event.shiftKey &&
                  event.target instanceof HTMLElement &&
                  event.target.getAttribute('role') === 'treeitem'
                ) {
                  event.preventDefault()
                  changeChecks(event.target.dataset.treeKey!)
                }
              }}
            >
              {showSearch && (
                <input
                  ref={searchRef}
                  type="search"
                  className={cn(
                    inputStyles,
                    'mb-1 shrink-0',
                    classNames?.search,
                  )}
                  aria-label={'搜索' + label}
                  aria-controls={treeId}
                  value={search}
                  onChange={(event) => setSearch(event.currentTarget.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                      event.preventDefault()
                      focusTree()
                    }
                  }}
                />
              )}
              <Tree
                ref={treeRef}
                id={treeId}
                label={label}
                treeData={filtered}
                height={popupHeight}
                virtual={virtual}
                expandedKeys={effectiveExpanded}
                onExpand={(keys) => {
                  if (search.trim()) return
                  if (expandedValues === undefined) setInternalExpanded(keys)
                  onExpand?.(keys)
                }}
                multiple={isMultiple}
                selectable={!checkable}
                selectedKeys={checkable ? [] : selected}
                onSelect={(key) => {
                  if (!isMultiple) changeSelected([key])
                }}
                onSelectionChange={(_, info) => {
                  if (isMultiple)
                    changeSelected(
                      selected.includes(info.node.key)
                        ? selected.filter((key) => key !== info.node.key)
                        : [...selected, info.node.key],
                    )
                }}
                checkable={checkable}
                checkStrictly
                checkedKeys={[...checks.checked]}
                halfCheckedKeys={[...checks.halfChecked]}
                onCheck={(_, info) => changeChecks(info.node.key)}
                aria-describedby={limit !== undefined ? limitId : undefined}
                onClickCapture={(event) => {
                  if (
                    !checkable ||
                    !(event.target instanceof Element) ||
                    !event.target.closest('[data-tree-label]') ||
                    event.target.closest(
                      'button, a, input, select, textarea, [contenteditable="true"]',
                    )
                  )
                    return
                  const item =
                    event.target.closest<HTMLElement>('[data-tree-key]')
                  if (!item || !event.currentTarget.contains(item)) return
                  if (entries.get(item.dataset.treeKey!)?.node.disabled) return
                  event.preventDefault()
                  event.stopPropagation()
                  item.focus({ preventScroll: true })
                  changeChecks(item.dataset.treeKey!)
                }}
                showLine={showLine}
                showIcon={showIcon}
                emptyText={emptyText}
                classNames={{
                  root: cn(
                    'rounded-none border-0 bg-transparent p-0',
                    classNames?.tree,
                  ),
                  item: classNames?.item,
                  title: classNames?.title,
                  switcher: classNames?.switcher,
                  checkbox: classNames?.checkbox,
                }}
              />
            </div>
          </Portal>
        )}
      </span>
    )
  },
)
