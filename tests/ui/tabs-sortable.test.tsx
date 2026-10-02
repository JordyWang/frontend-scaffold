import { cloneElement, useRef, useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ConfigProvider, Tabs, type TabItem } from '@/shared/ui'

function Draft() {
  const [text, setText] = useState('初稿')
  return (
    <input
      aria-label="草稿正文"
      value={text}
      onChange={(event) => setText(event.target.value)}
    />
  )
}

function SortableTabs() {
  const [items, setItems] = useState<TabItem[]>([
    { value: 'one', label: '第一项', content: '第一面板' },
    { value: 'two', label: '第二项', content: <Draft /> },
    { value: 'three', label: '第三项', content: '第三面板' },
  ])
  const source = useRef<string | null>(null)
  return (
    <Tabs
      label="可排序标签"
      items={items}
      defaultValue="two"
      renderTabBarItem={(item, defaultItem) =>
        cloneElement(defaultItem, {
          draggable: true,
          onDragStart: () => {
            source.current = item.value
          },
          onDragOver: (event) => event.preventDefault(),
          onDrop: () => {
            if (!source.current) return
            const from = source.current
            source.current = null
            setItems((current) => {
              const next = [...current]
              const original = next.findIndex((entry) => entry.value === from)
              const target = next.findIndex(
                (entry) => entry.value === item.value,
              )
              if (original < 0 || target < 0 || original === target)
                return current
              const [moved] = next.splice(original, 1)
              next.splice(target, 0, moved)
              return next
            })
          },
        })
      }
    />
  )
}

describe('Tabs external reorder composition', () => {
  it.each(['ltr', 'rtl'] as const)(
    'keeps %s tab semantics, selection and panel draft after reordering',
    (direction) => {
      render(
        <ConfigProvider direction={direction}>
          <SortableTabs />
        </ConfigProvider>,
      )
      const list = screen.getByRole('tablist', { name: '可排序标签' })
      const order = () =>
        [...list.querySelectorAll('[data-tabs-item]')].map((node) =>
          node.getAttribute('data-tabs-value'),
        )
      const source = screen.getByRole('tab', { name: '第三项' })
      const target = screen.getByRole('tab', { name: '第一项' })
      const draft = screen.getByRole('textbox', { name: '草稿正文' })
      fireEvent.change(draft, { target: { value: '已修改' } })
      expect(order()).toEqual(['one', 'two', 'three'])
      expect(source.parentElement).toHaveAttribute('draggable', 'true')
      expect(target.parentElement).toHaveAttribute('role', 'presentation')
      fireEvent.dragStart(source.parentElement!)
      fireEvent.dragOver(target.parentElement!)
      fireEvent.drop(target.parentElement!)
      expect(order()).toEqual(['three', 'one', 'two'])
      expect(screen.getByRole('tab', { name: '第二项' })).toHaveAttribute(
        'aria-selected',
        'true',
      )
      expect(screen.getByRole('textbox', { name: '草稿正文' })).toHaveValue(
        '已修改',
      )
    },
  )
})
