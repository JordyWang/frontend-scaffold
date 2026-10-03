import { createRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  Alert,
  Badge,
  ConfigProvider,
  Icon,
  Skeleton,
  Spinner,
  Spin,
  Tag,
  Typography,
} from '@/shared/ui'

describe('display and feedback semantics', () => {
  it('keeps static tags non-interactive and supports a disabled selection', () => {
    const onSelectedChange = vi.fn()
    render(
      <>
        <Tag tone="success">已完成</Tag>
        <Tag selectable disabled onSelectedChange={onSelectedChange}>
          不可选
        </Tag>
      </>,
    )
    expect(screen.getByText('已完成')).toHaveAttribute(
      'data-ui-tone',
      'success',
    )
    expect(screen.getAllByRole('button')).toHaveLength(1)
    const disabled = screen.getByRole('button', { name: '不可选' })
    expect(disabled).toBeDisabled()
    fireEvent.click(disabled)
    expect(onSelectedChange).not.toHaveBeenCalled()
  })

  it('supports controlled and uncontrolled selectable tags', () => {
    const onSelectedChange = vi.fn()
    const { rerender } = render(
      <>
        <Tag selectable defaultSelected onSelectedChange={onSelectedChange}>
          本地选择
        </Tag>
        <Tag selectable selected onSelectedChange={onSelectedChange}>
          外部选择
        </Tag>
      </>,
    )
    const local = screen.getByRole('button', { name: '本地选择' })
    const controlled = screen.getByRole('button', { name: '外部选择' })
    expect(local).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(local)
    expect(local).toHaveAttribute('aria-pressed', 'false')
    expect(onSelectedChange).toHaveBeenCalledWith(false)
    fireEvent.click(controlled)
    expect(controlled).toHaveAttribute('aria-pressed', 'true')
    rerender(
      <>
        <Tag selectable defaultSelected onSelectedChange={onSelectedChange}>
          本地选择
        </Tag>
        <Tag selectable selected={false} onSelectedChange={onSelectedChange}>
          外部选择
        </Tag>
      </>,
    )
    expect(controlled).toHaveAttribute('aria-pressed', 'false')
  })

  it('dismisses tags without submitting a form and restores nearby focus', () => {
    const onOpenChange = vi.fn()
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <Tag closable onOpenChange={onOpenChange}>
          临时标签
        </Tag>
        <button type="button">下一项</button>
      </form>,
    )
    const close = screen.getByRole('button', { name: '关闭临时标签' })
    expect(close).toHaveAttribute('type', 'button')
    close.focus()
    fireEvent.click(close)
    expect(screen.queryByText('临时标签')).not.toBeInTheDocument()
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.getByRole('button', { name: '下一项' })).toHaveFocus()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('allows close cancellation and waits for controlled visibility updates', () => {
    const onOpenChange = vi.fn()
    const onClose = vi.fn((event: React.MouseEvent) => event.preventDefault())
    const { rerender } = render(
      <>
        <Tag closable open onClose={onClose} onOpenChange={onOpenChange}>
          可阻止关闭
        </Tag>
        <button type="button">焦点后继</button>
      </>,
    )
    const blockedClose = screen.getByRole('button', {
      name: '关闭可阻止关闭',
    })
    blockedClose.focus()
    fireEvent.click(blockedClose)
    expect(onClose).toHaveBeenCalledOnce()
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(blockedClose).toHaveFocus()
    rerender(
      <>
        <Tag closable open onOpenChange={onOpenChange}>
          可阻止关闭
        </Tag>
        <button type="button">焦点后继</button>
      </>,
    )
    const close = screen.getByRole('button', { name: '关闭可阻止关闭' })
    close.focus()
    fireEvent.click(close)
    expect(screen.getByText('可阻止关闭')).toBeInTheDocument()
    expect(onOpenChange).toHaveBeenCalledWith(false)
    rerender(
      <>
        <Tag closable open={false} onOpenChange={onOpenChange}>
          可阻止关闭
        </Tag>
        <button type="button">焦点后继</button>
      </>,
    )
    expect(screen.queryByText('可阻止关闭')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '焦点后继' })).toHaveFocus()
  })

  it('keeps decorative icons out of the accessibility tree and names meaningful icons', () => {
    render(
      <>
        <Icon name="check" data-testid="decoration" />
        <Icon name="info" label="更多信息" />
      </>,
    )
    expect(screen.getByTestId('decoration')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(screen.getByRole('img', { name: '更多信息' })).toBeInTheDocument()
  })

  it('preserves heading levels and exposes feedback urgency', () => {
    render(
      <>
        <Typography as="h2" variant="heading">
          章节标题
        </Typography>
        <Alert title="已保存" tone="success" />
        <Alert title="保存失败" tone="error" />
      </>,
    )
    expect(
      screen.getByRole('heading', { level: 2, name: '章节标题' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('已保存')
    expect(screen.getByRole('alert')).toHaveTextContent('保存失败')
  })

  it('dismisses an Alert without submitting its surrounding form', () => {
    const onDismiss = vi.fn()
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <Alert
          title="临时提示"
          closable
          closeLabel="关闭临时通知"
          onDismiss={onDismiss}
        />
      </form>,
    )
    const close = screen.getByRole('button', { name: '关闭临时通知' })
    expect(close).toHaveAttribute('type', 'button')
    fireEvent.click(close)
    expect(screen.queryByText('临时提示')).not.toBeInTheDocument()
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('supports controlled visibility, banner presentation and custom icons', () => {
    const onOpenChange = vi.fn()
    const afterClose = vi.fn()
    const { rerender } = render(
      <Alert
        title={<span>受控提示</span>}
        description="由外部状态管理。"
        banner
        showIcon={false}
        closable
        open
        onOpenChange={onOpenChange}
        afterClose={afterClose}
        closeIcon={<span aria-hidden="true">×</span>}
      />,
    )
    const alert = screen.getByRole('status', { name: '' })
    expect(alert).toHaveAttribute('data-alert-banner', 'true')
    expect(alert.querySelector('[data-alert-icon]')).toBeNull()
    expect(screen.getByRole('button', { name: '关闭提示' })).toHaveTextContent(
      '×',
    )

    fireEvent.click(screen.getByRole('button', { name: '关闭提示' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.getByText('受控提示')).toBeInTheDocument()
    expect(afterClose).not.toHaveBeenCalled()

    rerender(
      <Alert
        title="受控提示"
        open={false}
        afterClose={afterClose}
        icon={<span>自定义图标</span>}
      />,
    )
    expect(screen.queryByText('受控提示')).not.toBeInTheDocument()
    expect(afterClose).toHaveBeenCalledOnce()
  })

  it('announces the exact badge count while capping the visible count', () => {
    render(
      <Badge count={120} max={99}>
        <span>通知</span>
      </Badge>,
    )
    expect(screen.getByText('99+')).toHaveAttribute('aria-label', '120 条通知')
    expect(
      screen.getByRole('status', { name: '120 条通知' }),
    ).toHaveTextContent('99+')
  })

  it('hides numeric zero by default and preserves explicit zero and dot states', () => {
    render(
      <>
        <Badge count={0}>
          <button type="button">消息</button>
        </Badge>
        <Badge count={0} showZero label="零条消息" />
        <Badge count={0} dot label="零条提醒" />
        <Badge count={0} dot showZero label="零条提醒但保留圆点" />
      </>,
    )
    expect(
      screen.getByRole('button', { name: '消息' }).parentElement,
    ).toHaveAttribute('data-ui-badge')
    expect(
      screen
        .getByRole('button', { name: '消息' })
        .parentElement?.querySelector('[data-ui-badge-tone]'),
    ).toBeNull()
    expect(screen.getByText('0')).toHaveAttribute('aria-label', '零条消息')
    expect(screen.queryByLabelText('零条提醒')).toBeNull()
    expect(screen.getByLabelText('零条提醒但保留圆点')).toBeEmptyDOMElement()
  })

  it('supports string counts, small size and logical placement offsets', () => {
    render(
      <>
        <Badge count="NEW" size="small" />
        <Badge count={12} max={9} offset={[4, 6]}>
          <button type="button">通知入口</button>
        </Badge>
      </>,
    )
    expect(screen.getByText('NEW')).toHaveAttribute(
      'data-ui-badge-size',
      'small',
    )
    const capped = screen.getByText('9+')
    expect(capped).toHaveAttribute('aria-label', '12 条通知')
    expect(capped).toHaveStyle({ insetInlineEnd: '-4px', top: '6px' })
  })

  it('names status indicators and renders a themed ribbon', () => {
    render(
      <>
        <Badge status="processing" text="上传中" />
        <Badge status="error" />
        <Badge.Ribbon text="推荐" tone="warning" placement="start">
          <div>项目卡片</div>
        </Badge.Ribbon>
      </>,
    )
    expect(screen.getByText('上传中')).toBeVisible()
    expect(screen.getByRole('img', { name: '进行中' })).toHaveClass(
      'motion-reduce:after:animate-none',
    )
    expect(screen.getByRole('img', { name: '错误状态' })).toBeVisible()
    expect(
      screen.getByText('推荐').closest('[data-ui-badge-ribbon]'),
    ).toHaveAttribute('data-ui-badge-ribbon', 'start')
    expect(screen.getByText('项目卡片')).toBeVisible()
  })

  it('keeps standalone badge counts and labels in the document flow', () => {
    render(
      <>
        <Badge count={24} label="24 条独立通知" />
        <Badge label="已同步" tone="success" />
      </>,
    )
    const count = screen.getByText('24')
    expect(count).toHaveAttribute('aria-label', '24 条独立通知')
    expect(count).not.toHaveClass('absolute')
    expect(count.parentElement).toHaveAttribute('data-ui-badge')
    expect(screen.getByText('已同步')).toHaveAttribute('aria-label', '已同步')
  })

  it('accepts custom badge content, native attributes, refs and semantic Tailwind slots', () => {
    const ref = createRef<HTMLSpanElement>()
    render(
      <>
        <Badge
          ref={ref}
          id="custom-badge"
          count={<Icon name="check" size={12} />}
          label="任务已完成"
          title="完成标记"
          classNames={{ root: 'ring-1', indicator: 'bg-primary/80' }}
        >
          <button type="button">查看任务</button>
        </Badge>
        <Badge
          status="processing"
          text="处理中"
          data-testid="status-badge"
          title={false}
          classNames={{ indicator: 'ring-2', text: 'font-semibold' }}
        />
        <Badge.Ribbon
          text="精选"
          classNames={{
            root: 'rounded-md',
            indicator: 'bg-primary',
            content: 'tracking-wide',
          }}
        >
          <div>卡片内容</div>
        </Badge.Ribbon>
      </>,
    )
    expect(ref.current).toHaveAttribute('id', 'custom-badge')
    expect(ref.current).toHaveClass('ring-1')
    expect(screen.getByRole('status', { name: '任务已完成' })).toHaveClass(
      'bg-primary/80',
    )
    expect(screen.getByRole('status', { name: '任务已完成' })).toHaveAttribute(
      'title',
      '完成标记',
    )
    const status = screen.getByTestId('status-badge')
    expect(status.querySelector('[data-ui-badge-status-dot]')).toHaveClass(
      'ring-2',
    )
    expect(
      status.querySelector('[data-ui-badge-status-dot]'),
    ).not.toHaveAttribute('title')
    expect(screen.getByText('处理中')).toHaveClass('font-semibold')
    const ribbon = screen.getByText('精选')
    expect(ribbon).toHaveClass('tracking-wide')
    expect(ribbon.closest('[data-ui-badge-ribbon]')).toHaveClass('bg-primary')
    expect(ribbon.closest('[data-ui-badge-ribbon-wrapper]')).toHaveClass(
      'rounded-md',
    )
  })

  it('names loading placeholders and progress feedback', () => {
    render(
      <>
        <Skeleton label="列表正在加载" />
        <Spinner label="正在处理" />
      </>,
    )
    expect(
      screen.getByRole('status', { name: '列表正在加载' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status', { name: '正在处理' })).toBeInTheDocument()
  })

  it('renders sized button, input, image and avatar placeholders', () => {
    render(
      <>
        <Skeleton shape="circle" size="small" label="头像正在加载" />
        <Skeleton shape="button" size="small" label="按钮正在加载" />
        <Skeleton shape="button" round width="100%" label="宽按钮正在加载" />
        <Skeleton shape="input" size="large" label="输入框正在加载" />
        <Skeleton shape="image" active={false} label="图片正在加载" />
      </>,
    )
    expect(screen.getByRole('status', { name: '头像正在加载' })).toHaveClass(
      'size-8',
      'rounded-full',
    )
    expect(screen.getByRole('status', { name: '按钮正在加载' })).toHaveClass(
      'h-6',
      'w-16',
    )
    expect(screen.getByRole('status', { name: '宽按钮正在加载' })).toHaveStyle({
      width: '100%',
    })
    expect(screen.getByRole('status', { name: '宽按钮正在加载' })).toHaveClass(
      'rounded-full',
    )
    expect(screen.getByRole('status', { name: '输入框正在加载' })).toHaveClass(
      'h-10',
      'w-52',
    )
    expect(screen.getByRole('status', { name: '图片正在加载' })).toHaveClass(
      'size-24',
    )
    expect(
      screen.getByRole('status', { name: '图片正在加载' }),
    ).not.toHaveClass('animate-pulse')
  })

  it('renders a composite skeleton and swaps to real content when loading ends', () => {
    const { rerender } = render(
      <Skeleton
        shape="content"
        label="文章正在加载"
        avatar={{ size: 40, shape: 'square' }}
        title={{ width: '48%' }}
        paragraph={{ rows: 3, width: ['100%', '80%', '50%'] }}
        round
      >
        <button type="button">阅读文章</button>
      </Skeleton>,
    )
    const status = screen.getByRole('status', { name: '文章正在加载' })
    expect(status).toHaveAttribute('data-ui-skeleton', 'content')
    expect(status.querySelector('[data-ui-skeleton-avatar]')).toHaveStyle({
      width: '40px',
      height: '40px',
    })
    expect(status.querySelector('[data-ui-skeleton-title]')).toHaveStyle({
      width: '48%',
    })
    expect(status.querySelectorAll('[data-ui-skeleton-row]')).toHaveLength(3)
    expect(status.querySelector('[data-ui-skeleton-row="2"]')).toHaveStyle({
      width: '50%',
    })
    expect(screen.queryByRole('button', { name: '阅读文章' })).toBeNull()

    rerender(
      <Skeleton shape="content" label="文章正在加载" loading={false}>
        <button type="button">阅读文章</button>
      </Skeleton>,
    )
    expect(screen.queryByRole('status', { name: '文章正在加载' })).toBeNull()
    expect(screen.getByRole('button', { name: '阅读文章' })).toBeVisible()
  })

  it('supports static content placeholders without title or avatar', () => {
    render(
      <Skeleton
        shape="content"
        label="说明正在加载"
        active={false}
        title={false}
        paragraph={{ rows: 2, width: '70%' }}
      />,
    )
    const status = screen.getByRole('status', { name: '说明正在加载' })
    expect(status.querySelector('[data-ui-skeleton-avatar]')).toBeNull()
    expect(status.querySelector('[data-ui-skeleton-title]')).toBeNull()
    expect(status.querySelectorAll('[data-ui-skeleton-row]')).toHaveLength(2)
    expect(status.querySelector('[data-ui-skeleton-row="1"]')).toHaveStyle({
      width: '70%',
    })
    expect(status.querySelector('[data-ui-skeleton-row]')).not.toHaveClass(
      'animate-pulse',
    )
  })

  it('applies the provider size consistently to standalone and wrapped loading', () => {
    render(
      <ConfigProvider componentSize="large">
        <Spinner label="大号加载" />
        <Spin label="大号包裹加载" />
      </ConfigProvider>,
    )
    const standalone = screen.getByRole('status', { name: '大号加载' })
    const wrapped = screen.getByRole('status', { name: '大号包裹加载' })
    expect(standalone).toHaveAttribute('aria-live', 'polite')
    expect(standalone.querySelector('[aria-hidden="true"]')).toHaveClass(
      'size-9',
      'border-[3px]',
      'motion-reduce:animate-none',
    )
    expect(wrapped.querySelector('[aria-hidden="true"]')).toHaveClass(
      'size-9',
      'border-[3px]',
      'motion-reduce:animate-none',
    )
  })
})
