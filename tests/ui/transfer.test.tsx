import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FormField, ThemeScope, Transfer } from '@/shared/ui'

const items = [
  { key: 'design', title: '设计规范' },
  { key: 'video', title: '视频预览' },
  { key: 'analysis', title: '数据分析' },
  { key: 'archived', title: '归档模块', disabled: true },
]

describe('Transfer', () => {
  it('moves checked items in both directions and protects disabled items', () => {
    const onChange = vi.fn()
    render(
      <Transfer
        items={items}
        defaultTargetKeys={['analysis']}
        onChange={onChange}
      />,
    )
    const source = screen.getByRole('region', { name: '待选' })
    const target = screen.getByRole('region', { name: '已选' })
    expect(
      within(source).getByRole('checkbox', { name: '归档模块' }),
    ).toBeDisabled()

    fireEvent.click(within(source).getByRole('checkbox', { name: '设计规范' }))
    fireEvent.click(screen.getByRole('button', { name: '移至已选' }))
    expect(onChange).toHaveBeenLastCalledWith(
      ['analysis', 'design'],
      'to-target',
      ['design'],
    )
    expect(
      within(target).getByRole('checkbox', { name: '设计规范' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '移至已选' })).toBeDisabled()

    fireEvent.click(within(target).getByRole('checkbox', { name: '数据分析' }))
    fireEvent.click(screen.getByRole('button', { name: '移回待选' }))
    expect(onChange).toHaveBeenLastCalledWith(['design'], 'to-source', [
      'analysis',
    ])
    expect(
      within(source).getByRole('checkbox', { name: '数据分析' }),
    ).toBeInTheDocument()
  })

  it('selects only visible enabled items while retaining hidden selections', () => {
    const onChange = vi.fn()
    render(
      <Transfer
        items={items}
        defaultSelectedKeys={['design']}
        showSearch
        onChange={onChange}
      />,
    )
    const source = screen.getByRole('region', { name: '待选' })
    fireEvent.change(
      within(source).getByRole('searchbox', { name: '搜索待选' }),
      {
        target: { value: '视频' },
      },
    )
    expect(
      within(source).queryByRole('checkbox', { name: '设计规范' }),
    ).not.toBeInTheDocument()
    fireEvent.click(
      within(source).getByRole('checkbox', { name: '全选待选可见项' }),
    )
    fireEvent.click(screen.getByRole('button', { name: '移至已选' }))
    expect(onChange).toHaveBeenCalledWith(['design', 'video'], 'to-target', [
      'design',
      'video',
    ])
  })

  it('keeps controlled target and selected keys until the owner updates them', () => {
    const onChange = vi.fn()
    const onSelectChange = vi.fn()
    const { rerender } = render(
      <Transfer
        items={items}
        targetKeys={['analysis']}
        selectedKeys={['design']}
        onChange={onChange}
        onSelectChange={onSelectChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '移至已选' }))
    expect(onChange).toHaveBeenCalledWith(['analysis', 'design'], 'to-target', [
      'design',
    ])
    expect(onSelectChange).toHaveBeenCalledWith([])
    expect(
      within(screen.getByRole('region', { name: '待选' })).getByRole(
        'checkbox',
        {
          name: '设计规范',
        },
      ),
    ).toBeInTheDocument()
    rerender(
      <Transfer
        items={items}
        targetKeys={['analysis', 'design']}
        selectedKeys={[]}
        onChange={onChange}
        onSelectChange={onSelectChange}
      />,
    )
    expect(
      within(screen.getByRole('region', { name: '已选' })).getByRole(
        'checkbox',
        {
          name: '设计规范',
        },
      ),
    ).toBeInTheDocument()
  })

  it('disables interaction and accepts scoped component tokens', () => {
    render(
      <ThemeScope
        tokens={{
          components: { transfer: { radius: '1rem', listHeight: '12rem' } },
        }}
      >
        <Transfer items={items} disabled />
      </ThemeScope>,
    )
    const scope = document.querySelector('[data-ui-scope]')
    expect(scope).toHaveStyle({ '--ui-transfer-radius-override': '1rem' })
    expect(scope).toHaveStyle({ '--ui-transfer-list-height-override': '12rem' })
    expect(screen.getByRole('button', { name: '移至已选' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '移回待选' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: '设计规范' })).toBeDisabled()
  })

  it('connects a FormField label, requirement and error to the group', () => {
    render(
      <FormField
        label="模块分配"
        required
        error="请选择至少一个模块"
        control={<Transfer items={items} />}
      />,
    )
    const group = screen.getByRole('group', { name: '模块分配' })
    expect(group).toHaveAttribute('aria-required', 'true')
    expect(group).toHaveAttribute('aria-invalid', 'true')
    expect(group).toHaveAttribute('aria-describedby')
    expect(screen.getByRole('alert')).toHaveTextContent('请选择至少一个模块')
  })
})
