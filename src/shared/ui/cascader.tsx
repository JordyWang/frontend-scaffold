import {
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEventHandler,
  type ReactNode,
  type Ref,
} from 'react'
import { cn } from '@/shared/lib/utils'
import {
  resolveComponentSize,
  useConfig,
  type ControlSize,
} from './config-context'
import { Portal } from './portal'
import { Icon } from './icon'
import type { InputStatus, InputVariant } from './input'
import {
  inputSizeStyles,
  inputStatusStyles,
  inputStyles,
  inputVariantStyles,
} from './tailwind-styles'
import { CascaderNative } from './cascader-native'
import { CascaderPanel, type CascaderPanelHandle } from './cascader-panel'
import {
  cascaderKey,
  cascaderLevels,
  cascaderText,
  indexCascader,
  validCascaderPath,
} from './cascader-state'
import { cascaderChecks, type CascaderCheckedStrategy } from './cascader-checks'
import { CascaderTags } from './cascader-tags'
import { useCascaderLoader } from './cascader-loader'
import { CascaderLoadFeedback } from './cascader-load-feedback'

export type CascaderOption = {
  value: string
  label: ReactNode
  searchText?: string
  children?: CascaderOption[]
  disabled?: boolean
  disableCheckbox?: boolean
  isLeaf?: boolean
}
export type CascaderLoadChildren = (
  path: CascaderOption[],
  options: { signal: AbortSignal },
) => Promise<CascaderOption[]>
export type CascaderPlacement =
  'bottomStart' | 'bottomEnd' | 'topStart' | 'topEnd'
export type CascaderPart =
  | 'root'
  | 'trigger'
  | 'value'
  | 'prefix'
  | 'suffix'
  | 'clear'
  | 'popup'
  | 'search'
  | 'panel'
  | 'column'
  | 'item'
  | 'itemLabel'
  | 'expandIcon'
  | 'result'
  | 'checkbox'
  | 'tags'
  | 'tag'
  | 'tagLabel'
  | 'tagRemove'
  | 'tagOverflow'
  | 'loading'
  | 'error'
  | 'loadAction'
export type CascaderHandle = { focus: () => void; blur: () => void }
export type CascaderTagRenderProps = {
  path: string[]
  options: CascaderOption[]
  label: ReactNode
  disabled: boolean
}
export type { CascaderCheckedStrategy }
type CascaderBaseProps = {
  options: CascaderOption[]
  loadChildren?: CascaderLoadChildren
  loadVersion?: string | number
  onLoad?: (path: CascaderOption[], children: CascaderOption[]) => void
  onLoadError?: (error: unknown, path: CascaderOption[]) => void
  loadingIcon?: ReactNode
  changeOnSelect?: boolean
  expandTrigger?: 'click' | 'hover'
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  showSearch?: boolean
  searchValue?: string
  defaultSearchValue?: string
  onSearch?: (value: string) => void
  filterOption?: (query: string, path: CascaderOption[]) => boolean
  searchLimit?: number
  allowClear?: boolean
  onClear?: () => void
  placeholder?: string
  emptyText?: string
  listHeight?: number
  columnWidth?: number
  popupWidth?: number
  placement?: CascaderPlacement
  prefix?: ReactNode
  suffixIcon?: ReactNode
  expandIcon?: ReactNode
  displayRender?: (path: CascaderOption[]) => ReactNode
  optionRender?: (option: CascaderOption, path: CascaderOption[]) => ReactNode
  label?: string
  id?: string
  name?: string
  required?: boolean
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-labelledby'?: string
  'aria-label'?: string
  disabled?: boolean
  size?: ControlSize
  variant?: InputVariant
  status?: InputStatus
  className?: string
  classNames?: Partial<Record<CascaderPart, string>>
  onBlur?: FocusEventHandler<HTMLSpanElement>
  ref?: Ref<CascaderHandle>
}
export type CascaderSingleProps = CascaderBaseProps & {
  multiple?: false
  mode?: 'popup' | 'inline' | 'panel'
  value?: string[]
  defaultValue?: string[]
  onChange?: (value: string[]) => void
  showCheckedStrategy?: never
  maxTagCount?: never
  maxTagPlaceholder?: never
  tagRender?: never
  removeIcon?: never
  autoClearSearchValue?: never
}
export type CascaderMultipleProps = CascaderBaseProps & {
  multiple: true
  mode?: 'popup' | 'panel'
  value?: string[][]
  defaultValue?: string[][]
  onChange?: (value: string[][]) => void
  showCheckedStrategy?: CascaderCheckedStrategy
  maxTagCount?: number
  maxTagPlaceholder?: ReactNode | ((omitted: string[][]) => ReactNode)
  tagRender?: (props: CascaderTagRenderProps) => ReactNode
  removeIcon?: ReactNode
  autoClearSearchValue?: boolean
}
export type CascaderProps = CascaderSingleProps | CascaderMultipleProps

function focusAfter(trigger: HTMLElement, popup: HTMLElement | null) {
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

/** Project path values with a column browser; native inline fields remain available for forms. */
export function Cascader(allProps: CascaderProps) {
  const {
    options: sourceOptions,
    loadChildren,
    loadVersion = 0,
    onLoad,
    onLoadError,
    loadingIcon,
    value,
    defaultValue = [],
    multiple = false,
    showCheckedStrategy = 'parent',
    maxTagCount,
    maxTagPlaceholder,
    tagRender,
    removeIcon,
    autoClearSearchValue = true,
    mode = 'popup',
    changeOnSelect = false,
    expandTrigger = 'click',
    open,
    defaultOpen = false,
    onOpenChange,
    showSearch = false,
    searchValue,
    defaultSearchValue = '',
    onSearch,
    filterOption,
    searchLimit = 50,
    allowClear = false,
    onClear,
    placeholder = '请选择',
    emptyText = '暂无匹配选项',
    listHeight = 256,
    columnWidth = 176,
    popupWidth,
    placement = 'bottomStart',
    prefix,
    suffixIcon,
    expandIcon,
    displayRender,
    optionRender,
    label = '级联选择',
    id,
    name,
    required,
    disabled = false,
    size,
    variant = 'outlined',
    status = 'default',
    className,
    classNames,
    onBlur,
    ref,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    'aria-labelledby': ariaLabelledBy,
    'aria-label': ariaLabel,
  } = allProps
  const { componentSize, direction } = useConfig()
  const resolvedSize = resolveComponentSize(componentSize, size)
  const generatedId = useId()
  const triggerId = id ?? `cascader-${generatedId}`
  const valueId = triggerId + '-value'
  const popupId = triggerId + '-popup'
  const panelId = triggerId + '-panel'
  const triggerRef = useRef<HTMLButtonElement>(null)
  const rootRef = useRef<HTMLSpanElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<CascaderPanelHandle>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const previousOpen = useRef(false)
  const lastFocus = useRef<HTMLElement | null>(null)
  const closing = useRef(false)
  const [internal, setInternal] = useState<string[] | string[][]>(defaultValue)
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const [internalSearch, setInternalSearch] = useState(defaultSearchValue)
  const loader = useCascaderLoader({
    options: sourceOptions,
    loadChildren,
    loadVersion,
    disabled,
    onLoad,
    onLoadError,
  })
  const options = loader.options
  const controlled = Object.prototype.hasOwnProperty.call(allProps, 'value')
  const searchControlled = Object.prototype.hasOwnProperty.call(
    allProps,
    'searchValue',
  )
  const rawValue = controlled ? (value ?? []) : internal
  const path = multiple ? [] : (rawValue as string[])
  const paths = multiple ? (rawValue as string[][]) : []
  const entries = useMemo(() => indexCascader(options), [options])
  const checks = cascaderChecks(entries, paths)
  const selectedPaths = multiple
    ? checks.values(checks.leaves, showCheckedStrategy)
    : []
  const validPath = validCascaderPath(options, path)
  const selectedOptions = cascaderLevels(options, path).flatMap(
    ({ selected }) => (selected ? [selected] : []),
  )
  const initialPath = multiple
    ? validCascaderPath(options, paths[0] ?? [])
    : validPath
  const [navigation, setNavigation] = useState(initialPath)
  const [popupStyle, setPopupStyle] = useState<CSSProperties>()
  const [actualPlacement, setActualPlacement] = useState(placement)
  const search = searchControlled ? (searchValue ?? '') : internalSearch
  const isOpen = mode === 'popup' && (open ?? internalOpen) && !disabled
  const height =
    Number.isFinite(listHeight) && listHeight > 0
      ? Math.max(44, listHeight)
      : 256
  const width =
    Number.isFinite(columnWidth) && columnWidth > 0
      ? Math.max(88, columnWidth)
      : 176
  const limit = Number.isFinite(searchLimit)
    ? Math.max(0, Math.floor(searchLimit))
    : 50
  const panelHeight = isOpen
    ? Math.max(
        44,
        Math.min(
          height,
          Number(popupStyle?.maxHeight ?? height + 64) - (showSearch ? 56 : 8),
        ),
      )
    : height
  const browseLevels = cascaderLevels(
    options,
    mode === 'inline' ? validPath : navigation,
  )
  const browseLast = browseLevels.at(-1)?.selected
  const loadingEntry =
    browseLast && loader.expandable(browseLast) && !browseLast.children?.length
      ? entries.get(
          cascaderKey(
            (mode === 'inline' ? validPath : navigation).slice(
              0,
              browseLevels.length,
            ),
          ),
        )
      : undefined
  const columns = browseLevels.length + Number(Boolean(loadingEntry))
  if (disabled && open === undefined && internalOpen) setInternalOpen(false)
  useLayoutEffect(() => {
    const visible = !disabled && (mode !== 'popup' || isOpen) && !search.trim()
    const browsePath =
      mode === 'inline' ? validPath : validCascaderPath(options, navigation)
    const active = new Set(
      browsePath.map((_, depth) => cascaderKey(browsePath.slice(0, depth + 1))),
    )
    for (const [key, state] of loader.statuses)
      if (state === 'loading' && (!visible || !active.has(key)))
        loader.cancel(key)
    if (visible)
      for (const key of active) {
        const entry = entries.get(key)
        if (
          entry &&
          !entry.disabled &&
          loader.expandable(entry.option) &&
          !entry.option.children?.length &&
          loader.statuses.get(key) === undefined
        )
          void loader.request(key)
      }
  }, [
    loader,
    options,
    entries,
    navigation,
    validPath,
    isOpen,
    mode,
    disabled,
    search,
  ])

  function setSearch(next: string) {
    if (!searchControlled) setInternalSearch(next)
    if (next !== search) onSearch?.(next)
  }
  function setOpen(next: boolean, restoreFocus = false) {
    if (disabled && next) return
    closing.current = !next
    if (!next)
      queueMicrotask(() => {
        closing.current = false
      })
    if (open === undefined) setInternalOpen(next)
    onOpenChange?.(next)
    if (next)
      setNavigation(
        multiple
          ? validCascaderPath(options, selectedPaths[0] ?? [])
          : validPath,
      )
    else {
      setSearch('')
      if (restoreFocus) triggerRef.current?.focus({ preventScroll: true })
    }
  }
  function changePath(next: string[], close = false) {
    if (disabled || allProps.multiple) return
    if (!controlled) setInternal(next)
    allProps.onChange?.(next)
    if (close && mode === 'popup') setOpen(false, true)
  }
  function changePaths(next: string[][]) {
    if (disabled || !allProps.multiple) return
    if (!controlled) setInternal(next)
    allProps.onChange?.(next)
  }
  function removePath(next: string[]) {
    const entry = entries.get(cascaderKey(next))
    if (disabled || entry?.disabled || entry?.option.disableCheckbox) return
    changePaths(checks.remove(next, showCheckedStrategy))
    triggerRef.current?.focus({ preventScroll: true })
  }
  function inside(node: Node) {
    // Child layout effects can focus before a parent popup ref attaches.
    return (
      rootRef.current?.contains(node) ||
      popupRef.current?.contains(node) ||
      document.getElementById(popupId)?.contains(node)
    )
  }
  useImperativeHandle(ref, () => ({
    focus() {
      if (disabled) return
      if (mode === 'popup') triggerRef.current?.focus({ preventScroll: true })
      else if (mode === 'panel') panelRef.current?.focus()
      else
        rootRef.current?.querySelector('select')?.focus({ preventScroll: true })
    },
    blur() {
      lastFocus.current = null
      const element = document.activeElement
      if (element instanceof HTMLElement && inside(element)) element.blur()
    },
  }))

  useLayoutEffect(() => {
    if (!isOpen) return
    const position = () => {
      const anchor = triggerRef.current?.getBoundingClientRect()
      if (!anchor) return
      const viewport = window.visualViewport
      const leftEdge = viewport?.offsetLeft ?? 0,
        topEdge = viewport?.offsetTop ?? 0
      const rightEdge = leftEdge + (viewport?.width ?? window.innerWidth),
        bottomEdge = topEdge + (viewport?.height ?? window.innerHeight)
      const resolvedWidth = Math.max(
        0,
        Math.min(
          popupWidth !== undefined &&
            Number.isFinite(popupWidth) &&
            popupWidth > 0
            ? popupWidth
            : Math.max(anchor.width, width * Math.min(columns, 3) + 8),
          rightEdge - leftEdge - 16,
        ),
      )
      const below = bottomEdge - anchor.bottom - 8,
        above = anchor.top - topEdge - 8
      const preferredAbove = placement.startsWith('top')
      const preferredSpace = preferredAbove ? above : below,
        oppositeSpace = preferredAbove ? below : above
      const openAbove =
        preferredSpace < Math.min(height + (showSearch ? 56 : 8), 220) &&
        oppositeSpace > preferredSpace
          ? !preferredAbove
          : preferredAbove
      const endAligned = placement.endsWith('End')
      const preferredLeft =
        (direction === 'rtl') !== endAligned
          ? anchor.right - resolvedWidth
          : anchor.left
      setActualPlacement(
        ((openAbove ? 'top' : 'bottom') +
          (endAligned ? 'End' : 'Start')) as CascaderPlacement,
      )
      setPopupStyle({
        position: 'fixed',
        width: resolvedWidth,
        maxHeight: Math.max(44, openAbove ? above : below),
        left: Math.max(
          leftEdge + 8,
          Math.min(preferredLeft, rightEdge - resolvedWidth - 8),
        ),
        ...(openAbove
          ? { bottom: window.innerHeight - anchor.top + 4 }
          : { top: anchor.bottom + 4 }),
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
  }, [
    isOpen,
    direction,
    columns,
    width,
    height,
    popupWidth,
    placement,
    showSearch,
  ])
  useLayoutEffect(() => {
    const before = previousOpen.current
    previousOpen.current = isOpen
    if (isOpen && !before) {
      if (showSearch) searchRef.current?.focus({ preventScroll: true })
      else panelRef.current?.focus()
    } else if (
      !isOpen &&
      before &&
      lastFocus.current &&
      !lastFocus.current.isConnected &&
      document.activeElement === document.body &&
      !disabled
    )
      triggerRef.current?.focus({ preventScroll: true })
  })
  useEffect(() => {
    if (!isOpen) return
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !inside(event.target)) {
        lastFocus.current = null
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', outside, true)
    return () => document.removeEventListener('pointerdown', outside, true)
  })

  const panel = (
    <CascaderPanel
      ref={panelRef}
      options={options}
      navigation={navigation}
      onNavigate={setNavigation}
      selectedPath={validPath}
      onChoose={(entry, close) => changePath(entry.path, close)}
      loader={loader}
      loadingIcon={loadingIcon}
      multiple={multiple}
      checks={checks}
      onCheck={(entry) => {
        changePaths(checks.toggle(cascaderKey(entry.path), showCheckedStrategy))
        if (autoClearSearchValue && search.trim()) {
          setNavigation(entry.path)
          setSearch('')
          searchRef.current?.focus({ preventScroll: true })
        }
      }}
      label={ariaLabel ?? label}
      id={mode === 'panel' ? triggerId : panelId}
      direction={direction}
      disabled={disabled}
      changeOnSelect={changeOnSelect}
      expandTrigger={expandTrigger}
      query={showSearch ? search : ''}
      filterOption={filterOption}
      searchLimit={limit}
      height={panelHeight}
      columnWidth={width}
      emptyText={emptyText}
      optionRender={optionRender}
      expandIcon={expandIcon}
      classNames={classNames}
      autoFocus={isOpen && !showSearch}
      ariaDescribedBy={ariaDescribedBy}
      ariaLabelledBy={mode === 'panel' ? ariaLabelledBy : undefined}
      ariaInvalid={status === 'error' || ariaInvalid || undefined}
      required={required}
    />
  )
  const searchBox = showSearch && (
    <input
      ref={searchRef}
      type="search"
      aria-label={'搜索' + label}
      aria-controls={mode === 'panel' ? triggerId : panelId}
      disabled={disabled}
      value={search}
      onChange={(event) => setSearch(event.currentTarget.value)}
      className={cn(
        inputStyles,
        'mb-1 shrink-0 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20',
        classNames?.search,
      )}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          panelRef.current?.focus()
        }
      }}
    />
  )

  return (
    <span
      ref={rootRef}
      dir={direction}
      className={cn(
        'relative inline-flex w-full min-w-0 self-start',
        (mode !== 'popup' || multiple) && 'flex-col',
        classNames?.root,
        className,
      )}
      onFocusCapture={(event) => {
        lastFocus.current = event.target
      }}
      onBlur={(event) => {
        if (event.relatedTarget instanceof Node && inside(event.relatedTarget))
          return
        if (event.relatedTarget) lastFocus.current = null
        if (isOpen && !closing.current) setOpen(false)
        onBlur?.(event)
      }}
    >
      {mode === 'inline' ? (
        <>
          <CascaderNative
            options={options}
            path={path}
            onChange={(next) => changePath(next)}
            label={ariaLabel ?? label}
            id={triggerId}
            required={required}
            ariaDescribedBy={ariaDescribedBy}
            ariaInvalid={ariaInvalid}
            ariaLabelledBy={ariaLabelledBy}
            disabled={disabled}
            size={resolvedSize}
            variant={variant}
            status={status}
            classNames={classNames}
          />
          {loadingEntry && (
            <CascaderLoadFeedback
              entry={loadingEntry}
              loader={loader}
              loadingIcon={loadingIcon}
              classNames={classNames}
              disabled={disabled}
            />
          )}
        </>
      ) : mode === 'panel' ? (
        <>
          {searchBox}
          {panel}
        </>
      ) : (
        <>
          <span className="relative inline-flex w-full min-w-0">
            <button
              ref={triggerRef}
              id={triggerId}
              type="button"
              tabIndex={0}
              role="combobox"
              aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : label)}
              aria-labelledby={ariaLabelledBy}
              aria-describedby={[ariaDescribedBy, valueId]
                .filter(Boolean)
                .join(' ')}
              aria-invalid={status === 'error' || ariaInvalid || undefined}
              data-status={status === 'default' ? undefined : status}
              aria-required={required || undefined}
              aria-expanded={isOpen}
              aria-controls={isOpen ? popupId : undefined}
              aria-haspopup="dialog"
              disabled={disabled}
              className={cn(
                inputStyles,
                inputSizeStyles[resolvedSize],
                inputVariantStyles[variant],
                inputStatusStyles[status],
                'flex cursor-pointer touch-manipulation items-center justify-between gap-2 text-start outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20',
                allowClear &&
                  (multiple
                    ? selectedPaths.length > 0
                    : validPath.length > 0) &&
                  'pe-16',
                (multiple
                  ? selectedPaths.length === 0
                  : selectedOptions.length === 0) && 'text-muted-foreground',
                classNames?.trigger,
              )}
              onClick={() => setOpen(!isOpen)}
              onKeyDown={(event) => {
                if (
                  !isOpen &&
                  ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)
                ) {
                  event.preventDefault()
                  setOpen(true)
                } else if (event.key === 'Escape' && isOpen) {
                  event.preventDefault()
                  setOpen(false, true)
                } else if (event.key === 'ArrowDown' && isOpen) {
                  event.preventDefault()
                  panelRef.current?.focus()
                } else if (
                  multiple &&
                  ['Backspace', 'Delete'].includes(event.key)
                ) {
                  const removable = [...selectedPaths]
                    .reverse()
                    .find((selected) => {
                      const entry = entries.get(cascaderKey(selected))
                      return !entry?.disabled && !entry?.option.disableCheckbox
                    })
                  if (removable) {
                    event.preventDefault()
                    removePath(removable)
                  }
                }
              }}
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
                id={valueId}
                className={cn('min-w-0 flex-1 truncate', classNames?.value)}
              >
                {multiple
                  ? selectedPaths.length
                    ? selectedPaths
                        .map((selected) => {
                          const entry = entries.get(cascaderKey(selected))
                          return (
                            entry?.options.map(cascaderText).join(' / ') ??
                            selected.join(' / ')
                          )
                        })
                        .join('、')
                    : placeholder
                  : selectedOptions.length
                    ? (displayRender?.(selectedOptions) ??
                      selectedOptions.map((option, index) => (
                        <span key={index}>
                          {index > 0 && <span aria-hidden="true"> / </span>}
                          {option.label}
                        </span>
                      )))
                    : placeholder}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  'shrink-0 text-muted-foreground',
                  classNames?.suffix,
                )}
              >
                {suffixIcon ?? (
                  <Icon name="arrowRight" size={16} className="rotate-90" />
                )}
              </span>
            </button>
            {allowClear &&
              (multiple ? selectedPaths.length > 0 : validPath.length > 0) &&
              !disabled && (
                <button
                  type="button"
                  tabIndex={0}
                  aria-label={'清空' + label}
                  className={cn(
                    'absolute end-7 top-1/2 z-[1] inline-grid size-11 -translate-y-1/2 touch-manipulation place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring',
                    classNames?.clear,
                  )}
                  onClick={() => {
                    if (multiple) {
                      changePaths([])
                      setOpen(false, true)
                    } else changePath([], true)
                    onClear?.()
                    triggerRef.current?.focus({ preventScroll: true })
                  }}
                >
                  <Icon name="close" size={16} />
                </button>
              )}
          </span>
          {multiple && selectedPaths.length > 0 && (
            <CascaderTags
              paths={selectedPaths}
              entries={entries}
              disabled={disabled}
              maxTagCount={maxTagCount}
              maxTagPlaceholder={maxTagPlaceholder}
              tagRender={tagRender}
              removeIcon={removeIcon}
              displayRender={displayRender}
              classNames={classNames}
              onRemove={removePath}
            />
          )}
        </>
      )}
      {name && (
        <input
          type="hidden"
          name={name}
          value={JSON.stringify(multiple ? selectedPaths : validPath)}
          disabled={disabled}
          readOnly
        />
      )}
      {isOpen && (
        <Portal>
          <div
            ref={popupRef}
            id={popupId}
            role="dialog"
            aria-label={label + '选项'}
            dir={direction}
            data-placement={actualPlacement}
            style={popupStyle}
            className={cn(
              'z-[90] flex min-w-0 flex-col overflow-auto rounded-[var(--ui-menu-radius)] border border-border bg-card p-1 text-card-foreground shadow-xl',
              classNames?.popup,
            )}
            onKeyDownCapture={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                event.stopPropagation()
                setOpen(false, true)
              } else if (event.key === 'Tab') {
                const inSearch = event.target === searchRef.current
                const action = popupRef.current?.querySelector<HTMLElement>(
                  '[data-cascader-load-action]',
                )
                if (inSearch && !event.shiftKey) {
                  event.preventDefault()
                  panelRef.current?.focus()
                  return
                }
                if (
                  !inSearch &&
                  !event.shiftKey &&
                  action &&
                  event.target !== action
                ) {
                  event.preventDefault()
                  panelRef.current?.focusLoadAction()
                  return
                }
                if (event.shiftKey && event.target === action) {
                  event.preventDefault()
                  panelRef.current?.focus()
                  return
                }
                if (!inSearch && event.shiftKey && showSearch) {
                  event.preventDefault()
                  searchRef.current?.focus({ preventScroll: true })
                  return
                }
                event.preventDefault()
                const popup = popupRef.current
                setOpen(false)
                if (event.shiftKey)
                  triggerRef.current?.focus({ preventScroll: true })
                else if (triggerRef.current)
                  focusAfter(triggerRef.current, popup)
              }
            }}
          >
            {searchBox}
            {panel}
          </div>
        </Portal>
      )}
    </span>
  )
}
