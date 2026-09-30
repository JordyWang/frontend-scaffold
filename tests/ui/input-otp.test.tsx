import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfigProvider, Form, FormItem, InputOTP } from '@/shared/ui'

describe('InputOTP', () => {
  it('moves focus during entry and reports completion once', () => {
    const onChange = vi.fn()
    const onComplete = vi.fn()
    render(
      <InputOTP
        label="一次性验证码"
        length={4}
        onChange={onChange}
        onComplete={onComplete}
      />,
    )
    const slots = screen.getAllByRole('textbox', { name: /一次性验证码第/ })
    expect(slots).toHaveLength(4)
    for (const [index, digit] of ['1', '2', '3', '4'].entries()) {
      fireEvent.change(slots[index], { target: { value: digit } })
      expect(slots[Math.min(index + 1, 3)]).toHaveFocus()
    }
    expect(onChange).toHaveBeenLastCalledWith('1234')
    expect(onComplete).toHaveBeenCalledExactlyOnceWith('1234')
    expect(slots.map((slot) => (slot as HTMLInputElement).value)).toEqual([
      '1',
      '2',
      '3',
      '4',
    ])

    fireEvent.keyDown(slots[3], { key: 'Backspace' })
    expect(onChange).toHaveBeenLastCalledWith('123')
    fireEvent.keyDown(slots[3], { key: 'Backspace' })
    expect(onChange).toHaveBeenLastCalledWith('12')
    expect(slots[2]).toHaveFocus()
    fireEvent.keyDown(slots[2], { key: 'ArrowLeft' })
    expect(slots[1]).toHaveFocus()
    fireEvent.change(slots[1], { target: { value: '25' } })
    expect(onChange).toHaveBeenLastCalledWith('15')
    fireEvent.change(slots[1], { target: { value: '' } })
    expect(onChange).toHaveBeenLastCalledWith('1')
  })

  it('accepts a pasted code and filters characters for the numeric keyboard', () => {
    const onComplete = vi.fn()
    render(<InputOTP label="验证码" length={4} onComplete={onComplete} />)
    const first = screen.getByRole('textbox', {
      name: '验证码第 1 位，共 4 位',
    })
    expect(first).toHaveAttribute('inputmode', 'numeric')
    expect(first).toHaveAttribute('autocomplete', 'one-time-code')

    fireEvent.paste(first, {
      clipboardData: { getData: () => 'a1 2-3四4' },
    })
    expect(onComplete).toHaveBeenCalledExactlyOnceWith('1234')
    expect(
      screen
        .getAllByRole('textbox', { name: /验证码第/ })
        .map((slot) => (slot as HTMLInputElement).value),
    ).toEqual(['1', '2', '3', '4'])
  })

  it('moves toward the visual next slot with RTL arrow keys', () => {
    render(
      <ConfigProvider direction="rtl">
        <InputOTP label="RTL 验证码" length={4} defaultValue="12" />
      </ConfigProvider>,
    )
    const group = screen.getByRole('group', { name: 'RTL 验证码' })
    const slots = screen.getAllByRole('textbox', { name: /RTL 验证码第/ })
    expect(group).toHaveAttribute('dir', 'rtl')
    slots[0].focus()
    fireEvent.keyDown(slots[0], { key: 'ArrowLeft' })
    expect(slots[1]).toHaveFocus()
    fireEvent.keyDown(slots[1], { key: 'ArrowRight' })
    expect(slots[0]).toHaveFocus()
  })

  it('respects a controlled value and exposes disabled, masked and invalid states', () => {
    const onChange = vi.fn()
    const { rerender, container } = render(
      <InputOTP
        label="安全码"
        length={3}
        value="9"
        onChange={onChange}
        name="otp"
        mask
        invalid
      />,
    )
    const group = screen.getByRole('group', { name: '安全码' })
    const first = screen.getByLabelText('安全码第 1 位，共 3 位')
    const second = screen.getByLabelText('安全码第 2 位，共 3 位')
    expect(group).toHaveAttribute('aria-invalid', 'true')
    expect(first).toHaveAttribute('type', 'password')
    expect(container.querySelector('input[name="otp"]')).toHaveValue('9')
    fireEvent.change(second, { target: { value: '2' } })
    expect(onChange).toHaveBeenCalledWith('92')
    expect(second).toHaveValue('')

    rerender(<InputOTP label="安全码" length={3} value="92" disabled mask />)
    expect(second).toHaveValue('2')
    expect(first).toBeDisabled()
    expect(second).toBeDisabled()
  })

  it('connects required validation and descriptions through FormItem', async () => {
    const onFinish = vi.fn()
    render(
      <Form onFinish={onFinish}>
        <FormItem
          name="code"
          rules={[{ required: true, message: '请输入验证码' }]}
          control={<InputOTP label="验证码" length={4} />}
        />
        <button type="submit">提交</button>
      </Form>,
    )
    const submit = screen.getByRole('button', { name: '提交' })
    fireEvent.click(submit)
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('请输入验证码'),
    )
    const group = screen.getByRole('group', { name: '验证码' })
    expect(group).toHaveAttribute('aria-required', 'true')
    expect(group).toHaveAttribute('aria-invalid', 'true')
    const first = screen.getByLabelText('验证码第 1 位，共 4 位')
    expect(first).toHaveAttribute('aria-describedby')

    fireEvent.paste(first, { clipboardData: { getData: () => '1234' } })
    fireEvent.click(submit)
    await waitFor(() => expect(onFinish).toHaveBeenCalledWith({ code: '1234' }))
  })
})
