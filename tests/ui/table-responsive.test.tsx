import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Table, type TableColumnNode } from '@/shared/ui'

const rows = [
  { id: 'a', name: '任务 A', owner: '甲组', done: 3, pending: 1 },
  { id: 'b', name: '任务 B', owner: '乙组', done: 1, pending: 4 },
  { id: 'c', name: '任务 C', owner: '甲组', done: 2, pending: 2 },
]
type Row = (typeof rows)[number]

const columns: TableColumnNode<Row>[] = [
  { key: 'name', header: '任务', render: (row) => row.name },
  {
    key: 'delivery',
    header: '交付',
    minContainerWidth: 500,
    children: [
      {
        key: 'owner',
        header: '负责人',
        minContainerWidth: 600,
        render: (row) => row.owner,
        filterOptions: [
          { value: 'a', label: '甲组', matches: (row) => row.owner === '甲组' },
        ],
      },
      {
        key: 'done',
        header: '已完成',
        minContainerWidth: 700,
        render: (row) => row.done,
        sorter: (left, right) => left.done - right.done,
      },
      {
        key: 'pending',
        header: '待处理',
        minContainerWidth: 850,
        render: (row) => row.pending,
      },
    ],
  },
]

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Table container responsive columns', () => {
  it('hides an entire group below its threshold and restores it at the boundary', () => {
    let width = 599
    let notifyResize: ResizeObserverCallback | undefined
    class MockResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        notifyResize = callback
      }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => ({ width }) as DOMRect,
    )
    render(
      <Table
        caption="分组断点表"
        rows={rows}
        getRowKey={(row) => row.id}
        columns={[
          columns[0],
          {
            key: 'people',
            header: '人员',
            minContainerWidth: 600,
            children: [
              { key: 'owner', header: '负责人', render: (row) => row.owner },
            ],
          },
        ]}
        renderMobileRow={(row, context) =>
          `${row.name}: ${context.visibleColumnKeys.join(',')}`
        }
      />,
    )
    const region = screen.getByRole('region', { name: '分组断点表' })
    const table = within(region).getByRole('table', { name: '分组断点表' })
    const list = within(region).getByRole('list', { name: '分组断点表' })
    expect(table.querySelectorAll('thead tr')).toHaveLength(1)
    expect(
      within(table).queryByRole('columnheader', { name: '人员' }),
    ).toBeNull()
    expect(list.querySelector('li')).toHaveTextContent('任务 A: name')

    width = 600
    act(() => notifyResize?.([], {} as ResizeObserver))
    expect(table.querySelectorAll('thead tr')).toHaveLength(2)
    expect(
      within(table).getByRole('columnheader', { name: '人员' }),
    ).toHaveAttribute('colspan', '1')
    expect(list.querySelector('li')).toHaveTextContent('任务 A: name,owner')
  })

  it('recalculates grouped headers, data, summary and H5 context as the container resizes', () => {
    let width = 900
    let notifyResize: ResizeObserverCallback | undefined
    class MockResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        notifyResize = callback
      }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => ({ width }) as DOMRect,
    )
    const resize = (nextWidth: number) => {
      width = nextWidth
      act(() => notifyResize?.([], {} as ResizeObserver))
    }

    render(
      <Table
        caption="响应式任务表"
        rows={rows}
        getRowKey={(row) => row.id}
        columns={columns}
        defaultSort={{ columnKey: 'done', direction: 'asc' }}
        defaultFilters={{ owner: ['a'] }}
        selection={{ getLabel: (row) => row.name }}
        expandable={{ expandedRowRender: (row) => `${row.name}详情` }}
        summary={(visibleRows) => ({
          name: '汇总',
          done: visibleRows.reduce((total, row) => total + row.done, 0),
          pending: visibleRows.reduce((total, row) => total + row.pending, 0),
        })}
        renderMobileRow={(row, context) => (
          <span>{`${row.name}: ${context.visibleColumnKeys.join(',')}; ${context.containerWidth}`}</span>
        )}
      />,
    )

    const region = screen.getByRole('region', { name: '响应式任务表' })
    const table = within(region).getByRole('table', {
      name: '响应式任务表',
    })
    const list = within(region).getByRole('list', { name: '响应式任务表' })
    const bodyRows = () => table.querySelectorAll('tbody tr')
    const expandedCell = () =>
      table.querySelector('tbody td[id$="-details-table"]')
    const group = () =>
      within(table).queryByRole('columnheader', { name: '交付' })

    expect(group()).toHaveAttribute('colspan', '3')
    expect(bodyRows()).toHaveLength(2)
    expect(bodyRows()[0]).toHaveTextContent('任务 C')
    expect(list.querySelector('li')).toHaveTextContent(
      '任务 C: name,owner,done,pending; 900',
    )
    expect(table.querySelector('tfoot')).toHaveTextContent('5')
    fireEvent.click(within(table).getByRole('button', { name: '展开c' }))
    expect(expandedCell()).toHaveAttribute('colspan', '6')
    const sortButton = within(table).getByRole('button', {
      name: '按已完成排序，升序',
    })
    sortButton.focus()

    resize(800)
    expect(sortButton).toHaveFocus()
    expect(group()).toHaveAttribute('colspan', '2')
    expect(
      within(table).queryByRole('columnheader', { name: '待处理' }),
    ).toBeNull()
    expect(expandedCell()).toHaveAttribute('colspan', '5')
    expect(table.querySelector('tfoot')).not.toHaveTextContent('待处理')
    expect(list.querySelector('li')).toHaveTextContent(
      '任务 C: name,owner,done; 800',
    )

    resize(650)
    expect(region).toHaveFocus()
    expect(group()).toHaveAttribute('colspan', '1')
    expect(bodyRows()[0]).toHaveTextContent('任务 A')
    expect(expandedCell()).toHaveAttribute('colspan', '4')
    expect(
      within(region).queryByRole('button', { name: /按已完成排序/ }),
    ).toBeNull()
    expect(list.querySelector('li')).toHaveTextContent(
      '任务 A: name,owner; 650',
    )

    resize(550)
    expect(group()).toBeNull()
    expect(bodyRows()).toHaveLength(4)
    expect(bodyRows()[0]).toHaveTextContent('任务 A')
    expect(
      within(region).queryByRole('button', { name: '筛选负责人' }),
    ).toBeNull()
    expect(list.querySelector('li')).toHaveTextContent('任务 A: name; 550')
    expect(
      within(region).getByRole('group', { name: '响应式任务表汇总' }),
    ).not.toHaveTextContent('已完成')

    resize(900)
    expect(group()).toHaveAttribute('colspan', '3')
    expect(bodyRows()).toHaveLength(3)
    expect(bodyRows()[0]).toHaveTextContent('任务 C')
    expect(
      within(table).getByRole('columnheader', { name: '已完成' }),
    ).toHaveAttribute('aria-sort', 'ascending')
    expect(
      within(table).getByRole('button', { name: /筛选负责人/ }),
    ).toBeInTheDocument()
    expect(list.querySelector('li')).toHaveTextContent(
      '任务 C: name,owner,done,pending; 900',
    )
  })
})
