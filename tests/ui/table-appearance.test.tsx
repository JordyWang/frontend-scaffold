import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ConfigProvider, Table } from '@/shared/ui'

const rows = [{ id: 'task', name: '任务一' }]
const columns = [
  {
    key: 'name',
    header: '任务',
    rowScope: 'row' as const,
    render: (row: (typeof rows)[number]) => row.name,
  },
]
const props = {
  caption: '展示表',
  rows,
  columns,
  getRowKey: (row: (typeof rows)[number]) => row.id,
  renderMobileRow: (row: (typeof rows)[number]) => row.name,
  expandable: { expandedRowRender: (row: (typeof rows)[number]) => row.name },
}

describe('Table appearance', () => {
  it('sizes desktop cells and H5 cards while preserving accessible controls', () => {
    const { rerender } = render(
      <Table {...props} size="small" bordered rowHoverable={false} />,
    )
    const section = screen.getByRole('region', { name: '展示表' })
    const table = screen.getByRole('table', { name: '展示表' })
    const rowHeader = screen.getByRole('rowheader', { name: '任务一' })
    const desktopRow = table.querySelector('tbody tr')!
    const mobileRow = screen
      .getByRole('list', { name: '展示表' })
      .querySelector('li')!

    expect(section).toHaveAttribute('data-ui-size', 'small')
    expect(section).toHaveAttribute('data-ui-bordered', 'true')
    expect(rowHeader).toHaveClass('px-3', 'py-2', 'border')
    expect(desktopRow).not.toHaveClass('hover:bg-accent/50')
    expect(mobileRow).toHaveClass('p-2', 'border')
    expect(screen.getAllByRole('button', { name: '展开task' })).toHaveLength(2)

    rerender(<Table {...props} size="large" rowHoverable />)
    expect(section).toHaveAttribute('data-ui-size', 'large')
    expect(section).toHaveAttribute('data-ui-bordered', 'false')
    expect(rowHeader).toHaveClass('px-6', 'py-4')
    expect(rowHeader).not.toHaveClass('border')
    expect(desktopRow).toHaveClass('hover:bg-accent/50')
    expect(mobileRow).toHaveClass('p-6', 'hover:bg-accent/50')
    expect(mobileRow).not.toHaveClass('border')
  })

  it('inherits ConfigProvider size and allows an explicit override', () => {
    const { rerender } = render(
      <ConfigProvider componentSize="large">
        <Table {...props} />
      </ConfigProvider>,
    )
    expect(screen.getByRole('region', { name: '展示表' })).toHaveAttribute(
      'data-ui-size',
      'large',
    )
    rerender(
      <ConfigProvider componentSize="large">
        <Table {...props} size="small" />
      </ConfigProvider>,
    )
    expect(screen.getByRole('region', { name: '展示表' })).toHaveAttribute(
      'data-ui-size',
      'small',
    )
  })
})
