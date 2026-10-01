import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DatePicker,
  DateRangePicker,
  DateTimePicker,
  DateTimeRangePicker,
  MultiDatePicker,
  TimePicker,
  TimeRangePicker,
} from '@/shared/ui'

const day = (value: string) =>
  document.querySelector<HTMLButtonElement>(
    '[data-calendar-date="' + value + '"]',
  )!
const unit = (value: string) =>
  document.querySelector<HTMLButtonElement>(
    '[data-picker-value="' + value + '"]',
  )!
const time = (value: number) =>
  document.querySelector<HTMLButtonElement>(
    '[data-time-unit="hour"][data-time-value="' + value + '"]',
  )!
const hover = (cell: HTMLElement, pointerType = 'mouse') =>
  fireEvent.pointerOver(cell, { pointerType })
const leave = (cell: HTMLElement) =>
  fireEvent.pointerOut(cell, {
    pointerType: 'mouse',
    relatedTarget: document.body,
  })
const confirm = () =>
  fireEvent.click(screen.getByRole('button', { name: '确定', exact: true }))

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

describe('date input previews do not select or submit', () => {
  it('defaults to a mouse preview while keeping selection, validity and FormData authoritative', () => {
    const onChange = vi.fn(),
      onOk = vi.fn()
    const { container } = render(
      <form>
        <DatePicker
          mode="panel"
          needConfirm
          required
          name="date"
          defaultValue="2024-02-10"
          onChange={onChange}
          onOk={onOk}
        />
      </form>,
    )
    const field = screen.getByRole('textbox'),
      form = container.querySelector('form')!
    hover(day('2024-02-12'))
    expect(field).toHaveValue('2024-02-12')
    expect(field).toHaveAttribute('data-picker-preview', 'hover')
    expect(day('2024-02-10').closest('td')).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(day('2024-02-12').closest('td')).toHaveAttribute(
      'aria-selected',
      'false',
    )
    expect(new FormData(form).get('date')).toBe('2024-02-10')
    expect(form.checkValidity()).toBe(true)
    confirm()
    expect(field).toHaveValue('2024-02-10')
    expect(onOk).toHaveBeenCalledExactlyOnceWith('2024-02-10')
    expect(onChange).not.toHaveBeenCalled()
    hover(day('2024-02-12'))
    fireEvent.click(day('2024-02-12'))
    expect(form.checkValidity()).toBe(false)
    confirm()
    expect(new FormData(form).get('date')).toBe('2024-02-12')
  })

  it.each([
    ['week', '2024-W08', '2024-W09'],
    ['month', '2024-02', '2024-03'],
    ['quarter', '2024-Q1', '2024-Q2'],
    ['year', '2024', '2025'],
  ] as const)(
    'previews the final %s unit without selecting an intermediate browsing cell',
    (picker, current, next) => {
      const onChange = vi.fn()
      render(
        <DatePicker
          picker={picker}
          mode="panel"
          defaultValue={current}
          onChange={onChange}
        />,
      )
      const field = screen.getByRole('textbox')
      hover(unit(next))
      expect(field).toHaveValue(next)
      expect(unit(current).closest('[role="gridcell"]')).toHaveAttribute(
        'aria-selected',
        'true',
      )
      leave(unit(next))
      expect(field).toHaveValue(current)
      if (picker !== 'week') {
        fireEvent.click(screen.getByRole('button', { name: /^浏览\d/ }))
        hover(
          document.querySelector<HTMLButtonElement>(
            '[data-picker-value]:not(:disabled)',
          )!,
        )
        expect(field).toHaveValue(current)
      }
      expect(onChange).not.toHaveBeenCalled()
    },
  )

  it('clears on keyboard navigation, excludes touch and disabled cells, and supports opting out', () => {
    const view = (previewValue: false | 'hover' = 'hover') => (
      <DatePicker
        mode="panel"
        defaultValue="2024-02-10"
        disabledDate={(date) => date === '2024-02-11'}
        previewValue={previewValue}
      />
    )
    const { rerender } = render(view())
    const field = screen.getByRole('textbox')
    hover(day('2024-02-12'), 'touch')
    expect(field).toHaveValue('2024-02-10')
    hover(day('2024-02-11'))
    expect(field).toHaveValue('2024-02-10')
    hover(day('2024-02-12'))
    fireEvent.keyDown(day('2024-02-10'), { key: 'ArrowRight' })
    expect(field).toHaveValue('2024-02-10')
    expect(day('2024-02-12')).toHaveFocus()
    rerender(view(false))
    hover(day('2024-02-12'))
    expect(field).not.toHaveAttribute('data-picker-preview')
    expect(field).toHaveValue('2024-02-10')
  })

  it('does not revive a preview after dynamic disabling, external changes or month browsing', () => {
    const view = (blocked = false, value = '2024-02-10') => (
      <DatePicker
        mode="panel"
        value={value}
        disabledDate={(date) => blocked && date === '2024-02-12'}
      />
    )
    const { rerender } = render(view())
    const field = screen.getByRole('textbox')
    hover(day('2024-02-12'))
    rerender(view(true))
    expect(field).toHaveValue('2024-02-10')
    rerender(view())
    expect(field).toHaveValue('2024-02-10')
    hover(day('2024-02-12'))
    rerender(view(false, '2024-02-15'))
    expect(field).toHaveValue('2024-02-15')
    hover(day('2024-02-12'))
    fireEvent.click(screen.getByRole('button', { name: '下个月', exact: true }))
    expect(field).toHaveValue('2024-02-15')
  })

  it('preserves manual drafts and restores the actual value on cancellation and outside focus', () => {
    render(
      <>
        <DatePicker needConfirm defaultValue="2024-02-10" />
        <button>外部操作</button>
      </>,
    )
    const field = screen.getByRole('combobox')
    fireEvent.keyDown(field, { key: 'ArrowDown' })
    hover(day('2024-02-12'))
    fireEvent.change(field, { target: { value: '2024-02-18' } })
    hover(day('2024-02-19'))
    expect(field).toHaveValue('2024-02-18')
    fireEvent.keyDown(field, { key: 'Escape' })
    expect(field).toHaveValue('2024-02-10')
    fireEvent.keyDown(field, { key: 'ArrowDown' })
    hover(day('2024-02-12'))
    act(() => screen.getByRole('button', { name: '外部操作' }).focus())
    expect(field).toHaveValue('2024-02-10')
  })

  it('previews only the active range endpoint, including crossings, without clearing its opposite or notifying selection', () => {
    const onChange = vi.fn(),
      onCalendarChange = vi.fn()
    const { container } = render(
      <form>
        <DateRangePicker
          mode="panel"
          needConfirm
          name="range"
          defaultValue={['2024-02-10', '2024-02-15']}
          onChange={onChange}
          onCalendarChange={onCalendarChange}
        />
      </form>,
    )
    const start = screen.getByRole('textbox', { name: '开始日期' }),
      end = screen.getByRole('textbox', { name: '结束日期' })
    hover(day('2024-02-18'))
    expect(start).toHaveValue('2024-02-18')
    expect(end).toHaveValue('2024-02-15')
    expect(start).not.toHaveAttribute('aria-invalid', 'true')
    expect(new FormData(container.querySelector('form')!).get('range')).toBe(
      '["2024-02-10","2024-02-15"]',
    )
    fireEvent.click(screen.getByRole('button', { name: /^结束日期：/ }))
    expect(start).toHaveValue('2024-02-10')
    hover(day('2024-02-20'))
    expect(end).toHaveValue('2024-02-20')
    confirm()
    expect(end).toHaveValue('2024-02-15')
    expect(onChange).not.toHaveBeenCalled()
    expect(onCalendarChange).not.toHaveBeenCalled()
  })

  it('preserves keyboard grid previews when input preview is off and respects locked endpoint constraints', () => {
    render(
      <DateRangePicker
        mode="panel"
        previewValue={false}
        defaultValue={['2024-02-10', '2024-02-15']}
        disabled={[true, false]}
        defaultActiveEndpoint="end"
      />,
    )
    const end = screen.getByRole('textbox', { name: '结束日期' })
    hover(day('2024-02-09'))
    expect(end).toHaveValue('2024-02-15')
    act(() => day('2024-02-20').focus())
    expect(
      document.querySelector('[data-calendar-preview]'),
    ).toBeInTheDocument()
    expect(end).toHaveValue('2024-02-15')
  })

  it('shows a multiple-date input preview without adding a tag or calendar change, and completes only the actual array', () => {
    const onChange = vi.fn(),
      onCalendarChange = vi.fn(),
      onOk = vi.fn()
    const { container } = render(
      <form>
        <DatePicker
          multiple
          mode="panel"
          needConfirm
          name="dates"
          defaultValue={['2024-02-10']}
          onChange={onChange}
          onCalendarChange={onCalendarChange}
          onOk={onOk}
        />
      </form>,
    )
    const field = screen.getByRole('textbox')
    hover(day('2024-02-12'))
    expect(field).toHaveValue('2024-02-12')
    expect(
      screen.queryByRole('button', { name: '移除日期 2024-02-12' }),
    ).not.toBeInTheDocument()
    expect(new FormData(container.querySelector('form')!).get('dates')).toBe(
      '["2024-02-10"]',
    )
    confirm()
    expect(field).toHaveValue('')
    expect(onOk).toHaveBeenCalledExactlyOnceWith(['2024-02-10'])
    expect(onChange).not.toHaveBeenCalled()
    expect(onCalendarChange).not.toHaveBeenCalled()
  })

  it('limits multiple previews to enabled options and never replaces a manual draft', () => {
    const { rerender } = render(
      <MultiDatePicker
        mode="panel"
        maxCount={1}
        defaultValue={['2024-02-10']}
      />,
    )
    const field = screen.getByRole('textbox')
    hover(day('2024-02-12'))
    expect(field).toHaveValue('')
    hover(day('2024-02-10'))
    expect(field).toHaveValue('2024-02-10')
    rerender(
      <MultiDatePicker
        mode="panel"
        maxCount={2}
        defaultValue={['2024-02-10']}
      />,
    )
    fireEvent.change(field, { target: { value: '2024-02-18' } })
    hover(day('2024-02-12'))
    expect(field).toHaveValue('2024-02-18')
  })

  it('combines a hovered date with the actual time and clamps it exactly as a selection would', () => {
    const onChange = vi.fn(),
      onCalendarChange = vi.fn()
    render(
      <DatePicker
        showTime
        mode="panel"
        defaultValue="2024-02-29T09:30"
        max="2024-03-01T08:00"
        onChange={onChange}
        onCalendarChange={onCalendarChange}
      />,
    )
    const field = screen.getByRole('textbox')
    hover(day('2024-03-01'))
    expect(field).toHaveValue('2024-03-01 08:00')
    confirm()
    expect(field).toHaveValue('2024-02-29 09:30')
    expect(onChange).not.toHaveBeenCalled()
    expect(onCalendarChange).not.toHaveBeenCalled()
  })

  it('uses the default time for an empty date-time preview without reporting errors for a date with no available time', () => {
    render(
      <DateTimePicker
        mode="panel"
        defaultPanelMonth="2024-02"
        defaultOpenTime="09:30"
        disabledHours={(date) =>
          date === '2024-02-12'
            ? Array.from({ length: 24 }, (_, hour) => hour)
            : []
        }
      />,
    )
    const field = screen.getByRole('textbox')
    hover(day('2024-02-12'))
    expect(field).toHaveValue('')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    hover(day('2024-02-13'))
    expect(field).toHaveValue('2024-02-13 09:30')
    expect(
      screen.getByRole('button', { name: '确定', exact: true }),
    ).toBeDisabled()
  })

  it('routes date-time range previews through endpoint and date constraints, and keeps both submitted dates', () => {
    const onCalendarChange = vi.fn()
    render(
      <DateRangePicker
        showTime={{ previewValue: 'hover' }}
        mode="panel"
        defaultValue={['2024-02-28T23:30', '2024-02-29T09:30']}
        defaultActiveEndpoint="end"
        disabledMinutes={(hour, date, info) =>
          info.endpoint === 'end' &&
          info.from === '2024-02-28T23:30' &&
          date === '2024-03-01' &&
          hour === 9
            ? [30]
            : []
        }
        onCalendarChange={onCalendarChange}
      />,
    )
    const start = screen.getByRole('textbox', { name: '开始日期时间' }),
      end = screen.getByRole('textbox', { name: '结束日期时间' })
    hover(day('2024-03-01'))
    expect(end).toHaveValue('2024-03-01 09:29')
    expect(start).toHaveValue('2024-02-28 23:30')
    expect(onCalendarChange).not.toHaveBeenCalled()
    leave(day('2024-03-01'))
    expect(end).toHaveValue('2024-02-29 09:30')
  })

  it('applies the same input isolation to period ranges and multiple periods', () => {
    const { rerender } = render(
      <DateRangePicker
        picker="quarter"
        mode="panel"
        defaultValue={['2024-Q1', '2024-Q2']}
      />,
    )
    hover(unit('2024-Q3'))
    expect(screen.getByRole('textbox', { name: '开始季度' })).toHaveValue(
      '2024-Q3',
    )
    expect(screen.getByRole('textbox', { name: '结束季度' })).toHaveValue(
      '2024-Q2',
    )
    rerender(
      <MultiDatePicker
        picker="month"
        mode="panel"
        defaultValue={['2024-02']}
      />,
    )
    hover(unit('2024-03'))
    expect(screen.getByRole('textbox')).toHaveValue('2024-03')
    expect(screen.getAllByText('已选 1 项', { exact: true })).toHaveLength(2)
  })

  it('clears date-time previews when a controlled month changes and forwards the showTime opt-out', () => {
    const { rerender } = render(
      <DateTimePicker
        mode="panel"
        defaultValue="2024-02-10T09:30"
        panelMonth="2024-02"
      />,
    )
    const field = screen.getByRole('textbox')
    hover(day('2024-02-12'))
    expect(field).toHaveValue('2024-02-12 09:30')
    rerender(
      <DateTimePicker
        mode="panel"
        defaultValue="2024-02-10T09:30"
        panelMonth="2024-03"
      />,
    )
    expect(field).toHaveValue('2024-02-10 09:30')
    rerender(
      <DatePicker
        showTime={{ previewValue: false }}
        mode="panel"
        defaultValue="2024-02-10T09:30"
      />,
    )
    hover(day('2024-02-12'))
    expect(screen.getByRole('textbox')).toHaveValue('2024-02-10 09:30')
  })

  it.each(['date', 'time', 'dateTime'] as const)(
    'does not satisfy a required empty %s field by hovering',
    (kind) => {
      const { container } = render(
        <form>
          {kind === 'date' ? (
            <DatePicker
              mode="panel"
              required
              name="value"
              defaultPanelMonth="2024-02"
            />
          ) : kind === 'time' ? (
            <TimePicker mode="panel" required name="value" />
          ) : (
            <DateTimePicker
              mode="panel"
              required
              name="value"
              defaultPanelMonth="2024-02"
            />
          )}
        </form>,
      )
      const field = screen.getByRole('textbox'),
        form = container.querySelector('form')!
      hover(kind === 'time' ? time(9) : day('2024-02-12'))
      expect(field).not.toHaveValue('')
      expect(new FormData(form).get('value')).toBe('')
      expect(form.checkValidity()).toBe(false)
    },
  )

  it.each(['date', 'time', 'dateTime'] as const)(
    'does not complete a required open %s interval from a preview',
    (kind) => {
      const { container } = render(
        <form>
          {kind === 'date' ? (
            <DateRangePicker
              mode="panel"
              required
              allowEmpty={[false, true]}
              name="value"
              defaultPanelMonth="2024-02"
            />
          ) : kind === 'time' ? (
            <TimeRangePicker
              mode="panel"
              required
              allowEmpty={[false, true]}
              name="value"
            />
          ) : (
            <DateTimeRangePicker
              mode="panel"
              required
              allowEmpty={[false, true]}
              name="value"
              defaultPanelMonth="2024-02"
            />
          )}
        </form>,
      )
      const form = container.querySelector('form')!
      hover(kind === 'time' ? time(9) : day('2024-02-12'))
      expect(screen.getAllByRole('textbox')[0]).not.toHaveValue('')
      expect(new FormData(form).get('value')).toBe('["",""]')
      expect(form.checkValidity()).toBe(false)
    },
  )
})
