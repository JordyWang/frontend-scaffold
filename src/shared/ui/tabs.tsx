import * as TabsPrimitive from '@radix-ui/react-tabs'
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { useConfig } from './config-context'

export type TabItem = {
  value: string
  label: string
  content: ReactNode
  disabled?: boolean
}
export type TabsProps = {
  items: TabItem[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  orientation?: 'horizontal' | 'vertical'
  activationMode?: 'automatic' | 'manual'
  className?: string
  label?: string
}

export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  orientation = 'horizontal',
  activationMode = 'automatic',
  className,
  label = '内容分组',
}: TabsProps) {
  const { direction } = useConfig()
  const listRef = useRef<HTMLDivElement>(null)
  const focusedTabRef = useRef<HTMLElement | null>(null)
  const firstEnabledValue = items.find((item) => !item.disabled)?.value
  const [internalValue, setInternalValue] = useState(() =>
    items.some((item) => item.value === defaultValue && !item.disabled)
      ? defaultValue
      : firstEnabledValue,
  )
  const internalValueIsEnabled = items.some(
    (item) => item.value === internalValue && !item.disabled,
  )
  const activeValue =
    value ?? (internalValueIsEnabled ? internalValue : firstEnabledValue) ?? ''

  useLayoutEffect(() => {
    const previous = focusedTabRef.current
    if (!previous) return
    const unavailable =
      !previous.isConnected || previous.hasAttribute('disabled')
    const focusLost =
      document.activeElement === document.body ||
      document.activeElement === previous
    if (!unavailable || !focusLost) return
    listRef.current
      ?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
      ?.focus()
  }, [activeValue, items])

  return (
    <TabsPrimitive.Root
      value={activeValue}
      onValueChange={(next) => {
        if (value === undefined) setInternalValue(next)
        onValueChange?.(next)
      }}
      orientation={orientation}
      activationMode={activationMode}
      dir={direction}
      className={cn(
        'flex w-full min-w-0',
        orientation === 'vertical' ? 'flex-row' : 'flex-col',
        className,
      )}
    >
      <TabsPrimitive.List
        ref={listRef}
        onFocusCapture={(event) => {
          if ((event.target as HTMLElement).getAttribute('role') === 'tab')
            focusedTabRef.current = event.target as HTMLElement
        }}
        className={cn(
          'flex min-w-0 gap-2 overflow-x-auto border-b border-border [scrollbar-width:thin]',
          orientation === 'vertical' &&
            'max-h-[min(24rem,70dvh)] min-w-28 max-w-[45%] shrink-0 flex-col items-stretch gap-1 overflow-x-hidden overflow-y-auto border-b-0 border-e',
        )}
        aria-label={label}
      >
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={cn(
              'min-h-11 shrink-0 touch-manipulation border-transparent px-4 py-2.5 text-sm font-semibold text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring data-[state=active]:text-foreground disabled:cursor-not-allowed disabled:opacity-50',
              orientation === 'vertical'
                ? 'w-full border-e-2 text-start data-[state=active]:border-e-primary'
                : 'border-b-2 data-[state=active]:border-b-primary',
            )}
          >
            {item.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {items.map((item) => (
        <TabsPrimitive.Content
          key={item.value}
          value={item.value}
          className={cn(
            'min-w-0 outline-none',
            orientation === 'vertical'
              ? 'flex-1 py-0 ps-[var(--space-lg)]'
              : 'py-[var(--space-lg)]',
          )}
        >
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  )
}
