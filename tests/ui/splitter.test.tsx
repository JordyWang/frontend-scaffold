import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Splitter, type SplitterPanel } from '@/shared/ui'

const panels: SplitterPanel[] = [
  {
    key: 'left',
    label: '左侧',
    content: '左侧内容',
    minSize: 20,
    maxSize: 80,
    collapsible: true,
  },
  { key: 'right', label: '右侧', content: '右侧内容', minSize: 20 },
]

describe('Splitter', () => {
  it('resizes with keyboard, observes limits and resets with a double click', () => {
    const onResize = vi.fn()
    const onResizeEnd = vi.fn()
    render(
      <Splitter
        panels={panels}
        defaultSizes={[60, 40]}
        onResize={onResize}
        onResizeEnd={onResizeEnd}
      />,
    )
    const separator = screen.getByRole('separator', {
      name: '左侧与右侧分隔条',
    })
    expect(separator).toHaveAttribute('aria-orientation', 'vertical')
    expect(separator).toHaveAttribute('aria-valuenow', '60')
    expect(separator.getAttribute('aria-controls')?.split(' ')).toHaveLength(2)
    fireEvent.keyDown(separator, { key: 'ArrowRight' })
    expect(separator).toHaveAttribute('aria-valuenow', '65')
    fireEvent.keyDown(separator, { key: 'End' })
    expect(separator).toHaveAttribute('aria-valuenow', '80')
    fireEvent.keyDown(separator, { key: 'Home' })
    expect(separator).toHaveAttribute('aria-valuenow', '20')
    fireEvent.doubleClick(separator)
    expect(separator).toHaveAttribute('aria-valuenow', '60')
    expect(onResize).toHaveBeenLastCalledWith([60, 40])
    expect(onResizeEnd).toHaveBeenLastCalledWith([60, 40])
  })

  it('keeps controlled sizes authoritative and changes only adjacent panels', () => {
    const onResize = vi.fn()
    const threePanels = [
      ...panels,
      { key: 'third', label: '第三栏', content: '第三栏内容' },
    ]
    const { rerender } = render(
      <Splitter
        panels={threePanels}
        sizes={[30, 40, 30]}
        onResize={onResize}
      />,
    )
    const separator = screen.getByRole('separator', {
      name: '右侧与第三栏分隔条',
    })
    fireEvent.keyDown(separator, { key: 'ArrowRight' })
    expect(onResize).toHaveBeenCalledWith([30, 45, 25])
    expect(separator).toHaveAttribute('aria-valuenow', '40')
    rerender(
      <Splitter
        panels={threePanels}
        sizes={[30, 45, 25]}
        onResize={onResize}
      />,
    )
    expect(separator).toHaveAttribute('aria-valuenow', '45')
  })

  it('handles pointer drag and vertical keyboard movement', () => {
    const onResizeStart = vi.fn()
    const onResizeEnd = vi.fn()
    render(
      <Splitter
        label="垂直分隔"
        panels={panels}
        orientation="vertical"
        defaultSizes={[50, 50]}
        onResizeStart={onResizeStart}
        onResizeEnd={onResizeEnd}
      />,
    )
    const root = screen.getByRole('group', { name: '垂直分隔' })
    Object.defineProperty(root, 'clientHeight', {
      configurable: true,
      value: 408,
    })
    const separator = screen.getByRole('separator')
    expect(separator).toHaveAttribute('aria-orientation', 'horizontal')
    fireEvent.keyDown(separator, { key: 'ArrowDown' })
    expect(separator).toHaveAttribute('aria-valuenow', '55')
    const pointer = (type: string, clientY: number) => {
      const event = new Event(type, { bubbles: true, cancelable: true })
      Object.assign(event, { pointerId: 1, button: 0, clientY })
      fireEvent(separator, event)
    }
    pointer('pointerdown', 100)
    expect(onResizeStart).toHaveBeenCalledWith([55, 45])
    pointer('pointermove', 140)
    pointer('pointerup', 140)
    expect(separator).toHaveAttribute('aria-valuenow', '65')
    expect(onResizeEnd).toHaveBeenLastCalledWith([65, 35])
  })

  it('collapses and restores a panel while leaving nonresizable handles inert', () => {
    const onCollapse = vi.fn()
    render(
      <Splitter
        panels={panels}
        defaultSizes={[60, 40]}
        onCollapse={onCollapse}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '折叠左侧' }))
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '0')
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuemin', '0')
    expect(onCollapse).toHaveBeenCalledWith([true, false], [0, 100])
    fireEvent.click(screen.getByRole('button', { name: '展开左侧' }))
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '60')

    const { rerender } = render(
      <Splitter
        label="不可调整"
        panels={[{ ...panels[0], resizable: false }, panels[1]]}
        disabled
      />,
    )
    const disabled = screen
      .getByRole('group', { name: '不可调整' })
      .querySelector('[role="separator"]')
    expect(disabled).toHaveAttribute('aria-disabled', 'true')
    expect(disabled).toHaveAttribute('tabindex', '-1')
    fireEvent.keyDown(disabled!, { key: 'ArrowRight' })
    expect(disabled).toHaveAttribute('aria-valuenow', '50')
    rerender(
      <Splitter
        label="不可调整"
        panels={[{ ...panels[0], resizable: false }, panels[1]]}
      />,
    )
    fireEvent.doubleClick(disabled!)
    expect(disabled).toHaveAttribute('aria-valuenow', '50')
  })
})
