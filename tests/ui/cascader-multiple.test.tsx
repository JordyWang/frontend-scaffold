import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  Cascader,
  ConfigProvider,
  Form,
  FormItem,
  type CascaderOption,
} from '@/shared/ui'

const options: CascaderOption[] = [
  {
    value: 'cn',
    label: '中国',
    children: [
      {
        value: 'sh',
        label: '上海',
        children: [
          { value: 'center', label: '中心城区' },
          { value: 'long', label: '浦东新区' },
          { value: 'disabled', label: '禁用区域', disabled: true },
        ],
      },
      {
        value: 'bj',
        label: '北京',
        children: [{ value: 'center', label: '中心城区' }],
      },
      {
        value: 'readonly',
        label: '不可勾选目录',
        disableCheckbox: true,
        children: [{ value: 'independent', label: '独立区域' }],
      },
    ],
  },
  {
    value: 'other',
    label: '其他地区',
    children: [{ value: 'center', label: '中心城区' }],
  },
  {
    value: 'disabled',
    label: '禁用地区',
    disabled: true,
    children: [{ value: 'child', label: '禁用后代' }],
  },
]
const node = (name: string) =>
  screen.getByRole('treeitem', { name, exact: true })
const open = () => fireEvent.click(screen.getByRole('combobox'))
const check = (name: string) =>
  fireEvent.click(node(name).querySelector('[data-cascader-checkbox]')!)

describe('Cascader multiple paths', () => {
  it('separates browsing from checks and conducts complete branches with mixed states', () => {
    const onChange = vi.fn()
    render(
      <Cascader
        multiple
        options={options}
        defaultValue={[['cn', 'sh', 'center']]}
        onChange={onChange}
        name="regions"
      />,
    )
    open()
    expect(node('中国')).toHaveAttribute('aria-checked', 'mixed')
    expect(node('上海')).toHaveAttribute('aria-checked', 'mixed')
    fireEvent.click(node('中国'))
    expect(onChange).not.toHaveBeenCalled()
    check('上海')
    expect(onChange).toHaveBeenCalledExactlyOnceWith([['cn', 'sh']])
    expect(node('上海')).toHaveAttribute('aria-checked', 'true')
    expect(node('中国')).toHaveAttribute('aria-checked', 'mixed')
    check('北京')
    expect(onChange).toHaveBeenLastCalledWith([['cn']])
    expect(node('中国')).toHaveAttribute('aria-checked', 'true')
    expect(document.querySelector('input[name="regions"]')).toHaveValue(
      '[["cn"]]',
    )
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    check('中国')
    expect(onChange).toHaveBeenLastCalledWith([])
  })

  it('uses full paths for duplicate values and keeps hidden checks when searching', () => {
    const onChange = vi.fn()
    render(
      <Cascader
        multiple
        options={options}
        showSearch
        autoClearSearchValue={false}
        showCheckedStrategy="leaf"
        defaultValue={[['other', 'center']]}
        onChange={onChange}
      />,
    )
    open()
    const search = screen.getByRole('searchbox')
    fireEvent.change(search, { target: { value: '中心' } })
    const result = screen.getByRole('option', {
      name: '中国 / 北京 / 中心城区',
    })
    fireEvent.keyDown(search, { key: 'ArrowDown' })
    fireEvent.keyDown(result, { key: ' ' })
    expect(onChange).toHaveBeenCalledExactlyOnceWith([
      ['cn', 'bj', 'center'],
      ['other', 'center'],
    ])
    expect(search).toHaveValue('中心')
    expect(screen.getByRole('listbox')).toHaveAttribute(
      'aria-multiselectable',
      'true',
    )
    expect(
      screen.getByRole('option', { name: '其他地区 / 中心城区' }),
    ).toHaveAttribute('aria-checked', 'true')
    fireEvent.change(search, { target: { value: '禁用后代' } })
    const disabled = screen.getByRole('option')
    expect(disabled).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(disabled)
    fireEvent.click(disabled.querySelector('[data-cascader-checkbox]')!)
    expect(onChange).toHaveBeenCalledOnce()
  })

  it('stops check conduction at disableCheckbox while allowing its descendants to be browsed and checked', () => {
    const onChange = vi.fn()
    render(<Cascader multiple options={options} onChange={onChange} />)
    open()
    fireEvent.click(node('中国'))
    check('中国')
    const directory = node('不可勾选目录')
    expect(directory).toHaveAttribute('aria-description', '勾选已禁用')
    fireEvent.keyDown(directory, { key: ' ' })
    expect(onChange).toHaveBeenCalledOnce()
    fireEvent.keyDown(directory, { key: 'ArrowRight' })
    expect(node('独立区域')).toHaveFocus()
    expect(node('独立区域')).toHaveAttribute('aria-checked', 'false')
    fireEvent.keyDown(node('独立区域'), { key: ' ' })
    expect(onChange).toHaveBeenLastCalledWith([
      ['cn'],
      ['cn', 'readonly', 'independent'],
    ])
    check('中国')
    expect(onChange).toHaveBeenLastCalledWith([
      ['cn', 'readonly', 'independent'],
    ])
  })

  it('expands controlled parent paths, returns the requested strategy and clears search without closing', () => {
    const onChange = vi.fn(),
      onSearch = vi.fn()
    render(
      <Cascader
        multiple
        options={options}
        value={[['cn']]}
        showCheckedStrategy="leaf"
        showSearch
        onSearch={onSearch}
        onChange={onChange}
      />,
    )
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveTextContent('中国 / 上海 / 中心城区')
    expect(trigger).toHaveTextContent('中国 / 北京 / 中心城区')
    open()
    const search = screen.getByRole('searchbox')
    fireEvent.change(search, { target: { value: '浦东' } })
    fireEvent.click(screen.getByRole('option'))
    expect(onChange).toHaveBeenCalledExactlyOnceWith([
      ['cn', 'sh', 'center'],
      ['cn', 'bj', 'center'],
    ])
    expect(search).toHaveValue('')
    expect(search).toHaveFocus()
    expect(onSearch.mock.calls).toEqual([['浦东'], ['']])
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(node('浦东新区')).toHaveAttribute('aria-checked', 'true')
  })

  it('keeps undefined controlled and preserves unknown and disabled paths during other checks', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <Cascader
        multiple
        options={options}
        value={undefined}
        defaultValue={[['other']]}
        onChange={onChange}
      />,
    )
    open()
    check('中国')
    expect(onChange).toHaveBeenLastCalledWith([['cn']])
    expect(screen.getByRole('combobox')).toHaveTextContent('请选择')
    rerender(
      <Cascader
        multiple
        options={options}
        value={[
          ['unknown', 'child'],
          ['disabled', 'child'],
        ]}
        onChange={onChange}
      />,
    )
    check('其他地区')
    expect(onChange).toHaveBeenLastCalledWith([
      ['other'],
      ['unknown', 'child'],
      ['disabled', 'child'],
    ])
    expect(
      screen.queryByRole('button', { name: '移除禁用地区 / 禁用后代' }),
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '移除unknown / child' }))
    expect(onChange).toHaveBeenLastCalledWith([['disabled', 'child']])
    expect(screen.getByRole('combobox')).toHaveFocus()
  })

  it('removes a parent tag as a branch and Backspace removes the last removable path', () => {
    const onChange = vi.fn()
    render(
      <Cascader
        multiple
        options={options}
        defaultValue={[['cn'], ['other'], ['disabled', 'child']]}
        onChange={onChange}
        maxTagCount={1}
      />,
    )
    const trigger = screen.getByRole('combobox')
    expect(within(trigger).queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByLabelText('另有 2 项已选路径')).toHaveTextContent('+2')
    fireEvent.click(
      screen.getByRole('button', { name: '移除中国', exact: true }),
    )
    expect(onChange).toHaveBeenLastCalledWith([
      ['other'],
      ['disabled', 'child'],
    ])
    expect(trigger).toHaveFocus()
    fireEvent.keyDown(trigger, { key: 'Backspace' })
    expect(onChange).toHaveBeenLastCalledWith([['disabled', 'child']])
    fireEvent.keyDown(trigger, { key: 'Delete' })
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it('retains removed option values for restoration without firing change callbacks', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <Cascader
        multiple
        options={options}
        defaultValue={[['other', 'center']]}
        onChange={onChange}
      />,
    )
    const trigger = screen.getByRole('combobox')
    rerender(
      <Cascader
        multiple
        options={options.filter((option) => option.value !== 'other')}
        onChange={onChange}
      />,
    )
    expect(trigger).toHaveTextContent('other / center')
    rerender(<Cascader multiple options={options} onChange={onChange} />)
    expect(trigger).toHaveTextContent('其他地区')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('connects tag rendering, disabled protection, semantic slots and one clear callback', () => {
    const onChange = vi.fn(),
      onClear = vi.fn()
    render(
      <Cascader
        multiple
        options={options}
        defaultValue={[['cn'], ['other']]}
        allowClear
        onChange={onChange}
        onClear={onClear}
        maxTagCount={1}
        maxTagPlaceholder={(paths) => `隐藏 ${paths.length} 条`}
        tagRender={({ label }) => <strong>{label}</strong>}
        classNames={{ tag: 'border-dashed', checkbox: 'text-primary' }}
      />,
    )
    expect(
      screen.getByRole('button', { name: '移除中国', exact: true })
        .parentElement,
    ).toHaveClass('border-dashed')
    expect(screen.getByText('隐藏 1 条')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '清空级联选择' }))
    expect(onChange).toHaveBeenCalledExactlyOnceWith([])
    expect(onClear).toHaveBeenCalledOnce()
    expect(screen.getByRole('combobox')).toHaveFocus()
  })

  it('supports a checked RTL embedded panel with one roving Tab entry', () => {
    render(
      <ConfigProvider direction="rtl">
        <Cascader multiple mode="panel" options={options} />
      </ConfigProvider>,
    )
    const tree = screen.getByRole('tree')
    expect(tree).toHaveAttribute('aria-multiselectable', 'true')
    act(() => node('中国').focus())
    fireEvent.keyDown(node('中国'), { key: 'ArrowLeft' })
    expect(node('上海')).toHaveFocus()
    fireEvent.keyDown(node('上海'), { key: ' ' })
    expect(node('上海')).toHaveAttribute('aria-checked', 'true')
    expect(node('中国')).toHaveAttribute('aria-checked', 'mixed')
    expect(
      within(tree)
        .getAllByRole('treeitem')
        .filter((item) => item.tabIndex === 0),
    ).toHaveLength(1)
  })

  it('integrates with array-valued FormItem and reset', async () => {
    function Example() {
      const [submitted, setSubmitted] = useState('')
      return (
        <Form
          initialValues={{ places: [] }}
          onFinish={(values) => setSubmitted(JSON.stringify(values.places))}
        >
          <FormItem
            name="places"
            label="多选地区"
            emptyValue={[]}
            control={<Cascader multiple options={options} />}
          />
          <button type="submit">提交</button>
          <button type="reset">重置</button>
          <output>{submitted}</output>
        </Form>
      )
    }
    render(<Example />)
    open()
    check('中国')
    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('[["cn"]]'),
    )
    fireEvent.reset(
      screen.getByRole('button', { name: '重置' }).closest('form')!,
    )
    expect(screen.getByRole('combobox')).toHaveTextContent('请选择')
  })
})
