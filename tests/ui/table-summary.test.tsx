import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Table } from '@/shared/ui'

const rows = [
  { id: 'c', name: '任务 C', count: 3 },
  { id: 'a', name: '任务 A', count: 1 },
  { id: 'b', name: '任务 B', count: 2 },
]
const columns = [
  {
    key: 'name',
    header: <span>任务名称</span>,
    summaryLabel: '名称',
    rowScope: 'row' as const,
    render: (row: (typeof rows)[number]) => row.name,
    sorter: (left: (typeof rows)[number], right: (typeof rows)[number]) =>
      left.name.localeCompare(right.name),
  },
  {
    key: 'count',
    header: '数量',
    align: 'right' as const,
    render: (row: (typeof rows)[number]) => row.count,
    filterOptions: [
      {
        value: 'high',
        label: '至少两项',
        matches: (row: (typeof rows)[number]) => row.count >= 2,
      },
    ],
  },
]
const props = {
  caption: '任务统计表',
  columns,
  rows,
  getRowKey: (row: (typeof rows)[number]) => row.id,
  renderMobileRow: (row: (typeof rows)[number]) => row.name,
}

describe('Table title, footer and summary', () => {
  it('aligns summary cells with selection and expansion columns and mirrors values on H5', () => {
    const summary = vi.fn((visibleRows: typeof rows) => ({
      name: '当前页汇总',
      count: visibleRows.reduce((total, row) => total + row.count, 0),
    }))
    render(
      <Table
        {...props}
        title="任务清单"
        footer={(visibleRows) => `当前显示 ${visibleRows.length} 条`}
        summary={summary}
        selection={{ getLabel: (row) => row.name }}
        expandable={{ expandedRowRender: (row) => row.name }}
        classNames={{
          title: 'custom-title',
          summary: 'custom-summary',
          summaryCell: 'custom-summary-cell',
          mobileSummary: 'custom-mobile-summary',
          mobileSummaryItem: 'custom-mobile-item',
          footer: 'custom-footer',
        }}
        styles={{ summaryCell: { fontWeight: 700 }, footer: { opacity: 0.8 } }}
      />,
    )
    const region = screen.getByRole('region', { name: '任务统计表' })
    const table = within(region).getByRole('table', { name: '任务统计表' })
    expect(within(region).getByText('任务清单')).toHaveClass('custom-title')
    expect(table.querySelector('caption')).toHaveTextContent('任务统计表')
    const summaryRow = table.querySelector('tfoot tr')!
    expect(summaryRow.parentElement).toHaveClass('custom-summary')
    expect(summaryRow.children).toHaveLength(4)
    expect(summaryRow.children[0]).toBeEmptyDOMElement()
    expect(summaryRow.children[1]).toBeEmptyDOMElement()
    expect(summaryRow.children[2]).toHaveTextContent('当前页汇总')
    expect(summaryRow.children[3]).toHaveTextContent('6')
    expect(summaryRow.children[3]).toHaveClass(
      'text-right',
      'custom-summary-cell',
    )
    expect(summaryRow.children[3]).toHaveStyle({ fontWeight: '700' })
    const mobile = within(region).getByRole('group', { name: '任务统计表汇总' })
    expect(mobile).toHaveClass('custom-mobile-summary')
    expect(
      within(mobile)
        .getAllByRole('term')
        .map((term) => term.textContent),
    ).toEqual(['名称', '数量'])
    expect(
      within(mobile)
        .getAllByRole('definition')
        .map((value) => value.textContent),
    ).toEqual(['当前页汇总', '6'])
    expect(within(mobile).getAllByRole('term')[0].parentElement).toHaveClass(
      'custom-mobile-item',
    )
    expect(within(region).getByText('当前显示 3 条')).toHaveClass(
      'custom-footer',
    )
    expect(within(region).getByText('当前显示 3 条')).toHaveStyle({
      opacity: '0.8',
    })
    expect(summary).toHaveBeenLastCalledWith(rows)
  })

  it('passes final page rows after sorting and pagination to title, footer and summary', () => {
    const title = vi.fn((visibleRows: typeof rows) => visibleRows[0]?.name)
    const footer = vi.fn(
      (visibleRows: typeof rows) => `当前页 ${visibleRows.length} 条`,
    )
    const summary = vi.fn((visibleRows: typeof rows) => ({
      count: visibleRows.reduce((total, row) => total + row.count, 0),
    }))
    render(
      <Table
        {...props}
        defaultSort={{ columnKey: 'name', direction: 'asc' }}
        pagination={{ defaultPageSize: 1, showTotal: true }}
        title={title}
        footer={footer}
        summary={summary}
      />,
    )
    const region = screen.getByRole('region', { name: '任务统计表' })
    const table = within(region).getByRole('table')
    expect(title).toHaveBeenLastCalledWith([rows[1]])
    expect(footer).toHaveBeenLastCalledWith([rows[1]])
    expect(summary).toHaveBeenLastCalledWith([rows[1]])
    expect(table.querySelector('tfoot')).toHaveTextContent('1')
    fireEvent.click(
      within(
        within(region).getByRole('navigation', { name: '任务统计表分页' }),
      ).getByRole('button', { name: '下一页' }),
    )
    expect(title).toHaveBeenLastCalledWith([rows[2]])
    expect(footer).toHaveBeenLastCalledWith([rows[2]])
    expect(summary).toHaveBeenLastCalledWith([rows[2]])
    expect(table.querySelector('tfoot')).toHaveTextContent('2')
    fireEvent.click(within(table).getByRole('button', { name: '筛选数量' }))
    const panel = screen.getByRole('dialog', { name: '筛选数量' })
    fireEvent.click(within(panel).getByRole('checkbox', { name: '至少两项' }))
    fireEvent.click(within(panel).getByRole('button', { name: '应用' }))
    expect(title).toHaveBeenLastCalledWith([rows[2]])
    expect(footer).toHaveBeenLastCalledWith([rows[2]])
    expect(summary).toHaveBeenLastCalledWith([rows[2]])
    expect(table.querySelector('tfoot')).toHaveTextContent('2')
  })

  it('keeps title and footer in data states and leaves manual rows unchanged', () => {
    const summary = vi.fn((visibleRows: typeof rows) => ({
      count: visibleRows.length,
    }))
    const { rerender } = render(
      <Table
        {...props}
        rows={[]}
        title="任务清单"
        footer="数据来源：服务端"
        summary={summary}
      />,
    )
    const region = screen.getByRole('region', { name: '任务统计表' })
    expect(within(region).getByText('任务清单')).toBeInTheDocument()
    expect(within(region).getByText('数据来源：服务端')).toBeInTheDocument()
    expect(summary).not.toHaveBeenCalled()
    rerender(
      <Table
        {...props}
        loading
        title="任务清单"
        footer="数据来源：服务端"
        summary={summary}
      />,
    )
    expect(within(region).getByText('任务清单')).toBeInTheDocument()
    expect(within(region).getByText('数据来源：服务端')).toBeInTheDocument()
    expect(summary).not.toHaveBeenCalled()
    rerender(
      <Table
        {...props}
        error="加载失败"
        title="任务清单"
        footer="数据来源：服务端"
        summary={summary}
      />,
    )
    expect(within(region).getByText('任务清单')).toBeInTheDocument()
    expect(within(region).getByText('数据来源：服务端')).toBeInTheDocument()
    expect(summary).not.toHaveBeenCalled()
    rerender(
      <Table
        {...props}
        dataMode="manual"
        rows={[rows[0]]}
        pagination={{ page: 2, pageSize: 1, total: 3, onChange: vi.fn() }}
        title="任务清单"
        footer="数据来源：服务端"
        summary={summary}
      />,
    )
    expect(
      within(region).getByRole('table').querySelector('tbody'),
    ).toHaveTextContent('任务 C')
    expect(summary).toHaveBeenLastCalledWith([rows[0]])
  })
})
