import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfigProvider, Form, FormItem, TimePicker } from '@/shared/ui'
import {
  parseTime,
  timeDisplay,
  timeInput,
  timeSelectable,
  timeUnitValue,
} from '@/shared/ui/time-picker-state'

const option = (unit: string, value: number) =>
  document.querySelector<HTMLButtonElement>(
    '[data-time-unit="' + unit + '"][data-time-value="' + value + '"]',
  )!
const input = () => screen.getByRole('combobox')
const open = () => fireEvent.keyDown(input(), { key: 'ArrowDown' })

describe('local time values and unit constraints', () => {
  it.each([
    '24:00',
    '12:60',
    '12:30:60',
    '1:30',
    '12:3',
    '12:30:00.5',
    '12:30Z',
  ])('rejects invalid or nonlocal time %s', (value) =>
    expect(parseTime(value)).toBeUndefined(),
  )
  it('maps midnight and noon between display and a canonical 24-hour value', () => {
    expect(timeDisplay('00:30', 'minute', true)).toBe('12:30 AM')
    expect(timeDisplay('12:30', 'minute', true)).toBe('12:30 PM')
    expect(timeInput('12:30 AM', 'minute', true)).toBe('00:30')
    expect(timeInput('12:30 PM', 'minute', true)).toBe('12:30')
    expect(timeInput('01:30:45 pm', 'second', true)).toBe('13:30:45')
    expect(timeInput('00:30 AM', 'minute', true)).toBeUndefined()
    expect(timeInput('13:30 PM', 'minute', true)).toBeUndefined()
    expect(timeInput('09:30:00', 'minute')).toBeUndefined()
  })
  it('validates wrapped bounds and step and finds a selectable lower-unit completion', () => {
    expect(
      timeSelectable('00:15', {
        precision: 'minute',
        min: '23:30',
        max: '01:00',
        step: 900,
      }),
    ).toBe(true)
    expect(
      timeSelectable('12:00', {
        precision: 'minute',
        min: '23:30',
        max: '01:00',
      }),
    ).toBe(false)
    expect(
      timeSelectable('00:17', {
        precision: 'minute',
        min: '23:30',
        max: '01:00',
        step: 900,
      }),
    ).toBe(false)
    const constraints = {
      precision: 'minute' as const,
      min: '09:30',
      max: '17:00',
      minuteStep: 15,
      disabledMinutes: (hour: number) => (hour === 10 ? [30] : []),
    }
    expect(timeUnitValue([9, 30, 0], 'hour', 10, constraints)).toBe('10:15')
    expect(timeUnitValue([9, 30, 0], 'hour', 8, constraints)).toBeUndefined()
    expect(timeUnitValue([9, 30, 0], 'hour', 17, constraints)).toBe('17:00')
  })
})

describe('TimePicker project panel', () => {
  it('allows an empty optional input and recovers internal focus when every option disappears without stealing external focus', () => {
    const { rerender } = render(
      <>
        <TimePicker
          mode="panel"
          defaultValue="09:30"
          hideDisabledOptions
          showNow={false}
        />
        <button>外部</button>
      </>,
    )
    act(() => option('hour', 9).focus())
    rerender(
      <>
        <TimePicker
          mode="panel"
          defaultValue="09:30"
          hideDisabledOptions
          showNow={false}
          disabledTime={() => true}
        />
        <button>外部</button>
      </>,
    )
    expect(
      screen.getByRole('button', { name: '取消', exact: true }),
    ).toHaveFocus()
    act(() => screen.getByRole('button', { name: '外部' }).focus())
    rerender(
      <>
        <TimePicker
          mode="panel"
          defaultValue="09:30"
          hideDisabledOptions
          showNow={false}
          disabledTime={() => true}
        />
        <button>外部</button>
      </>,
    )
    expect(screen.getByRole('button', { name: '外部' })).toHaveFocus()
    rerender(
      <form>
        <TimePicker needConfirm={false} />
      </form>,
    )
    const field = input()
    fireEvent.change(field, { target: { value: '10:00' } })
    fireEvent.change(field, { target: { value: '' } })
    expect(field).not.toHaveAttribute('aria-invalid', 'true')
    expect(field).toBeValid()
  })
  it('keeps keyboard focus separate from pending and submitted time and confirms one local value', () => {
    const onChange = vi.fn(),
      onOk = vi.fn()
    const { container } = render(
      <form>
        <TimePicker
          name="time"
          defaultValue="09:30"
          minuteStep={15}
          onChange={onChange}
          onOk={onOk}
        />
      </form>,
    )
    open()
    expect(option('hour', 9)).toHaveFocus()
    fireEvent.keyDown(option('hour', 9), { key: 'ArrowDown' })
    expect(option('hour', 10)).toHaveFocus()
    expect(input()).toHaveValue('09:30')
    fireEvent.click(option('hour', 10))
    expect(input()).toHaveValue('10:30')
    expect(onChange).not.toHaveBeenCalled()
    expect(new FormData(container.querySelector('form')!).get('time')).toBe(
      '09:30',
    )
    expect(container.querySelector('form')!.checkValidity()).toBe(false)
    fireEvent.click(option('minute', 45))
    fireEvent.click(screen.getByRole('button', { name: '确定', exact: true }))
    expect(onChange).toHaveBeenCalledExactlyOnceWith('10:45')
    expect(onOk).toHaveBeenCalledExactlyOnceWith('10:45')
    expect(input()).toHaveFocus()
    expect(new FormData(container.querySelector('form')!).get('time')).toBe(
      '10:45',
    )
  })
  it('handles seconds, unit descriptions, cross-column RTL and paging without choosing', () => {
    const onChange = vi.fn()
    render(
      <ConfigProvider direction="rtl">
        <TimePicker
          precision="second"
          defaultValue="09:30:15"
          secondStep={15}
          showNow={false}
          onChange={onChange}
          renderCell={(number, unit) =>
            number === 30 && unit === 'second' ? <span>窗口</span> : null
          }
          getCellDescription={(number, unit) =>
            number === 30 && unit === 'second' ? '媒体时间点' : undefined
          }
        />
      </ConfigProvider>,
    )
    open()
    fireEvent.keyDown(option('hour', 9), { key: 'ArrowLeft' })
    expect(option('minute', 30)).toHaveFocus()
    fireEvent.keyDown(option('minute', 30), { key: 'ArrowLeft' })
    expect(option('second', 15)).toHaveFocus()
    fireEvent.keyDown(option('second', 15), { key: 'End' })
    expect(option('second', 45)).toHaveFocus()
    fireEvent.keyDown(option('second', 45), { key: 'Home' })
    expect(option('second', 0)).toHaveFocus()
    expect(onChange).not.toHaveBeenCalled()
    expect(option('second', 30)).toHaveAccessibleName('30秒，媒体时间点')
    expect(option('second', 30)).toHaveTextContent('窗口')
    fireEvent.click(option('second', 30))
    fireEvent.click(screen.getByRole('button', { name: '确定', exact: true }))
    expect(onChange).toHaveBeenCalledExactlyOnceWith('09:30:30')
  })
  it('retains a 24-hour API when the panel and typed input use AM/PM', () => {
    const onChange = vi.fn()
    render(<TimePicker use12Hours defaultValue="00:30" onChange={onChange} />)
    expect(input()).toHaveValue('12:30 AM')
    open()
    expect(option('hour', 0)).toHaveAccessibleName('12小时')
    fireEvent.click(option('meridiem', 1))
    expect(input()).toHaveValue('12:30 PM')
    fireEvent.click(screen.getByRole('button', { name: '确定', exact: true }))
    expect(onChange).toHaveBeenLastCalledWith('12:30')
    fireEvent.change(input(), { target: { value: '01:45 PM' } })
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(onChange).toHaveBeenLastCalledWith('13:45')
  })
  it('repairs lower units when hours change and hides disabled choices while skipping them by keyboard', () => {
    const onChange = vi.fn()
    render(
      <TimePicker
        defaultValue="09:30"
        min="09:00"
        max="12:00"
        minuteStep={15}
        disabledHours={() => [11]}
        disabledMinutes={(hour) => (hour === 10 ? [30] : [])}
        hideDisabledOptions
        onChange={onChange}
      />,
    )
    open()
    expect(option('hour', 8)).toBeNull()
    expect(option('hour', 11)).toBeNull()
    fireEvent.click(option('hour', 10))
    expect(input()).toHaveValue('10:15')
    expect(option('minute', 30)).toBeNull()
    fireEvent.keyDown(option('hour', 10), { key: 'ArrowDown' })
    expect(option('hour', 12)).toHaveFocus()
    expect(onChange).not.toHaveBeenCalled()
  })
  it('protects conditional seconds and rejects stale dynamic shortcuts and off-step input', () => {
    const onChange = vi.fn(),
      preset = vi.fn(() => '09:30:15')
    render(
      <TimePicker
        precision="second"
        defaultValue="09:30:00"
        min="09:00:00"
        max="10:00:00"
        step={30}
        disabledSeconds={(hour, minute) =>
          hour === 9 && minute === 30 ? [30] : []
        }
        presets={[{ key: 'dynamic', label: '实时推荐', value: preset }]}
        onChange={onChange}
      />,
    )
    expect(preset).not.toHaveBeenCalled()
    open()
    expect(option('second', 15)).toBeDisabled()
    expect(option('second', 30)).toBeDisabled()
    fireEvent.click(
      screen.getByRole('button', { name: '实时推荐', exact: true }),
    )
    expect(preset).toHaveBeenCalledOnce()
    expect(screen.getByRole('alert')).toHaveTextContent('快捷时间当前不可选')
    fireEvent.keyDown(option('hour', 9), { key: 'Escape' })
    fireEvent.change(input(), { target: { value: '09:30:15' } })
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(screen.getByRole('alert')).toHaveTextContent('HH:mm:ss')
    fireEvent.keyDown(input(), { key: 'Escape' })
    expect(input()).toHaveValue('09:30:00')
    expect(onChange).not.toHaveBeenCalled()
  })
  it('commits immediate-mode column choices and restores invalid input on composite blur', () => {
    const onChange = vi.fn(),
      onBlur = vi.fn()
    render(
      <>
        <TimePicker
          defaultValue="09:30"
          needConfirm={false}
          onChange={onChange}
          onBlur={onBlur}
        />
        <button>离开</button>
      </>,
    )
    open()
    fireEvent.click(option('hour', 10))
    expect(onChange).toHaveBeenLastCalledWith('10:30')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.blur(input(), { relatedTarget: option('minute', 30) })
    expect(onBlur).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '完成', exact: true }))
    fireEvent.change(input(), { target: { value: '99:99' } })
    fireEvent.blur(input(), {
      relatedTarget: screen.getByRole('button', { name: '离开' }),
    })
    expect(input()).toHaveValue('10:30')
    expect(screen.getByRole('alert')).toHaveTextContent('已恢复原时间')
    expect(onChange).toHaveBeenCalledTimes(1)
  })
  it('cancels pending choices on Escape, external focus, reset and external close', () => {
    const onChange = vi.fn()
    const { container, rerender } = render(
      <form>
        <TimePicker defaultValue="09:30" onChange={onChange} />
        <button type="button">外部</button>
      </form>,
    )
    open()
    fireEvent.click(option('hour', 10))
    fireEvent.keyDown(option('hour', 10), { key: 'Escape' })
    expect(input()).toHaveValue('09:30')
    open()
    fireEvent.click(option('hour', 10))
    act(() => screen.getByRole('button', { name: '外部' }).focus())
    expect(input()).toHaveValue('09:30')
    open()
    fireEvent.click(option('hour', 10))
    fireEvent.reset(container.querySelector('form')!)
    expect(input()).toHaveValue('09:30')
    rerender(<TimePicker defaultValue="09:30" open onChange={onChange} />)
    fireEvent.change(input(), { target: { value: '10:15' } })
    rerender(
      <TimePicker defaultValue="09:30" open={false} onChange={onChange} />,
    )
    expect(input()).toHaveValue('09:30')
    expect(onChange).not.toHaveBeenCalled()
  })
  it('keeps controlled emptiness authoritative, restores lost internal focus and protects readonly panels', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <TimePicker
        value={undefined}
        defaultValue="09:30"
        onChange={onChange}
        defaultOpenValue="10:00"
      />,
    )
    expect(input()).toHaveValue('')
    open()
    fireEvent.click(option('hour', 10))
    fireEvent.click(screen.getByRole('button', { name: '确定', exact: true }))
    expect(onChange).toHaveBeenCalledExactlyOnceWith('10:00')
    expect(input()).toHaveValue('')
    rerender(
      <TimePicker defaultValue="09:30" mode="panel" disabledHours={() => []} />,
    )
    act(() => option('hour', 9).focus())
    rerender(
      <TimePicker
        defaultValue="09:30"
        mode="panel"
        disabledHours={() => [9]}
      />,
    )
    expect(option('hour', 9)).toBeDisabled()
    expect(option('hour', 0)).toHaveFocus()
    rerender(<TimePicker defaultValue="09:30" mode="panel" readOnly />)
    expect(option('hour', 10)).toBeDisabled()
  })
  it('preserves the first-column reverse Tab session and cancels a footer Tab with focus restoration', () => {
    render(
      <>
        <TimePicker defaultValue="09:30" showNow={false} />
        <button>之后</button>
      </>,
    )
    open()
    fireEvent.click(option('hour', 10))
    act(() => option('hour', 10).focus())
    fireEvent.keyDown(option('hour', 10), { key: 'Tab', shiftKey: true })
    expect(input()).toHaveFocus()
    expect(input()).toHaveValue('10:30')
    const confirm = screen.getByRole('button', { name: '确定', exact: true })
    act(() => confirm.focus())
    fireEvent.keyDown(confirm, { key: 'Tab' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '清空时间' })).toHaveFocus()
    expect(input()).toHaveValue('09:30')
  })
  it('evaluates the now shortcut at click time and uses the same availability contract', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2024, 1, 29, 9, 30, 15))
    try {
      render(<TimePicker defaultValue="08:00" min="09:00" max="10:00" />)
      open()
      fireEvent.click(screen.getByRole('button', { name: '此刻', exact: true }))
      expect(input()).toHaveValue('09:30')
      vi.setSystemTime(new Date(2024, 1, 29, 11, 0))
      fireEvent.click(screen.getByRole('button', { name: '此刻', exact: true }))
      expect(screen.getByRole('alert')).toHaveTextContent('当前时间不可选')
      expect(input()).toHaveValue('09:30')
    } finally {
      vi.useRealTimers()
    }
  })
  it('keeps native precision, errors, form association and reset as an explicit adapter', () => {
    const onChange = vi.fn()
    const { container } = render(
      <>
        <form id="clock-form" />
        <TimePicker
          mode="native"
          precision="second"
          name="time"
          form="clock-form"
          defaultValue="09:30:15"
          step={15}
          onChange={onChange}
        />
      </>,
    )
    const native = screen.getByLabelText('时间')
    expect(native).toHaveAttribute('type', 'time')
    fireEvent.change(native, { target: { value: '10:30:30' } })
    expect(onChange).toHaveBeenCalledExactlyOnceWith('10:30:30')
    expect(new FormData(container.querySelector('form')!).get('time')).toBe(
      '10:30:30',
    )
    fireEvent.reset(container.querySelector('form')!)
    expect(native).toHaveValue('09:30:15')
  })
  it('works with project Form blur validation, confirmation and reset', async () => {
    const onFinish = vi.fn()
    render(
      <Form
        initialValues={{ time: '09:30' }}
        validateOn="blur"
        onFinish={onFinish}
      >
        <FormItem
          name="time"
          label="预约时间"
          emptyValue=""
          rules={[{ required: true, message: '请选择预约时间' }]}
          control={<TimePicker label="预约时间" />}
        />
        <button type="submit">提交</button>
        <button type="reset">重置</button>
      </Form>,
    )
    fireEvent.click(screen.getByRole('button', { name: '清空预约时间' }))
    open()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    fireEvent.click(option('hour', 10))
    fireEvent.click(screen.getByRole('button', { name: '确定', exact: true }))
    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledExactlyOnceWith({ time: '10:00' }),
    )
    fireEvent.click(screen.getByRole('button', { name: '重置' }))
    expect(input()).toHaveValue('09:30')
  })
})
