import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Dropdown } from '@/shared/ui'

describe('Dropdown menu composition', () => {
  it('renders groups and dividers with multiple selection semantics', () => {
    const onSelectionChange = vi.fn()
    render(
      <Dropdown
        label="筛选菜单"
        selectionMode="multiple"
        defaultSelectedKeys={['all']}
        onSelectionChange={onSelectionChange}
        trigger={<button type="button">打开筛选</button>}
        items={[
          {
            type: 'group',
            key: 'scope',
            label: '范围',
            children: [
              { key: 'all', label: '全部' },
              { key: 'mine', label: '我的项目' },
            ],
          },
          { type: 'divider', key: 'divider' },
          {
            type: 'group',
            key: 'state',
            label: '状态',
            children: [{ key: 'active', label: '进行中' }],
          },
        ]}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '打开筛选' }))
    const menu = screen.getByRole('menu', { name: '筛选菜单' })
    expect(menu).toHaveAttribute('aria-multiselectable', 'true')
    expect(screen.getByRole('group', { name: '范围' })).toBeInTheDocument()
    expect(screen.getByRole('separator')).toBeInTheDocument()
    expect(
      screen.getByRole('menuitemcheckbox', { name: '全部' }),
    ).toHaveAttribute('aria-checked', 'true')
    const mine = screen.getByRole('menuitemcheckbox', { name: '我的项目' })
    fireEvent.click(mine)
    expect(onSelectionChange).toHaveBeenCalledWith(['all', 'mine'])
    expect(menu).toBeInTheDocument()
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: '全部' }))
    expect(onSelectionChange).toHaveBeenLastCalledWith(['mine'])
  })

  it('closes single selection and keeps disabled actions unavailable', () => {
    const onSelect = vi.fn()
    const onSelectionChange = vi.fn()
    render(
      <Dropdown
        selectionMode="single"
        onSelectionChange={onSelectionChange}
        trigger={<button type="button">打开单选</button>}
        items={[
          { key: 'first', label: '第一项', onSelect },
          { key: 'disabled', label: '不可选', disabled: true },
        ]}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '打开单选' }))
    const disabled = screen.getByRole('menuitemradio', { name: '不可选' })
    expect(disabled).toBeDisabled()
    fireEvent.click(screen.getByRole('menuitemradio', { name: '第一项' }))
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelectionChange).toHaveBeenCalledWith(['first'])
    expect(screen.queryByRole('menu')).toBeNull()
    expect(screen.getByRole('button', { name: '打开单选' })).toHaveFocus()
  })

  it('keeps hover menu open while moving into its Portal and supports touch click', () => {
    vi.useFakeTimers()
    try {
      render(
        <Dropdown
          triggerMode="hover"
          label="悬停菜单"
          trigger={<button type="button">悬停入口</button>}
          items={[{ key: 'one', label: '第一项' }]}
        />,
      )
      const trigger = screen.getByRole('button', { name: '悬停入口' })
      fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
      const menu = screen.getByRole('menu', { name: '悬停菜单' })
      const leave = (element: Element, pointerType: 'mouse' | 'touch') => {
        const event = new MouseEvent('pointerout', { bubbles: true })
        Object.defineProperty(event, 'pointerType', { value: pointerType })
        fireEvent(element, event)
      }
      leave(trigger, 'mouse')
      fireEvent.pointerEnter(menu, { pointerType: 'mouse' })
      act(() => vi.advanceTimersByTime(150))
      expect(menu).toBeInTheDocument()
      leave(menu, 'mouse')
      act(() => vi.advanceTimersByTime(150))
      expect(screen.queryByRole('menu')).toBeNull()
      fireEvent.click(trigger)
      leave(trigger, 'touch')
      act(() => vi.advanceTimersByTime(150))
      expect(screen.getByRole('menu')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('opens context menu at the requested pointer and from the keyboard', () => {
    render(
      <Dropdown
        triggerMode="contextMenu"
        label="右键菜单"
        trigger={<button type="button">右键入口</button>}
        items={[{ key: 'one', label: '第一项' }]}
      />,
    )
    const trigger = screen.getByRole('button', { name: '右键入口' })
    fireEvent.contextMenu(trigger, { clientX: 120, clientY: 160 })
    expect(screen.getByRole('menu', { name: '右键菜单' })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
    fireEvent.keyDown(trigger, { key: 'F10', shiftKey: true })
    expect(screen.getByRole('menu', { name: '右键菜单' })).toBeInTheDocument()
  })

  it('respects controlled open requests', () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <Dropdown
        open={false}
        onOpenChange={onOpenChange}
        trigger={<button type="button">受控入口</button>}
        items={[{ key: 'one', label: '第一项' }]}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '受控入口' }))
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true)
    expect(screen.queryByRole('menu')).toBeNull()
    rerender(
      <Dropdown
        open
        onOpenChange={onOpenChange}
        trigger={<button type="button">受控入口</button>}
        items={[{ key: 'one', label: '第一项' }]}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '受控入口' }))
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })
})
