import * as TabsPrimitive from '@radix-ui/react-tabs'
import { type ReactNode } from 'react'
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
  const firstEnabledValue = items.find((item) => !item.disabled)?.value

  return (
    <TabsPrimitive.Root
      value={value}
      defaultValue={defaultValue ?? firstEnabledValue}
      onValueChange={onValueChange}
      orientation={orientation}
      activationMode={activationMode}
      dir={direction}
      className={cn('flex w-full min-w-0 flex-col', className)}
    >
      <TabsPrimitive.List
        className={cn(
          'flex min-w-0 gap-2 overflow-x-auto border-b border-border [scrollbar-width:thin]',
          orientation === 'vertical' &&
            'overflow-x-visible overflow-y-auto border-b-0 border-e',
        )}
        aria-label={label}
      >
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={cn(
              'min-h-11 shrink-0 touch-manipulation border-b-2 border-transparent px-4 py-2.5 text-sm font-semibold text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring data-[state=active]:border-primary data-[state=active]:text-foreground disabled:cursor-not-allowed disabled:opacity-50',
              orientation === 'vertical' &&
                'border-b-0 border-e-2 data-[state=active]:border-e-primary',
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
          className="min-w-0 py-[var(--space-lg)] outline-none"
        >
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  )
}
