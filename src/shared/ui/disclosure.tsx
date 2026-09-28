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
  const keys = activeKey ?? uncontrolledKeys
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
    <div className={cn('ui-collapse', className)}>
      {items.map((item) => {
        const open = keys.includes(item.key)
        const panelId = `${id}-${item.key}-panel`
        const buttonId = `${id}-${item.key}-button`
        return (
          <section
            key={item.key}
            className={cn(
              'ui-collapse__item',
              open && 'ui-collapse__item--open',
              item.disabled && 'ui-collapse__item--disabled',
            )}
          >
            <h3 className="ui-collapse__heading">
              <button
                id={buttonId}
                type="button"
                className="ui-collapse__trigger"
                aria-expanded={open}
                aria-controls={panelId}
                disabled={item.disabled}
                onClick={() => toggle(item.key)}
              >
                <span>{item.label}</span>
                <span className="ui-collapse__chevron" aria-hidden="true">
                  {open ? '−' : '+'}
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!open}
              className="ui-collapse__content"
            >
              {item.children}
            </div>
          </section>
        )
      })}
    </div>
  )
}
