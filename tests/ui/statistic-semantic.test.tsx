import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Statistic, StatisticTimer } from '@/shared/ui'

describe('Statistic semantic styles', () => {
  it('updates classes and styles by state while native root styling takes precedence', () => {
    const classes = vi.fn(({ props, state }) => ({
      root: state === 'loading' ? 'p-2 border' : 'p-2 bg-primary/5',
      title: props.value === 42 ? 'font-semibold' : undefined,
      value: state === 'loading' ? 'opacity-50' : 'text-primary',
    }))
    const styles = vi.fn(({ state }) => ({
      root: { backgroundColor: 'red', paddingLeft: 8 },
      header: { marginBottom: 3 },
      title: { letterSpacing: '0.1em' },
      content: { gap: 6 },
      value: { letterSpacing: state === 'ready' ? '0.04em' : '0' },
      prefix: { fontWeight: 700 },
      suffix: { fontStyle: 'italic' },
    }))
    const props = {
      title: '任务数',
      value: 42,
      prefix: '共',
      suffix: '项',
      classNames: classes,
      styles,
      className: 'p-4',
      style: { backgroundColor: 'blue' },
    } as const
    const { container, rerender } = render(<Statistic {...props} loading />)
    const root = container.querySelector<HTMLElement>('[data-ui-statistic]')!
    const part = (name: string) =>
      root.querySelector<HTMLElement>(`[data-ui-statistic-${name}]`)

    expect(classes).toHaveBeenCalledWith({
      props: expect.objectContaining({
        title: '任务数',
        value: 42,
        loading: true,
      }),
      state: 'loading',
    })
    expect(styles).toHaveBeenCalledWith({
      props: expect.objectContaining({ value: 42 }),
      state: 'loading',
    })
    expect(root).toHaveAttribute('data-ui-statistic-state', 'loading')
    expect(root).toHaveClass('p-4', 'border')
    expect(root).not.toHaveClass('p-2')
    expect(root.style.backgroundColor).toBe('blue')
    expect(root.style.paddingLeft).toBe('8px')
    expect(part('header')).toHaveStyle({ marginBottom: '3px' })
    expect(part('title')).toHaveClass('font-semibold')
    expect(part('title')).toHaveStyle({ letterSpacing: '0.1em' })
    expect(part('content')).toHaveStyle({ gap: '6px' })
    expect(part('value')).toHaveClass('opacity-50')
    expect(part('value')).toHaveStyle({ letterSpacing: '0' })
    expect(screen.getByRole('status', { name: '任务数正在加载' })).toBeVisible()

    rerender(<Statistic {...props} />)
    expect(root).toHaveAttribute('data-ui-statistic-state', 'ready')
    expect(root).toHaveClass('bg-primary/5')
    expect(root).not.toHaveClass('border')
    expect(part('value')).toHaveClass('text-primary')
    expect(part('value')).toHaveStyle({ letterSpacing: '0.04em' })
    expect(part('prefix')).toHaveStyle({ fontWeight: '700' })
    expect(part('suffix')).toHaveStyle({ fontStyle: 'italic' })
    expect(part('value')).toHaveTextContent('42')
    expect(classes).toHaveBeenLastCalledWith({
      props: expect.objectContaining({ value: 42 }),
      state: 'ready',
    })
  })

  it('passes semantic styles through StatisticTimer', () => {
    const { container } = render(
      <StatisticTimer
        title="剩余时间"
        value={Date.now() + 60_000}
        classNames={{ value: 'text-primary' }}
        styles={{ value: { letterSpacing: '0.08em' } }}
      />,
    )
    const value = container.querySelector('[data-ui-statistic-value]')!
    expect(value).toHaveClass('text-primary')
    expect(value).toHaveStyle({ letterSpacing: '0.08em' })
  })
})
