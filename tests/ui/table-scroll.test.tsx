import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Table } from '@/shared/ui'

describe('Table horizontal scrolling', () => {
  it.each(['ltr', 'rtl'] as const)(
    'scrolls %s overflow from its focused region without taking child keys',
    (direction) => {
      render(
        <div dir={direction}>
          <Table
            caption="宽任务表"
            rows={[{ id: 'first' }]}
            getRowKey={(row) => row.id}
            columns={[
              {
                key: 'task',
                header: '任务',
                render: () => <button type="button">单元格操作</button>,
              },
            ]}
          />
        </div>,
      )
      const region = screen.getByRole('region', {
        name: '宽任务表横向滚动',
      })
      Object.defineProperties(region, {
        scrollWidth: { configurable: true, value: 500 },
        clientWidth: { configurable: true, value: 200 },
      })
      region.style.direction = direction
      region.focus()
      fireEvent.keyDown(region, { key: 'End' })
      expect(region.scrollLeft).toBe(direction === 'rtl' ? -300 : 300)
      fireEvent.keyDown(region, { key: 'Home' })
      expect(region.scrollLeft).toBe(0)
      fireEvent.keyDown(region, { key: 'ArrowLeft' })
      expect(region.scrollLeft).toBe(-44)
      fireEvent.keyDown(region, { key: 'ArrowRight' })
      expect(region.scrollLeft).toBe(0)
      fireEvent.keyDown(region, { key: 'End', ctrlKey: true })
      expect(region.scrollLeft).toBe(0)
      fireEvent.keyDown(screen.getByRole('button', { name: '单元格操作' }), {
        key: 'ArrowLeft',
      })
      expect(region.scrollLeft).toBe(0)
    },
  )
})
