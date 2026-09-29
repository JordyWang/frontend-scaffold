import { createRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Form, FormItem, Mentions, ThemeScope } from '@/shared/ui'

const options = [
  { value: 'design', label: '设计团队' },
  { value: 'developer', label: '开发团队' },
  { value: 'ops', label: '运营团队', disabled: true },
]

describe('Mentions', () => {
  it('filters at the cursor, skips disabled options and preserves following text', () => {
    const onChange = vi.fn()
    const onSelect = vi.fn()
    render(
      <Mentions
        aria-label="发送消息"
        options={options}
        defaultValue="发给 @de 尾部"
        onChange={onChange}
        onSelect={onSelect}
      />,
    )
    const input = screen.getByRole('combobox', { name: '发送消息' })
    ;(input as HTMLTextAreaElement).setSelectionRange(6, 6)
    fireEvent.focus(input)
    expect(screen.getByRole('option', { name: '设计团队' })).toBeVisible()
    expect(screen.getByRole('option', { name: '开发团队' })).toBeVisible()
    expect(
      screen.queryByRole('option', { name: '运营团队' }),
    ).not.toBeInTheDocument()
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(screen.getByRole('option', { name: '开发团队' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenLastCalledWith('发给 @developer 尾部')
    expect(onSelect).toHaveBeenCalledWith(options[1])
    expect(input).toHaveValue('发给 @developer 尾部')
    expect(input).toHaveFocus()
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })

  it('keeps controlled values authoritative and supports pointer selection in a theme scope', () => {
    const ref = createRef<HTMLTextAreaElement>()
    const onChange = vi.fn()
    const { rerender } = render(
      <ThemeScope mode="dark">
        <Mentions
          ref={ref}
          aria-label="受控提及"
          options={options}
          value="@des"
          onChange={onChange}
        />
      </ThemeScope>,
    )
    const input = screen.getByRole('combobox', { name: '受控提及' })
    expect(ref.current).toBe(input)
    ;(input as HTMLTextAreaElement).setSelectionRange(4, 4)
    fireEvent.focus(input)
    const option = screen.getByRole('option', { name: '设计团队' })
    expect(option.closest('[data-ui-theme]')).toHaveAttribute(
      'data-ui-theme',
      'dark',
    )
    fireEvent.pointerDown(option)
    fireEvent.click(option)
    expect(onChange).toHaveBeenCalledWith('@design ')
    expect(input).toHaveValue('@des')
    rerender(
      <ThemeScope mode="dark">
        <Mentions
          ref={ref}
          aria-label="受控提及"
          options={options}
          value="@design "
          onChange={onChange}
        />
      </ThemeScope>,
    )
    expect(input).toHaveValue('@design ')
    expect((input as HTMLTextAreaElement).selectionStart).toBe(8)
  })

  it('waits for composition, closes on Escape, and leaves disabled fields inert', () => {
    render(<Mentions aria-label="输入提及" options={options} />)
    const input = screen.getByRole('combobox', { name: '输入提及' })
    fireEvent.focus(input)
    fireEvent.compositionStart(input)
    fireEvent.change(input, { target: { value: '@ops', selectionStart: 4 } })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    ;(input as HTMLTextAreaElement).setSelectionRange(4, 4)
    fireEvent.compositionEnd(input)
    expect(screen.getByRole('option', { name: '运营团队' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    expect(input).not.toHaveAttribute('aria-activedescendant')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(input).toHaveValue('@ops')
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    fireEvent.change(input, { target: { value: '@de', selectionStart: 3 } })
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    render(<Mentions aria-label="不可用输入" options={options} disabled />)
    const disabled = screen.getByRole('combobox', { name: '不可用输入' })
    expect(disabled).toBeDisabled()
    expect(disabled).toHaveAttribute('aria-expanded', 'false')
  })

  it('connects form labels and errors to the textarea', async () => {
    render(
      <Form initialValues={{ message: '' }}>
        <FormItem
          name="message"
          label="留言"
          rules={[{ required: true, message: '请输入留言' }]}
          control={<Mentions options={options} />}
        />
        <button type="submit">提交</button>
      </Form>,
    )
    const input = screen.getByRole('combobox', { name: '留言' })
    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('请输入留言')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input.getAttribute('aria-describedby')).toContain('-error')
    fireEvent.change(input, { target: { value: '你好' } })
    expect(input).toHaveValue('你好')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('closes after a pointer starts on a suggestion and ends outside', () => {
    render(<Mentions aria-label="提及" defaultValue="@de" options={options} />)
    const input = screen.getByRole('combobox', { name: '提及' })
    ;(input as HTMLTextAreaElement).setSelectionRange(3, 3)
    fireEvent.focus(input)
    fireEvent.pointerDown(screen.getByRole('option', { name: '设计团队' }))
    fireEvent.blur(input)
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.pointerUp(document.body)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
