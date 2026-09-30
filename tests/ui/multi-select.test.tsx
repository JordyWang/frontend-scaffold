import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  ConfigProvider,
  Form,
  FormField,
  FormItem,
  MultiSelect,
} from '@/shared/ui'

const options = [
  { value: 'design', label: '设计组' },
  { value: 'archived', label: '归档组', disabled: true },
  { value: 'engineering', label: '研发组' },
]

describe('MultiSelect', () => {
  it('uses arrow keys, Enter, Space and Escape without closing after selection', async () => {
    const onValueChange = vi.fn()
    render(
      <MultiSelect
        label="团队"
        options={options}
        onValueChange={onValueChange}
      />,
    )
    const trigger = screen.getByRole('combobox', { name: '团队' })
    trigger.focus()
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    const list = screen.getByRole('listbox', { name: '团队选项' })
    expect(list).toHaveAttribute('aria-multiselectable', 'true')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(trigger).toHaveAttribute(
      'aria-activedescendant',
      within(list).getByRole('option', { name: '设计组' }).id,
    )
    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(onValueChange).toHaveBeenLastCalledWith(['design'])
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    expect(trigger).toHaveAttribute(
      'aria-activedescendant',
      within(list).getByRole('option', { name: '研发组' }).id,
    )
    fireEvent.keyDown(trigger, { key: ' ' })
    expect(onValueChange).toHaveBeenLastCalledWith(['design', 'engineering'])
    fireEvent.keyDown(trigger, { key: 'Escape' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('filters suggestions, protects disabled options and clears selected values', async () => {
    const onValueChange = vi.fn()
    render(
      <MultiSelect
        label="模块"
        options={options}
        showSearch
        allowClear
        defaultValue={['design']}
        onValueChange={onValueChange}
      />,
    )
    const trigger = screen.getByRole('combobox', { name: '模块' })
    fireEvent.click(trigger)
    const search = screen.getByRole('searchbox', { name: '搜索模块' })
    expect(search).toHaveFocus()
    fireEvent.change(search, { target: { value: '研发' } })
    const list = screen.getByRole('listbox', { name: '模块选项' })
    expect(within(list).queryByRole('option', { name: '设计组' })).toBeNull()
    fireEvent.click(within(list).getByRole('option', { name: '研发组' }))
    expect(onValueChange).toHaveBeenLastCalledWith(['design', 'engineering'])
    expect(trigger).toHaveTextContent('设计组')
    expect(trigger).toHaveTextContent('研发组')
    fireEvent.change(search, { target: { value: '归档' } })
    expect(
      within(list).getByRole('option', { name: '归档组' }),
    ).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(within(list).getByRole('option', { name: '归档组' }))
    expect(onValueChange).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: '清空模块' }))
    expect(onValueChange).toHaveBeenLastCalledWith([])
    expect(trigger).toHaveTextContent('请选择')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('keeps controlled selections, form serialization and RTL direction', () => {
    const onValueChange = vi.fn()
    const { container, rerender } = render(
      <ConfigProvider direction="rtl" componentSize="large">
        <form>
          <MultiSelect
            label="团队"
            options={options}
            value={['design']}
            onValueChange={onValueChange}
            name="teams"
          />
        </form>
      </ConfigProvider>,
    )
    const trigger = screen.getByRole('combobox', { name: '团队' })
    expect(trigger).toHaveClass('min-h-12')
    fireEvent.click(trigger)
    const list = screen.getByRole('listbox', { name: '团队选项' })
    expect(list.parentElement).toHaveAttribute('dir', 'rtl')
    fireEvent.click(within(list).getByRole('option', { name: '研发组' }))
    expect(onValueChange).toHaveBeenCalledWith(['design', 'engineering'])
    expect(trigger).not.toHaveTextContent('研发组')
    expect(new FormData(container.querySelector('form')!).get('teams')).toBe(
      '["design"]',
    )
    rerender(
      <ConfigProvider direction="rtl" componentSize="large">
        <form>
          <MultiSelect
            label="团队"
            options={options}
            value={['design', 'engineering']}
            onValueChange={onValueChange}
            name="teams"
            disabled
          />
        </form>
      </ConfigProvider>,
    )
    expect(trigger).toBeDisabled()
    expect(trigger).toHaveTextContent('研发组')
    expect(
      new FormData(container.querySelector('form')!).get('teams'),
    ).toBeNull()
  })

  it('connects FormField errors and FormItem array validation', async () => {
    const onFinish = vi.fn()
    render(
      <>
        <FormField
          label="错误团队"
          error="请选择团队"
          control={<MultiSelect options={options} />}
        />
        <Form onFinish={onFinish}>
          <FormItem
            name="teams"
            label="表单团队"
            trigger="onValueChange"
            emptyValue={[]}
            rules={[{ required: true, message: '请至少选择一个团队' }]}
            control={<MultiSelect options={options} />}
          />
          <button type="submit">提交</button>
        </Form>
      </>,
    )
    expect(screen.getByRole('combobox', { name: '错误团队' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() =>
      expect(screen.getByText('请至少选择一个团队')).toBeInTheDocument(),
    )
    const trigger = screen.getByRole('combobox', { name: '表单团队' })
    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('option', { name: '设计组' }))
    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith({ teams: ['design'] }),
    )
  })

  it('supports shared field variants and statuses', () => {
    render(
      <>
        <MultiSelect
          aria-label="填充团队"
          variant="filled"
          options={options}
          defaultValue={['design']}
        />
        <MultiSelect
          aria-label="警告团队"
          variant="underlined"
          status="warning"
          options={options}
        />
        <MultiSelect aria-label="错误团队" status="error" options={options} />
      </>,
    )

    expect(screen.getByRole('combobox', { name: '填充团队' })).toHaveClass(
      'bg-muted',
    )
    expect(screen.getByRole('combobox', { name: '警告团队' })).toHaveClass(
      'border-b',
    )
    expect(screen.getByRole('combobox', { name: '警告团队' })).toHaveAttribute(
      'data-status',
      'warning',
    )
    expect(screen.getByRole('combobox', { name: '错误团队' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })
})
