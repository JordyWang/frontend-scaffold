import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormField, Input, Textarea } from '@/shared/ui'

describe('text field character counts', () => {
  it('shows native maxLength and updates without changing the input value contract', () => {
    render(<Input aria-label="标题" count maxLength={5} defaultValue="任务" />)
    const input = screen.getByRole('textbox', { name: '标题' })
    const counter = screen.getByText('2 / 5')
    expect(input).toHaveValue('任务')
    expect(input).toHaveAttribute('maxLength', '5')
    expect(input).toHaveAttribute('aria-describedby', counter.id)
    fireEvent.change(input, { target: { value: '任务123' } })
    expect(input).toHaveValue('任务123')
    expect(counter).toHaveTextContent('5 / 5')
    expect(input).not.toHaveAttribute('count')
  })

  it('flags an over-limit controlled value without truncating it', () => {
    const { rerender } = render(
      <Input aria-label="标题" value="abcdef" count={{ max: 4 }} />,
    )
    const input = screen.getByRole('textbox', { name: '标题' })
    expect(input).toHaveValue('abcdef')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input.closest('[data-ui-input-root]')).toHaveAttribute(
      'data-count-exceeded',
      'true',
    )
    expect(screen.getByText('6 / 4')).toHaveAttribute('data-exceeded', 'true')
    rerender(<Input aria-label="标题" value="abc" count={{ max: 4 }} />)
    expect(input).toHaveValue('abc')
    expect(input).not.toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('3 / 4')).not.toHaveAttribute('data-exceeded')
  })

  it('supports a custom counting strategy and render function in Textarea', () => {
    render(
      <FormField
        label="说明"
        description="最多三个表情"
        control={
          <Textarea
            value="😀😀😀😀"
            count={{
              max: 3,
              strategy: (value) => Array.from(value).length,
              render: ({ count, max }) => `${count} 个表情 / ${max}`,
            }}
          />
        }
      />,
    )
    const textarea = screen.getByRole('textbox', { name: '说明' })
    const counter = screen.getByText('4 个表情 / 3')
    expect(textarea).toHaveValue('😀😀😀😀')
    expect(textarea).toHaveAttribute('aria-invalid', 'true')
    expect(counter).toHaveAttribute('data-exceeded', 'true')
    expect(textarea.getAttribute('aria-describedby')).toContain(counter.id)
    expect(textarea.getAttribute('aria-describedby')).toContain('hint')
    expect(textarea).not.toHaveAttribute('count')
  })

  it('keeps the count in sync with native form reset', () => {
    render(
      <form aria-label="计数表单">
        <Textarea aria-label="备注" count defaultValue="默认" />
        <button type="reset">重置</button>
      </form>,
    )
    const textarea = screen.getByRole('textbox', { name: '备注' })
    fireEvent.change(textarea, { target: { value: '已修改内容' } })
    expect(screen.getByText('5')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '重置' }))
    expect(textarea).toHaveValue('默认')
    expect(screen.getByText('2')).toBeVisible()
  })

  it('keeps native focus when a Textarea count is toggled', () => {
    const { rerender } = render(
      <Textarea aria-label="说明" defaultValue="内容" count={false} />,
    )
    const textarea = screen.getByRole('textbox', { name: '说明' })
    textarea.focus()
    rerender(<Textarea aria-label="说明" defaultValue="内容" count />)
    expect(screen.getByRole('textbox', { name: '说明' })).toBe(textarea)
    expect(textarea).toHaveFocus()
    expect(screen.getByText('2')).toBeVisible()
    rerender(<Textarea aria-label="说明" defaultValue="内容" count={false} />)
    expect(screen.getByRole('textbox', { name: '说明' })).toBe(textarea)
    expect(textarea).toHaveFocus()
  })

  it('keeps native focus when an Input count is toggled', () => {
    const { rerender } = render(
      <Input aria-label="标题" defaultValue="任务" count={false} />,
    )
    const input = screen.getByRole('textbox', { name: '标题' })
    input.focus()
    rerender(<Input aria-label="标题" defaultValue="任务" count />)
    expect(screen.getByRole('textbox', { name: '标题' })).toBe(input)
    expect(input).toHaveFocus()
    expect(screen.getByText('2')).toBeVisible()
  })
})
