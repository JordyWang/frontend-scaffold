import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Table, type TableSort } from '@/shared/ui'

const rows = [
  { id: 'a', name: 'A' },
  { id: 'c', name: 'C' },
  { id: 'b', name: 'B' },
]
const columns = [
  {
    key: 'name',
    header: '名称',
    render: (row: (typeof rows)[number]) => row.name,
    sorter: (left: (typeof rows)[number], right: (typeof rows)[number]) =>
      left.name.localeCompare(right.name),
  },
]

function tableOrder() {
  return within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map((row) => row.textContent)
}

describe('Table sorting', () => {
  it('cycles ascending, descending and original order without mutating rows', () => {
    const onSortChange = vi.fn()
    render(
      <Table
        caption="任务表"
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        defaultSort={{ columnKey: 'name', direction: 'asc' }}
        onSortChange={onSortChange}
      />,
    )
    const header = screen.getByRole('columnheader')
    expect(header).toHaveAttribute('aria-sort', 'ascending')
    expect(tableOrder()).toEqual(['A', 'B', 'C'])
    fireEvent.click(screen.getByRole('button', { name: '按名称排序，升序' }))
    expect(header).toHaveAttribute('aria-sort', 'descending')
    expect(tableOrder()).toEqual(['C', 'B', 'A'])
    expect(onSortChange).toHaveBeenLastCalledWith({
      columnKey: 'name',
      direction: 'desc',
    })
    fireEvent.click(screen.getByRole('button', { name: '按名称排序，降序' }))
    expect(header).toHaveAttribute('aria-sort', 'none')
    expect(tableOrder()).toEqual(['A', 'C', 'B'])
    expect(onSortChange).toHaveBeenLastCalledWith(null)
    expect(rows.map((row) => row.id)).toEqual(['a', 'c', 'b'])
  })

  it('keeps controlled rows unchanged until the owner updates sort', () => {
    const onSortChange = vi.fn()
    const current: TableSort = { columnKey: 'name', direction: 'asc' }
    const props = {
      caption: '任务表',
      columns,
      rows,
      getRowKey: (row: (typeof rows)[number]) => row.id,
      onSortChange,
    }
    const { rerender } = render(<Table {...props} sort={current} />)
    fireEvent.click(screen.getByRole('button', { name: '按名称排序，升序' }))
    expect(onSortChange).toHaveBeenCalledWith({
      columnKey: 'name',
      direction: 'desc',
    })
    expect(tableOrder()).toEqual(['A', 'B', 'C'])
    rerender(
      <Table {...props} sort={{ columnKey: 'name', direction: 'desc' }} />,
    )
    expect(tableOrder()).toEqual(['C', 'B', 'A'])
  })

  it('preserves input order when the comparator reports equal values', () => {
    const equalRows = [
      { id: 'first', name: 'B' },
      { id: 'second', name: 'B' },
      { id: 'third', name: 'A' },
    ]
    render(
      <Table
        caption="相同名称"
        rows={equalRows}
        getRowKey={(row) => row.id}
        defaultSort={{ columnKey: 'name', direction: 'asc' }}
        columns={[
          {
            key: 'name',
            header: '名称',
            render: (row) => `${row.id}:${row.name}`,
            sorter: (left, right) => left.name.localeCompare(right.name),
          },
        ]}
      />,
    )
    expect(tableOrder()).toEqual(['third:A', 'first:B', 'second:B'])
  })
})
