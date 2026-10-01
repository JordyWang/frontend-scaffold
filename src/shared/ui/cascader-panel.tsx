import {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type Ref,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { Icon } from './icon'
import type { CascaderOption, CascaderPart } from './cascader'
import {
  cascaderKey,
  cascaderLevels,
  cascaderText,
  indexCascader,
  searchCascader,
  type CascaderEntry,
} from './cascader-state'

export type CascaderPanelHandle = { focus: () => void; blur: () => void }
export function CascaderPanel({
  options,
  navigation,
  onNavigate,
  selectedPath,
  onChoose,
  label,
  id,
  direction,
  disabled,
  changeOnSelect,
  expandTrigger,
  query,
  filterOption,
  searchLimit,
  height,
  columnWidth,
  emptyText,
  optionRender,
  expandIcon,
  classNames,
  autoFocus,
  ref,
  ariaDescribedBy,
  ariaLabelledBy,
  ariaInvalid,
  required,
}: {
  options: CascaderOption[]
  navigation: string[]
  onNavigate: (path: string[]) => void
  selectedPath: string[]
  onChoose: (entry: CascaderEntry, close: boolean) => void
  label: string
  id: string
  direction: 'ltr' | 'rtl'
  disabled: boolean
  changeOnSelect: boolean
  expandTrigger: 'click' | 'hover'
  query: string
  filterOption?: (query: string, path: CascaderOption[]) => boolean
  searchLimit: number
  height: number
  columnWidth: number
  emptyText: string
  optionRender?: (
    option: CascaderOption,
    path: CascaderOption[],
  ) => React.ReactNode
  expandIcon?: React.ReactNode
  classNames?: Partial<Record<CascaderPart, string>>
  autoFocus: boolean
  ref?: Ref<CascaderPanelHandle>
  ariaDescribedBy?: string
  ariaLabelledBy?: string
  ariaInvalid?: boolean
  required?: boolean
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef(new Map<string, HTMLLIElement>())
  const ownedFocus = useRef(false)
  const pending = useRef<string | undefined>(undefined)
  const typeahead = useRef({ text: '', time: 0 })
  const entries = useMemo(() => indexCascader(options), [options])
  const levels = cascaderLevels(options, navigation)
  const searching = Boolean(query.trim())
  const results = searching
    ? searchCascader(entries, query, changeOnSelect, filterOption, searchLimit)
    : []
  const columns = searching
    ? [results]
    : levels.map(({ choices }, depth) =>
        choices.map((option) =>
          entries.get(
            cascaderKey([...navigation.slice(0, depth), option.value]),
          )!,
        ),
      )
  const visible = columns.flat()
  const available = visible.filter((entry) => !disabled && !entry.disabled)
  const [focused, setFocused] = useState(cascaderKey(selectedPath))
  const active =
    available.find((entry) => cascaderKey(entry.path) === focused) ??
    [...available]
      .reverse()
      .find((entry) =>
        entry.path.every((key, index) => JSON.parse(focused)[index] === key),
      ) ??
    available[0]
  const activeKey = active ? cascaderKey(active.path) : undefined
  if (activeKey && activeKey !== focused) setFocused(activeKey)

  function focus(entry: CascaderEntry | undefined) {
    if (!entry || disabled || entry.disabled) return
    const key = cascaderKey(entry.path)
    pending.current = key
    setFocused(key)
  }
  function reveal(element: HTMLElement) {
    const column = element.parentElement!
    const row = element.getBoundingClientRect()
    const bounds = column.getBoundingClientRect()
    if (row.top < bounds.top) column.scrollTop -= bounds.top - row.top
    else if (row.bottom > bounds.bottom)
      column.scrollTop += row.bottom - bounds.bottom
    const root = rootRef.current!
    const viewport = root.getBoundingClientRect()
    if (row.left < viewport.left) root.scrollLeft -= viewport.left - row.left
    else if (row.right > viewport.right)
      root.scrollLeft += row.right - viewport.right
  }
  useImperativeHandle(ref, () => ({
    focus() {
      const element = activeKey
        ? itemRefs.current.get(activeKey)
        : rootRef.current
      element?.focus({ preventScroll: true })
      if (element && activeKey) reveal(element)
    },
    blur() {
      const element = document.activeElement
      if (element instanceof HTMLElement && rootRef.current?.contains(element))
        element.blur()
    },
  }))
  useLayoutEffect(() => {
    const target =
      pending.current ?? (ownedFocus.current ? activeKey : undefined)
    const element = target ? itemRefs.current.get(target) : undefined
    if (
      element &&
      (pending.current ||
        (ownedFocus.current &&
          (document.activeElement === document.body ||
            (rootRef.current?.contains(document.activeElement) &&
              document.activeElement?.getAttribute('data-cascader-path') !==
                activeKey))))
    ) {
      pending.current = undefined
      element.focus({ preventScroll: true })
      reveal(element)
    } else if (
      ownedFocus.current &&
      !activeKey &&
      (document.activeElement === document.body ||
        rootRef.current?.contains(document.activeElement))
    )
      rootRef.current?.focus({ preventScroll: true })
  })
  useLayoutEffect(() => {
    if (autoFocus)
      (activeKey ? itemRefs.current.get(activeKey) : rootRef.current)?.focus({
        preventScroll: true,
      })
    // Only on mount; changes to the active item must not steal external focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      )
        ownedFocus.current = false
    }
    document.addEventListener('pointerdown', outside, true)
    return () => document.removeEventListener('pointerdown', outside, true)
  }, [])

  function enter(entry: CascaderEntry, keyboard: boolean, select: boolean) {
    if (disabled || entry.disabled) return
    const branch = Boolean(entry.option.children?.length)
    if (!searching && branch) {
      onNavigate(entry.path)
      if (keyboard) {
        const child = entry.option.children!.find((option) => !option.disabled)
        if (child) focus(entries.get(cascaderKey([...entry.path, child.value])))
      } else focus(entry)
      if (select && changeOnSelect) onChoose(entry, false)
    } else if (select) onChoose(entry, true)
  }
  function handleKey(
    event: KeyboardEvent<HTMLLIElement>,
    entry: CascaderEntry,
    column: CascaderEntry[],
  ) {
    if (
      event.target !== event.currentTarget ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      disabled ||
      entry.disabled
    )
      return
    if (event.key.length !== 1 || event.key === ' ')
      typeahead.current = { text: '', time: 0 }
    const choices = column.filter((item) => !item.disabled)
    const index = choices.indexOf(entry)
    const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
    const back = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      focus(
        choices[
          (index + (event.key === 'ArrowDown' ? 1 : -1) + choices.length) %
            choices.length
        ],
      )
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      focus(event.key === 'Home' ? choices[0] : choices.at(-1))
    } else if (event.key === forward && !searching) {
      event.preventDefault()
      enter(entry, true, false)
    } else if (event.key === back && !searching) {
      event.preventDefault()
      onNavigate(entry.path.slice(0, -1))
      focus(
        entry.path.length > 1
          ? entries.get(cascaderKey(entry.path.slice(0, -1)))
          : entry,
      )
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      enter(entry, true, true)
    } else if (event.key.length === 1) {
      const letter = event.key.toLocaleLowerCase()
      const previous =
        event.timeStamp - typeahead.current.time < 600
          ? typeahead.current.text
          : ''
      const text = previous + letter
      typeahead.current = { text, time: event.timeStamp }
      const prefix = [...text].every((character) => character === letter)
        ? letter
        : text
      const ordered = [
        ...choices.slice(index + 1),
        ...choices.slice(0, index + 1),
      ]
      const match = ordered.find((item) =>
        cascaderText(item.option).toLocaleLowerCase().startsWith(prefix),
      )
      if (match) {
        event.preventDefault()
        focus(match)
      }
    }
  }

  return (
    <div
      ref={rootRef}
      id={id}
      dir={direction}
      role={searching ? 'listbox' : 'tree'}
      aria-label={label}
      aria-labelledby={ariaLabelledBy}
      aria-invalid={ariaInvalid || undefined}
      aria-required={required || undefined}
      aria-describedby={ariaDescribedBy}
      aria-disabled={disabled || undefined}
      tabIndex={activeKey ? -1 : 0}
      style={
        {
          height,
          '--ui-cascader-column-width': columnWidth + 'px',
        } as CSSProperties
      }
      className={cn(
        'flex min-w-0 max-w-full overflow-x-auto overflow-y-hidden rounded-[var(--ui-menu-radius)] border border-border bg-card text-card-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring',
        classNames?.panel,
      )}
      onFocusCapture={() => {
        ownedFocus.current = true
      }}
      onBlurCapture={(event) => {
        if (
          event.relatedTarget instanceof Node &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          ownedFocus.current = false
      }}
    >
      {visible.length === 0 ? (
        <p
          className="m-auto px-3 py-4 text-center text-sm text-muted-foreground"
          role="status"
        >
          {emptyText}
        </p>
      ) : (
        columns.map((column, depth) => (
          <ul
            key={depth}
            role="presentation"
            aria-label={!searching ? `${label}第${depth + 1}级` : undefined}
            className={cn(
              'm-0 h-full w-[var(--ui-cascader-column-width)] max-w-full shrink-0 list-none overflow-y-auto border-e border-border p-1 last:border-e-0',
              searching && 'w-full',
              classNames?.column,
            )}
          >
            {column.map((entry, position) => {
              const key = cascaderKey(entry.path)
              const expanded = entry.path.every(
                (value, index) => navigation[index] === value,
              )
              const selected = key === cascaderKey(selectedPath)
              const branch =
                !searching && Boolean(entry.option.children?.length)
              return (
                <li
                  key={key}
                  ref={(element) => {
                    if (element) itemRefs.current.set(key, element)
                    else itemRefs.current.delete(key)
                  }}
                  role={searching ? 'option' : 'treeitem'}
                  aria-label={
                    searching
                      ? entry.options.map(cascaderText).join(' / ')
                      : cascaderText(entry.option)
                  }
                  aria-level={searching ? undefined : depth + 1}
                  aria-posinset={position + 1}
                  aria-setsize={column.length}
                  aria-selected={selected}
                  aria-expanded={branch ? expanded : undefined}
                  aria-disabled={disabled || entry.disabled || undefined}
                  tabIndex={key === activeKey ? 0 : -1}
                  data-cascader-path={key}
                  className={cn(
                    'flex min-h-11 min-w-0 cursor-pointer touch-manipulation items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-base leading-6 outline-none hover:bg-accent focus-visible:outline-[3px] focus-visible:outline-offset-[-3px] focus-visible:outline-ring',
                    expanded && !searching && 'bg-accent font-semibold',
                    selected && 'bg-accent text-accent-foreground',
                    (disabled || entry.disabled) &&
                      'cursor-not-allowed opacity-50 hover:bg-transparent',
                    classNames?.item,
                    searching && classNames?.result,
                  )}
                  onFocus={(event) => {
                    if (event.target === event.currentTarget) setFocused(key)
                  }}
                  onClick={() => {
                    if (!disabled && !entry.disabled) {
                      eventFocus(key)
                      enter(entry, false, true)
                    }
                  }}
                  onPointerEnter={(event) => {
                    if (
                      expandTrigger === 'hover' &&
                      event.pointerType === 'mouse' &&
                      branch &&
                      !disabled &&
                      !entry.disabled
                    )
                      onNavigate(entry.path)
                  }}
                  onKeyDown={(event) => handleKey(event, entry, column)}
                >
                  <span
                    className={cn(
                      'min-w-0 flex-1 [overflow-wrap:anywhere]',
                      classNames?.itemLabel,
                    )}
                  >
                    {searching
                      ? entry.options.map((option, index) => (
                          <span key={index}>
                            {index > 0 && <span aria-hidden="true"> / </span>}
                            {option.label}
                          </span>
                        ))
                      : (optionRender?.(entry.option, entry.options) ??
                        entry.option.label)}
                  </span>
                  {branch && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'shrink-0 text-muted-foreground',
                        classNames?.expandIcon,
                      )}
                    >
                      {expandIcon ?? (
                        <Icon
                          name={
                            direction === 'rtl' ? 'arrowLeft' : 'arrowRight'
                          }
                          size={16}
                        />
                      )}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        ))
      )}
    </div>
  )

  function eventFocus(key: string) {
    itemRefs.current.get(key)?.focus({ preventScroll: true })
  }
}
