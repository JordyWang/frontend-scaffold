import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Table } from '@/shared/ui'

const rows = [
  { id: '1', status: '已完成' },
  { id: '2', status: '进行中' },
  { id: '3', status: '待开始' },
]
const props = {
  caption: '任务表',
  rows,
  getRowKey: (row: (typeof rows)[number]) => row.id,
  columns: [
    {
      key: 'status',
      header: '状态',
      render: (row: (typeof rows)[number]) => row.status,
      filterOptions: [
        {
          value: 'done',
          label: '已完成',
          matches: (row: (typeof rows)[number]) => row.status === '已完成',
        },
        {
          value: 'active',
          label: '进行中',
          matches: (row: (typeof rows)[number]) => row.status === '进行中',
        },
        {
          value: 'archived',
          label: '已归档',
          matches: (row: (typeof rows)[number]) => row.status === '已归档',
        },
      ],
    },
  ],
  renderMobileRow: (row: (typeof rows)[number]) => row.status,
}

describe('Table filters', () => {
  it('applies and resets a column filter while restoring trigger focus', async () => {
    const onFiltersChange = vi.fn()
    render(<Table {...props} onFiltersChange={onFiltersChange} />)
    const table = screen.getByRole('region', { name: '任务表' })
    const trigger = within(table).getAllByRole('button', {
      name: '筛选状态',
    })[0]
    fireEvent.click(trigger)
    const panel = screen.getByRole('dialog', { name: '筛选状态' })
    fireEvent.click(within(panel).getByRole('checkbox', { name: '进行中' }))
    fireEvent.click(within(panel).getByRole('button', { name: '应用' }))
    expect(onFiltersChange).toHaveBeenLastCalledWith({ status: ['active'] })
    expect(table).toHaveTextContent('进行中')
    expect(table).not.toHaveTextContent('已完成')
    await waitFor(() => expect(trigger).toHaveFocus())
    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('button', { name: '重置' }))
    expect(onFiltersChange).toHaveBeenLastCalledWith({})
    expect(table).toHaveTextContent('已完成')
  })

  it('keeps a controlled filter unchanged until the owner updates it', () => {
    const onFiltersChange = vi.fn()
    const { rerender } = render(
      <Table
        {...props}
        filters={{ status: ['done'] }}
        onFiltersChange={onFiltersChange}
      />,
    )
    const table = screen.getByRole('region', { name: '任务表' })
    expect(table).toHaveTextContent('已完成')
    expect(table).not.toHaveTextContent('进行中')
    fireEvent.click(
      within(table).getAllByRole('button', { name: /筛选状态/ })[0],
    )
    const panel = screen.getByRole('dialog', { name: '筛选状态' })
    fireEvent.click(within(panel).getByRole('button', { name: '重置' }))
    expect(onFiltersChange).toHaveBeenCalledWith({})
    expect(table).not.toHaveTextContent('进行中')
    rerender(
      <Table {...props} filters={{}} onFiltersChange={onFiltersChange} />,
    )
    expect(table).toHaveTextContent('进行中')
  })

  it('keeps both filter controls available when no rows match', () => {
    render(<Table {...props} defaultFilters={{ status: ['archived'] }} />)
    const region = screen.getByRole('region', { name: '任务表' })
    expect(within(region).getAllByRole('status')).toHaveLength(2)
    expect(
      within(region).getAllByRole('button', { name: /筛选状态/ }),
    ).toHaveLength(2)
    expect(region).not.toHaveTextContent('已完成')
    fireEvent.click(
      within(region).getAllByRole('button', { name: /筛选状态/ })[0],
    )
    fireEvent.click(screen.getByRole('button', { name: '重置' }))
    expect(region).toHaveTextContent('已完成')
  })
})
