import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfigProvider, FormField, TreeSelect } from '@/shared/ui'

const treeData = [
  {
    value: 'team',
    label: '团队',
    children: [
      { value: 'design', label: '设计组' },
      { value: 'engineering', label: '研发组' },
      { value: 'archived', label: '归档组', disabled: true },
    ],
  },
  { value: 'operations', label: '运营组' },
]

describe('TreeSelect', () => {
  it('applies the provider size to the trigger', () => {
    render(
      <ConfigProvider componentSize="large">
        <TreeSelect aria-label="大号树选择" treeData={treeData} />
      </ConfigProvider>,
    )
    expect(screen.getByRole('combobox', { name: '大号树选择' })).toHaveClass(
      'min-h-12',
    )
  })

  it('opens with keyboard focus, navigates branches, selects and restores focus', () => {
    const onChange = vi.fn()
    render(<TreeSelect treeData={treeData} onChange={onChange} />)
    const trigger = screen.getByRole('combobox', { name: '树形选择' })
    trigger.focus()
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const team = screen.getByRole('treeitem', { name: '团队' })
    expect(team).toHaveFocus()
    fireEvent.keyDown(team, { key: 'ArrowRight' })
    expect(team).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(team, { key: 'ArrowRight' })
    const design = screen.getByRole('treeitem', { name: '设计组' })
    expect(design).toHaveFocus()
    fireEvent.keyDown(design, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('design')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveTextContent('设计组')
  })

  it('reveals search matches below collapsed branches and skips disabled nodes', () => {
    const onChange = vi.fn()
    render(<TreeSelect treeData={treeData} showSearch onChange={onChange} />)
    fireEvent.click(screen.getByRole('combobox', { name: '树形选择' }))
    const search = screen.getByRole('searchbox', { name: '搜索树形选择' })
    fireEvent.change(search, { target: { value: '设计' } })
    expect(screen.getByRole('treeitem', { name: '设计组' })).toBeInTheDocument()
    expect(
      screen.queryByRole('treeitem', { name: '运营组' }),
    ).not.toBeInTheDocument()
    fireEvent.keyDown(search, { key: 'ArrowDown' })
    fireEvent.keyDown(screen.getByRole('treeitem', { name: '团队' }), {
      key: 'ArrowDown',
    })
    expect(screen.getByRole('treeitem', { name: '设计组' })).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('treeitem', { name: '设计组' }), {
      key: 'Enter',
    })
    expect(onChange).toHaveBeenCalledWith('design')
  })

  it('supports multiple controlled values and a clear action', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <TreeSelect
        treeData={treeData}
        multiple
        allowClear
        defaultExpandedValues={['team']}
        defaultValue={['design']}
        onChange={onChange}
      />,
    )
    const trigger = screen.getByRole('combobox', { name: '树形选择' })
    expect(trigger).toHaveTextContent('设计组')
    fireEvent.click(trigger)
    expect(screen.getByRole('tree', { name: '树形选择' })).toHaveAttribute(
      'aria-multiselectable',
      'true',
    )
    fireEvent.click(screen.getByRole('treeitem', { name: '运营组' }))
    expect(onChange).toHaveBeenLastCalledWith(['design', 'operations'])
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(screen.getByRole('button', { name: '清除树形选择' }))
    expect(onChange).toHaveBeenLastCalledWith([])
    rerender(
      <TreeSelect
        treeData={treeData}
        multiple
        value={['engineering']}
        onChange={onChange}
      />,
    )
    expect(trigger).toHaveTextContent('研发组')
  })

  it('connects FormField errors to the trigger', () => {
    render(
      <FormField
        label="所属团队"
        error="请选择团队"
        control={<TreeSelect treeData={treeData} required />}
      />,
    )
    const trigger = screen.getByRole('combobox', { name: '所属团队' })
    expect(trigger).toHaveAttribute('aria-required', 'true')
    expect(trigger).toHaveAttribute('aria-invalid', 'true')
    expect(trigger).toHaveAttribute('aria-describedby')
    expect(screen.getByRole('alert')).toHaveTextContent('请选择团队')
  })
})
