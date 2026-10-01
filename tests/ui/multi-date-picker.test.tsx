import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  ConfigProvider,
  DatePicker,
  Form,
  FormField,
  FormItem,
  MultiDatePicker,
} from '@/shared/ui'

const field = () =>
  screen.getByRole('combobox', { name: '多选日期', exact: true })
const open = () => fireEvent.keyDown(field(), { key: 'ArrowDown' })
const day = (date: string) =>
  document.querySelector<HTMLButtonElement>(
    '[data-calendar-date="' + date + '"]',
  )!

describe('DatePicker multiple date sessions', () => {
  it('keeps leap-month toggles pending, navigates without selection and submits a deduplicated ordered JSON list', () => {
    const onChange = vi.fn(),
      onCalendarChange = vi.fn()
    const { container } = render(
      <form>
        <DatePicker
          multiple
          name="dates"
          defaultPanelMonth="2024-02"
          onChange={onChange}
          onCalendarChange={onCalendarChange}
        />
      </form>,
    )
    open()
    const grid = screen.getByRole('grid')
    expect(grid).toHaveAttribute('aria-multiselectable', 'true')
    fireEvent.click(day('2024-02-29'))
    expect(day('2024-02-29').closest('td')).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(day('2024-02-29')).toHaveAccessibleName(/已选择/)
    fireEvent.keyDown(day('2024-02-29'), { key: 'ArrowRight' })
    expect(day('2024-03-01')).toHaveFocus()
    expect(onCalendarChange).toHaveBeenCalledTimes(1)
    fireEvent.click(day('2024-03-02'))
    fireEvent.click(day('2024-03-02'))
    fireEvent.click(day('2024-03-01'))
    expect(onCalendarChange).toHaveBeenLastCalledWith([
      '2024-02-29',
      '2024-03-01',
    ])
    expect(onChange).not.toHaveBeenCalled()
    const form = container.querySelector('form')!
    expect(new FormData(form).get('dates')).toBe('[]')
    fireEvent.click(screen.getByRole('button', { name: '完成', exact: true }))
    expect(onChange).toHaveBeenCalledExactlyOnceWith([
      '2024-02-29',
      '2024-03-01',
    ])
    expect(new FormData(form).get('dates')).toBe('["2024-02-29","2024-03-01"]')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(field()).toHaveFocus()
  })

  it('commits ordinary sessions only after composite blur and discards confirmation sessions on Escape and external focus', () => {
    const onChange = vi.fn(),
      onBlur = vi.fn()
    const { rerender } = render(
      <>
        <MultiDatePicker
          defaultValue={['2024-02-10']}
          onChange={onChange}
          onBlur={onBlur}
        />
        <button>外部</button>
      </>,
    )
    act(() => field().focus())
    open()
    fireEvent.click(day('2024-02-14'))
    act(() => field().focus())
    expect(onChange).not.toHaveBeenCalled()
    expect(onBlur).not.toHaveBeenCalled()
    act(() => screen.getByRole('button', { name: '外部' }).focus())
    expect(onChange).toHaveBeenCalledExactlyOnceWith([
      '2024-02-10',
      '2024-02-14',
    ])
    expect(onBlur).toHaveBeenCalledOnce()
    rerender(
      <>
        <MultiDatePicker
          defaultValue={['2024-02-10']}
          needConfirm
          onChange={onChange}
        />
        <button>外部</button>
      </>,
    )
    open()
    fireEvent.click(day('2024-02-20'))
    fireEvent.keyDown(day('2024-02-20'), { key: 'Escape' })
    expect(
      screen.queryByRole('button', { name: '移除日期 2024-02-20' }),
    ).not.toBeInTheDocument()
    open()
    fireEvent.click(day('2024-02-21'))
    act(() => screen.getByRole('button', { name: '外部' }).focus())
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('preserves explicit controlled emptiness, requests controlled opening and accepts externally replaced selections', () => {
    const onChange = vi.fn(),
      onOpenChange = vi.fn()
    const { rerender } = render(
      <DatePicker
        multiple
        value={undefined}
        defaultValue={['2024-02-10']}
        defaultPanelMonth="2024-02"
        onChange={onChange}
        open={false}
        onOpenChange={onOpenChange}
      />,
    )
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    open()
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    rerender(
      <DatePicker
        multiple
        value={undefined}
        defaultPanelMonth="2024-02"
        onChange={onChange}
      />,
    )
    open()
    fireEvent.click(day('2024-02-10'))
    fireEvent.click(screen.getByRole('button', { name: '完成', exact: true }))
    expect(onChange).toHaveBeenCalledWith(['2024-02-10'])
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    rerender(
      <DatePicker
        multiple
        value={['2024-03-02', '2024-02-29', '2024-03-02']}
      />,
    )
    expect(screen.getByRole('list').textContent).toBe('2024-02-292024-03-02')
  })

  it('keeps insertion order when requested, validates presets at invocation and reports explicit confirmation', () => {
    const dynamic = vi.fn(() => ['2024-02-12']),
      onChange = vi.fn(),
      onOk = vi.fn()
    render(
      <DatePicker
        multiple
        order={false}
        needConfirm
        defaultPanelMonth="2024-02"
        onChange={onChange}
        onOk={onOk}
        disabledDate={(date) => date === '2024-02-12'}
        presets={[
          { key: 'live', label: '动态预设', value: dynamic },
          {
            key: 'days',
            label: '无序预设',
            value: ['2024-02-29', '2024-02-10', '2024-02-29'],
          },
          { key: 'bad', label: '禁用预设', value: ['2024-02-12'] },
        ]}
      />,
    )
    expect(dynamic).not.toHaveBeenCalled()
    open()
    expect(screen.getByRole('button', { name: '禁用预设' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '动态预设' }))
    expect(dynamic).toHaveBeenCalledOnce()
    expect(screen.getByRole('alert')).toHaveTextContent('快捷日期当前不可选')
    fireEvent.click(screen.getByRole('button', { name: '无序预设' }))
    fireEvent.click(day('2024-02-14'))
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '确定', exact: true }))
    expect(onChange).toHaveBeenCalledExactlyOnceWith([
      '2024-02-29',
      '2024-02-10',
      '2024-02-14',
    ])
    expect(onOk).toHaveBeenCalledWith([
      '2024-02-29',
      '2024-02-10',
      '2024-02-14',
    ])
  })

  it('discards a pending session when an external controller closes then reopens its panel', () => {
    const onChange = vi.fn()
    const props = { defaultValue: ['2024-02-10'], needConfirm: true, onChange }
    const { rerender } = render(<MultiDatePicker {...props} open />)
    fireEvent.click(day('2024-02-14'))
    expect(
      screen.getByRole('button', { name: '移除日期 2024-02-14' }),
    ).toBeInTheDocument()
    rerender(<MultiDatePicker {...props} open={false} />)
    rerender(<MultiDatePicker {...props} open />)
    expect(day('2024-02-14').closest('td')).toHaveAttribute(
      'aria-selected',
      'false',
    )
    expect(
      screen.queryByRole('button', { name: '移除日期 2024-02-14' }),
    ).not.toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('adds typed ISO dates only once, enforces bounds and day steps and restores invalid input on blur', () => {
    const onChange = vi.fn()
    render(
      <>
        <MultiDatePicker
          min="2024-02-01"
          max="2024-02-29"
          step={2}
          onChange={onChange}
        />
        <button>外部</button>
      </>,
    )
    for (const date of ['2024-02-03', '2024-02-03', '2024-02-29']) {
      fireEvent.change(field(), { target: { value: date } })
      fireEvent.keyDown(field(), { key: 'Enter' })
    }
    expect(screen.getAllByRole('button', { name: /移除日期/ })).toHaveLength(2)
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '完成', exact: true }))
    expect(onChange).toHaveBeenLastCalledWith(['2024-02-03', '2024-02-29'])
    for (const invalid of ['2023-02-29', '2024-02-02', '2024-03-01']) {
      fireEvent.change(field(), { target: { value: invalid } })
      fireEvent.keyDown(field(), { key: 'Enter' })
      expect(screen.getByRole('alert')).toHaveTextContent('请输入可选日期')
    }
    fireEvent.blur(field())
    expect(field()).toHaveValue('')
    expect(screen.getByRole('alert')).toHaveTextContent('已恢复已选日期')
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('allows removing selected dates at the count limit and keeps a temporary full list out of form submissions', () => {
    const onChange = vi.fn()
    render(
      <MultiDatePicker
        maxCount={2}
        defaultPanelMonth="2024-02"
        onChange={onChange}
      />,
    )
    open()
    fireEvent.click(day('2024-02-10'))
    fireEvent.click(day('2024-02-14'))
    expect(day('2024-02-15')).toBeDisabled()
    expect(day('2024-02-10')).not.toBeDisabled()
    fireEvent.click(day('2024-02-10'))
    expect(day('2024-02-15')).not.toBeDisabled()
    fireEvent.click(day('2024-02-15'))
    fireEvent.click(screen.getByRole('button', { name: '完成', exact: true }))
    expect(onChange).toHaveBeenCalledWith(['2024-02-14', '2024-02-15'])
  })

  it('removes individual and collapsed dates with buttons or Backspace, restores focus and clears immediately', () => {
    const onChange = vi.fn(),
      onClear = vi.fn()
    render(
      <MultiDatePicker
        defaultValue={['2024-02-10', '2024-02-14', '2024-02-20']}
        maxTagCount={1}
        renderTag={(date) => '日程 ' + date}
        onChange={onChange}
        onClear={onClear}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '另外 2 个日期' }))
    expect(
      screen.getByRole('button', { name: '移除日期 2024-02-20' }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '移除日期 2024-02-14' }))
    expect(onChange).toHaveBeenLastCalledWith(['2024-02-10', '2024-02-20'])
    expect(field()).toHaveFocus()
    fireEvent.keyDown(field(), { key: 'Backspace' })
    expect(onChange).toHaveBeenLastCalledWith(['2024-02-10'])
    fireEvent.click(screen.getByRole('button', { name: '清空多选日期' }))
    expect(onChange).toHaveBeenLastCalledWith([])
    expect(onClear).toHaveBeenCalledOnce()
    expect(field()).toHaveFocus()
  })

  it('recovers focused tags removed by external values and permits gradual cleanup of unavailable external dates', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <MultiDatePicker
        value={['2024-02-10', '2024-02-12', '2024-02-14']}
        maxTagCount={10}
        disabledDate={(date) => date !== '2024-02-10'}
        onChange={onChange}
      />,
    )
    act(() =>
      screen.getByRole('button', { name: '移除日期 2024-02-14' }).focus(),
    )
    rerender(
      <MultiDatePicker
        value={['2024-02-10', '2024-02-12']}
        disabledDate={(date) => date !== '2024-02-10'}
        onChange={onChange}
      />,
    )
    expect(field()).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: '移除日期 2024-02-10' }))
    expect(onChange).toHaveBeenCalledWith(['2024-02-12'])
    expect(field()).toHaveAttribute('aria-invalid', 'true')
  })

  it('keeps confirmation sessions on reverse Tab and cancels on forward footer Tab without focusing a disappearing clear', () => {
    const onChange = vi.fn()
    render(
      <MultiDatePicker
        needConfirm
        defaultPanelMonth="2024-02"
        onChange={onChange}
      />,
    )
    open()
    fireEvent.click(day('2024-02-10'))
    const popup = screen.getByRole('dialog'),
      first = within(popup).getByRole('button', { name: '上个月', exact: true })
    act(() => first.focus())
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })
    expect(field()).toHaveFocus()
    expect(
      screen.getByRole('button', { name: '移除日期 2024-02-10' }),
    ).toBeInTheDocument()
    const confirm = screen.getByRole('button', { name: '确定', exact: true })
    act(() => confirm.focus())
    fireEvent.keyDown(confirm, { key: 'Tab' })
    expect(
      screen.getByRole('button', { name: '打开多选日期面板' }),
    ).toHaveFocus()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('supports external native form reset and omits disabled JSON fields', () => {
    const onChange = vi.fn()
    const { container, rerender } = render(
      <>
        <form id="multi-form" />
        <MultiDatePicker
          name="dates"
          form="multi-form"
          defaultValue={['2024-02-10']}
          onChange={onChange}
        />
      </>,
    )
    open()
    fireEvent.click(day('2024-02-14'))
    const form = container.querySelector('form')!
    expect(new FormData(form).get('dates')).toBe('["2024-02-10"]')
    fireEvent.reset(form)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '移除日期 2024-02-14' }),
    ).not.toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
    rerender(
      <>
        <form id="multi-form" />
        <MultiDatePicker
          name="dates"
          form="multi-form"
          disabled
          defaultValue={['2024-02-10']}
        />
      </>,
    )
    expect(new FormData(form).has('dates')).toBe(false)
    expect(field()).toBeDisabled()
    expect(
      screen.queryByRole('button', { name: /移除日期/ }),
    ).not.toBeInTheDocument()
  })

  it('integrates a named array value and composite blur with Form and keeps the single-date API intact', async () => {
    const onFinish = vi.fn(),
      onBlur = vi.fn()
    render(
      <>
        <Form validateOn="blur" onFinish={onFinish}>
          <FormItem
            name="dates"
            label="多选日期"
            emptyValue={[]}
            rules={[{ required: true, message: '选择日程' }]}
            control={
              <DatePicker
                multiple
                inputReadOnly
                defaultPanelMonth="2024-02"
                onBlur={onBlur}
              />
            }
          />
          <button type="submit">提交</button>
        </Form>
        <FormField
          label="单日期"
          control={<DatePicker defaultValue="2024-02-14" />}
        />
      </>,
    )
    act(() => field().focus())
    open()
    fireEvent.click(day('2024-02-10'))
    expect(onBlur).not.toHaveBeenCalled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '完成', exact: true }))
    act(() => screen.getByRole('button', { name: '提交' }).focus())
    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith({ dates: ['2024-02-10'] }),
    )
    expect(onBlur).toHaveBeenCalledOnce()
    expect(screen.getByRole('combobox', { name: '单日期' })).toHaveValue(
      '2024-02-14',
    )
  })

  it('supports readonly inline RTL panels while retaining selected date semantics', () => {
    const onChange = vi.fn()
    render(
      <ConfigProvider direction="rtl">
        <MultiDatePicker
          mode="panel"
          readOnly
          defaultValue={['2024-02-10', '2024-02-14']}
          onChange={onChange}
        />
      </ConfigProvider>,
    )
    expect(screen.getByRole('grid')).toHaveAttribute(
      'aria-multiselectable',
      'true',
    )
    expect(day('2024-02-10')).toBeDisabled()
    expect(day('2024-02-14').closest('td')).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(
      screen.queryByRole('button', { name: /移除日期/ }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '完成', exact: true }),
    ).toBeDisabled()
    expect(onChange).not.toHaveBeenCalled()
  })
})
