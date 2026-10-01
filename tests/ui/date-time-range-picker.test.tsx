import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  DateRangePicker,
  DateTimeRangePicker,
  Form,
  FormItem,
} from '@/shared/ui'
import { dateTimeForDate } from '@/shared/ui/date-time-picker-state'

const field = (part: 'start' | 'end' = 'start') =>
  screen.getByRole('combobox', {
    name: part === 'start' ? '开始日期时间' : '结束日期时间',
    exact: true,
  })
const open = (part: 'start' | 'end' = 'start') =>
  fireEvent.keyDown(field(part), { key: 'ArrowDown' })
const day = (date: string) =>
  document.querySelector<HTMLButtonElement>(
    '[data-calendar-date="' + date + '"]',
  )!
const option = (unit: string, value: number) =>
  document.querySelector<HTMLButtonElement>(
    '[data-time-unit="' + unit + '"][data-time-value="' + value + '"]',
  )!
const endpoint = (part: 'start' | 'end') =>
  fireEvent.click(
    screen.getByRole('button', {
      name: part === 'start' ? /^开始日期时间：/ : /^结束日期时间：/,
    }),
  )
const time = () =>
  fireEvent.click(screen.getByRole('button', { name: '调整时间', exact: true }))
const confirm = () =>
  fireEvent.click(screen.getByRole('button', { name: '确定', exact: true }))

describe('date-time range combined panel', () => {
  it('browses and edits each endpoint through one session and submits one canonical tuple', () => {
    const onChange = vi.fn(),
      onOk = vi.fn(),
      onCalendarChange = vi.fn(),
      onBlur = vi.fn()
    const { container } = render(
      <form>
        <DateRangePicker
          showTime={{ minuteStep: 15 }}
          name="range"
          defaultValue={['2024-02-29T23:30', '2024-03-01T00:30']}
          onChange={onChange}
          onOk={onOk}
          onCalendarChange={onCalendarChange}
          onBlur={onBlur}
        />
      </form>,
    )
    open()
    fireEvent.keyDown(day('2024-02-29'), { key: 'ArrowLeft' })
    expect(field()).toHaveValue('2024-02-29 23:30')
    time()
    fireEvent.click(option('hour', 22))
    endpoint('end')
    expect(day('2024-03-01')).toHaveFocus()
    fireEvent.click(day('2024-03-02'))
    time()
    fireEvent.click(option('minute', 45))
    expect(field('end')).toHaveValue('2024-03-02 00:45')
    expect(onCalendarChange).toHaveBeenLastCalledWith(
      ['2024-02-29T22:30', '2024-03-02T00:45'],
      { endpoint: 'end', part: 'time' },
    )
    expect(onChange).not.toHaveBeenCalled()
    expect(onBlur).not.toHaveBeenCalled()
    expect(new FormData(container.querySelector('form')!).get('range')).toBe(
      '["2024-02-29T23:30","2024-03-01T00:30"]',
    )
    expect(field()).toBeInvalid()
    confirm()
    expect(onChange).toHaveBeenCalledExactlyOnceWith([
      '2024-02-29T22:30',
      '2024-03-02T00:45',
    ])
    expect(onOk).toHaveBeenCalledExactlyOnceWith([
      '2024-02-29T22:30',
      '2024-03-02T00:45',
    ])
    expect(field('end')).toHaveFocus()
    expect(field()).toBeValid()
  })
  it('clears the editable opposite endpoint after a crossed full date-time and continues from its date', () => {
    const onChange = vi.fn()
    render(
      <DateTimeRangePicker
        defaultValue={['2024-02-29T09:30', '2024-03-01T17:00']}
        onChange={onChange}
      />,
    )
    open()
    fireEvent.click(day('2024-03-02'))
    expect(field('end')).toHaveValue('')
    expect(
      screen.getByRole('button', { name: '确定', exact: true }),
    ).toBeDisabled()
    endpoint('end')
    expect(screen.getByRole('grid')).toHaveAccessibleName(
      '结束日期时间日期，2024年3月',
    )
    fireEvent.click(day('2024-03-03'))
    confirm()
    expect(onChange).toHaveBeenCalledExactlyOnceWith([
      '2024-03-02T09:30',
      '2024-03-03T09:30',
    ])
  })
  it('sorts only on commit and preserves locked endpoint identity and full-date bounds', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <DateTimeRangePicker
        defaultValue={['2024-02-29T09:30', '2024-03-01T17:00']}
        order="sort"
        onChange={onChange}
      />,
    )
    open()
    fireEvent.click(day('2024-03-02'))
    expect(field()).toHaveValue('2024-03-02 09:30')
    expect(field('end')).toHaveValue('2024-03-01 17:00')
    confirm()
    expect(onChange).toHaveBeenLastCalledWith([
      '2024-03-01T17:00',
      '2024-03-02T09:30',
    ])
    rerender(
      <DateTimeRangePicker
        value={['2024-02-29T23:30', '2024-03-01T00:30']}
        disabled={[true, false]}
        order="sort"
        onChange={onChange}
      />,
    )
    open('end')
    fireEvent.click(screen.getByRole('button', { name: '上个月' }))
    expect(day('2024-02-28')).toBeDisabled()
    fireEvent.click(day('2024-02-29'))
    expect(field('end')).toHaveValue('2024-02-29 23:30')
    time()
    expect(option('hour', 22)).toBeDisabled()
    confirm()
    expect(onChange).toHaveBeenLastCalledWith([
      '2024-02-29T23:30',
      '2024-02-29T23:30',
    ])
  })
  it('retains the original step grid when range availability narrows its minimum', () => {
    expect(
      dateTimeForDate('2024-03-01', '10:10', {
        precision: 'minute',
        min: '2024-03-01T10:10',
        stepBase: '2024-02-29T00:00',
        step: 900,
      }),
    ).toBe('2024-03-01T10:15')
  })
  it('passes complete from values and the chosen date to dynamic date/time restrictions', () => {
    const disabledHours = vi.fn(
      (date: string, info: { endpoint: string; from?: string }) =>
        info.endpoint === 'end' &&
        date === '2024-03-01' &&
        info.from === '2024-02-29T23:30'
          ? [1]
          : [],
    )
    const disabledDate = vi.fn(
      (date: string, info: { endpoint: string }) =>
        info.endpoint === 'end' && date === '2024-03-02',
    )
    render(
      <DateTimeRangePicker
        defaultValue={['2024-02-29T23:30', '2024-03-01T00:30']}
        disabledHours={disabledHours}
        disabledDate={disabledDate}
      />,
    )
    open('end')
    expect(day('2024-03-02')).toBeDisabled()
    time()
    expect(option('hour', 1)).toBeDisabled()
    expect(disabledHours).toHaveBeenCalledWith('2024-03-01', {
      endpoint: 'end',
      from: '2024-02-29T23:30',
    })
    endpoint('start')
    time()
    expect(option('hour', 1)).not.toBeDisabled()
  })
  it('uses per-endpoint default time only on choosing a date and permits explicitly open intervals', () => {
    const onChange = vi.fn()
    render(
      <DateTimeRangePicker
        defaultPanelMonth="2024-02"
        defaultOpenTime={['09:30', '17:00']}
        allowEmpty={[false, true]}
        onChange={onChange}
      />,
    )
    open()
    expect(field()).toHaveValue('')
    fireEvent.click(day('2024-02-29'))
    expect(field()).toHaveValue('2024-02-29 09:30')
    confirm()
    expect(onChange).toHaveBeenLastCalledWith(['2024-02-29T09:30', ''])
    open('end')
    fireEvent.click(day('2024-03-01'))
    expect(field('end')).toHaveValue('2024-03-01 17:00')
    confirm()
    expect(onChange).toHaveBeenLastCalledWith([
      '2024-02-29T09:30',
      '2024-03-01T17:00',
    ])
  })
  it('accepts 12-hour seconds input, blocks pending manual submission and confirms both drafts', () => {
    const onChange = vi.fn()
    render(
      <DateRangePicker
        showTime={{ use12Hours: true, precision: 'second' }}
        defaultValue={['2024-02-29T23:30:15', '2024-03-01T00:30:15']}
        onChange={onChange}
      />,
    )
    fireEvent.change(field(), { target: { value: '2024-02-29 10:45:30 PM' } })
    fireEvent.change(field('end'), { target: { value: '2024-03-01T01:30:45' } })
    expect(field()).toBeInvalid()
    fireEvent.keyDown(field('end'), { key: 'Enter' })
    expect(onChange).toHaveBeenCalledExactlyOnceWith([
      '2024-02-29T22:45:30',
      '2024-03-01T01:30:45',
    ])
    expect(field('end')).toHaveValue('2024-03-01 01:30:45 AM')
    fireEvent.change(field(), { target: { value: '2024-02-30 10:45:30 PM' } })
    fireEvent.keyDown(field(), { key: 'Enter' })
    expect(screen.getByRole('alert')).toHaveTextContent(
      '请输入可选的日期时间范围',
    )
  })
  it('cancels Escape, outside focus and external close while preserving submitted values', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <>
        <DateTimeRangePicker
          defaultValue={['2024-02-29T09:30', '2024-03-01T17:00']}
          onChange={onChange}
        />
        <button>外部</button>
      </>,
    )
    open()
    time()
    fireEvent.click(option('hour', 10))
    fireEvent.keyDown(option('hour', 10), { key: 'Escape' })
    expect(field()).toHaveValue('2024-02-29 09:30')
    open()
    fireEvent.click(day('2024-03-01'))
    act(() => screen.getByRole('button', { name: '外部' }).focus())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    rerender(
      <DateTimeRangePicker
        value={['2024-02-29T09:30', '2024-03-01T17:00']}
        open
        onChange={onChange}
      />,
    )
    time()
    fireEvent.click(option('hour', 10))
    rerender(
      <DateTimeRangePicker
        value={['2024-02-29T09:30', '2024-03-01T17:00']}
        open={false}
        onChange={onChange}
      />,
    )
    expect(field()).toHaveValue('2024-02-29 09:30')
    expect(onChange).not.toHaveBeenCalled()
  })
  it('allows Safari touch blur before internal endpoint and part switches', () => {
    const onBlur = vi.fn()
    render(
      <DateTimeRangePicker
        defaultValue={['2024-02-29T09:30', '2024-03-01T17:00']}
        onBlur={onBlur}
      />,
    )
    open()
    const switcher = screen.getByRole('button', { name: /^结束日期时间：/ })
    fireEvent.pointerDown(switcher)
    fireEvent.blur(day('2024-02-29'), { relatedTarget: null })
    fireEvent.click(switcher)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(day('2024-03-01')).toHaveFocus()
    time()
    expect(option('hour', 17)).toHaveFocus()
    expect(onBlur).not.toHaveBeenCalled()
  })
  it('keeps a boundary navigation blur inside the session and recovers an enabled control', () => {
    const onBlur = vi.fn()
    render(
      <DateTimeRangePicker
        defaultValue={['2024-02-29T23:30', '2024-03-01T00:30']}
        disabled={[true, false]}
        onBlur={onBlur}
      />,
    )
    open('end')
    const previous = screen.getByRole('button', { name: '上个月', exact: true })
    act(() => previous.focus())
    fireEvent.click(previous)
    expect(previous).toBeDisabled()
    expect(day('2024-03-01')).toHaveFocus()
    fireEvent.blur(previous, { relatedTarget: null })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(onBlur).not.toHaveBeenCalled()
    fireEvent.click(day('2024-02-29'))
    confirm()
    expect(field('end')).toHaveValue('2024-02-29 23:30')
  })
  it('publishes only complete immediate panel selections, and preserves them on cancellation', () => {
    const onChange = vi.fn()
    render(
      <DateTimeRangePicker
        defaultPanelMonth="2024-02"
        needConfirm={false}
        defaultOpenTime={['09:30', '17:00']}
        onChange={onChange}
      />,
    )
    open()
    fireEvent.click(day('2024-02-29'))
    expect(onChange).not.toHaveBeenCalled()
    endpoint('end')
    fireEvent.click(day('2024-03-01'))
    expect(onChange).toHaveBeenCalledExactlyOnceWith([
      '2024-02-29T09:30',
      '2024-03-01T17:00',
    ])
    fireEvent.click(screen.getByRole('button', { name: '取消', exact: true }))
    expect(field('end')).toHaveValue('2024-03-01 17:00')
  })
  it('evaluates presets only on activation and prevents mutation of a locked endpoint', () => {
    const preset = vi.fn(
      () => ['2024-02-29T10:00', '2024-03-01T18:00'] as [string, string],
    )
    const onChange = vi.fn()
    render(
      <DateTimeRangePicker
        defaultValue={['2024-02-29T09:30', '2024-03-01T17:00']}
        disabled={[true, false]}
        presets={[{ key: 'blocked', label: '变更两端', value: preset }]}
        onChange={onChange}
      />,
    )
    open('end')
    expect(preset).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '变更两端' }))
    expect(screen.getByRole('alert')).toHaveTextContent('快捷范围当前不可选')
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '清空结束日期时间' }))
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['2024-02-29T09:30', ''])
  })
  it('keeps controlled endpoints and months external, and locates a newly controlled endpoint', () => {
    const onEndpoint = vi.fn(),
      onMonth = vi.fn()
    const { rerender } = render(
      <DateTimeRangePicker
        value={['2024-02-29T09:30', '2024-12-01T17:00']}
        open
        activeEndpoint="start"
        onActiveEndpointChange={onEndpoint}
      />,
    )
    endpoint('end')
    expect(onEndpoint).toHaveBeenCalledWith('end')
    expect(screen.getByRole('grid')).toHaveAccessibleName(
      '开始日期时间日期，2024年2月',
    )
    rerender(
      <DateTimeRangePicker
        value={['2024-02-29T09:30', '2024-12-01T17:00']}
        open
        activeEndpoint="end"
      />,
    )
    expect(screen.getByRole('grid')).toHaveAccessibleName(
      '结束日期时间日期，2024年12月',
    )
    rerender(
      <DateTimeRangePicker
        value={['2024-02-29T09:30', '2024-12-01T17:00']}
        open
        activeEndpoint="end"
        panelMonth="2024-11"
        onPanelMonthChange={onMonth}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '下个月' }))
    expect(onMonth).toHaveBeenLastCalledWith('2024-12')
    expect(screen.getByRole('grid')).toHaveAccessibleName(
      '结束日期时间日期，2024年11月',
    )
  })
  it('shows range date semantics and recovers a disabled endpoint without stealing external focus', () => {
    const view = (disabled: boolean | [boolean, boolean] = false) => (
      <>
        <DateTimeRangePicker
          mode="panel"
          defaultValue={['2024-02-28T09:30', '2024-03-01T17:00']}
          disabled={disabled}
        />
        <button>外部焦点</button>
      </>
    )
    const { rerender } = render(view())
    expect(day('2024-02-28')).toHaveAccessibleName(/范围开始/)
    expect(day('2024-02-29')).toHaveAccessibleName(/范围内/)
    expect(day('2024-03-01')).toHaveAccessibleName(/范围结束/)
    act(() => day('2024-02-28').focus())
    rerender(view([true, false]))
    expect(day('2024-03-01')).toHaveFocus()
    act(() => screen.getByRole('button', { name: '外部焦点' }).focus())
    rerender(view(false))
    expect(screen.getByRole('button', { name: '外部焦点' })).toHaveFocus()
    act(() => day('2024-03-01').focus())
    rerender(view(true))
    expect(screen.getByRole('button', { name: '外部焦点' })).toHaveFocus()
  })
  it('normalizes native zero seconds, rejects subseconds and resets an external tuple form', async () => {
    const onChange = vi.fn()
    const { container } = render(
      <>
        <form id="external" />
        <DateTimeRangePicker
          mode="native"
          form="external"
          name="range"
          precision="second"
          defaultValue={['2024-02-29T23:30:15', '2024-03-01T00:30:15']}
          onChange={onChange}
        />
      </>,
    )
    const fields = container.querySelectorAll<HTMLInputElement>(
      'input[type="datetime-local"]',
    )
    fireEvent.change(fields[1], { target: { value: '2024-03-01T01:00' } })
    expect(onChange).toHaveBeenLastCalledWith([
      '2024-02-29T23:30:15',
      '2024-03-01T01:00:00',
    ])
    expect(new FormData(container.querySelector('form')!).get('range')).toBe(
      '["2024-02-29T23:30:15","2024-03-01T01:00:00"]',
    )
    fireEvent.change(fields[1], {
      target: { value: '2024-03-01T01:00:00.500' },
    })
    expect(onChange).toHaveBeenCalledOnce()
    act(() => container.querySelector('form')!.reset())
    await waitFor(() =>
      expect(fields[1].value.replace(/\.0+$/, '')).toBe('2024-03-01T00:30:15'),
    )
    expect(onChange).toHaveBeenCalledOnce()
  })
  it('cooperates with Form tuple validation and resets a confirmed range', async () => {
    const finish = vi.fn()
    render(
      <Form
        initialValues={{ range: ['2024-02-29T09:30', '2024-03-01T17:00'] }}
        validateOn="blur"
        onFinish={finish}
      >
        <FormItem
          name="range"
          label="范围预约"
          emptyValue={[]}
          rules={[
            {
              validator: (value) =>
                Array.isArray(value) && value[0] && value[1]
                  ? undefined
                  : '请选择完整范围',
            },
          ]}
          control={<DateTimeRangePicker />}
        />
        <button type="submit">提交</button>
        <button type="reset">重置</button>
      </Form>,
    )
    open('end')
    fireEvent.click(day('2024-03-02'))
    confirm()
    fireEvent.click(screen.getByRole('button', { name: '提交', exact: true }))
    await waitFor(() =>
      expect(finish).toHaveBeenCalledWith({
        range: ['2024-02-29T09:30', '2024-03-02T17:00'],
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: '重置', exact: true }))
    await waitFor(() => expect(field('end')).toHaveValue('2024-03-01 17:00'))
    fireEvent.click(screen.getByRole('button', { name: '清空结束日期时间' }))
    fireEvent.click(screen.getByRole('button', { name: '提交', exact: true }))
    await waitFor(() =>
      expect(screen.getByText('请选择完整范围')).toBeVisible(),
    )
  })
})
