import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Popover } from '@/shared/ui'

function pointerLeave(element: Element, pointerType: 'mouse' | 'touch') {
  const event = new MouseEvent('pointerout', { bubbles: true })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  fireEvent(element, event)
}

describe('Popover', () => {
  it('keeps the trigger handler and ignores clicks inside Portal content', () => {
    const onTriggerClick = vi.fn()
    render(
      <Popover title="说明" content={<button type="button">内容操作</button>}>
        <button type="button" onClick={onTriggerClick}>
          查看说明
        </button>
      </Popover>,
    )

    const trigger = screen.getByRole('button', { name: '查看说明' })
    fireEvent.click(trigger)
    expect(onTriggerClick).toHaveBeenCalledOnce()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(screen.getByRole('button', { name: '内容操作' }))
    expect(screen.getByRole('dialog', { name: '说明' })).toBeInTheDocument()
    fireEvent.click(trigger)
    expect(onTriggerClick).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('dialog', { name: '说明' })).toBeNull()
  })

  it('respects a cancelled trigger click', () => {
    render(
      <Popover content="不会打开">
        <button type="button" onClick={(event) => event.preventDefault()}>
          取消点击
        </button>
      </Popover>,
    )
    fireEvent.click(screen.getByRole('button', { name: '取消点击' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('keeps hover content open while the pointer moves into the Portal', () => {
    vi.useFakeTimers()
    try {
      render(
        <Popover
          trigger="hover"
          title="悬停说明"
          content={<button type="button">面板操作</button>}
        >
          <button type="button">悬停触发</button>
        </Popover>,
      )
      const trigger = screen.getByRole('button', { name: '悬停触发' })
      fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
      const panel = screen.getByRole('dialog', { name: '悬停说明' })
      pointerLeave(trigger, 'mouse')
      fireEvent.pointerEnter(panel, { pointerType: 'mouse' })
      act(() => vi.advanceTimersByTime(150))
      expect(panel).toBeInTheDocument()
      pointerLeave(panel, 'mouse')
      act(() => vi.advanceTimersByTime(150))
      expect(screen.queryByRole('dialog', { name: '悬停说明' })).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('opens on touch in hover mode and ignores touch pointer leave', () => {
    vi.useFakeTimers()
    try {
      render(
        <Popover trigger="hover" content="触控内容">
          <button type="button">触控触发</button>
        </Popover>,
      )
      const trigger = screen.getByRole('button', { name: '触控触发' })
      fireEvent.click(trigger)
      pointerLeave(trigger, 'touch')
      act(() => vi.advanceTimersByTime(150))
      expect(
        screen.getByRole('dialog', { name: '补充信息' }),
      ).toBeInTheDocument()
      fireEvent.pointerDown(document.body, { pointerType: 'touch' })
      expect(screen.queryByRole('dialog')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('keeps focus content open across the Portal and closes on Escape', () => {
    render(
      <Popover
        trigger="focus"
        title="焦点说明"
        content={<button type="button">焦点操作</button>}
      >
        <button type="button">聚焦触发</button>
      </Popover>,
    )
    const trigger = screen.getByRole('button', { name: '聚焦触发' })
    act(() => trigger.focus())
    const panel = screen.getByRole('dialog', { name: '焦点说明' })
    act(() => screen.getByRole('button', { name: '焦点操作' }).focus())
    expect(panel).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(trigger).toHaveFocus()
    expect(screen.queryByRole('dialog', { name: '焦点说明' })).toBeNull()
    act(() => trigger.blur())
    act(() => trigger.focus())
    expect(screen.getByRole('dialog', { name: '焦点说明' })).toBeInTheDocument()
  })

  it('reports requested changes while controlled', () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <Popover open={false} onOpenChange={onOpenChange} content="受控内容">
        <button type="button">受控触发</button>
      </Popover>,
    )
    const trigger = screen.getByRole('button', { name: '受控触发' })
    fireEvent.click(trigger)
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true)
    expect(screen.queryByRole('dialog')).toBeNull()
    rerender(
      <Popover open onOpenChange={onOpenChange} content="受控内容">
        <button type="button">受控触发</button>
      </Popover>,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(trigger)
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })
})
