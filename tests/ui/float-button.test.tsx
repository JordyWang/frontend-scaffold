import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
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
})
