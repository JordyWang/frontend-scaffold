import { createRef } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Tree, type TreeHandle, type TreeNode } from '@/shared/ui'

const data: TreeNode[] = Array.from({ length: 500 }, (_, index) => ({
  key: `n${index}`,
  title: `节点 ${index}`,
  isLeaf: true,
  disabled: index === 1,
}))
const tree = () => screen.getByRole('tree', { name: '虚拟树' })
const item = (index: number) =>
  screen.getByRole('treeitem', { name: `节点 ${index}`, exact: true })
afterEach(() => vi.restoreAllMocks())

describe('Tree virtual window', () => {
  it('renders a bounded window with complete sibling metadata and an opt-out', () => {
    const view = (virtual = true) => (
      <Tree
        treeData={data}
        label="虚拟树"
        height={132}
        overscan={1}
        virtual={virtual}
      />
    )
    const { rerender } = render(view())
    expect(screen.getAllByRole('treeitem').length).toBeLessThan(10)
    expect(item(0)).toHaveAttribute('aria-setsize', '500')
    expect(item(2)).toHaveAttribute('aria-posinset', '3')
    expect(item(0)).toHaveAttribute('aria-level', '1')
    expect(
      screen.queryByRole('treeitem', { name: '节点 499' }),
    ).not.toBeInTheDocument()
    rerender(view(false))
    expect(screen.getAllByRole('treeitem')).toHaveLength(500)
    expect(tree()).not.toHaveAttribute('data-ui-tree-virtual')
    rerender(view())
    expect(screen.getAllByRole('treeitem').length).toBeLessThan(10)
  })

  it('moves keyboard focus across windows, skips disabled entries and retains a single tab stop', () => {
    render(
      <Tree
        treeData={data}
        label="虚拟树"
        height={132}
        overscan={0}
        checkable
      />,
    )
    act(() => item(0).focus())
    fireEvent.keyDown(item(0), { key: 'ArrowDown' })
    expect(item(2)).toHaveFocus()
    for (let index = 2; index < 12; index++)
      fireEvent.keyDown(item(index), { key: 'ArrowDown' })
    expect(item(12)).toHaveFocus()
    expect(tree().scrollTop).toBeGreaterThan(0)
    fireEvent.keyDown(item(12), { key: 'End' })
    expect(item(499)).toHaveFocus()
    expect(item(499)).toHaveAttribute('aria-posinset', '500')
    fireEvent.keyDown(item(499), { key: ' ' })
    expect(item(499)).toHaveAttribute('aria-checked', 'true')
    fireEvent.keyDown(item(499), { key: 'Enter' })
    expect(item(499)).toHaveAttribute('aria-selected', 'true')
    expect(
      tree().querySelectorAll('[role="treeitem"][tabindex="0"]'),
    ).toHaveLength(1)
    fireEvent.keyDown(item(499), { key: 'Home' })
    expect(item(0)).toHaveFocus()
    expect(tree().scrollTop).toBe(0)
  })

  it('keeps a focused row mounted during manual scrolling and does not reclaim external focus', () => {
    render(
      <>
        <button>外部操作</button>
        <Tree treeData={data} label="虚拟树" height={132} />
      </>,
    )
    act(() => item(0).focus())
    const focused = item(0)
    fireEvent.scroll(tree(), { target: { scrollTop: 8800 } })
    expect(focused).toHaveFocus()
    expect(focused.isConnected).toBe(true)
    expect(item(200)).toBeInTheDocument()
    act(() => screen.getByRole('button', { name: '外部操作' }).focus())
    fireEvent.scroll(tree(), { target: { scrollTop: 9000 } })
    expect(screen.getByRole('button', { name: '外部操作' })).toHaveFocus()
  })

  it('finds unmounted complex titles using their text value', () => {
    render(
      <Tree
        treeData={[
          ...data,
          { key: 'z', title: <span>目标文档</span>, textValue: 'Zulu' },
        ]}
        height={132}
        label="虚拟树"
      />,
    )
    act(() => item(0).focus())
    fireEvent.keyDown(item(0), { key: 'z' })
    expect(screen.getByRole('treeitem', { name: '目标文档' })).toHaveFocus()
  })

  it('supports aligned imperative scrolling, offset, focus and data shrinking', () => {
    const ref = createRef<TreeHandle>()
    const onScroll = vi.fn()
    const view = (nodes = data) => (
      <Tree
        ref={ref}
        treeData={nodes}
        label="虚拟树"
        height={132}
        onScroll={onScroll}
      />
    )
    const { rerender } = render(view())
    act(() => ref.current!.scrollTo({ key: 'n0', offset: 16 }))
    expect(tree().scrollTop).toBe(16)
    act(() =>
      ref.current!.scrollTo({ key: 'n250', align: 'center', offset: 16 }),
    )
    expect(tree().scrollTop).toBe(250 * 44 - 44 + 16)
    expect(item(250)).toBeInTheDocument()
    act(() => ref.current!.scrollTo({ key: 'n499', align: 'end', focus: true }))
    expect(item(499)).toHaveFocus()
    rerender(view(data.slice(0, 5)))
    expect(tree().scrollTop).toBeLessThanOrEqual(5 * 44 - 132)
    expect(item(0)).toHaveFocus()
    expect(screen.getAllByRole('treeitem')).toHaveLength(5)
    fireEvent.scroll(tree(), { target: { scrollTop: 44 } })
    expect(onScroll).toHaveBeenCalledOnce()
    expect(ref.current!.getNodePath('n250')).toEqual([])
    act(() => ref.current!.scrollTo({ key: 'missing', focus: true }))
    expect(item(0)).toHaveFocus()
  })

  it('expands nested paths before scrolling and works with controlled expansion', () => {
    const ref = createRef<TreeHandle>()
    const onExpand = vi.fn()
    const nodes: TreeNode[] = [
      {
        key: 'root',
        title: '根目录',
        children: [{ key: 'folder', title: '目录', children: data }],
      },
    ]
    const view = (expandedKeys: string[]) => (
      <Tree
        ref={ref}
        treeData={nodes}
        expandedKeys={expandedKeys}
        onExpand={onExpand}
        label="虚拟树"
        height={132}
      />
    )
    const { rerender } = render(view([]))
    expect(ref.current!.getNodePath('n250').map((node) => node.key)).toEqual([
      'root',
      'folder',
      'n250',
    ])
    act(() =>
      ref.current!.scrollTo({ key: 'n250', autoExpand: true, focus: true }),
    )
    expect(onExpand).toHaveBeenCalledExactlyOnceWith(['root', 'folder'])
    expect(
      screen.queryByRole('treeitem', { name: '节点 250' }),
    ).not.toBeInTheDocument()
    rerender(view(['root', 'folder']))
    expect(item(250)).toHaveFocus()
    expect(item(250)).toHaveAttribute('aria-level', '3')
    expect(item(250)).toHaveAttribute('aria-posinset', '251')
    expect(item(250)).toHaveAttribute('aria-setsize', '500')
    rerender(view(['root']))
    expect(
      screen.getByRole('treeitem', { name: '目录', exact: true }),
    ).toHaveFocus()
  })

  it('auto expands uncontrolled paths while respecting disabled ancestors and targets', () => {
    const ref = createRef<TreeHandle>()
    const onExpand = vi.fn()
    const nodes: TreeNode[] = [{ key: 'root', title: '根目录', children: data }]
    const { rerender } = render(
      <Tree
        ref={ref}
        treeData={nodes}
        onExpand={onExpand}
        height={132}
        label="虚拟树"
      />,
    )
    act(() =>
      ref.current!.scrollTo({ key: 'n250', autoExpand: true, focus: true }),
    )
    expect(item(250)).toHaveFocus()
    act(() => ref.current!.scrollTo({ key: 'n1', focus: true }))
    expect(item(250)).toHaveFocus()
    rerender(
      <Tree
        ref={ref}
        treeData={[{ ...nodes[0], disabled: true }]}
        expandedKeys={[]}
        onExpand={onExpand}
        height={132}
        label="虚拟树"
      />,
    )
    onExpand.mockClear()
    act(() => ref.current!.scrollTo({ key: 'n250', autoExpand: true }))
    expect(onExpand).not.toHaveBeenCalled()
  })

  it('measures changing row heights and preserves the visible anchor when an earlier row grows', () => {
    const tall = new Set<string>()
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
        const label = this.querySelector('[data-tree-label]')?.textContent ?? ''
        return {
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          right: 300,
          width: 300,
          bottom: 0,
          height:
            this.getAttribute('role') === 'treeitem'
              ? tall.has(label)
                ? 88
                : 44
              : 0,
          toJSON() {
            return {}
          },
        }
      },
    )
    const view = () => (
      <Tree treeData={data} height={132} overscan={1} label="虚拟树" />
    )
    const { rerender } = render(view())
    fireEvent.scroll(tree(), { target: { scrollTop: 220 } })
    tall.add('节点 4')
    rerender(view())
    expect(item(5).style.top).toBe('264px')
    expect(tree().scrollTop).toBe(264)
    expect(item(6).style.top).toBe('308px')
  })

  it('normalizes invalid window settings and preserves empty and disabled states', () => {
    const { rerender } = render(
      <Tree
        treeData={data}
        height={132}
        estimatedItemHeight={Number.NaN}
        overscan={Number.NaN}
        label="虚拟树"
      />,
    )
    expect(screen.getAllByRole('treeitem').length).toBeLessThan(15)
    rerender(<Tree treeData={data} height={132} label="虚拟树" disabled />)
    expect(tree().querySelectorAll('[tabindex="0"]')).toHaveLength(0)
    expect(tree()).toHaveAttribute('tabindex', '0')
    rerender(<Tree treeData={[]} height={132} label="虚拟树" />)
    expect(screen.getByText('暂无节点')).toBeVisible()
    expect(tree()).toHaveStyle({ height: '132px' })
    rerender(
      <Tree treeData={data.slice(0, 5)} height={Number.NaN} label="虚拟树" />,
    )
    expect(tree()).not.toHaveAttribute('data-ui-tree-virtual')
    expect(screen.getAllByRole('treeitem')).toHaveLength(5)
  })

  it('keeps a previously visible focused row in view when its feedback grows', () => {
    let grown = false
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
        const label = this.querySelector('[data-tree-label]')?.textContent ?? ''
        return {
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          right: 300,
          width: 300,
          bottom: 0,
          height:
            this.getAttribute('role') === 'treeitem'
              ? grown && label === '节点 499'
                ? 88
                : 44
              : 0,
          toJSON() {
            return {}
          },
        }
      },
    )
    const ref = createRef<TreeHandle>()
    const view = () => (
      <Tree ref={ref} treeData={data} height={132} label="虚拟树" />
    )
    const { rerender } = render(view())
    act(() => ref.current!.scrollTo({ key: 'n499', align: 'end', focus: true }))
    expect(tree().scrollTop).toBe(500 * 44 - 132)
    grown = true
    rerender(view())
    expect(tree().scrollTop).toBe(500 * 44 + 44 - 132)
    expect(item(499)).toHaveFocus()
  })
})
