import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Tooltip } from '@/shared/ui'

afterEach(() => vi.useRealTimers())

describe('Tooltip interaction states', () => {
  it('supports default visibility and suppresses empty or disabled content', () => {
    const { rerender } = render(
      <Tooltip title="可见内容" defaultOpen>
        <button type="button">查看提示</button>
      </Tooltip>,
    )
    const trigger = screen.getByRole('button', { name: '查看提示' })
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent('可见内容')
    expect(trigger).toHaveAttribute('aria-describedby', tooltip.id)

    rerender(
      <Tooltip title="可见内容" defaultOpen disabled>
        <button type="button">查看提示</button>
      </Tooltip>,
    )
    expect(screen.queryByRole('tooltip')).toBeNull()
    expect(trigger).not.toHaveAttribute('aria-describedby')

    rerender(
      <Tooltip title="可见内容" defaultOpen>
        <button type="button">查看提示</button>
      </Tooltip>,
    )
    expect(screen.queryByRole('tooltip')).toBeNull()

    rerender(
      <Tooltip title="">
        <button type="button">查看提示</button>
      </Tooltip>,
    )
    fireEvent.focus(trigger)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('delays hover but shows focus and touch feedback immediately', () => {
    vi.useFakeTimers()
    const onOpenChange = vi.fn()
    render(
      <Tooltip
        title="延迟内容"
        mouseEnterDelay={0.2}
        mouseLeaveDelay={0.1}
        onOpenChange={onOpenChange}
      >
        <button type="button">延迟提示</button>
      </Tooltip>,
    )
    const trigger = screen.getByRole('button', { name: '延迟提示' })
    const root = trigger.parentElement!
    fireEvent.mouseEnter(root)
    act(() => vi.advanceTimersByTime(199))
    expect(screen.queryByRole('tooltip')).toBeNull()
    act(() => vi.advanceTimersByTime(1))
    expect(screen.getByRole('tooltip')).toBeVisible()
    fireEvent.mouseLeave(root)
    act(() => vi.advanceTimersByTime(99))
    expect(screen.getByRole('tooltip')).toBeVisible()
    act(() => vi.advanceTimersByTime(1))
    expect(screen.queryByRole('tooltip')).toBeNull()

    fireEvent.mouseEnter(root)
    fireEvent.focus(trigger)
    expect(screen.getByRole('tooltip')).toBeVisible()
    act(() => vi.advanceTimersByTime(200))
    expect(onOpenChange).toHaveBeenCalledTimes(3)
    fireEvent.blur(trigger)
    fireEvent.pointerDown(trigger, { pointerType: 'touch' })
    expect(screen.getByRole('tooltip')).toBeVisible()
  })

  it('cancels a pending hover when its content becomes unavailable', () => {
    vi.useFakeTimers()
    const { rerender } = render(
      <Tooltip title="稍后显示" mouseEnterDelay={0.2}>
        <button type="button">等待提示</button>
      </Tooltip>,
    )
    const trigger = screen.getByRole('button', { name: '等待提示' })
    fireEvent.mouseEnter(trigger.parentElement!)
    rerender(
      <Tooltip title="" mouseEnterDelay={0.2}>
        <button type="button">等待提示</button>
      </Tooltip>,
    )
    act(() => vi.advanceTimersByTime(250))
    expect(screen.queryByRole('tooltip')).toBeNull()
    rerender(
      <Tooltip title="重新可用" mouseEnterDelay={0.2}>
        <button type="button">等待提示</button>
      </Tooltip>,
    )
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('respects prevented child events and controlled close requests', () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <Tooltip title="外部提示" open={false} onOpenChange={onOpenChange}>
        <button type="button" onPointerDown={(event) => event.preventDefault()}>
          受控入口
        </button>
      </Tooltip>,
    )
    const trigger = screen.getByRole('button', { name: '受控入口' })
    fireEvent.pointerDown(trigger, { pointerType: 'touch' })
    expect(onOpenChange).not.toHaveBeenCalled()
    fireEvent.focus(trigger)
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.queryByRole('tooltip')).toBeNull()

    rerender(
      <Tooltip title="外部提示" open onOpenChange={onOpenChange}>
        <button type="button">受控入口</button>
      </Tooltip>,
    )
    expect(screen.getByRole('tooltip')).toHaveTextContent('外部提示')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    rerender(
      <Tooltip title="外部提示" open={false} onOpenChange={onOpenChange}>
        <button type="button">受控入口</button>
      </Tooltip>,
    )
    expect(screen.queryByRole('tooltip')).toBeNull()
  })
})
