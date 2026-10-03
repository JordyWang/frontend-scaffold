import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Table } from '@/shared/ui'

const rows = Array.from({ length: 6 }, (_, index) => ({
  id: String(index + 1),
  name: `任务 ${index + 1}`,
  status: index % 2 === 0 ? '待处理' : '已完成',
  rank: 6 - index,
}))

const baseProps = {
  caption: '任务表',
  rows,
  getRowKey: (row: (typeof rows)[number]) => row.id,
  columns: [
    {
      key: 'name',
      header: '任务',
      render: (row: (typeof rows)[number]) => row.name,
      sorter: (left: (typeof rows)[number], right: (typeof rows)[number]) =>
        left.rank - right.rank,
    },
    {
      key: 'status',
      header: '状态',
      render: (row: (typeof rows)[number]) => row.status,
      filterOptions: [
        {
          value: 'pending',
          label: '待处理',
          matches: (row: (typeof rows)[number]) => row.status === '待处理',
        },
      ],
    },
  ],
  renderMobileRow: (row: (typeof rows)[number]) => row.name,
}

describe('Table pagination', () => {
  it('pages desktop and mobile rows together and selects only the current page', () => {
    const onSelectionChange = vi.fn()
    render(
      <Table
        {...baseProps}
        pagination={{ defaultPageSize: 2, showTotal: true }}
        selection={{
          getLabel: (row) => row.name,
          onChange: onSelectionChange,
        }}
      />,
    )
    const region = screen.getByRole('region', { name: '任务表' })
    const table = within(region).getByRole('table', { name: '任务表' })
    const mobile = within(region).getByRole('list', { name: '任务表' })
    const pagination = within(region).getByRole('navigation', {
      name: '任务表分页',
    })
    expect(within(table).getByText('任务 1')).toBeInTheDocument()
    expect(within(mobile).getByText('任务 2')).toBeInTheDocument()
    expect(within(table).queryByText('任务 3')).not.toBeInTheDocument()
    fireEvent.click(
      within(table).getByRole('checkbox', {
        name: '全选任务表当前可选行',
      }),
    )
    expect(onSelectionChange).toHaveBeenLastCalledWith(
      ['1', '2'],
      rows.slice(0, 2),
    )

    fireEvent.click(within(pagination).getByRole('button', { name: '下一页' }))
    expect(within(table).queryByText('任务 1')).not.toBeInTheDocument()
    expect(within(table).getByText('任务 3')).toBeInTheDocument()
    expect(within(mobile).getByText('任务 4')).toBeInTheDocument()
    fireEvent.click(
      within(table).getByRole('checkbox', {
        name: '全选任务表当前可选行',
      }),
    )
    expect(onSelectionChange).toHaveBeenLastCalledWith(
      ['1', '2', '3', '4'],
      rows.slice(0, 4),
    )
    fireEvent.click(within(pagination).getByRole('button', { name: '上一页' }))
    expect(
      within(table).getByRole('checkbox', {
        name: '全选任务表当前可选行',
      }),
    ).toBeChecked()
  })

  it('resets to page one after sort and filter changes', () => {
    const onPageChange = vi.fn()
    render(
      <Table
        {...baseProps}
        pagination={{
          defaultPage: 3,
          defaultPageSize: 2,
          onChange: onPageChange,
          showTotal: true,
        }}
      />,
    )
    const region = screen.getByRole('region', { name: '任务表' })
    const table = within(region).getByRole('table', { name: '任务表' })
    const pagination = within(region).getByRole('navigation', {
      name: '任务表分页',
    })
    expect(within(table).getByText('任务 5')).toBeInTheDocument()
    fireEvent.click(within(table).getByRole('button', { name: /按任务排序/ }))
    expect(onPageChange).toHaveBeenLastCalledWith(1, 2)
    expect(
      within(pagination).getByRole('button', { name: '前往第 1 页' }),
    ).toHaveAttribute('aria-current', 'page')
    fireEvent.click(within(pagination).getByRole('button', { name: '下一页' }))
    fireEvent.click(within(table).getByRole('button', { name: '筛选状态' }))
    const panel = screen.getByRole('dialog', { name: '筛选状态' })
    fireEvent.click(within(panel).getByRole('checkbox', { name: '待处理' }))
    fireEvent.click(within(panel).getByRole('button', { name: '应用' }))
    expect(onPageChange).toHaveBeenLastCalledWith(1, 2)
    expect(
      within(pagination).getByRole('button', { name: '前往第 1 页' }),
    ).toHaveAttribute('aria-current', 'page')
    expect(within(table).getAllByRole('row')).toHaveLength(3)
  })

  it('leaves controlled pagination unchanged until accepted and clamps shrinking data', () => {
    const onPageChange = vi.fn()
    const { rerender } = render(
      <Table
        {...baseProps}
        pagination={{ page: 2, pageSize: 2, onChange: onPageChange }}
      />,
    )
    const table = screen.getByRole('table', { name: '任务表' })
    fireEvent.click(
      screen
        .getByRole('navigation', { name: '任务表分页' })
        .querySelector('button[aria-label="前往第 3 页"]')!,
    )
    expect(onPageChange).toHaveBeenCalledWith(3, 2)
    expect(within(table).getByText('任务 3')).toBeInTheDocument()
    rerender(
      <Table
        {...baseProps}
        pagination={{ page: 3, pageSize: 2, onChange: onPageChange }}
      />,
    )
    expect(within(table).getByText('任务 5')).toBeInTheDocument()
    rerender(
      <Table
        {...baseProps}
        rows={rows.slice(0, 1)}
        pagination={{ page: 3, pageSize: 2, onChange: onPageChange }}
      />,
    )
    expect(within(table).getByText('任务 1')).toBeInTheDocument()
  })

  it('clamps shrinking data and restores the prior page when data returns', () => {
    const { rerender } = render(
      <Table
        {...baseProps}
        pagination={{ defaultPage: 3, defaultPageSize: 2 }}
      />,
    )
    const table = screen.getByRole('table', { name: '任务表' })
    expect(within(table).getByText('任务 5')).toBeInTheDocument()
    rerender(
      <Table
        {...baseProps}
        rows={rows.slice(0, 1)}
        pagination={{ defaultPage: 3, defaultPageSize: 2 }}
      />,
    )
    expect(within(table).getByText('任务 1')).toBeInTheDocument()
    rerender(
      <Table
        {...baseProps}
        pagination={{ defaultPage: 3, defaultPageSize: 2 }}
      />,
    )
    expect(within(table).getByText('任务 5')).toBeInTheDocument()
  })
})
