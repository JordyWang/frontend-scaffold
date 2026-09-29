import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Listy } from '@/shared/ui'

const items = Array.from({ length: 40 }, (_, index) => ({
  id: `item-${index}`,
  label: `项目 ${index}`,
}))

describe('Listy', () => {
  it('renders only the visible window and updates rows after scrolling', () => {
    render(
      <Listy
        items={items}
        itemHeight={40}
        height={120}
        overscan={0}
        label="虚拟列表"
        getKey={(item) => item.id}
        renderItem={(item) => <span>{item.label}</span>}
      />,
    )

    const list = screen.getByRole('list', { name: '虚拟列表' })
    expect(list.querySelectorAll('[role="listitem"]')).toHaveLength(3)
    expect(screen.getByText('项目 0')).toBeInTheDocument()
    expect(screen.queryByText('项目 20')).not.toBeInTheDocument()

    Object.defineProperty(list, 'clientHeight', {
      configurable: true,
      value: 120,
    })
    Object.defineProperty(list, 'scrollTop', {
      configurable: true,
      value: 800,
    })
    fireEvent.scroll(list)

    expect(screen.getByText('项目 20')).toBeInTheDocument()
    expect(screen.queryByText('项目 0')).not.toBeInTheDocument()
  })

  it('calls onEndReached once per approach and allows a later approach', () => {
    const onEndReached = vi.fn()
    render(
      <Listy
        items={items}
        itemHeight={40}
        height={120}
        endReachedThreshold={80}
        onEndReached={onEndReached}
        getKey={(item) => item.id}
        renderItem={(item) => <span>{item.label}</span>}
      />,
    )
    const list = screen.getByRole('list')
    Object.defineProperty(list, 'clientHeight', {
      configurable: true,
      value: 120,
    })
    Object.defineProperty(list, 'scrollTop', {
      configurable: true,
      value: 1400,
    })
    fireEvent.scroll(list)
    fireEvent.scroll(list)
    expect(onEndReached).toHaveBeenCalledOnce()
    Object.defineProperty(list, 'scrollTop', { configurable: true, value: 0 })
    fireEvent.scroll(list)
    Object.defineProperty(list, 'scrollTop', {
      configurable: true,
      value: 1400,
    })
    fireEvent.scroll(list)
    expect(onEndReached).toHaveBeenCalledTimes(2)
  })

  it('uses shared loading, error and empty states', () => {
    const { rerender } = render(
      <Listy
        items={[]}
        itemHeight={40}
        height={120}
        getKey={(item) => item.id}
        renderItem={(item) => <span>{item.label}</span>}
        loading
      />,
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
    rerender(
      <Listy
        items={[]}
        itemHeight={40}
        height={120}
        getKey={(item) => item.id}
        renderItem={(item) => <span>{item.label}</span>}
        error="加载失败"
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('加载失败')
    rerender(
      <Listy
        items={[]}
        itemHeight={40}
        height={120}
        getKey={(item) => item.id}
        renderItem={(item) => <span>{item.label}</span>}
      />,
    )
    expect(screen.getByText('暂无内容')).toBeInTheDocument()
  })
})
