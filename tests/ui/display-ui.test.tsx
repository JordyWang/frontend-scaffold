import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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

  it('announces the exact badge count while capping the visible count', () => {
    render(
      <Badge count={120} max={99}>
        <span>通知</span>
      </Badge>,
    )
    expect(screen.getByText('99+')).toHaveAttribute('aria-label', '120 条通知')
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
