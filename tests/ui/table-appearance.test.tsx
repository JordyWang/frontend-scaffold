import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
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

  it('applies semantic classes and styles to desktop, mobile and state slots', () => {
    const classNames = vi.fn(({ state }: { state: string }) => ({
      root: `table-${state}`,
      state: 'custom-state',
      selectionSummary: 'custom-summary',
      scrollRegion: 'custom-scroll',
      table: 'custom-table',
      header: 'custom-header',
      headerRow: 'custom-header-row',
      headerCell: 'custom-header-cell',
      body: 'custom-body',
      row: 'custom-row',
      cell: 'custom-cell',
      expandedRow: 'custom-expanded-row',
      expandedCell: 'custom-expanded-cell',
      mobile: 'custom-mobile',
      mobileToolbar: 'custom-toolbar',
      mobileList: 'custom-list',
      mobileRow: 'custom-mobile-row',
      mobileDetail: 'custom-mobile-detail',
      pagination: 'custom-pagination',
    }))
    const { rerender } = render(
      <Table
        {...props}
        columns={[
          {
            ...columns[0],
            sorter: (left, right) => left.name.localeCompare(right.name),
          },
        ]}
        selection={{ getLabel: (row) => row.name }}
        expandable={{
          defaultExpandedRowKeys: ['task'],
          expandedRowRender: (row) => row.name,
        }}
        pagination={{ defaultPageSize: 1, showTotal: true }}
        className="root-override"
        style={{ color: 'red' }}
        classNames={classNames}
        styles={{
          root: { color: 'blue' },
          headerCell: { letterSpacing: '1px' },
          pagination: { marginTop: '3px' },
        }}
      />,
    )
    const section = screen.getByRole('region', { name: '展示表' })
    const table = screen.getByRole('table', { name: '展示表' })
    const desktopRow = table.querySelector('tbody tr')!
    const mobileList = screen.getByRole('list', { name: '展示表' })
    expect(section).toHaveClass('table-ready', 'root-override')
    expect(section).toHaveStyle({ color: 'rgb(255, 0, 0)' })
    expect(screen.getByText('已选 0 项')).toHaveClass('custom-summary')
    expect(screen.getByRole('region', { name: '展示表横向滚动' })).toHaveClass(
      'custom-scroll',
    )
    expect(table).toHaveClass('custom-table')
    expect(table.querySelector('thead')).toHaveClass('custom-header')
    expect(table.querySelector('thead tr')).toHaveClass('custom-header-row')
    expect(screen.getByRole('columnheader', { name: /任务/ })).toHaveClass(
      'custom-header-cell',
    )
    expect(screen.getByRole('columnheader', { name: /任务/ })).toHaveStyle({
      letterSpacing: '1px',
    })
    expect(table.querySelector('tbody')).toHaveClass('custom-body')
    expect(desktopRow).toHaveClass('custom-row')
    expect(screen.getByRole('rowheader', { name: '任务一' })).toHaveClass(
      'custom-cell',
    )
    expect(table.querySelector('tbody tr:nth-child(2)')).toHaveClass(
      'custom-expanded-row',
    )
    expect(table.querySelector('tbody tr:nth-child(2) td')).toHaveClass(
      'custom-expanded-cell',
    )
    expect(mobileList.parentElement).toHaveClass('custom-mobile')
    expect(mobileList.previousElementSibling).toHaveClass('custom-toolbar')
    expect(mobileList).toHaveClass('custom-list')
    expect(mobileList.querySelector('li')).toHaveClass('custom-mobile-row')
    expect(mobileList.querySelector('[id$="details-mobile"]')).toHaveClass(
      'custom-mobile-detail',
    )
    expect(screen.getByRole('navigation', { name: '展示表分页' })).toHaveClass(
      'custom-pagination',
    )
    expect(screen.getByRole('navigation', { name: '展示表分页' })).toHaveStyle({
      marginTop: '3px',
    })
    expect(classNames).toHaveBeenCalledWith(
      expect.objectContaining({
        size: 'default',
        state: 'ready',
        props: expect.objectContaining({ caption: '展示表' }),
      }),
    )

    rerender(<Table {...props} rows={[]} loading classNames={classNames} />)
    expect(section).toHaveClass('table-loading')
    expect(screen.getByRole('status').parentElement).toHaveClass('custom-state')
    rerender(
      <Table {...props} rows={[]} error="加载失败" classNames={classNames} />,
    )
    expect(section).toHaveClass('table-error')
    rerender(<Table {...props} rows={[]} classNames={classNames} />)
    expect(section).toHaveClass('table-empty')
    rerender(
      <Table
        {...props}
        rows={[]}
        filters={{ name: ['missing'] }}
        classNames={classNames}
      />,
    )
    expect(section).toHaveClass('table-filtered-empty')
  })

  it('uses the displayed index for a row class on both viewports', () => {
    const rowClassName = vi.fn(
      (row: { id: string; name: string }, index: number) =>
        `visible-${index}-${row.id}`,
    )
    render(
      <Table
        {...props}
        rows={[
          { id: 'z', name: '甲' },
          { id: 'a', name: '乙' },
          { id: 'm', name: '丙' },
        ]}
        columns={[
          {
            ...columns[0],
            sorter: (left, right) => left.id.localeCompare(right.id),
          },
        ]}
        defaultSort={{ columnKey: 'name', direction: 'asc' }}
        pagination={{ defaultPage: 2, defaultPageSize: 1 }}
        rowClassName={rowClassName}
      />,
    )
    expect(rowClassName).toHaveBeenCalledTimes(1)
    expect(rowClassName).toHaveBeenLastCalledWith({ id: 'm', name: '丙' }, 1)
    expect(screen.getByRole('table').querySelector('tbody tr')).toHaveClass(
      'visible-1-m',
    )
    expect(
      screen.getByRole('list', { name: '展示表' }).querySelector('li'),
    ).toHaveClass('visible-1-m')
    fireEvent.click(screen.getByRole('button', { name: '下一页' }))
    expect(rowClassName).toHaveBeenLastCalledWith({ id: 'z', name: '甲' }, 2)
  })
})
