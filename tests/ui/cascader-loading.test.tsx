import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  Cascader,
  ConfigProvider,
  type CascaderLoadChildren,
  type CascaderOption,
} from '@/shared/ui'

function deferred() {
  let resolve!: (options: CascaderOption[]) => void
  const promise = new Promise<CascaderOption[]>((accept) => {
    resolve = accept
  })
  return { promise, resolve }
}
const options: CascaderOption[] = [
  { value: 'remote', label: '远程目录', isLeaf: false },
  { value: 'other', label: '其他目录', isLeaf: false },
  { value: 'local', label: '本地文件' },
  { value: 'disabled', label: '禁用目录', isLeaf: false, disabled: true },
]
const trigger = () => screen.getByRole('combobox')
const node = (name: string) =>
  screen.getByRole('treeitem', { name, exact: true })
const open = () => fireEvent.click(trigger())
const browse = (name = '远程目录') => fireEvent.click(node(name))

describe('Cascader asynchronous columns', () => {
  it('deduplicates loads, passes complete option paths and commits only a resolved leaf', async () => {
    const first = deferred(),
      second = deferred()
    const loadChildren = vi
      .fn<CascaderLoadChildren>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const onChange = vi.fn(),
      onLoad = vi.fn()
    render(
      <Cascader
        options={options}
        loadChildren={loadChildren}
        onChange={onChange}
        onLoad={onLoad}
      />,
    )
    open()
    fireEvent.keyDown(node('远程目录'), { key: 'ArrowRight' })
    await waitFor(() => expect(loadChildren).toHaveBeenCalledOnce())
    browse()
    expect(loadChildren.mock.calls[0][0].map((option) => option.value)).toEqual(
      ['remote'],
    )
    expect(loadChildren.mock.calls[0][1].signal.aborted).toBe(false)
    expect(node('远程目录')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('正在加载子选项')
    expect(onChange).not.toHaveBeenCalled()
    await act(async () =>
      first.resolve([{ value: 'folder', label: '嵌套目录', isLeaf: false }]),
    )
    expect(node('嵌套目录')).toHaveFocus()
    fireEvent.keyDown(node('嵌套目录'), { key: 'ArrowRight' })
    await waitFor(() => expect(loadChildren).toHaveBeenCalledTimes(2))
    expect(loadChildren.mock.calls[1][0].map((option) => option.value)).toEqual(
      ['remote', 'folder'],
    )
    await act(async () =>
      second.resolve([{ value: 'leaf', label: '嵌套文件' }]),
    )
    expect(node('嵌套文件')).toHaveFocus()
    fireEvent.keyDown(node('嵌套文件'), { key: 'Enter' })
    expect(onChange).toHaveBeenCalledExactlyOnceWith([
      'remote',
      'folder',
      'leaf',
    ])
    expect(trigger()).toHaveFocus()
    expect(onLoad).toHaveBeenCalledTimes(2)
    open()
    expect(node('嵌套文件')).toBeInTheDocument()
    expect(loadChildren).toHaveBeenCalledTimes(2)
  })

  it('reports a failed request and retries with a button', async () => {
    const loadChildren = vi
      .fn<CascaderLoadChildren>()
      .mockRejectedValueOnce(new Error('读取失败'))
      .mockResolvedValueOnce([{ value: 'file', label: '远程文件' }])
    const onLoadError = vi.fn()
    render(
      <Cascader
        options={options}
        loadChildren={loadChildren}
        onLoadError={onLoadError}
      />,
    )
    open()
    browse()
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('加载失败，请重试'),
    )
    expect(onLoadError).toHaveBeenCalledOnce()
    expect(
      onLoadError.mock.calls[0][1].map(
        (option: CascaderOption) => option.value,
      ),
    ).toEqual(['remote'])
    fireEvent.click(screen.getByRole('button', { name: '重试加载远程目录' }))
    await waitFor(() => expect(node('远程文件')).toBeInTheDocument())
    expect(loadChildren).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('cancels explicitly and ignores its late response while resuming with an expansion key', async () => {
    const first = deferred(),
      second = deferred()
    const loadChildren = vi
      .fn<CascaderLoadChildren>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const onLoad = vi.fn(),
      onLoadError = vi.fn()
    render(
      <Cascader
        options={options}
        loadChildren={loadChildren}
        onLoad={onLoad}
        onLoadError={onLoadError}
      />,
    )
    open()
    browse()
    await waitFor(() => expect(loadChildren).toHaveBeenCalledOnce())
    fireEvent.click(screen.getByRole('button', { name: '取消加载远程目录' }))
    expect(loadChildren.mock.calls[0][1].signal.aborted).toBe(true)
    expect(screen.getByRole('status')).toHaveTextContent('加载已取消')
    fireEvent.keyDown(node('远程目录'), { key: 'ArrowRight' })
    await waitFor(() => expect(loadChildren).toHaveBeenCalledTimes(2))
    await act(async () =>
      first.resolve([{ value: 'stale', label: '过期文件' }]),
    )
    expect(screen.queryByText('过期文件')).not.toBeInTheDocument()
    await act(async () =>
      second.resolve([{ value: 'file', label: '当前文件' }]),
    )
    expect(node('当前文件')).toBeInTheDocument()
    expect(onLoad).toHaveBeenCalledOnce()
    expect(onLoadError).not.toHaveBeenCalled()
  })

  it('cancels on sibling navigation, backward navigation, closing and unmounting', async () => {
    const requests = [deferred(), deferred(), deferred(), deferred()]
    const loadChildren = vi.fn<CascaderLoadChildren>()
    requests.forEach((request) =>
      loadChildren.mockReturnValueOnce(request.promise),
    )
    const { unmount } = render(
      <Cascader options={options} loadChildren={loadChildren} />,
    )
    open()
    browse()
    await waitFor(() => expect(loadChildren).toHaveBeenCalledTimes(1))
    browse('其他目录')
    await waitFor(() => expect(loadChildren).toHaveBeenCalledTimes(2))
    expect(loadChildren.mock.calls[0][1].signal.aborted).toBe(true)
    fireEvent.keyDown(node('其他目录'), { key: 'ArrowLeft' })
    expect(loadChildren.mock.calls[1][1].signal.aborted).toBe(true)
    browse()
    await waitFor(() => expect(loadChildren).toHaveBeenCalledTimes(3))
    fireEvent.keyDown(node('远程目录'), { key: 'Escape' })
    expect(loadChildren.mock.calls[2][1].signal.aborted).toBe(true)
    open()
    browse()
    await waitFor(() => expect(loadChildren).toHaveBeenCalledTimes(4))
    unmount()
    expect(loadChildren.mock.calls[3][1].signal.aborted).toBe(true)
  })

  it('cancels on disabling, removal, version changes and authoritative supplied children', async () => {
    for (const replacement of [
      'disabled',
      'removed',
      'version',
      'supplied',
    ] as const) {
      const pending = deferred(),
        refreshed = deferred()
      const loadChildren = vi
        .fn<CascaderLoadChildren>()
        .mockReturnValueOnce(pending.promise)
        .mockReturnValue(refreshed.promise)
      const onLoad = vi.fn()
      const { rerender, unmount } = render(
        <Cascader
          options={options}
          loadChildren={loadChildren}
          onLoad={onLoad}
        />,
      )
      open()
      browse()
      await waitFor(() => expect(loadChildren).toHaveBeenCalledOnce())
      rerender(
        <Cascader
          options={
            replacement === 'removed'
              ? []
              : replacement === 'supplied'
                ? [
                    {
                      value: 'remote',
                      label: '远程目录',
                      children: [{ value: 'external', label: '外部文件' }],
                    },
                  ]
                : options
          }
          loadChildren={loadChildren}
          onLoad={onLoad}
          disabled={replacement === 'disabled'}
          loadVersion={replacement === 'version' ? 1 : 0}
        />,
      )
      expect(loadChildren.mock.calls[0][1].signal.aborted).toBe(true)
      await act(async () =>
        pending.resolve([{ value: 'old', label: '旧文件' }]),
      )
      expect(onLoad).not.toHaveBeenCalled()
      expect(screen.queryByText('旧文件')).not.toBeInTheDocument()
      if (replacement === 'supplied')
        expect(node('外部文件')).toBeInTheDocument()
      unmount()
    }
  })

  it('searches only known leaf paths and aborts loading while a search is active', async () => {
    const pending = deferred()
    const loadChildren = vi
      .fn<CascaderLoadChildren>()
      .mockReturnValue(pending.promise)
    render(
      <Cascader options={options} loadChildren={loadChildren} showSearch />,
    )
    open()
    browse()
    await waitFor(() => expect(loadChildren).toHaveBeenCalledOnce())
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: '目录' },
    })
    expect(loadChildren.mock.calls[0][1].signal.aborted).toBe(true)
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: '本地' },
    })
    expect(screen.getByRole('option')).toHaveTextContent('本地文件')
    expect(loadChildren).toHaveBeenCalledOnce()
  })

  it('accepts duplicate values across branches and rejects duplicate sibling paths', async () => {
    const loadChildren = vi
      .fn<CascaderLoadChildren>()
      .mockResolvedValueOnce([{ value: 'shared', label: '远程共享' }])
      .mockResolvedValueOnce([{ value: 'shared', label: '其他共享' }])
      .mockResolvedValueOnce([
        { value: 'same', label: '重复一' },
        { value: 'same', label: '重复二' },
      ])
    const onLoadError = vi.fn()
    render(
      <Cascader
        options={[
          ...options,
          { value: 'invalid', label: '无效目录', isLeaf: false },
        ]}
        loadChildren={loadChildren}
        onLoadError={onLoadError}
      />,
    )
    open()
    browse()
    await waitFor(() => expect(node('远程共享')).toBeInTheDocument())
    browse('其他目录')
    await waitFor(() => expect(node('其他共享')).toBeInTheDocument())
    browse('无效目录')
    await waitFor(() => expect(onLoadError).toHaveBeenCalledOnce())
    expect(screen.getByRole('alert')).toHaveTextContent('加载失败')
    expect(screen.queryByText('重复一')).not.toBeInTheDocument()
  })

  it('resolves empty directories into terminal leaves without changing a controlled path', async () => {
    const loadChildren = vi
      .fn<CascaderLoadChildren>()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ value: 'file', label: '远程文件' }])
    const onChange = vi.fn()
    render(
      <Cascader
        options={options}
        loadChildren={loadChildren}
        value={['remote', 'file']}
        onChange={onChange}
      />,
    )
    expect(trigger()).toHaveTextContent('远程目录')
    open()
    await waitFor(() =>
      expect(node('远程目录')).not.toHaveAttribute('aria-expanded'),
    )
    expect(onChange).not.toHaveBeenCalled()
    browse('其他目录')
    await waitFor(() => expect(node('远程文件')).toBeInTheDocument())
    fireEvent.click(node('远程文件'))
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['other', 'file'])
  })

  it('lets loaded descendants participate in conducted checks without treating a pending directory as a leaf', async () => {
    const pending = deferred()
    const loadChildren = vi
      .fn<CascaderLoadChildren>()
      .mockReturnValue(pending.promise)
    const onChange = vi.fn()
    render(
      <Cascader
        multiple
        options={options}
        loadChildren={loadChildren}
        defaultValue={[['remote']]}
        onChange={onChange}
        showCheckedStrategy="leaf"
      />,
    )
    open()
    expect(node('远程目录')).toHaveAttribute('aria-description', '勾选已禁用')
    expect(node('远程目录')).toHaveAttribute('aria-checked', 'true')
    await act(async () =>
      pending.resolve([
        { value: 'one', label: '文件一' },
        { value: 'two', label: '文件二' },
      ]),
    )
    expect(node('文件一')).toHaveAttribute('aria-checked', 'true')
    expect(node('文件二')).toHaveAttribute('aria-checked', 'true')
    fireEvent.keyDown(node('文件一'), { key: ' ' })
    expect(onChange).toHaveBeenCalledExactlyOnceWith([['remote', 'two']])
    expect(node('远程目录')).toHaveAttribute('aria-checked', 'mixed')
  })

  it('loads native inline paths and keeps required validation incomplete until a terminal selection', async () => {
    const pending = deferred()
    const loadChildren = vi
      .fn<CascaderLoadChildren>()
      .mockReturnValue(pending.promise)
    render(
      <Cascader
        mode="inline"
        options={options}
        loadChildren={loadChildren}
        required
      />,
    )
    const select = trigger() as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'remote' } })
    await waitFor(() => expect(loadChildren).toHaveBeenCalledOnce())
    expect(select.checkValidity()).toBe(false)
    await act(async () =>
      pending.resolve([{ value: 'file', label: '远程文件' }]),
    )
    const child = screen.getByRole('combobox', {
      name: '级联选择第2级',
    }) as HTMLSelectElement
    expect(child.checkValidity()).toBe(false)
    fireEvent.change(child, { target: { value: 'file' } })
    expect(child.checkValidity()).toBe(true)
  })

  it('does not promote known checks into an unrequested lazy subtree', async () => {
    const pending = deferred()
    const loadChildren = vi
      .fn<CascaderLoadChildren>()
      .mockReturnValue(pending.promise)
    const onChange = vi.fn()
    render(
      <Cascader
        multiple
        options={[
          {
            value: 'root',
            label: '产品团队',
            children: [
              { value: 'known', label: '已知团队' },
              { value: 'pending', label: '未知目录', isLeaf: false },
            ],
          },
        ]}
        loadChildren={loadChildren}
        defaultValue={[['root', 'known']]}
        onChange={onChange}
      />,
    )
    open()
    expect(node('产品团队')).toHaveAttribute('aria-checked', 'mixed')
    expect(trigger()).toHaveTextContent('产品团队 / 已知团队')
    browse('未知目录')
    await waitFor(() => expect(loadChildren).toHaveBeenCalledOnce())
    await act(async () => pending.resolve([{ value: 'new', label: '新团队' }]))
    expect(node('新团队')).toHaveAttribute('aria-checked', 'false')
    expect(node('产品团队')).toHaveAttribute('aria-checked', 'mixed')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('uses RTL loading feedback keyboard navigation and cancels back to the owning parent', async () => {
    const pending = deferred()
    const loadChildren = vi
      .fn<CascaderLoadChildren>()
      .mockReturnValue(pending.promise)
    render(
      <ConfigProvider direction="rtl">
        <Cascader options={options} loadChildren={loadChildren} showSearch />
      </ConfigProvider>,
    )
    open()
    fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Tab' })
    fireEvent.keyDown(node('远程目录'), { key: 'ArrowLeft' })
    await waitFor(() => expect(loadChildren).toHaveBeenCalledOnce())
    fireEvent.keyDown(node('远程目录'), { key: 'Tab' })
    const action = screen.getByRole('button', { name: '取消加载远程目录' })
    expect(action).toHaveFocus()
    fireEvent.keyDown(action, { key: 'Tab', shiftKey: true })
    expect(node('远程目录')).toHaveFocus()
    act(() => action.focus())
    fireEvent.keyDown(action, { key: 'ArrowRight' })
    expect(node('远程目录')).toHaveFocus()
    expect(loadChildren.mock.calls[0][1].signal.aborted).toBe(true)
  })

  it('preserves loading action focus through parent updates, cancellation and retry failure', async () => {
    const first = deferred(),
      last = deferred()
    const loadChildren = vi
      .fn<CascaderLoadChildren>()
      .mockReturnValueOnce(first.promise)
      .mockRejectedValueOnce(new Error('读取失败'))
      .mockReturnValueOnce(last.promise)
    const { rerender } = render(
      <Cascader options={options} loadChildren={loadChildren} />,
    )
    open()
    fireEvent.keyDown(node('远程目录'), { key: 'ArrowRight' })
    await waitFor(() => expect(loadChildren).toHaveBeenCalledOnce())
    fireEvent.keyDown(node('远程目录'), { key: 'Tab' })
    const action = screen.getByRole('button', { name: '取消加载远程目录' })
    expect(action).toHaveFocus()
    rerender(
      <Cascader
        options={options}
        loadChildren={loadChildren}
        status="warning"
      />,
    )
    expect(action).toHaveFocus()
    fireEvent.click(action)
    expect(action).toHaveAccessibleName('继续加载远程目录')
    expect(action).toHaveFocus()
    fireEvent.click(action)
    await waitFor(() => expect(action).toHaveAccessibleName('重试加载远程目录'))
    expect(action).toHaveFocus()
    fireEvent.click(action)
    await waitFor(() => expect(loadChildren).toHaveBeenCalledTimes(3))
    expect(action).toHaveFocus()
    await act(async () => last.resolve([{ value: 'file', label: '新文件' }]))
    expect(node('新文件')).toHaveFocus()
  })

  it('disables embedded loading actions and cancels their requests when the field is disabled', async () => {
    for (const mode of ['inline', 'panel'] as const) {
      const pending = deferred()
      const loadChildren = vi
        .fn<CascaderLoadChildren>()
        .mockReturnValue(pending.promise)
      const props = {
        options,
        loadChildren,
        mode,
        defaultValue: ['remote'],
      }
      const { rerender, unmount } = render(<Cascader {...props} />)
      await waitFor(() => expect(loadChildren).toHaveBeenCalledOnce())
      rerender(<Cascader {...props} disabled />)
      expect(loadChildren.mock.calls[0][1].signal.aborted).toBe(true)
      expect(
        screen.getByRole('button', { name: '继续加载远程目录' }),
      ).toBeDisabled()
      unmount()
    }
  })
})
