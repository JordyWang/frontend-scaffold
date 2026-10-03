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
    rerender(
      <Spin spinning delay={200} label="资料加载中">
        <button type="button">编辑资料</button>
      </Spin>,
    )
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(200))
    expect(screen.getByRole('status', { name: '资料加载中' })).toBeVisible()
  })

  it('renders a full-screen status through the project portal', () => {
    render(<Spin fullscreen label="页面加载中" />)
    expect(
      screen.getByRole('status', { name: '页面加载中' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status').parentElement).toHaveClass('fixed')
  })

  it('shows bounded progress and applies semantic styles from current props', () => {
    const classNames = vi.fn(
      ({ props }: { props: { percent?: number | 'auto' } }) => ({
        section: props.percent === 100 ? 'finished-spin' : 'pending-spin',
      }),
    )
    const { rerender } = render(
      <Spin
        percent={46}
        label="任务进度"
        description="正在处理"
        tip="旧提示"
        classNames={classNames}
        styles={{ indicator: { opacity: 0.8 } }}
      />,
    )
    const progress = screen.getByRole('progressbar', { name: '任务进度' })
    expect(progress).toHaveAttribute('aria-valuenow', '46')
    expect(progress).toHaveStyle({ opacity: 0.8 })
    expect(screen.getByRole('status', { name: '任务进度' })).toHaveClass(
      'pending-spin',
    )
    expect(screen.getByText('正在处理')).toBeVisible()
    expect(screen.queryByText('旧提示')).toBeNull()

    rerender(<Spin percent={120} label="任务进度" classNames={classNames} />)
    expect(progress).toHaveAttribute('aria-valuenow', '100')
    expect(screen.getByRole('status', { name: '任务进度' })).toHaveClass(
      'pending-spin',
    )
    rerender(<Spin percent={100} label="任务进度" classNames={classNames} />)
    expect(screen.getByRole('status', { name: '任务进度' })).toHaveClass(
      'finished-spin',
    )
    expect(classNames).toHaveBeenLastCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({ percent: 100 }),
      }),
    )
  })

  it('estimates auto progress below completion and supports custom indicators', () => {
    vi.useFakeTimers()
    const { rerender } = render(<Spin percent="auto" label="估算进度" />)
    const progress = screen.getByRole('progressbar', { name: '估算进度' })
    expect(progress).toHaveAttribute('aria-valuenow', '0')
    act(() => vi.advanceTimersByTime(12_000))
    const estimated = Number(progress.getAttribute('aria-valuenow'))
    expect(estimated).toBeGreaterThan(0)
    expect(estimated).toBeLessThan(100)
    expect(progress).toHaveAttribute('aria-valuetext', `${estimated}%（估算）`)

    rerender(
      <Spin
        label="自定义指示器"
        indicator={<span data-testid="custom-spin-indicator">图标</span>}
        description="仍在加载"
      />,
    )
    expect(screen.queryByRole('progressbar')).toBeNull()
    expect(screen.getByTestId('custom-spin-indicator')).toBeInTheDocument()
    expect(
      screen.getByRole('status', { name: '自定义指示器' }),
    ).toHaveTextContent('仍在加载')
  })
})
