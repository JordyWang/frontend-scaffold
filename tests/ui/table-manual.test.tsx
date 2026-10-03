import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Table, type TableSort } from '@/shared/ui'

const rows = [
  { id: 'b', name: '任务 B', status: '已完成' },
  { id: 'a', name: '任务 A', status: '待处理' },
]
const props = {
  caption: '服务端任务表',
  dataMode: 'manual' as const,
  rows,
  getRowKey: (row: (typeof rows)[number]) => row.id,
  columns: [
    {
      key: 'name',
      header: '任务',
      rowScope: 'row' as const,
      sorter: true as const,
      render: (row: (typeof rows)[number]) => row.name,
    },
    {
      key: 'status',
      header: '状态',
      render: (row: (typeof rows)[number]) => row.status,
      filterOptions: [
        { value: 'done', label: '已完成' },
        { value: 'pending', label: '待处理' },
      ],
    },
  ],
  renderMobileRow: (row: (typeof rows)[number]) => row.name,
}

describe('Table manual data mode', () => {
  it('uses externally supplied page rows and total while reporting sort and filter requests', () => {
    const onPageChange = vi.fn()
    const onSortChange = vi.fn()
    const onFiltersChange = vi.fn()
    const rowClassName = vi.fn(
      (_row: (typeof rows)[number], index: number) => `server-row-${index}`,
    )
    const sort: TableSort = { columnKey: 'name', direction: 'asc' }
    const { rerender } = render(
      <Table
        {...props}
        sort={sort}
        filters={{ status: ['done'] }}
        onSortChange={onSortChange}
        onFiltersChange={onFiltersChange}
        rowClassName={rowClassName}
        pagination={{
          page: 2,
          pageSize: 2,
          total: 8,
          onChange: onPageChange,
          showTotal: true,
        }}
      />,
    )
    const region = screen.getByRole('region', { name: '服务端任务表' })
    const table = within(region).getByRole('table')
    const desktopRows = within(table).getAllByRole('row').slice(1)
    expect(region).toHaveAttribute('data-ui-data-mode', 'manual')
    expect(desktopRows.map((row) => row.textContent)).toEqual([
      '任务 B已完成',
      '任务 A待处理',
    ])
    expect(
      within(region).getByRole('navigation', { name: '服务端任务表分页' }),
    ).toHaveTextContent('共 8 条')
    expect(desktopRows[0]).toHaveClass('server-row-2')
    expect(desktopRows[1]).toHaveClass('server-row-3')
    expect(
      within(region)
        .getByRole('list', { name: '服务端任务表' })
        .querySelector('li'),
    ).toHaveClass('server-row-2')
    expect(rowClassName).toHaveBeenCalledTimes(2)

    fireEvent.click(
      within(table).getByRole('button', { name: '按任务排序，升序' }),
    )
    expect(onSortChange).toHaveBeenCalledWith({
      columnKey: 'name',
      direction: 'desc',
    })
    expect(onPageChange).toHaveBeenCalledWith(1, 2)
    expect(desktopRows.map((row) => row.textContent)).toEqual([
      '任务 B已完成',
      '任务 A待处理',
    ])

    fireEvent.click(within(table).getByRole('button', { name: /筛选状态/ }))
    const panel = screen.getByRole('dialog', { name: '筛选状态' })
    fireEvent.click(within(panel).getByRole('checkbox', { name: '待处理' }))
    fireEvent.click(within(panel).getByRole('button', { name: '应用' }))
    expect(onFiltersChange).toHaveBeenCalledWith({
      status: ['done', 'pending'],
    })
    expect(within(table).getByText('任务 A')).toBeInTheDocument()

    fireEvent.click(
      within(
        within(region).getByRole('navigation', { name: '服务端任务表分页' }),
      ).getByRole('button', { name: '下一页' }),
    )
    expect(onPageChange).toHaveBeenCalledWith(3, 2)
    rerender(
      <Table
        {...props}
        rows={[{ id: 'c', name: '任务 C', status: '已完成' }]}
        sort={{ columnKey: 'name', direction: 'desc' }}
        filters={{ status: ['done', 'pending'] }}
        pagination={{
          page: 3,
          pageSize: 2,
          total: 8,
          onChange: onPageChange,
          showTotal: true,
        }}
      />,
    )
    expect(within(table).getByText('任务 C')).toBeInTheDocument()
    expect(within(table).queryByText('任务 B')).toBeNull()
  })

  it('keeps navigation available on an empty server page and skips row callbacks while loading', () => {
    const onPageChange = vi.fn()
    const rowClassName = vi.fn(() => 'custom-row')
    const pagination = {
      page: 2,
      pageSize: 2,
      total: 6,
      onChange: onPageChange,
    }
    const { rerender } = render(
      <Table {...props} rows={[]} pagination={pagination} />,
    )
    const region = screen.getByRole('region', { name: '服务端任务表' })
    expect(within(region).getByRole('table')).toBeInTheDocument()
    expect(
      within(region).getAllByText('当前页暂无数据，请切换页码。'),
    ).toHaveLength(2)
    fireEvent.click(
      within(
        within(region).getByRole('navigation', { name: '服务端任务表分页' }),
      ).getByRole('button', { name: '上一页' }),
    )
    expect(onPageChange).toHaveBeenCalledWith(1, 2)

    rerender(
      <Table
        {...props}
        pagination={pagination}
        loading
        rowClassName={rowClassName}
      />,
    )
    expect(rowClassName).not.toHaveBeenCalled()
    expect(region).toHaveAttribute('aria-busy', 'true')
  })
})
