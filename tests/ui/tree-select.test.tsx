import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  ConfigProvider,
  FormField,
  TreeSelect,
  type TreeSelectCheckedStrategy,
} from '@/shared/ui'

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

  it('uses RTL tree keys and keeps the portalled popup direction', () => {
    render(
      <ConfigProvider direction="rtl" getPopupContainer={() => document.body}>
        <TreeSelect treeData={treeData} defaultExpandedValues={[]} />
      </ConfigProvider>,
    )
    const trigger = screen.getByRole('combobox', { name: '树形选择' })
    fireEvent.click(trigger)
    const tree = screen.getByRole('tree', { name: '树形选择' })
    expect(tree.parentElement).toHaveAttribute('dir', 'rtl')
    const team = screen.getByRole('treeitem', { name: '团队' })
    fireEvent.keyDown(team, { key: 'ArrowLeft' })
    expect(team).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(team, { key: 'ArrowLeft' })
    const design = screen.getByRole('treeitem', { name: '设计组' })
    expect(design).toHaveFocus()
    fireEvent.keyDown(design, { key: 'ArrowRight' })
    expect(team).toHaveFocus()
    fireEvent.keyDown(team, { key: 'ArrowRight' })
    expect(team).toHaveAttribute('aria-expanded', 'false')
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
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
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

  it('keeps unresolved controlled checks in labels, counts and changes', () => {
    const onChange = vi.fn()
    render(
      <TreeSelect
        treeData={treeData}
        checkable
        value={['remote']}
        maxCount={2}
        onChange={onChange}
      />,
    )
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveTextContent('remote')
    expect(trigger).toHaveTextContent('1/2')
    fireEvent.click(trigger)
    fireEvent.keyDown(screen.getByRole('treeitem', { name: '运营组' }), {
      key: 'Enter',
    })
    expect(onChange).toHaveBeenCalledWith(['operations', 'remote'])
    expect(trigger).toHaveTextContent('remote')
    expect(trigger).toHaveTextContent('1/2')
  })

  it('treats explicitly undefined as a controlled empty value', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <TreeSelect
        treeData={treeData}
        value={undefined}
        defaultValue="engineering"
        onChange={onChange}
      />,
    )
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveTextContent('请选择')
    fireEvent.click(trigger)
    fireEvent.click(
      screen
        .getByRole('treeitem', { name: '运营组' })
        .querySelector('[data-tree-label]')!,
    )
    expect(onChange).toHaveBeenCalledWith('operations')
    expect(trigger).toHaveTextContent('请选择')
    rerender(<TreeSelect treeData={treeData} value="engineering" />)
    expect(trigger).toHaveTextContent('研发组')
    rerender(<TreeSelect treeData={treeData} value={undefined} />)
    expect(trigger).toHaveTextContent('请选择')
  })

  it.each([
    ['leaf', ['design', 'engineering']],
    ['parent', ['team']],
    ['all', ['team', 'design', 'engineering']],
  ] as [TreeSelectCheckedStrategy, string[]][])(
    'conducts checks through enabled descendants and returns the %s strategy',
    (strategy, expected) => {
      const onChange = vi.fn()
      render(
        <TreeSelect
          treeData={treeData}
          checkable
          checkedStrategy={strategy}
          onChange={onChange}
          treeDefaultExpandAll
        />,
      )
      const trigger = screen.getByRole('combobox')
      fireEvent.click(trigger)
      const team = screen.getByRole('treeitem', { name: '团队' })
      fireEvent.click(team.querySelector('[data-tree-label]')!)
      expect(onChange).toHaveBeenLastCalledWith(expected)
      expect(team).toHaveAttribute('aria-checked', 'true')
      expect(screen.getByRole('treeitem', { name: '归档组' })).toHaveAttribute(
        'aria-checked',
        'false',
      )
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
      fireEvent.keyDown(screen.getByRole('treeitem', { name: '设计组' }), {
        key: ' ',
      })
      expect(team).toHaveAttribute('aria-checked', 'mixed')
      expect(onChange).toHaveBeenLastCalledWith(['engineering'])
    },
  )

  it('keeps strict parent and child checks independent while preserving checkbox boundaries', () => {
    const onChange = vi.fn()
    render(
      <TreeSelect
        treeData={[
          ...treeData,
          {
            value: 'folder',
            label: '仅展开目录',
            checkable: false,
            children: [{ value: 'child', label: '目录子项' }],
          },
          { value: 'readonly', label: '不可勾选', disableCheckbox: true },
        ]}
        checkable
        checkStrictly
        defaultValue={['team']}
        treeDefaultExpandAll
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByRole('combobox'))
    expect(screen.getByRole('treeitem', { name: '团队' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByRole('treeitem', { name: '设计组' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
    fireEvent.keyDown(screen.getByRole('treeitem', { name: '设计组' }), {
      key: 'Enter',
    })
    expect(onChange).toHaveBeenLastCalledWith(['team', 'design'])
    fireEvent.click(
      screen
        .getByRole('treeitem', { name: '仅展开目录' })
        .querySelector('[data-tree-label]')!,
    )
    fireEvent.click(
      screen
        .getByRole('treeitem', { name: '不可勾选' })
        .querySelector('[data-tree-label]')!,
    )
    expect(onChange).toHaveBeenCalledOnce()
    fireEvent.keyDown(screen.getByRole('treeitem', { name: '目录子项' }), {
      key: ' ',
    })
    expect(onChange).toHaveBeenLastCalledWith(['team', 'design', 'child'])
  })

  it('keeps hidden checked siblings and full-tree half checks when searching', () => {
    const onChange = vi.fn()
    render(
      <TreeSelect
        treeData={treeData}
        checkable
        showSearch
        defaultValue={['engineering']}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: '设计' },
    })
    const team = screen.getByRole('treeitem', { name: '团队' })
    expect(team).toHaveAttribute('aria-checked', 'mixed')
    expect(
      screen.queryByRole('treeitem', { name: '研发组' }),
    ).not.toBeInTheDocument()
    fireEvent.click(
      screen
        .getByRole('treeitem', { name: '设计组' })
        .querySelector('[data-tree-label]')!,
    )
    expect(onChange).toHaveBeenLastCalledWith(['design', 'engineering'])
    expect(team).toHaveAttribute('aria-checked', 'true')
  })

  it('preserves filtered-out plain selections when adding a search result', () => {
    const onChange = vi.fn()
    render(
      <TreeSelect
        treeData={treeData}
        multiple
        showSearch
        defaultValue={['engineering']}
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: '设计' },
    })
    fireEvent.keyDown(screen.getByRole('treeitem', { name: '设计组' }), {
      key: 'Enter',
    })
    expect(onChange).toHaveBeenLastCalledWith(['engineering', 'design'])
  })

  it('limits actual leaf checks with parent values and lets users remove selections at the limit', () => {
    const onChange = vi.fn()
    render(
      <TreeSelect
        treeData={treeData}
        checkable
        checkedStrategy="parent"
        maxCount={2}
        defaultValue={['design']}
        treeDefaultExpandAll
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.keyDown(screen.getByRole('treeitem', { name: '研发组' }), {
      key: 'Enter',
    })
    expect(onChange).toHaveBeenLastCalledWith(['team'])
    expect(screen.getByRole('combobox')).toHaveTextContent('2/2')
    const operations = screen.getByRole('treeitem', { name: '运营组' })
    expect(operations).toHaveAttribute(
      'aria-description',
      expect.stringContaining('勾选已禁用'),
    )
    fireEvent.keyDown(operations, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledOnce()
    expect(screen.getByRole('status')).toHaveTextContent('最多选择 2 项')
    fireEvent.keyDown(screen.getByRole('treeitem', { name: '设计组' }), {
      key: ' ',
    })
    fireEvent.keyDown(operations, { key: 'Enter' })
    expect(onChange).toHaveBeenLastCalledWith(['engineering', 'operations'])
  })

  it('limits plain multiple values, collapses labels and reports clear once with trigger focus', () => {
    const onChange = vi.fn()
    const onClear = vi.fn()
    render(
      <TreeSelect
        treeData={treeData}
        multiple
        maxCount={1}
        maxTagCount={0}
        defaultValue={['design']}
        allowClear
        onChange={onChange}
        onClear={onClear}
        treeDefaultExpandAll
      />,
    )
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveTextContent('+1')
    fireEvent.click(trigger)
    fireEvent.keyDown(screen.getByRole('treeitem', { name: '运营组' }), {
      key: 'Enter',
    })
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '清除树形选择' }))
    expect(onChange).toHaveBeenCalledExactlyOnceWith([])
    expect(onClear).toHaveBeenCalledOnce()
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('supports controlled expansion and controlled search without mutating parent values', () => {
    const onExpand = vi.fn()
    const onSearch = vi.fn()
    const { rerender } = render(
      <TreeSelect
        treeData={treeData}
        expandedValues={[]}
        onExpand={onExpand}
      />,
    )
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.keyDown(screen.getByRole('treeitem', { name: '团队' }), {
      key: 'ArrowRight',
    })
    expect(onExpand).toHaveBeenCalledWith(['team'])
    expect(screen.getByRole('treeitem', { name: '团队' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    rerender(
      <TreeSelect
        treeData={treeData}
        expandedValues={['team']}
        onExpand={onExpand}
        showSearch
        searchValue="设计"
        onSearch={onSearch}
      />,
    )
    const search = screen.getByRole('searchbox')
    expect(search).toHaveValue('设计')
    fireEvent.change(search, { target: { value: '运营' } })
    expect(onSearch).toHaveBeenCalledWith('运营')
    expect(search).toHaveValue('设计')
    expect(screen.getByRole('treeitem', { name: '设计组' })).toBeInTheDocument()
  })

  it('prunes deleted uncontrolled values and does not resurrect them if data is restored', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <TreeSelect
        treeData={treeData}
        defaultValue="operations"
        onChange={onChange}
      />,
    )
    expect(screen.getByRole('combobox')).toHaveTextContent('运营组')
    rerender(<TreeSelect treeData={treeData.slice(0, 1)} onChange={onChange} />)
    expect(screen.getByRole('combobox')).toHaveTextContent('请选择')
    rerender(<TreeSelect treeData={treeData} onChange={onChange} />)
    expect(screen.getByRole('combobox')).toHaveTextContent('请选择')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('shares virtual keyboard navigation and uses native field appearance states', () => {
    const onChange = vi.fn()
    render(
      <TreeSelect
        treeData={Array.from({ length: 1000 }, (_, index) => ({
          value: 'item-' + index,
          label: '部门 ' + index,
        }))}
        variant="filled"
        status="error"
        listHeight={176}
        classNames={{ popup: 'border-dashed' }}
        onChange={onChange}
      />,
    )
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveAttribute('aria-invalid', 'true')
    expect(trigger).toHaveAttribute('data-status', 'error')
    fireEvent.click(trigger)
    expect(screen.getByRole('tree').parentElement?.parentElement).toHaveClass(
      'border-dashed',
    )
    expect(screen.getAllByRole('treeitem').length).toBeLessThan(20)
    act(() => screen.getByRole('treeitem', { name: '部门 0' }).focus())
    fireEvent.keyDown(screen.getByRole('treeitem', { name: '部门 0' }), {
      key: 'End',
    })
    const last = screen.getByRole('treeitem', { name: '部门 999' })
    expect(last).toHaveFocus()
    expect(last).toHaveAttribute('aria-posinset', '1000')
    fireEvent.keyDown(last, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('item-999')
    expect(trigger).toHaveFocus()
  })
})
