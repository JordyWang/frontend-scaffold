import { act, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Table, type TableColumnNode } from '@/shared/ui'

const rows = [
  {
    id: 'a',
    name: '任务 A',
    owner: '甲',
    team: '甲组',
    status: '进行中',
    updated: '今天',
  },
]
type Row = (typeof rows)[number]

const columns = (hidePeople = false): TableColumnNode<Row>[] => [
  {
    key: 'name',
    header: '任务',
    fixed: 'start',
    width: 120,
    render: (row) => row.name,
  },
  {
    key: 'people',
    header: '人员',
    fixed: 'start',
    hidden: hidePeople,
    children: [
      {
        key: 'owner',
        header: '负责人',
        width: 100,
        render: (row) => row.owner,
      },
      { key: 'team', header: '团队', width: 90, render: (row) => row.team },
    ],
  },
  { key: 'status', header: '状态', render: (row) => row.status },
  {
    key: 'updated',
    header: '更新于',
    fixed: 'end',
    width: 100,
    render: (row) => row.updated,
  },
]

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Table fixed columns', () => {
  it('measures logical offsets for grouped, structural and summary cells and recalculates them', () => {
    const widths: Record<string, number> = {
      name: 120,
      owner: 100,
      team: 90,
      status: 160,
      updated: 100,
      selection: 56,
      expansion: 56,
    }
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
      function (this: HTMLElement) {
        const key =
          this.getAttribute('data-ui-table-leaf') ??
          this.getAttribute('data-ui-table-structure')
        return { width: key ? widths[key] : 0 } as DOMRect
      },
    )
    const props = {
      caption: '固定列测试表',
      rows,
      getRowKey: (row: Row) => row.id,
      selection: { getLabel: (row: Row) => row.name },
      expandable: { expandedRowRender: (row: Row) => `${row.name}详情` },
      summary: () => ({ name: '汇总', updated: '今天' }),
    }
    const { rerender } = render(<Table {...props} columns={columns()} />)
    const table = within(
      screen.getByRole('region', { name: '固定列测试表' }),
    ).getByRole('table', { name: '固定列测试表' })
    const header = (key: string) =>
      table.querySelector<HTMLElement>(`thead th[id$="-column-${key}"]`)
    const body = (key: string) =>
      table.querySelector<HTMLElement>(
        `tbody tr:first-child [headers$="-column-${key}"]`,
      )
    const summary = (key: string) =>
      table.querySelector<HTMLElement>(`tfoot [headers$="-column-${key}"]`)

    const start = (element: HTMLElement | null) =>
      element?.style.getPropertyValue('inset-inline-start')
    const end = (element: HTMLElement | null) =>
      element?.style.getPropertyValue('inset-inline-end')

    expect(
      start(
        table.querySelector('thead th[data-ui-table-structure="selection"]'),
      ),
    ).toBe('0')
    expect(
      start(
        table.querySelector('thead th[data-ui-table-structure="expansion"]'),
      ),
    ).toBe('56px')
    expect(start(header('name'))).toBe('112px')
    expect(header('name')).toHaveStyle({ minWidth: '120px' })
    expect(start(header('people'))).toBe('232px')
    expect(start(header('owner'))).toBe('232px')
    expect(start(header('team'))).toBe('332px')
    expect(end(header('updated'))).toBe('0')
    expect(start(body('owner'))).toBe('232px')
    expect(start(summary('team'))).toBe('332px')
    expect(end(summary('updated'))).toBe('0')

    widths.name = 150
    act(() => notifyResize?.([], {} as ResizeObserver))
    expect(start(header('people'))).toBe('262px')
    expect(start(body('team'))).toBe('362px')

    rerender(<Table {...props} columns={columns(true)} />)
    expect(header('people')).toBeNull()
    expect(start(header('name'))).toBe('112px')
    expect(end(header('updated'))).toBe('0')
    expect(table.querySelector('tbody tr:first-child')?.children).toHaveLength(
      5,
    )
  })
})
