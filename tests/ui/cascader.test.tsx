import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  Cascader,
  ConfigProvider,
  FormField,
  type CascaderHandle,
  type CascaderOption,
} from '@/shared/ui'

const options: CascaderOption[] = [
  {
    value: 'disabled',
    label: '禁用地区',
    disabled: true,
    children: [{ value: 'hidden', label: '禁用后代' }],
  },
  {
    value: 'cn',
    label: '中国',
    children: [
      {
        value: 'sh',
        label: '上海',
        children: [{ value: 'center', label: '中心城区' }],
      },
      { value: 'blocked', label: '禁用城市', disabled: true },
      { value: 'bj', label: '北京' },
    ],
  },
  {
    value: 'other',
    label: '其他地区',
    children: [{ value: 'center', label: '中心城区' }],
  },
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'b2', label: 'Bravo' },
]
const open = () => fireEvent.click(screen.getByRole('combobox'))
const node = (name: string) =>
  screen.getByRole('treeitem', { name, exact: true })

describe('Cascader column browser', () => {
  it('browses parent columns without changing values and commits the full leaf path once', () => {
    const onChange = vi.fn(),
      onOpenChange = vi.fn()
    render(
      <Cascader
        options={options}
        onChange={onChange}
        onOpenChange={onOpenChange}
        name="place"
      />,
    )
    const trigger = screen.getByRole('combobox')
    act(() => trigger.focus())
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    expect(node('中国')).toHaveFocus()
    fireEvent.keyDown(node('中国'), { key: 'ArrowRight' })
    expect(node('上海')).toHaveFocus()
    expect(node('中国')).toHaveAttribute('aria-expanded', 'true')
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.keyDown(node('上海'), { key: 'Enter' })
    expect(node('中心城区')).toHaveFocus()
    fireEvent.keyDown(node('中心城区'), { key: 'Enter' })
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['cn', 'sh', 'center'])
    expect(trigger).toHaveTextContent('中国 / 上海 / 中心城区')
    expect(trigger).toHaveFocus()
    expect(onOpenChange.mock.calls).toEqual([[true], [false]])
    expect(document.querySelector('input[name="place"]')).toHaveValue(
      '["cn","sh","center"]',
    )
  })

  it('supports parent selection explicitly and distinguishes identical values in different branches', () => {
    const onChange = vi.fn()
    render(<Cascader options={options} changeOnSelect onChange={onChange} />)
    open()
    fireEvent.click(node('中国'))
    expect(onChange).toHaveBeenLastCalledWith(['cn'])
    fireEvent.click(node('其他地区'))
    fireEvent.click(node('中心城区'))
    expect(onChange).toHaveBeenLastCalledWith(['other', 'center'])
    expect(screen.getByRole('combobox')).toHaveTextContent(
      '其他地区 / 中心城区',
    )
  })

  it('keeps explicitly undefined controlled empty and clears once with focus restoration', () => {
    const onChange = vi.fn(),
      onClear = vi.fn()
    const { rerender } = render(
      <Cascader
        options={options}
        value={undefined}
        defaultValue={['a']}
        onChange={onChange}
      />,
    )
    const trigger = screen.getByRole('combobox')
    open()
    fireEvent.click(node('Alpha'))
    expect(onChange).toHaveBeenCalledWith(['a'])
    expect(trigger).toHaveTextContent('请选择')
    rerender(
      <Cascader
        options={options}
        value={['a']}
        allowClear
        onChange={onChange}
        onClear={onClear}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '清空级联选择' }))
    expect(onChange).toHaveBeenLastCalledWith([])
    expect(onClear).toHaveBeenCalledOnce()
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveTextContent('Alpha')
  })

  it('moves within a column with Home, End and repeated typeahead and uses RTL expansion keys', () => {
    render(
      <ConfigProvider direction="rtl">
        <Cascader options={options} />
      </ConfigProvider>,
    )
    open()
    const tree = screen.getByRole('tree')
    expect(tree).toHaveAttribute('dir', 'rtl')
    fireEvent.keyDown(node('中国'), { key: 'b' })
    expect(node('Beta')).toHaveFocus()
    fireEvent.keyDown(node('Beta'), { key: 'b' })
    expect(node('Bravo')).toHaveFocus()
    fireEvent.keyDown(node('Bravo'), { key: 'Home' })
    expect(node('中国')).toHaveFocus()
    fireEvent.keyDown(node('中国'), { key: 'ArrowLeft' })
    expect(node('上海')).toHaveFocus()
    fireEvent.keyDown(node('上海'), { key: 'End' })
    expect(node('北京')).toHaveFocus()
    fireEvent.keyDown(node('北京'), { key: 'ArrowRight' })
    expect(node('中国')).toHaveFocus()
    fireEvent.keyDown(node('中国'), { key: 'Escape' })
    expect(screen.getByRole('combobox')).toHaveFocus()
  })

  it('searches complete paths, preserves disabled ancestry and restores column browsing on clear', () => {
    const onChange = vi.fn()
    render(<Cascader options={options} showSearch onChange={onChange} />)
    open()
    const search = screen.getByRole('searchbox')
    expect(search).toHaveFocus()
    fireEvent.change(search, { target: { value: '中心' } })
    const results = screen.getAllByRole('option')
    expect(results).toHaveLength(2)
    fireEvent.keyDown(search, { key: 'ArrowDown' })
    expect(results[0]).toHaveFocus()
    fireEvent.keyDown(results[0], { key: 'ArrowDown' })
    expect(results[1]).toHaveFocus()
    fireEvent.keyDown(results[1], { key: 'Enter' })
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['other', 'center'])
    open()
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: '禁用后代' },
    })
    expect(screen.getByRole('option')).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(screen.getByRole('option'))
    expect(onChange).toHaveBeenCalledOnce()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } })
    expect(screen.getByRole('tree')).toBeInTheDocument()
    expect(node('其他地区')).toHaveAttribute('aria-expanded', 'true')
  })

  it('honors controlled search, filtering limits and empty feedback', () => {
    const onSearch = vi.fn()
    const filterOption = vi.fn(
      (query: string, path: CascaderOption[]) =>
        path.at(-1)?.value.startsWith(query) ?? false,
    )
    const { rerender } = render(
      <Cascader
        options={options}
        showSearch
        searchValue="b"
        filterOption={filterOption}
        searchLimit={1}
        onSearch={onSearch}
      />,
    )
    open()
    expect(screen.getAllByRole('option')).toHaveLength(1)
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'none' },
    })
    expect(onSearch).toHaveBeenCalledWith('none')
    expect(screen.getByRole('searchbox')).toHaveValue('b')
    rerender(
      <Cascader
        options={options}
        showSearch
        searchValue="none"
        emptyText="没有对应地区"
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('没有对应地区')
  })

  it('keeps controlled opening external and does not reopen after uncontrolled disabling', () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <Cascader options={options} open={false} onOpenChange={onOpenChange} />,
    )
    open()
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    rerender(<Cascader options={options} />)
    open()
    rerender(<Cascader options={options} disabled />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    rerender(<Cascader options={options} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('restores removed and disabled focused nodes within an embedded panel without stealing external focus', () => {
    const { rerender } = render(<Cascader mode="panel" options={options} />)
    act(() => node('中国').focus())
    fireEvent.keyDown(node('中国'), { key: 'ArrowRight' })
    expect(node('上海')).toHaveFocus()
    rerender(
      <Cascader
        mode="panel"
        options={[
          ...options.slice(0, 1),
          { ...options[1], children: options[1].children!.slice(1) },
          ...options.slice(2),
        ]}
      />,
    )
    expect(node('中国')).toHaveFocus()
    rerender(
      <Cascader
        mode="panel"
        options={options.map((option) =>
          option.value === 'cn' ? { ...option, disabled: true } : option,
        )}
      />,
    )
    expect(node('其他地区')).toHaveFocus()
  })

  it('connects appearance, FormField errors, semantic slots and the public focus handle', () => {
    const ref = createRef<CascaderHandle>()
    render(
      <ConfigProvider componentSize="large">
        <FormField
          label="所属地区"
          error="必须选择"
          control={
            <Cascader
              options={options}
              ref={ref}
              variant="filled"
              status="warning"
              classNames={{ popup: 'border-dashed' }}
            />
          }
        />
      </ConfigProvider>,
    )
    const trigger = screen.getByRole('combobox', { name: '所属地区' })
    expect(trigger).toHaveAttribute('aria-invalid', 'true')
    expect(trigger).toHaveAttribute('data-status', 'warning')
    expect(trigger).toHaveClass('min-h-12', 'bg-muted')
    act(() => ref.current!.focus())
    expect(trigger).toHaveFocus()
    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(screen.getByRole('dialog')).toHaveClass('border-dashed')
    act(() => ref.current!.blur())
    expect(trigger).not.toHaveFocus()
  })

  it('uses one Tab entry and connects search, reverse Tab, Escape and external blur', () => {
    const onBlur = vi.fn()
    render(
      <>
        <Cascader options={options} showSearch onBlur={onBlur} />
        <button>后续操作</button>
      </>,
    )
    open()
    const search = screen.getByRole('searchbox')
    fireEvent.keyDown(search, { key: 'Tab' })
    expect(node('中国')).toHaveFocus()
    expect(
      within(screen.getByRole('tree'))
        .getAllByRole('treeitem')
        .filter((item) => item.tabIndex === 0),
    ).toHaveLength(1)
    fireEvent.keyDown(node('中国'), { key: 'Tab', shiftKey: true })
    expect(search).toHaveFocus()
    fireEvent.keyDown(search, { key: 'Tab', shiftKey: true })
    expect(screen.getByRole('combobox')).toHaveFocus()
    expect(onBlur).not.toHaveBeenCalled()
    open()
    fireEvent.pointerDown(screen.getByRole('button', { name: '后续操作' }))
    act(() => screen.getByRole('button', { name: '后续操作' }).focus())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '后续操作' })).toHaveFocus()
  })
})
