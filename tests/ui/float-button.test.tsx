import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { FloatButton } from '@/shared/ui'

describe('FloatButton', () => {
  it('anchors its tooltip and badge without changing the button name', () => {
    const ref = createRef<HTMLButtonElement>()
    render(
      <FloatButton
        ref={ref}
        label="反馈"
        tooltip="发送反馈"
        badge={{ count: 3, label: '3 条待处理反馈', tone: 'warning' }}
      >
        <span aria-hidden="true">?</span>
      </FloatButton>,
    )

    const button = screen.getByRole('button', { name: '反馈' })
    expect(ref.current).toBe(button)
    expect(button).toHaveAttribute('type', 'button')
    expect(
      button.closest('[data-ui-float-button-container]'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('3 条待处理反馈')).toHaveTextContent('3')
    fireEvent.focus(button)
    expect(screen.getByRole('tooltip')).toHaveTextContent('发送反馈')
    expect(button).toHaveAttribute('aria-describedby')
    fireEvent.blur(button)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('uses native link semantics and prevents disabled or loading navigation', () => {
    const linkRef = createRef<HTMLAnchorElement>()
    const onActivate = vi.fn()
    const onDisabledClick = vi.fn()
    render(
      <>
        <FloatButton
          ref={linkRef}
          label="打开组件预览"
          href="/__ui"
          linkTarget="_blank"
          tooltip="查看组件预览"
          onClick={(event) => {
            expect(event.currentTarget.href).toContain('/__ui')
            event.preventDefault()
            onActivate()
          }}
        >
          ↗
        </FloatButton>
        <FloatButton
          label="不可用链接"
          href="/__ui"
          disabled
          onClick={onDisabledClick}
        >
          ×
        </FloatButton>
        <FloatButton label="加载中的链接" href="/__ui" loading>
          ↗
        </FloatButton>
      </>,
    )

    const link = screen.getByRole('link', { name: '打开组件预览' })
    expect(linkRef.current).toBe(link)
    expect(link).toHaveAttribute('href', '/__ui')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    fireEvent.click(link)
    expect(onActivate).toHaveBeenCalledOnce()

    const disabled = screen.getByRole('link', { name: '不可用链接' })
    expect(disabled).toHaveAttribute('aria-disabled', 'true')
    expect(disabled).not.toHaveAttribute('href')
    expect(disabled).toHaveAttribute('tabindex', '-1')
    fireEvent.click(disabled)
    expect(onDisabledClick).not.toHaveBeenCalled()

    const loading = screen.getByRole('link', { name: '加载中的链接' })
    expect(loading).toHaveAttribute('aria-busy', 'true')
    expect(loading).not.toHaveAttribute('href')
    expect(loading).toHaveAttribute('tabindex', '-1')
  })
})
