import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FormField, Select } from '@/shared/ui'

const options = [
  { value: 'list', label: '列表' },
  { value: 'grid', label: '网格' },
]

describe('Select clear action', () => {
  it('clears an uncontrolled value and restores focus to the trigger', async () => {
    const onValueChange = vi.fn()
    const { container } = render(
      <form>
        <Select
          label="视图"
          options={options}
          defaultValue="list"
          onValueChange={onValueChange}
          allowClear
          name="view"
        />
      </form>,
    )
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveTextContent('列表')
    expect(new FormData(container.querySelector('form')!).get('view')).toBe(
      'list',
    )
    const clear = screen.getByRole('button', { name: '清空视图' })
    fireEvent.click(clear)
    expect(onValueChange).toHaveBeenCalledWith('')
    expect(trigger).toHaveTextContent('请选择')
    expect(screen.queryByRole('button', { name: '清空视图' })).toBeNull()
    expect(new FormData(container.querySelector('form')!).has('view')).toBe(
      false,
    )
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('keeps a controlled value until the owner updates it', () => {
    const onValueChange = vi.fn()
    const { rerender } = render(
      <Select
        label="视图"
        options={options}
        value="list"
        onValueChange={onValueChange}
        allowClear
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '清空视图' }))
    expect(onValueChange).toHaveBeenCalledWith('')
    expect(screen.getByRole('combobox')).toHaveTextContent('列表')
    rerender(
      <Select
        label="视图"
        options={options}
        value=""
        onValueChange={onValueChange}
        allowClear
      />,
    )
    expect(screen.getByRole('combobox')).toHaveTextContent('请选择')
    expect(screen.queryByRole('button', { name: '清空视图' })).toBeNull()
  })

  it('keeps disabled controls and FormField error semantics', () => {
    render(
      <>
        <Select
          label="不可用视图"
          options={options}
          defaultValue="list"
          allowClear
          disabled
        />
        <FormField
          label="错误视图"
          error="请选择视图"
          control={
            <Select
              label="错误视图"
              options={options}
              defaultValue="grid"
              allowClear
            />
          }
        />
      </>,
    )
    expect(screen.getAllByRole('combobox')[0]).toBeDisabled()
    expect(screen.queryByRole('button', { name: '清空不可用视图' })).toBeNull()
    expect(screen.getByRole('combobox', { name: '错误视图' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.getByRole('button', { name: '清空错误视图' })).toBeVisible()
  })
})
