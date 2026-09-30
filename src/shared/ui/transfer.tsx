import { useState, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { useConfig } from './config-context'

const transferPanelStyles =
  'flex min-w-0 flex-col overflow-hidden rounded-[var(--ui-transfer-radius)] border border-border bg-card text-card-foreground aria-[invalid=true]:border-destructive'
const transferListStyles =
  'm-0 h-[var(--ui-transfer-list-height)] min-h-0 list-none overflow-y-auto overscroll-contain p-0 max-sm:h-auto max-sm:min-h-24 max-sm:max-h-48'

export type TransferItem = {
  key: string
  title: string
  description?: string
  disabled?: boolean
}

export type TransferDirection = 'to-target' | 'to-source'

export type TransferProps = {
  items: TransferItem[]
  targetKeys?: string[]
  defaultTargetKeys?: string[]
  onChange?: (
    targetKeys: string[],
    direction: TransferDirection,
    movedKeys: string[],
  ) => void
  selectedKeys?: string[]
  defaultSelectedKeys?: string[]
  onSelectChange?: (selectedKeys: string[]) => void
  titles?: [source: string, target: string]
  showSearch?: boolean
  filterItem?: (query: string, item: TransferItem) => boolean
  disabled?: boolean
  label?: string
  id?: string
  required?: boolean
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-label'?: string
  'aria-labelledby'?: string
  className?: string
}

function normalizeKeys(keys: string[], items: TransferItem[]) {
  const available = new Set(items.map((item) => item.key))
  return [...new Set(keys)].filter((key) => available.has(key))
}

/** A dual-list transfer with native checkbox and button interactions. */
export function Transfer({
  items,
  targetKeys,
  defaultTargetKeys = [],
  onChange,
  selectedKeys,
  defaultSelectedKeys = [],
  onSelectChange,
  titles = ['待选', '已选'],
  showSearch = false,
  filterItem,
  disabled = false,
  label = '穿梭框',
  id,
  required,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
}: TransferProps) {
  const { direction } = useConfig()
  const [internalTargetKeys, setInternalTargetKeys] =
    useState(defaultTargetKeys)
  const [internalSelectedKeys, setInternalSelectedKeys] =
    useState(defaultSelectedKeys)
  const [sourceQuery, setSourceQuery] = useState('')
  const [targetQuery, setTargetQuery] = useState('')

  const currentTargetKeys = normalizeKeys(
    targetKeys ?? internalTargetKeys,
    items,
  )
  const targetSet = new Set(currentTargetKeys)
  const currentSelectedKeys = normalizeKeys(
    selectedKeys ?? internalSelectedKeys,
    items,
  )
  const selectedSet = new Set(currentSelectedKeys)
  const byKey = new Map(items.map((item) => [item.key, item]))
  const sourceItems = items.filter((item) => !targetSet.has(item.key))
  const targetItems = currentTargetKeys
    .map((key) => byKey.get(key))
    .filter((item): item is TransferItem => Boolean(item))

  function matches(query: string, item: TransferItem) {
    const normalized = query.trim().toLocaleLowerCase()
    if (!normalized) return true
    return filterItem
      ? filterItem(normalized, item)
      : `${item.title} ${item.description ?? ''}`
          .toLocaleLowerCase()
          .includes(normalized)
  }

  const visibleSource = sourceItems.filter((item) => matches(sourceQuery, item))
  const visibleTarget = targetItems.filter((item) => matches(targetQuery, item))
  const movableSource = sourceItems.filter(
    (item) => !item.disabled && selectedSet.has(item.key),
  )
  const movableTarget = targetItems.filter(
    (item) => !item.disabled && selectedSet.has(item.key),
  )

  function changeSelection(nextKeys: string[]) {
    const next = normalizeKeys(nextKeys, items)
    if (selectedKeys === undefined) setInternalSelectedKeys(next)
    onSelectChange?.(next)
  }

  function toggleSelected(key: string) {
    changeSelection(
      selectedSet.has(key)
        ? currentSelectedKeys.filter((item) => item !== key)
        : [...currentSelectedKeys, key],
    )
  }

  function toggleVisible(itemsToToggle: TransferItem[]) {
    const enabled = itemsToToggle.filter((item) => !item.disabled)
    const allSelected = enabled.every((item) => selectedSet.has(item.key))
    const visibleKeys = new Set(enabled.map((item) => item.key))
    changeSelection(
      allSelected
        ? currentSelectedKeys.filter((key) => !visibleKeys.has(key))
        : [
            ...currentSelectedKeys,
            ...enabled
              .filter((item) => !selectedSet.has(item.key))
              .map((item) => item.key),
          ],
    )
  }

  function move(direction: TransferDirection) {
    if (disabled) return
    const movedKeys =
      direction === 'to-target'
        ? movableSource.map((item) => item.key)
        : movableTarget.map((item) => item.key)
    if (!movedKeys.length) return
    const movedSet = new Set(movedKeys)
    const nextTargetKeys =
      direction === 'to-target'
        ? [...currentTargetKeys, ...movedKeys]
        : currentTargetKeys.filter((key) => !movedSet.has(key))
    if (targetKeys === undefined) setInternalTargetKeys(nextTargetKeys)
    changeSelection(currentSelectedKeys.filter((key) => !movedSet.has(key)))
    onChange?.(nextTargetKeys, direction, movedKeys)
  }

  function renderPanel(
    panelItems: TransferItem[],
    visibleItems: TransferItem[],
    title: string,
    query: string,
    setQuery: (query: string) => void,
  ): ReactNode {
    const selectable = visibleItems.filter((item) => !item.disabled)
    const selectedCount = panelItems.filter((item) =>
      selectedSet.has(item.key),
    ).length
    const selectedVisible = selectable.filter((item) =>
      selectedSet.has(item.key),
    ).length
    const allSelected =
      selectable.length > 0 && selectedVisible === selectable.length
    const partlySelected = selectedVisible > 0 && !allSelected

    return (
      <section className={transferPanelStyles} aria-label={title}>
        <div className="flex min-h-[52px] items-center gap-1 border-b border-border pe-2">
          <label className="inline-grid size-11 shrink-0 place-items-center has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-55">
            <input
              type="checkbox"
              aria-label={`全选${title}可见项`}
              checked={allSelected}
              ref={(element) => {
                if (element) element.indeterminate = partlySelected
              }}
              disabled={disabled || selectable.length === 0}
              onChange={() => toggleVisible(visibleItems)}
            />
          </label>
          <strong>{title}</strong>
          <span
            className="ms-auto whitespace-nowrap text-sm text-muted-foreground"
            aria-live="polite"
          >
            {selectedCount} / {panelItems.length}
          </span>
        </div>
        {showSearch && (
          <input
            type="search"
            className="mx-2 mb-2 min-h-11 w-[calc(100%-1rem)] rounded-[var(--ui-field-radius)] border border-input bg-card px-3 py-2 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
            aria-label={`搜索${title}`}
            placeholder={`搜索${title}`}
            value={query}
            disabled={disabled}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
        )}
        {visibleItems.length ? (
          <ul className={transferListStyles} aria-label={`${title}列表`}>
            {visibleItems.map((item) => (
              <li
                key={item.key}
                className="border-t border-border first:border-t-0"
              >
                <label
                  className={cn(
                    'flex min-h-11 cursor-pointer items-center gap-2 px-2 py-2 hover:bg-accent hover:text-accent-foreground',
                    item.disabled &&
                      'cursor-not-allowed opacity-55 hover:bg-transparent hover:text-inherit',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedSet.has(item.key)}
                    disabled={disabled || item.disabled}
                    onChange={() => toggleSelected(item.key)}
                  />
                  <span className="grid min-w-0 gap-0.5 leading-[1.4]">
                    <span>{item.title}</span>
                    {item.description && (
                      <span className="text-sm text-muted-foreground">
                        {item.description}
                      </span>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p className="grid min-h-[var(--ui-transfer-list-height)] m-0 place-items-center text-center text-muted-foreground max-sm:min-h-24 max-sm:max-h-48">
            {query.trim() ? '暂无匹配项' : '暂无数据'}
          </p>
        )}
      </section>
    )
  }

  return (
    <div
      id={id}
      dir={direction}
      role="group"
      aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : label)}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid || undefined}
      aria-required={required || undefined}
      className={cn(
        'grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-[var(--space-md)] max-sm:grid-cols-1',
        className,
      )}
    >
      {renderPanel(
        sourceItems,
        visibleSource,
        titles[0],
        sourceQuery,
        setSourceQuery,
      )}
      <div className="flex flex-col gap-2 max-sm:flex-row max-sm:flex-wrap">
        <button
          type="button"
          className="inline-flex min-h-11 flex-none items-center justify-center gap-1 whitespace-nowrap rounded-[var(--ui-button-radius)] border border-border bg-card px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-55 max-sm:flex-[1_1_8rem]"
          disabled={disabled || movableSource.length === 0}
          onClick={() => move('to-target')}
        >
          <span aria-hidden="true" className="max-sm:hidden">
            {direction === 'rtl' ? '←' : '→'}
          </span>
          <span aria-hidden="true" className="sm:hidden">
            ↓
          </span>
          <span>移至{titles[1]}</span>
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 flex-none items-center justify-center gap-1 whitespace-nowrap rounded-[var(--ui-button-radius)] border border-border bg-card px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-55 max-sm:flex-[1_1_8rem]"
          disabled={disabled || movableTarget.length === 0}
          onClick={() => move('to-source')}
        >
          <span aria-hidden="true" className="max-sm:hidden">
            {direction === 'rtl' ? '→' : '←'}
          </span>
          <span aria-hidden="true" className="sm:hidden">
            ↑
          </span>
          <span>移回{titles[0]}</span>
        </button>
      </div>
      {renderPanel(
        targetItems,
        visibleTarget,
        titles[1],
        targetQuery,
        setTargetQuery,
      )}
    </div>
  )
}
