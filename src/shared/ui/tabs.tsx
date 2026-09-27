import * as TabsPrimitive from '@radix-ui/react-tabs'
import { type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

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
  className?: string
  label?: string
}

export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  className,
  label = '内容分组',
}: TabsProps) {
  return (
    <TabsPrimitive.Root
      value={value}
      defaultValue={defaultValue ?? items[0]?.value}
      onValueChange={onValueChange}
      className={cn('ui-tabs', className)}
    >
      <TabsPrimitive.List className="ui-tabs__list" aria-label={label}>
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className="ui-tabs__trigger"
          >
            {item.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {items.map((item) => (
        <TabsPrimitive.Content
          key={item.value}
          value={item.value}
          className="ui-tabs__content"
        >
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  )
}
