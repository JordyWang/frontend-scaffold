import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ConfigProvider,
  DatePicker,
  DateRangePicker,
  DateTimePicker,
  DateTimeRangePicker,
  TimePicker,
  TimeRangePicker,
} from '@/shared/ui'
import {
  inferTimePrecision,
  nativeTimeInput,
  nearestTime,
  parseTime,
  timeDisplay,
  timeInput,
  timeMilliseconds,
  timeNow,
  timeSelectable,
  timeUnitValue,
  type TimeConstraints,
} from '@/shared/ui/time-picker-state'
import {
  dateTimeForDate,
  dateTimeMilliseconds,
  dateTimeSelectable,
  nativeDateTimeInput,
} from '@/shared/ui/date-time-picker-state'
const option = (unit: string, value: number) =>
  document.querySelector<HTMLButtonElement>(
    '[data-time-unit="' + unit + '"][data-time-value="' + value + '"]',
  )!
const confirm = () =>
  fireEvent.click(screen.getByRole('button', { name: '确定', exact: true }))
const millis = { precision: 'millisecond' as const }

beforeEach(() => {
  vi.stubGlobal(
    'PointerEvent',
    class extends MouseEvent {
      pointerType: string
      constructor(type: string, options: PointerEventInit = {}) {
        super(type, options)
        this.pointerType = options.pointerType ?? ''
      }
    },
  )
})
afterEach(() => vi.unstubAllGlobals())

describe('millisecond time constraints', () => {
  it('accepts exactly three fractional digits and preserves them through 12-hour display', () => {
    expect(parseTime('23:59:59.999')).toEqual([23, 59, 59, 999])
    expect(timeMilliseconds(parseTime('23:59:59.999')!)).toBe(86399999)
    for (const raw of [
      '12:30:00.1',
      '12:30:00.12',
      '12:30:00.1234',
      '12:30.123',
      '12:30:60.000',
      '24:00:00.000',
      '12:30:00.123Z',
    ])
      expect(parseTime(raw)).toBeUndefined()
    expect(timeInput('12:30:45.001 AM', 'millisecond', true)).toBe(
      '00:30:45.001',
    )
    expect(timeDisplay('13:30:45.001', 'millisecond', true)).toBe(
      '01:30:45.001 PM',
    )
    expect(timeInput('09:30:00', 'millisecond')).toBeUndefined()
    expect(timeInput('09:30:00.000', 'second')).toBeUndefined()
    expect(timeNow(new Date(2024, 1, 29, 12, 30, 45, 7), 'millisecond')).toBe(
      '12:30:45.007',
    )
  })
  it('infers fractions and normalizes only native omitted zero fields without truncation', () => {
    expect(inferTimePrecision(['2024-02-29T09:30:00.125'])).toBe('millisecond')
    expect(inferTimePrecision([], '0.125')).toBe('millisecond')
    expect(inferTimePrecision([], 15)).toBe('second')
    expect(nativeTimeInput('09:30', 'millisecond')).toBe('09:30:00.000')
    expect(nativeTimeInput('09:30:45.1', 'millisecond')).toBe('09:30:45.100')
    expect(nativeTimeInput('09:30:00.000', 'minute')).toBe('09:30')
    expect(nativeTimeInput('09:30:00.001', 'second')).toBeUndefined()
    expect(nativeTimeInput('09:30:01', 'minute')).toBeUndefined()
    expect(nativeDateTimeInput('2024-02-29T09:30:45.01', 'millisecond')).toBe(
      '2024-02-29T09:30:45.010',
    )
    expect(
      nativeDateTimeInput('2024-02-29T09:30T10:00', 'millisecond'),
    ).toBeUndefined()
  })
  it('uses fractional step and millisecond exclusions on a wrapped interval', () => {
    const constraints = {
      ...millis,
      min: '23:59:59.900',
      max: '00:00:00.200',
      step: 0.1,
      millisecondStep: 100,
      disabledMilliseconds: (h: number, m: number, s: number) =>
        h === 0 && m === 0 && s === 0 ? [100] : [],
    }
    expect(timeSelectable('23:59:59.900', constraints)).toBe(true)
    expect(timeSelectable('00:00:00.000', constraints)).toBe(true)
    expect(timeSelectable('00:00:00.100', constraints)).toBe(false)
    expect(timeSelectable('00:00:00.200', constraints)).toBe(true)
    expect(timeSelectable('00:00:00.201', constraints)).toBe(false)
    expect(timeSelectable('12:00:00.000', constraints)).toBe(false)
    expect(timeSelectable('23:59:59.800', constraints)).toBe(false)
  })
  it('preserves lower fields or completes the closest available millisecond when changing an upper unit', () => {
    const constraints = {
      ...millis,
      disabledMilliseconds: (_h: number, _m: number, s: number) =>
        s === 20 ? [125] : [],
    }
    expect(timeUnitValue([9, 30, 15, 125], 'second', 20, constraints)).toBe(
      '09:30:20.124',
    )
    expect(timeUnitValue([9, 30, 15, 125], 'hour', 10, constraints)).toBe(
      '10:30:15.125',
    )
    expect(
      timeUnitValue([9, 30, 20, 124], 'millisecond', 125, constraints),
    ).toBeUndefined()
    expect(timeUnitValue([9, 30, 15, 125], 'meridiem', 1, constraints)).toBe(
      '21:30:15.125',
    )
  })
  it('matches exhaustive selection on a bounded grid, including ties and generic value exclusions', () => {
    const constraints: TimeConstraints = {
      ...millis,
      min: '09:00:00.050',
      max: '09:02:01.900',
      secondStep: 15,
      millisecondStep: 100,
      step: 'any',
      disabledMilliseconds: (_h, m, s) =>
        m === 1 && s === 0 ? [0, 100, 200] : [],
      disabledTime: (value) => value.startsWith('09:02:00.'),
    }
    const available: string[] = []
    for (let m = 0; m < 3; m++)
      for (let s = 0; s < 60; s += 15)
        for (let ms = 0; ms < 1000; ms += 100) {
          const value =
            '09:0' +
            m +
            ':' +
            String(s).padStart(2, '0') +
            '.' +
            String(ms).padStart(3, '0')
          if (timeSelectable(value, constraints)) available.push(value)
        }
    for (const value of [
      '08:59:59.999',
      '09:00:00.150',
      '09:00:59.900',
      '09:01:00.100',
      '09:02:00.900',
      '09:03:00.000',
    ]) {
      const base = parseTime(value)!,
        target = timeMilliseconds(base)
      const expected = [...available].sort(
        (a, b) =>
          Math.abs(timeMilliseconds(parseTime(a)!) - target) -
            Math.abs(timeMilliseconds(parseTime(b)!) - target) ||
          a.localeCompare(b),
      )[0]
      expect(nearestTime(base, constraints)).toBe(expected)
    }
  })
  it('prunes unavailable units and far bounds before evaluating individual values', () => {
    const exclude = vi.fn(() => false)
    expect(
      nearestTime([0, 0, 0, 0], {
        ...millis,
        min: '23:59:59.998',
        disabledTime: exclude,
      }),
    ).toBe('23:59:59.998')
    expect(exclude.mock.calls.length).toBeLessThan(5)
    exclude.mockClear()
    expect(
      nearestTime([12, 30, 0, 0], {
        ...millis,
        disabledHours: () => Array.from({ length: 24 }, (_, i) => i),
        disabledTime: exclude,
      }),
    ).toBeUndefined()
    expect(exclude).not.toHaveBeenCalled()
  })
  it('keeps a civil cross-day grid and a narrowed range boundary on the original millisecond origin', () => {
    const constraints = {
      ...millis,
      min: '2024-02-29T23:59:59.950',
      max: '2024-03-01T00:00:00.900',
      step: 0.3,
    }
    expect(
      dateTimeMilliseconds('2024-03-01T00:00:00.001') -
        dateTimeMilliseconds('2024-02-29T23:59:59.999'),
    ).toBe(2)
    expect(dateTimeSelectable('2024-03-01T00:00:00.250', constraints)).toBe(
      true,
    )
    expect(dateTimeSelectable('2024-03-01T00:00:00.300', constraints)).toBe(
      false,
    )
    expect(dateTimeForDate('2024-03-01', '00:00:00.100', constraints)).toBe(
      '2024-03-01T00:00:00.250',
    )
    expect(
      dateTimeForDate('2024-03-01', '00:00:00.300', {
        ...constraints,
        min: '2024-03-01T00:00:00.300',
        stepBase: constraints.min,
      }),
    ).toBe('2024-03-01T00:00:00.550')
    expect(
      dateTimeSelectable('9999-12-31T23:59:59.999', { ...millis, step: 0.001 }),
    ).toBe(true)
  })
})

describe('millisecond picker sessions', () => {
  it('browses 1000 values, skips disabled options and confirms once without changing the submitted field on hover', () => {
    const change = vi.fn()
    const { container } = render(
      <form>
        <TimePicker
          name="time"
          defaultValue="09:30:15.125"
          onChange={change}
          disabledMilliseconds={() => [126]}
          showNow={false}
        />
      </form>,
    )
    const input = screen.getByRole('combobox')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    const column = screen.getByRole('listbox', { name: '时间毫秒' })
    expect(within(column).getAllByRole('option')).toHaveLength(1000)
    expect(option('millisecond', 126)).toBeDisabled()
    fireEvent.pointerEnter(option('millisecond', 127), { pointerType: 'mouse' })
    expect(input).toHaveValue('09:30:15.127')
    expect(option('millisecond', 125)).toHaveAttribute('aria-selected', 'true')
    expect(new FormData(container.querySelector('form')!).get('time')).toBe(
      '09:30:15.125',
    )
    act(() => option('millisecond', 125).focus())
    fireEvent.keyDown(option('millisecond', 125), { key: 'ArrowDown' })
    expect(option('millisecond', 127)).toHaveFocus()
    fireEvent.click(option('millisecond', 127))
    expect(change).not.toHaveBeenCalled()
    confirm()
    expect(change).toHaveBeenCalledExactlyOnceWith('09:30:15.127')
    expect(new FormData(container.querySelector('form')!).get('time')).toBe(
      '09:30:15.127',
    )
  })
  it('supports stepped cells, RTL cross-column keys and recovery when a focused millisecond becomes unavailable', () => {
    const field = (blocked: boolean) => (
      <ConfigProvider direction="rtl">
        <TimePicker
          mode="panel"
          defaultValue="13:30:15.100"
          millisecondStep={100}
          use12Hours
          hideDisabledOptions
          disabledMilliseconds={() => (blocked ? [100] : [200])}
          showNow={false}
          renderCell={(value, unit) =>
            unit === 'millisecond' && value === 300 ? <small>推荐</small> : null
          }
          getCellDescription={(value, unit) =>
            unit === 'millisecond' && value === 300 ? '推荐精度' : undefined
          }
        />
      </ConfigProvider>
    )
    const { rerender } = render(field(false))
    expect(
      screen.getByRole('option', { name: '300毫秒，推荐精度' }),
    ).toHaveTextContent('推荐')
    act(() => option('second', 15).focus())
    fireEvent.keyDown(option('second', 15), { key: 'ArrowLeft' })
    expect(option('millisecond', 100)).toHaveFocus()
    rerender(field(true))
    expect(option('millisecond', 0)).toHaveFocus()
    fireEvent.keyDown(option('millisecond', 0), { key: 'ArrowLeft' })
    expect(option('meridiem', 1)).toHaveFocus()
  })
  it('validates strict manual fractions, exposes formatting and resets to the original value', () => {
    const { container } = render(
      <form>
        <TimePicker
          name="time"
          precision="millisecond"
          defaultValue="09:30:00.000"
        />
      </form>,
    )
    const input = screen.getByRole('combobox')
    expect(input).toHaveAttribute('placeholder', 'HH:mm:ss.SSS')
    fireEvent.change(input, { target: { value: '09:30:00.1' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByRole('alert')).toHaveTextContent('HH:mm:ss.SSS')
    fireEvent.change(input, { target: { value: '09:30:00.123' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(new FormData(container.querySelector('form')!).get('time')).toBe(
      '09:30:00.123',
    )
    fireEvent.reset(container.querySelector('form')!)
    expect(input).toHaveValue('09:30:00.000')
  })
  it('cancels precision changes and propagates endpoint/from through millisecond range restrictions', () => {
    const change = vi.fn(),
      calendar = vi.fn(),
      exclude = vi.fn((_h, _m, _s, info) =>
        info.endpoint === 'end' ? [200] : [],
      )
    render(
      <TimeRangePicker
        defaultValue={['09:30:00.100', '09:30:00.300']}
        millisecondStep={100}
        disabledMilliseconds={exclude}
        onChange={change}
        onCalendarChange={calendar}
      />,
    )
    fireEvent.click(screen.getByLabelText('结束时间', { selector: 'input' }))
    expect(option('millisecond', 200)).toBeDisabled()
    expect(exclude).toHaveBeenCalledWith(9, 30, 0, {
      endpoint: 'end',
      from: '09:30:00.100',
    })
    fireEvent.click(option('millisecond', 400))
    expect(calendar).toHaveBeenLastCalledWith(
      ['09:30:00.100', '09:30:00.400'],
      { endpoint: 'end' },
    )
    fireEvent.keyDown(option('millisecond', 400), { key: 'Escape' })
    expect(
      screen.getByLabelText('结束时间', { selector: 'input' }),
    ).toHaveValue('09:30:00.300')
    expect(change).not.toHaveBeenCalled()
  })
  it('sorts ranges using fractional fields and preserves a locked endpoint', () => {
    const change = vi.fn()
    const { rerender } = render(
      <TimeRangePicker
        mode="panel"
        defaultValue={['09:30:00.100', '09:30:00.300']}
        millisecondStep={100}
        order="sort"
        onChange={change}
      />,
    )
    fireEvent.click(option('millisecond', 400))
    confirm()
    expect(change).toHaveBeenLastCalledWith(['09:30:00.300', '09:30:00.400'])
    rerender(
      <TimeRangePicker
        mode="panel"
        value={['09:30:00.300', '09:30:00.400']}
        disabled={[true, false]}
        millisecondStep={100}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /结束时间：/ }))
    expect(option('millisecond', 200)).toBeDisabled()
    expect(option('millisecond', 300)).toBeEnabled()
  })
  it('retains milliseconds across date changes and forwards showTime unit restrictions', () => {
    const change = vi.fn()
    render(
      <DatePicker
        showTime={{
          millisecondStep: 100,
          disabledMilliseconds: (_h, _m, _s, date) =>
            date === '2024-03-01' ? [100] : [],
        }}
        defaultValue="2024-02-29T09:30:15.100"
        onChange={change}
        showNow={false}
      />,
    )
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' })
    fireEvent.click(
      document.querySelector('[data-calendar-date="2024-03-01"]')!,
    )
    expect(screen.getByRole('combobox')).toHaveValue('2024-03-01 09:30:15.000')
    confirm()
    expect(change).toHaveBeenCalledExactlyOnceWith('2024-03-01T09:30:15.000')
  })
  it('forwards date and endpoint restrictions through DateRangePicker showTime', () => {
    const exclude = vi.fn((_h, _m, _s, date, info) =>
      date === '2024-03-01' && info.endpoint === 'end' ? [200] : [],
    )
    render(
      <DateRangePicker
        showTime={{ millisecondStep: 100, disabledMilliseconds: exclude }}
        defaultValue={['2024-02-29T23:59:59.900', '2024-03-01T00:00:00.100']}
        showNow={false}
      />,
    )
    fireEvent.click(
      screen.getByLabelText('结束日期时间', { selector: 'input' }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: '调整时间', exact: true }),
    )
    expect(option('millisecond', 200)).toBeDisabled()
    expect(exclude).toHaveBeenCalledWith(0, 0, 0, '2024-03-01', {
      endpoint: 'end',
      from: '2024-02-29T23:59:59.900',
    })
  })
  it.each(['time', 'datetime', 'timeRange', 'datetimeRange'])(
    'normalizes native fractions for %s and uses a millisecond step by default',
    (kind) => {
      const change = vi.fn()
      if (kind === 'time')
        render(
          <TimePicker
            mode="native"
            precision="millisecond"
            onChange={change}
          />,
        )
      if (kind === 'datetime')
        render(
          <DateTimePicker
            mode="native"
            precision="millisecond"
            onChange={change}
          />,
        )
      if (kind === 'timeRange')
        render(
          <TimeRangePicker
            mode="native"
            precision="millisecond"
            allowEmpty={[true, true]}
            onChange={change}
          />,
        )
      if (kind === 'datetimeRange')
        render(
          <DateTimeRangePicker
            mode="native"
            precision="millisecond"
            allowEmpty={[true, true]}
            onChange={change}
          />,
        )
      const input = document.querySelector(
        'input[type="time"],input[type="datetime-local"]',
      )!
      expect(input).toHaveAttribute('step', '0.001')
      const value = kind.includes('datetime')
        ? '2024-02-29T09:30:45.100'
        : '09:30:45.100'
      fireEvent.change(input, { target: { value } })
      expect(change).toHaveBeenLastCalledWith(
        kind.endsWith('Range') ? [value, ''] : value,
      )
    },
  )
})
