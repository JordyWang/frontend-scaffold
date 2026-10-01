import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfigProvider, Form, FormItem, TimeRangePicker } from '@/shared/ui'

describe('TimeRangePicker', () => {
  it('keeps a same-day interval ordered and submits one range value', () => {
    const onChange = vi.fn()
    const { container } = render(
      <form>
        <TimeRangePicker
          mode="native"
          label="工作时间"
          name="hours"
          defaultValue={['09:00', '17:00']}
          min="08:00"
          max="20:00"
          step={60}
          onChange={onChange}
        />
      </form>,
    )
    const start = screen.getByLabelText('开始时间')
    const end = screen.getByLabelText('结束时间')
    expect(start).toHaveAttribute('type', 'time')
    expect(start).toHaveAttribute('step', '60')
    expect(end).toHaveAttribute('min', '08:00')
    expect(end).toHaveAttribute('max', '20:00')
    fireEvent.change(start, { target: { value: '18:00' } })
    expect(onChange).toHaveBeenLastCalledWith(['18:00', ''])
    fireEvent.change(end, { target: { value: '19:30' } })
    expect(onChange).toHaveBeenLastCalledWith(['18:00', '19:30'])
    fireEvent.change(end, { target: { value: '07:30' } })
    expect(onChange).toHaveBeenCalledTimes(2)
    expect(end).toHaveValue('19:30')
    fireEvent.change(end, { target: { value: '08:30' } })
    expect(onChange).toHaveBeenLastCalledWith(['', '08:30'])
    expect(new FormData(container.querySelector('form')!).get('hours')).toBe(
      '["","08:30"]',
    )
  })

  it('compares hour, minute and second values numerically', () => {
    const onChange = vi.fn()
    render(
      <TimeRangePicker
        mode="native"
        defaultValue={['09:30', '09:30:00']}
        step={1}
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByLabelText('开始时间'), {
      target: { value: '09:30:01' },
    })
    expect(onChange).toHaveBeenCalledWith(['09:30:01', ''])
  })

  it('respects controlled values, RTL and disabled semantics', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <ConfigProvider direction="rtl">
        <TimeRangePicker
          mode="native"
          label="会议时间"
          value={['10:00', '11:00']}
          onChange={onChange}
        />
      </ConfigProvider>,
    )
    const group = screen.getByRole('group', { name: '会议时间' })
    const start = screen.getByLabelText('开始时间')
    expect(group).toHaveAttribute('dir', 'rtl')
    fireEvent.change(start, { target: { value: '10:30' } })
    expect(onChange).toHaveBeenCalledWith(['10:30', '11:00'])
    expect(start).toHaveValue('10:00')
    rerender(
      <ConfigProvider direction="rtl">
        <TimeRangePicker
          mode="native"
          value={['10:30', '11:00']}
          onChange={onChange}
          disabled
        />
      </ConfigProvider>,
    )
    expect(start).toHaveValue('10:30')
    expect(start).toBeDisabled()
    expect(screen.getByLabelText('结束时间')).toBeDisabled()
  })

  it('validates complete intervals through FormItem', async () => {
    const onFinish = vi.fn()
    render(
      <Form onFinish={onFinish}>
        <FormItem
          name="hours"
          label="营业时间"
          emptyValue={[]}
          rules={[
            { required: true, message: '请选择时间' },
            {
              validator: (value) =>
                Array.isArray(value) &&
                value.length === 2 &&
                value.every(Boolean)
                  ? undefined
                  : '请选择完整时间',
            },
          ]}
          control={<TimeRangePicker mode="native" />}
        />
        <button type="submit">保存</button>
      </Form>,
    )
    fireEvent.click(screen.getByRole('button', { name: '保存' }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('请选择时间'),
    )
    fireEvent.change(screen.getByLabelText(/开始时间/), {
      target: { value: '09:00' },
    })
    fireEvent.click(screen.getByRole('button', { name: '保存' }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('请选择完整时间'),
    )
    fireEvent.change(screen.getByLabelText('结束时间'), {
      target: { value: '17:00' },
    })
    fireEvent.click(screen.getByRole('button', { name: '保存' }))
    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith({ hours: ['09:00', '17:00'] }),
    )
  })
})
