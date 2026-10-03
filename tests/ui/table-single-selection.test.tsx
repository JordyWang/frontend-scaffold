import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Table } from '@/shared/ui'

const rows = [
  { id: 'plan', name: '制定计划' },
  { id: 'build', name: '实现组件' },
  { id: 'review', name: '验证交互' },
]
const props = {
  caption: '单选任务表',
  rows,
  getRowKey: (row: (typeof rows)[number]) => row.id,
  columns: [
    {
      key: 'name',
      header: '任务',
      render: (row: (typeof rows)[number]) => row.name,
    },
  ],
  renderMobileRow: (row: (typeof rows)[number]) => row.name,
}

describe('Table single row selection', () => {
  it('uses native radios, keeps a single selection across pages and protects disabled rows', () => {
    const onChange = vi.fn()
    render(
      <Table
        {...props}
        selection={{
          mode: 'single',
          defaultSelectedKeys: ['plan', 'review'],
          getLabel: (row) => row.name,
          disabled: (row) => row.id === 'build',
          onChange,
        }}
        pagination={{ defaultPageSize: 2, showTotal: true }}
      />,
    )
    const region = screen.getByRole('region', { name: '单选任务表' })
    const table = within(region).getByRole('table')
    const list = within(region).getByRole('list', { name: '单选任务表' })
    const header = table.querySelector('thead th')!
    expect(header).toHaveTextContent('选择一行')
    expect(within(table).queryByRole('checkbox')).toBeNull()
    expect(within(list).queryByRole('checkbox')).toBeNull()
    expect(
      within(table).getByRole('radio', { name: '选择制定计划' }),
    ).toBeChecked()
    expect(
      within(table).getByRole('radio', { name: '选择实现组件' }),
    ).toBeDisabled()
    expect(
      within(table).getByRole('radio', { name: '选择制定计划' }),
    ).toHaveAttribute('name', expect.stringContaining('-table'))
    expect(
      within(list).getByRole('radio', { name: '选择制定计划' }),
    ).toHaveAttribute('name', expect.stringContaining('-mobile'))
    expect(table.querySelector('tbody tr')).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(table.querySelector('tbody tr')).toHaveClass('bg-primary/10')
    expect(list.querySelector('li')).toHaveAttribute('data-ui-selected', 'true')
    expect(list.querySelector('li')).toHaveClass('bg-primary/10')
    expect(region).toHaveTextContent('已选 1 项')

    fireEvent.click(
      within(
        within(region).getByRole('navigation', { name: '单选任务表分页' }),
      ).getByRole('button', { name: '下一页' }),
    )
    fireEvent.click(within(table).getByRole('radio', { name: '选择验证交互' }))
    expect(onChange).toHaveBeenLastCalledWith(['review'], [rows[2]])
    expect(
      within(table).getByRole('radio', { name: '选择验证交互' }),
    ).toBeChecked()
    expect(
      within(list).getByRole('radio', { name: '选择验证交互' }),
    ).toBeChecked()
    fireEvent.click(within(table).getByRole('radio', { name: '选择验证交互' }))
    expect(onChange).toHaveBeenCalledTimes(1)
    fireEvent.click(
      within(
        within(region).getByRole('navigation', { name: '单选任务表分页' }),
      ).getByRole('button', { name: '上一页' }),
    )
    expect(
      within(table).getByRole('radio', { name: '选择制定计划' }),
    ).not.toBeChecked()
    expect(table.querySelector('tbody tr')).toHaveAttribute(
      'aria-selected',
      'false',
    )
    expect(list.querySelector('li')).not.toHaveAttribute('data-ui-selected')
  })

  it('waits for controlled selection and reports only one selected key', () => {
    const onChange = vi.fn()
    const selection = {
      mode: 'single' as const,
      selectedKeys: ['plan', 'review'],
      onChange,
    }
    const { rerender } = render(<Table {...props} selection={selection} />)
    const table = screen.getByRole('table', { name: '单选任务表' })
    expect(within(table).getByRole('radio', { name: '选择plan' })).toBeChecked()
    expect(
      within(table).getByRole('radio', { name: '选择review' }),
    ).not.toBeChecked()
    fireEvent.click(within(table).getByRole('radio', { name: '选择build' }))
    expect(onChange).toHaveBeenCalledWith(['build'], [rows[1]])
    expect(within(table).getByRole('radio', { name: '选择plan' })).toBeChecked()
    rerender(
      <Table
        {...props}
        selection={{ ...selection, selectedKeys: ['build'] }}
      />,
    )
    expect(
      within(table).getByRole('radio', { name: '选择build' }),
    ).toBeChecked()
    expect(table.querySelector('tbody tr:nth-child(2)')).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('keeps checkbox selection as the default mode and highlights selected rows', () => {
    render(
      <Table
        {...props}
        selection={{
          defaultSelectedKeys: ['plan'],
          getLabel: (row) => row.name,
        }}
      />,
    )
    const table = screen.getByRole('table', { name: '单选任务表' })
    expect(
      within(table).getByRole('checkbox', { name: '选择制定计划' }),
    ).toBeChecked()
    expect(
      within(table).getByRole('checkbox', { name: '全选单选任务表当前可选行' }),
    ).toBeInTheDocument()
    expect(table.querySelector('tbody tr')).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(table.querySelector('tbody tr')).toHaveClass('bg-primary/10')
  })
})
