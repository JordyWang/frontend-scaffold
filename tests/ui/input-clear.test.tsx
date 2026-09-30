import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FormField, Input, Textarea } from '@/shared/ui'

describe('clearable text controls', () => {
  it('clears an uncontrolled Input and restores focus', async () => {
    const onChange = vi.fn()
    const onValueChange = vi.fn()
    render(
      <Input
        aria-label="名称"
        defaultValue="任务"
        allowClear
        onChange={onChange}
        onValueChange={onValueChange}
      />,
    )
    const input = screen.getByRole('textbox', { name: '名称' })
    const clear = screen.getByRole('button', { name: '清空输入：名称' })
    expect(input).toHaveValue('任务')
    fireEvent.click(clear)
    expect(input).toHaveValue('')
    expect(onValueChange).toHaveBeenCalledWith('')
    expect(onChange).toHaveBeenCalled()
    await waitFor(() => expect(input).toHaveFocus())
    expect(screen.queryByRole('button', { name: '清空输入：名称' })).toBeNull()
  })

  it('keeps controlled Input and Textarea values until the owner updates them', () => {
    const onInputValueChange = vi.fn()
    const onTextValueChange = vi.fn()
    const { rerender } = render(
      <FormField
        label="说明"
        control={
          <Textarea value="内容" allowClear onValueChange={onTextValueChange} />
        }
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '清空输入' }))
    expect(screen.getByRole('textbox', { name: '说明' })).toHaveValue('内容')
    expect(onTextValueChange).toHaveBeenCalledWith('')
    rerender(
      <Input
        aria-label="名称"
        value="任务"
        allowClear
        onValueChange={onInputValueChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '清空输入：名称' }))
    expect(screen.getByRole('textbox', { name: '名称' })).toHaveValue('任务')
    expect(onInputValueChange).toHaveBeenCalledWith('')
  })

  it('keeps disabled clearable controls read-only and preserves form errors', () => {
    render(
      <>
        <Input aria-label="禁用名称" defaultValue="任务" allowClear disabled />
        <FormField
          label="错误名称"
          error="名称无效"
          control={<Input allowClear defaultValue="任务" />}
        />
      </>,
    )
    expect(screen.getByRole('textbox', { name: '禁用名称' })).toBeDisabled()
    expect(
      screen.queryByRole('button', { name: '清空输入：禁用名称' }),
    ).toBeNull()
    expect(screen.getByRole('textbox', { name: '错误名称' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.getByRole('button', { name: '清空输入' })).toBeVisible()
  })
})
