import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FormField, Select } from '@/shared/ui'

const options = [
  { value: 'list', label: '列表' },
  { value: 'grid', label: '网格' },
]

describe('Select clear action', () => {
  it('keeps custom filtering, disabled results and empty results independent of selection', async () => {
    const onValueChange = vi.fn()
    const filterOption = vi.fn((query: string, option: { value: string }) =>
      option.value.startsWith(query),
    )
    render(
      <Select
        label="城市"
        showSearch
        options={[
          { value: 'shanghai', label: '上海', disabled: true },
          { value: 'shenzhen', label: '深圳' },
          { value: 'beijing', label: '北京' },
        ]}
        filterOption={filterOption}
        onValueChange={onValueChange}
      />,
    )
    fireEvent.click(screen.getByRole('combobox'))
    const search = screen.getByRole('searchbox')
    await waitFor(() => expect(search).toHaveFocus())
    fireEvent.change(search, { target: { value: 'shang' } })
    expect(filterOption).toHaveBeenCalledWith('shang', {
      value: 'shanghai',
      label: '上海',
      disabled: true,
    })
    fireEvent.keyDown(search, { key: 'Enter' })
    expect(onValueChange).not.toHaveBeenCalled()
    expect(search).toBeVisible()
    fireEvent.change(search, { target: { value: 'unknown' } })
    expect(screen.getByRole('status')).toHaveTextContent('无匹配选项')
    fireEvent.keyDown(search, { key: 'Enter' })
    expect(onValueChange).not.toHaveBeenCalled()
    fireEvent.change(search, { target: { value: 'sh' } })
    fireEvent.keyDown(search, { key: 'Enter' })
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('shenzhen')
  })

  it('closes a disabled popup and discards its previous search session', async () => {
    const { rerender } = render(
      <Select label="视图" options={options} showSearch />,
    )
    fireEvent.click(screen.getByRole('combobox'))
    const search = screen.getByRole('searchbox')
    await waitFor(() => expect(search).toHaveFocus())
    fireEvent.change(search, { target: { value: 'list' } })
    rerender(<Select label="视图" options={options} showSearch disabled />)
    expect(screen.queryByRole('searchbox')).toBeNull()
    expect(screen.getByRole('combobox')).toBeDisabled()
    rerender(<Select label="视图" options={options} showSearch />)
    expect(screen.queryByRole('searchbox')).toBeNull()
    fireEvent.click(screen.getByRole('combobox'))
    expect(screen.getByRole('searchbox')).toHaveValue('')
    expect(screen.getByRole('option', { name: '网格' })).toBeVisible()
  })

  it('enters the first enabled result without skipping it', async () => {
    const onValueChange = vi.fn()
    render(
      <Select
        label="城市"
        showSearch
        options={[
          { value: 'disabled', label: '不可选城市', disabled: true },
          { value: 'beijing', label: '北京' },
          { value: 'shanghai', label: '上海' },
        ]}
        onValueChange={onValueChange}
      />,
    )
    fireEvent.click(screen.getByRole('combobox'))
    const search = screen.getByRole('searchbox')
    await waitFor(() => expect(search).toHaveFocus())
    fireEvent.keyDown(search, { key: 'ArrowDown' })
    fireEvent.keyDown(search, { key: 'Enter' })
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('beijing')
  })

  it('does not select or dismiss while the input method is composing', async () => {
    const onValueChange = vi.fn()
    render(
      <Select
        label="城市"
        showSearch
        options={[{ value: 'shanghai', label: '上海' }]}
        onValueChange={onValueChange}
      />,
    )
    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)
    const search = screen.getByRole('searchbox')
    await waitFor(() => expect(search).toHaveFocus())
    const popup = screen.getByRole('listbox')
    expect(trigger).toHaveAttribute('aria-controls', popup.id)
    expect(search).toHaveAttribute('aria-controls', popup.id)
    fireEvent.compositionStart(search)
    fireEvent.change(search, { target: { value: '上' } })
    fireEvent.keyDown(search, { key: 'Enter', isComposing: true })
    expect(onValueChange).not.toHaveBeenCalled()
    expect(search).toBeVisible()
    fireEvent.keyDown(search, { key: 'Escape', isComposing: true })
    expect(search).toBeVisible()
    fireEvent.compositionEnd(search)
    fireEvent.keyDown(search, { key: 'Enter', keyCode: 229 })
    expect(onValueChange).not.toHaveBeenCalled()
    fireEvent.keyDown(search, { key: 'Enter' })
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('shanghai')
    expect(trigger).toHaveTextContent('上海')
  })

  it('keeps the selected label while filtering it out of the popup', async () => {
    render(
      <Select
        label="城市"
        showSearch
        defaultValue="beijing"
        options={[
          { value: 'beijing', label: '北京' },
          { value: 'shanghai', label: '上海' },
        ]}
      />,
    )
    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)
    const search = screen.getByRole('searchbox')
    await waitFor(() => expect(search).toHaveFocus())
    fireEvent.change(search, { target: { value: 'shang' } })
    expect(screen.queryByRole('option', { name: '北京' })).toBeNull()
    expect(trigger).toHaveTextContent('北京')
  })

  it('filters searchable options and supports keyboard selection', async () => {
    const onValueChange = vi.fn()
    render(
      <Select
        label="城市"
        options={[
          { value: 'beijing', label: '北京' },
          { value: 'shanghai', label: '上海' },
          { value: 'shenzhen', label: '深圳' },
        ]}
        showSearch
        onValueChange={onValueChange}
      />,
    )
    fireEvent.click(screen.getByRole('combobox'))
    const search = screen.getByRole('searchbox', { name: '搜索城市' })
    await waitFor(() => expect(search).toHaveFocus())
    fireEvent.change(search, { target: { value: '深' } })
    expect(screen.queryByRole('option', { name: '上海' })).toBeNull()
    expect(screen.getByRole('option', { name: '深圳' })).toBeVisible()
    fireEvent.keyDown(search, { key: 'ArrowDown' })
    fireEvent.keyDown(search, { key: 'Enter' })
    expect(onValueChange).toHaveBeenCalledWith('shenzhen')
    expect(screen.getByRole('combobox')).toHaveTextContent('深圳')
    expect(screen.queryByRole('searchbox', { name: '搜索城市' })).toBeNull()
  })

  it('closes the searchable popup with Escape and restores trigger focus', async () => {
    render(
      <Select
        label="城市"
        options={[{ value: 'beijing', label: '北京' }]}
        showSearch
      />,
    )
    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)
    const search = screen.getByRole('searchbox', { name: '搜索城市' })
    await waitFor(() => expect(search).toHaveFocus())
    fireEvent.keyDown(search, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('searchbox')).toBeNull())
    expect(trigger).toHaveFocus()
  })

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

  it('supports field variants and warning or error statuses', () => {
    render(
      <>
        <Select
          aria-label="填充视图"
          variant="filled"
          defaultValue="list"
          options={options}
        />
        <Select
          aria-label="警告视图"
          variant="underlined"
          status="warning"
          defaultValue="grid"
          options={options}
        />
        <Select aria-label="错误视图" status="error" options={options} />
      </>,
    )

    expect(screen.getByRole('combobox', { name: '填充视图' })).toHaveClass(
      'bg-muted',
    )
    expect(screen.getByRole('combobox', { name: '警告视图' })).toHaveClass(
      'border-b',
    )
    expect(screen.getByRole('combobox', { name: '警告视图' })).toHaveAttribute(
      'data-status',
      'warning',
    )
    expect(screen.getByRole('combobox', { name: '错误视图' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })
})
