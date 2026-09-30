import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FloatButtonGroup } from '@/shared/ui'

const items = [
  { key: 'help', label: '帮助', icon: <span aria-hidden="true">?</span> },
  { key: 'done', label: '完成', icon: <span aria-hidden="true">✓</span> },
]

function dispatchPointer(element: Element, type: string, pointerType: string) {
  const event = new Event(type, { bubbles: true })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  fireEvent(element, event)
}

describe('FloatButtonGroup', () => {
  it('keeps an always-open group in normal button tab order', () => {
    const onSelect = vi.fn()
    render(
      <FloatButtonGroup
        items={[items[0], { ...items[1], disabled: true }]}
        onSelect={onSelect}
      />,
    )
    expect(screen.queryByRole('button', { name: '快捷操作' })).toBeNull()
    expect(screen.getByRole('group', { name: '快捷操作' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '帮助' }))
    expect(onSelect).toHaveBeenCalledWith('help')
    expect(screen.getByRole('button', { name: '完成' })).toBeDisabled()
  })

  it('opens by click and closes by Escape or outside pointer', () => {
    const onSelect = vi.fn()
    render(
      <FloatButtonGroup
        items={items}
        label="展开操作"
        trigger="click"
        onSelect={onSelect}
      />,
    )
    const trigger = screen.getByRole('button', { name: '展开操作' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: '帮助' })).toBeNull()

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(trigger).toHaveAttribute('aria-controls')
    const help = screen.getByRole('button', { name: '帮助' })
    help.focus()
    fireEvent.keyDown(help, { key: 'Escape' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
    expect(screen.queryByRole('button', { name: '帮助' })).toBeNull()

    fireEvent.click(trigger)
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('button', { name: '帮助' })).toBeNull()

    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('button', { name: '帮助' }))
    expect(onSelect).toHaveBeenCalledWith('help')
    expect(trigger).toHaveFocus()
  })

  it('supports controlled state and flips away from a viewport edge', () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <FloatButtonGroup
        items={items}
        trigger="click"
        position="top-right"
        placement="top"
        open={false}
        onOpenChange={onOpenChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '快捷操作' }))
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.queryByRole('button', { name: '帮助' })).toBeNull()

    rerender(
      <FloatButtonGroup
        items={items}
        trigger="click"
        position="top-right"
        placement="top"
        open
        onOpenChange={onOpenChange}
      />,
    )
    expect(screen.getByRole('button', { name: '帮助' })).toBeVisible()
    expect(screen.getByRole('group', { name: '快捷操作' })).toHaveClass(
      'top-[max(1rem,env(safe-area-inset-top))]',
    )
    expect(
      screen.getByRole('button', { name: '帮助' }).parentElement,
    ).toHaveAttribute('data-placement', 'bottom')
  })

  it('opens with a mouse hover and uses click for touch input', () => {
    render(<FloatButtonGroup items={items} trigger="hover" />)
    const group = screen.getByRole('group', { name: '快捷操作' })
    const trigger = screen.getByRole('button', { name: '快捷操作' })

    dispatchPointer(group, 'pointerover', 'mouse')
    expect(screen.getByRole('button', { name: '帮助' })).toBeInTheDocument()
    dispatchPointer(group, 'pointerout', 'mouse')
    expect(screen.queryByRole('button', { name: '帮助' })).toBeNull()

    dispatchPointer(group, 'pointerover', 'touch')
    expect(screen.queryByRole('button', { name: '帮助' })).toBeNull()
    fireEvent.pointerDown(trigger, { pointerType: 'touch' })
    fireEvent.click(trigger)
    expect(screen.getByRole('button', { name: '帮助' })).toBeInTheDocument()
  })
})
