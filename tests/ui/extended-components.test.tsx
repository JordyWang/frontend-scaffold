import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { useState } from 'react'
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
  Checkbox,
  ColorPicker,
  ConfigProvider,
  Descriptions,
  DatePicker,
  DateRangePicker,
  Dropdown,
  FloatButton,
  Form,
  FormField,
  FormItem,
  InputNumber,
  Menu,
  Popconfirm,
  Popover,
  Progress,
  Result,
  Rate,
  Segmented,
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
  it('applies the provider size to native data-entry controls', () => {
    render(
      <ConfigProvider componentSize="large">
        <InputNumber aria-label="大号数字" defaultValue={1} />
        <DatePicker aria-label="大号日期" />
        <TimePicker aria-label="大号时间" />
        <AutoComplete aria-label="大号自动完成" options={[]} />
        <Cascader label="大号级联" options={[{ value: 'cn', label: '中国' }]} />
        <ColorPicker aria-label="大号颜色" />
      </ConfigProvider>,
    )

    expect(
      screen.getByRole('spinbutton', { name: '大号数字' }).parentElement,
    ).toHaveClass('min-h-12')
    expect(screen.getByLabelText('大号日期')).toHaveClass('min-h-12')
    expect(screen.getByLabelText('大号时间')).toHaveClass('min-h-12')
    expect(screen.getByRole('combobox', { name: '大号自动完成' })).toHaveClass(
      'min-h-12',
    )
    expect(screen.getByRole('combobox', { name: '大号级联' })).toHaveClass(
      'min-h-12',
    )
    expect(screen.getByLabelText('大号颜色')).toHaveClass('size-12')
  })

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

  it('keeps breadcrumb text inert and activates only actionable items', () => {
    const onClick = vi.fn()
    render(
      <Breadcrumb
        items={[
          { title: '纯文本' },
          { title: '跳转', href: '#target', onClick },
          { title: '执行', onClick },
          { title: '不可用', href: '/blocked', disabled: true },
          { title: '当前页' },
        ]}
      />,
    )
    expect(screen.getByText('纯文本')).not.toHaveAttribute('role', 'button')
    expect(screen.queryByRole('button', { name: '纯文本' })).toBeNull()
    expect(screen.getByText('不可用')).toHaveAttribute('aria-disabled', 'true')
    expect(screen.queryByRole('link', { name: '不可用' })).toBeNull()
    fireEvent.click(screen.getByRole('link', { name: '跳转' }))
    fireEvent.click(screen.getByRole('button', { name: '执行' }))
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('collapses long breadcrumb paths while keeping hidden items accessible on expansion', () => {
    const onClick = vi.fn()
    const onExpandedChange = vi.fn()
    render(
      <Breadcrumb
        maxItems={3}
        onExpandedChange={onExpandedChange}
        items={[
          { title: '首页', href: '#home' },
          { title: '项目', href: '#projects' },
          { title: '详情', onClick },
          { title: '版本', disabled: true },
          { title: '记录', href: '#record' },
          { title: '当前页' },
        ]}
      />,
    )
    const expand = screen.getByRole('button', {
      name: '展开完整路径，隐藏 3 项',
    })
    expect(expand).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('link', { name: '项目' })).toBeNull()
    expect(screen.getByRole('link', { name: '记录' })).toBeInTheDocument()
    const controlledIds = expand.getAttribute('aria-controls')?.split(' ')
    expect(controlledIds).toHaveLength(3)
    for (const id of controlledIds ?? [])
      expect(document.getElementById(id)).toHaveAttribute('hidden')

    expand.focus()
    fireEvent.click(expand)
    expect(onExpandedChange).toHaveBeenCalledWith(true)
    expect(expand).toHaveFocus()
    expect(expand).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: '项目' })).toHaveAttribute(
      'href',
      '#projects',
    )
    fireEvent.click(screen.getByRole('button', { name: '详情' }))
    expect(onClick).toHaveBeenCalledOnce()
    expect(screen.getByText('版本')).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(screen.getByRole('button', { name: '收起中间路径' }))
    expect(onExpandedChange).toHaveBeenLastCalledWith(false)
    expect(screen.queryByRole('link', { name: '项目' })).toBeNull()
  })

  it('lets the caller accept or reject breadcrumb expansion', () => {
    const onExpandedChange = vi.fn()
    const items = [
      { title: '根', href: '#root' },
      { title: '一层', href: '#one' },
      { title: '二层', href: '#two' },
      { title: '三层', href: '#three' },
      { title: '当前' },
    ]
    const { rerender } = render(
      <Breadcrumb
        items={items}
        maxItems={3}
        expanded={false}
        onExpandedChange={onExpandedChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /展开完整路径/ }))
    expect(onExpandedChange).toHaveBeenCalledWith(true)
    expect(screen.queryByRole('link', { name: '一层' })).toBeNull()
    rerender(
      <Breadcrumb
        items={items}
        maxItems={3}
        expanded
        onExpandedChange={onExpandedChange}
      />,
    )
    expect(screen.getByRole('link', { name: '一层' })).toBeInTheDocument()
  })

  it('pauses carousel rotation when focus enters and resumes on request', () => {
    vi.useFakeTimers()
    try {
      render(<Carousel items={['第一张', '第二张']} autoplay interval={1000} />)
      const carousel = screen.getByRole('region', { name: '轮播内容' })
      const status = carousel.querySelector('[data-carousel-status]')
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

  it('keeps descendants of a disabled submenu unavailable even if expanded externally', () => {
    const onSelect = vi.fn()
    render(
      <Menu
        expandedKeys={['disabled-parent']}
        onSelect={onSelect}
        items={[
          {
            key: 'disabled-parent',
            label: '不可用分组',
            disabled: true,
            children: [{ key: 'child', label: '隐藏子项' }],
          },
          { key: 'available', label: '可用项' },
        ]}
      />,
    )
    expect(screen.queryByRole('menuitem', { name: '隐藏子项' })).toBeNull()
    const disabled = screen.getByRole('menuitem', { name: '不可用分组' })
    expect(disabled).toHaveAttribute('aria-expanded', 'false')
    fireEvent.keyDown(disabled, { key: 'ArrowRight' })
    expect(screen.getByRole('menuitem', { name: '可用项' })).toHaveAttribute(
      'tabindex',
      '0',
    )
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('enters a horizontal submenu with ArrowDown and closes it after leaf selection', () => {
    const onSelect = vi.fn()
    const onExpand = vi.fn()
    render(
      <Menu
        mode="horizontal"
        onSelect={onSelect}
        onExpand={onExpand}
        items={[
          {
            key: 'catalog',
            label: '目录',
            children: [
              { key: 'all', label: '全部' },
              { key: 'disabled', label: '不可选', disabled: true },
              { key: 'guides', label: '指南' },
            ],
          },
        ]}
      />,
    )
    const catalog = screen.getByRole('menuitem', { name: '目录' })
    catalog.focus()
    fireEvent.keyDown(catalog, { key: 'ArrowDown' })
    expect(onExpand).toHaveBeenCalledWith(['catalog'])
    const all = screen.getByRole('menuitem', { name: '全部' })
    expect(all).toHaveFocus()
    fireEvent.keyDown(all, { key: 'ArrowDown' })
    const guides = screen.getByRole('menuitem', { name: '指南' })
    expect(guides).toHaveFocus()
    fireEvent.click(guides)
    expect(onSelect).toHaveBeenCalledWith('guides')
    expect(onExpand).toHaveBeenLastCalledWith([])
    expect(screen.queryByRole('menuitem', { name: '指南' })).toBeNull()
    expect(catalog).toHaveFocus()
  })

  it('waits for controlled horizontal expansion to accept a selected leaf close', () => {
    const items = [
      {
        key: 'catalog',
        label: '目录',
        children: [{ key: 'all', label: '全部' }],
      },
    ]
    const onExpand = vi.fn()
    const { rerender } = render(
      <Menu
        mode="horizontal"
        items={items}
        expandedKeys={['catalog']}
        onExpand={onExpand}
      />,
    )
    const child = screen.getByRole('menuitem', { name: '全部' })
    child.focus()
    fireEvent.click(child)
    expect(onExpand).toHaveBeenLastCalledWith([])
    expect(child).toBeInTheDocument()
    rerender(
      <Menu
        mode="horizontal"
        items={items}
        expandedKeys={[]}
        onExpand={onExpand}
      />,
    )
    expect(screen.queryByRole('menuitem', { name: '全部' })).toBeNull()
    expect(screen.getByRole('menuitem', { name: '目录' })).toHaveFocus()
  })

  it('restores menu focus when controlled expansion hides the focused item', () => {
    const items = [
      {
        key: 'root',
        label: '根菜单',
        children: [{ key: 'child', label: '子菜单' }],
      },
    ]
    const { rerender } = render(<Menu items={items} expandedKeys={['root']} />)
    const root = screen.getByRole('menuitem', { name: '根菜单' })
    const child = screen.getByRole('menuitem', { name: '子菜单' })
    child.focus()
    expect(child).toHaveFocus()
    rerender(<Menu items={items} expandedKeys={[]} />)
    expect(root).toHaveFocus()
  })

  it('reverses horizontal menu traversal and submenu keys in RTL', () => {
    render(
      <ConfigProvider direction="rtl">
        <Menu
          mode="horizontal"
          items={[
            {
              key: 'root',
              label: '根菜单',
              children: [{ key: 'child', label: '子菜单' }],
            },
            { key: 'other', label: '其他菜单' },
          ]}
        />
      </ConfigProvider>,
    )
    const root = screen.getByRole('menuitem', { name: '根菜单' })
    root.focus()
    fireEvent.keyDown(root, { key: 'ArrowLeft' })
    expect(root).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(root, { key: 'ArrowLeft' })
    expect(screen.getByRole('menuitem', { name: '子菜单' })).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('menuitem', { name: '子菜单' }), {
      key: 'ArrowRight',
    })
    expect(root).toHaveFocus()
  })

  it('keeps horizontal popups linked to their trigger and restores focus on Escape', () => {
    const onExpand = vi.fn()
    render(
      <>
        <Menu
          mode="horizontal"
          defaultExpandedKeys={['root']}
          onExpand={onExpand}
          items={[
            {
              key: 'root',
              label: '根菜单',
              children: [{ key: 'child', label: '子菜单' }],
            },
          ]}
        />
        <button type="button">菜单外</button>
      </>,
    )
    const root = screen.getByRole('menuitem', { name: '根菜单' })
    const child = screen.getByRole('menuitem', { name: '子菜单' })
    expect(root).toHaveAttribute('aria-controls', child.closest('ul')?.id)
    child.focus()
    fireEvent.keyDown(child, { key: 'Escape' })
    expect(root).toHaveFocus()
    expect(screen.queryByRole('menuitem', { name: '子菜单' })).toBeNull()
    expect(onExpand).toHaveBeenLastCalledWith([])

    fireEvent.click(root)
    expect(screen.getByRole('menuitem', { name: '子菜单' })).toBeInTheDocument()
    fireEvent.pointerDown(screen.getByRole('button', { name: '菜单外' }))
    expect(screen.queryByRole('menuitem', { name: '子菜单' })).toBeNull()
  })

  it('restores horizontal menu focus when controlled expansion closes a portal', () => {
    const items = [
      {
        key: 'root',
        label: '根菜单',
        children: [{ key: 'child', label: '子菜单' }],
      },
    ]
    const { rerender } = render(
      <Menu mode="horizontal" items={items} expandedKeys={['root']} />,
    )
    screen.getByRole('menuitem', { name: '子菜单' }).focus()
    rerender(<Menu mode="horizontal" items={items} expandedKeys={[]} />)
    expect(screen.getByRole('menuitem', { name: '根菜单' })).toHaveFocus()
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

  it('exposes menu orientation and disabled state to assistive technology', () => {
    render(
      <Menu
        mode="horizontal"
        items={[{ key: 'disabled', label: '禁用项', disabled: true }]}
      />,
    )
    expect(screen.getByRole('menu')).toHaveAttribute(
      'aria-orientation',
      'horizontal',
    )
    expect(screen.getByRole('menuitem', { name: '禁用项' })).toHaveAttribute(
      'aria-disabled',
      'true',
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

  it('updates uncontrolled steps and leaves controlled steps to their owner', () => {
    const onChange = vi.fn()
    const items = [{ title: '准备' }, { title: '完成' }]
    const { rerender } = render(
      <Steps items={items} defaultCurrent={0} onChange={onChange} />,
    )
    fireEvent.click(screen.getByRole('button', { name: '完成' }))
    expect(onChange).toHaveBeenCalledWith(1)
    expect(screen.getByText('完成').closest('li')).toHaveAttribute(
      'aria-current',
      'step',
    )

    rerender(<Steps items={items} current={0} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: '完成' }))
    expect(screen.getByText('准备').closest('li')).toHaveAttribute(
      'aria-current',
      'step',
    )

    rerender(<Steps items={items} current={Number.NaN} />)
    expect(screen.getByText('准备').closest('li')).toHaveAttribute(
      'aria-current',
      'step',
    )
  })

  it('exposes step status descriptions and disabled semantics', () => {
    const { rerender } = render(
      <Steps
        current={1}
        items={[
          { title: '准备', status: 'finish' },
          { title: '处理中' },
          { title: '已禁用', disabled: true },
        ]}
      />,
    )
    const current = screen.getByText('处理中').closest('li')
    expect(current).toHaveAttribute('aria-current', 'step')
    expect(current?.querySelector('[id$="-status"]')).toHaveTextContent(
      '进行中',
    )
    const disabled = screen.getByText('已禁用').closest('li')
    expect(disabled).toHaveAttribute('aria-disabled', 'true')

    rerender(
      <Steps
        current={1}
        onChange={() => undefined}
        direction="vertical"
        items={[
          { title: '准备' },
          { title: '处理中' },
          { title: '已禁用', disabled: true },
        ]}
      />,
    )
    expect(screen.getByRole('button', { name: '已禁用' })).toBeDisabled()
    expect(screen.getByRole('navigation', { name: '步骤进度' })).toHaveClass(
      'overflow-visible',
    )
  })

  it('shows bounded progress only on the active processing step in small size', () => {
    const items = [
      { title: '上传文件' },
      { title: '分析媒体' },
      { title: '查看结果' },
    ]
    const { rerender } = render(
      <Steps items={items} size="small" current={1} percent={68} />,
    )
    const steps = screen.getByRole('navigation', { name: '步骤进度' })
    expect(steps).toHaveAttribute('data-ui-steps-size', 'small')
    expect(screen.getByText('分析媒体').closest('li')).toHaveAttribute(
      'data-ui-step-percent',
      '68',
    )
    expect(screen.getByText('分析媒体').closest('li')).toHaveTextContent(
      '进行中，已完成 68%',
    )
    expect(steps.querySelectorAll('svg circle')).toHaveLength(2)

    rerender(<Steps items={items} size="small" current={2} percent={150} />)
    expect(screen.getByText('分析媒体').closest('li')).not.toHaveAttribute(
      'data-ui-step-percent',
    )
    expect(screen.getByText('查看结果').closest('li')).toHaveAttribute(
      'data-ui-step-percent',
      '100',
    )

    rerender(
      <Steps
        items={items}
        size="small"
        current={2}
        status="error"
        percent={68}
      />,
    )
    expect(steps.querySelector('svg')).not.toBeInTheDocument()
    expect(screen.getByText('查看结果').closest('li')).toHaveTextContent('错误')

    rerender(<Steps items={items} current={1} percent={Number.NaN} />)
    expect(steps.querySelector('svg')).not.toBeInTheDocument()
  })

  it('inherits small step size from ConfigProvider unless size is explicit', () => {
    const items = [{ title: '准备' }]
    render(
      <ConfigProvider componentSize="small">
        <Steps items={items} label="继承尺寸" />
        <Steps items={items} label="显式尺寸" size="default" />
      </ConfigProvider>,
    )
    expect(
      screen.getByRole('navigation', { name: '继承尺寸' }),
    ).toHaveAttribute('data-ui-steps-size', 'small')
    expect(
      screen.getByRole('navigation', { name: '显式尺寸' }),
    ).toHaveAttribute('data-ui-steps-size', 'default')
  })

  it('clamps progress values and exposes the progressbar contract', () => {
    render(<Progress percent={140} label="上传进度" />)
    expect(
      screen.getByRole('progressbar', { name: '上传进度' }),
    ).toHaveAttribute('aria-valuenow', '100')
  })

  it('renders linear progress as partially filled semantic steps', () => {
    render(
      <Progress percent={62} steps={5} status="active" label="分段上传进度" />,
    )
    const progress = screen.getByRole('progressbar', { name: '分段上传进度' })
    expect(progress).toHaveAttribute('aria-valuenow', '62')
    expect(progress).toHaveAttribute('data-ui-progress-steps', '5')
    expect(progress.querySelectorAll('[data-ui-progress-step]')).toHaveLength(5)
    expect(
      progress.querySelectorAll('[data-ui-progress-step-value="100"]'),
    ).toHaveLength(3)
    expect(
      progress.querySelector('[data-ui-progress-step-value="10"]'),
    ).toBeInTheDocument()
    expect(
      progress.querySelector('[data-ui-progress-step-value="0"]'),
    ).toBeInTheDocument()
  })

  it('renders circular steps with a single accessible value and partial segment', () => {
    render(
      <Progress
        type="circle"
        percent={62}
        steps={{ count: 5, gap: 4 }}
        label="圆环上传进度"
      />,
    )
    const progress = screen.getByRole('progressbar', { name: '圆环上传进度' })
    expect(progress).toHaveAttribute('aria-valuenow', '62')
    expect(progress).toHaveAttribute('data-ui-progress-steps', '5')
    expect(progress).toHaveAttribute('data-ui-progress-step-gap', '4')
    expect(progress.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(
      Array.from(progress.querySelectorAll('[data-ui-progress-step]')).map(
        (step) => step.getAttribute('data-ui-progress-step-value'),
      ),
    ).toEqual(['100', '100', '100', '10', '0'])
    expect(progress.querySelectorAll('[data-ui-progress-fill]')).toHaveLength(4)
  })

  it('clamps dashboard geometry and resolves logical gap placement in RTL', () => {
    render(
      <>
        <ConfigProvider direction="rtl">
          <Progress
            type="dashboard"
            percent={25}
            steps={{ count: 6, gap: 999 }}
            gapDegree={500}
            gapPlacement="start"
            strokeWidth={999}
            label="RTL 仪表盘"
          />
        </ConfigProvider>
        <Progress
          type="dashboard"
          percent={25}
          steps={{ count: 6, gap: 999 }}
          gapDegree={500}
          gapPlacement="end"
          strokeWidth={999}
          label="LTR 仪表盘"
        />
        <Progress type="dashboard" gapDegree={-20} label="无缺口仪表盘" />
      </>,
    )
    const rtl = screen.getByRole('progressbar', { name: 'RTL 仪表盘' })
    const ltr = screen.getByRole('progressbar', { name: 'LTR 仪表盘' })
    expect(rtl).toHaveAttribute('data-ui-progress-gap-degree', '295')
    expect(rtl.querySelectorAll('[data-ui-progress-step]')).toHaveLength(6)
    expect(Number(rtl.getAttribute('data-ui-progress-step-gap'))).toBeLessThan(
      999,
    )
    expect(
      rtl
        .querySelector('[data-ui-progress-track]')
        ?.getAttribute('stroke-width'),
    ).toBe('48')
    expect(
      rtl.querySelector('[data-ui-progress-track]')?.getAttribute('d'),
    ).toBe(ltr.querySelector('[data-ui-progress-track]')?.getAttribute('d'))
    expect(
      Array.from(rtl.querySelectorAll('[data-ui-progress-step]')).map((step) =>
        step.getAttribute('data-ui-progress-step-value'),
      ),
    ).toEqual(['100', '50', '0', '0', '0', '0'])
    expect(
      screen.getByRole('progressbar', { name: '无缺口仪表盘' }),
    ).toHaveAttribute('data-ui-progress-gap-degree', '0')
  })

  it('normalizes invalid progress and slider values', () => {
    render(
      <>
        <Progress percent={Number.NaN} strokeWidth={0} />
        <Slider aria-label="音量" min={0} max={10} value={99} step={0} />
      </>,
    )
    expect(screen.getByRole('progressbar', { name: '进度' })).toHaveAttribute(
      'aria-valuenow',
      '0',
    )
    const slider = screen.getByRole('slider', { name: '音量' })
    expect(slider).toHaveValue('10')
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

  it('keeps accordion mode to one panel and uses safe DOM ids for arbitrary keys', () => {
    const onChange = vi.fn()
    const items = [
      { key: 'first key', label: '第一项', children: '第一项内容' },
      { key: 'second', label: '第二项', children: '第二项内容' },
    ]
    const { rerender } = render(
      <Collapse
        items={items}
        accordion
        defaultActiveKey={['first key', 'second']}
        onChange={onChange}
      />,
    )
    const first = screen.getByRole('button', { name: '第一项' })
    const second = screen.getByRole('button', { name: '第二项' })
    expect(first).toHaveAttribute('aria-expanded', 'true')
    expect(second).toHaveAttribute('aria-expanded', 'false')
    expect(first.id).not.toMatch(/\s/)
    expect(first.getAttribute('aria-controls')).not.toMatch(/\s/)
    expect(
      document.getElementById(first.getAttribute('aria-controls') ?? ''),
    ).toHaveAttribute('aria-labelledby', first.id)

    fireEvent.click(second)
    expect(onChange).toHaveBeenLastCalledWith(['second'])
    expect(first).toHaveAttribute('aria-expanded', 'false')
    expect(second).toHaveAttribute('aria-expanded', 'true')

    rerender(
      <Collapse items={items} accordion activeKey={['first key', 'second']} />,
    )
    expect(first).toHaveAttribute('aria-expanded', 'true')
    expect(second).toHaveAttribute('aria-expanded', 'false')
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

  it('joins compact controls without removing their individual semantics', () => {
    render(
      <>
        <Space.Compact aria-label="紧凑工具栏">
          <button type="button">前缀</button>
          <button type="button">提交</button>
        </Space.Compact>
        <Space.Compact direction="vertical" aria-label="纵向工具栏" block>
          <button type="button">上方</button>
          <button type="button">下方</button>
        </Space.Compact>
      </>,
    )
    const horizontal = screen.getByRole('group', { name: '紧凑工具栏' })
    const vertical = screen.getByRole('group', { name: '纵向工具栏' })
    expect(horizontal).toHaveAttribute('data-ui-space-compact', '')
    expect(horizontal).toHaveClass('flex-row')
    expect(vertical).toHaveClass('flex-col', 'w-full')
    expect(
      within(horizontal).getByRole('button', { name: '提交' }),
    ).toBeVisible()
    expect(within(vertical).getByRole('button', { name: '下方' })).toBeVisible()
  })

  it('names the result region and exposes complex error details after actions', () => {
    const { rerender } = render(
      <Result
        status="error"
        title="提交失败"
        subTitle="请检查输入"
        extra={<button type="button">重新检查</button>}
      >
        <ul>
          <li>文件格式不受支持</li>
        </ul>
      </Result>,
    )
    const result = screen.getByRole('region', { name: '提交失败' })
    const heading = screen.getByRole('heading', { name: '提交失败' })
    expect(result).toHaveAttribute('aria-labelledby', heading.id)
    expect(result).toContainElement(screen.getByText('文件格式不受支持'))
    expect(result).toContainElement(
      screen.getByRole('button', { name: '重新检查' }),
    )
    expect(result.querySelector('[aria-hidden="true"]')).toBeInTheDocument()

    rerender(<Result status="success" title="提交完成" />)
    expect(screen.getByRole('region', { name: '提交完成' })).toBeInTheDocument()
    expect(screen.queryByText('文件格式不受支持')).not.toBeInTheDocument()
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

  it('supports precision, formatter/parser, step controls and native reset', async () => {
    const onChange = vi.fn(),
      onStep = vi.fn()
    render(
      <form aria-label="数字表单">
        <InputNumber
          aria-label="金额"
          defaultValue={1.2}
          min={0}
          max={2}
          step={0.1}
          precision={2}
          formatter={(value, info) =>
            info.userTyping
              ? info.input
              : value === undefined
                ? ''
                : '$' + value.toFixed(2)
          }
          parser={(value) => Number(value.replace('$', ''))}
          onChange={onChange}
          onStep={onStep}
          name="amount"
        />
      </form>,
    )
    const input = screen.getByRole('spinbutton', { name: '金额' })
    expect(input).toHaveValue('$1.20')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '$1.35' } })
    expect(input).toHaveValue('$1.35')
    expect(onChange).toHaveBeenLastCalledWith(1.35)
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    await waitFor(() => expect(input).toHaveValue('$1.45'))
    expect(onStep).toHaveBeenLastCalledWith(1.45, {
      offset: 0.1,
      type: 'up',
    })
    fireEvent.click(screen.getByRole('button', { name: '金额增加' }))
    await waitFor(() => expect(input).toHaveValue('$1.55'))
    fireEvent.change(input, { target: { value: '$1.75' } })
    fireEvent.blur(input)
    fireEvent.reset(screen.getByRole('form', { name: '数字表单' }))
    expect(input).toHaveValue('$1.20')
  })

  it('shares field variants and statuses across native data controls', () => {
    render(
      <>
        <InputNumber aria-label="填充数量" variant="filled" defaultValue={2} />
        <DatePicker
          aria-label="警告日期"
          variant="underlined"
          status="warning"
        />
        <TimePicker aria-label="错误时间" status="error" />
        <AutoComplete
          aria-label="无边框城市"
          variant="borderless"
          options={[]}
        />
        <DateRangePicker aria-label="错误日期范围" status="error" />
      </>,
    )
    expect(
      screen.getByRole('spinbutton', { name: '填充数量' }).parentElement,
    ).toHaveClass('bg-muted')
    expect(screen.getByLabelText('警告日期')).toHaveClass('border-b')
    expect(screen.getByLabelText('警告日期')).toHaveAttribute(
      'data-status',
      'warning',
    )
    expect(screen.getByLabelText('错误时间')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.getByRole('combobox', { name: '无边框城市' })).toHaveClass(
      'bg-transparent',
    )
    expect(screen.getByRole('group', { name: '错误日期范围' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it('keeps controlled numeric drafts editable and accepts an explicit empty value', () => {
    const onChange = vi.fn()
    function ControlledNumber() {
      const [value, setValue] = useState<number | undefined>(2)
      return (
        <>
          <InputNumber
            aria-label="受控数量"
            value={value}
            min={10}
            max={50}
            onChange={(next) => {
              onChange(next)
              setValue(next)
            }}
          />
          <button type="button" onClick={() => setValue(undefined)}>
            清空
          </button>
        </>
      )
    }
    render(<ControlledNumber />)
    const number = screen.getByRole('spinbutton', { name: '受控数量' })
    fireEvent.focus(number)
    fireEvent.change(number, { target: { value: '1' } })
    expect(number).toHaveValue(1)
    expect(onChange).toHaveBeenLastCalledWith(1)
    fireEvent.change(number, { target: { value: '12' } })
    expect(number).toHaveValue(12)
    expect(onChange).toHaveBeenLastCalledWith(12)
    fireEvent.blur(number)
    expect(number).toHaveValue(12)

    fireEvent.click(screen.getByRole('button', { name: '清空' }))
    expect(number).toHaveValue(null)
    fireEvent.focus(number)
    fireEvent.change(number, { target: { value: '60' } })
    expect(number).toHaveValue(60)
    fireEvent.blur(number)
    expect(number).toHaveValue(50)
    expect(onChange).toHaveBeenLastCalledWith(50)
  })

  it('supports controlled and uncontrolled segmented choices', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <Segmented
        aria-label="视图"
        defaultValue="list"
        onChange={onChange}
        options={[
          { value: 'list', label: '列表' },
          { value: 'grid', label: '网格' },
          { value: 'disabled', label: '不可用', disabled: true },
        ]}
      />,
    )
    expect(screen.getByRole('radio', { name: '列表' })).toBeChecked()
    fireEvent.click(screen.getByRole('radio', { name: '网格' }))
    expect(screen.getByRole('radio', { name: '网格' })).toBeChecked()
    expect(onChange).toHaveBeenCalledWith('grid')
    expect(screen.getByRole('radio', { name: '不可用' })).toBeDisabled()
    rerender(
      <Segmented
        aria-label="视图"
        value="list"
        options={[
          { value: 'list', label: '列表' },
          { value: 'grid', label: '网格' },
        ]}
      />,
    )
    expect(screen.getByRole('radio', { name: '列表' })).toBeChecked()
    fireEvent.click(screen.getByRole('radio', { name: '网格' }))
    expect(screen.getByRole('radio', { name: '列表' })).toBeChecked()
    rerender(
      <Segmented
        aria-label="视图"
        value={undefined}
        onChange={onChange}
        options={[
          { value: 'list', label: '列表' },
          { value: 'grid', label: '网格' },
        ]}
      />,
    )
    for (const radio of screen.getAllByRole('radio'))
      expect(radio).not.toBeChecked()
    fireEvent.click(screen.getByRole('radio', { name: '网格' }))
    expect(onChange).toHaveBeenLastCalledWith('grid')
    expect(screen.getByRole('radio', { name: '网格' })).not.toBeChecked()
  })

  it('falls back to an enabled segment when its uncontrolled choice disappears', () => {
    const { rerender } = render(
      <Segmented
        aria-label="动态视图"
        defaultValue="grid"
        options={[
          { value: 'list', label: '列表' },
          { value: 'grid', label: '网格' },
        ]}
      />,
    )
    expect(screen.getByRole('radio', { name: '网格' })).toBeChecked()
    rerender(
      <Segmented
        aria-label="动态视图"
        defaultValue="grid"
        options={[
          { value: 'list', label: '列表' },
          { value: 'grid', label: '网格', disabled: true },
        ]}
      />,
    )
    expect(screen.getByRole('radio', { name: '列表' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '网格' })).toBeDisabled()
  })

  it('applies the provider size to segmented controls', () => {
    render(
      <ConfigProvider componentSize="large">
        <Segmented
          aria-label="大号视图"
          options={[{ value: 'list', label: '列表' }]}
        />
      </ConfigProvider>,
    )
    expect(
      screen.getByRole('group', { name: '大号视图' }).querySelector('label'),
    ).toHaveClass('min-h-12')
  })

  it('supports rating selection, keyboard navigation and clearing', () => {
    const onChange = vi.fn()
    render(
      <Rate
        aria-label="满意度"
        defaultValue={3}
        onChange={onChange}
        tooltips={['很差', '较差', '一般', '满意', '非常满意']}
      />,
    )
    const three = screen.getByRole('radio', { name: '一般' })
    expect(three).toBeChecked()
    fireEvent.click(three)
    expect(onChange).toHaveBeenCalledWith(undefined)
    expect(three).not.toBeChecked()
    const five = screen.getByRole('radio', { name: '非常满意' })
    fireEvent.keyDown(five, { key: 'ArrowLeft' })
    fireEvent.click(five)
    expect(onChange).toHaveBeenLastCalledWith(5)
    expect(five).toBeChecked()
    expect(screen.getByRole('radio', { name: '一般' })).toHaveAttribute(
      'title',
      '一般',
    )
  })

  it('keeps an explicit empty Rate value controlled', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <Rate aria-label="受控评分" value={3} onChange={onChange} />,
    )
    expect(screen.getByRole('radio', { name: '3 星' })).toBeChecked()
    rerender(
      <Rate aria-label="受控评分" value={undefined} onChange={onChange} />,
    )
    for (const radio of screen.getAllByRole('radio'))
      expect(radio).not.toBeChecked()
    fireEvent.click(screen.getByRole('radio', { name: '4 星' }))
    expect(onChange).toHaveBeenCalledWith(4)
    expect(screen.getByRole('radio', { name: '4 星' })).not.toBeChecked()
  })

  it('clamps an uncontrolled rating when its option count shrinks', () => {
    const { rerender } = render(
      <Rate aria-label="动态评分" count={5} defaultValue={5} />,
    )
    expect(screen.getByRole('radio', { name: '5 星' })).toBeChecked()
    rerender(<Rate aria-label="动态评分" count={3} defaultValue={5} />)
    expect(screen.getByRole('radio', { name: '3 星' })).toBeChecked()
    rerender(<Rate aria-label="动态评分" count={5} defaultValue={5} />)
    expect(screen.getByRole('radio', { name: '5 星' })).toBeChecked()
  })

  it('connects rating group labels and errors through FormField', () => {
    render(<FormField label="满意度" error="请选择评分" control={<Rate />} />)
    const group = screen.getByRole('radiogroup', { name: '满意度' })
    expect(group).toHaveAttribute('aria-labelledby')
    expect(group).toHaveAttribute('aria-invalid', 'true')
    expect(group).toHaveAttribute('aria-describedby')
    expect(screen.getByRole('radio', { name: '1 星' })).toHaveAttribute('id')
    expect(screen.getByRole('alert')).toHaveTextContent('请选择评分')
  })

  it('normalizes color values and keeps the native control accessible', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <ColorPicker
        mode="native"
        aria-label="主题色"
        defaultValue="#abc"
        showText
        onChange={onChange}
      />,
    )
    const picker = screen.getByLabelText('主题色')
    expect(picker).toHaveAttribute('type', 'color')
    expect(picker).toHaveValue('#aabbcc')
    expect(screen.getByText('#aabbcc')).toBeInTheDocument()

    fireEvent.change(picker, { target: { value: '#112233' } })
    expect(picker).toHaveValue('#112233')
    expect(onChange).toHaveBeenLastCalledWith('#112233')

    rerender(
      <ColorPicker
        mode="native"
        aria-label="主题色"
        value="#fed"
        showText
        disabled
      />,
    )
    expect(picker).toHaveValue('#ffeedd')
    expect(picker).toBeDisabled()
    expect(screen.getByText('#ffeedd')).toBeInTheDocument()
  })

  it('connects color picker labels and errors through FormField', () => {
    render(
      <FormField
        label="主题色"
        error="请选择主题色"
        control={<ColorPicker defaultValue="#123456" />}
      />,
    )
    const picker = screen.getByLabelText('主题色')
    expect(picker).toHaveAttribute('id')
    expect(picker).toHaveAttribute('aria-labelledby')
    expect(picker).toHaveAttribute('aria-invalid', 'true')
    expect(picker).toHaveAttribute('aria-describedby')
    expect(screen.getByRole('alert')).toHaveTextContent('请选择主题色')
  })

  it('coordinates values and validation across project controls', async () => {
    const onFinish = vi.fn()
    const onFinishFailed = vi.fn()
    render(
      <Form
        initialValues={{ email: '', enabled: false }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
      >
        <FormItem
          name="email"
          label="邮箱"
          rules={[{ required: true, message: '请输入邮箱' }]}
          control={<input aria-label="邮箱输入" />}
        />
        <FormItem
          name="enabled"
          valuePropName="checked"
          control={<Checkbox label="启用通知" />}
        />
        <button type="submit">提交</button>
      </Form>,
    )

    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() => expect(onFinishFailed).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('alert')).toHaveTextContent('请输入邮箱')

    fireEvent.change(screen.getByRole('textbox', { name: '邮箱' }), {
      target: { value: 'person@example.com' },
    })
    fireEvent.click(screen.getByRole('checkbox', { name: '启用通知' }))
    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1))
    expect(onFinish).toHaveBeenLastCalledWith({
      email: 'person@example.com',
      enabled: true,
    })
  })

  it('connects segmented field semantics through FormField', () => {
    render(
      <FormField
        label="展示方式"
        error="请选择展示方式"
        control={
          <Segmented
            options={[
              { value: 'list', label: '列表' },
              { value: 'grid', label: '网格' },
            ]}
          />
        }
      />,
    )
    const list = screen.getByRole('radio', { name: '列表' })
    expect(list).toHaveAttribute('id')
    expect(list).toHaveAttribute('aria-invalid', 'true')
    expect(list).toHaveAttribute('aria-describedby')
    expect(list).toHaveAttribute('aria-labelledby')
    expect(screen.getByRole('alert')).toHaveTextContent('请选择展示方式')
  })

  it('keeps uncontrolled autocomplete state and input-number errors semantic', () => {
    const onAutoCompleteChange = vi.fn()
    render(
      <>
        <AutoComplete
          aria-label="城市"
          defaultValue="上"
          options={[{ value: '上海' }, { value: '北京' }]}
          onChange={onAutoCompleteChange}
        />
        <FormField
          label="数量"
          error="数量不正确"
          control={<InputNumber min={1} max={5} defaultValue={2} />}
        />
      </>,
    )
    const autocomplete = screen.getByRole('combobox', { name: '城市' })
    expect(autocomplete).toHaveValue('上')
    fireEvent.focus(autocomplete)
    fireEvent.change(autocomplete, { target: { value: '北' } })
    expect(autocomplete).toHaveValue('北')
    expect(onAutoCompleteChange).toHaveBeenCalledWith('北')
    expect(autocomplete).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByRole('listbox', { name: '自动完成建议' }),
    ).toContainElement(screen.getByRole('option', { name: '北京' }))
    const number = screen.getByRole('spinbutton', { name: '数量' })
    expect(number).toHaveAttribute('aria-invalid', 'true')
    expect(number.parentElement).toHaveAttribute('aria-invalid', 'true')
  })

  it('navigates autocomplete suggestions and skips disabled options', () => {
    const onChange = vi.fn()
    const onSelect = vi.fn()
    const options = [
      { value: '上海' },
      { value: '北京', disabled: true },
      { value: '广州', label: '广州城市' },
    ]
    render(
      <AutoComplete
        label="城市"
        options={options}
        onChange={onChange}
        onSelect={onSelect}
      />,
    )
    const input = screen.getByRole('combobox', { name: '城市' })
    fireEvent.focus(input)
    const choices = screen.getAllByRole('option')
    expect(choices).toHaveLength(3)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input).toHaveAttribute('aria-activedescendant', choices[0].id)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input).toHaveAttribute('aria-activedescendant', choices[2].id)
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(input).toHaveValue('广州')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(onChange).toHaveBeenLastCalledWith('广州')
    expect(onSelect).toHaveBeenCalledWith('广州', options[2])
  })

  it('does not select an autocomplete option while swiping the suggestion list', () => {
    const onSelect = vi.fn()
    render(
      <AutoComplete
        label="城市"
        options={[{ value: '上海' }]}
        onSelect={onSelect}
      />,
    )
    const input = screen.getByRole('combobox', { name: '城市' })
    fireEvent.focus(input)
    const option = screen.getByRole('option', { name: '上海' })
    fireEvent.touchStart(option, {
      touches: [{ clientX: 10, clientY: 10 }],
    })
    fireEvent.touchEnd(option, {
      changedTouches: [{ clientX: 10, clientY: 40 }],
    })
    expect(onSelect).not.toHaveBeenCalled()
    expect(input).toHaveValue('')
  })

  it('passes form semantics through the upload entry point', () => {
    render(
      <FormField
        label="附件"
        required
        error="请上传附件"
        control={<Upload label="选择附件" />}
      />,
    )
    const input = document.querySelector('input[type="file"]')
    expect(input).not.toBeNull()
    expect(input).toBeRequired()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby')
    expect(screen.getByRole('button', { name: '选择附件' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(input).toHaveAttribute('tabindex', '-1')
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
          mode="inline"
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
      'aria-haspopup',
      'listbox',
    )
    const region = screen.getByRole('combobox', { name: '地区' })
    fireEvent.change(region, { target: { value: 'cn' } })
    expect(onPathChange).toHaveBeenCalledWith(['cn'])
    expect(screen.getByRole('button', { name: '上传' })).toBeInTheDocument()
  })

  it('connects cascader semantics when wrapped by FormField', () => {
    render(
      <FormField
        label="地区"
        error="请选择地区"
        control={<Cascader options={[{ value: 'cn', label: '中国' }]} />}
      />,
    )
    const field = screen.getByLabelText('地区')
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field).toHaveAttribute('aria-describedby')
    expect(screen.getByRole('alert')).toHaveTextContent('请选择地区')
  })

  it('validates the final cascader level and submits a normalized path', () => {
    const onChange = vi.fn()
    const { container } = render(
      <form>
        <Cascader
          label="地区"
          mode="inline"
          name="region"
          required
          onChange={onChange}
          options={[
            {
              value: 'cn',
              label: '中国',
              children: [{ value: 'sh', label: '上海' }],
            },
          ]}
        />
      </form>,
    )
    const form = container.querySelector('form')!
    const country = screen.getByRole('combobox', { name: '地区' })
    expect(country).toBeRequired()
    fireEvent.change(country, { target: { value: 'cn' } })
    const city = screen.getByRole('combobox', { name: '地区第2级' })
    expect(country).not.toBeRequired()
    expect(city).toBeRequired()
    expect(form.checkValidity()).toBe(false)
    fireEvent.change(city, { target: { value: 'sh' } })
    expect(form.checkValidity()).toBe(true)
    expect(new FormData(form).get('region')).toBe('["cn","sh"]')
    fireEvent.change(city, { target: { value: '' } })
    expect(onChange).toHaveBeenLastCalledWith(['cn'])
    fireEvent.change(country, { target: { value: '' } })
    expect(onChange).toHaveBeenLastCalledWith([])
    expect(new FormData(form).get('region')).toBe('[]')
  })

  it('opens a single cascader popup and closes after a leaf selection', () => {
    const onChange = vi.fn()
    render(
      <Cascader
        label="地区"
        allowClear
        onChange={onChange}
        options={[
          {
            value: 'cn',
            label: '中国',
            children: [{ value: 'sh', label: '上海' }],
          },
        ]}
      />,
    )
    const trigger = screen.getByRole('combobox', { name: '地区' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(trigger)
    const popup = screen.getByRole('dialog', { name: '地区选项' })
    fireEvent.click(within(popup).getByRole('treeitem', { name: '中国' }))
    expect(onChange).not.toHaveBeenCalled()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(within(popup).getByRole('treeitem', { name: '上海' }))
    expect(onChange).toHaveBeenLastCalledWith(['cn', 'sh'])
    expect(trigger).toHaveTextContent('中国 / 上海')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(screen.getByRole('button', { name: '清空地区' }))
    expect(onChange).toHaveBeenLastCalledWith([])
    expect(trigger).toHaveTextContent('请选择')
    expect(screen.queryByRole('button', { name: '清空地区' })).toBeNull()
  })

  it('keeps cascader selections valid when options change', () => {
    const options = [
      {
        value: 'cn',
        label: '中国',
        children: [
          { value: 'sh', label: '上海' },
          { value: 'bj', label: '北京' },
        ],
      },
    ]
    const { rerender } = render(
      <Cascader
        label="动态地区"
        mode="inline"
        options={options}
        defaultValue={['cn', 'sh']}
      />,
    )
    const city = screen.getByRole('combobox', { name: '动态地区第2级' })
    expect(city).toHaveValue('sh')
    rerender(
      <Cascader
        label="动态地区"
        mode="inline"
        options={[{ ...options[0], children: [options[0].children[1]] }]}
        defaultValue={['cn', 'sh']}
      />,
    )
    expect(city).toHaveValue('')
    rerender(
      <Cascader
        label="动态地区"
        mode="inline"
        options={options}
        defaultValue={['cn', 'sh']}
      />,
    )
    expect(city).toHaveValue('sh')
  })

  it('keeps an empty required cascader invalid and labelled', () => {
    const { container } = render(
      <form>
        <FormField
          label="空地区"
          required
          control={<Cascader mode="inline" options={[]} />}
        />
      </form>,
    )
    const field = screen.getByRole('combobox', { name: '空地区' })
    expect(field).toBeRequired()
    expect(field).toBeEnabled()
    expect(container.querySelector('form')!.checkValidity()).toBe(false)
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

  it('formats numeric statistics with the configured locale and shows loading feedback', () => {
    const formatter = vi.fn(() => '自定义值')
    const { rerender } = render(
      <ConfigProvider locale="de-DE">
        <Statistic title="德语数值" value={12345.678} precision={2} />
        <Statistic
          title="英语数值"
          value={12345.678}
          precision={1}
          locale="en-US"
        />
        <Statistic title="无效数值" value={Number.NaN} />
        <Statistic
          title="加载数值"
          value={12345}
          formatter={formatter}
          loading
        />
      </ConfigProvider>,
    )
    expect(screen.getByText('12.345,68')).toBeInTheDocument()
    expect(screen.getByText('12,345.7')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
    const loading = screen.getByText('加载数值').closest('[data-ui-statistic]')
    expect(loading).toHaveAttribute('aria-busy', 'true')
    expect(
      screen.getByRole('status', { name: '加载数值正在加载' }),
    ).toBeInTheDocument()
    expect(formatter).not.toHaveBeenCalled()

    rerender(<Statistic title="加载数值" value={12345} formatter={formatter} />)
    expect(screen.getByText('自定义值')).toBeInTheDocument()
    expect(formatter).toHaveBeenCalledWith(12345)
    expect(
      screen.queryByRole('status', { name: '加载数值正在加载' }),
    ).toBeNull()
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
    expect(screen.getByRole('dialog', { name: '补充信息' })).toHaveTextContent(
      '上下文内容',
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(screen.getByRole('button', { name: '说明' })).toHaveFocus()
    fireEvent.focus(screen.getByRole('button', { name: '提示' }))
    expect(screen.getByRole('tooltip')).toHaveTextContent('键盘提示')
    fireEvent.blur(screen.getByRole('button', { name: '提示' }))
    fireEvent.pointerDown(screen.getByRole('button', { name: '提示' }), {
      pointerType: 'touch',
    })
    expect(screen.getByRole('tooltip')).toHaveTextContent('键盘提示')
    fireEvent.pointerDown(document.body, { pointerType: 'touch' })
    await waitFor(() =>
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument(),
    )

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

  it('keeps the Affix placeholder while toggling window fixation', async () => {
    const onChange = vi.fn()
    render(
      <Affix offsetTop={16} onChange={onChange} className="rounded-lg">
        <button type="button">固定操作</button>
      </Affix>,
    )
    const holder = screen.getByRole('button', { name: '固定操作' })
      .parentElement?.parentElement as HTMLDivElement
    const content = holder.querySelector(
      '[data-affix-content]',
    ) as HTMLDivElement
    let holderTop = 120
    vi.spyOn(holder, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          top: holderTop,
          bottom: holderTop + 48,
          left: 24,
          right: 224,
          width: 200,
          height: 48,
        }) as DOMRect,
    )
    vi.spyOn(content, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          top: holderTop,
          bottom: holderTop + 48,
          left: 24,
          right: 224,
          width: 200,
          height: 48,
        }) as DOMRect,
    )

    holderTop = -20
    fireEvent.scroll(window)
    await waitFor(() => expect(holder).toHaveAttribute('data-affixed', 'true'))
    expect(content).toHaveStyle({
      position: 'fixed',
      top: '16px',
      left: '24px',
      width: '200px',
    })
    expect(holder.style.height).toBe('48px')
    expect(onChange).toHaveBeenCalledWith(true)

    holderTop = -80
    fireEvent.scroll(window)
    await waitFor(() => expect(holder).toHaveAttribute('data-affixed', 'false'))
    await waitFor(() => expect(content).not.toHaveStyle('position: fixed'))
    expect(onChange).toHaveBeenLastCalledWith(false)
  })

  it('uses a scroll container viewport and supports bottom offsets', async () => {
    const onChange = vi.fn()
    const scrollContainer = document.createElement('div')
    document.body.append(scrollContainer)
    vi.spyOn(scrollContainer, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          top: 80,
          bottom: 380,
          left: 40,
          right: 440,
          width: 400,
          height: 300,
        }) as DOMRect,
    )
    let holderTop = 160
    render(
      <Affix target={() => scrollContainer} offsetTop={12} onChange={onChange}>
        <div>容器内固定内容</div>
      </Affix>,
    )
    const holder = screen.getByText('容器内固定内容').parentElement
      ?.parentElement as HTMLDivElement
    const content = holder.querySelector(
      '[data-affix-content]',
    ) as HTMLDivElement
    vi.spyOn(holder, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          top: holderTop,
          bottom: holderTop + 40,
          left: 72,
          right: 272,
          width: 200,
          height: 40,
        }) as DOMRect,
    )
    vi.spyOn(content, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          top: holderTop,
          bottom: holderTop + 40,
          left: 72,
          right: 272,
          width: 200,
          height: 40,
        }) as DOMRect,
    )

    holderTop = 70
    fireEvent.scroll(scrollContainer)
    await waitFor(() => expect(holder).toHaveAttribute('data-affixed', 'true'))
    expect(content).toHaveStyle({
      position: 'fixed',
      top: '92px',
      left: '72px',
    })
    expect(onChange).toHaveBeenCalledWith(true)

    const bottomOnChange = vi.fn()
    holderTop = 160
    const { unmount } = render(
      <Affix offsetBottom={20} onChange={bottomOnChange} className="border">
        <div>底部固定内容</div>
      </Affix>,
    )
    const bottomHolder = screen.getByText('底部固定内容').parentElement
      ?.parentElement as HTMLDivElement
    const bottomContent = bottomHolder.querySelector(
      '[data-affix-content]',
    ) as HTMLDivElement
    const bottomTop = window.innerHeight - 30
    vi.spyOn(bottomHolder, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          top: bottomTop,
          bottom: bottomTop + 40,
          left: 10,
          right: 210,
          width: 200,
          height: 40,
        }) as DOMRect,
    )
    vi.spyOn(bottomContent, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          top: bottomTop,
          bottom: bottomTop + 40,
          left: 10,
          right: 210,
          width: 200,
          height: 40,
        }) as DOMRect,
    )
    fireEvent.scroll(window)
    await waitFor(() =>
      expect(bottomHolder).toHaveAttribute('data-affixed', 'true'),
    )
    expect(bottomContent).toHaveStyle({
      position: 'fixed',
      top: `${window.innerHeight - 20 - 40}px`,
    })
    unmount()
  })

  it('tracks the current anchor section while scrolling', () => {
    const onChange = vi.fn()
    const first = document.createElement('section')
    first.id = 'anchor-first'
    const second = document.createElement('section')
    second.id = 'anchor-second'
    document.body.append(first, second)
    let firstTop = 0
    let secondTop = 200
    vi.spyOn(first, 'getBoundingClientRect').mockImplementation(
      () => ({ top: firstTop }) as DOMRect,
    )
    vi.spyOn(second, 'getBoundingClientRect').mockImplementation(
      () => ({ top: secondTop }) as DOMRect,
    )
    try {
      const links = [
        { href: '#anchor-first', title: '第一节' },
        { href: '#anchor-second', title: '第二节' },
      ]
      const { rerender } = render(
        <Anchor links={links} onChange={onChange} offsetTop={24} />,
      )
      expect(screen.getByRole('link', { name: '第一节' })).toHaveAttribute(
        'aria-current',
        'location',
      )

      firstTop = -200
      secondTop = 20
      fireEvent.scroll(window)
      expect(screen.getByRole('link', { name: '第二节' })).toHaveAttribute(
        'aria-current',
        'location',
      )
      expect(onChange).toHaveBeenCalledWith('#anchor-second')

      firstTop = 0
      secondTop = 200
      fireEvent.scroll(document)
      expect(screen.getByRole('link', { name: '第一节' })).toHaveAttribute(
        'aria-current',
        'location',
      )

      rerender(<Anchor links={links} activeHref="#anchor-first" />)
      fireEvent.scroll(window)
      expect(screen.getByRole('link', { name: '第一节' })).toHaveAttribute(
        'aria-current',
        'location',
      )
    } finally {
      first.remove()
      second.remove()
    }
  })

  it('tracks and navigates targets inside a chosen scroll container', () => {
    const onChange = vi.fn()
    const originalUrl = window.location.href
    const container = document.createElement('div')
    const first = document.createElement('section')
    const second = document.createElement('section')
    first.id = 'inner-anchor-first'
    second.id = 'inner-anchor-second'
    container.append(first, second)
    document.body.append(container)
    let firstTop = 100
    let secondTop = 300
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      top: 100,
    } as DOMRect)
    vi.spyOn(first, 'getBoundingClientRect').mockImplementation(
      () => ({ top: firstTop }) as DOMRect,
    )
    vi.spyOn(second, 'getBoundingClientRect').mockImplementation(
      () => ({ top: secondTop }) as DOMRect,
    )
    try {
      render(
        <Anchor
          label="容器导航"
          links={[
            { href: '#inner-anchor-first', title: '概览' },
            { href: '#inner-anchor-second', title: '详情' },
          ]}
          getContainer={() => container}
          offsetTop={8}
          onChange={onChange}
        />,
      )
      const firstLink = screen.getByRole('link', { name: '概览' })
      const secondLink = screen.getByRole('link', { name: '详情' })
      expect(firstLink).toHaveAttribute('aria-current', 'location')
      firstTop = -120
      secondTop = 107
      fireEvent.scroll(window)
      expect(firstLink).toHaveAttribute('aria-current', 'location')
      fireEvent.scroll(container)
      expect(secondLink).toHaveAttribute('aria-current', 'location')
      secondTop = 300
      fireEvent.click(secondLink)
      expect(container.scrollTop).toBe(192)
      expect(window.location.hash).toBe('#inner-anchor-second')
      expect(onChange).toHaveBeenLastCalledWith('#inner-anchor-second')
    } finally {
      window.history.replaceState(null, '', originalUrl)
      container.remove()
    }
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

  it('keeps tree selection in uncontrolled mode', () => {
    render(
      <Tree
        defaultSelectedKey="leaf"
        treeData={[
          { key: 'leaf', title: '叶子' },
          { key: 'other', title: '另一项' },
        ]}
      />,
    )
    const leaf = screen.getByRole('treeitem', { name: '叶子' })
    const other = screen.getByRole('treeitem', { name: '另一项' })
    expect(leaf).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(other)
    expect(leaf).toHaveAttribute('aria-selected', 'false')
    expect(other).toHaveAttribute('aria-selected', 'true')
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
