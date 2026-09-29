import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Spin } from '@/shared/ui'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Spin', () => {
  it('delays the overlay and makes covered controls inert while loading', () => {
    vi.useFakeTimers()
    const { rerender } = render(
      <Spin spinning delay={200} label="资料加载中" tip="请稍候">
        <button type="button">编辑资料</button>
      </Spin>,
    )
    const button = screen.getByRole('button', { name: '编辑资料' })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(199))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1))
    expect(
      screen.getByRole('status', { name: '资料加载中' }),
    ).toHaveTextContent('请稍候')
    expect(button.parentElement).toHaveAttribute('inert')
    expect(button.parentElement).toHaveAttribute('aria-hidden', 'true')
    rerender(
      <Spin spinning={false} delay={200} label="资料加载中">
        <button type="button">编辑资料</button>
      </Spin>,
    )
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '编辑资料' }).parentElement,
    ).not.toHaveAttribute('inert')
  })

  it('renders a full-screen status through the project portal', () => {
    render(<Spin fullscreen label="页面加载中" />)
    expect(
      screen.getByRole('status', { name: '页面加载中' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status').parentElement).toHaveClass('fixed')
  })
})
