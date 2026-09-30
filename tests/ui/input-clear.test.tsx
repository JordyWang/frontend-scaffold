import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FormField, Input, Textarea } from '@/shared/ui'

describe('clearable text controls', () => {
  it('clears an uncontrolled Input and restores focus', async () => {
    const onChange = vi.fn()
    const onValueChange = vi.fn()
    const changedValues: string[] = []
    render(
      <Input
        aria-label="名称"
        defaultValue="任务"
        allowClear
        onChange={(event) => {
          changedValues.push(event.currentTarget.value)
          onChange(event)
        }}
        onValueChange={onValueChange}
      />,
    )
    const input = screen.getByRole('textbox', { name: '名称' })
    const clear = screen.getByRole('button', { name: '清空输入：名称' })
    expect(input).toHaveValue('任务')
    fireEvent.click(clear)
    expect(input).toHaveValue('')
    expect(onValueChange).toHaveBeenCalledWith('')
    expect(onChange).toHaveBeenCalledOnce()
    expect(changedValues).toEqual([''])
    expect(onChange.mock.calls[0][0].nativeEvent).toBeInstanceOf(Event)
    await waitFor(() => expect(input).toHaveFocus())
    expect(screen.queryByRole('button', { name: '清空输入：名称' })).toBeNull()
  })

  it('emits the cleared textarea value through a real change event', () => {
    const changedValues: string[] = []
    const onValueChange = vi.fn()
    render(
      <Textarea
        aria-label="说明"
        defaultValue="旧内容"
        allowClear
        onValueChange={onValueChange}
        onChange={(event) => changedValues.push(event.currentTarget.value)}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '清空输入：说明' }))
    expect(screen.getByRole('textbox', { name: '说明' })).toHaveValue('')
    expect(changedValues).toEqual([''])
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('')
  })

  it('keeps controlled Input and Textarea values until the owner updates them', () => {
    const onInputValueChange = vi.fn()
    const onTextValueChange = vi.fn()
    const inputChanges: string[] = []
    const textareaChanges: string[] = []
    const { rerender } = render(
      <FormField
        label="说明"
        control={
          <Textarea
            value="内容"
            allowClear
            onValueChange={onTextValueChange}
            onChange={(event) =>
              textareaChanges.push(event.currentTarget.value)
            }
          />
        }
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '清空输入' }))
    expect(screen.getByRole('textbox', { name: '说明' })).toHaveValue('内容')
    expect(onTextValueChange).toHaveBeenCalledWith('')
    expect(textareaChanges).toEqual([''])
    rerender(
      <Input
        aria-label="名称"
        value="任务"
        allowClear
        onValueChange={onInputValueChange}
        onChange={(event) => inputChanges.push(event.currentTarget.value)}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '清空输入：名称' }))
    expect(screen.getByRole('textbox', { name: '名称' })).toHaveValue('任务')
    expect(onInputValueChange).toHaveBeenCalledWith('')
    expect(inputChanges).toEqual([''])
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

  it('supports Ant Design-style field variants and statuses', () => {
    render(
      <>
        <Input aria-label="填充输入" variant="filled" defaultValue="内容" />
        <Input
          aria-label="无边框输入"
          variant="borderless"
          defaultValue="内容"
        />
        <Textarea
          aria-label="下划线文本域"
          variant="underlined"
          status="warning"
          defaultValue="内容"
        />
        <Input aria-label="错误输入" status="error" />
      </>,
    )

    expect(screen.getByRole('textbox', { name: '填充输入' })).toHaveClass(
      'bg-muted',
    )
    expect(screen.getByRole('textbox', { name: '无边框输入' })).toHaveClass(
      'bg-transparent',
    )
    expect(screen.getByRole('textbox', { name: '下划线文本域' })).toHaveClass(
      'border-b',
    )
    expect(
      screen.getByRole('textbox', { name: '下划线文本域' }),
    ).toHaveAttribute('data-status', 'warning')
    expect(screen.getByRole('textbox', { name: '错误输入' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })
})
