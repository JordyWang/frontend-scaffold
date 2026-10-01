import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DatePicker, DateTimePicker, Form, FormItem } from '@/shared/ui'
import {
  dateTimeDateSelectable,
  dateTimeDisplay,
  dateTimeForDate,
  dateTimeInput,
  dateTimeSeconds,
  dateTimeSelectable,
  parseDateTime,
} from '@/shared/ui/date-time-picker-state'

const input = () => screen.getByRole('combobox')
const open = () => fireEvent.keyDown(input(), { key: 'ArrowDown' })
const day = (date: string) =>
  document.querySelector<HTMLButtonElement>(
    '[data-calendar-date="' + date + '"]',
  )!
const option = (unit: string, value: number) =>
  document.querySelector<HTMLButtonElement>(
    '[data-time-unit="' + unit + '"][data-time-value="' + value + '"]',
  )!
const confirm = () =>
  fireEvent.click(screen.getByRole('button', { name: '确定', exact: true }))

describe('civil date-time values', () => {
  it.each([
    '2025-02-29T09:00',
    '0000-01-01T00:00',
    '2024-02-29T24:00',
    '2024-02-29T09:00Z',
    '2024-02-29T09:00+08:00',
    '2024-02-29T09:00:00.1',
    '2024-2-29T09:00',
  ])('rejects invalid or timezone-bearing value %s', (value) =>
    expect(parseDateTime(value)).toBeUndefined(),
  )
  it('keeps leap days, early years and daylight-saving local fields without timezone conversion', () => {
    expect(parseDateTime('0001-01-01T00:00')).toEqual({
      date: '0001-01-01',
      time: '00:00',
    })
    expect(parseDateTime('2024-03-10T02:30')).toEqual({
      date: '2024-03-10',
      time: '02:30',
    })
    expect(
      dateTimeSeconds('2024-03-11T02:30') - dateTimeSeconds('2024-03-10T02:30'),
    ).toBe(86400)
    expect(
      dateTimeSeconds('2024-03-01T00:00') - dateTimeSeconds('2024-02-29T00:00'),
    ).toBe(86400)
    expect(parseDateTime('2024-02-29T09:00', 'second')).toBeUndefined()
  })
  it('accepts project display input and preserves a canonical 24-hour value', () => {
    expect(dateTimeInput('2024-02-29 12:30 AM', 'minute', true)).toBe(
      '2024-02-29T00:30',
    )
    expect(dateTimeDisplay('2024-02-29T13:30:45', 'second', true)).toBe(
      '2024-02-29 01:30:45 PM',
    )
    expect(dateTimeInput('2024-02-29T13:30:45', 'second', true)).toBe(
      '2024-02-29T13:30:45',
    )
    expect(dateTimeInput('2024-02-29 00:30 AM', 'minute', true)).toBeUndefined()
    expect(dateTimeInput('2024-02-29 09:30:00', 'minute')).toBeUndefined()
  })
  it('applies time bounds only on their dates and rejects reversed full bounds', () => {
    const constraints = {
      precision: 'minute' as const,
      min: '2024-02-29T23:30',
      max: '2024-03-02T00:30',
    }
    expect(dateTimeSelectable('2024-02-29T23:15', constraints)).toBe(false)
    expect(dateTimeSelectable('2024-03-01T12:00', constraints)).toBe(true)
    expect(dateTimeSelectable('2024-03-02T01:00', constraints)).toBe(false)
    expect(dateTimeSelectable('2024-03-03T00:00', constraints)).toBe(false)
    expect(
      dateTimeDateSelectable('2024-03-01', {
        ...constraints,
        min: constraints.max,
        max: constraints.min,
      }),
    ).toBe(false)
  })
  it('measures step across midnight from the full minimum, with date-aware unit exclusions', () => {
    const constraints = {
      precision: 'minute' as const,
      min: '2024-02-29T23:00',
      step: 7200,
      disabledHours: (date: string) => (date === '2024-03-02' ? [1] : []),
      disabledMinutes: (hour: number, date: string) =>
        date === '2024-03-01' && hour === 3 ? [0] : [],
    }
    expect(dateTimeSelectable('2024-03-01T01:00', constraints)).toBe(true)
    expect(dateTimeSelectable('2024-03-01T00:00', constraints)).toBe(false)
    expect(dateTimeSelectable('2024-03-01T03:00', constraints)).toBe(false)
    expect(dateTimeSelectable('2024-03-02T01:00', constraints)).toBe(false)
    expect(
      dateTimeSelectable('2024-03-01T00:00', { ...constraints, step: 'any' }),
    ).toBe(true)
  })
  it('retains preferred time or finds the nearest selectable completion and reports an unavailable day', () => {
    const constraints = {
      precision: 'second' as const,
      minuteStep: 15,
      secondStep: 15,
      min: '2024-02-29T09:30:30',
      max: '2024-03-01T10:00:00',
      disabledSeconds: (hour: number, minute: number, date: string) =>
        date === '2024-03-01' && hour === 9 && minute === 30 ? [30] : [],
    }
    expect(dateTimeForDate('2024-02-29', '08:00:00', constraints)).toBe(
      '2024-02-29T09:30:30',
    )
    expect(dateTimeForDate('2024-03-01', '09:30:30', constraints)).toBe(
      '2024-03-01T09:30:15',
    )
    expect(dateTimeForDate('2024-03-01', '10:00:00', constraints)).toBe(
      '2024-03-01T10:00:00',
    )
    expect(
      dateTimeForDate('2024-03-01', '09:00:00', {
        ...constraints,
        disabledHours: () => Array.from({ length: 24 }, (_, i) => i),
      }),
    ).toBeUndefined()
  })
})

describe('DateTimePicker combined session', () => {
  it('blocks unconfirmed manual form input even when the popup is closed', () => {
    const { container } = render(
      <form>
        <DateTimePicker name="datetime" defaultValue="2024-02-29T09:30" />
      </form>,
    )
    fireEvent.change(input(), { target: { value: '2024-03-01 10:00' } })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(input()).toBeInvalid()
    expect(new FormData(container.querySelector('form')!).get('datetime')).toBe(
      '2024-02-29T09:30',
    )
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(input()).toBeValid()
    expect(new FormData(container.querySelector('form')!).get('datetime')).toBe(
      '2024-03-01T10:00',
    )
  })
  it('restores a custom field associated with an external native form without publishing reset', async () => {
    const onChange = vi.fn()
    const { container } = render(
      <>
        <form id="external" />
        <DateTimePicker
          form="external"
          name="datetime"
          defaultValue="2024-02-29T09:30"
          onChange={onChange}
        />
      </>,
    )
    open()
    fireEvent.click(day('2024-03-01'))
    confirm()
    act(() => container.querySelector('form')!.reset())
    await waitFor(() => expect(input()).toHaveValue('2024-02-29 09:30'))
    expect(onChange).toHaveBeenCalledExactlyOnceWith('2024-03-01T09:30')
    expect(new FormData(container.querySelector('form')!).get('datetime')).toBe(
      '2024-02-29T09:30',
    )
  })
  it('evaluates now and lazy presets on activation and keeps one confirmation', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date(2024, 1, 29, 12, 34, 45))
      const onChange = vi.fn(),
        preset = vi.fn(() => '2024-03-01T10:00:00')
      render(
        <DateTimePicker
          precision="second"
          presets={[{ key: 'next', label: '明日', value: preset }]}
          onChange={onChange}
        />,
      )
      open()
      expect(preset).not.toHaveBeenCalled()
      fireEvent.click(screen.getByRole('button', { name: '此刻', exact: true }))
      expect(input()).toHaveValue('2024-02-29 12:34:45')
      expect(onChange).not.toHaveBeenCalled()
      fireEvent.click(screen.getByRole('button', { name: '明日', exact: true }))
      expect(preset).toHaveBeenCalledOnce()
      confirm()
      expect(onChange).toHaveBeenCalledExactlyOnceWith('2024-03-01T10:00:00')
    } finally {
      vi.useRealTimers()
    }
  })
  it('rejects native subsecond or unavailable inputs without clearing the committed value', () => {
    const onChange = vi.fn()
    const { container } = render(
      <DateTimePicker
        mode="native"
        defaultValue="2024-02-29T09:30:15"
        min="2024-02-29T09:00:00"
        onChange={onChange}
      />,
    )
    const native = container.querySelector<HTMLInputElement>(
      'input[type="datetime-local"]',
    )!
    fireEvent.change(native, { target: { value: '2024-02-29T09:30:15.500' } })
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('精度不符')
    fireEvent.change(native, { target: { value: '2024-02-29T08:00' } })
    expect(onChange).not.toHaveBeenCalled()
    expect(native.value.replace(/\.0+$/, '')).toBe('2024-02-29T09:30:15')
  })
  it('preserves the session through Safari touch blur before a switch click', () => {
    const onBlur = vi.fn()
    render(<DateTimePicker defaultValue="2024-02-29T09:30" onBlur={onBlur} />)
    open()
    fireEvent.click(day('2024-03-01'))
    const switcher = screen.getByRole('button', { name: '调整时间' })
    fireEvent.pointerDown(switcher)
    fireEvent.blur(day('2024-03-01'), { relatedTarget: null })
    fireEvent.click(switcher)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(input()).toHaveValue('2024-03-01 09:30')
    expect(option('hour', 9)).toHaveFocus()
    expect(onBlur).not.toHaveBeenCalled()
  })
  it('browses dates without choosing and confirms date and time once while preserving submitted form data', () => {
    const onChange = vi.fn(),
      onOk = vi.fn(),
      onCalendarChange = vi.fn()
    const { container } = render(
      <form>
        <DateTimePicker
          name="appointment"
          defaultValue="2024-02-29T09:30"
          minuteStep={15}
          onChange={onChange}
          onOk={onOk}
          onCalendarChange={onCalendarChange}
        />
      </form>,
    )
    open()
    expect(day('2024-02-29')).toHaveFocus()
    fireEvent.keyDown(day('2024-02-29'), { key: 'ArrowRight' })
    expect(day('2024-03-01')).toHaveFocus()
    expect(input()).toHaveValue('2024-02-29 09:30')
    fireEvent.click(day('2024-03-01'))
    fireEvent.click(screen.getByRole('button', { name: '调整时间' }))
    expect(option('hour', 9)).toHaveFocus()
    fireEvent.click(option('hour', 10))
    expect(input()).toHaveValue('2024-03-01 10:30')
    expect(onCalendarChange).toHaveBeenLastCalledWith('2024-03-01T10:30', {
      part: 'time',
    })
    expect(onChange).not.toHaveBeenCalled()
    expect(
      new FormData(container.querySelector('form')!).get('appointment'),
    ).toBe('2024-02-29T09:30')
    expect(input()).toBeInvalid()
    confirm()
    expect(onChange).toHaveBeenCalledExactlyOnceWith('2024-03-01T10:30')
    expect(onOk).toHaveBeenCalledExactlyOnceWith('2024-03-01T10:30')
    expect(input()).toHaveFocus()
    expect(input()).toBeValid()
    expect(
      new FormData(container.querySelector('form')!).get('appointment'),
    ).toBe('2024-03-01T10:30')
  })
  it('uses defaultOpenTime only after selecting a date and handles date-dependent unavailable hours', () => {
    const onChange = vi.fn()
    render(
      <DatePicker
        showTime={{ defaultOpenTime: '09:30', minuteStep: 15 }}
        defaultPanelMonth="2024-02"
        min="2024-02-28T10:00"
        max="2024-03-02T12:00"
        disabledHours={(date) => (date === '2024-02-29' ? [9] : [])}
        onChange={onChange}
      />,
    )
    open()
    expect(input()).toHaveValue('')
    fireEvent.click(day('2024-02-28'))
    expect(input()).toHaveValue('2024-02-28 10:00')
    fireEvent.click(day('2024-02-29'))
    expect(input()).toHaveValue('2024-02-29 10:00')
    fireEvent.click(screen.getByRole('button', { name: '调整时间' }))
    expect(option('hour', 9)).toBeDisabled()
    confirm()
    expect(onChange).toHaveBeenCalledExactlyOnceWith('2024-02-29T10:00')
  })
  it('does not confirm an unavailable day or an invalid preset', () => {
    const onChange = vi.fn()
    render(
      <DateTimePicker
        defaultPanelMonth="2024-02"
        disabledDate={(date) => date === '2024-02-28'}
        disabledTime={() => true}
        presets={[
          {
            key: 'bad',
            label: '不可用快捷值',
            value: () => '2024-02-29T09:30',
          },
        ]}
        onChange={onChange}
      />,
    )
    open()
    expect(day('2024-02-28')).toBeDisabled()
    fireEvent.click(day('2024-02-29'))
    expect(screen.getByRole('alert')).toHaveTextContent('所选日期没有可用时间')
    expect(input()).toHaveValue('')
    expect(
      screen.getByRole('button', { name: '确定', exact: true }),
    ).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '不可用快捷值' }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      '快捷日期时间当前不可选',
    )
    expect(onChange).not.toHaveBeenCalled()
  })
  it('cancels on Escape, outside focus and externally controlled close without leaking a pending value', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <>
        <DateTimePicker value="2024-02-29T09:30" onChange={onChange} />
        <button>外部</button>
      </>,
    )
    open()
    fireEvent.click(day('2024-03-01'))
    fireEvent.keyDown(day('2024-03-01'), { key: 'Escape' })
    expect(input()).toHaveValue('2024-02-29 09:30')
    expect(input()).toHaveFocus()
    open()
    fireEvent.click(day('2024-03-01'))
    act(() => screen.getByRole('button', { name: '外部' }).focus())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(input()).toHaveValue('2024-02-29 09:30')
    rerender(
      <DateTimePicker value="2024-02-29T09:30" open onChange={onChange} />,
    )
    fireEvent.click(day('2024-03-01'))
    rerender(
      <DateTimePicker
        value="2024-02-29T09:30"
        open={false}
        onChange={onChange}
      />,
    )
    expect(input()).toHaveValue('2024-02-29 09:30')
    expect(onChange).not.toHaveBeenCalled()
  })
  it('uses canonical 24-hour input, seconds and one confirmation with 12-hour display', () => {
    const onChange = vi.fn(),
      onOk = vi.fn()
    render(
      <DatePicker
        showTime={{ precision: 'second', use12Hours: true }}
        defaultValue="2024-02-29T00:30:15"
        onChange={onChange}
        onOk={onOk}
      />,
    )
    expect(input()).toHaveValue('2024-02-29 12:30:15 AM')
    fireEvent.change(input(), { target: { value: '2024-02-29 01:45:30 PM' } })
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(onChange).toHaveBeenCalledExactlyOnceWith('2024-02-29T13:45:30')
    expect(onOk).toHaveBeenCalledExactlyOnceWith('2024-02-29T13:45:30')
    expect(input()).toHaveValue('2024-02-29 01:45:30 PM')
    fireEvent.change(input(), { target: { value: '2024-02-30 01:45:30 PM' } })
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(screen.getByRole('alert')).toHaveTextContent('请输入可选日期时间')
    expect(input()).toBeInvalid()
  })
  it('immediately publishes complete values without closing the combined session and blurs only outside', () => {
    const onChange = vi.fn(),
      onBlur = vi.fn()
    render(
      <>
        <DateTimePicker
          defaultValue="2024-02-29T09:30"
          needConfirm={false}
          onChange={onChange}
          onBlur={onBlur}
        />
        <button>外部</button>
      </>,
    )
    open()
    fireEvent.click(day('2024-03-01'))
    expect(onChange).toHaveBeenLastCalledWith('2024-03-01T09:30')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '调整时间' }))
    expect(onBlur).not.toHaveBeenCalled()
    fireEvent.click(option('hour', 10))
    expect(onChange).toHaveBeenLastCalledWith('2024-03-01T10:30')
    act(() => screen.getByRole('button', { name: '外部' }).focus())
    expect(onBlur).toHaveBeenCalledOnce()
  })
  it('clears a pending session immediately and honors controlled values and open requests', () => {
    const onChange = vi.fn(),
      onClear = vi.fn(),
      onOpenChange = vi.fn(),
      onMonth = vi.fn()
    const { rerender } = render(
      <DateTimePicker
        value="2024-02-29T09:30"
        open
        panelMonth="2024-02"
        onChange={onChange}
        onClear={onClear}
        onOpenChange={onOpenChange}
        onPanelMonthChange={onMonth}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '下个月' }))
    expect(onMonth).toHaveBeenLastCalledWith('2024-03')
    expect(screen.getByRole('grid')).toHaveAccessibleName(
      '日期时间日期，2024年2月',
    )
    fireEvent.click(day('2024-03-01'))
    confirm()
    expect(input()).toHaveValue('2024-02-29 09:30')
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    rerender(
      <DateTimePicker
        value="2024-03-01T09:30"
        onChange={onChange}
        onClear={onClear}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '清空日期时间' }))
    expect(onChange).toHaveBeenLastCalledWith('')
    expect(onClear).toHaveBeenCalledOnce()
    expect(input()).toHaveValue('2024-03-01 09:30')
  })
  it('recovers a disabled time focus to the date switcher and preserves external focus', () => {
    const { rerender } = render(
      <>
        <DateTimePicker
          mode="panel"
          defaultValue="2024-02-29T09:30"
          hideDisabledOptions
        />
        <button>外部</button>
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: '调整时间' }))
    act(() => option('hour', 9).focus())
    rerender(
      <>
        <DateTimePicker
          mode="panel"
          defaultValue="2024-02-29T09:30"
          hideDisabledOptions
          disabledTime={() => true}
        />
        <button>外部</button>
      </>,
    )
    expect(screen.getByRole('button', { name: '选择日期' })).toHaveFocus()
    act(() => screen.getByRole('button', { name: '外部' }).focus())
    rerender(
      <>
        <DateTimePicker
          mode="panel"
          defaultValue="2024-02-29T09:30"
          hideDisabledOptions
          disabledTime={() => true}
        />
        <button>外部</button>
      </>,
    )
    expect(screen.getByRole('button', { name: '外部' })).toHaveFocus()
  })
  it('normalizes native zero seconds and resets an externally associated native form', async () => {
    const onChange = vi.fn()
    const { container } = render(
      <>
        <form id="native" />
        <DateTimePicker
          form="native"
          mode="native"
          precision="second"
          name="datetime"
          defaultValue="2024-02-29T09:30:15"
          onChange={onChange}
        />
      </>,
    )
    const native = container.querySelector<HTMLInputElement>(
      'input[type="datetime-local"]',
    )!
    fireEvent.change(native, { target: { value: '2024-03-01T10:45' } })
    expect(onChange).toHaveBeenLastCalledWith('2024-03-01T10:45:00')
    expect(new FormData(container.querySelector('form')!).get('datetime')).toBe(
      '2024-03-01T10:45',
    )
    act(() => container.querySelector('form')!.reset())
    await waitFor(() =>
      expect(native.value.replace(/\.0+$/, '')).toBe('2024-02-29T09:30:15'),
    )
    fireEvent.change(native, { target: { value: '2024-03-01T10:45:30' } })
    expect(onChange).toHaveBeenLastCalledWith('2024-03-01T10:45:30')
  })
  it('resets pending and confirmed custom values and cooperates with project Form validation', async () => {
    const finish = vi.fn()
    render(
      <Form
        initialValues={{ appointment: '2024-02-29T09:30' }}
        validateOn="blur"
        onFinish={finish}
      >
        <FormItem
          name="appointment"
          label="预约"
          emptyValue=""
          rules={[{ required: true, message: '请选择预约' }]}
          control={<DateTimePicker inputReadOnly />}
        />
        <button type="submit">提交</button>
        <button type="reset">重置</button>
      </Form>,
    )
    open()
    fireEvent.click(day('2024-03-01'))
    confirm()
    fireEvent.click(screen.getByRole('button', { name: '提交', exact: true }))
    await waitFor(() =>
      expect(finish).toHaveBeenLastCalledWith({
        appointment: '2024-03-01T09:30',
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: '重置', exact: true }))
    await waitFor(() => expect(input()).toHaveValue('2024-02-29 09:30'))
    fireEvent.click(screen.getByRole('button', { name: '清空日期时间' }))
    fireEvent.click(screen.getByRole('button', { name: '提交', exact: true }))
    await waitFor(() =>
      expect(screen.getByText('请选择预约')).toBeInTheDocument(),
    )
  })
  it('disables interactions and leaves optional empty values valid', () => {
    const { rerender } = render(
      <DateTimePicker disabled defaultValue="2024-02-29T09:30" />,
    )
    expect(input()).toBeDisabled()
    expect(
      screen.getByRole('button', { name: '打开日期时间面板' }),
    ).toBeDisabled()
    rerender(<DateTimePicker readOnly defaultValue="2024-02-29T09:30" />)
    open()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    rerender(<DateTimePicker needConfirm={false} />)
    fireEvent.change(input(), { target: { value: '2024-02-29 09:30' } })
    fireEvent.change(input(), { target: { value: '' } })
    expect(input()).toBeValid()
    expect(input()).not.toHaveAttribute('aria-invalid', 'true')
  })
})
