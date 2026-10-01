import { StrictMode } from 'react'
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Tree, type TreeLoadChildren, type TreeNode } from '@/shared/ui'
import { useTreeLoader } from '@/shared/ui/tree-loader'

function deferred() {
  let resolve!: (value: TreeNode[]) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<TreeNode[]>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
const data: TreeNode[] = [{ key: 'root', title: '远程目录', isLeaf: false }]
const children: TreeNode[] = [{ key: 'file', title: '远程文件', isLeaf: true }]
const root = () =>
  screen.getByRole('treeitem', { name: '远程目录', exact: true })
const toggle = () =>
  fireEvent.click(root().querySelector('[data-tree-toggle]')!)
async function settle(request: ReturnType<typeof deferred>, result = children) {
  await act(async () => {
    request.resolve(result)
    await request.promise
  })
}

describe('Tree async children', () => {
  it('deduplicates loading, retains focus and caches children without mutating source data', async () => {
    const pending = deferred()
    const load = vi.fn<TreeLoadChildren>(() => pending.promise)
    const onLoad = vi.fn()
    const frozen = Object.freeze([
      Object.freeze(data[0]),
    ]) as unknown as TreeNode[]
    render(
      <Tree
        treeData={frozen}
        loadChildren={load}
        onLoad={onLoad}
        checkable
        defaultCheckedKeys={['root']}
      />,
    )
    act(() => root().focus())
    fireEvent.keyDown(root(), { key: 'ArrowRight' })
    await waitFor(() => expect(load).toHaveBeenCalledOnce())
    expect(root()).toHaveAttribute('aria-busy', 'true')
    expect(
      screen.getByRole('status', { name: '远程目录加载状态' }),
    ).toHaveTextContent('正在加载子节点')
    fireEvent.keyDown(root(), { key: 'ArrowRight' })
    fireEvent.keyDown(root(), { key: 'ArrowRight' })
    expect(load).toHaveBeenCalledOnce()
    await settle(pending)
    expect(root()).toHaveFocus()
    expect(root()).not.toHaveAttribute('aria-busy')
    expect(screen.getByRole('treeitem', { name: '远程文件' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(onLoad).toHaveBeenCalledExactlyOnceWith(frozen[0], children)
    expect(frozen[0].children).toBeUndefined()
    toggle()
    toggle()
    expect(screen.getByRole('treeitem', { name: '远程文件' })).toBeVisible()
    expect(load).toHaveBeenCalledOnce()
  })

  it('starts controlled or default expansion and never loads known leaves or populated branches', async () => {
    const load = vi.fn<TreeLoadChildren>(async () => children)
    render(
      <Tree
        treeData={[
          ...data,
          { key: 'leaf', title: '固定叶子', isLeaf: true },
          { key: 'empty', title: '已知空目录', children: [] },
          {
            key: 'known',
            title: '已有目录',
            children: [{ key: 'known-file', title: '已有文件', isLeaf: true }],
          },
          { key: 'disabled', title: '禁用目录', disabled: true, isLeaf: false },
        ]}
        loadChildren={load}
        expandedKeys={['root', 'leaf', 'empty', 'known', 'disabled']}
      />,
    )
    await waitFor(() =>
      expect(screen.getByRole('treeitem', { name: '远程文件' })).toBeVisible(),
    )
    expect(load).toHaveBeenCalledOnce()
    expect(
      screen.getByRole('treeitem', { name: '固定叶子' }),
    ).not.toHaveAttribute('aria-expanded')
    expect(
      screen.getByRole('treeitem', { name: '已知空目录' }),
    ).not.toHaveAttribute('aria-expanded')
    expect(screen.getByRole('treeitem', { name: '已有文件' })).toBeVisible()
  })

  it('shows errors without an automatic retry loop and retries with the expand key', async () => {
    const error = new Error('读取失败')
    const load = vi
      .fn<TreeLoadChildren>()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(children)
    const onError = vi.fn()
    render(
      <Tree
        treeData={data}
        loadChildren={load}
        defaultExpandedKeys={['root']}
        onLoadError={onError}
      />,
    )
    await screen.findByRole('alert')
    expect(onError).toHaveBeenCalledExactlyOnceWith(error, data[0])
    expect(root()).toHaveAccessibleDescription('子节点加载失败，请重试。')
    expect(load).toHaveBeenCalledOnce()
    fireEvent.keyDown(root(), { key: 'ArrowRight' })
    await screen.findByRole('treeitem', { name: '远程文件' })
    expect(load).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('handles synchronous loader exceptions as a retryable error', async () => {
    const load = vi.fn<TreeLoadChildren>(() => {
      throw new Error('同步失败')
    })
    render(<Tree treeData={data} loadChildren={load} defaultExpandAll />)
    await screen.findByRole('button', { name: '重试加载远程目录' })
    expect(load).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: '重试加载远程目录' }))
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2))
    expect(await screen.findByRole('alert')).toBeVisible()
  })

  it('cancels on collapse, ignores an abort-unaware late response and allows a fresh request', async () => {
    const first = deferred()
    const second = deferred()
    const load = vi
      .fn<TreeLoadChildren>()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise)
    const onLoad = vi.fn()
    render(<Tree treeData={data} loadChildren={load} onLoad={onLoad} />)
    toggle()
    await waitFor(() => expect(load).toHaveBeenCalledOnce())
    const signal = load.mock.calls[0][1].signal
    toggle()
    expect(signal.aborted).toBe(true)
    toggle()
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2))
    await settle(first, [{ key: 'stale', title: '过期文件', isLeaf: true }])
    expect(
      screen.queryByRole('treeitem', { name: '过期文件' }),
    ).not.toBeInTheDocument()
    expect(root()).toHaveAttribute('aria-busy', 'true')
    expect(onLoad).not.toHaveBeenCalled()
    await settle(second)
    expect(onLoad).toHaveBeenCalledOnce()
  })

  it('cancels immediately even if a controlled parent refuses to collapse and can resume', async () => {
    const first = deferred()
    const second = deferred()
    const load = vi
      .fn<TreeLoadChildren>()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise)
    const onExpand = vi.fn()
    render(
      <Tree
        treeData={data}
        loadChildren={load}
        expandedKeys={['root']}
        onExpand={onExpand}
      />,
    )
    await screen.findByRole('button', { name: '取消加载远程目录' })
    await waitFor(() => expect(load).toHaveBeenCalledOnce())
    act(() => screen.getByRole('button', { name: '取消加载远程目录' }).focus())
    fireEvent.click(screen.getByRole('button', { name: '取消加载远程目录' }))
    expect(load.mock.calls[0][1].signal.aborted).toBe(true)
    expect(onExpand).toHaveBeenCalledExactlyOnceWith([])
    expect(root()).toHaveAttribute('aria-expanded', 'true')
    expect(root()).not.toHaveAttribute('aria-busy')
    expect(
      screen.getByRole('status', { name: '远程目录加载状态' }),
    ).toHaveTextContent('加载已取消')
    expect(load).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: '继续加载远程目录' }))
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2))
    await settle(second)
    await settle(first, [{ key: 'stale', title: '取消结果', isLeaf: true }])
    expect(
      screen.queryByRole('treeitem', { name: '取消结果' }),
    ).not.toBeInTheDocument()
  })

  it('aborts removal, disability, load version changes and unmounting', async () => {
    const load = vi.fn<TreeLoadChildren>(() => deferred().promise)
    const view = (next: TreeNode[], disabled = false, loadVersion = 0) => (
      <Tree
        treeData={next}
        disabled={disabled}
        loadVersion={loadVersion}
        loadChildren={load}
        expandedKeys={['root']}
      />
    )
    const { rerender, unmount } = render(view(data))
    await waitFor(() => expect(load).toHaveBeenCalledTimes(1))
    rerender(view([], false))
    expect(load.mock.calls[0][1].signal.aborted).toBe(true)
    rerender(view(data))
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2))
    rerender(view(data, true))
    expect(load.mock.calls[1][1].signal.aborted).toBe(true)
    rerender(view(data))
    await waitFor(() => expect(load).toHaveBeenCalledTimes(3))
    rerender(view(data, false, 1))
    expect(load.mock.calls[2][1].signal.aborted).toBe(true)
    await waitFor(() => expect(load).toHaveBeenCalledTimes(4))
    unmount()
    expect(load.mock.calls[3][1].signal.aborted).toBe(true)
  })

  it('refreshes cached children on version changes and gives explicit source children precedence', async () => {
    const next = [{ key: 'next', title: '新远程文件', isLeaf: true }]
    const load = vi
      .fn<TreeLoadChildren>()
      .mockResolvedValueOnce(children)
      .mockResolvedValueOnce(next)
    const view = (loadVersion: number, treeData = data) => (
      <Tree
        treeData={treeData}
        loadChildren={load}
        loadVersion={loadVersion}
        defaultExpandedKeys={['root']}
      />
    )
    const { rerender } = render(view(0))
    await screen.findByRole('treeitem', { name: '远程文件' })
    rerender(view(1))
    await screen.findByRole('treeitem', { name: '新远程文件' })
    expect(
      screen.queryByRole('treeitem', { name: '远程文件' }),
    ).not.toBeInTheDocument()
    rerender(
      view(1, [
        {
          ...data[0],
          children: [{ key: 'owned', title: '外部文件', isLeaf: true }],
        },
      ]),
    )
    expect(screen.getByRole('treeitem', { name: '外部文件' })).toBeVisible()
    expect(
      screen.queryByRole('treeitem', { name: '新远程文件' }),
    ).not.toBeInTheDocument()
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('uses the latest callback when a pending request completes', async () => {
    const pending = deferred()
    const load = vi.fn<TreeLoadChildren>(() => pending.promise)
    const previous = vi.fn()
    const next = vi.fn()
    const { rerender } = render(
      <Tree
        treeData={data}
        loadChildren={load}
        onLoad={previous}
        expandedKeys={['root']}
      />,
    )
    await waitFor(() => expect(load).toHaveBeenCalledOnce())
    rerender(
      <Tree
        treeData={data}
        loadChildren={load}
        onLoad={next}
        expandedKeys={['root']}
      />,
    )
    await settle(pending)
    expect(previous).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledOnce()
  })

  it('aborts a pending request when externally supplied children or an explicit leaf take over', async () => {
    const pending = deferred()
    const load = vi.fn<TreeLoadChildren>(() => pending.promise)
    const onLoad = vi.fn()
    const { rerender } = render(
      <Tree
        treeData={data}
        loadChildren={load}
        onLoad={onLoad}
        expandedKeys={['root']}
      />,
    )
    await waitFor(() => expect(load).toHaveBeenCalledOnce())
    rerender(
      <Tree
        treeData={[{ ...data[0], children }]}
        loadChildren={load}
        onLoad={onLoad}
        expandedKeys={['root']}
      />,
    )
    expect(load.mock.calls[0][1].signal.aborted).toBe(true)
    await settle(pending, [{ key: 'wrong', title: '错误覆盖', isLeaf: true }])
    expect(
      screen.queryByRole('treeitem', { name: '错误覆盖' }),
    ).not.toBeInTheDocument()
    expect(onLoad).not.toHaveBeenCalled()
    rerender(
      <Tree
        treeData={[{ ...data[0], isLeaf: true }]}
        loadChildren={load}
        expandedKeys={['root']}
      />,
    )
    expect(root()).not.toHaveAttribute('aria-expanded')
    expect(load).toHaveBeenCalledOnce()
  })

  it('treats an empty response as a known leaf and supports nested lazy directories', async () => {
    const load = vi
      .fn<TreeLoadChildren>()
      .mockResolvedValueOnce([
        { key: 'nested', title: '嵌套目录', isLeaf: false },
      ])
      .mockResolvedValueOnce([])
    render(
      <Tree
        treeData={data}
        loadChildren={load}
        defaultExpandedKeys={['root']}
      />,
    )
    const nested = await screen.findByRole('treeitem', { name: '嵌套目录' })
    fireEvent.keyDown(nested, { key: 'ArrowRight' })
    await waitFor(() => expect(nested).not.toHaveAttribute('aria-busy'))
    expect(nested).not.toHaveAttribute('aria-expanded')
    expect(load).toHaveBeenCalledTimes(2)
    expect(
      screen.queryByRole('button', { name: '取消加载嵌套目录' }),
    ).not.toBeInTheDocument()
  })

  it('rejects invalid or colliding child keys without corrupting the tree and permits retry', async () => {
    const load = vi
      .fn<TreeLoadChildren>()
      .mockResolvedValueOnce([{ key: 'root', title: '重复父级' }])
      .mockResolvedValueOnce(children)
    const onError = vi.fn()
    render(
      <Tree
        treeData={data}
        loadChildren={load}
        defaultExpandAll
        onLoadError={onError}
      />,
    )
    await screen.findByRole('alert')
    expect(
      screen.queryByRole('treeitem', { name: '重复父级' }),
    ).not.toBeInTheDocument()
    expect(onError).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: '重试加载远程目录' }))
    await screen.findByRole('treeitem', { name: '远程文件' })
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('survives StrictMode effect replay without duplicate service calls or aborted results', async () => {
    const load = vi.fn<TreeLoadChildren>(async () => children)
    render(
      <StrictMode>
        <Tree
          treeData={data}
          loadChildren={load}
          defaultExpandedKeys={['root']}
        />
      </StrictMode>,
    )
    await screen.findByRole('treeitem', { name: '远程文件' })
    expect(load).toHaveBeenCalledOnce()
    expect(load.mock.calls[0][1].signal.aborted).toBe(false)
  })

  it('cancels nested requests when their ancestor collapses and resumes on reopening', async () => {
    const stale = deferred()
    const fresh = deferred()
    const load = vi
      .fn<TreeLoadChildren>()
      .mockResolvedValueOnce([
        { key: 'nested', title: '嵌套目录', isLeaf: false },
      ])
      .mockImplementationOnce(() => stale.promise)
      .mockImplementationOnce(() => fresh.promise)
    render(
      <Tree
        treeData={data}
        loadChildren={load}
        defaultExpandedKeys={['root']}
      />,
    )
    const nested = await screen.findByRole('treeitem', { name: '嵌套目录' })
    fireEvent.keyDown(nested, { key: 'ArrowRight' })
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2))
    toggle()
    expect(load.mock.calls[1][1].signal.aborted).toBe(true)
    toggle()
    await waitFor(() => expect(load).toHaveBeenCalledTimes(3))
    await settle(stale, [{ key: 'stale', title: '过期嵌套文件', isLeaf: true }])
    expect(
      screen.queryByRole('treeitem', { name: '过期嵌套文件' }),
    ).not.toBeInTheDocument()
    await settle(fresh)
    expect(screen.getByRole('treeitem', { name: '远程文件' })).toBeVisible()
  })

  it('ignores a deleted directory response after the same key is reintroduced', async () => {
    const stale = deferred()
    const fresh = deferred()
    const load = vi
      .fn<TreeLoadChildren>()
      .mockImplementationOnce(() => stale.promise)
      .mockImplementationOnce(() => fresh.promise)
    const view = (treeData: TreeNode[]) => (
      <Tree treeData={treeData} loadChildren={load} expandedKeys={['root']} />
    )
    const { rerender } = render(view(data))
    await waitFor(() => expect(load).toHaveBeenCalledTimes(1))
    rerender(view([]))
    rerender(view(data))
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2))
    await settle(stale, [{ key: 'stale', title: '删除前的文件', isLeaf: true }])
    expect(root()).toHaveAttribute('aria-busy', 'true')
    expect(
      screen.queryByRole('treeitem', { name: '删除前的文件' }),
    ).not.toBeInTheDocument()
    await settle(fresh)
    expect(screen.getByRole('treeitem', { name: '远程文件' })).toBeVisible()
  })

  it('rejects colliding keys from concurrent directory responses', async () => {
    const first = deferred()
    const second = deferred()
    const load = vi.fn<TreeLoadChildren>((node) =>
      node.key === 'root' ? first.promise : second.promise,
    )
    const onError = vi.fn()
    render(
      <Tree
        treeData={[...data, { key: 'other', title: '其他目录', isLeaf: false }]}
        loadChildren={load}
        defaultExpandAll
        onLoadError={onError}
      />,
    )
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2))
    await settle(first)
    await settle(second)
    expect(screen.getAllByRole('treeitem', { name: '远程文件' })).toHaveLength(
      1,
    )
    expect(
      screen.getByRole('button', { name: '重试加载其他目录' }),
    ).toBeVisible()
    expect(onError).toHaveBeenCalledOnce()
  })

  it('keeps callback exceptions separate from the successful load state', async () => {
    const error = new Error('消费者回调失败')
    const onError = vi.fn()
    const { result } = renderHook(() =>
      useTreeLoader({
        treeData: data,
        loadChildren: async () => children,
        loadVersion: 0,
        disabled: false,
        onLoad: () => {
          throw error
        },
        onLoadError: onError,
      }),
    )
    await act(async () => {
      await expect(result.current.request('root')).rejects.toBe(error)
    })
    expect(result.current.statuses.get('root')).toBe('loaded')
    expect(result.current.treeData[0].children).toEqual(children)
    expect(onError).not.toHaveBeenCalled()
  })
})
