import { createRef, useState } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  Tree,
  moveTreeNode,
  type TreeDropInfo,
  type TreeHandle,
  type TreeNode,
} from '@/shared/ui'

const data: TreeNode[] = [
  {
    key: 'root',
    title: '工作目录',
    isLeaf: false,
    children: [
      { key: 'a', title: 'Alpha', isLeaf: true },
      { key: 'b', title: 'Beta', isLeaf: true },
      {
        key: 'branch',
        title: '子目录',
        children: [{ key: 'c', title: 'Charlie', isLeaf: true }],
      },
    ],
  },
  {
    key: 'target',
    title: '目标目录',
    children: [{ key: 'd', title: 'Delta', isLeaf: true }],
  },
  { key: 'empty', title: '空目录', children: [] },
  {
    key: 'locked',
    title: '禁用目录',
    disabled: true,
    children: [{ key: 'locked-child', title: '禁用分支文件', isLeaf: true }],
  },
  { key: 'readonly', title: '不可移动文件', draggable: false, isLeaf: true },
]
const item = (name: string) =>
  screen.getByRole('treeitem', { name, exact: true })
const moveButton = (name: string) =>
  screen.getByRole('button', { name: `移动${name}`, exact: true })
function Harness({
  onDrop = vi.fn(),
  nodes = data,
  height,
}: {
  onDrop?: (info: TreeDropInfo) => void
  nodes?: TreeNode[]
  height?: number
}) {
  const [treeData, setTreeData] = useState(nodes)
  return (
    <Tree
      treeData={treeData}
      defaultExpandAll
      draggable
      checkable
      height={height}
      defaultSelectedKey="a"
      defaultCheckedKeys={['a']}
      onDrop={(info) => {
        onDrop(info)
        setTreeData(moveTreeNode(info.treeData, info))
      }}
    />
  )
}
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('moveTreeNode', () => {
  it('moves whole branches immutably and retains untouched branch identities', () => {
    const next = moveTreeNode(data, {
      dragKey: 'branch',
      dropKey: 'target',
      position: 'inside',
    })
    expect(next[0].children?.map((node) => node.key)).toEqual(['a', 'b'])
    expect(next[1].children?.map((node) => node.key)).toEqual(['d', 'branch'])
    expect(next[1].children?.[1]).toBe(data[0].children?.[2])
    expect(next[2]).toBe(data[2])
    expect(data[0].children).toHaveLength(3)
    expect(data[1].children).toHaveLength(1)
  })
  it('supports sibling and root reordering with both before and after positions', () => {
    const before = moveTreeNode(data, {
      dragKey: 'b',
      dropKey: 'a',
      position: 'before',
    })
    expect(before[0].children?.map((node) => node.key)).toEqual([
      'b',
      'a',
      'branch',
    ])
    const after = moveTreeNode(data, {
      dragKey: 'a',
      dropKey: 'b',
      position: 'after',
    })
    expect(after[0].children?.map((node) => node.key)).toEqual([
      'b',
      'a',
      'branch',
    ])
    const root = moveTreeNode(data, {
      dragKey: 'empty',
      dropKey: 'root',
      position: 'before',
    })
    expect(root.map((node) => node.key)).toEqual([
      'empty',
      'root',
      'target',
      'locked',
      'readonly',
    ])
  })
  it('rejects cycles, leaves, protected branches, missing keys and unchanged positions', () => {
    for (const move of [
      { dragKey: 'root', dropKey: 'branch', position: 'after' },
      { dragKey: 'a', dropKey: 'a', position: 'before' },
      { dragKey: 'a', dropKey: 'b', position: 'inside' },
      { dragKey: 'locked-child', dropKey: 'empty', position: 'inside' },
      { dragKey: 'a', dropKey: 'locked-child', position: 'before' },
      { dragKey: 'readonly', dropKey: 'empty', position: 'inside' },
      { dragKey: 'missing', dropKey: 'empty', position: 'inside' },
      { dragKey: 'a', dropKey: 'b', position: 'before' },
      { dragKey: 'b', dropKey: 'a', position: 'after' },
      { dragKey: 'c', dropKey: 'branch', position: 'inside' },
    ] as const)
      expect(moveTreeNode(data, move)).toBe(data)
  })
  it('turns an emptied lazy branch into explicit known data and can receive children again', () => {
    const source: TreeNode[] = [
      {
        key: 'remote',
        title: '远程目录',
        isLeaf: false,
        children: [data[0].children![0]],
      },
      data[2],
    ]
    const next = moveTreeNode(source, {
      dragKey: 'a',
      dropKey: 'empty',
      position: 'inside',
    })
    expect(next[0].children).toEqual([])
    expect(next[0].isLeaf).toBeUndefined()
    const restored = moveTreeNode(next, {
      dragKey: 'a',
      dropKey: 'remote',
      position: 'inside',
    })
    expect(restored[0].children?.[0].key).toBe('a')
  })
})

describe('Tree movement', () => {
  it('moves with keyboard without changing selection or checked keys', () => {
    const onDrop = vi.fn()
    render(<Harness onDrop={onDrop} />)
    act(() => item('Alpha').focus())
    fireEvent.keyDown(item('Alpha'), { key: ' ', ctrlKey: true })
    expect(screen.getByRole('region', { name: '节点移动操作' })).toBeVisible()
    for (const name of ['目标之前', '目标内部', '目标之后'])
      expect(screen.getByRole('button', { name })).toBeDisabled()
    fireEvent.keyDown(item('Alpha'), { key: 'ArrowDown' })
    expect(item('Beta')).toHaveFocus()
    fireEvent.keyDown(item('Beta'), { key: 'Enter' })
    expect(onDrop).toHaveBeenCalledOnce()
    expect(onDrop.mock.calls[0][0]).toMatchObject({
      dragKey: 'a',
      dropKey: 'b',
      position: 'after',
      dragKeys: ['a'],
    })
    expect(item('Alpha')).toHaveFocus()
    expect(item('Alpha')).toHaveAttribute('aria-selected', 'true')
    expect(item('Alpha')).toHaveAttribute('aria-checked', 'true')
    expect(item('Alpha')).toHaveAttribute('aria-posinset', '2')
    expect(
      screen.queryByRole('region', { name: '节点移动操作' }),
    ).not.toBeInTheDocument()
  })

  it('offers touch controls, moves into a chosen directory and preserves the whole branch', () => {
    const onDrop = vi.fn()
    render(
      <Harness
        onDrop={onDrop}
        nodes={data.map((node) =>
          node.key === 'root'
            ? {
                ...node,
                children: node.children?.map((child) =>
                  child.key === 'branch'
                    ? {
                        ...child,
                        classNames: { moveControls: 'border-dashed' },
                      }
                    : child,
                ),
              }
            : node,
        )}
      />,
    )
    fireEvent.click(moveButton('子目录'))
    expect(screen.getByRole('region', { name: '节点移动操作' })).toHaveClass(
      'border-dashed',
    )
    fireEvent.click(item('目标目录').querySelector('[data-tree-label]')!)
    fireEvent.click(
      screen.getByRole('button', { name: '目标内部', exact: true }),
    )
    fireEvent.click(screen.getByRole('button', { name: '确认移动节点' }))
    expect(onDrop.mock.calls[0][0].dragKeys).toEqual(['branch', 'c'])
    expect(item('子目录')).toHaveAttribute('aria-level', '2')
    expect(item('Charlie')).toHaveAttribute('aria-level', '3')
    expect(item('子目录')).toHaveFocus()
  })

  it('shows invalid targets and custom placement rules without issuing a move', () => {
    const onDrop = vi.fn()
    render(
      <Tree
        treeData={data}
        defaultExpandAll
        draggable
        onDrop={onDrop}
        allowDrop={(info) =>
          info.dropKey === 'target' && info.position === 'inside'
        }
      />,
    )
    expect(moveButton('禁用目录')).toBeDisabled()
    expect(moveButton('禁用分支文件')).toBeDisabled()
    expect(moveButton('不可移动文件')).toBeDisabled()
    fireEvent.click(moveButton('工作目录'))
    fireEvent.click(item('子目录').querySelector('[data-tree-label]')!)
    expect(screen.getByRole('button', { name: '确认移动节点' })).toBeDisabled()
    expect(
      screen.getByRole('status', { name: '树节点移动状态' }),
    ).toHaveTextContent('自身或其后代')
    fireEvent.keyDown(item('子目录'), { key: 'Escape' })
    fireEvent.click(moveButton('Alpha'))
    fireEvent.click(item('目标目录').querySelector('[data-tree-label]')!)
    expect(screen.getByRole('button', { name: '目标之前' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '目标内部' }))
    expect(screen.getByRole('button', { name: '确认移动节点' })).toBeEnabled()
    expect(onDrop).not.toHaveBeenCalled()
  })

  it('cancels with Escape, an outside pointer and source removal or disabling', () => {
    const onDrop = vi.fn()
    const view = (nodes = data, disabled = false) => (
      <>
        <button>外部操作</button>
        <Tree
          treeData={nodes}
          defaultExpandAll
          draggable
          disabled={disabled}
          onDrop={onDrop}
        />
      </>
    )
    const { rerender } = render(view())
    fireEvent.click(moveButton('Alpha'))
    fireEvent.keyDown(item('Alpha'), { key: 'Escape' })
    expect(item('Alpha')).toHaveFocus()
    fireEvent.click(moveButton('Alpha'))
    act(() => screen.getByRole('button', { name: '外部操作' }).focus())
    fireEvent.pointerDown(screen.getByRole('button', { name: '外部操作' }))
    expect(screen.getByRole('button', { name: '外部操作' })).toHaveFocus()
    fireEvent.click(moveButton('Alpha'))
    rerender(view(data, true))
    expect(
      screen.queryByRole('region', { name: '节点移动操作' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('status', { name: '树节点移动状态' }),
    ).toHaveTextContent('移动已取消')
    rerender(view())
    fireEvent.click(moveButton('Alpha'))
    rerender(view(data.slice(1)))
    expect(
      screen.queryByRole('region', { name: '节点移动操作' }),
    ).not.toBeInTheDocument()
    expect(onDrop).not.toHaveBeenCalled()
  })

  it('accepts native inside drops, expands a hovered directory and ignores external drags', () => {
    vi.useFakeTimers()
    const onDrop = vi.fn()
    const transfer = { setData: vi.fn(), effectAllowed: '', dropEffect: '' }
    render(
      <Tree
        treeData={data}
        defaultExpandedKeys={['root']}
        draggable
        onDrop={onDrop}
      />,
    )
    const row = item('目标目录').querySelector('[data-ui-tree-row]')!
    fireEvent.drop(row, { dataTransfer: transfer })
    expect(onDrop).not.toHaveBeenCalled()
    fireEvent.dragStart(moveButton('Alpha'), { dataTransfer: transfer })
    fireEvent.dragOver(row, { dataTransfer: transfer })
    expect(row).toHaveAttribute('data-tree-drop-position', 'inside')
    act(() => vi.advanceTimersByTime(600))
    expect(item('目标目录')).toHaveAttribute('aria-expanded', 'true')
    expect(item('Delta')).toBeVisible()
    fireEvent.drop(row, { dataTransfer: transfer })
    expect(onDrop).toHaveBeenCalledOnce()
    expect(onDrop.mock.calls[0][0]).toMatchObject({
      dragKey: 'a',
      dropKey: 'target',
      position: 'inside',
    })
    expect(transfer.setData).toHaveBeenCalledWith(
      'application/x-ui-tree-node',
      'a',
    )
  })

  it('moves loaded children using the resolved snapshot without reviving stale cached children', async () => {
    const load = vi.fn(async () => [{ key: 'a', title: 'Alpha', isLeaf: true }])
    function AsyncHarness() {
      const [nodes, setNodes] = useState<TreeNode[]>([
        { key: 'remote', title: '远程目录', isLeaf: false },
        data[2],
      ])
      return (
        <Tree
          treeData={nodes}
          defaultExpandedKeys={['remote']}
          loadChildren={load}
          draggable
          onDrop={(info) => setNodes(moveTreeNode(info.treeData, info))}
        />
      )
    }
    render(<AsyncHarness />)
    await screen.findByRole('treeitem', { name: 'Alpha', exact: true })
    fireEvent.click(moveButton('Alpha'))
    fireEvent.click(item('空目录').querySelector('[data-tree-label]')!)
    fireEvent.click(screen.getByRole('button', { name: '目标内部' }))
    fireEvent.click(screen.getByRole('button', { name: '确认移动节点' }))
    expect(screen.getAllByRole('treeitem', { name: 'Alpha' })).toHaveLength(1)
    expect(item('远程目录')).not.toHaveAttribute('aria-expanded')
    expect(item('空目录').contains(item('Alpha'))).toBe(true)
    await waitFor(() => expect(load).toHaveBeenCalledOnce())
  })

  it('retains the current native target when a virtual row leaves underneath the pointer', () => {
    const transfer = { setData: vi.fn(), effectAllowed: '', dropEffect: '' }
    render(<Harness />)
    const tree = screen.getByRole('tree')
    const row = item('目标目录').querySelector('[data-ui-tree-row]')!
    vi.spyOn(tree, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(10, 10, 400, 132),
    )
    const originalHitTest = Object.getOwnPropertyDescriptor(
      document,
      'elementFromPoint',
    )
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: () => row,
    })
    const leave = (x: number) =>
      fireEvent(
        tree,
        Object.assign(new Event('dragleave', { bubbles: true }), {
          clientX: x,
          clientY: 100,
          relatedTarget: document.createElement('div'),
        }),
      )
    try {
      fireEvent.dragStart(moveButton('Alpha'), { dataTransfer: transfer })
      fireEvent.dragOver(row, { dataTransfer: transfer })
      expect(row).toHaveAttribute('data-tree-drop-position', 'inside')
      leave(100)
      expect(row).toHaveAttribute('data-tree-drop-position', 'inside')
      leave(600)
      expect(row).not.toHaveAttribute('data-tree-drop-position')
      fireEvent(
        document,
        Object.assign(new Event('dragover', { bubbles: true }), {
          clientX: 100,
          clientY: 100,
        }),
      )
      expect(row).toHaveAttribute('data-tree-drop-position', 'inside')
    } finally {
      if (originalHitTest)
        Object.defineProperty(document, 'elementFromPoint', originalHitTest)
      else Reflect.deleteProperty(document, 'elementFromPoint')
    }
  })

  it('keeps a native source mounted across virtual windows and can drop into an offscreen directory', () => {
    const ref = createRef<TreeHandle>()
    const onDrop = vi.fn()
    const nodes: TreeNode[] = [
      ...Array.from({ length: 100 }, (_, index) => ({
        key: `file-${index}`,
        title: `文件 ${index}`,
        isLeaf: true,
      })),
      data[2],
    ]
    const transfer = { setData: vi.fn(), effectAllowed: '', dropEffect: '' }
    render(
      <Tree
        ref={ref}
        treeData={nodes}
        height={132}
        draggable
        onDrop={onDrop}
      />,
    )
    const source = moveButton('文件 0')
    fireEvent.dragStart(source, { dataTransfer: transfer })
    act(() => ref.current!.scrollTo({ key: 'empty', align: 'end' }))
    expect(source.isConnected).toBe(true)
    fireEvent.dragOver(item('空目录').querySelector('[data-ui-tree-row]')!, {
      dataTransfer: transfer,
    })
    fireEvent.drop(item('空目录').querySelector('[data-ui-tree-row]')!, {
      dataTransfer: transfer,
    })
    expect(onDrop).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        dragKey: 'file-0',
        dropKey: 'empty',
        position: 'inside',
      }),
    )
  })
})
