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
} from '@/shared/ui'
import {
  dateStepMatches,
  parseDate,
  toISO,
} from '@/shared/ui/date-picker-state'

const field = () => screen.getByRole('combobox')
const day = (date: string) =>
  document.querySelector<HTMLButtonElement>(`[data-calendar-date="${date}"]`)!
const open = () => fireEvent.keyDown(field(), { key: 'ArrowDown' })

describe('DatePicker date panel', () => {
  it('browses without changing a date and commits a keyboard selection with input focus restored', () => {
    const onChange = vi.fn(),
      onPanelMonthChange = vi.fn()
    render(
      <DatePicker
        defaultValue="2024-02-29"
        onChange={onChange}
        onPanelMonthChange={onPanelMonthChange}
      />,
    )
    open()
    expect(day('2024-02-29')).toHaveFocus()
    fireEvent.keyDown(day('2024-02-29'), { key: 'ArrowRight' })
    expect(day('2024-03-01')).toHaveFocus()
    expect(onPanelMonthChange).toHaveBeenCalledWith('2024-03')
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.click(day('2024-03-01'))
    expect(onChange).toHaveBeenCalledExactlyOnceWith('2024-03-01')
    expect(field()).toHaveValue('2024-03-01')
    expect(field()).toHaveFocus()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps controlled values authoritative, including an explicitly empty value', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <DatePicker
        value={undefined}
        defaultValue="2024-02-10"
        defaultPanelMonth="2024-02"
        onChange={onChange}
      />,
    )
    expect(field()).toHaveValue('')
    open()
    fireEvent.click(day('2024-02-12'))
    expect(onChange).toHaveBeenCalledWith('2024-02-12')
    expect(field()).toHaveValue('')
    rerender(<DatePicker value="2024-02-12" onChange={onChange} />)
    expect(field()).toHaveValue('2024-02-12')
    open()
    expect(day('2024-02-12')).toHaveFocus()
  })

  it('holds a pending date until confirmation and discards it on Escape or outside focus', () => {
    const onChange = vi.fn(),
      onOk = vi.fn()
    const { container } = render(
      <form>
        <DatePicker
          name="date"
          defaultValue="2024-02-10"
          needConfirm
          onChange={onChange}
          onOk={onOk}
        />
        <button type="button">下一个</button>
      </form>,
    )
    open()
    fireEvent.click(day('2024-02-12'))
    expect(field()).toHaveValue('2024-02-12')
    expect(onChange).not.toHaveBeenCalled()
    expect(new FormData(container.querySelector('form')!).get('date')).toBe(
      '2024-02-10',
    )
    expect(container.querySelector('form')!.checkValidity()).toBe(false)
    fireEvent.keyDown(day('2024-02-12'), { key: 'Escape' })
    expect(field()).toHaveValue('2024-02-10')
    expect(field()).toHaveFocus()
    open()
    fireEvent.click(day('2024-02-13'))
    act(() => screen.getByRole('button', { name: '下一个' }).focus())
    expect(field()).toHaveValue('2024-02-10')
    expect(onChange).not.toHaveBeenCalled()
    open()
    fireEvent.click(day('2024-02-14'))
    fireEvent.click(screen.getByRole('button', { name: '确定' }))
    expect(onChange).toHaveBeenCalledExactlyOnceWith('2024-02-14')
    expect(onOk).toHaveBeenCalledExactlyOnceWith('2024-02-14')
    expect(new FormData(container.querySelector('form')!).get('date')).toBe(
      '2024-02-14',
    )
  })

  it('validates typed ISO dates and commits on Enter or blur without publishing invalid input', () => {
    const onChange = vi.fn()
    render(
      <DatePicker
        defaultValue="2024-02-10"
        min="2024-02-01"
        max="2024-02-29"
        disabledDate={(date) => date === '2024-02-12'}
        onChange={onChange}
      />,
    )
    for (const invalid of [
      '2023-02-29',
      '2024-02-12',
      '2024-03-01',
      '02/12/2024',
    ]) {
      fireEvent.change(field(), { target: { value: invalid } })
      fireEvent.keyDown(field(), { key: 'Enter' })
      expect(field()).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByRole('alert')).toHaveTextContent('请输入可选日期')
      expect(onChange).not.toHaveBeenCalled()
    }
    fireEvent.blur(field())
    expect(field()).toHaveValue('2024-02-10')
    fireEvent.change(field(), { target: { value: '2024-02-29' } })
    fireEvent.keyDown(field(), { key: 'Enter' })
    expect(onChange).toHaveBeenCalledExactlyOnceWith('2024-02-29')
    expect(field()).toHaveValue('2024-02-29')
    fireEvent.change(field(), { target: { value: '2024-02-28' } })
    fireEvent.blur(field())
    expect(onChange).toHaveBeenLastCalledWith('2024-02-28')
  })

  it('respects range and step boundaries in the panel and refuses disabled presets', () => {
    const onChange = vi.fn(),
      preset = vi.fn(() => '2024-02-05')
    render(
      <DatePicker
        min="2024-02-01"
        max="2024-02-09"
        step={2}
        defaultPanelMonth="2024-02"
        onChange={onChange}
        presets={[
          { key: 'disabled', label: '不可选日期', value: '2024-02-02' },
          { key: 'live', label: '动态日期', value: preset },
        ]}
      />,
    )
    open()
    expect(day('2024-02-02')).toBeDisabled()
    expect(day('2024-02-10')).toBeDisabled()
    expect(screen.getByRole('button', { name: '上个月' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '下个月' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '不可选日期' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '动态日期' }))
    expect(preset).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith('2024-02-05')
  })

  it('preserves input drafts and pending selections when focus returns from the panel', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <DatePicker defaultValue="2024-02-10" onChange={onChange} />,
    )
    act(() => field().focus())
    fireEvent.click(field())
    fireEvent.change(field(), { target: { value: '2024-03-15' } })
    act(() => screen.getByRole('button', { name: '下个月' }).focus())
    act(() => field().focus())
    expect(field()).toHaveValue('2024-03-15')
    fireEvent.keyDown(field(), { key: 'Enter' })
    expect(onChange).toHaveBeenCalledExactlyOnceWith('2024-03-15')

    rerender(
      <DatePicker defaultValue="2024-02-10" needConfirm onChange={onChange} />,
    )
    open()
    fireEvent.click(day('2024-03-16'))
    act(() => field().focus())
    fireEvent.click(field())
    expect(field()).toHaveValue('2024-03-16')
    expect(onChange).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: '确定' }))
    expect(onChange).toHaveBeenLastCalledWith('2024-03-16')
  })

  it('clears the value and responds to native form reset without emitting a change', () => {
    const onChange = vi.fn(),
      onClear = vi.fn()
    const { container } = render(
      <form>
        <DatePicker
          defaultValue="2024-02-10"
          onChange={onChange}
          onClear={onClear}
        />
      </form>,
    )
    fireEvent.click(screen.getByRole('button', { name: '清空日期' }))
    expect(onChange).toHaveBeenCalledExactlyOnceWith('')
    expect(onClear).toHaveBeenCalledOnce()
    expect(field()).toHaveFocus()
    fireEvent.change(field(), { target: { value: 'invalid' } })
    open()
    fireEvent.reset(container.querySelector('form')!)
    expect(field()).toHaveValue('2024-02-10')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onChange).toHaveBeenCalledOnce()
  })

  it('handles controlled open and month updates and does not reopen after disabling', () => {
    const onOpenChange = vi.fn(),
      onPanelMonthChange = vi.fn()
    const { rerender } = render(
      <DatePicker
        open={false}
        panelMonth="2024-02"
        onOpenChange={onOpenChange}
        onPanelMonthChange={onPanelMonthChange}
      />,
    )
    open()
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    rerender(
      <DatePicker
        open
        panelMonth="2024-02"
        onOpenChange={onOpenChange}
        onPanelMonthChange={onPanelMonthChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '下个月' }))
    expect(onPanelMonthChange).toHaveBeenCalledWith('2024-03')
    expect(screen.getByRole('grid', { name: /2024年2月/ })).toBeInTheDocument()
    rerender(<DatePicker open panelMonth="2024-03" disabled />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(field()).toBeDisabled()
    rerender(<DatePicker defaultOpen defaultPanelMonth="2024-02" />)
    // Switching back to uncontrolled open preserves its own closed state.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('associates the confirmed hidden value with an external native form', () => {
    const { container, rerender } = render(
      <>
        <form id="external-date-form" />
        <DatePicker
          name="date"
          form="external-date-form"
          defaultValue="2024-02-10"
        />
      </>,
    )
    const form = container.querySelector('form')!
    expect(new FormData(form).get('date')).toBe('2024-02-10')
    fireEvent.click(screen.getByRole('button', { name: '清空日期' }))
    expect(new FormData(form).get('date')).toBe('')
    fireEvent.reset(form)
    expect(new FormData(form).get('date')).toBe('2024-02-10')
    rerender(
      <>
        <form id="external-date-form" />
        <DatePicker name="date" form="external-date-form" disabled />
      </>,
    )
    expect(new FormData(form).has('date')).toBe(false)
  })

  it('shares field errors, ref, size and RTL semantics and keeps native mode available', () => {
    const ref = vi.fn()
    const { rerender } = render(
      <ConfigProvider componentSize="large" direction="rtl">
        <FormField
          label="预约日期"
          required
          error="请选择日期"
          control={<DatePicker ref={ref} label="预约日期" />}
        />
      </ConfigProvider>,
    )
    expect(field()).toHaveAccessibleName('预约日期')
    expect(field()).toHaveAttribute('aria-invalid', 'true')
    expect(field()).toHaveClass('min-h-12')
    expect(field()).toHaveAttribute('aria-describedby')
    expect(ref).toHaveBeenCalledWith(field())
    open()
    expect(screen.getByRole('dialog')).toHaveAttribute('dir', 'rtl')
    rerender(
      <DatePicker mode="native" defaultValue="2024-02-10" label="原生日期" />,
    )
    expect(screen.getByLabelText('原生日期')).toHaveAttribute('type', 'date')
  })

  it('uses an inline panel with independent confirmation and protects read-only fields', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <DatePicker
        mode="panel"
        defaultValue="2024-02-10"
        needConfirm
        onChange={onChange}
      />,
    )
    fireEvent.click(day('2024-02-12'))
    expect(screen.getByRole('textbox')).toHaveValue('2024-02-12')
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(screen.getByRole('textbox')).toHaveValue('2024-02-10')
    expect(onChange).not.toHaveBeenCalled()
    rerender(
      <DatePicker
        mode="panel"
        defaultValue="2024-02-10"
        readOnly
        onChange={onChange}
      />,
    )
    expect(day('2024-02-12')).toBeDisabled()
    expect(
      screen.queryByRole('button', { name: '清空日期' }),
    ).not.toBeInTheDocument()
  })

  it('integrates with the project form and resets its controlled date', async () => {
    const onFinish = vi.fn()
    render(
      <Form onFinish={onFinish}>
        <FormItem
          name="date"
          label="预约日期"
          rules={[{ required: true, message: '请选择预约日期' }]}
          control={<DatePicker label="预约日期" defaultPanelMonth="2024-02" />}
        />
        <button type="submit">提交预约</button>
        <button type="reset">重置预约</button>
      </Form>,
    )
    fireEvent.click(screen.getByRole('button', { name: '提交预约' }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('请选择预约日期'),
    )
    open()
    fireEvent.click(day('2024-02-12'))
    fireEvent.click(screen.getByRole('button', { name: '提交预约' }))
    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith({ date: '2024-02-12' }),
    )
    fireEvent.click(screen.getByRole('button', { name: '重置预约' }))
    expect(field()).toHaveValue('')
  })

  it('validates on blur only after focus leaves the input, its buttons and the portalled panel', async () => {
    const onBlur = vi.fn()
    render(
      <>
        <Form validateOn="blur">
          <FormItem
            name="date"
            label="预约日期"
            rules={[{ required: true, message: '请选择预约日期' }]}
            control={
              <DatePicker
                label="预约日期"
                inputReadOnly
                defaultPanelMonth="2024-02"
                onBlur={onBlur}
              />
            }
          />
        </Form>
        <button>下一项</button>
      </>,
    )
    act(() => field().focus())
    open()
    expect(day('2024-02-01')).toHaveFocus()
    expect(onBlur).not.toHaveBeenCalled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    act(() => screen.getByRole('button', { name: '下个月' }).focus())
    expect(onBlur).not.toHaveBeenCalled()
    act(() => screen.getByRole('button', { name: '下一项' }).focus())
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('请选择预约日期'),
    )
    expect(onBlur).toHaveBeenCalledOnce()
    act(() => field().focus())
    open()
    fireEvent.click(day('2024-02-14'))
    expect(field()).toHaveFocus()
    expect(onBlur).toHaveBeenCalledOnce()
    act(() => screen.getByRole('button', { name: '打开预约日期面板' }).focus())
    expect(onBlur).toHaveBeenCalledOnce()
    act(() => screen.getByRole('button', { name: '下一项' }).focus())
    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument(),
    )
    expect(onBlur).toHaveBeenCalledTimes(2)
  })

  it('reveals manually committed and preset dates and reports a dynamic preset that becomes unavailable', () => {
    const unavailable = vi.fn(() => '2024-02-12')
    render(
      <DatePicker
        defaultValue="2024-02-10"
        disabledDate={(date) => date === '2024-02-12'}
        presets={[
          { key: 'live', label: '动态日期', value: unavailable },
          { key: 'march', label: '三月日期', value: '2024-03-14' },
        ]}
      />,
    )
    expect(unavailable).not.toHaveBeenCalled()
    open()
    fireEvent.click(screen.getByRole('button', { name: '动态日期' }))
    expect(screen.getByRole('alert')).toHaveTextContent('快捷日期当前不可选')
    expect(field()).toHaveValue('2024-02-10')
    fireEvent.click(screen.getByRole('button', { name: '三月日期' }))
    open()
    expect(day('2024-03-14')).toHaveFocus()
    fireEvent.change(field(), { target: { value: '2024-04-15' } })
    fireEvent.keyDown(field(), { key: 'Enter' })
    open()
    expect(day('2024-04-15')).toHaveFocus()
  })

  it('keeps the popup in the field Tab order and closes when focus leaves it', () => {
    render(
      <>
        <DatePicker defaultValue="2024-02-10" />
        <button>之后</button>
      </>,
    )
    open()
    const popup = screen.getByRole('dialog')
    const first = within(popup).getByRole('button', { name: '上个月' })
    first.focus()
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })
    expect(field()).toHaveFocus()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    open()
    fireEvent.keyDown(day('2024-02-10'), { key: 'Tab' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '清空日期' })).toHaveFocus()
  })

  it('parses leap days and early years strictly and applies day steps without timezone offsets', () => {
    expect(parseDate('2023-02-29')).toBeUndefined()
    expect(parseDate('2024-02-29')).toBeDefined()
    expect(parseDate('0000-01-01')).toBeUndefined()
    expect(toISO(parseDate('0099-02-28')!)).toBe('0099-02-28')
    expect(dateStepMatches('2024-03-11', '2024-03-09', 2)).toBe(true)
    expect(dateStepMatches('2024-03-10', '2024-03-09', 2)).toBe(false)
  })
})
