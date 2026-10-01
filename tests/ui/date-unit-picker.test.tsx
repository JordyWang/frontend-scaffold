import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfigProvider, DatePicker, MultiDatePicker } from '@/shared/ui'
import { calendarDate, toISO } from '@/shared/ui/date-picker-state'
import { DatePickerPanel } from '@/shared/ui/date-picker-panel'
import {
  movePickerValue,
  parsePickerValue,
  pickerBoundMonth,
  pickerDefaultBounds,
  pickerSpan,
  pickerStepMatches,
  toPickerValue,
  type DatePeriodUnit,
} from '@/shared/ui/date-unit-state'

const field = () => screen.getByRole('combobox', { name: '日期', exact: true })
const open = () => fireEvent.keyDown(field(), { key: 'ArrowDown' })
const cell = (key: string) =>
  document.querySelector<HTMLButtonElement>(
    '[data-picker-value="' + key + '"]',
  )!

describe('strict project date unit values', () => {
  it.each([
    ['2020-12-28', '2020-W53'],
    ['2021-01-01', '2020-W53'],
    ['2021-01-04', '2021-W01'],
    ['2024-12-30', '2025-W01'],
    ['0001-01-01', '0001-W01'],
  ])('maps %s to ISO week %s without timezone conversion', (date, week) => {
    const [year, month, day] = date.split('-').map(Number)
    expect(toPickerValue(calendarDate(year, month - 1, day), 'week')).toBe(week)
    expect(toPickerValue(parsePickerValue(week, 'week')!, 'week')).toBe(week)
  })
  it.each([
    ['week', '2021-W53'],
    ['week', '2024-W00'],
    ['week', '2024-W1'],
    ['week', '0000-W01'],
    ['month', '2024-13'],
    ['month', '2024-2'],
    ['quarter', '2024-Q0'],
    ['quarter', '2024-Q5'],
    ['quarter', '2024-q1'],
    ['year', '0000'],
    ['year', '10000'],
    ['year', '24'],
  ] as [DatePeriodUnit, string][])(
    'rejects invalid %s value %s',
    (unit, value) => {
      expect(parsePickerValue(value, unit)).toBeUndefined()
    },
  )
  it('calculates leap periods, extrema and per-unit step arithmetic', () => {
    expect(pickerSpan('2024-02', 'month')!.map(toISO)).toEqual([
      '2024-02-01',
      '2024-02-29',
    ])
    expect(pickerSpan('2024-Q1', 'quarter')!.map(toISO)).toEqual([
      '2024-01-01',
      '2024-03-31',
    ])
    expect(pickerSpan('2020-W53', 'week')!.map(toISO)).toEqual([
      '2020-12-28',
      '2021-01-03',
    ])
    expect(movePickerValue('2020-W53', 'week', 1)).toBe('2021-W01')
    expect(movePickerValue('2024-12', 'month', 1)).toBe('2025-01')
    expect(movePickerValue('2024-Q4', 'quarter', 1)).toBe('2025-Q1')
    for (const unit of ['week', 'month', 'quarter', 'year'] as const) {
      const [min, max] = pickerDefaultBounds(unit)
      expect(parsePickerValue(min, unit)).toBeDefined()
      expect(parsePickerValue(max, unit)).toBeDefined()
      expect(movePickerValue(min, unit, -1)).toBeUndefined()
      expect(movePickerValue(max, unit, 1)).toBeUndefined()
      expect(pickerBoundMonth(min, unit, 0)).toBe('0001-01')
      expect(pickerBoundMonth(max, unit, 1)).toBe('9999-12')
    }
    expect(pickerStepMatches('2021-W02', 'week', '2020-W53', 2)).toBe(true)
    expect(pickerStepMatches('2021-W01', 'week', '2020-W53', 2)).toBe(false)
    expect(pickerStepMatches('2024-W12', 'week', '2024-W10', 2)).toBe(true)
    expect(pickerStepMatches('2024-W11', 'week', '2024-W10', 2)).toBe(false)
    expect(pickerStepMatches('2025-01', 'month', '2024-01', 3)).toBe(true)
    expect(pickerStepMatches('2025-Q2', 'quarter', '2024-Q1', 2)).toBe(false)
    expect(pickerStepMatches('2028', 'year', '2024', 2)).toBe(true)
  })
})

describe('date units share project single and multiple sessions', () => {
  it('keeps the upper year boundary reachable and renders invalid neighboring decades as disabled placeholders', () => {
    render(<DatePicker picker="year" defaultValue="9999" />)
    open()
    expect(cell('9999')).toHaveFocus()
    expect(cell('10000')).toBeDisabled()
    expect(cell('10000')).toHaveTextContent('—')
    fireEvent.click(screen.getByRole('button', { name: '浏览9990–9999' }))
    expect(cell('10000')).toBeDisabled()
    expect(cell('10000')).toHaveTextContent('—')
    expect(cell('9990')).not.toBeDisabled()
  })
  it('checks the current-unit shortcut against the final panel boundaries while drilling', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-15T12:00:00'))
    try {
      render(
        <DatePicker
          picker="month"
          defaultValue="2024-02"
          min="2024-01"
          max="2024-12"
        />,
      )
      open()
      expect(
        screen.getByRole('button', { name: '浏览当前月份' }),
      ).toBeDisabled()
      fireEvent.click(screen.getByRole('button', { name: '浏览2024年' }))
      expect(
        screen.getByRole('button', { name: '浏览当前月份' }),
      ).toBeDisabled()
    } finally {
      vi.useRealTimers()
    }
  })
  it('recovers owned focus to navigation when every unit becomes unavailable without stealing external focus', () => {
    const props = {
      picker: 'month' as const,
      value: '2024-02',
      month: '2024-02',
    }
    const { rerender } = render(
      <>
        <DatePickerPanel {...props} />
        <button>外部</button>
      </>,
    )
    act(() => cell('2024-02').focus())
    act(() => cell('2024-02').blur())
    rerender(
      <>
        <DatePickerPanel {...props} disabledDate={() => true} />
        <button>外部</button>
      </>,
    )
    expect(screen.getByRole('button', { name: '上一页' })).toHaveFocus()
    act(() => screen.getByRole('button', { name: '外部' }).focus())
    rerender(
      <>
        <DatePickerPanel {...props} disabledDate={() => true} />
        <button>外部</button>
      </>,
    )
    expect(screen.getByRole('button', { name: '外部' })).toHaveFocus()
  })
  it('starts a fresh session when the public picker changes with a matching external value', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <DatePicker
        picker="month"
        value="2024-02"
        needConfirm
        onChange={onChange}
      />,
    )
    open()
    fireEvent.click(cell('2024-06'))
    rerender(
      <DatePicker
        picker="quarter"
        value="2024-Q2"
        needConfirm
        onChange={onChange}
      />,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(field()).toHaveValue('2024-Q2')
    open()
    expect(cell('2024-Q2')).toHaveFocus()
    expect(onChange).not.toHaveBeenCalled()
  })
  it('supports keyboard decade browsing at the lowest representable year', () => {
    const onChange = vi.fn()
    render(<DatePicker picker="year" defaultValue="0001" onChange={onChange} />)
    open()
    fireEvent.click(screen.getByRole('button', { name: '浏览1–9' }))
    expect(cell('0001')).toHaveFocus()
    fireEvent.keyDown(cell('0001'), { key: 'ArrowRight' })
    expect(cell('0010')).toHaveFocus()
    fireEvent.click(cell('0010'))
    fireEvent.click(cell('0012'))
    expect(onChange).toHaveBeenCalledExactlyOnceWith('0012')
  })
  it('recovers focus from an externally disabled unit without publishing', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <DatePicker picker="month" defaultValue="2024-02" onChange={onChange} />,
    )
    open()
    rerender(
      <DatePicker
        picker="month"
        defaultValue="2024-02"
        onChange={onChange}
        disabledDate={(value) => value === '2024-02'}
      />,
    )
    expect(cell('2024-01')).toHaveFocus()
    expect(onChange).not.toHaveBeenCalled()
    expect(field()).toHaveAttribute('aria-invalid', 'true')
  })
  it('discards single-unit confirmation when an external controller closes its panel', () => {
    const onChange = vi.fn()
    const props = {
      picker: 'quarter' as const,
      defaultValue: '2024-Q1',
      needConfirm: true,
      onChange,
    }
    const { rerender } = render(<DatePicker {...props} open />)
    fireEvent.click(cell('2024-Q2'))
    expect(field()).toHaveValue('2024-Q2')
    rerender(<DatePicker {...props} open={false} />)
    expect(field()).toHaveValue('2024-Q1')
    rerender(<DatePicker {...props} open />)
    expect(cell('2024-Q1').parentElement).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(onChange).not.toHaveBeenCalled()
  })
  it.each([
    ['week', '2021-W53', '2020-W53'],
    ['month', '2024-13', '2024-02'],
    ['quarter', '2024-Q5', '2024-Q2'],
    ['year', '0000', '2024'],
  ] as [DatePeriodUnit, string, string][])(
    'validates manual %s input and commits a valid complete value',
    (picker, invalid, valid) => {
      const onChange = vi.fn()
      render(<DatePicker picker={picker} onChange={onChange} />)
      fireEvent.change(field(), { target: { value: invalid } })
      fireEvent.keyDown(field(), { key: 'Enter' })
      expect(screen.getByRole('alert')).toHaveTextContent('请输入可选日期')
      expect(onChange).not.toHaveBeenCalled()
      fireEvent.change(field(), { target: { value: valid } })
      fireEvent.keyDown(field(), { key: 'Enter' })
      expect(onChange).toHaveBeenCalledExactlyOnceWith(valid)
      expect(field()).toHaveValue(valid)
    },
  )
  it.each([
    ['week', '2020-W53', '2021-W01', 'ArrowDown'],
    ['month', '2024-12', '2025-01', 'ArrowRight'],
    ['quarter', '2024-Q4', '2025-Q1', 'ArrowRight'],
    ['year', '2029', '2030', 'ArrowRight'],
  ] as [DatePeriodUnit, string, string, string][])(
    'browses %s across years without publishing until activation',
    (picker, start, next, key) => {
      const onChange = vi.fn()
      render(
        <DatePicker picker={picker} defaultValue={start} onChange={onChange} />,
      )
      open()
      expect(cell(start)).toHaveFocus()
      fireEvent.keyDown(cell(start), { key })
      expect(cell(next)).toHaveFocus()
      expect(onChange).not.toHaveBeenCalled()
      fireEvent.click(cell(next))
      expect(onChange).toHaveBeenCalledExactlyOnceWith(next)
      expect(field()).toHaveValue(next)
      expect(field()).toHaveFocus()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    },
  )
  it('drills through decade and year without committing then chooses a month', () => {
    const onChange = vi.fn()
    render(
      <DatePicker picker="month" defaultValue="2024-02" onChange={onChange} />,
    )
    open()
    fireEvent.click(screen.getByRole('button', { name: '浏览2024年' }))
    fireEvent.click(screen.getByRole('button', { name: '浏览2020–2029' }))
    fireEvent.click(cell('2030'))
    fireEvent.click(cell('2032'))
    expect(cell('2032-02')).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.click(cell('2032-02'))
    expect(onChange).toHaveBeenCalledExactlyOnceWith('2032-02')
  })
  it('uses unit boundaries and step in panel, input and presets, restoring an invalid draft', () => {
    const onChange = vi.fn(),
      dynamic = vi.fn(() => '2024-04')
    render(
      <>
        <DatePicker
          picker="month"
          defaultValue="2024-01"
          min="2024-01"
          max="2024-09"
          step={2}
          disabledDate={(value) => value === '2024-05'}
          onChange={onChange}
          presets={[
            { key: 'bad', label: '禁用月份', value: '2024-02' },
            { key: 'live', label: '动态月份', value: dynamic },
          ]}
        />
        <button>外部</button>
      </>,
    )
    open()
    expect(cell('2024-02')).toBeDisabled()
    expect(cell('2024-05')).toBeDisabled()
    expect(cell('2024-11')).toBeDisabled()
    expect(screen.getByRole('button', { name: '下一页' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '禁用月份' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '动态月份' }))
    expect(dynamic).toHaveBeenCalledOnce()
    expect(screen.getByRole('alert')).toHaveTextContent('快捷日期当前不可选')
    fireEvent.keyDown(cell('2024-01'), { key: 'ArrowRight' })
    expect(cell('2024-03')).toHaveFocus()
    fireEvent.keyDown(cell('2024-03'), { key: 'Escape' })
    fireEvent.change(field(), { target: { value: '2024-05' } })
    fireEvent.keyDown(field(), { key: 'Enter' })
    expect(screen.getByRole('alert')).toHaveTextContent('YYYY-MM')
    act(() => screen.getByRole('button', { name: '外部' }).focus())
    expect(field()).toHaveValue('2024-01')
    expect(onChange).not.toHaveBeenCalled()
  })
  it('keeps confirmed quarters pending, exposes custom cell semantics and resets a native form', () => {
    const onChange = vi.fn(),
      onOk = vi.fn()
    const { container } = render(
      <form>
        <DatePicker
          picker="quarter"
          name="quarter"
          defaultValue="2024-Q1"
          needConfirm
          onChange={onChange}
          onOk={onOk}
          renderCell={(value) =>
            value.endsWith('Q2') ? <span>发布</span> : null
          }
          getCellDescription={(value) =>
            value.endsWith('Q2') ? '发布季度' : undefined
          }
        />
      </form>,
    )
    open()
    expect(cell('2024-Q2')).toHaveAccessibleName(/发布季度/)
    fireEvent.click(cell('2024-Q2'))
    expect(onChange).not.toHaveBeenCalled()
    expect(new FormData(container.querySelector('form')!).get('quarter')).toBe(
      '2024-Q1',
    )
    fireEvent.click(screen.getByRole('button', { name: '确定', exact: true }))
    expect(onOk).toHaveBeenCalledWith('2024-Q2')
    expect(onChange).toHaveBeenCalledExactlyOnceWith('2024-Q2')
    fireEvent.reset(container.querySelector('form')!)
    expect(field()).toHaveValue('2024-Q1')
    expect(onChange).toHaveBeenCalledOnce()
  })
  it.each(['week', 'month', 'quarter', 'year'] as const)(
    'supports %s multiple selection and JSON form values with the existing tag API',
    (picker) => {
      const choices =
        picker === 'week'
          ? ['2020-W53', '2021-W01']
          : picker === 'month'
            ? ['2024-02', '2024-03']
            : picker === 'quarter'
              ? ['2024-Q1', '2024-Q2']
              : ['2024', '2025']
      const onChange = vi.fn()
      const { container } = render(
        <form>
          <DatePicker
            multiple
            picker={picker}
            label="日期"
            defaultValue={[choices[0]]}
            name="units"
            maxCount={2}
            onChange={onChange}
          />
        </form>,
      )
      open()
      fireEvent.click(cell(choices[1]))
      expect(screen.getByRole('grid')).toHaveAttribute(
        'aria-multiselectable',
        'true',
      )
      expect(cell(choices[1]).parentElement).toHaveAttribute(
        'aria-selected',
        'true',
      )
      expect(onChange).not.toHaveBeenCalled()
      expect(new FormData(container.querySelector('form')!).get('units')).toBe(
        JSON.stringify([choices[0]]),
      )
      fireEvent.click(screen.getByRole('button', { name: '完成', exact: true }))
      expect(onChange).toHaveBeenCalledExactlyOnceWith(choices)
      fireEvent.keyDown(field(), { key: 'Backspace' })
      expect(onChange).toHaveBeenLastCalledWith([choices[0]])
    },
  )
  it('keeps RTL visual navigation and keyboard page browsing separate from selection', () => {
    const onChange = vi.fn()
    render(
      <ConfigProvider direction="rtl">
        <DatePicker picker="month" defaultValue="2024-02" onChange={onChange} />
      </ConfigProvider>,
    )
    open()
    fireEvent.keyDown(cell('2024-02'), { key: 'ArrowLeft' })
    expect(cell('2024-03')).toHaveFocus()
    fireEvent.keyDown(cell('2024-03'), { key: 'PageDown' })
    expect(cell('2025-03')).toHaveFocus()
    fireEvent.keyDown(cell('2025-03'), { key: 'Home', ctrlKey: true })
    expect(cell('2025-01')).toHaveFocus()
    fireEvent.keyDown(cell('2025-01'), { key: 'End', ctrlKey: true })
    expect(cell('2025-12')).toHaveFocus()
    expect(onChange).not.toHaveBeenCalled()
  })
  it('accepts controlled empty units, replaces external values and protects readonly inline panels', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <DatePicker
        picker="year"
        value={undefined}
        defaultValue="2024"
        defaultPanelMonth="2024-01"
        onChange={onChange}
      />,
    )
    expect(field()).toHaveValue('')
    open()
    fireEvent.click(cell('2024'))
    expect(onChange).toHaveBeenCalledWith('2024')
    expect(field()).toHaveValue('')
    rerender(
      <DatePicker
        picker="year"
        value="2025"
        mode="panel"
        readOnly
        onChange={onChange}
      />,
    )
    expect(screen.getByRole('textbox')).toHaveValue('2025')
    expect(cell('2024')).toBeDisabled()
    expect(
      within(screen.getByRole('grid'))
        .getAllByRole('button')
        .every((button) => button.hasAttribute('disabled')),
    ).toBe(true)
  })
  it('shows unavailable external multi values and discards a confirmation session on external close', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <MultiDatePicker
        picker="quarter"
        label="日期"
        value={['2024-Q1']}
        open
        needConfirm
        onChange={onChange}
      />,
    )
    fireEvent.click(cell('2024-Q2'))
    rerender(
      <MultiDatePicker
        picker="quarter"
        label="日期"
        value={['2024-Q1']}
        open={false}
        needConfirm
        onChange={onChange}
      />,
    )
    rerender(
      <MultiDatePicker
        picker="quarter"
        label="日期"
        value={['2024-Q1']}
        open
        needConfirm
        onChange={onChange}
      />,
    )
    expect(cell('2024-Q2').parentElement).toHaveAttribute(
      'aria-selected',
      'false',
    )
    expect(onChange).not.toHaveBeenCalled()
    rerender(
      <MultiDatePicker
        picker="quarter"
        label="日期"
        value={['2024-Q5']}
        onChange={onChange}
      />,
    )
    expect(field()).toHaveAttribute('aria-invalid', 'true')
    fireEvent.click(screen.getByRole('button', { name: '清空日期' }))
    expect(onChange).toHaveBeenCalledWith([])
  })
})
