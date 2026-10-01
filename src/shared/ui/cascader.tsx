import {
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
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
import { cascaderLevels, validCascaderPath } from './cascader-state'

export type CascaderOption = {
  value: string
  label: ReactNode
  searchText?: string
  children?: CascaderOption[]
  disabled?: boolean
}
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
export type CascaderHandle = { focus: () => void; blur: () => void }
export type CascaderProps = {
  options: CascaderOption[]
  value?: string[]
  defaultValue?: string[]
  onChange?: (value: string[]) => void
  mode?: 'popup' | 'inline' | 'panel'
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
    options,
    value,
    defaultValue = [],
    onChange,
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
  const [internal, setInternal] = useState(defaultValue)
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const [internalSearch, setInternalSearch] = useState(defaultSearchValue)
  const controlled = Object.prototype.hasOwnProperty.call(allProps, 'value')
  const searchControlled = Object.prototype.hasOwnProperty.call(
    allProps,
    'searchValue',
  )
  const path = controlled ? (value ?? []) : internal
  const validPath = validCascaderPath(options, path)
  const selectedOptions = cascaderLevels(options, path).flatMap(
    ({ selected }) => (selected ? [selected] : []),
  )
  const [navigation, setNavigation] = useState(validPath)
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
  const columns = cascaderLevels(options, navigation).length
  if (disabled && open === undefined && internalOpen) setInternalOpen(false)

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
    if (next) setNavigation(validPath)
    else {
      setSearch('')
      if (restoreFocus) triggerRef.current?.focus({ preventScroll: true })
    }
  }
  function changePath(next: string[], close = false) {
    if (disabled) return
    if (!controlled) setInternal(next)
    onChange?.(next)
    if (close && mode === 'popup') setOpen(false, true)
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
        mode !== 'popup' && 'flex-col',
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
      ) : mode === 'panel' ? (
        <>
          {searchBox}
          {panel}
        </>
      ) : (
        <>
          <button
            ref={triggerRef}
            id={triggerId}
            type="button"
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
              allowClear && validPath.length > 0 && 'pe-16',
              selectedOptions.length === 0 && 'text-muted-foreground',
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
              {selectedOptions.length
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
          {allowClear && validPath.length > 0 && !disabled && (
            <button
              type="button"
              aria-label={'清空' + label}
              className={cn(
                'absolute end-7 top-1/2 z-[1] inline-grid size-11 -translate-y-1/2 touch-manipulation place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring',
                classNames?.clear,
              )}
              onClick={() => {
                changePath([], true)
                onClear?.()
                triggerRef.current?.focus({ preventScroll: true })
              }}
            >
              <Icon name="close" size={16} />
            </button>
          )}
        </>
      )}
      {name && (
        <input
          type="hidden"
          name={name}
          value={JSON.stringify(validPath)}
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
                if (inSearch && !event.shiftKey) {
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
