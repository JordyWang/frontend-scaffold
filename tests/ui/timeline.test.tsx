import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConfigProvider, Timeline, type TimelineItem } from '@/shared/ui'

afterEach(() => vi.unstubAllGlobals())

const items: TimelineItem[] = [
  {
    key: 'a',
    title: '提交',
    label: '09:00',
    color: 'success',
    children: <button>查看提交</button>,
  },
  {
    key: 'b',
    title: '处理',
    loading: true,
    children: <input aria-label="时间轴备注" defaultValue="原始备注" />,
  },
  {
    key: 'c',
    title: '发布',
    color: 'error',
    children: <button>重试发布</button>,
  },
]

describe('Timeline', () => {
  it('keeps a native ordered list and legacy title / children API with text statuses', () => {
    render(<Timeline items={items} label="任务历史" />)
    const list = screen.getByRole('list', { name: '任务历史记录' })
    expect(list.tagName).toBe('OL')
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    expect(within(list).getByRole('heading', { name: '提交' })).toBeVisible()
    expect(within(list).getByText('09:00')).toBeVisible()
    expect(within(list).getByText('成功：')).toBeInTheDocument()
    expect(within(list).getByText('错误：')).toBeInTheDocument()
    expect(list).not.toHaveAttribute('tabindex')
    expect(list).not.toHaveAttribute('aria-describedby')
  })

  it('reverses actual DOM order without mutating input or remounting keyed content', () => {
    const frozen = Object.freeze([...items]) as unknown as TimelineItem[]
    const { rerender } = render(<Timeline items={frozen} />)
    const input = screen.getByRole('textbox', { name: '时间轴备注' })
    fireEvent.change(input, { target: { value: '保留草稿' } })
    act(() => input.focus())
    rerender(
      <Timeline
        items={frozen}
        reverse
        mode="alternate"
        orientation="horizontal"
      />,
    )
    expect(screen.getByRole('list')).toHaveAttribute('reversed')
    expect(
      screen.getAllByRole('heading').map((node) => node.textContent),
    ).toEqual(['发布', '处理', '提交'])
    expect(screen.getByRole('textbox')).toBe(input)
    expect(input).toHaveValue('保留草稿')
    expect(input).toHaveFocus()
    expect(frozen.map((item) => item.key)).toEqual(['a', 'b', 'c'])
  })

  it('reports loading once, hides decoration and supports explicit status text with a custom marker', () => {
    render(
      <Timeline
        items={[
          {
            key: 'working',
            title: '处理中',
            loading: true,
            children: '等待结果',
          },
          {
            key: 'custom',
            title: '已完成',
            dot: <span>装饰性完成图标</span>,
            statusText: '审核通过',
            color: 'success',
            children: '可查看结果',
          },
        ]}
      />,
    )
    const nodes = screen.getAllByRole('listitem')
    expect(nodes[0]).toHaveAttribute('aria-busy', 'true')
    expect(
      nodes[0].querySelector('[data-ui-timeline-loading-indicator]'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('进行中：')).toHaveLength(1)
    expect(nodes[1]).not.toHaveAttribute('aria-busy')
    expect(screen.getByText('审核通过：')).toBeInTheDocument()
    expect(screen.queryByText('成功：')).not.toBeInTheDocument()
    expect(
      screen.getByText('装饰性完成图标').closest('[aria-hidden]'),
    ).toHaveAttribute('aria-hidden', 'true')
  })

  it('supports zero titles / labels and empty / single item states', () => {
    const { rerender } = render(
      <Timeline items={[{ title: 0, label: 0, children: '零值' }]} />,
    )
    expect(screen.getByRole('heading', { name: '0' })).toBeInTheDocument()
    expect(screen.getAllByText('0')).toHaveLength(2)
    expect(
      document.querySelector('[data-ui-timeline-rail]'),
    ).not.toBeInTheDocument()
    rerender(<Timeline items={[]} emptyText="还没有任务" />)
    expect(screen.getByText('还没有任务')).toBeVisible()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('restores focus after removal, disabling and clearing the focused item', () => {
    const { rerender } = render(<Timeline items={items} />)
    act(() => screen.getByRole('button', { name: '重试发布' }).focus())
    rerender(<Timeline items={items.slice(0, 2)} />)
    expect(screen.getByRole('button', { name: '查看提交' })).toHaveFocus()
    rerender(
      <Timeline
        items={[
          { ...items[0], children: <button disabled>查看提交</button> },
          items[1],
        ]}
      />,
    )
    expect(screen.getByRole('textbox')).toHaveFocus()
    rerender(<Timeline items={[]} />)
    expect(screen.getByRole('group', { name: '时间轴' })).toHaveFocus()
  })

  it('does not move focus that has left the timeline', () => {
    const view = (next: TimelineItem[]) => (
      <>
        <Timeline items={next} />
        <button>外部操作</button>
      </>
    )
    const { rerender } = render(view(items))
    act(() => screen.getByRole('button', { name: '重试发布' }).focus())
    act(() => screen.getByRole('button', { name: '外部操作' }).focus())
    rerender(view([]))
    expect(screen.getByRole('button', { name: '外部操作' })).toHaveFocus()
  })

  it('adds a keyboard scrolling entrance only on actual overflow and cleans up observation', () => {
    let notify = () => {}
    const disconnect = vi.fn()
    const observe = vi.fn()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          notify = callback
        }
        observe = observe
        disconnect = disconnect
      },
    )
    const { rerender, unmount } = render(
      <Timeline items={items} orientation="horizontal" />,
    )
    const list = screen.getByRole('list')
    Object.defineProperty(list, 'clientWidth', {
      configurable: true,
      value: 700,
    })
    Object.defineProperty(list, 'scrollWidth', {
      configurable: true,
      value: 900,
    })
    act(() => notify())
    expect(list).toHaveAttribute('tabindex', '0')
    expect(list).toHaveAccessibleDescription(
      '左右方向键滚动时间轴，Home / End 到首尾，Tab 进入内容操作。',
    )
    const scrollBy = vi.fn()
    const scrollTo = vi.fn()
    Object.assign(list, { scrollBy, scrollTo })
    fireEvent.keyDown(list, { key: 'ArrowRight' })
    expect(scrollBy).toHaveBeenLastCalledWith({
      left: 700 / 3,
      behavior: 'auto',
    })
    fireEvent.keyDown(list, { key: 'ArrowLeft' })
    expect(scrollBy).toHaveBeenLastCalledWith({
      left: -700 / 3,
      behavior: 'auto',
    })
    fireEvent.keyDown(list, { key: 'End' })
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 900, behavior: 'auto' })
    fireEvent.keyDown(list, { key: 'Home' })
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, behavior: 'auto' })
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'ArrowRight' })
    fireEvent.keyDown(list, { key: 'ArrowRight', ctrlKey: true })
    expect(scrollBy).toHaveBeenCalledTimes(2)
    rerender(<Timeline items={items} orientation="horizontal" dir="rtl" />)
    fireEvent.keyDown(list, { key: 'End' })
    expect(scrollTo).toHaveBeenLastCalledWith({ left: -900, behavior: 'auto' })
    fireEvent.keyDown(list, { key: 'ArrowLeft' })
    expect(scrollBy).toHaveBeenLastCalledWith({
      left: -700 / 3,
      behavior: 'auto',
    })
    Object.defineProperty(list, 'scrollWidth', {
      configurable: true,
      value: 700,
    })
    fireEvent(window, new Event('resize'))
    expect(list).not.toHaveAttribute('tabindex')
    expect(list).not.toHaveAttribute('aria-describedby')
    fireEvent.keyDown(list, { key: 'ArrowRight' })
    expect(scrollBy).toHaveBeenCalledTimes(3)
    expect(observe).toHaveBeenCalledTimes(2)
    unmount()
    expect(disconnect).toHaveBeenCalledOnce()
  })

  it('inherits direction and forwards native attributes, events and semantic class overrides', () => {
    const focus = vi.fn()
    render(
      <ConfigProvider direction="rtl">
        <Timeline
          id="history"
          aria-label="自定义历史"
          onFocusCapture={focus}
          items={[
            {
              ...items[0],
              className: 'font-medium',
              classNames: { label: 'text-primary' },
            },
          ]}
          classNames={{ root: 'p-4', list: 'rounded-lg', content: 'text-sm' }}
        />
      </ConfigProvider>,
    )
    const root = screen.getByRole('group', { name: '自定义历史' })
    expect(root).toHaveAttribute('dir', 'rtl')
    expect(root).toHaveAttribute('id', 'history')
    expect(root).toHaveClass('p-4')
    expect(screen.getByRole('list')).toHaveClass('rounded-lg')
    expect(screen.getByRole('listitem')).toHaveClass('font-medium')
    expect(screen.getByText('09:00')).toHaveClass('text-primary')
    expect(screen.getByRole('button').parentElement).toHaveClass('text-sm')
    act(() => screen.getByRole('button').focus())
    expect(focus).toHaveBeenCalledOnce()
  })

  it('normalizes label widths and allows native style overrides', () => {
    const { rerender } = render(<Timeline items={items} labelWidth={180} />)
    const root = screen.getByRole('group')
    expect(root.style.getPropertyValue('--timeline-label-width')).toBe('180px')
    rerender(<Timeline items={items} labelWidth={NaN} />)
    expect(root.style.getPropertyValue('--timeline-label-width')).toBe('28%')
    rerender(<Timeline items={items} labelWidth={-1} />)
    expect(root.style.getPropertyValue('--timeline-label-width')).toBe('0px')
    rerender(
      <Timeline items={items} labelWidth="35%" style={{ marginTop: 8 }} />,
    )
    expect(root.style.getPropertyValue('--timeline-label-width')).toBe('35%')
    expect(root).toHaveStyle({ marginTop: '8px' })
  })
})
