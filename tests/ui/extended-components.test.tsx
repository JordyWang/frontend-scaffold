import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  Avatar,
  Breadcrumb,
  Collapse,
  Descriptions,
  InputNumber,
  Progress,
  Result,
  Space,
  Steps,
  Slider,
  Statistic,
  Timeline,
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
})
