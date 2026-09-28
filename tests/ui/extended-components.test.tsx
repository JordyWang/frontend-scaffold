import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  Affix,
  Anchor,
  Avatar,
  AutoComplete,
  Cascader,
  Breadcrumb,
  Carousel,
  Collapse,
  Descriptions,
  DatePicker,
  Dropdown,
  FloatButton,
  InputNumber,
  Menu,
  Popconfirm,
  Popover,
  Progress,
  Result,
  Space,
  Steps,
  Slider,
  Statistic,
  Timeline,
  TimePicker,
  Tree,
  Tooltip,
  Upload,
} from '@/shared/ui'

describe('Ant Design-inspired shared components', () => {
  it('renders a semantic breadcrumb with a current page', () => {
    render(
      <Breadcrumb
        items={[{ title: '首页', href: '/' }, { title: '当前页面' }]}
      />,
    )
    expect(
      screen.getByRole('navigation', { name: '面包屑导航' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '首页' })).toHaveAttribute(
      'href',
      '/',
    )
    expect(screen.getByText('当前页面')).toHaveAttribute('aria-current', 'page')
  })

  it('pauses carousel rotation when focus enters and resumes on request', () => {
    vi.useFakeTimers()
    try {
      render(<Carousel items={['第一张', '第二张']} autoplay interval={1000} />)
      const carousel = screen.getByRole('region', { name: '轮播内容' })
      const status = carousel.querySelector('.ui-carousel__status')
      expect(status).toHaveAttribute('aria-live', 'off')
      act(() => vi.advanceTimersByTime(1000))
      expect(screen.getByText('第二张')).toBeVisible()

      act(() => screen.getByRole('button', { name: '停止自动播放' }).focus())
      expect(status).toHaveAttribute('aria-live', 'polite')
      act(() => vi.advanceTimersByTime(3000))
      expect(screen.getByText('第二张')).toBeVisible()

      fireEvent.click(screen.getByRole('button', { name: '开始自动播放' }))
      expect(status).toHaveAttribute('aria-live', 'off')
      act(() => vi.advanceTimersByTime(1000))
      expect(screen.getByText('第一张')).toBeVisible()
    } finally {
      vi.useRealTimers()
    }
  })

  it('navigates nested menu items while skipping disabled entries', () => {
    const onSelect = vi.fn()
    render(
      <Menu
        onSelect={onSelect}
        items={[
          {
            key: 'root',
            label: '根菜单',
            children: [
              { key: 'disabled', label: '禁用项', disabled: true },
              {
                key: 'nested',
                label: '嵌套菜单',
                children: [{ key: 'leaf', label: '叶子项' }],
              },
            ],
          },
          { key: 'other', label: '其他菜单' },
        ]}
      />,
    )
    const root = screen.getByRole('menuitem', { name: '根菜单' })
    expect(root).toHaveAttribute('tabindex', '0')
    root.focus()
    fireEvent.keyDown(root, { key: 'ArrowRight' })
    expect(root).toHaveAttribute('aria-expanded', 'true')
    const nested = screen.getByRole('menuitem', { name: '嵌套菜单' })
    fireEvent.keyDown(root, { key: 'ArrowDown' })
    expect(nested).toHaveFocus()
    expect(nested).toHaveAttribute('tabindex', '0')
    expect(root).toHaveAttribute('tabindex', '-1')
    fireEvent.keyDown(nested, { key: 'ArrowRight' })
    expect(nested).toHaveAttribute('aria-expanded', 'true')
    const leaf = screen.getByRole('menuitem', { name: '叶子项' })
    fireEvent.keyDown(nested, { key: 'ArrowRight' })
    expect(leaf).toHaveFocus()
    fireEvent.keyDown(leaf, { key: 'ArrowLeft' })
    expect(nested).toHaveFocus()
    fireEvent.click(nested)
    expect(onSelect).toHaveBeenCalledWith('nested')
    expect(nested).toHaveAttribute('aria-selected', 'true')
  })

  it('supports controlled menu expansion', () => {
    const onExpand = vi.fn()
    const items = [
      {
        key: 'root',
        label: '根菜单',
        children: [{ key: 'child', label: '子菜单' }],
      },
    ]
    const { rerender } = render(
      <Menu items={items} expandedKeys={[]} onExpand={onExpand} />,
    )
    const root = screen.getByRole('menuitem', { name: '根菜单' })
    fireEvent.keyDown(root, { key: 'ArrowRight' })
    expect(onExpand).toHaveBeenCalledWith(['root'])
    expect(
      screen.queryByRole('menuitem', { name: '子菜单' }),
    ).not.toBeInTheDocument()
    rerender(<Menu items={items} expandedKeys={['root']} onExpand={onExpand} />)
    expect(screen.getByRole('menuitem', { name: '子菜单' })).toBeInTheDocument()
  })

  it('keeps one menu item in the tab order', () => {
    render(
      <Menu
        items={[
          { key: 'one', label: '第一项' },
          { key: 'disabled', label: '禁用项', disabled: true },
          { key: 'two', label: '第二项' },
        ]}
      />,
    )
    expect(screen.getByRole('menuitem', { name: '第一项' })).toHaveAttribute(
      'tabindex',
      '0',
    )
    expect(screen.getByRole('menuitem', { name: '禁用项' })).toHaveAttribute(
      'tabindex',
      '-1',
    )
    expect(screen.getByRole('menuitem', { name: '第二项' })).toHaveAttribute(
      'tabindex',
      '-1',
    )
  })

  it('respects reduced motion until carousel rotation is requested', () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    try {
      render(<Carousel items={['第一张', '第二张']} autoplay interval={1000} />)
      act(() => vi.advanceTimersByTime(3000))
      expect(screen.getByText('第一张')).toBeVisible()
      fireEvent.click(screen.getByRole('button', { name: '开始自动播放' }))
      act(() => vi.advanceTimersByTime(1000))
      expect(screen.getByText('第二张')).toBeVisible()
    } finally {
      vi.unstubAllGlobals()
      vi.useRealTimers()
    }
  })

  it('reports step status and supports keyboard-activated changes', () => {
    const onChange = vi.fn()
    render(
      <Steps
        current={1}
        onChange={onChange}
        items={[{ title: '选择' }, { title: '确认' }, { title: '完成' }]}
      />,
    )
    expect(
      screen.getByRole('navigation', { name: '步骤进度' }),
    ).toBeInTheDocument()
    const steps = screen.getAllByRole('button')
    fireEvent.keyDown(steps[2], { key: 'Enter' })
    fireEvent.click(steps[2])
    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('clamps progress values and exposes the progressbar contract', () => {
    render(<Progress percent={140} label="上传进度" />)
    expect(
      screen.getByRole('progressbar', { name: '上传进度' }),
    ).toHaveAttribute('aria-valuenow', '100')
  })

  it('toggles collapse panels and preserves disabled items', () => {
    const onChange = vi.fn()
    render(
      <Collapse
        defaultActiveKey={['details']}
        onChange={onChange}
        items={[
          { key: 'details', label: '详情', children: '内容' },
          {
            key: 'disabled',
            label: '不可用',
            children: '隐藏',
            disabled: true,
          },
        ]}
      />,
    )
    expect(screen.getByText('内容')).toBeVisible()
    const trigger = screen.getByRole('button', { name: '详情' })
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(
      document.getElementById(trigger.getAttribute('aria-controls') ?? ''),
    ).toHaveAttribute('hidden')
    expect(onChange).toHaveBeenCalledWith([])
    expect(screen.getByRole('button', { name: '不可用' })).toBeDisabled()
  })

  it('keeps descriptions and avatars named on narrow layouts', () => {
    render(
      <>
        <Avatar label="团队头像">A</Avatar>
        <Descriptions
          title="任务详情"
          bordered
          items={[{ key: 'status', label: '状态', children: '已完成' }]}
        />
        <Space split="/">
          <span>一</span>
          <span>二</span>
        </Space>
        <Result status="success" title="完成" />
      </>,
    )
    expect(screen.getByRole('img', { name: '团队头像' })).toHaveTextContent('A')
    expect(screen.getByText('状态')).toBeInTheDocument()
    expect(screen.getByText('已完成')).toBeInTheDocument()
    expect(screen.getByText('/')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '完成' })).toBeInTheDocument()
  })

  it('uses native keyboard-friendly number and range controls', () => {
    const onNumberChange = vi.fn()
    const onSliderChange = vi.fn()
    render(
      <>
        <InputNumber
          aria-label="数量"
          min={1}
          max={5}
          defaultValue={2}
          onChange={onNumberChange}
        />
        <Slider
          aria-label="音量"
          min={0}
          max={10}
          defaultValue={4}
          onChange={onSliderChange}
        />
      </>,
    )
    const number = screen.getByRole('spinbutton', { name: '数量' })
    fireEvent.change(number, { target: { value: '9' } })
    fireEvent.blur(number)
    expect(onNumberChange).toHaveBeenLastCalledWith(5)
    const slider = screen.getByRole('slider', { name: '音量' })
    fireEvent.change(slider, { target: { value: '7' } })
    expect(onSliderChange).toHaveBeenCalledWith(7)
  })

  it('keeps date, time, autocomplete, cascader and upload inputs semantic', () => {
    const onFiles = vi.fn()
    const onPathChange = vi.fn()
    render(
      <>
        <DatePicker aria-label="开始日期" defaultValue="2026-09-28" />
        <TimePicker aria-label="开始时间" defaultValue="09:30" />
        <AutoComplete
          aria-label="城市"
          options={[{ value: '上海' }, { value: '北京' }]}
        />
        <Cascader
          label="地区"
          onChange={onPathChange}
          options={[
            {
              value: 'cn',
              label: '中国',
              children: [{ value: 'sh', label: '上海' }],
            },
          ]}
        />
        <Upload onFiles={onFiles} accept="image/*">
          上传
        </Upload>
      </>,
    )
    expect(screen.getByLabelText('开始日期')).toHaveValue('2026-09-28')
    expect(screen.getByLabelText('开始时间')).toHaveValue('09:30')
    expect(screen.getByRole('combobox', { name: '城市' })).toHaveAttribute(
      'list',
    )
    const region = screen.getByRole('combobox', { name: '地区' })
    fireEvent.change(region, { target: { value: 'cn' } })
    expect(onPathChange).toHaveBeenCalledWith(['cn'])
    expect(screen.getByRole('button', { name: '上传' })).toBeInTheDocument()
  })

  it('renders readable statistics and an ordered timeline', () => {
    render(
      <>
        <Statistic title="完成率" value={0.987} precision={2} suffix="%" />
        <Timeline
          items={[
            { key: 'one', title: '提交', children: '已提交', color: 'success' },
            { key: 'two', title: '处理', children: '进行中' },
          ]}
        />
      </>,
    )
    expect(screen.getByText('0.99')).toBeInTheDocument()
    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '提交' })).toBeInTheDocument()
  })

  it('keeps overlay interactions keyboard accessible', async () => {
    const onSelect = vi.fn()
    const onConfirm = vi.fn()
    render(
      <>
        <Dropdown
          trigger={<button type="button">更多</button>}
          items={[
            { key: 'one', label: '第一项' },
            { key: 'two', label: '第二项', onSelect },
          ]}
        />
        <Popover content="上下文内容">
          <button type="button">说明</button>
        </Popover>
        <Tooltip title="键盘提示">
          <button type="button">提示</button>
        </Tooltip>
        <Popconfirm title="确认？" onConfirm={onConfirm}>
          <button type="button">删除</button>
        </Popconfirm>
        <FloatButton label="回到顶部">↑</FloatButton>
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: '更多' }))
    expect(screen.getByRole('menu', { name: '菜单' })).toBeVisible()
    fireEvent.click(screen.getByRole('menuitem', { name: '第二项' }))
    expect(onSelect).toHaveBeenCalledOnce()

    fireEvent.click(screen.getByRole('button', { name: '说明' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('上下文内容')
    fireEvent.click(screen.getByRole('button', { name: '说明' }))
    fireEvent.focus(screen.getByRole('button', { name: '提示' }))
    expect(screen.getByRole('tooltip')).toHaveTextContent('键盘提示')

    fireEvent.click(screen.getByRole('button', { name: '删除' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('确认？')
    fireEvent.click(screen.getByRole('button', { name: '确定' }))
    expect(onConfirm).toHaveBeenCalledOnce()
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(screen.getByRole('button', { name: '回到顶部' })).toBeInTheDocument()
  })

  it('exposes navigation, carousel and tree semantics', () => {
    const onSelect = vi.fn()
    render(
      <>
        <Menu
          onSelect={onSelect}
          items={[
            { key: 'home', label: '首页' },
            { key: 'settings', label: '设置' },
          ]}
        />
        <Anchor links={[{ href: '#one', title: '第一节' }]} activeHref="#one" />
        <Affix offsetTop={12}>固定内容</Affix>
        <Carousel items={['一', '二']} />
        <Tree
          defaultExpandedKeys={['root']}
          treeData={[
            {
              key: 'root',
              title: '根节点',
              children: [{ key: 'leaf', title: '叶子' }],
            },
          ]}
        />
      </>,
    )
    fireEvent.click(screen.getByRole('menuitem', { name: '设置' }))
    expect(onSelect).toHaveBeenCalledWith('settings')
    expect(
      screen.getByRole('navigation', { name: '页内导航' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '轮播内容' })).toHaveAttribute(
      'aria-roledescription',
      'carousel',
    )
    expect(screen.getByRole('tree', { name: '树形导航' })).toBeInTheDocument()
    expect(screen.getByRole('treeitem', { name: '叶子' })).toBeInTheDocument()
  })

  it('moves tree focus with arrows and reports expansion', () => {
    const onExpand = vi.fn()
    const onSelect = vi.fn()
    render(
      <Tree
        defaultExpandedKeys={['root']}
        onExpand={onExpand}
        onSelect={onSelect}
        treeData={[
          {
            key: 'root',
            title: '根节点',
            children: [
              { key: 'one', title: '第一项' },
              { key: 'disabled', title: '禁用项', disabled: true },
              { key: 'two', title: '第二项' },
            ],
          },
        ]}
      />,
    )
    const root = screen.getByRole('treeitem', { name: '根节点' })
    const first = screen.getByRole('treeitem', { name: '第一项' })
    const second = screen.getByRole('treeitem', { name: '第二项' })
    expect(root).toHaveAttribute('tabindex', '0')
    expect(first).toHaveAttribute('tabindex', '-1')
    root.focus()
    fireEvent.keyDown(root, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(first)
    expect(first).toHaveAttribute('tabindex', '0')
    fireEvent.keyDown(first, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(second)
    fireEvent.keyDown(second, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('two')
    fireEvent.keyDown(second, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(first)
    fireEvent.keyDown(first, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(root)
    fireEvent.keyDown(root, { key: 'ArrowLeft' })
    expect(onExpand).toHaveBeenCalledWith([])
    fireEvent.keyDown(root, { key: 'ArrowRight' })
    expect(onExpand).toHaveBeenLastCalledWith(['root'])
    fireEvent.click(screen.getByRole('treeitem', { name: '第一项' }))
    expect(onSelect).toHaveBeenLastCalledWith('one')
    expect(onSelect).toHaveBeenCalledTimes(2)
    fireEvent.click(root.querySelector('[data-tree-toggle]')!)
    expect(onExpand).toHaveBeenLastCalledWith([])
  })

  it('keeps tree expansion controlled by expandedKeys', () => {
    const onExpand = vi.fn()
    const treeData = [
      {
        key: 'root',
        title: '根节点',
        children: [{ key: 'child', title: '子节点' }],
      },
    ]
    const view = (expandedKeys: string[]) => (
      <>
        <button type="button">树外按钮</button>
        <Tree
          treeData={treeData}
          expandedKeys={expandedKeys}
          onExpand={onExpand}
        />
      </>
    )
    const { rerender } = render(view([]))
    const root = screen.getByRole('treeitem', { name: '根节点' })
    root.focus()
    fireEvent.keyDown(root, { key: 'ArrowRight' })
    expect(onExpand).toHaveBeenCalledWith(['root'])
    expect(root).toHaveAttribute('aria-expanded', 'false')
    rerender(view(['root']))
    const child = screen.getByRole('treeitem', { name: '子节点' })
    child.focus()
    rerender(view([]))
    expect(root).toHaveFocus()

    rerender(view(['root']))
    screen.getByRole('treeitem', { name: '子节点' }).focus()
    const outside = screen.getByRole('button', { name: '树外按钮' })
    outside.focus()
    rerender(view([]))
    expect(outside).toHaveFocus()
  })
})
