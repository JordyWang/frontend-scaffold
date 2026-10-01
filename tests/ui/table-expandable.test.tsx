import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Table } from '@/shared/ui'

const rows = [
  { id: 'one', name: '任务一', detail: '第一条详情' },
  { id: 'two', name: '任务二', detail: '第二条详情' },
]

const columns = [
  {
    key: 'name',
    header: '任务',
    render: (row: (typeof rows)[number]) => row.name,
  },
]

describe('Table expandable rows', () => {
  it('renders a keyboard and touch sized detail toggle with expanded content', () => {
    const onExpandedRowsChange = vi.fn()
    render(
      <Table
        caption="任务表"
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        expandable={{
          defaultExpandedRowKeys: ['one'],
          getLabel: (row) => row.name,
          onExpandedRowsChange,
          expandedRowRender: (row, index) => (
            <span>
              {index + 1}:{row.detail}
            </span>
          ),
        }}
      />,
    )

    const table = within(screen.getByRole('table', { name: '任务表' }))
    const collapse = table.getByRole('button', { name: '收起任务一' })
    expect(collapse).toHaveAttribute('aria-expanded', 'true')
    expect(collapse).toHaveAttribute('aria-controls')
    expect(table.getByText('1:第一条详情')).toBeInTheDocument()
    expect(collapse).toHaveClass('min-h-11', 'min-w-11')

    fireEvent.click(collapse)
    expect(table.getByRole('button', { name: '展开任务一' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(table.queryByText('1:第一条详情')).toBeNull()
    expect(onExpandedRowsChange).toHaveBeenLastCalledWith([], [])

    const expand = table.getByRole('button', { name: '展开任务一' })
    fireEvent.keyDown(expand, { key: 'Enter' })
    fireEvent.click(expand)
    expect(table.getByText('1:第一条详情')).toBeInTheDocument()
  })

  it('keeps controlled expansion unchanged until the owner updates it', () => {
    const onExpandedRowsChange = vi.fn()
    const props = {
      caption: '受控任务表',
      rows,
      columns,
      getRowKey: (row: (typeof rows)[number]) => row.id,
      expandable: {
        expandedRowKeys: ['one'],
        onExpandedRowsChange,
        expandedRowRender: (row: (typeof rows)[number]) => row.detail,
      },
    }
    const { rerender } = render(<Table {...props} />)
    const table = within(screen.getByRole('table', { name: '受控任务表' }))
    fireEvent.click(table.getByRole('button', { name: '收起one' }))
    expect(onExpandedRowsChange).toHaveBeenCalledWith([], [])
    expect(table.getByText('第一条详情')).toBeInTheDocument()

    rerender(
      <Table
        {...props}
        expandable={{
          ...props.expandable,
          expandedRowKeys: [],
        }}
      />,
    )
    expect(table.queryByText('第一条详情')).toBeNull()
  })

  it('does not offer expansion for rows rejected by rowExpandable', () => {
    render(
      <Table
        caption="部分展开表"
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        expandable={{
          rowExpandable: (row) => row.id === 'one',
          expandedRowRender: (row) => row.detail,
        }}
      />,
    )
    expect(screen.getByRole('button', { name: '展开one' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '展开two' })).toBeNull()
  })
})
