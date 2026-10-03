import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StatisticTimer } from '@/shared/ui'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-03T09:00:00Z'))
})

afterEach(() => vi.useRealTimers())

describe('StatisticTimer', () => {
  it('counts down from the target, finishes once and resets for a new target', () => {
    const onChange = vi.fn()
    const onFinish = vi.fn()
    const { rerender } = render(
      <StatisticTimer
        title="任务倒计时"
        value={Date.now() + 3_000}
        format="mm:ss"
        onChange={onChange}
        onFinish={onFinish}
      />,
    )
    expect(
      screen.getByRole('timer', { name: '任务倒计时：00:03' }),
    ).toBeInTheDocument()
    expect(onChange).toHaveBeenCalledWith(3_000)
    act(() => vi.advanceTimersByTime(3_000))
    expect(
      screen.getByRole('timer', { name: '任务倒计时：00:00' }),
    ).toBeInTheDocument()
    expect(onFinish).toHaveBeenCalledTimes(1)
    act(() => vi.advanceTimersByTime(2_000))
    expect(onFinish).toHaveBeenCalledTimes(1)

    rerender(
      <StatisticTimer
        title="任务倒计时"
        value={Date.now() - 5_000}
        format="mm:ss"
        onChange={onChange}
        onFinish={onFinish}
      />,
    )
    expect(onFinish).toHaveBeenCalledTimes(2)
    rerender(
      <StatisticTimer
        title="任务倒计时"
        value={Date.now() - 5_000}
        format="ss"
        onChange={onChange}
        onFinish={onFinish}
      />,
    )
    expect(onFinish).toHaveBeenCalledTimes(2)

    rerender(
      <StatisticTimer
        title="任务倒计时"
        value={Date.now() + 2_000}
        format="mm:ss"
        onChange={onChange}
        onFinish={onFinish}
      />,
    )
    expect(
      screen.getByRole('timer', { name: '任务倒计时：00:02' }),
    ).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(2_000))
    expect(onFinish).toHaveBeenCalledTimes(3)
    expect(onChange).toHaveBeenLastCalledWith(0)
  })

  it('counts up through days and formats subsecond values', () => {
    const onFinish = vi.fn()
    const { rerender } = render(
      <StatisticTimer
        title="已运行"
        type="countup"
        value={Date.now() - 90_061_000}
        format="DD [天] HH:mm:ss"
        onFinish={onFinish}
      />,
    )
    expect(
      screen.getByRole('timer', { name: '已运行：01 天 01:01:01' }),
    ).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1_000))
    expect(
      screen.getByRole('timer', { name: '已运行：01 天 01:01:02' }),
    ).toBeInTheDocument()
    expect(onFinish).not.toHaveBeenCalled()

    rerender(
      <StatisticTimer
        title="毫秒倒计时"
        value={Date.now() + 1_500}
        format="ss.SSS"
      />,
    )
    expect(
      screen.getByRole('timer', { name: '毫秒倒计时：01.500' }),
    ).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(100))
    expect(
      screen.getByRole('timer', { name: '毫秒倒计时：01.400' }),
    ).toBeInTheDocument()
  })

  it('uses total minutes or seconds when larger units are omitted', () => {
    const { rerender } = render(
      <StatisticTimer
        title="剩余分钟"
        value={Date.now() + 3_661_000}
        format="mm:ss"
      />,
    )
    expect(
      screen.getByRole('timer', { name: '剩余分钟：61:01' }),
    ).toBeInTheDocument()
    rerender(
      <StatisticTimer
        title="剩余秒数"
        value={Date.now() + 3_661_000}
        format="ss"
      />,
    )
    expect(
      screen.getByRole('timer', { name: '剩余秒数：3661' }),
    ).toBeInTheDocument()
  })

  it('keeps invalid and loading values out of the timer role', () => {
    const onChange = vi.fn()
    const onFinish = vi.fn()
    const { rerender } = render(
      <StatisticTimer
        title="无效计时"
        value={Number.NaN}
        onChange={onChange}
        onFinish={onFinish}
      />,
    )
    expect(
      screen.getByRole('timer', { name: '无效计时：—' }),
    ).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
    expect(onFinish).not.toHaveBeenCalled()

    rerender(<StatisticTimer title="无效计时" value={Number.NaN} loading />)
    expect(screen.queryByRole('timer')).toBeNull()
    expect(
      screen.getByRole('status', { name: '无效计时正在加载' }),
    ).toBeInTheDocument()
  })

  it('gives nontext titles a timer name and allows an explicit label', () => {
    const { rerender } = render(
      <StatisticTimer title={<span>用时</span>} value={Date.now() + 1000} />,
    )
    expect(
      screen.getByRole('timer', { name: '计时：00:00:01' }),
    ).toBeInTheDocument()
    rerender(
      <StatisticTimer
        title={<span>用时</span>}
        value={Date.now() + 1000}
        aria-label="处理剩余一秒"
      />,
    )
    expect(
      screen.getByRole('timer', { name: '处理剩余一秒' }),
    ).toBeInTheDocument()
  })
})
