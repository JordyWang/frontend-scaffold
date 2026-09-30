import { useRef, useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { Button } from './button'
import { Checkbox } from './choice'
import { Popover } from './overlay'

export type TableFilterOption<T> = {
  value: string
  label: string
  matches: (row: T) => boolean
}

export type TableFilters = Record<string, string[]>

export function TableFilterControl<T>({
  label,
  options,
  selectedValues,
  onApply,
  mobile = false,
}: {
  label: string
  options: TableFilterOption<T>[]
  selectedValues: string[]
  onApply: (values: string[]) => void
  mobile?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<string[]>([])
  const triggerRef = useRef<HTMLButtonElement>(null)

  function finish(values: string[]) {
    onApply(values)
    setOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }

  return (
    <Popover
      title={`筛选${label}`}
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(selectedValues)
        setOpen(next)
      }}
      content={
        <div className="grid gap-3">
          <div className="grid max-h-56 gap-1 overflow-y-auto">
            {options.map((option) => (
              <Checkbox
                key={option.value}
                label={option.label}
                checked={draft.includes(option.value)}
                onChange={(event) => {
                  const checked = event.currentTarget.checked
                  setDraft((current) =>
                    checked
                      ? [...current, option.value]
                      : current.filter((value) => value !== option.value),
                  )
                }}
              />
            ))}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="small" onClick={() => finish([])}>
              重置
            </Button>
            <Button size="small" onClick={() => finish(draft)}>
              应用
            </Button>
          </div>
        </div>
      }
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={`筛选${label}${selectedValues.length ? `，已选 ${selectedValues.length} 项` : ''}`}
        className={cn(
          'inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-[var(--radius-sm)] px-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          mobile && 'shrink-0 border border-border bg-card px-3 font-semibold',
          selectedValues.length > 0 && 'text-primary',
        )}
      >
        筛选{selectedValues.length > 0 ? ` ${selectedValues.length}` : ''}
      </button>
    </Popover>
  )
}
