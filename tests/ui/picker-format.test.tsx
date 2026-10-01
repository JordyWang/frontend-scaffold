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
  DatePicker,
  Form,
  FormItem,
  DateRangePicker,
  DateTimePicker,
  DateTimeRangePicker,
  MultiDatePicker,
  TimePicker,
  TimeRangePicker,
} from '@/shared/ui'
import {
  createPickerFormat,
  inferFormattedTimePrecision,
  formatUses12Hours,
} from '@/shared/ui/picker-format'

const enter = (field: HTMLElement, value: string) => {
  fireEvent.change(field, { target: { value } })
  fireEvent.keyDown(field, { key: 'Enter' })
}
const confirm = () =>
  fireEvent.click(screen.getByRole('button', { name: '确定', exact: true }))

describe('civil date and time format adapter', () => {
  it.each([
    ['0001-01-01', 'DD/MM/YYYY', '01/01/0001'],
    ['0099-12-31', 'YYYY年M月D日', '0099年12月31日'],
    ['2024-02-29', 'DD MMMM YYYY dddd', '29 February 2024 Thursday'],
    ['2024-02-29', 'Do [of] MMM YYYY', '29th of Feb 2024'],
    ['2024-02-29', '[Date:] YYYY/MM/DD', 'Date: 2024/02/29'],
  ])('strictly round trips %s using %s', (canonical, format, shown) => {
    const adapter = createPickerFormat({ kind: 'date', format })
    expect(adapter.display(canonical)).toBe(shown)
    expect(adapter.parse(shown)).toBe(canonical)
  })
  it('rejects impossible dates, incorrect weekday, duplicate fields and insufficient fields', () => {
    const date = createPickerFormat({ kind: 'date', format: 'DD/MM/YYYY' })
    for (const value of [
      '29/02/2023',
      '31/04/2024',
      '01/01/0000',
      '1/01/2024',
      '01/13/2024',
    ])
      expect(date.parse(value)).toBeUndefined()
    expect(
      createPickerFormat({ kind: 'date', format: 'DD MMM YYYY dddd' }).parse(
        '29 Feb 2024 Friday',
      ),
    ).toBeUndefined()
    expect(
      createPickerFormat({ kind: 'date', format: 'YYYY-MM-DD YYYY' }).parse(
        '2024-02-29 2023',
      ),
    ).toBeUndefined()
    expect(
      createPickerFormat({ kind: 'date', format: 'YYYY-MM' }).parse('2024-02'),
    ).toBeUndefined()
    expect(
      createPickerFormat({ kind: 'date', format: 'YYYY-MM-DD Z' }).parse(
        '2024-02-29 +08:00',
      ),
    ).toBeUndefined()
  })
  it('round trips all date units including ISO week-year boundaries and week 53', () => {
    for (const [picker, value, format, shown] of [
      ['week', '2020-W53', 'GGGG年[第]WW[周]', '2020年第53周'],
      ['week', '2020-W01', 'YYYY-[W]ww', '2020-W01'],
      ['week', '0001-W01', 'GGGG-[W]WW', '0001-W01'],
      ['week', '2020-W53', 'gggg-wo', '2020-53rd'],
      ['month', '2024-02', 'MMM YYYY', 'Feb 2024'],
      ['quarter', '2024-Q2', 'YYYY年[第]Q[季度]', '2024年第2季度'],
      ['year', '0099', 'YYYY[年]', '0099年'],
    ] as const) {
      const adapter = createPickerFormat({ kind: 'date', picker, format })
      expect(adapter.display(value)).toBe(shown)
      expect(adapter.parse(shown)).toBe(value)
    }
    expect(
      createPickerFormat({
        kind: 'date',
        picker: 'week',
        format: 'GGGG-[W]WW',
      }).parse('2021-W53'),
    ).toBeUndefined()
    expect(
      createPickerFormat({
        kind: 'date',
        picker: 'quarter',
        format: 'YYYY-[Q]Q',
      }).parse('2024-Q5'),
    ).toBeUndefined()
  })
  it('uses the first format for display and any listed string for input', () => {
    const adapter = createPickerFormat({
      kind: 'date',
      format: ['DD/MM/YYYY', 'YYYY-M-D', 'DD MMM YYYY'],
    })
    expect(adapter.display('2024-02-29')).toBe('29/02/2024')
    expect(adapter.parse('2024-2-29')).toBe('2024-02-29')
    expect(adapter.parse('29 Feb 2024')).toBe('2024-02-29')
    expect(adapter.parse('2024-02-29')).toBeUndefined()
  })
  it('supports localized names, ordinals, meridiem and localized aliases', () => {
    const chinese = createPickerFormat({
      kind: 'dateTime',
      precision: 'second',
      locale: 'zh-CN',
      format: 'YYYY年M月D日 A h:mm:ss',
    })
    expect(chinese.display('2024-02-29T13:30:05')).toBe(
      '2024年2月29日 下午 1:30:05',
    )
    expect(chinese.parse('2024年2月29日 下午 1:30:05')).toBe(
      '2024-02-29T13:30:05',
    )
    const french = createPickerFormat({
      kind: 'date',
      locale: 'fr-FR',
      format: 'LL',
    })
    expect(french.display('2024-02-29')).toBe('29 février 2024')
    expect(french.parse('29 février 2024')).toBe('2024-02-29')
    expect(
      createPickerFormat({ kind: 'date', locale: 'zh-CN', format: 'L' }).parse(
        '2024/02/29',
      ),
    ).toBe('2024-02-29')
    const iso = createPickerFormat({
      kind: 'date',
      picker: 'week',
      locale: 'zh-CN',
      format: 'GGGG-wo',
    })
    expect(iso.display('2020-W53')).toBe('2020-53周')
    expect(iso.parse('2020-53周')).toBe('2020-W53')
  })
  it('preserves milliseconds and wall times, including DST gaps and early years', () => {
    for (const value of [
      '2024-03-10T02:30:45.007',
      '0001-01-01T00:00:00.000',
      '0099-12-31T23:59:59.999',
    ]) {
      const adapter = createPickerFormat({
        kind: 'dateTime',
        precision: 'millisecond',
        format: 'DD/MM/YYYY hh:mm:ss.SSS A',
      })
      expect(adapter.parse(adapter.display(value))).toBe(value)
    }
    const adapter = createPickerFormat({
      kind: 'time',
      precision: 'millisecond',
      format: 'hh:mm:ss.SSS a',
    })
    expect(adapter.parse('12:30:45.007 am')).toBe('00:30:45.007')
    expect(adapter.parse('01:30:45.007 pm')).toBe('13:30:45.007')
    expect(adapter.parse('13:30:45.007 pm')).toBeUndefined()
    expect(
      createPickerFormat({ kind: 'time', format: 'HH:mm:ss' }).parse(
        '12:30:01',
      ),
    ).toBeUndefined()
    expect(
      createPickerFormat({
        kind: 'time',
        precision: 'second',
        format: 'HH:mm:ss.SSS',
      }).parse('12:30:01.001'),
    ).toBeUndefined()
    expect(
      createPickerFormat({ kind: 'time', format: 'hh:mm' }).parse('12:30'),
    ).toBeUndefined()
  })
  it('infers time columns only from real tokens, including localized formats', () => {
    expect(inferFormattedTimePrecision('[SSS] HH:mm', 'minute')).toBe('minute')
    expect(
      inferFormattedTimePrecision(['HH:mm', 'HH:mm:ss.SSS'], 'second'),
    ).toBe('millisecond')
    expect(inferFormattedTimePrecision('LTS', 'minute', 'zh-CN')).toBe('second')
    expect(formatUses12Hours('hh:mm a')).toBe(true)
    expect(formatUses12Hours('[hh] HH:mm')).toBe(false)
  })
  it('accepts canonical function arguments and validates custom parse results', () => {
    const display = vi.fn((value: string) => '日期 ' + value)
    const parseInput = vi.fn((text: string) => text.replace(/^日期 /, ''))
    const adapter = createPickerFormat({
      kind: 'date',
      format: display,
      parseInput,
    })
    expect(adapter.display('2024-02-29')).toBe('日期 2024-02-29')
    expect(display).toHaveBeenCalledWith('2024-02-29')
    expect(adapter.parse('日期 2024-02-29')).toBe('2024-02-29')
    expect(parseInput).toHaveBeenCalledWith(
      '日期 2024-02-29',
      expect.objectContaining({ kind: 'date', picker: 'date' }),
    )
    expect(adapter.parse('日期 2023-02-29')).toBeUndefined()
    expect(
      createPickerFormat({
        kind: 'date',
        format: [display, 'DD/MM/YYYY'],
      }).parse('29/02/2024'),
    ).toBe('2024-02-29')
  })
})

describe('formatted picker sessions', () => {
  it('keeps DatePicker callbacks, constraints, hidden fields and reset canonical', () => {
    const onChange = vi.fn(),
      disabledDate = vi.fn((date: string) => date === '2024-03-02')
    render(
      <form aria-label="dates">
        <DatePicker
          defaultValue="2024-02-29"
          format={['DD/MM/YYYY', 'YYYY-M-D']}
          name="date"
          onChange={onChange}
          disabledDate={disabledDate}
          needConfirm
        />
      </form>,
    )
    const input = screen.getByRole('combobox')
    expect(input).toHaveValue('29/02/2024')
    enter(input, '2024-3-1')
    expect(onChange).toHaveBeenLastCalledWith('2024-03-01')
    expect(input).toHaveValue('01/03/2024')
    const form = screen.getByRole('form') as HTMLFormElement
    expect(new FormData(form).get('date')).toBe('2024-03-01')
    enter(input, '02/03/2024')
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(input).toHaveValue('02/03/2024')
    expect(input).toBeInvalid()
    expect(disabledDate).toHaveBeenCalledWith('2024-03-02')
    fireEvent.reset(form)
    expect(input).toHaveValue('29/02/2024')
    expect(new FormData(form).get('date')).toBe('2024-02-29')
  })
  it.each(['date', 'week', 'month', 'quarter', 'year'] as const)(
    'supports custom %s formats in multiple values and tags',
    (picker) => {
      const samples = {
        date: ['2024-02-29', '29/02/2024', 'DD/MM/YYYY'],
        week: ['2020-W53', '2020年第53周', 'GGGG年[第]WW[周]'],
        month: ['2024-02', 'Feb 2024', 'MMM YYYY'],
        quarter: ['2024-Q2', '2024年第2季度', 'YYYY年[第]Q[季度]'],
        year: ['0099', '0099年', 'YYYY[年]'],
      }[picker]
      const onChange = vi.fn()
      render(
        <MultiDatePicker
          picker={picker}
          format={samples[2]}
          mode="panel"
          name="dates"
          onChange={onChange}
        />,
      )
      enter(screen.getByRole('textbox'), samples[1])
      expect(onChange).not.toHaveBeenCalled()
      expect(
        screen.getByRole('button', { name: new RegExp(samples[1]) }),
      ).toBeVisible()
      fireEvent.click(screen.getByRole('button', { name: '完成', exact: true }))
      expect(onChange).toHaveBeenCalledWith([samples[0]])
      expect(document.querySelector('input[name="dates"]')).toHaveValue(
        JSON.stringify([samples[0]]),
      )
    },
  )
  it('orders formatted ranges using canonical dates and rejects unlisted canonical-looking input', () => {
    const onChange = vi.fn()
    render(
      <DateRangePicker
        mode="panel"
        defaultValue={['2024-02-29', '2024-03-02']}
        format="DD/MM/YYYY"
        needConfirm
        name="range"
        onChange={onChange}
      />,
    )
    const start = screen.getByRole('textbox', { name: '开始日期' }),
      end = screen.getByRole('textbox', { name: '结束日期' })
    fireEvent.change(start, { target: { value: '2024-03-01' } })
    expect(start).toBeInvalid()
    expect(
      screen.getByRole('button', { name: '确定', exact: true }),
    ).toBeDisabled()
    fireEvent.change(start, { target: { value: '01/03/2024' } })
    fireEvent.change(end, { target: { value: '04/03/2024' } })
    confirm()
    expect(onChange).toHaveBeenCalledWith(['2024-03-01', '2024-03-04'])
    expect(document.querySelector('input[name="range"]')).toHaveValue(
      '["2024-03-01","2024-03-04"]',
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      '01/03/2024 → 04/03/2024',
    )
  })
  it('parses the time formats and preserves millisecond confirmation', () => {
    const onChange = vi.fn()
    render(
      <TimePicker
        format={['hh:mm:ss.SSS a', 'HH:mm:ss.SSS']}
        defaultValue="13:30:15.007"
        onChange={onChange}
        name="time"
      />,
    )
    const input = screen.getByRole('combobox')
    expect(input).toHaveValue('01:30:15.007 pm')
    enter(input, '14:35:16.009')
    expect(input).toHaveValue('02:35:16.009 pm')
    expect(onChange).toHaveBeenCalledWith('14:35:16.009')
    expect(document.querySelector('input[name="time"]')).toHaveValue(
      '14:35:16.009',
    )
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(screen.getByRole('listbox', { name: '时间时段' })).toBeVisible()
    fireEvent.keyDown(
      screen.getByRole('button', { name: '取消', exact: true }),
      { key: 'Escape' },
    )
    expect(onChange).toHaveBeenCalledTimes(1)
  })
  it.each([
    [
      'week',
      ['2020-W01', '2020-W53'],
      ['2020年01周', '2020年53周'],
      'GGGG年WW[周]',
    ],
    ['month', ['2024-02', '2024-04'], ['Feb 2024', 'Apr 2024'], 'MMM YYYY'],
    [
      'quarter',
      ['2024-Q1', '2024-Q3'],
      ['2024年1季度', '2024年3季度'],
      'YYYY年Q[季度]',
    ],
    ['year', ['0099', '0100'], ['0099年', '0100年'], 'YYYY[年]'],
  ] as const)(
    'confirms formatted %s range units through the same canonical tuple API',
    (picker, canonical, text, format) => {
      const change = vi.fn()
      render(
        <DateRangePicker
          picker={picker}
          format={format}
          mode="panel"
          needConfirm
          startLabel="start"
          endLabel="end"
          onChange={change}
        />,
      )
      fireEvent.change(screen.getByRole('textbox', { name: 'start' }), {
        target: { value: text[0] },
      })
      fireEvent.change(screen.getByRole('textbox', { name: 'end' }), {
        target: { value: text[1] },
      })
      confirm()
      expect(change).toHaveBeenCalledWith([...canonical])
    },
  )
  it('responds to dynamic empty-field constraint precision while keeping format precision stable', () => {
    const { rerender } = render(<TimePicker format="HH:mm" />)
    rerender(
      <TimePicker
        format="HH:mm:ss.SSS"
        min="09:30:00.100"
        max="09:30:00.300"
      />,
    )
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' })
    expect(screen.getByRole('listbox', { name: '时间毫秒' })).toBeVisible()
    fireEvent.click(screen.getByRole('option', { name: '200毫秒' }))
    confirm()
    expect(screen.getByRole('combobox')).toHaveValue('09:30:00.200')
    rerender(<TimePicker format="HH:mm:ss.SSS" />)
    expect(screen.getByRole('combobox')).toHaveValue('09:30:00.200')
  })
  it('formats time range endpoints, footer and errors without leaking display text to callbacks', () => {
    const onChange = vi.fn()
    render(
      <TimeRangePicker
        mode="panel"
        defaultValue={['09:30', '13:30']}
        format="hh:mm a"
        onChange={onChange}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('09:30 am → 01:30 pm')
    const start = screen.getByRole('textbox', { name: '开始时间' })
    enter(start, '10:30 am')
    expect(onChange).toHaveBeenCalledWith(['10:30', '13:30'])
    expect(start).toHaveValue('10:30 am')
  })
  it('shares full dateTime format through showTime for single and range wrappers', () => {
    const change = vi.fn(),
      rangeChange = vi.fn()
    render(
      <>
        <DatePicker
          showTime
          defaultValue="2024-02-29T13:30:05.007"
          format="DD/MM/YYYY hh:mm:ss.SSS A"
          onChange={change}
          label="datetime"
        />
        <DateRangePicker
          showTime
          defaultValue={['2024-02-29T13:30', '2024-03-01T14:30']}
          format="DD/MM/YYYY HH:mm"
          onChange={rangeChange}
          label="range"
          startLabel="start"
          endLabel="end"
        />
      </>,
    )
    enter(
      screen.getByRole('combobox', { name: 'datetime' }),
      '01/03/2024 02:30:05.008 PM',
    )
    expect(change).toHaveBeenCalledWith('2024-03-01T14:30:05.008')
    enter(screen.getByRole('combobox', { name: 'end' }), '02/03/2024 16:30')
    expect(rangeChange).toHaveBeenCalledWith([
      '2024-02-29T13:30',
      '2024-03-02T16:30',
    ])
  })
  it('keeps a canonical pending value across same-precision format changes without submitting', () => {
    const onChange = vi.fn(),
      props = {
        defaultValue: '2024-02-29',
        needConfirm: true,
        mode: 'panel' as const,
        onChange,
      }
    const { rerender } = render(<DatePicker {...props} format="DD/MM/YYYY" />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'partial' } })
    rerender(<DatePicker {...props} format="YYYY年MM月DD日" />)
    expect(input).toHaveValue('2024年02月29日')
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.click(
      document.querySelector('[data-calendar-date="2024-03-01"]')!,
    )
    rerender(<DatePicker {...props} format="DD/MM/YYYY" />)
    expect(input).toHaveValue('01/03/2024')
    expect(onChange).not.toHaveBeenCalled()
    confirm()
    expect(onChange).toHaveBeenCalledWith('2024-03-01')
  })
  it('preserves an uncontrolled time when dynamic formats hide or reveal lower fields', () => {
    const change = vi.fn()
    const { rerender } = render(
      <TimePicker format="HH:mm:ss.SSS" onChange={change} name="stableTime" />,
    )
    enter(screen.getByRole('combobox'), '13:35:07.009')
    rerender(<TimePicker format="HH:mm" onChange={change} name="stableTime" />)
    expect(screen.getByRole('combobox')).toHaveValue('13:35')
    expect(document.querySelector('input[name="stableTime"]')).toHaveValue(
      '13:35:07.009',
    )
    rerender(
      <TimePicker
        format="hh:mm:ss.SSS a"
        onChange={change}
        name="stableTime"
      />,
    )
    expect(screen.getByRole('combobox')).toHaveValue('01:35:07.009 pm')
    expect(change).toHaveBeenCalledTimes(1)
  })
  it('uses project Form validation and resets formatted displays to canonical initial values', async () => {
    const finish = vi.fn()
    render(
      <Form initialValues={{ date: '2024-02-29' }} onFinish={finish}>
        <FormItem
          name="date"
          label="formatted"
          emptyValue=""
          rules={[{ required: true, message: '请选择日期' }]}
          control={<DatePicker format="DD/MM/YYYY" />}
        />
        <button type="submit">提交</button>
        <button type="reset">重置</button>
      </Form>,
    )
    enter(screen.getByRole('combobox'), '01/03/2024')
    fireEvent.click(screen.getByRole('button', { name: '提交', exact: true }))
    await waitFor(() =>
      expect(finish).toHaveBeenCalledWith({ date: '2024-03-01' }),
    )
    fireEvent.click(screen.getByRole('button', { name: '重置', exact: true }))
    await waitFor(() =>
      expect(screen.getByRole('combobox')).toHaveValue('29/02/2024'),
    )
  })
  it('Escape restores closed date, range and multiple input drafts without publishing', () => {
    const change = vi.fn()
    render(
      <>
        <DatePicker
          label="single"
          format="DD/MM/YYYY"
          defaultValue="2024-02-29"
          onChange={change}
        />
        <DateRangePicker
          startLabel="start"
          endLabel="end"
          format="DD/MM/YYYY"
          defaultValue={['2024-02-29', '2024-03-02']}
          onChange={change}
        />
        <MultiDatePicker
          label="multiple"
          format="DD/MM/YYYY"
          defaultValue={['2024-02-29']}
          onChange={change}
        />
      </>,
    )
    for (const name of ['single', 'start', 'multiple']) {
      const field = screen.getByRole('combobox', { name, exact: true })
      fireEvent.change(field, { target: { value: 'partial' } })
      fireEvent.keyDown(field, { key: 'Escape' })
      expect(field).toHaveValue(name === 'multiple' ? '' : '29/02/2024')
    }
    expect(change).not.toHaveBeenCalled()
  })
  it('does not discard a draft for equivalent format arrays on unrelated parent updates', () => {
    const { rerender } = render(
      <DatePicker format={['DD/MM/YYYY', 'YYYY-M-D']} />,
    )
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: '29/02' },
    })
    rerender(
      <DatePicker format={['DD/MM/YYYY', 'YYYY-M-D']} className="w-full" />,
    )
    expect(screen.getByRole('combobox')).toHaveValue('29/02')
  })
  it('applies ConfigProvider locale changes while preserving canonical values and native formats', () => {
    const { rerender } = render(
      <ConfigProvider locale="fr-FR">
        <DatePicker defaultValue="2024-02-29" format="LL" />
      </ConfigProvider>,
    )
    expect(screen.getByRole('combobox')).toHaveValue('29 février 2024')
    rerender(
      <ConfigProvider locale="zh-CN">
        <DatePicker defaultValue="2024-02-29" format="LL" />
      </ConfigProvider>,
    )
    expect(screen.getByRole('combobox')).toHaveValue('2024年2月29日')
    rerender(
      <form aria-label="native">
        <DatePicker
          mode="native"
          defaultValue="2024-02-29"
          format="DD/MM/YYYY"
          name="date"
        />
        <TimePicker
          mode="native"
          defaultValue="13:30"
          format="hh:mm:ss.SSS a"
          name="time"
        />
        <DateTimePicker
          mode="native"
          defaultValue="2024-02-29T13:30"
          format="LLL"
          name="datetime"
        />
        <DateTimeRangePicker
          mode="native"
          defaultValue={['2024-02-29T13:30', '2024-03-01T14:30']}
          format="LLL"
          name="range"
        />
      </form>,
    )
    const form = screen.getByRole('form') as HTMLFormElement
    expect(new FormData(form).get('date')).toBe('2024-02-29')
    expect(new FormData(form).get('time')).toBe('13:30')
    expect(new FormData(form).get('datetime')).toBe('2024-02-29T13:30')
    expect(within(form).getByDisplayValue('2024-03-01T14:30')).toBeVisible()
  })
})
