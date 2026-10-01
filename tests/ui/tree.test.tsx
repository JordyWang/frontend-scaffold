import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfigProvider, Tree, type TreeNode } from '@/shared/ui'

const data: TreeNode[] = [
  {
    key: 'root',
    title: '根节点',
    children: [
      {
        key: 'branch',
        title: '分支',
        children: [
          { key: 'a', title: 'Alpha' },
          { key: 'b', title: 'Beta' },
        ],
      },
      {
        key: 'disabled',
        title: '禁用分支',
        disabled: true,
        children: [{ key: 'independent', title: '独立项' }],
      },
      {
        key: 'locked',
        title: '禁用勾选',
        disableCheckbox: true,
        children: [{ key: 'locked-child', title: '锁定分支子项' }],
      },
      { key: 'last', title: '最后一项' },
    ],
  },
]
const item = (name: string) =>
  screen.getByRole('treeitem', { name, exact: true })
const check = (name: string) =>
  fireEvent.click(item(name).querySelector('[data-tree-checkbox]')!)

describe('Tree', () => {
  it('conducts parent checks and reports half-checked ancestors when a descendant is unchecked', () => {
    const onCheck = vi.fn()
    render(
      <Tree treeData={data} defaultExpandAll checkable onCheck={onCheck} />,
    )
    check('根节点')
    for (const name of ['根节点', '分支', 'Alpha', 'Beta', '最后一项'])
      expect(item(name)).toHaveAttribute('aria-checked', 'true')
    for (const name of ['禁用分支', '独立项', '禁用勾选', '锁定分支子项'])
      expect(item(name)).toHaveAttribute('aria-checked', 'false')
    expect(onCheck.mock.lastCall![0]).toEqual([
      'root',
      'branch',
      'a',
      'b',
      'last',
    ])
    check('Alpha')
    expect(item('Alpha')).toHaveAttribute('aria-checked', 'false')
    expect(item('Beta')).toHaveAttribute('aria-checked', 'true')
    expect(item('根节点')).toHaveAttribute('aria-checked', 'mixed')
    expect(item('分支')).toHaveAttribute('aria-checked', 'mixed')
    expect(onCheck.mock.lastCall![1]).toMatchObject({
      checked: false,
      halfCheckedKeys: ['root', 'branch'],
    })
    check('Alpha')
    expect(item('根节点')).toHaveAttribute('aria-checked', 'true')
    check('根节点')
    expect(onCheck.mock.lastCall![0]).toEqual([])
    expect(onCheck.mock.lastCall![1].halfCheckedKeys).toEqual([])
  })

  it('stops conduction at disabled boundaries while allowing independently checked descendants', () => {
    const onCheck = vi.fn()
    render(
      <Tree
        treeData={data}
        defaultExpandAll
        checkable
        defaultCheckedKeys={['disabled']}
        onCheck={onCheck}
      />,
    )
    expect(item('禁用分支')).toHaveAttribute('aria-checked', 'true')
    expect(item('独立项')).toHaveAttribute('aria-checked', 'false')
    check('独立项')
    check('锁定分支子项')
    expect(item('根节点')).toHaveAttribute('aria-checked', 'false')
    expect(item('禁用勾选')).toHaveAttribute('aria-checked', 'false')
    check('根节点')
    check('根节点')
    expect(onCheck.mock.lastCall![0]).toEqual([
      'disabled',
      'independent',
      'locked-child',
    ])
    check('禁用分支')
    check('禁用勾选')
    expect(onCheck).toHaveBeenCalledTimes(4)
    expect(item('禁用勾选')).toHaveAttribute(
      'aria-description',
      '勾选已禁用，仍可选择节点',
    )
  })

  it('supports strict checks and explicitly controlled mixed state without parent conduction', () => {
    const onCheck = vi.fn()
    const { rerender } = render(
      <Tree
        treeData={data}
        defaultExpandAll
        checkable
        checkStrictly
        checkedKeys={['a']}
        halfCheckedKeys={['root']}
        onCheck={onCheck}
      />,
    )
    expect(item('根节点')).toHaveAttribute('aria-checked', 'mixed')
    expect(item('分支')).toHaveAttribute('aria-checked', 'false')
    check('分支')
    expect(onCheck.mock.lastCall![0]).toEqual(['branch', 'a'])
    expect(item('分支')).toHaveAttribute('aria-checked', 'false')
    rerender(
      <Tree
        treeData={data}
        defaultExpandAll
        checkable
        checkStrictly
        checkedKeys={['branch', 'a']}
        halfCheckedKeys={['root']}
      />,
    )
    expect(item('分支')).toHaveAttribute('aria-checked', 'true')
    expect(item('Beta')).toHaveAttribute('aria-checked', 'false')
  })

  it('keeps checkbox clicks and Space independent from selection and Enter', () => {
    const onSelect = vi.fn()
    const onCheck = vi.fn()
    render(
      <Tree
        treeData={data}
        defaultExpandAll
        checkable
        onCheck={onCheck}
        onSelect={onSelect}
      />,
    )
    check('Alpha')
    expect(onSelect).not.toHaveBeenCalled()
    expect(item('Alpha')).toHaveAttribute('aria-selected', 'false')
    fireEvent.keyDown(item('Alpha'), { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('a')
    expect(onCheck).toHaveBeenCalledOnce()
    fireEvent.keyDown(item('Alpha'), { key: ' ' })
    expect(onCheck).toHaveBeenCalledTimes(2)
    expect(item('Alpha')).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(item('禁用勾选'))
    expect(item('禁用勾选')).toHaveAttribute('aria-selected', 'true')
  })

  it('toggles multiple node selection and honors selectable / checkable overrides', () => {
    const onSelectionChange = vi.fn()
    render(
      <Tree
        multiple
        checkable
        defaultExpandAll
        treeData={[
          { key: 'one', title: '第一项' },
          { key: 'two', title: '第二项' },
          { key: 'check', title: '仅勾选', selectable: false },
          { key: 'select', title: '仅选择', checkable: false },
        ]}
        onSelectionChange={onSelectionChange}
      />,
    )
    fireEvent.click(item('第一项'))
    fireEvent.click(item('第二项'))
    expect(onSelectionChange.mock.lastCall![0]).toEqual(['one', 'two'])
    fireEvent.click(item('第一项'))
    expect(onSelectionChange.mock.lastCall![0]).toEqual(['two'])
    expect(screen.getByRole('tree')).toHaveAttribute(
      'aria-multiselectable',
      'true',
    )
    fireEvent.click(item('仅勾选'))
    expect(onSelectionChange).toHaveBeenCalledTimes(3)
    check('仅勾选')
    expect(item('仅勾选')).toHaveAttribute('aria-checked', 'true')
    expect(item('仅勾选')).not.toHaveAttribute('aria-selected')
    expect(item('仅选择')).not.toHaveAttribute('aria-checked')
  })

  it('accepts controlled empty selection and preserves the legacy single selection callback', () => {
    const onSelect = vi.fn()
    const { rerender } = render(
      <Tree
        treeData={data}
        defaultExpandAll
        defaultSelectedKey="a"
        onSelect={onSelect}
      />,
    )
    expect(item('Alpha')).toHaveAttribute('aria-selected', 'true')
    rerender(
      <Tree
        treeData={data}
        defaultExpandAll
        selectedKey={undefined}
        onSelect={onSelect}
      />,
    )
    expect(item('Alpha')).toHaveAttribute('aria-selected', 'false')
    fireEvent.click(item('Beta'))
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('b')
    expect(item('Beta')).toHaveAttribute('aria-selected', 'false')
    rerender(
      <Tree treeData={data} defaultExpandAll selectedKeys={['a', 'b']} />,
    )
    expect(item('Alpha')).toHaveAttribute('aria-selected', 'true')
    expect(item('Beta')).toHaveAttribute('aria-selected', 'false')
  })

  it('uses one tab entry, native hierarchy metadata and direction-aware navigation without selecting on focus', () => {
    const onSelect = vi.fn()
    render(
      <ConfigProvider direction="rtl">
        <Tree treeData={data} onSelect={onSelect} />
      </ConfigProvider>,
    )
    act(() => item('根节点').focus())
    fireEvent.keyDown(item('根节点'), { key: 'ArrowRight' })
    expect(item('根节点')).toHaveAttribute('aria-expanded', 'false')
    fireEvent.keyDown(item('根节点'), { key: 'ArrowLeft' })
    expect(item('根节点')).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(item('根节点'), { key: 'ArrowLeft' })
    expect(item('分支')).toHaveFocus()
    expect(item('分支')).toHaveAttribute('aria-level', '2')
    expect(item('分支')).toHaveAttribute('aria-posinset', '1')
    expect(item('分支')).toHaveAttribute('aria-setsize', '4')
    fireEvent.keyDown(item('分支'), { key: 'ArrowDown' })
    expect(item('禁用勾选')).toHaveFocus()
    fireEvent.keyDown(item('禁用勾选'), { key: 'End' })
    expect(item('最后一项')).toHaveFocus()
    fireEvent.keyDown(item('最后一项'), { key: 'Home' })
    expect(item('根节点')).toHaveFocus()
    expect(
      document.querySelectorAll('[role="treeitem"][tabindex="0"]'),
    ).toHaveLength(1)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('supports typeahead, repeated initial cycling and ignores modified or composing input', () => {
    render(
      <Tree
        treeData={[
          { key: 'a', title: 'Alpha' },
          { key: 'b', title: 'Beta' },
          { key: 'c', title: 'Bravo' },
        ]}
      />,
    )
    act(() => item('Alpha').focus())
    fireEvent.keyDown(item('Alpha'), { key: 'b' })
    expect(item('Beta')).toHaveFocus()
    fireEvent.keyDown(item('Beta'), { key: 'b' })
    expect(item('Bravo')).toHaveFocus()
    fireEvent.keyDown(item('Bravo'), { key: 'Home', ctrlKey: true })
    expect(item('Bravo')).toHaveFocus()
    fireEvent.keyDown(item('Bravo'), { key: 'a', isComposing: true })
    expect(item('Bravo')).toHaveFocus()
    fireEvent.keyDown(item('Bravo'), { key: 'Home' })
    fireEvent.keyDown(item('Alpha'), { key: 'b' })
    fireEvent.keyDown(item('Beta'), { key: 'r' })
    expect(item('Bravo')).toHaveFocus()
  })

  it('restores focus to the nearest remaining ancestor after collapse, deletion or disabling', () => {
    const { rerender } = render(
      <Tree treeData={data} expandedKeys={['root', 'branch']} />,
    )
    act(() => item('Alpha').focus())
    rerender(<Tree treeData={data} expandedKeys={['root']} />)
    expect(item('分支')).toHaveFocus()
    rerender(
      <Tree
        treeData={[
          { ...data[0], children: [{ key: 'last', title: '最后一项' }] },
        ]}
        expandedKeys={['root']}
      />,
    )
    expect(item('根节点')).toHaveFocus()
    rerender(<Tree treeData={data} expandedKeys={['root']} disabled />)
    expect(screen.getByRole('tree')).toHaveFocus()
    expect(
      document.querySelectorAll('[role="treeitem"][tabindex="0"]'),
    ).toHaveLength(0)
    rerender(<Tree treeData={[]} />)
    expect(screen.getByRole('tree')).toHaveFocus()
    expect(screen.getByText('暂无节点')).toBeVisible()
  })

  it('does not steal external focus or handle interactive content keys and clicks', () => {
    const onSelect = vi.fn()
    const nodes = [{ key: 'a', title: <button>节点操作</button> }]
    const view = (next: TreeNode[]) => (
      <>
        <Tree treeData={next} onSelect={onSelect} />
        <button>外部操作</button>
      </>
    )
    const { rerender } = render(view(nodes))
    fireEvent.click(screen.getByRole('button', { name: '节点操作' }))
    fireEvent.keyDown(screen.getByRole('button', { name: '节点操作' }), {
      key: 'Enter',
    })
    expect(onSelect).not.toHaveBeenCalled()
    act(() => item('节点操作').focus())
    act(() => screen.getByRole('button', { name: '外部操作' }).focus())
    rerender(view([]))
    expect(screen.getByRole('button', { name: '外部操作' })).toHaveFocus()
  })

  it('expands ancestors by default and lets controlled auto-expanded parents collapse', () => {
    const onExpand = vi.fn()
    const { rerender } = render(
      <Tree treeData={data} defaultExpandedKeys={['branch']} />,
    )
    expect(item('Alpha')).toBeVisible()
    rerender(
      <Tree
        treeData={data}
        expandedKeys={['branch']}
        autoExpandParent
        onExpand={onExpand}
      />,
    )
    fireEvent.click(item('根节点').querySelector('[data-tree-toggle]')!)
    expect(onExpand).toHaveBeenCalledExactlyOnceWith([])
    expect(item('根节点')).toHaveAttribute('aria-expanded', 'true')
  })

  it('prunes removed uncontrolled keys and checks newly added children of a checked parent', () => {
    const { rerender } = render(
      <Tree
        treeData={data}
        defaultExpandAll
        checkable
        defaultSelectedKey="a"
        defaultCheckedKeys={['branch']}
      />,
    )
    const changed: TreeNode[] = [
      {
        ...data[0],
        children: [
          {
            key: 'branch',
            title: '分支',
            children: [{ key: 'new', title: '新节点' }],
          },
        ],
      },
    ]
    rerender(<Tree treeData={changed} defaultExpandAll checkable />)
    expect(item('新节点')).toHaveAttribute('aria-checked', 'true')
    rerender(<Tree treeData={data} defaultExpandAll checkable />)
    expect(item('Alpha')).toHaveAttribute('aria-selected', 'false')
    expect(item('Alpha')).toHaveAttribute('aria-checked', 'true')
  })

  it('stops automatic ancestor expansion at disabled parents while honoring explicit expansion', () => {
    const { rerender } = render(
      <Tree treeData={data} defaultExpandedKeys={['independent']} />,
    )
    expect(item('根节点')).toHaveAttribute('aria-expanded', 'false')
    expect(
      screen.queryByRole('treeitem', { name: '独立项' }),
    ).not.toBeInTheDocument()
    rerender(<Tree treeData={data} expandedKeys={['root', 'disabled']} />)
    expect(item('独立项')).toBeVisible()
    expect(item('禁用分支')).toHaveAttribute('aria-disabled', 'true')
  })

  it('forwards root attributes, empty copy, decorative icons and semantic Tailwind classes', () => {
    const onFocus = vi.fn()
    const { rerender } = render(
      <Tree
        id="tree"
        treeData={[
          {
            key: 'a',
            title: '条目',
            icon: <span>装饰图标</span>,
            classNames: { title: 'font-medium' },
          },
        ]}
        showIcon
        classNames={{ root: 'p-4' }}
        onFocusCapture={onFocus}
        aria-label="自定义树"
      />,
    )
    const tree = screen.getByRole('tree', { name: '自定义树' })
    expect(tree).toHaveAttribute('id', 'tree')
    expect(tree).toHaveClass('p-4')
    expect(screen.getByText('条目')).toHaveClass('font-medium')
    expect(screen.getByText('装饰图标').parentElement).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    act(() => item('条目').focus())
    expect(onFocus).toHaveBeenCalledOnce()
    rerender(<Tree treeData={[]} emptyText="暂无文件" />)
    expect(screen.getByText('暂无文件')).toBeVisible()
  })
})
