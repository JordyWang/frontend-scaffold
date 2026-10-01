import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  ConfigProvider,
  DateRangePicker,
  Form,
  FormField,
  FormItem,
} from '@/shared/ui'

describe('DateRangePicker native adapter', () => {
  it('emits ordered ranges and clears the opposite endpoint when dates cross', () => {
    const onChange = vi.fn()
    const { container } = render(
      <form>
        <DateRangePicker
          mode="native"
          label="行程日期"
          name="trip"
          defaultValue={['2026-10-01', '2026-10-05']}
          onChange={onChange}
        />
      </form>,
    )
    const start = screen.getByLabelText('开始日期')
    const end = screen.getByLabelText('结束日期')
    expect(start).toHaveValue('2026-10-01')
    expect(end).toHaveValue('2026-10-05')

    fireEvent.change(start, { target: { value: '2026-10-07' } })
    expect(onChange).toHaveBeenLastCalledWith(['2026-10-07', ''])
    expect(end).toHaveValue('')
    fireEvent.change(end, { target: { value: '2026-10-09' } })
    expect(onChange).toHaveBeenLastCalledWith(['2026-10-07', '2026-10-09'])
    fireEvent.change(end, { target: { value: '2026-09-30' } })
    expect(onChange).toHaveBeenLastCalledWith(['', '2026-09-30'])
    expect(start).toHaveValue('')
    expect(new FormData(container.querySelector('form')!).get('trip')).toBe(
      '["","2026-09-30"]',
    )
  })

  it('keeps a controlled value until the owner changes it', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <DateRangePicker
        mode="native"
        value={['2026-10-01', '2026-10-05']}
        onChange={onChange}
      />,
    )
    const start = screen.getByLabelText('开始日期')
    fireEvent.change(start, { target: { value: '2026-10-03' } })
    expect(onChange).toHaveBeenCalledWith(['2026-10-03', '2026-10-05'])
    expect(start).toHaveValue('2026-10-01')
    rerender(
      <DateRangePicker
        mode="native"
        value={['2026-10-03', '2026-10-05']}
        onChange={onChange}
      />,
    )
    expect(start).toHaveValue('2026-10-03')
  })

  it('exposes labels, errors, bounds, size and native required validation', () => {
    const startRef = vi.fn()
    const { container } = render(
      <ConfigProvider componentSize="large" direction="rtl">
        <form>
          <FormField
            label="预约日期"
            required
            error="请选择完整日期"
            control={
              <DateRangePicker
                mode="native"
                ref={startRef}
                label="预约日期"
                min="2026-10-01"
                max="2026-12-31"
              />
            }
          />
        </form>
      </ConfigProvider>,
    )
    const group = screen.getByRole('group', { name: '预约日期' })
    const start = screen.getByLabelText(/开始日期/)
    const end = screen.getByLabelText('结束日期')
    expect(group).toHaveAttribute('dir', 'rtl')
    expect(group).toHaveAttribute('aria-invalid', 'true')
    expect(group).toHaveAttribute('aria-required', 'true')
    expect(start).toHaveAttribute('min', '2026-10-01')
    expect(end).toHaveAttribute('max', '2026-12-31')
    expect(start).toHaveClass('min-h-12')
    expect(start).toBeRequired()
    expect(end).toBeRequired()
    expect(container.querySelector('form')!.checkValidity()).toBe(false)
    expect(startRef).toHaveBeenCalledWith(start)
    expect(screen.getByRole('alert')).toHaveTextContent('请选择完整日期')
  })

  it('works as one array value in the project Form', async () => {
    const onFinish = vi.fn()
    render(
      <Form onFinish={onFinish}>
        <FormItem
          name="period"
          label="查询日期"
          emptyValue={[]}
          rules={[
            { required: true, message: '请选择日期' },
            {
              validator: (value) =>
                Array.isArray(value) &&
                value.length === 2 &&
                value.every(Boolean)
                  ? undefined
                  : '请选择完整日期',
            },
          ]}
          control={<DateRangePicker mode="native" />}
        />
        <button type="submit">查询</button>
      </Form>,
    )
    fireEvent.click(screen.getByRole('button', { name: '查询' }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('请选择日期'),
    )
    fireEvent.change(screen.getByLabelText(/开始日期/), {
      target: { value: '2026-10-01' },
    })
    fireEvent.click(screen.getByRole('button', { name: '查询' }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('请选择完整日期'),
    )
    fireEvent.change(screen.getByLabelText('结束日期'), {
      target: { value: '2026-10-05' },
    })
    fireEvent.click(screen.getByRole('button', { name: '查询' }))
    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith({
        period: ['2026-10-01', '2026-10-05'],
      }),
    )
  })

  it('validates on blur only after focus leaves both dates', async () => {
    const validator = vi.fn((value: unknown) =>
      Array.isArray(value) && value.every(Boolean)
        ? undefined
        : '请选择完整日期',
    )
    render(
      <Form validateOn="blur">
        <FormItem
          name="period"
          emptyValue={[]}
          rules={[{ validator }]}
          control={<DateRangePicker mode="native" />}
        />
        <button type="button">离开</button>
      </Form>,
    )
    const start = screen.getByLabelText('开始日期')
    const end = screen.getByLabelText('结束日期')
    fireEvent.change(start, { target: { value: '2026-10-01' } })
    fireEvent.blur(start, { relatedTarget: end })
    expect(validator).not.toHaveBeenCalled()
    fireEvent.blur(end, {
      relatedTarget: screen.getByRole('button', { name: '离开' }),
    })
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('请选择完整日期'),
    )
  })
})
