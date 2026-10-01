import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfigProvider, Form, FormItem, TimeRangePicker } from '@/shared/ui'

const start = () => screen.getByLabelText('开始时间')
const end = () => screen.getByLabelText('结束时间')
const open = (part: 'start' | 'end' = 'start') =>
  fireEvent.keyDown(part === 'start' ? start() : end(), { key: 'ArrowDown' })
const option = (unit: string, value: number) =>
  document.querySelector<HTMLButtonElement>(
    '[data-time-unit="' + unit + '"][data-time-value="' + value + '"]',
  )!
const confirm = () =>
  fireEvent.click(screen.getByRole('button', { name: '确定', exact: true }))
const endpoint = () =>
  fireEvent.click(screen.getByRole('button', { name: /^结束时间：/ }))

describe('TimeRangePicker project time columns', () => {
  it('recovers the available endpoint after dynamic disabling without taking external focus', () => {
    const { rerender } = render(
      <>
        <TimeRangePicker mode="panel" defaultValue={['09:30', '17:00']} />
        <button>外部</button>
      </>,
    )
    act(() => option('hour', 9).focus())
    rerender(
      <>
        <TimeRangePicker
          mode="panel"
          defaultValue={['09:30', '17:00']}
          disabled={[true, false]}
        />
        <button>外部</button>
      </>,
    )
    expect(option('hour', 17)).toHaveFocus()
    act(() => screen.getByRole('button', { name: '外部' }).focus())
    rerender(
      <>
        <TimeRangePicker mode="panel" defaultValue={['09:30', '17:00']} />
        <button>外部</button>
      </>,
    )
    expect(screen.getByRole('button', { name: '外部' })).toHaveFocus()
  })
  it('retains both valid typed drafts while continuing to choose a time unit', () => {
    const onChange = vi.fn()
    render(
      <TimeRangePicker defaultValue={['09:30', '17:00']} onChange={onChange} />,
    )
    open()
    fireEvent.change(end(), { target: { value: '18:15' } })
    fireEvent.click(option('hour', 10))
    expect(end()).toHaveValue('18:15')
    confirm()
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['10:30', '18:15'])
  })
  it('waits for external active endpoint updates and exposes the requested endpoint', () => {
    const onActiveEndpointChange = vi.fn()
    const { rerender } = render(
      <TimeRangePicker
        mode="panel"
        defaultValue={['09:30', '17:00']}
        activeEndpoint="start"
        onActiveEndpointChange={onActiveEndpointChange}
      />,
    )
    endpoint()
    expect(onActiveEndpointChange).toHaveBeenCalledExactlyOnceWith('end')
    expect(
      screen.getByRole('listbox', { name: '开始时间小时' }),
    ).toBeInTheDocument()
    rerender(
      <TimeRangePicker
        mode="panel"
        defaultValue={['09:30', '17:00']}
        activeEndpoint="end"
        onActiveEndpointChange={onActiveEndpointChange}
      />,
    )
    expect(option('hour', 17)).toHaveFocus()
    expect(
      screen.getByRole('listbox', { name: '结束时间小时' }),
    ).toBeInTheDocument()
  })
  it('browses then confirms one tuple and keeps hidden submission separate from pending endpoints', () => {
    const onChange = vi.fn(),
      onCalendarChange = vi.fn(),
      onOk = vi.fn()
    const { container } = render(
      <form>
        <TimeRangePicker
          name="hours"
          defaultValue={['09:30', '17:00']}
          minuteStep={15}
          onChange={onChange}
          onCalendarChange={onCalendarChange}
          onOk={onOk}
        />
      </form>,
    )
    open()
    expect(option('hour', 9)).toHaveFocus()
    fireEvent.keyDown(option('hour', 9), { key: 'ArrowDown' })
    expect(option('hour', 10)).toHaveFocus()
    expect(onCalendarChange).not.toHaveBeenCalled()
    fireEvent.click(option('hour', 10))
    expect(start()).toHaveValue('10:30')
    expect(onCalendarChange).toHaveBeenLastCalledWith(['10:30', '17:00'], {
      endpoint: 'start',
    })
    expect(onChange).not.toHaveBeenCalled()
    expect(new FormData(container.querySelector('form')!).get('hours')).toBe(
      '["09:30","17:00"]',
    )
    expect(container.querySelector('form')!.checkValidity()).toBe(false)
    endpoint()
    expect(option('hour', 17)).toHaveFocus()
    fireEvent.click(option('hour', 18))
    fireEvent.click(option('minute', 45))
    confirm()
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['10:30', '18:45'])
    expect(onOk).toHaveBeenCalledExactlyOnceWith(['10:30', '18:45'])
    expect(end()).toHaveFocus()
    expect(new FormData(container.querySelector('form')!).get('hours')).toBe(
      '["10:30","18:45"]',
    )
  })
  it('clears the other editable endpoint on crossing but never changes a locked endpoint', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <TimeRangePicker defaultValue={['09:30', '17:00']} onChange={onChange} />,
    )
    open()
    fireEvent.click(option('hour', 18))
    expect(end()).toHaveValue('')
    expect(
      screen.getByRole('button', { name: '确定', exact: true }),
    ).toBeDisabled()
    endpoint()
    fireEvent.click(option('hour', 19))
    confirm()
    expect(onChange).toHaveBeenLastCalledWith(['18:30', '19:30'])
    rerender(
      <TimeRangePicker
        value={['10:00', '12:00']}
        disabled={[true, false]}
        order="sort"
        onChange={onChange}
      />,
    )
    expect(start()).toBeDisabled()
    open('end')
    expect(option('hour', 9)).toBeDisabled()
    expect(
      screen.getByRole('button', { name: '开始时间：10:00' }),
    ).toBeDisabled()
    fireEvent.click(option('hour', 13))
    confirm()
    expect(onChange).toHaveBeenLastCalledWith(['10:00', '13:00'])
  })
  it('sorts at explicit submission while pending endpoints keep their identity', () => {
    const onChange = vi.fn(),
      onCalendarChange = vi.fn()
    render(
      <TimeRangePicker
        defaultValue={['09:30', '17:00']}
        order="sort"
        onChange={onChange}
        onCalendarChange={onCalendarChange}
      />,
    )
    open()
    fireEvent.click(option('hour', 18))
    expect(start()).toHaveValue('18:30')
    expect(end()).toHaveValue('17:00')
    expect(onCalendarChange).toHaveBeenLastCalledWith(['18:30', '17:00'], {
      endpoint: 'start',
    })
    confirm()
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['17:00', '18:30'])
  })
  it('checks endpoint-aware hour, minute, second and from predicates on every selection', () => {
    const disabledTime = vi.fn(
      (time: string, info: { endpoint: string; from?: string }) =>
        info.endpoint === 'end' && Boolean(info.from && time < info.from),
    )
    render(
      <TimeRangePicker
        defaultValue={['09:30:15', '10:30:15']}
        secondStep={15}
        disabledHours={({ endpoint }) => (endpoint === 'end' ? [11] : [])}
        disabledMinutes={(hour, { endpoint }) =>
          endpoint === 'end' && hour === 10 ? [45] : []
        }
        disabledSeconds={(hour, minute, { endpoint }) =>
          endpoint === 'end' && hour === 10 && minute === 30 ? [30] : []
        }
        disabledTime={disabledTime}
      />,
    )
    open('end')
    expect(option('hour', 8)).toBeDisabled()
    expect(option('hour', 11)).toBeDisabled()
    expect(option('minute', 45)).toBeDisabled()
    expect(option('second', 30)).toBeDisabled()
    expect(disabledTime).toHaveBeenCalledWith('10:30:15', {
      endpoint: 'end',
      from: '09:30:15',
    })
    fireEvent.keyDown(option('hour', 10), { key: 'ArrowRight' })
    fireEvent.keyDown(option('minute', 30), { key: 'ArrowRight' })
    fireEvent.keyDown(option('second', 15), { key: 'ArrowDown' })
    expect(option('second', 45)).toHaveFocus()
  })
  it('maps both AM/PM displays to canonical 24-hour values and handles RTL keys', () => {
    const onChange = vi.fn()
    render(
      <ConfigProvider direction="rtl">
        <TimeRangePicker
          defaultValue={['00:30', '13:30']}
          use12Hours
          onChange={onChange}
        />
      </ConfigProvider>,
    )
    open()
    fireEvent.keyDown(option('hour', 0), { key: 'ArrowLeft' })
    expect(option('minute', 30)).toHaveFocus()
    fireEvent.click(option('meridiem', 1))
    expect(start()).toHaveValue('12:30 PM')
    expect(end()).toHaveValue('01:30 PM')
    confirm()
    expect(onChange).toHaveBeenCalledWith(['12:30', '13:30'])
    fireEvent.change(end(), { target: { value: '02:45 PM' } })
    fireEvent.keyDown(end(), { key: 'Enter' })
    expect(onChange).toHaveBeenLastCalledWith(['12:30', '14:45'])
  })
  it('keeps shortcuts pending, evaluates dynamic shortcuts at click and rejects newly blocked ranges', () => {
    const dynamic = vi.fn((): [string, string] => ['14:30', '16:00']),
      onChange = vi.fn()
    const { rerender } = render(
      <TimeRangePicker
        defaultValue={['09:30', '17:00']}
        presets={[{ key: 'next', label: '快捷', value: dynamic }]}
        onChange={onChange}
      />,
    )
    open()
    expect(dynamic).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '快捷', exact: true }))
    expect(start()).toHaveValue('14:30')
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.keyDown(
      screen.getByRole('button', { name: '快捷', exact: true }),
      { key: 'Escape' },
    )
    expect(start()).toHaveValue('09:30')
    rerender(
      <TimeRangePicker
        defaultValue={['09:30', '17:00']}
        disabledTime={(time) => time === '14:30'}
        presets={[{ key: 'next', label: '快捷', value: dynamic }]}
        onChange={onChange}
      />,
    )
    open()
    fireEvent.click(screen.getByRole('button', { name: '快捷', exact: true }))
    expect(screen.getByRole('alert')).toHaveTextContent('快捷范围当前不可选')
    expect(onChange).not.toHaveBeenCalled()
  })
  it('supports immediate complete selection but cancels an incomplete crossing on blur', () => {
    const onChange = vi.fn(),
      onBlur = vi.fn()
    render(
      <>
        <TimeRangePicker
          defaultValue={['09:30', '17:00']}
          needConfirm={false}
          onChange={onChange}
          onBlur={onBlur}
        />
        <button>外部</button>
      </>,
    )
    open()
    fireEvent.click(option('hour', 10))
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['10:30', '17:00'])
    fireEvent.click(option('hour', 18))
    expect(end()).toHaveValue('')
    expect(onChange).toHaveBeenCalledTimes(1)
    act(() => screen.getByRole('button', { name: '外部' }).focus())
    expect(start()).toHaveValue('10:30')
    expect(end()).toHaveValue('17:00')
    expect(onBlur).toHaveBeenCalledTimes(1)
  })
  it('supports explicitly open intervals and refuses an entirely empty confirmation', () => {
    const onChange = vi.fn()
    render(
      <TimeRangePicker
        defaultValue={['09:30', '']}
        allowEmpty={[false, true]}
        onChange={onChange}
      />,
    )
    open()
    fireEvent.click(option('hour', 10))
    confirm()
    expect(onChange).toHaveBeenCalledWith(['10:30', ''])
    fireEvent.click(screen.getByRole('button', { name: '清空开始时间' }))
    open()
    expect(
      screen.getByRole('button', { name: '确定', exact: true }),
    ).toBeDisabled()
  })
  it('clears one endpoint immediately and treats explicit undefined as a controlled empty range', () => {
    const onChange = vi.fn(),
      onClear = vi.fn()
    const { rerender } = render(
      <TimeRangePicker
        value={['09:30', '17:00']}
        onChange={onChange}
        onClear={onClear}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '清空结束时间' }))
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['09:30', ''])
    expect(onClear).toHaveBeenCalledOnce()
    expect(end()).toHaveValue('17:00')
    rerender(
      <TimeRangePicker
        value={undefined}
        defaultValue={['09:30', '17:00']}
        onChange={onChange}
      />,
    )
    expect(start()).toHaveValue('')
    expect(end()).toHaveValue('')
  })
  it('rejects malformed, out-of-bound and off-step input then confirms a complete legal draft', () => {
    const onChange = vi.fn()
    render(
      <>
        <TimeRangePicker
          defaultValue={['09:30', '17:00']}
          min="09:00"
          max="18:00"
          minuteStep={15}
          onChange={onChange}
        />
        <button>外部</button>
      </>,
    )
    for (const time of ['25:00', '08:00', '10:10']) {
      fireEvent.change(start(), { target: { value: time } })
      fireEvent.keyDown(start(), { key: 'Enter' })
      expect(screen.getByRole('alert')).toHaveTextContent('HH:mm')
    }
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.blur(start(), {
      relatedTarget: screen.getByRole('button', { name: '外部' }),
    })
    expect(start()).toHaveValue('09:30')
    fireEvent.change(start(), { target: { value: '10:45' } })
    fireEvent.keyDown(start(), { key: 'Enter' })
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['10:45', '17:00'])
  })
  it('discards panel and input drafts after controlled external close', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <TimeRangePicker
        open
        defaultValue={['09:30', '17:00']}
        onChange={onChange}
      />,
    )
    fireEvent.click(option('hour', 10))
    fireEvent.change(end(), { target: { value: '18:00' } })
    rerender(
      <TimeRangePicker
        open={false}
        defaultValue={['09:30', '17:00']}
        onChange={onChange}
      />,
    )
    expect(start()).toHaveValue('09:30')
    expect(end()).toHaveValue('17:00')
    expect(onChange).not.toHaveBeenCalled()
  })
  it('returns reverse Tab to the active input and cancels on forward Tab to field actions', () => {
    render(<TimeRangePicker defaultValue={['09:30', '17:00']} />)
    open('end')
    const first = screen.getByRole('button', { name: '开始时间：09:30' })
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })
    expect(end()).toHaveFocus()
    fireEvent.click(option('hour', 18))
    fireEvent.keyDown(
      screen.getByRole('button', { name: '确定', exact: true }),
      { key: 'Tab' },
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(end()).toHaveValue('17:00')
    expect(screen.getByRole('button', { name: '清空结束时间' })).toHaveFocus()
  })
  it('keeps readonly values visible and does not allow operations on either endpoint', () => {
    render(
      <TimeRangePicker
        mode="panel"
        readOnly
        defaultValue={['09:30', '17:00']}
      />,
    )
    expect(start()).toHaveAttribute('readonly')
    expect(
      screen.queryByRole('button', { name: '清空开始时间' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '确定', exact: true }),
    ).toBeDisabled()
    expect(option('hour', 9)).toBeDisabled()
  })
  it('uses defaultOpenValue only for browsing and hides disabled options', () => {
    const onChange = vi.fn()
    render(
      <TimeRangePicker
        defaultOpenValue={['09:30', '17:00']}
        disabledHours={() => [11]}
        hideDisabledOptions
        onChange={onChange}
      />,
    )
    open()
    expect(option('hour', 11)).toBeNull()
    fireEvent.click(option('hour', 10))
    expect(start()).toHaveValue('10:30')
    expect(end()).toHaveValue('')
    expect(onChange).not.toHaveBeenCalled()
  })
  it('associates native reset and confirmed JSON fields with an external form', () => {
    const onChange = vi.fn()
    const { container } = render(
      <>
        <form id="hours">
          <button type="reset">重置</button>
        </form>
        <TimeRangePicker
          form="hours"
          name="range"
          defaultValue={['09:30', '17:00']}
          onChange={onChange}
        />
      </>,
    )
    open()
    fireEvent.click(option('hour', 10))
    confirm()
    expect(new FormData(container.querySelector('form')!).get('range')).toBe(
      '["10:30","17:00"]',
    )
    fireEvent.click(screen.getByRole('button', { name: '重置' }))
    expect(start()).toHaveValue('09:30')
    expect(new FormData(container.querySelector('form')!).get('range')).toBe(
      '["09:30","17:00"]',
    )
    expect(onChange).toHaveBeenCalledTimes(1)
  })
  it('validates on combined blur, commits one tuple to Form and restores initial values', async () => {
    const onFinish = vi.fn()
    render(
      <Form
        validateOn="blur"
        initialValues={{ hours: ['09:30', '17:00'] }}
        onFinish={onFinish}
      >
        <FormItem
          name="hours"
          label="营业时段"
          emptyValue={[]}
          rules={[
            {
              validator: (value) =>
                Array.isArray(value) &&
                value.length === 2 &&
                value.every(Boolean)
                  ? undefined
                  : '请选择完整时间',
            },
          ]}
          control={<TimeRangePicker inputReadOnly />}
        />
        <button type="submit">保存</button>
        <button type="reset">重置</button>
      </Form>,
    )
    fireEvent.click(screen.getByRole('button', { name: '清空开始时间' }))
    open()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    fireEvent.click(option('hour', 10))
    confirm()
    fireEvent.click(screen.getByRole('button', { name: '保存' }))
    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith({ hours: ['10:00', '17:00'] }),
    )
    fireEvent.click(screen.getByRole('button', { name: '重置' }))
    expect(start()).toHaveValue('09:30')
  })
})
