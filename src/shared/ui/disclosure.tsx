import { useId, useState, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export type CollapseItem = {
  key: string
  label: ReactNode
  children: ReactNode
  disabled?: boolean
}

export type CollapseProps = {
  items: CollapseItem[]
  activeKey?: string[]
  defaultActiveKey?: string[]
  accordion?: boolean
  onChange?: (keys: string[]) => void
  className?: string
}

/** Keyboard-first disclosure panels. One open key can be enforced with accordion. */
export function Collapse({
  items,
  activeKey,
  defaultActiveKey = [],
  accordion = false,
  onChange,
  className,
}: CollapseProps) {
  const [uncontrolledKeys, setUncontrolledKeys] = useState(defaultActiveKey)
  const requestedKeys = activeKey ?? uncontrolledKeys
  const keys = accordion ? requestedKeys.slice(0, 1) : requestedKeys
  const id = useId()

  function toggle(key: string) {
    const next = keys.includes(key)
      ? keys.filter((item) => item !== key)
      : accordion
        ? [key]
        : [...keys, key]
    if (activeKey === undefined) setUncontrolledKeys(next)
    onChange?.(next)
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card',
        className,
      )}
    >
      {items.map((item, index) => {
        const open = keys.includes(item.key)
        const panelId = `${id}-${index}-panel`
        const buttonId = `${id}-${index}-button`
        return (
          <section
            key={item.key}
            className="border-t border-border first:border-t-0"
          >
            <h3 className="m-0">
              <button
                id={buttonId}
                type="button"
                className="flex w-full min-h-[52px] touch-manipulation cursor-pointer items-center justify-between gap-[var(--space-md)] border-0 bg-transparent px-[var(--space-md)] py-[var(--space-sm)] text-start font-[650] text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
                aria-expanded={open}
                aria-controls={panelId}
                disabled={item.disabled}
                onClick={() => toggle(item.key)}
              >
                <span>{item.label}</span>
                <span
                  className="shrink-0 text-xl font-normal text-muted-foreground"
                  aria-hidden="true"
                >
                  {open ? '−' : '+'}
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!open}
              className="border-t border-border p-[var(--space-md)] leading-[1.6]"
            >
              {item.children}
            </div>
          </section>
        )
      })}
    </div>
  )
}
