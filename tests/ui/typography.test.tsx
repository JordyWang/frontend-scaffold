import { createRef, useEffect, useState } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Typography } from '@/shared/ui'
import { writeTypographyClipboard } from '@/shared/ui/typography-clipboard'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
function clipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { clipboard: { writeText } })
  return writeText
}
function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (error: unknown) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
function editInput() {
  return screen.getByRole('textbox', { name: '编辑文本内容', exact: true })
}
function openEdit() {
  fireEvent.click(screen.getByRole('button', { name: '编辑文本', exact: true }))
}
function overflowGeometry() {
  let height = 120
  let resize = () => {}
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 240,
    height: 48,
    left: 0,
    right: 240,
    top: 0,
    bottom: 48,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  })
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(
    () => height,
  )
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(48)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        resize = callback
      }
      observe() {}
      disconnect() {}
    },
  )
  return (next: number) => {
    height = next
    act(() => resize())
  }
}

describe('Typography project semantics and presentation', () => {
  it('preserves the element API, forwards the native ref and combines semantic text formats', () => {
    const ref = createRef<HTMLElement>()
    render(
      <Typography
        as="h5"
        variant="title"
        tone="warning"
        strong
        italic
        mark
        code
        keyboard
        underline
        strike
        ref={ref}
        classNames={{ root: 'custom-root' }}
      >
        说明
      </Typography>,
    )
    const heading = screen.getByRole('heading', { level: 5 })
    expect(ref.current).toBe(heading)
    expect(heading).toHaveClass(
      'custom-root',
      '[text-decoration-line:underline_line-through]',
      'text-[var(--ui-color-warning)]',
    )
    expect(heading.querySelector('kbd code mark em strong')).toHaveTextContent(
      '说明',
    )
    expect(screen.queryByRole('button')).toBeNull()
  })
  it('disables all actions without hiding the text', () => {
    clipboard()
    render(
      <Typography copyable editable disabled>
        不可修改
      </Typography>,
    )
    expect(screen.getByText('不可修改')).toBeVisible()
    expect(screen.getByRole('button', { name: '编辑文本' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '复制文本' })).toBeDisabled()
    openEdit()
    expect(screen.queryByRole('textbox')).toBeNull()
  })
})

describe('Typography asynchronous clipboard', () => {
  it('copies full rich text and suffix, reports success and keeps the action focused', async () => {
    const write = clipboard(),
      copied = vi.fn()
    render(
      <Typography copyable={{ onCopy: copied }} ellipsis={{ suffix: '.mp4' }}>
        视频 <strong>预览</strong>
      </Typography>,
    )
    const button = screen.getByRole('button', { name: '复制文本' })
    fireEvent.click(button)
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('复制成功'),
    )
    expect(write).toHaveBeenCalledExactlyOnceWith('视频 预览.mp4')
    expect(copied).toHaveBeenCalledExactlyOnceWith('视频 预览.mp4')
    expect(button).toHaveFocus()
  })
  it('resolves custom asynchronous content once, prevents duplicate requests and retries a failure', async () => {
    const write = clipboard(),
      task = deferred<string>(),
      text = vi.fn(() => task.promise),
      failed = vi.fn()
    render(
      <Typography copyable={{ text, onError: failed }}>显示内容</Typography>,
    )
    const button = screen.getByRole('button', { name: '复制文本' })
    fireEvent.click(button)
    fireEvent.click(button)
    expect(text).toHaveBeenCalledTimes(1)
    expect(button).toHaveAttribute('aria-busy', 'true')
    await act(async () => task.reject(new Error('请求失败')))
    expect(screen.getByRole('alert')).toHaveTextContent('复制失败，请重试')
    expect(failed).toHaveBeenCalledTimes(1)
    text.mockImplementation(() => Promise.resolve('新内容'))
    fireEvent.click(button)
    await waitFor(() => expect(write).toHaveBeenCalledExactlyOnceWith('新内容'))
    expect(screen.getByRole('status')).toHaveTextContent('复制成功')
  })
  it('shows browser write failures and lets the same button retry', async () => {
    const write = clipboard()
    write.mockRejectedValueOnce(new Error('拒绝访问'))
    render(<Typography copyable>原文</Typography>)
    const button = screen.getByRole('button', { name: '复制文本' })
    fireEvent.click(button)
    await waitFor(() => expect(screen.getByRole('alert')).toBeVisible())
    fireEvent.click(button)
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('复制成功'),
    )
    expect(write).toHaveBeenCalledTimes(2)
  })
  it.each(['change', 'disable', 'remove', 'unmount'])(
    'ignores stale copy requests after %s',
    async (action) => {
      const write = clipboard(),
        task = deferred<string>(),
        copied = vi.fn()
      const options = { text: () => task.promise, onCopy: copied }
      const { rerender, unmount } = render(
        <Typography copyable={options}>旧内容</Typography>,
      )
      fireEvent.click(screen.getByRole('button', { name: '复制文本' }))
      if (action === 'unmount') unmount()
      else
        rerender(
          <Typography
            copyable={action === 'remove' ? false : options}
            disabled={action === 'disable'}
          >
            {action === 'change' ? '新内容' : '旧内容'}
          </Typography>,
        )
      await act(async () => task.resolve('迟到结果'))
      expect(write).not.toHaveBeenCalled()
      expect(copied).not.toHaveBeenCalled()
      expect(screen.queryByRole('status')).toBeNull()
    },
  )
  it('ignores a late clipboard result after content changes', async () => {
    const task = deferred<void>(),
      copied = vi.fn()
    vi.stubGlobal('navigator', { clipboard: { writeText: () => task.promise } })
    const { rerender } = render(
      <Typography copyable={{ onCopy: copied }}>旧</Typography>,
    )
    fireEvent.click(screen.getByRole('button', { name: '复制文本' }))
    rerender(<Typography copyable={{ onCopy: copied }}>新</Typography>)
    await act(async () => task.resolve())
    expect(copied).not.toHaveBeenCalled()
    expect(screen.queryByRole('status')).toBeNull()
  })
  it('supports HTML ClipboardItem and reports unsupported formats honestly', async () => {
    const write = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { write } })
    vi.stubGlobal(
      'ClipboardItem',
      class {
        constructor(public data: Record<string, Blob>) {}
      },
    )
    render(
      <Typography
        copyable={{ text: '<strong>蓝色</strong>', format: 'text/html' }}
      >
        显示
      </Typography>,
    )
    fireEvent.click(screen.getByRole('button', { name: '复制文本' }))
    await waitFor(() => expect(write).toHaveBeenCalledTimes(1))
    expect(write.mock.calls[0][0][0].data['text/html'].type).toBe('text/html')
    vi.stubGlobal('ClipboardItem', undefined)
    await expect(writeTypographyClipboard('文字', 'text/html')).rejects.toThrow(
      '不支持复制 HTML',
    )
  })
  it('legacy plain copying restores focused input and the original document selection', async () => {
    vi.stubGlobal('navigator', {})
    const command = vi.fn(() => true)
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: command,
    })
    const { container } = render(
      <>
        <input aria-label="原输入" defaultValue="输入" />
        <span>原选区</span>
      </>,
    )
    const input = screen.getByRole('textbox')
    act(() => input.focus())
    const range = document.createRange()
    range.selectNodeContents(container.querySelector('span')!)
    document.getSelection()!.removeAllRanges()
    document.getSelection()!.addRange(range)
    await writeTypographyClipboard('完整内容', 'text/plain')
    expect(command).toHaveBeenCalledExactlyOnceWith('copy')
    expect(input).toHaveFocus()
    expect(document.getSelection()!.toString()).toBe('原选区')
    expect(container.querySelector('textarea')).toBeNull()
    delete (document as Document & { execCommand?: unknown }).execCommand
  })
})

describe('Typography edit sessions and focus', () => {
  it('edits locally, preserves whitespace and focuses the trigger after Enter exactly once', () => {
    const change = vi.fn(),
      end = vi.fn(),
      start = vi.fn()
    render(
      <Typography editable={{ onChange: change, onEnd: end, onStart: start }}>
        原文
      </Typography>,
    )
    openEdit()
    expect(editInput()).toHaveFocus()
    expect(editInput()).toHaveValue('原文')
    expect((editInput() as HTMLTextAreaElement).selectionStart).toBe(2)
    fireEvent.change(editInput(), { target: { value: ' 新文\n第二行 ' } })
    fireEvent.keyDown(editInput(), { key: 'Enter' })
    expect(change).toHaveBeenCalledExactlyOnceWith(' 新文\n第二行 ')
    expect(end).toHaveBeenCalledExactlyOnceWith(' 新文\n第二行 ', 'submit')
    expect(start).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: '编辑文本' })).toHaveFocus()
    expect(screen.getByText('新文 第二行')).toBeVisible()
  })
  it('Escape and cancel buttons discard drafts and restore focus without publishing values', () => {
    const change = vi.fn(),
      cancel = vi.fn()
    render(
      <Typography editable={{ onChange: change, onCancel: cancel }}>
        原文
      </Typography>,
    )
    openEdit()
    fireEvent.change(editInput(), { target: { value: '草稿' } })
    fireEvent.keyDown(editInput(), { key: 'Escape' })
    expect(screen.getByText('原文')).toBeVisible()
    openEdit()
    fireEvent.click(screen.getByRole('button', { name: '取消编辑文本' }))
    expect(change).not.toHaveBeenCalled()
    expect(cancel).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('button', { name: '编辑文本' })).toHaveFocus()
  })
  it('keeps Shift+Enter, IME and repeated keys inside the editing session', () => {
    const change = vi.fn()
    render(<Typography editable={{ onChange: change }}>原文</Typography>)
    openEdit()
    for (const extra of [
      { shiftKey: true },
      { isComposing: true },
      { keyCode: 229 },
      { repeat: true },
    ])
      fireEvent.keyDown(editInput(), { key: 'Enter', ...extra })
    expect(editInput()).toHaveFocus()
    expect(change).not.toHaveBeenCalled()
    fireEvent.keyDown(editInput(), { key: 'Enter' })
    expect(change).toHaveBeenCalledTimes(1)
  })
  it('saves on outside blur and preserves outside focus', async () => {
    const change = vi.fn()
    render(
      <>
        <Typography editable={{ onChange: change }}>原文</Typography>
        <button>外部</button>
      </>,
    )
    openEdit()
    fireEvent.change(editInput(), { target: { value: '保存' } })
    act(() => screen.getByRole('button', { name: '外部' }).focus())
    await waitFor(() => expect(change).toHaveBeenCalledExactlyOnceWith('保存'))
    expect(screen.getByRole('button', { name: '外部' })).toHaveFocus()
  })
  it('does not submit when moving to internal save/cancel controls or when submitOnBlur is false', async () => {
    const change = vi.fn()
    render(
      <>
        <Typography editable={{ onChange: change, submitOnBlur: false }}>
          原文
        </Typography>
        <button>外部</button>
      </>,
    )
    openEdit()
    act(() => screen.getByRole('button', { name: '保存文本' }).focus())
    await act(
      async () => new Promise((resolve) => requestAnimationFrame(resolve)),
    )
    expect(change).not.toHaveBeenCalled()
    act(() => screen.getByRole('button', { name: '外部' }).focus())
    await act(
      async () => new Promise((resolve) => requestAnimationFrame(resolve)),
    )
    expect(editInput()).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '保存文本' }))
    expect(change).toHaveBeenCalledTimes(1)
  })
  it('keeps controlled text unchanged until accepted and rebases stale drafts on external updates', () => {
    const change = vi.fn()
    const { rerender } = render(
      <Typography editable={{ value: '受控', onChange: change }}>
        ignored
      </Typography>,
    )
    openEdit()
    fireEvent.change(editInput(), { target: { value: '未接受' } })
    fireEvent.keyDown(editInput(), { key: 'Enter' })
    expect(change).toHaveBeenCalledExactlyOnceWith('未接受')
    expect(screen.getByText('受控')).toBeVisible()
    openEdit()
    fireEvent.change(editInput(), { target: { value: '旧草稿' } })
    rerender(
      <Typography editable={{ value: '外部更新', onChange: change }}>
        ignored
      </Typography>,
    )
    expect(editInput()).toHaveValue('外部更新')
    fireEvent.keyDown(editInput(), { key: 'Enter' })
    expect(change).toHaveBeenLastCalledWith('外部更新')
  })
  it('controls editing independently and submits a value only once while closure is pending', () => {
    const change = vi.fn(),
      editingChange = vi.fn()
    const { rerender } = render(
      <Typography
        editable={{
          editing: false,
          onEditingChange: editingChange,
          onChange: change,
        }}
      >
        原文
      </Typography>,
    )
    openEdit()
    expect(editingChange).toHaveBeenCalledExactlyOnceWith(true)
    expect(screen.queryByRole('textbox')).toBeNull()
    rerender(
      <Typography
        editable={{
          editing: true,
          onEditingChange: editingChange,
          onChange: change,
        }}
      >
        原文
      </Typography>,
    )
    fireEvent.change(editInput(), { target: { value: '更新' } })
    fireEvent.keyDown(editInput(), { key: 'Enter' })
    fireEvent.keyDown(editInput(), { key: 'Enter' })
    expect(change).toHaveBeenCalledExactlyOnceWith('更新')
    expect(editingChange).toHaveBeenLastCalledWith(false)
  })
  it('starts default editing with rich text and exposes a single text trigger without swallowing links', () => {
    const { rerender } = render(
      <Typography editable={{ defaultEditing: true }}>
        富<strong>文本</strong>
      </Typography>,
    )
    expect(editInput()).toHaveValue('富文本')
    expect(editInput()).toHaveFocus()
    fireEvent.keyDown(editInput(), { key: 'Escape' })
    rerender(
      <Typography editable={{ trigger: 'text' }}>
        文字 <a href="#target">链接</a>
      </Typography>,
    )
    fireEvent.click(screen.getByRole('link'))
    expect(screen.queryByRole('textbox')).toBeNull()
    fireEvent.click(screen.getByText('文字', { exact: false }))
    expect(editInput()).toBeVisible()
    fireEvent.keyDown(editInput(), { key: 'Escape' })
    expect(screen.getByRole('button', { name: '编辑文本' })).toHaveFocus()
  })
  it.each(['disabled', 'removed'])(
    'terminates editing after %s and restores an owned focus',
    (action) => {
      const change = vi.fn(),
        ref = createRef<HTMLElement>()
      const { rerender } = render(
        <Typography editable={{ onChange: change }} ref={ref}>
          原文
        </Typography>,
      )
      openEdit()
      fireEvent.change(editInput(), { target: { value: '草稿' } })
      rerender(
        <Typography
          editable={action === 'removed' ? false : { onChange: change }}
          disabled={action === 'disabled'}
          ref={ref}
        >
          原文
        </Typography>,
      )
      expect(screen.queryByRole('textbox')).toBeNull()
      expect(change).not.toHaveBeenCalled()
      expect(ref.current).toHaveFocus()
    },
  )
  it('updates external children after a local edit instead of keeping the previous saved text', () => {
    const { rerender } = render(<Typography editable>原文</Typography>)
    openEdit()
    fireEvent.change(editInput(), { target: { value: '保存' } })
    fireEvent.keyDown(editInput(), { key: 'Enter' })
    rerender(<Typography editable>外部内容</Typography>)
    expect(screen.getByText('外部内容')).toBeVisible()
    rerender(<Typography editable>原文</Typography>)
    expect(screen.getByText('原文')).toBeVisible()
    expect(screen.queryByText('保存')).toBeNull()
  })
})

describe('Typography container ellipsis', () => {
  it('rechecks a rich child text mutation even when the clamped box has not resized', async () => {
    overflowGeometry()
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(
      function (this: HTMLElement) {
        return this.textContent === '短' ? 40 : 120
      },
    )
    const changed = vi.fn()
    function Content() {
      const [short, setShort] = useState(false)
      return (
        <button onClick={() => setShort(true)}>
          {short ? '短' : '长文字内容'}
        </button>
      )
    }
    render(
      <Typography
        ellipsis={{ rows: 2, expandable: 'collapsible', onEllipsis: changed }}
      >
        <Content />
      </Typography>,
    )
    expect(screen.getByRole('button', { name: '展开文本' })).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '长文字内容' }))
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: '展开文本' })).toBeNull(),
    )
    expect(changed.mock.calls).toEqual([[true], [false]])
  })
  it('reveals a focused rich link even before controlled expansion is accepted, then restores the requested state', () => {
    overflowGeometry()
    const expand = vi.fn()
    render(
      <>
        <Typography
          ellipsis={{
            expanded: false,
            expandable: 'collapsible',
            onExpandedChange: expand,
          }}
        >
          长内容 <a href="#details">阅读链接</a>
        </Typography>
        <button>外部</button>
      </>,
    )
    act(() => screen.getByRole('link').focus())
    expect(expand).toHaveBeenCalledExactlyOnceWith(true)
    expect(document.querySelector('[data-typography-layout]')).not.toHaveClass(
      'line-clamp-(--typography-rows)',
    )
    act(() => screen.getByRole('button', { name: '外部' }).focus())
    expect(document.querySelector('[data-typography-layout]')).toHaveClass(
      'line-clamp-(--typography-rows)',
    )
    expect(screen.getByRole('button', { name: '展开文本' })).toBeVisible()
  })
  it('measures actual overflow, supports collapsible state and reacts to container growth', () => {
    const resize = overflowGeometry(),
      ellipsis = vi.fn()
    render(
      <Typography
        ellipsis={{ rows: 2, expandable: 'collapsible', onEllipsis: ellipsis }}
      >
        完整长文本
      </Typography>,
    )
    const expand = screen.getByRole('button', { name: '展开文本' })
    expect(expand).toHaveAttribute('aria-expanded', 'false')
    expect(
      document.getElementById(expand.getAttribute('aria-controls')!),
    ).toHaveTextContent('完整长文本')
    fireEvent.click(expand)
    expect(screen.getByRole('button', { name: '收起文本' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(document.querySelector('[data-typography-layout]')).not.toHaveClass(
      'line-clamp-(--typography-rows)',
    )
    fireEvent.click(screen.getByRole('button', { name: '收起文本' }))
    resize(40)
    expect(screen.queryByRole('button')).toBeNull()
    expect(ellipsis.mock.calls).toEqual([[true], [false]])
  })
  it('waits for controlled expansion and supports a default expanded one-way disclosure', () => {
    overflowGeometry()
    const changed = vi.fn()
    const { rerender } = render(
      <Typography
        ellipsis={{
          expanded: false,
          expandable: 'collapsible',
          onExpandedChange: changed,
        }}
      >
        长文本
      </Typography>,
    )
    fireEvent.click(screen.getByRole('button', { name: '展开文本' }))
    expect(changed).toHaveBeenCalledExactlyOnceWith(true)
    expect(screen.getByRole('button', { name: '展开文本' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    rerender(
      <Typography ellipsis={{ expanded: true, expandable: true }}>
        长文本
      </Typography>,
    )
    expect(screen.queryByRole('button')).toBeNull()
    expect(document.querySelector('[data-typography-layout]')).not.toHaveClass(
      'line-clamp-(--typography-rows)',
    )
  })
  it('preserves rich component state while measuring, showing tooltips and expanding', () => {
    overflowGeometry()
    const mount = vi.fn()
    function Content() {
      useEffect(mount, [])
      const [count, setCount] = useState(0)
      return (
        <a
          href="#content"
          onClick={(event) => {
            event.preventDefault()
            setCount(count + 1)
          }}
        >
          链接 {count}
        </a>
      )
    }
    render(
      <Typography ellipsis={{ expandable: 'collapsible', tooltip: true }}>
        <Content />
      </Typography>,
    )
    expect(mount).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('link'))
    expect(screen.getByRole('link')).toHaveTextContent('链接 1')
    act(() => screen.getByRole('link').focus())
    expect(screen.getByRole('button', { name: '收起文本' })).toBeVisible()
    expect(mount).toHaveBeenCalledTimes(1)
  })
})

describe('Typography changing action availability', () => {
  it('recovers the root when a focused copy action is disabled or removed', () => {
    clipboard()
    const ref = createRef<HTMLElement>()
    const { rerender } = render(
      <Typography ref={ref} copyable>
        文本
      </Typography>,
    )
    act(() => screen.getByRole('button', { name: '复制文本' }).focus())
    rerender(
      <Typography ref={ref} copyable disabled>
        文本
      </Typography>,
    )
    expect(ref.current).toHaveFocus()
    rerender(
      <Typography ref={ref} copyable>
        文本
      </Typography>,
    )
    act(() => screen.getByRole('button', { name: '复制文本' }).focus())
    rerender(<Typography ref={ref}>文本</Typography>)
    expect(ref.current).toHaveFocus()
  })
  it('keeps outside focus when editing is removed after the user leaves', () => {
    const { rerender } = render(
      <>
        <Typography editable={{ submitOnBlur: false }}>内容</Typography>
        <button>外部</button>
      </>,
    )
    openEdit()
    const outside = screen.getByRole('button', { name: '外部' })
    act(() => outside.focus())
    rerender(
      <>
        <Typography>内容</Typography>
        <button>外部</button>
      </>,
    )
    expect(outside).toHaveFocus()
  })
})

describe('Typography inline suffix and document tables', () => {
  it('copies the complete rich body and suffix without decorative dots or duplicated suffix text', async () => {
    overflowGeometry()
    const write = clipboard()
    const { container } = render(
      <Typography copyable ellipsis={{ rows: 2, suffix: '_最终版.mp4' }}>
        视频 <strong>预览</strong>
      </Typography>,
    )
    expect(container.querySelector('[data-typography-tail]')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(
      container.querySelector('[data-typography-suffix-source]'),
    ).toHaveClass('sr-only')
    expect(container.querySelector('[data-typography-body]')).toHaveTextContent(
      '视频 预览',
    )
    fireEvent.click(screen.getByRole('button', { name: '复制文本' }))
    await waitFor(() =>
      expect(write).toHaveBeenCalledExactlyOnceWith('视频 预览_最终版.mp4'),
    )
  })
  it('copies default HTML with an escaped suffix and keeps explicit copy text exact', async () => {
    overflowGeometry()
    const copied = vi.fn(),
      write = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { write } })
    vi.stubGlobal(
      'ClipboardItem',
      class {
        constructor(public data: Record<string, Blob>) {}
      },
    )
    const { rerender } = render(
      <Typography
        copyable={{ format: 'text/html', onCopy: copied }}
        ellipsis={{ suffix: '<&>"\'.mp4' }}
      >
        视频 <strong>预览</strong>
      </Typography>,
    )
    fireEvent.click(screen.getByRole('button', { name: '复制文本' }))
    await waitFor(() =>
      expect(copied).toHaveBeenCalledExactlyOnceWith(
        '视频 <strong>预览</strong>&lt;&amp;&gt;&quot;&#39;.mp4',
      ),
    )
    expect(write.mock.calls[0][0][0].data['text/html'].type).toBe('text/html')
    rerender(
      <Typography
        copyable={{
          format: 'text/html',
          text: '<em>自定义</em>',
          onCopy: copied,
        }}
        ellipsis={{ suffix: '.mp4' }}
      >
        ignored
      </Typography>,
    )
    fireEvent.click(screen.getByRole('button', { name: '复制文本' }))
    await waitFor(() =>
      expect(copied).toHaveBeenLastCalledWith('<em>自定义</em>'),
    )
  })
  it('invalidates an asynchronous copy when only the preserved suffix changes', async () => {
    const write = clipboard(),
      task = deferred<string>(),
      copied = vi.fn()
    const options = { text: () => task.promise, onCopy: copied }
    const { rerender } = render(
      <Typography copyable={options} ellipsis={{ suffix: '.mp4' }}>
        原文
      </Typography>,
    )
    fireEvent.click(screen.getByRole('button', { name: '复制文本' }))
    rerender(
      <Typography copyable={options} ellipsis={{ suffix: '.webm' }}>
        原文
      </Typography>,
    )
    await act(async () => task.resolve('旧值'))
    expect(write).not.toHaveBeenCalled()
    expect(copied).not.toHaveBeenCalled()
    expect(screen.queryByRole('status')).toBeNull()
  })
  it('keeps a rich component mounted through suffix, row and expansion changes', async () => {
    const resize = overflowGeometry(),
      mount = vi.fn(),
      write = clipboard()
    function Content() {
      useEffect(mount, [])
      const [count, setCount] = useState(0)
      return (
        <a
          href="#details"
          onClick={(event) => {
            event.preventDefault()
            setCount((value) => value + 1)
          }}
        >
          阅读 {count} 次
        </a>
      )
    }
    const child = <Content />
    const { rerender, container } = render(
      <Typography
        copyable
        ellipsis={{ rows: 1, suffix: '.mp4', expandable: 'collapsible' }}
      >
        {child}
      </Typography>,
    )
    const link = screen.getByRole('link')
    fireEvent.click(link)
    fireEvent.click(screen.getByRole('button', { name: '展开文本' }))
    expect(
      container.querySelector('[data-typography-suffix-source]'),
    ).not.toHaveClass('sr-only')
    rerender(
      <Typography
        copyable
        ellipsis={{ rows: 3, suffix: '.webm', expandable: 'collapsible' }}
      >
        {child}
      </Typography>,
    )
    fireEvent.click(screen.getByRole('button', { name: '收起文本' }))
    expect(screen.getByRole('link')).toBe(link)
    expect(link).toHaveTextContent('阅读 1 次')
    expect(mount).toHaveBeenCalledTimes(1)
    resize(40)
    expect(
      container.querySelector('[data-typography-suffix-source]'),
    ).not.toHaveClass('sr-only')
    fireEvent.click(screen.getByRole('button', { name: '复制文本' }))
    await waitFor(() =>
      expect(write).toHaveBeenCalledExactlyOnceWith('阅读 1 次.webm'),
    )
  })
  it('wraps native tables through fragments and native containers while preserving semantics, refs and cell components', () => {
    const ref = createRef<HTMLTableElement>(),
      clicked = vi.fn(),
      mount = vi.fn()
    function Cell() {
      useEffect(mount, [])
      const [count, setCount] = useState(0)
      return (
        <td>
          <button onClick={() => setCount(count + 1)}>次数 {count}</button>
        </td>
      )
    }
    const content = (
      <>
        <section>
          <table ref={ref} id="rules" className="min-w-96" onClick={clicked}>
            <caption>文档规则</caption>
            <thead>
              <tr>
                <th scope="col" className="text-center">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Cell />
              </tr>
            </tbody>
          </table>
        </section>
      </>
    )
    const { rerender } = render(
      <Typography
        as="div"
        classNames={{ table: 'custom-table', tableWrapper: 'custom-wrapper' }}
      >
        {content}
      </Typography>,
    )
    const table = screen.getByRole('table', { name: '文档规则' })
    const region = screen.getByRole('region', { name: '文档规则表格滚动区域' })
    expect(ref.current).toBe(table)
    expect(table).toHaveAttribute('id', 'rules')
    expect(table).toHaveClass('border-collapse', 'custom-table', 'min-w-96')
    expect(region).toHaveClass('overflow-x-auto', 'custom-wrapper')
    expect(region).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('columnheader')).toHaveAttribute('scope', 'col')
    expect(screen.getByRole('columnheader')).toHaveClass('text-center')
    fireEvent.click(screen.getByRole('button', { name: '次数 0' }))
    expect(clicked).toHaveBeenCalledTimes(1)
    rerender(
      <Typography as="div" classNames={{ table: 'new-table' }}>
        {content}
      </Typography>,
    )
    expect(screen.getByRole('table')).toBe(table)
    expect(screen.getByRole('button')).toHaveTextContent('次数 1')
    expect(mount).toHaveBeenCalledTimes(1)
  })
  it('labels multiple captionless table regions and leaves custom components opaque', () => {
    const invoked = vi.fn()
    function Custom() {
      invoked()
      return <span>自定义块</span>
    }
    render(
      <Typography as="div" label="说明">
        <table>
          <tbody>
            <tr>
              <td>第一表</td>
            </tr>
          </tbody>
        </table>
        <table>
          <tbody>
            <tr>
              <td>第二表</td>
            </tr>
          </tbody>
        </table>
        <Custom />
      </Typography>,
    )
    expect(
      screen.getAllByRole('region', { name: '说明表格滚动区域' }),
    ).toHaveLength(2)
    expect(screen.getAllByRole('table')).toHaveLength(2)
    expect(invoked).toHaveBeenCalledTimes(1)
    expect(screen.getByText('自定义块')).toBeVisible()
  })
  it('scrolls the table wrapper with horizontal keys without intercepting cell controls or nonoverflowing regions', () => {
    render(
      <Typography as="div">
        <table>
          <tbody>
            <tr>
              <td>
                <button>单元格操作</button>
              </td>
            </tr>
          </tbody>
        </table>
      </Typography>,
    )
    const region = screen.getByRole('region')
    Object.defineProperties(region, {
      scrollWidth: { configurable: true, value: 600 },
      clientWidth: { value: 240 },
    })
    fireEvent.keyDown(region, { key: 'ArrowRight' })
    expect(region.scrollLeft).toBe(44)
    fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowRight' })
    expect(region.scrollLeft).toBe(44)
    fireEvent.keyDown(region, { key: 'End', ctrlKey: true })
    expect(region.scrollLeft).toBe(44)
    fireEvent.keyDown(region, { key: 'End' })
    expect(region.scrollLeft).toBe(360)
    fireEvent.keyDown(region, { key: 'Home' })
    expect(region.scrollLeft).toBe(0)
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      direction: 'rtl',
    } as CSSStyleDeclaration)
    fireEvent.keyDown(region, { key: 'End' })
    expect(region.scrollLeft).toBe(-360)
    fireEvent.keyDown(region, { key: 'Home' })
    fireEvent.keyDown(region, { key: 'ArrowLeft' })
    expect(region.scrollLeft).toBe(-44)
    Object.defineProperty(region, 'scrollWidth', { value: 240 })
    fireEvent.keyDown(region, { key: 'ArrowRight' })
    expect(region.scrollLeft).toBe(-44)
  })
})
