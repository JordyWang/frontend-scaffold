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
  Typography,
} from '@/shared/ui'

describe('display and feedback semantics', () => {
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
