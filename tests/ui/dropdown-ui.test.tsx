import { fireEvent, render, screen } from '@testing-library/react'
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
})
