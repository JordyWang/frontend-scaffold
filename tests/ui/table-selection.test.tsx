import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Table } from '@/shared/ui'

const rows = [
  { id: '1', name: '任务一' },
  { id: '2', name: '任务二' },
  { id: '3', name: '任务三' },
]
const baseProps = {
  caption: '任务表',
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

describe('Table row selection', () => {
  it('selects only enabled current rows and preserves hidden or disabled keys', () => {
    const onChange = vi.fn()
    render(
      <Table
        {...baseProps}
        selection={{
          defaultSelectedKeys: ['2', 'off-page', '3'],
          disabled: (row) => row.id === '3',
          getLabel: (row) => row.name,
          onChange,
        }}
      />,
    )
    const table = within(screen.getByRole('table'))
    const all = table.getByRole('checkbox', {
      name: '全选任务表当前可选行',
    })
    expect(all).toHaveProperty('indeterminate', true)
    expect(all).toHaveAttribute('aria-checked', 'mixed')
    expect(table.getByRole('checkbox', { name: '选择任务三' })).toBeDisabled()
    fireEvent.click(all)
    expect(onChange).toHaveBeenLastCalledWith(['2', 'off-page', '3', '1'], rows)
    expect(all).toBeChecked()
    expect(all).toHaveProperty('indeterminate', false)
    fireEvent.click(all)
    expect(onChange).toHaveBeenLastCalledWith(['off-page', '3'], [rows[2]])
    expect(
      table.getByRole('checkbox', { name: '选择任务一' }),
    ).not.toBeChecked()
  })

  it('leaves controlled selection unchanged until the owner updates it', () => {
    const onChange = vi.fn()
    const selection = {
      selectedKeys: ['2'],
      getLabel: (row: (typeof rows)[number]) => row.name,
      onChange,
    }
    const { rerender } = render(<Table {...baseProps} selection={selection} />)
    const first = within(screen.getByRole('table')).getByRole('checkbox', {
      name: '选择任务一',
    })
    fireEvent.click(first)
    expect(onChange).toHaveBeenCalledWith(['2', '1'], rows.slice(0, 2))
    expect(first).not.toBeChecked()
    rerender(
      <Table
        {...baseProps}
        selection={{ ...selection, selectedKeys: ['2', '1'] }}
      />,
    )
    expect(first).toBeChecked()
  })
})
