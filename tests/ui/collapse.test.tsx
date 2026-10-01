import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Collapse, ConfigProvider, Input, type CollapseItem } from '@/shared/ui'

const baseItems: CollapseItem[] = [
  {
    key: 'first key',
    label: '第一项',
    children: <Input aria-label="草稿" defaultValue="初始内容" />,
  },
  { key: 'disabled', label: '禁用项', children: '禁用内容', disabled: true },
  { key: 'last', label: '最后一项', children: '最后内容' },
]

function panel(trigger: HTMLElement) {
  return document.getElementById(trigger.getAttribute('aria-controls')!)!
}

describe('Collapse', () => {
  it('lazily mounts content, retains it after closing, and preserves stable IDs during reordering', () => {
    const { rerender } = render(<Collapse items={baseItems} />)
    const first = screen.getByRole('button', { name: '第一项' })
    const id = first.id
    expect(panel(first)).toHaveAttribute('aria-labelledby', id)
    expect(panel(first)).toHaveAttribute('hidden')
    expect(
      screen.queryByRole('textbox', { name: '草稿', hidden: true }),
    ).not.toBeInTheDocument()
    fireEvent.click(first)
    const input = screen.getByRole('textbox', { name: '草稿' })
    fireEvent.change(input, { target: { value: '修改的草稿' } })
    fireEvent.click(first)
    expect(input).not.toBeVisible()
    rerender(<Collapse items={[baseItems[2], baseItems[0], baseItems[1]]} />)
    expect(screen.getByRole('button', { name: '第一项' }).id).toBe(id)
    fireEvent.click(first)
    expect(input).toBeVisible()
    expect(input).toHaveValue('修改的草稿')
  })

  it('destroys closed content while forceRender takes precedence', () => {
    render(
      <Collapse
        destroyOnHidden
        items={[
          { ...baseItems[0] },
          {
            key: 'forced',
            label: '预渲染',
            forceRender: true,
            children: <Input aria-label="预渲染草稿" defaultValue="初始" />,
          },
        ]}
      />,
    )
    const forced = screen.getByRole('textbox', {
      name: '预渲染草稿',
      hidden: true,
    })
    expect(forced).not.toBeVisible()
    const first = screen.getByRole('button', { name: '第一项' })
    fireEvent.click(first)
    fireEvent.change(screen.getByRole('textbox', { name: '草稿' }), {
      target: { value: '修改' },
    })
    fireEvent.click(first)
    expect(
      screen.queryByRole('textbox', { name: '草稿', hidden: true }),
    ).not.toBeInTheDocument()
    expect(panel(first)).toHaveAttribute('hidden')
    fireEvent.click(first)
    expect(screen.getByRole('textbox', { name: '草稿' })).toHaveValue(
      '初始内容',
    )
    const forcedTrigger = screen.getByRole('button', { name: '预渲染' })
    fireEvent.click(forcedTrigger)
    fireEvent.change(forced, { target: { value: '保留' } })
    fireEvent.click(forcedTrigger)
    fireEvent.click(forcedTrigger)
    expect(forced).toHaveValue('保留')
  })

  it('normalizes duplicate and stale keys before applying accordion, without emitting a change', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <Collapse
        items={baseItems}
        accordion
        activeKey={['missing', 'last', 'last', 'first key']}
        onChange={onChange}
      />,
    )
    const last = screen.getByRole('button', { name: '最后一项' })
    const first = screen.getByRole('button', { name: '第一项' })
    expect(last).toHaveAttribute('aria-expanded', 'true')
    expect(first).toHaveAttribute('aria-expanded', 'false')
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.click(first)
    expect(onChange).toHaveBeenLastCalledWith(['first key'])
    expect(first).toHaveAttribute('aria-expanded', 'false')
    rerender(
      <Collapse
        items={baseItems}
        accordion
        activeKey={['first key']}
        onChange={onChange}
      />,
    )
    fireEvent.click(first)
    expect(onChange).toHaveBeenLastCalledWith([])
  })

  it('clears removed uncontrolled keys so reintroduced panels stay closed', () => {
    const { rerender } = render(
      <Collapse
        items={baseItems}
        defaultActiveKey={['missing', 'first key', 'first key']}
      />,
    )
    expect(screen.getByRole('button', { name: '第一项' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    rerender(<Collapse items={[baseItems[2]]} />)
    rerender(<Collapse items={baseItems} />)
    expect(screen.getByRole('button', { name: '第一项' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('keeps extra actions outside the disclosure button and out of arrow navigation', () => {
    const action = vi.fn()
    const onChange = vi.fn()
    render(
      <Collapse
        onChange={onChange}
        items={[
          { ...baseItems[0], extra: <button onClick={action}>编辑</button> },
          baseItems[2],
        ]}
      />,
    )
    const edit = screen.getByRole('button', { name: '编辑' })
    const first = screen.getByRole('button', { name: '第一项' })
    expect(first.contains(edit)).toBe(false)
    fireEvent.click(edit)
    expect(action).toHaveBeenCalledOnce()
    expect(onChange).not.toHaveBeenCalled()
    expect(first).toHaveAttribute('aria-expanded', 'false')
    edit.focus()
    fireEvent.keyDown(edit, { key: 'ArrowDown' })
    expect(edit).toHaveFocus()
  })

  it('supports icon-only triggers, hidden-arrow fallback, and item-level disabled overrides', () => {
    const onChange = vi.fn()
    render(
      <Collapse
        collapsible="icon"
        onChange={onChange}
        defaultActiveKey={['disabled']}
        items={[
          { key: 'icon', label: '图标触发', children: '图标内容' },
          {
            key: 'hidden',
            label: '隐藏图标',
            showArrow: false,
            children: '隐藏图标内容',
          },
          { ...baseItems[1], collapsible: 'header' },
          {
            key: 'locked',
            label: '禁止折叠',
            collapsible: 'disabled',
            children: '禁止内容',
          },
        ]}
      />,
    )
    const icon = screen.getByRole('button', { name: '图标触发' })
    const heading = screen.getByRole('heading', { name: '图标触发' })
    fireEvent.click(within(heading).getByText('图标触发'))
    expect(icon).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(icon)
    expect(screen.getByRole('region', { name: '图标触发' })).toHaveTextContent(
      '图标内容',
    )
    const hidden = screen.getByRole('button', { name: '隐藏图标' })
    expect(within(hidden).getByText('隐藏图标')).toBeInTheDocument()
    expect(hidden.querySelector('[data-ui-collapse-icon]')).toBeNull()
    fireEvent.click(hidden)
    expect(hidden).toHaveAttribute('aria-expanded', 'true')
    const disabled = screen.getByRole('button', { name: '禁用项' })
    expect(disabled).toBeDisabled()
    expect(disabled).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(disabled)
    expect(onChange).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('button', { name: '禁止折叠' })).toBeDisabled()
  })

  it('navigates only enabled triggers with ArrowUp/Down, Home and End', () => {
    render(<Collapse items={baseItems} defaultActiveKey={['first key']} />)
    const first = screen.getByRole('button', { name: '第一项' })
    const last = screen.getByRole('button', { name: '最后一项' })
    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowDown' })
    expect(last).toHaveFocus()
    fireEvent.keyDown(last, { key: 'ArrowDown' })
    expect(first).toHaveFocus()
    fireEvent.keyDown(first, { key: 'ArrowUp' })
    expect(last).toHaveFocus()
    fireEvent.keyDown(last, { key: 'Home' })
    expect(first).toHaveFocus()
    fireEvent.keyDown(first, { key: 'End' })
    expect(last).toHaveFocus()
    const input = screen.getByRole('textbox', { name: '草稿' })
    input.focus()
    fireEvent.keyDown(input, { key: 'Home' })
    expect(input).toHaveFocus()
    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowDown', ctrlKey: true })
    expect(first).toHaveFocus()
  })

  it('respects consumer keyboard handlers and nested panel navigation', () => {
    const { rerender } = render(
      <Collapse
        items={baseItems}
        onKeyDown={(event) => event.preventDefault()}
      />,
    )
    const first = screen.getByRole('button', { name: '第一项' })
    first.focus()
    fireEvent.keyDown(first, { key: 'End' })
    expect(first).toHaveFocus()
    rerender(
      <Collapse
        label="外部"
        defaultActiveKey={['outer']}
        items={[
          {
            key: 'outer',
            label: '外部标题',
            children: <Collapse label="内部" items={baseItems} />,
          },
          { key: 'other', label: '外部末项', children: '末项内容' },
        ]}
        activeKey={['outer']}
      />,
    )
    const inner = screen.getByRole('group', { name: '内部' })
    const innerFirst = within(inner).getByRole('button', { name: '第一项' })
    innerFirst.focus()
    fireEvent.keyDown(innerFirst, { key: 'End' })
    expect(
      within(inner).getByRole('button', { name: '最后一项' }),
    ).toHaveFocus()
  })

  it.each([false, true])(
    'restores focus when controlled content is closed (destroy=%s)',
    (destroyOnHidden) => {
      const { rerender } = render(
        <Collapse
          items={baseItems}
          activeKey={['first key']}
          destroyOnHidden={destroyOnHidden}
        />,
      )
      screen.getByRole('textbox', { name: '草稿' }).focus()
      rerender(
        <Collapse
          items={baseItems}
          activeKey={[]}
          destroyOnHidden={destroyOnHidden}
        />,
      )
      expect(screen.getByRole('button', { name: '第一项' })).toHaveFocus()
    },
  )

  it('restores focus to an enabled neighbor when a focused panel is disabled or removed', () => {
    const { rerender } = render(
      <Collapse items={baseItems} activeKey={['first key']} />,
    )
    screen.getByRole('button', { name: '第一项' }).focus()
    rerender(
      <Collapse
        items={[
          { ...baseItems[0], disabled: true },
          baseItems[1],
          baseItems[2],
        ]}
        activeKey={['first key']}
      />,
    )
    expect(screen.getByRole('button', { name: '最后一项' })).toHaveFocus()
    screen.getByRole('textbox', { name: '草稿' }).focus()
    rerender(<Collapse items={[baseItems[2]]} />)
    expect(screen.getByRole('button', { name: '最后一项' })).toHaveFocus()
    rerender(<Collapse items={[]} />)
    expect(screen.getByRole('group', { name: '折叠面板' })).toHaveFocus()
    expect(screen.getByText('暂无面板')).toBeVisible()
  })

  it('restores to the owning trigger even when its string key is empty', () => {
    const items = [baseItems[2], { ...baseItems[0], key: '' }]
    const { rerender } = render(<Collapse items={items} activeKey={['']} />)
    screen.getByRole('textbox', { name: '草稿' }).focus()
    rerender(<Collapse items={items} activeKey={[]} />)
    expect(screen.getByRole('button', { name: '第一项' })).toHaveFocus()
  })

  it('keeps external focus and does not restore a stale focus record later', () => {
    const content = (items: CollapseItem[]) => (
      <>
        <button>外部操作</button>
        <Collapse items={items} activeKey={['first key']} />
      </>
    )
    const { rerender } = render(content(baseItems))
    screen.getByRole('textbox', { name: '草稿' }).focus()
    const external = screen.getByRole('button', { name: '外部操作' })
    external.focus()
    rerender(content([baseItems[2]]))
    expect(external).toHaveFocus()
    external.blur()
    rerender(content([]))
    expect(screen.getByRole('group', { name: '折叠面板' })).not.toHaveFocus()
  })

  it('maps nested content back to its owning outer panel on removal', () => {
    const { rerender } = render(
      <Collapse
        label="外部"
        activeKey={['outer']}
        items={[
          {
            key: 'outer',
            label: '外部标题',
            children: (
              <Collapse
                label="内部"
                items={baseItems}
                defaultActiveKey={['first key']}
              />
            ),
          },
          { key: 'other', label: '外部末项', children: '外部内容' },
        ]}
      />,
    )
    screen.getByRole('textbox', { name: '草稿' }).focus()
    rerender(
      <Collapse
        label="外部"
        items={[{ key: 'other', label: '外部末项', children: '外部内容' }]}
      />,
    )
    expect(screen.getByRole('button', { name: '外部末项' })).toHaveFocus()
  })

  it('inherits RTL and size, supplies icon state, and combines semantic classes', () => {
    const icon = vi.fn(({ expanded }: { expanded: boolean }) => (
      <span>{expanded ? '打开' : '收起'}</span>
    ))
    render(
      <ConfigProvider componentSize="small" direction="rtl">
        <Collapse
          label="局部"
          ghost
          expandIconPlacement="end"
          expandIcon={icon}
          classNames={{
            root: 'root-marker',
            body: 'global-body',
            header: 'global-header',
          }}
          items={[
            {
              key: 'first',
              label: '项目',
              children: '内容',
              className: 'item-marker',
              classNames: { body: 'item-body', header: 'item-header' },
            },
          ]}
        />
      </ConfigProvider>,
    )
    const root = screen.getByRole('group', { name: '局部' })
    expect(root).toHaveAttribute('dir', 'rtl')
    expect(root).toHaveAttribute('data-ui-size', 'small')
    expect(root).toHaveClass('bg-transparent', 'root-marker')
    const trigger = screen.getByRole('button', { name: '项目' })
    expect(trigger.parentElement?.parentElement).toHaveClass(
      'global-header',
      'item-header',
    )
    expect(panel(trigger)).toHaveClass('global-body', 'item-body')
    expect(icon).toHaveBeenLastCalledWith({
      key: 'first',
      expanded: false,
      disabled: false,
      direction: 'rtl',
    })
    fireEvent.click(trigger)
    expect(icon).toHaveBeenLastCalledWith({
      key: 'first',
      expanded: true,
      disabled: false,
      direction: 'rtl',
    })
    expect(
      screen.queryByRole('button', { name: /打开/ }),
    ).not.toBeInTheDocument()
  })
})
