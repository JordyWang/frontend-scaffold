import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Table, type TableColumnNode } from '@/shared/ui'

const rows = [
  { id: 'a', name: '任务 A', owner: '甲组', done: 3, pending: 1 },
  { id: 'b', name: '任务 B', owner: '乙组', done: 1, pending: 4 },
]
type Row = (typeof rows)[number]
const columns: TableColumnNode<Row>[] = [
  {
    key: 'name',
    header: '任务',
    rowScope: 'row',
    render: (row) => row.name,
  },
  {
    key: 'delivery',
    header: '交付',
    children: [
      {
        key: 'people',
        header: '人员',
        children: [
          {
            key: 'owner',
            header: '负责人',
            render: (row) => row.owner,
            filterOptions: [
              {
                value: 'a',
                label: '甲组',
                matches: (row) => row.owner === '甲组',
              },
            ],
          },
        ],
      },
      {
        key: 'progress',
        header: '进度',
        children: [
          {
            key: 'done',
            header: '已完成',
            render: (row) => row.done,
            sorter: (left, right) => left.done - right.done,
          },
          { key: 'pending', header: '待处理', render: (row) => row.pending },
        ],
      },
    ],
  },
]

describe('Table column groups', () => {
  it('aligns ragged grouped headers, selection, expansion, rows and summaries', () => {
    render(
      <Table
        caption="交付表"
        rows={rows}
        getRowKey={(row) => row.id}
        columns={columns}
        selection={{ getLabel: (row) => row.name }}
        expandable={{ expandedRowRender: (row) => `${row.name}详情` }}
        summary={(visibleRows) => ({
          name: '合计',
          done: visibleRows.reduce((total, row) => total + row.done, 0),
        })}
        renderMobileRow={(row) => row.name}
      />,
    )
    const region = screen.getByRole('region', { name: '交付表' })
    const table = within(region).getByRole('table', { name: '交付表' })
    const headerRows = table.querySelectorAll('thead tr')
    expect(headerRows).toHaveLength(3)
    expect(headerRows[0].children).toHaveLength(4)
    expect(headerRows[0].children[0]).toHaveAttribute('rowspan', '3')
    expect(headerRows[0].children[1]).toHaveAttribute('rowspan', '3')
    expect(headerRows[0].children[2]).toHaveAttribute('rowspan', '3')
    expect(headerRows[0].children[3]).toHaveAttribute('scope', 'colgroup')
    expect(headerRows[0].children[3]).toHaveAttribute('colspan', '3')
    expect(headerRows[1].children[0]).toHaveAttribute('colspan', '1')
    expect(headerRows[1].children[1]).toHaveAttribute('colspan', '2')
    expect(headerRows[2].children).toHaveLength(3)
    expect(table.querySelector('tbody tr')?.children).toHaveLength(6)
    expect(table.querySelector('tfoot tr')?.children).toHaveLength(6)
    const dataHeaders = table
      .querySelector('tbody tr td:nth-child(5)')!
      .getAttribute('headers')!
      .split(' ')
    expect(
      dataHeaders.map((id) => table.querySelector(`[id="${id}"]`)?.textContent),
    ).toEqual(['交付', '进度', '已完成↕'])
    expect(table.querySelector('tfoot tr td:nth-child(5)')).toHaveAttribute(
      'headers',
      dataHeaders.join(' '),
    )
    expect(
      within(table).getByRole('columnheader', { name: '已完成' }),
    ).toHaveAttribute('aria-sort', 'none')

    fireEvent.click(within(table).getByRole('button', { name: '展开a' }))
    expect(table.querySelector('tbody tr:nth-child(2) td')).toHaveAttribute(
      'colspan',
      '6',
    )
    expect(table.querySelector('tbody tr:nth-child(2)')).toHaveTextContent(
      '任务 A详情',
    )
    const mobileSummary = within(region).getByRole('group', {
      name: '交付表汇总',
    })
    expect(
      within(mobileSummary)
        .getAllByRole('term')
        .map((term) => term.textContent),
    ).toEqual(['任务', '已完成'])
    expect(
      within(mobileSummary)
        .getAllByRole('definition')
        .map((value) => value.textContent),
    ).toEqual(['合计', '4'])
  })

  it('uses leaf columns for sorting and filtering in both desktop and H5 controls', () => {
    render(
      <Table
        caption="交付表"
        rows={rows}
        getRowKey={(row) => row.id}
        columns={columns}
        renderMobileRow={(row) => row.name}
      />,
    )
    const region = screen.getByRole('region', { name: '交付表' })
    const table = within(region).getByRole('table', { name: '交付表' })
    const list = within(region).getByRole('list', { name: '交付表' })
    fireEvent.click(
      within(table).getByRole('button', { name: '按已完成排序，未排序' }),
    )
    expect(table.querySelector('tbody tr:first-child')).toHaveTextContent(
      '任务 B',
    )
    expect(list.querySelector('li:first-child')).toHaveTextContent('任务 B')
    expect(
      within(table).getByRole('columnheader', { name: '已完成' }),
    ).toHaveAttribute('aria-sort', 'ascending')
    fireEvent.click(
      within(list.parentElement!).getByRole('button', { name: '筛选负责人' }),
    )
    const dialog = screen.getByRole('dialog', { name: '筛选负责人' })
    fireEvent.click(within(dialog).getByRole('checkbox', { name: '甲组' }))
    fireEvent.click(within(dialog).getByRole('button', { name: '应用' }))
    expect(table.querySelectorAll('tbody tr')).toHaveLength(1)
    expect(table.querySelector('tbody tr')).toHaveTextContent('任务 A')
    expect(list.querySelectorAll('li')).toHaveLength(1)
  })

  it('ignores groups without data leaves and keeps flat columns compatible', () => {
    render(
      <Table
        caption="空分组表"
        rows={rows}
        getRowKey={(row) => row.id}
        columns={[{ key: 'empty', header: '空组', children: [] }, columns[0]]}
      />,
    )
    const table = screen.getByRole('table', { name: '空分组表' })
    expect(
      within(table).queryByRole('columnheader', { name: '空组' }),
    ).toBeNull()
    expect(table.querySelectorAll('thead tr')).toHaveLength(1)
    expect(table.querySelector('tbody tr')?.children).toHaveLength(1)
  })
})
