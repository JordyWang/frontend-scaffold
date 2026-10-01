import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TreeSelect, type TreeSelectOption } from '@/shared/ui'

const data: TreeSelectOption[] = [
  { value: 'remote', label: '远程团队', isLeaf: false },
  { value: 'fixed', label: '本地团队', isLeaf: true },
]
const children: TreeSelectOption[] = [
  { value: 'remote-file', label: '异步设计组', isLeaf: true },
  { value: 'remote-folder', label: '远程子团队', isLeaf: false },
]
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((ok, fail) => {
    resolve = ok
    reject = fail
  })
  return { promise, resolve, reject }
}
function openAndExpand() {
  fireEvent.click(screen.getByRole('combobox'))
  fireEvent.keyDown(
    screen.getByRole('treeitem', { name: '远程团队', exact: true }),
    { key: 'ArrowRight' },
  )
}

describe('TreeSelect lazy options', () => {
  it('resolves default labels, selects loaded values and keeps the cache across popup mounts', async () => {
    const pending = deferred<TreeSelectOption[]>()
    const loadChildren = vi
      .fn()
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce([
        { value: 'nested', label: '嵌套团队', isLeaf: true },
      ])
    const onLoad = vi.fn()
    const onChange = vi.fn()
    render(
      <TreeSelect
        treeData={data}
        defaultValue="remote-file"
        loadChildren={loadChildren}
        onLoad={onLoad}
        onChange={onChange}
      />,
    )
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveTextContent('remote-file')
    openAndExpand()
    await waitFor(() => expect(loadChildren).toHaveBeenCalledOnce())
    expect(loadChildren.mock.calls[0][0]).toMatchObject({
      value: 'remote',
      label: '远程团队',
    })
    await act(async () => pending.resolve(children))
    expect(onLoad).toHaveBeenCalledOnce()
    expect(onLoad.mock.calls[0][1]).toMatchObject(children)
    expect(trigger).toHaveTextContent('异步设计组')
    fireEvent.keyDown(screen.getByRole('treeitem', { name: '异步设计组' }), {
      key: 'Enter',
    })
    expect(onChange).toHaveBeenCalledWith('remote-file')
    expect(trigger).toHaveFocus()
    fireEvent.click(trigger)
    expect(
      screen.getByRole('treeitem', { name: '异步设计组' }),
    ).toBeInTheDocument()
    expect(loadChildren).toHaveBeenCalledOnce()
    fireEvent.keyDown(screen.getByRole('treeitem', { name: '远程子团队' }), {
      key: 'ArrowRight',
    })
    expect(
      await screen.findByRole('treeitem', { name: '嵌套团队' }),
    ).toBeInTheDocument()
    expect(loadChildren).toHaveBeenCalledTimes(2)
  })

  it('conducts loaded descendants through the full tree and keeps them checked under search', async () => {
    const loadChildren = vi
      .fn()
      .mockResolvedValue(children.map((node) => ({ ...node, isLeaf: true })))
    const onChange = vi.fn()
    render(
      <TreeSelect
        treeData={data}
        checkable
        checkedStrategy="parent"
        defaultValue={['remote']}
        maxCount={2}
        loadChildren={loadChildren}
        showSearch
        onChange={onChange}
      />,
    )
    openAndExpand()
    const child = await screen.findByRole('treeitem', { name: '异步设计组' })
    expect(child).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('combobox')).toHaveTextContent('2/2')
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: '设计' },
    })
    expect(
      screen.queryByRole('treeitem', { name: '远程子团队' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('treeitem', { name: '远程团队' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    fireEvent.keyDown(child, { key: ' ' })
    expect(onChange).toHaveBeenCalledWith(['remote-folder'])
  })

  it('aborts when closing, ignores late results and starts a fresh request on reopening', async () => {
    const first = deferred<TreeSelectOption[]>()
    const second = deferred<TreeSelectOption[]>()
    const loadChildren = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const onLoad = vi.fn()
    render(
      <TreeSelect
        treeData={data}
        loadChildren={loadChildren}
        onLoad={onLoad}
      />,
    )
    openAndExpand()
    await waitFor(() => expect(loadChildren).toHaveBeenCalledOnce())
    const signal = loadChildren.mock.calls[0][1].signal as AbortSignal
    fireEvent.keyDown(screen.getByRole('treeitem', { name: '远程团队' }), {
      key: 'Escape',
    })
    expect(signal.aborted).toBe(true)
    await act(async () =>
      first.resolve([{ value: 'stale', label: '过期结果' }]),
    )
    expect(onLoad).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('combobox'))
    await waitFor(() => expect(loadChildren).toHaveBeenCalledTimes(2))
    await act(async () => second.resolve(children))
    expect(
      screen.queryByRole('treeitem', { name: '过期结果' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('treeitem', { name: '异步设计组' }),
    ).toBeInTheDocument()
  })

  it('reports failures, retries from the shared controls and rejects duplicate values', async () => {
    const loadChildren = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([{ value: 'fixed', label: '重复值' }])
      .mockResolvedValueOnce(children)
    const onLoadError = vi.fn()
    render(
      <TreeSelect
        treeData={data}
        loadChildren={loadChildren}
        onLoadError={onLoadError}
      />,
    )
    openAndExpand()
    expect(await screen.findByRole('alert')).toHaveTextContent('子节点加载失败')
    expect(onLoadError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ value: 'remote' }),
    )
    fireEvent.click(screen.getByRole('button', { name: '重试加载远程团队' }))
    await waitFor(() => expect(onLoadError).toHaveBeenCalledTimes(2))
    expect(
      screen.queryByRole('treeitem', { name: '重复值' }),
    ).not.toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('treeitem', { name: '远程团队' }), {
      key: 'ArrowRight',
    })
    expect(
      await screen.findByRole('treeitem', { name: '异步设计组' }),
    ).toBeInTheDocument()
  })

  it('does not load from search expansion and cancels an active request when filtering', async () => {
    const pending = deferred<TreeSelectOption[]>()
    const loadChildren = vi.fn().mockReturnValue(pending.promise)
    render(
      <TreeSelect
        treeData={data}
        showSearch
        loadChildren={loadChildren}
        defaultSearchValue="远程"
      />,
    )
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.keyDown(screen.getByRole('treeitem', { name: '远程团队' }), {
      key: 'ArrowRight',
    })
    await act(async () => {})
    expect(loadChildren).not.toHaveBeenCalled()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } })
    fireEvent.keyDown(screen.getByRole('treeitem', { name: '远程团队' }), {
      key: 'ArrowRight',
    })
    await waitFor(() => expect(loadChildren).toHaveBeenCalledOnce())
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: '远程' },
    })
    expect(loadChildren.mock.calls[0][1].signal.aborted).toBe(true)
  })

  it('refreshes cache without losing unresolved selected labels and respects external children', async () => {
    const loadChildren = vi.fn().mockResolvedValue(children)
    const { rerender } = render(
      <TreeSelect
        treeData={data}
        loadChildren={loadChildren}
        defaultValue="remote-file"
      />,
    )
    openAndExpand()
    await screen.findByRole('treeitem', { name: '异步设计组' })
    fireEvent.keyDown(screen.getByRole('treeitem', { name: '远程团队' }), {
      key: 'Escape',
    })
    rerender(
      <TreeSelect
        treeData={data}
        loadChildren={loadChildren}
        loadVersion={1}
      />,
    )
    expect(screen.getByRole('combobox')).toHaveTextContent('remote-file')
    fireEvent.click(screen.getByRole('combobox'))
    await screen.findByRole('treeitem', { name: '异步设计组' })
    expect(loadChildren).toHaveBeenCalledTimes(2)
    rerender(
      <TreeSelect
        treeData={[
          {
            ...data[0],
            children: [{ value: 'external', label: '外部团队', isLeaf: true }],
          },
          data[1],
        ]}
        loadChildren={loadChildren}
        loadVersion={1}
      />,
    )
    expect(
      screen.queryByRole('treeitem', { name: '异步设计组' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('treeitem', { name: '外部团队' }),
    ).toBeInTheDocument()
  })

  it('aborts on disabled, source removal and unmount', async () => {
    const pending = deferred<TreeSelectOption[]>()
    const loadChildren = vi.fn().mockReturnValue(pending.promise)
    const { rerender, unmount } = render(
      <TreeSelect treeData={data} loadChildren={loadChildren} />,
    )
    openAndExpand()
    await waitFor(() => expect(loadChildren).toHaveBeenCalledOnce())
    rerender(
      <TreeSelect treeData={data} loadChildren={loadChildren} disabled />,
    )
    expect(loadChildren.mock.calls[0][1].signal.aborted).toBe(true)
    rerender(<TreeSelect treeData={data} loadChildren={loadChildren} />)
    fireEvent.click(screen.getByRole('combobox'))
    await waitFor(() => expect(loadChildren).toHaveBeenCalledTimes(2))
    rerender(
      <TreeSelect treeData={data.slice(1)} loadChildren={loadChildren} />,
    )
    expect(loadChildren.mock.calls[1][1].signal.aborted).toBe(true)
    rerender(<TreeSelect treeData={data} loadChildren={loadChildren} />)
    fireEvent.keyDown(screen.getByRole('treeitem', { name: '远程团队' }), {
      key: 'ArrowRight',
    })
    await waitFor(() => expect(loadChildren).toHaveBeenCalledTimes(3))
    unmount()
    expect(loadChildren.mock.calls[2][1].signal.aborted).toBe(true)
  })

  it('prunes a known deleted selection while preserving unknown initial values until they resolve', async () => {
    const loadChildren = vi.fn().mockResolvedValue(children)
    const { rerender } = render(
      <TreeSelect
        treeData={data}
        defaultValue="remote-file"
        loadChildren={loadChildren}
      />,
    )
    openAndExpand()
    await screen.findByRole('treeitem', { name: '异步设计组' })
    expect(screen.getByRole('combobox')).toHaveTextContent('异步设计组')
    rerender(
      <TreeSelect
        treeData={[{ ...data[0], isLeaf: true, children: [] }, data[1]]}
        loadChildren={loadChildren}
      />,
    )
    expect(screen.getByRole('combobox')).toHaveTextContent('请选择')
    rerender(<TreeSelect treeData={data} loadChildren={loadChildren} />)
    expect(screen.getByRole('combobox')).toHaveTextContent('请选择')
  })

  it('drops a cached branch selection when its source root is deleted and does not resurrect it', async () => {
    const loadChildren = vi.fn().mockResolvedValue(children)
    const { rerender } = render(
      <TreeSelect
        treeData={data}
        defaultValue="remote-file"
        loadChildren={loadChildren}
      />,
    )
    openAndExpand()
    await screen.findByRole('treeitem', { name: '异步设计组' })
    rerender(
      <TreeSelect treeData={data.slice(1)} loadChildren={loadChildren} />,
    )
    expect(screen.getByRole('combobox')).toHaveTextContent('请选择')
    rerender(<TreeSelect treeData={data} loadChildren={loadChildren} />)
    expect(screen.getByRole('combobox')).toHaveTextContent('请选择')
  })

  it('recognizes an empty response as a leaf and avoids loading known leaves', async () => {
    const loadChildren = vi.fn().mockResolvedValue([])
    render(<TreeSelect treeData={data} loadChildren={loadChildren} />)
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.keyDown(screen.getByRole('treeitem', { name: '本地团队' }), {
      key: 'ArrowRight',
    })
    expect(loadChildren).not.toHaveBeenCalled()
    fireEvent.keyDown(screen.getByRole('treeitem', { name: '远程团队' }), {
      key: 'ArrowRight',
    })
    await waitFor(() =>
      expect(
        screen.getByRole('treeitem', { name: '远程团队' }),
      ).not.toHaveAttribute('aria-expanded'),
    )
    expect(loadChildren).toHaveBeenCalledOnce()
    fireEvent.keyDown(screen.getByRole('treeitem', { name: '远程团队' }), {
      key: 'Escape',
    })
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.keyDown(screen.getByRole('treeitem', { name: '远程团队' }), {
      key: 'ArrowRight',
    })
    expect(loadChildren).toHaveBeenCalledOnce()
  })
})
