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

  it('limits desktop table height and keeps grouped headers and summaries sticky', () => {
    render(
      <Table
        caption="长任务表"
        rows={[{ id: 'first', status: '进行中' }]}
        getRowKey={(row) => row.id}
        columns={[
          { key: 'id', header: '任务', render: (row) => row.id },
          {
            key: 'progress',
            header: '进度',
            children: [
              { key: 'status', header: '状态', render: (row) => row.status },
            ],
          },
        ]}
        scrollY={240}
        stickySummary
        summary={() => ({ id: '汇总', status: '1 项进行中' })}
        renderMobileRow={(row) => row.id}
      />,
    )
    const region = screen.getByRole('region', { name: '长任务表滚动区域' })
    const table = screen.getByRole('table', { name: '长任务表' })
    expect(region).toHaveStyle({ maxHeight: '240px' })
    expect(region).toHaveClass('overflow-y-auto')
    expect(table.querySelectorAll('thead tr')).toHaveLength(2)
    expect(table.querySelector('thead')).toHaveClass('sticky', 'top-0')
    expect(table.querySelector('tfoot')).toHaveClass('sticky', 'bottom-0')
    expect(screen.getByRole('list', { name: '长任务表' })).toHaveTextContent(
      'first',
    )
  })
})
