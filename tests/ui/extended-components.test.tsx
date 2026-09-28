import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
})
