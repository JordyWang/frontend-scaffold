import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfigProvider, List, type ListProps } from '@/shared/ui'

const items = Array.from({ length: 7 }, (_, index) => ({
  id: String(index + 1),
  name: `任务 ${index + 1}`,
}))
type Item = (typeof items)[number]

describe('List layout and pagination', () => {
  it('keeps header, footer, global indices and local pages aligned', () => {
    const onChange = vi.fn()
    render(
      <List
        label="任务清单"
        items={items}
        getKey={(item) => item.id}
        renderItem={(item, index) => `${index + 1}. ${item.name}`}
        header={(visible) => `本页 ${visible.length} 项`}
        footer={(visible) => `末项 ${visible.at(-1)?.name ?? '无'}`}
        pagination={{
          defaultPageSize: 3,
          onChange,
          showTotal: true,
        }}
      />,
    )
    const region = screen.getByRole('region', { name: '任务清单' })
    const list = within(region).getByRole('list', { name: '任务清单' })
    const navigation = within(region).getByRole('navigation', {
      name: '任务清单分页',
    })
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    expect(list).toHaveTextContent('1. 任务 1')
    expect(region).toHaveTextContent('本页 3 项')
    expect(region).toHaveTextContent('末项 任务 3')

    fireEvent.click(within(navigation).getByRole('button', { name: '下一页' }))
    expect(onChange).toHaveBeenCalledWith(2, 3)
    expect(list).toHaveTextContent('4. 任务 4')
    expect(list).not.toHaveTextContent('任务 1')
    expect(region).toHaveTextContent('末项 任务 6')

    fireEvent.click(within(navigation).getByRole('button', { name: '下一页' }))
    expect(onChange).toHaveBeenLastCalledWith(3, 3)
    expect(within(list).getAllByRole('listitem')).toHaveLength(1)
    expect(list).toHaveTextContent('7. 任务 7')
    expect(region).toHaveTextContent('本页 1 项')
  })

  it('waits for controlled pagination and clamps visible data when items shrink', () => {
    const onChange = vi.fn()
    const props = {
      label: '受控清单',
      items,
      getKey: (item: Item) => item.id,
      renderItem: (item: Item) => item.name,
    }
    const { rerender } = render(
      <List {...props} pagination={{ page: 2, pageSize: 2, onChange }} />,
    )
    const region = screen.getByRole('region', { name: '受控清单' })
    const list = within(region).getByRole('list', { name: '受控清单' })
    fireEvent.click(within(region).getByRole('button', { name: '下一页' }))
    expect(onChange).toHaveBeenCalledWith(3, 2)
    expect(list).toHaveTextContent('任务 3')
    expect(list).not.toHaveTextContent('任务 5')

    rerender(
      <List
        {...props}
        items={items.slice(0, 3)}
        pagination={{ page: 3, pageSize: 2, onChange }}
      />,
    )
    expect(list).toHaveTextContent('任务 3')
    expect(within(list).getAllByRole('listitem')).toHaveLength(1)
  })

  it('uses container grid, inherited size and state-aware semantic slots', () => {
    const classNames = vi.fn(({ state }) => ({
      root: state === 'error' ? 'border-destructive' : 'border-primary',
      item: 'bg-primary/5',
    }))
    const styles = vi.fn(({ size }) => ({
      root: { backgroundColor: 'red' },
      item: { minHeight: size === 'small' ? 80 : 96 },
    }))
    const props: ListProps<Item> = {
      label: '卡片清单',
      items,
      getKey: (item) => item.id,
      renderItem: (item) => item.name,
      header: '项目列表',
      footer: '列表底部',
      grid: { minItemWidth: 240, gap: 16 },
      pagination: { defaultPageSize: 3 },
      classNames,
      styles,
      className: 'border-border',
      style: { backgroundColor: 'blue' },
    }
    const { rerender } = render(
      <ConfigProvider componentSize="small">
        <List {...props} />
      </ConfigProvider>,
    )
    const region = screen.getByRole('region', { name: '卡片清单' })
    const list = within(region).getByRole('list', { name: '卡片清单' })
    expect(region).toHaveAttribute('data-ui-size', 'small')
    expect(region).toHaveClass('border-border')
    expect(region).not.toHaveClass('border-primary')
    expect((region as HTMLElement).style.backgroundColor).toBe('blue')
    expect(list).toHaveClass('grid')
    expect(list.getAttribute('style')).toContain('240px')
    expect(list.getAttribute('style')).toContain('gap: 16px')
    expect(within(list).getAllByRole('listitem')[0]).toHaveClass(
      'p-3',
      'bg-primary/5',
    )
    expect(within(list).getAllByRole('listitem')[0]).toHaveStyle({
      minHeight: '80px',
    })
    expect(classNames).toHaveBeenCalledWith({
      props: expect.objectContaining({ label: '卡片清单' }),
      size: 'small',
      state: 'ready',
    })

    rerender(
      <ConfigProvider componentSize="small">
        <List {...props} loading />
      </ConfigProvider>,
    )
    expect(region).toHaveAttribute('data-ui-list-state', 'loading')
    expect(region).toHaveAttribute('aria-busy', 'true')
    expect(within(region).queryByRole('list')).toBeNull()
    expect(within(region).queryByRole('navigation')).toBeNull()
    expect(region).toHaveTextContent('项目列表')
    expect(region).toHaveTextContent('列表底部')

    rerender(
      <ConfigProvider componentSize="small">
        <List {...props} error="请求失败" />
      </ConfigProvider>,
    )
    expect(region).toHaveAttribute('data-ui-list-state', 'error')
    expect(within(region).getByRole('alert')).toHaveTextContent('请求失败')
    expect(classNames).toHaveBeenLastCalledWith({
      props: expect.objectContaining({ error: '请求失败' }),
      size: 'small',
      state: 'error',
    })

    rerender(
      <ConfigProvider componentSize="small">
        <List {...props} items={[]} />
      </ConfigProvider>,
    )
    expect(region).toHaveAttribute('data-ui-list-state', 'empty')
    expect(region).toHaveTextContent('暂无内容')
    expect(within(region).queryByRole('navigation')).toBeNull()
  })
})
