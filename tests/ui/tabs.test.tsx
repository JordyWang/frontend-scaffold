import { createRef, useEffect, useState } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConfigProvider, Tabs, type TabItem } from '@/shared/ui'

const initial: TabItem[] = [
  { value: 'one', label: '一', content: '第一面板' },
  { value: 'two', label: '二', content: '第二面板' },
  { value: 'three', label: '三', content: '第三面板' },
]
const tab = (name: string) => screen.getByRole('tab', { name, exact: true })
const close = (name: string) =>
  screen.getByRole('button', { name: '关闭' + name, exact: true })
const choose = (name: string) => act(() => tab(name).focus())
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Tabs project API and editable card semantics', () => {
  it('forwards the root ref, native attributes and focus events', () => {
    const ref = createRef<HTMLDivElement>(),
      focus = vi.fn()
    render(
      <Tabs
        ref={ref}
        id="workspace"
        aria-describedby="help"
        onFocusCapture={focus}
        items={initial}
      />,
    )
    expect(ref.current).toBe(screen.getByRole('tablist').parentElement)
    expect(ref.current).toHaveAttribute('id', 'workspace')
    expect(ref.current).toHaveAttribute('aria-describedby', 'help')
    choose('一')
    expect(focus).toHaveBeenCalledTimes(1)
  })
  it.each(['add', 'remove'] as const)(
    'cancels an explicitly rejected %s request before later unrelated data changes',
    (kind) => {
      const edit = vi.fn(() => false),
        changed = vi.fn()
      const ui = (items: TabItem[]) => (
        <Tabs
          items={items}
          defaultValue="two"
          variant="editable-card"
          onAdd={edit}
          onRemove={edit}
          onValueChange={changed}
        />
      )
      const { rerender } = render(ui(initial.slice(0, 2)))
      fireEvent.click(
        kind === 'add'
          ? screen.getByRole('button', { name: '新增标签页' })
          : close('二'),
      )
      rerender(ui(kind === 'add' ? initial : initial.slice(0, 1)))
      expect(changed).not.toHaveBeenCalled()
      expect(tab(kind === 'add' ? '二' : '一')).toHaveAttribute(
        'aria-selected',
        'true',
      )
    },
  )
  it('keeps rich tab labels and icons separate from native close buttons', () => {
    render(
      <Tabs
        variant="editable-card"
        onAdd={() => {}}
        onRemove={() => {}}
        items={[
          {
            ...initial[0],
            label: <strong>工作区</strong>,
            ariaLabel: '工作区',
            icon: (
              <svg>
                <title>装饰图标</title>
              </svg>
            ),
            closeLabel: '关闭当前工作区',
            closeIcon: <span>×</span>,
          },
          { ...initial[1], closable: false },
          { ...initial[2], disabled: true },
        ]}
      />,
    )
    expect(tab('工作区').querySelector('button')).toBeNull()
    expect(tab('工作区').querySelector('svg')!.parentElement).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(
      screen.getByRole('button', { name: '关闭当前工作区' }).parentElement,
    ).toBe(tab('工作区').parentElement)
    expect(screen.queryByRole('button', { name: '关闭二' })).toBeNull()
    expect(close('三')).toBeDisabled()
    expect(tab('三')).toBeDisabled()
    expect(screen.getByRole('tabpanel')).toHaveAttribute(
      'aria-labelledby',
      tab('工作区').id,
    )
  })
  it('only exposes edits for editable cards and disables missing handlers', () => {
    const { rerender } = render(
      <Tabs
        items={initial}
        variant="card"
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    )
    expect(screen.queryByRole('button')).toBeNull()
    rerender(<Tabs items={initial} variant="editable-card" />)
    expect(screen.getByRole('button', { name: '新增标签页' })).toBeDisabled()
    expect(close('一')).toBeDisabled()
    rerender(
      <Tabs
        items={[
          { ...initial[0], closeIcon: null },
          { ...initial[1], closeIcon: false },
        ]}
        variant="editable-card"
        addable={false}
        onRemove={vi.fn()}
      />,
    )
    expect(screen.queryByRole('button')).toBeNull()
  })
  it('waits for actual item removal and skips disabled predecessors when selecting the replacement', () => {
    const changed = vi.fn(),
      removed = vi.fn()
    const items = [initial[0], { ...initial[1], disabled: true }, initial[2]]
    const { rerender } = render(
      <Tabs
        items={items}
        defaultValue="three"
        variant="editable-card"
        onRemove={removed}
        onValueChange={changed}
      />,
    )
    fireEvent.click(close('三'))
    expect(removed).toHaveBeenCalledExactlyOnceWith('three')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('第三面板')
    expect(close('三')).toHaveFocus()
    expect(changed).not.toHaveBeenCalled()
    rerender(
      <Tabs
        items={items.slice(0, 2)}
        defaultValue="three"
        variant="editable-card"
        onRemove={removed}
        onValueChange={changed}
      />,
    )
    expect(tab('一')).toHaveFocus()
    expect(tab('一')).toHaveAttribute('aria-selected', 'true')
    expect(changed).toHaveBeenCalledExactlyOnceWith('one')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('第一面板')
  })
  it('uses the next available tab when closing the first active item', () => {
    const changed = vi.fn()
    function Example() {
      const [items, setItems] = useState(initial)
      return (
        <Tabs
          items={items}
          variant="editable-card"
          onRemove={(key) =>
            setItems(items.filter((item) => item.value !== key))
          }
          onValueChange={changed}
        />
      )
    }
    render(<Example />)
    fireEvent.click(close('一'))
    expect(tab('二')).toHaveFocus()
    expect(changed).toHaveBeenCalledExactlyOnceWith('two')
  })
  it('does not select a different panel when an inactive tab is closed', () => {
    const changed = vi.fn(),
      remove = vi.fn()
    const { rerender } = render(
      <Tabs
        items={initial}
        defaultValue="two"
        variant="editable-card"
        onRemove={remove}
        onValueChange={changed}
      />,
    )
    fireEvent.click(close('三'))
    rerender(
      <Tabs
        items={initial.slice(0, 2)}
        defaultValue="two"
        variant="editable-card"
        onRemove={remove}
        onValueChange={changed}
      />,
    )
    expect(tab('二')).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('第二面板')
    expect(changed).not.toHaveBeenCalled()
  })
  it('requests a controlled replacement once and leaves selection to the owner', () => {
    const changed = vi.fn(),
      remove = vi.fn()
    const { rerender } = render(
      <Tabs
        items={initial}
        value="two"
        variant="editable-card"
        onRemove={remove}
        onValueChange={changed}
      />,
    )
    fireEvent.click(close('二'))
    const rest = [initial[0], initial[2]]
    rerender(
      <Tabs
        items={rest}
        value="two"
        variant="editable-card"
        onRemove={remove}
        onValueChange={changed}
      />,
    )
    expect(changed).toHaveBeenCalledExactlyOnceWith('one')
    expect(tab('一')).toHaveFocus()
    expect(tab('一')).toHaveAttribute('aria-selected', 'false')
    expect(screen.queryByRole('tabpanel')).toBeNull()
    rerender(
      <Tabs
        items={rest}
        value="one"
        variant="editable-card"
        onRemove={remove}
        onValueChange={changed}
      />,
    )
    expect(screen.getByRole('tabpanel')).toHaveTextContent('第一面板')
    expect(changed).toHaveBeenCalledTimes(1)
  })
  it('selects an accepted new tab locally and restores focus from its add button', () => {
    const changed = vi.fn(),
      add = vi.fn()
    const { rerender } = render(
      <Tabs
        items={initial.slice(0, 1)}
        variant="editable-card"
        onAdd={add}
        onValueChange={changed}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '新增标签页' }))
    expect(add).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('tabpanel')).toHaveTextContent('第一面板')
    rerender(
      <Tabs
        items={initial.slice(0, 2)}
        variant="editable-card"
        onAdd={add}
        onValueChange={changed}
      />,
    )
    expect(tab('二')).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('第二面板')
    expect(changed).toHaveBeenCalledExactlyOnceWith('two')
  })
  it('keeps add focus until a controlled new selection is accepted', () => {
    const changed = vi.fn(),
      add = vi.fn()
    const { rerender } = render(
      <Tabs
        items={initial.slice(0, 1)}
        value="one"
        variant="editable-card"
        onAdd={add}
        onValueChange={changed}
      />,
    )
    const action = screen.getByRole('button', { name: '新增标签页' })
    fireEvent.click(action)
    rerender(
      <Tabs
        items={initial.slice(0, 2)}
        value="one"
        variant="editable-card"
        onAdd={add}
        onValueChange={changed}
      />,
    )
    expect(changed).toHaveBeenCalledExactlyOnceWith('two')
    expect(action).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('第一面板')
    rerender(
      <Tabs
        items={initial.slice(0, 2)}
        value="two"
        variant="editable-card"
        onAdd={add}
        onValueChange={changed}
      />,
    )
    expect(tab('二')).toHaveFocus()
    expect(changed).toHaveBeenCalledTimes(1)
  })
  it.each(['add', 'remove'] as const)(
    'does not reclaim outside focus after delayed %s acceptance',
    (kind) => {
      const changed = vi.fn(),
        edit = vi.fn()
      const ui = (items: TabItem[]) => (
        <>
          <Tabs
            items={items}
            defaultValue="two"
            variant="editable-card"
            onAdd={edit}
            onRemove={edit}
            onValueChange={changed}
          />
          <button>外部</button>
        </>
      )
      const { rerender } = render(ui(initial.slice(0, 2)))
      fireEvent.click(
        kind === 'add'
          ? screen.getByRole('button', { name: '新增标签页' })
          : close('二'),
      )
      const outside = screen.getByRole('button', { name: '外部' })
      act(() => outside.focus())
      rerender(ui(kind === 'add' ? initial : initial.slice(0, 1)))
      expect(outside).toHaveFocus()
    },
  )
  it.each([true, false])(
    'restores usable focus after closing the final item with addable=%s',
    (addable) => {
      function Example() {
        const [items, setItems] = useState(initial.slice(0, 1))
        return (
          <Tabs
            items={items}
            variant="editable-card"
            addable={addable}
            onAdd={() => {}}
            onRemove={() => setItems([])}
          />
        )
      }
      render(<Example />)
      fireEvent.click(close('一'))
      expect(screen.queryByRole('tab')).toBeNull()
      expect(screen.queryByRole('tabpanel')).toBeNull()
      expect(screen.getByText('暂无可用标签页')).toBeVisible()
      expect(
        addable
          ? screen.getByRole('button', { name: '新增标签页' })
          : screen.getByRole('tablist'),
      ).toHaveFocus()
    },
  )
  it('uses Delete only for removable tabs and ignores IME, repeats, modifiers and child controls', () => {
    const remove = vi.fn()
    render(
      <Tabs
        items={[initial[0], { ...initial[1], closable: false }]}
        variant="editable-card"
        onRemove={remove}
      />,
    )
    for (const extra of [
      { repeat: true },
      { isComposing: true },
      { keyCode: 229 },
      { ctrlKey: true },
      { shiftKey: true },
      { metaKey: true },
      { altKey: true },
    ])
      fireEvent.keyDown(tab('一'), { key: 'Delete', ...extra })
    fireEvent.keyDown(tab('二'), { key: 'Delete' })
    fireEvent.keyDown(close('一'), { key: 'Delete' })
    expect(remove).not.toHaveBeenCalled()
    fireEvent.keyDown(tab('一'), { key: 'Delete' })
    expect(remove).toHaveBeenCalledExactlyOnceWith('one')
  })
  it('returns to the header when the final close has no usable add control', () => {
    const change = vi.fn()
    function Example() {
      const [items, setItems] = useState(initial.slice(0, 1))
      return (
        <Tabs
          items={items}
          variant="editable-card"
          onRemove={() => setItems([])}
          onValueChange={change}
        />
      )
    }
    render(<Example />)
    fireEvent.click(close('一'))
    expect(screen.getByRole('button', { name: '新增标签页' })).toBeDisabled()
    expect(screen.getByRole('tablist')).toHaveFocus()
    expect(change).toHaveBeenCalledExactlyOnceWith('')
  })
  it('keeps outside ownership even when outside focus has subsequently moved to the body', () => {
    const ui = (items: TabItem[]) => (
      <>
        <Tabs
          items={items}
          defaultValue="two"
          variant="editable-card"
          onRemove={() => {}}
        />
        <button>外部</button>
      </>
    )
    const { rerender } = render(ui(initial.slice(0, 2)))
    fireEvent.click(close('二'))
    const outside = screen.getByRole('button', { name: '外部' })
    act(() => {
      outside.focus()
      outside.blur()
    })
    rerender(ui(initial.slice(0, 1)))
    expect(document.body).toHaveFocus()
  })
  it('restores a tab when edit controls are removed or disabled without selecting it', () => {
    const changed = vi.fn(),
      remove = vi.fn()
    const { rerender } = render(
      <Tabs
        items={initial}
        value="one"
        variant="editable-card"
        onRemove={remove}
        onValueChange={changed}
      />,
    )
    act(() => close('二').focus())
    rerender(
      <Tabs
        items={initial}
        value="one"
        variant="line"
        onValueChange={changed}
      />,
    )
    expect(tab('一')).toHaveFocus()
    expect(changed).not.toHaveBeenCalled()
    act(() => tab('一').focus())
    rerender(
      <Tabs
        items={[{ ...initial[0], disabled: true }, initial[1]]}
        value="one"
        onValueChange={changed}
      />,
    )
    expect(tab('二')).toHaveFocus()
    expect(changed).not.toHaveBeenCalled()
  })
})

describe('Tabs panel lifetime and responsive placement', () => {
  function StatefulPanel({ mount }: { mount: () => void }) {
    useEffect(() => {
      mount()
    }, [mount])
    const [text, setText] = useState('初始')
    return (
      <input
        aria-label="面板草稿"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
    )
  }
  it('lazily preserves visited panel state while exposing just the active panel and its controls', () => {
    const mount = vi.fn()
    render(
      <Tabs
        items={[
          { ...initial[0], content: <StatefulPanel mount={mount} /> },
          initial[1],
        ]}
      />,
    )
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '保留草稿' } })
    choose('二')
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(input.closest('[role="tabpanel"]')).toHaveAttribute('hidden')
    expect(input.closest('[role="tabpanel"]')).toHaveAttribute('inert')
    choose('一')
    expect(screen.getByRole('textbox')).toBe(input)
    expect(input).toHaveValue('保留草稿')
    expect(mount).toHaveBeenCalledTimes(1)
  })
  it('destroys hidden content when requested and respects item-level retention and force rendering', () => {
    const mount = vi.fn()
    const items = [
      { ...initial[0], content: <StatefulPanel mount={mount} /> },
      { ...initial[1], content: <span>第二</span>, forceRender: true },
    ]
    const { rerender } = render(<Tabs items={items} destroyOnHidden />)
    expect(screen.getByText('第二')).not.toBeVisible()
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '旧草稿' },
    })
    choose('二')
    choose('一')
    expect(screen.getByRole('textbox')).toHaveValue('初始')
    expect(mount).toHaveBeenCalledTimes(2)
    rerender(
      <Tabs
        items={[{ ...items[0], destroyOnHidden: false }, items[1]]}
        destroyOnHidden
      />,
    )
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '单项保留' },
    })
    choose('二')
    choose('一')
    expect(screen.getByRole('textbox')).toHaveValue('单项保留')
    expect(mount).toHaveBeenCalledTimes(2)
  })
  it('recovers focus from a panel that becomes hidden without reclaiming outside focus', () => {
    const items = [
      { ...initial[0], content: <button>面板操作</button> },
      initial[1],
    ]
    const ui = (value: string) => (
      <>
        <Tabs items={items} value={value} />
        <button>外部</button>
      </>
    )
    const { rerender } = render(ui('one'))
    act(() => screen.getByRole('button', { name: '面板操作' }).focus())
    rerender(ui('two'))
    expect(tab('二')).toHaveFocus()
    const outside = screen.getByRole('button', { name: '外部' })
    act(() => outside.focus())
    rerender(ui('one'))
    expect(outside).toHaveFocus()
  })
  it('adapts explicit side placement to its own container width while preserving legacy vertical orientation', () => {
    let width = 800,
      resize = () => {}
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => ({
        width,
        height: 100,
        x: 0,
        y: 0,
        left: 0,
        right: width,
        top: 0,
        bottom: 100,
        toJSON: () => ({}),
      }),
    )
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
    const { rerender } = render(<Tabs items={initial} placement="end" />)
    const root = screen.getByRole('tablist').parentElement!
    expect(root).toHaveAttribute('data-ui-placement', 'end')
    expect(screen.getByRole('tablist')).toHaveAttribute(
      'aria-orientation',
      'vertical',
    )
    choose('二')
    width = 240
    act(() => resize())
    expect(root).toHaveAttribute('data-ui-placement', 'top')
    expect(tab('二')).toHaveFocus()
    expect(tab('二')).toHaveAttribute('aria-selected', 'true')
    rerender(<Tabs items={initial} orientation="vertical" />)
    expect(screen.getByRole('tablist')).toHaveAttribute(
      'aria-orientation',
      'vertical',
    )
    rerender(<Tabs items={initial} variant="card" placement="end" />)
    expect(root).toHaveAttribute('data-ui-placement', 'top')
  })
  it('inherits size, uses logical bottom placement and exposes semantic Tailwind parts', () => {
    render(
      <ConfigProvider componentSize="large" direction="rtl">
        <Tabs
          items={initial}
          variant="editable-card"
          placement="bottom"
          onAdd={() => {}}
          onRemove={() => {}}
          classNames={{
            root: 'test-root',
            header: 'test-header',
            item: 'test-item',
            tab: 'test-tab',
            add: 'test-add',
            remove: 'test-remove',
            body: 'test-body',
            content: 'test-content',
          }}
        />
      </ConfigProvider>,
    )
    expect(screen.getByRole('tablist').parentElement).toHaveAttribute(
      'data-ui-size',
      'large',
    )
    expect(screen.getByRole('tablist')).toHaveClass('order-last', 'test-header')
    expect(tab('一')).toHaveClass('test-tab', 'min-h-12')
    expect(tab('一').parentElement).toHaveClass('rounded-b-md', 'test-item')
    expect(close('一')).toHaveClass('test-remove')
    expect(screen.getByRole('button', { name: '新增标签页' })).toHaveClass(
      'test-add',
    )
    expect(screen.getByRole('tabpanel')).toHaveClass('test-content')
  })
})
