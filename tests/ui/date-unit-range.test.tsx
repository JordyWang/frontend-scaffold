import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  ConfigProvider,
  DateRangePicker,
  Form,
  FormItem,
  type DatePeriodUnit,
} from '@/shared/ui'

const scenarios: [DatePeriodUnit, string, string, string][] = [
  ['week', '2020-W53', '2021-W02', '2020-12'],
  ['month', '2024-02', '2024-05', '2024-02'],
  ['quarter', '2024-Q1', '2024-Q3', '2024-01'],
  ['year', '2024', '2026', '2024-01'],
]
const cell = (value: string) =>
  document.querySelector<HTMLButtonElement>(
    '[data-picker-value="' + value + '"]',
  )!
const fields = () => screen.getAllByRole('combobox')
const open = (part = 0) =>
  fireEvent.keyDown(fields()[part], { key: 'ArrowDown' })

describe('DateRangePicker period sessions', () => {
  it.each(scenarios)(
    'selects an ordered %s range without submitting its first endpoint',
    (picker, start, end, month) => {
      const onChange = vi.fn(),
        onCalendarChange = vi.fn()
      const { container } = render(
        <form>
          <DateRangePicker
            picker={picker}
            name="range"
            defaultPanelMonth={month}
            onChange={onChange}
            onCalendarChange={onCalendarChange}
          />
        </form>,
      )
      open()
      fireEvent.click(cell(start))
      expect(onChange).not.toHaveBeenCalled()
      expect(onCalendarChange).toHaveBeenLastCalledWith([start, ''], {
        endpoint: 'start',
      })
      expect(cell(start)).toHaveAttribute('data-picker-range', 'start')
      expect(cell(start)).toHaveAccessibleName(/范围开始/)
      expect(new FormData(container.querySelector('form')!).get('range')).toBe(
        '["",""]',
      )
      fireEvent.click(cell(end))
      expect(onChange).toHaveBeenCalledExactlyOnceWith([start, end])
      expect(onCalendarChange).toHaveBeenLastCalledWith([start, end], {
        endpoint: 'end',
      })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(fields()[1]).toHaveFocus()
      expect(new FormData(container.querySelector('form')!).get('range')).toBe(
        JSON.stringify([start, end]),
      )
    },
  )

  it.each(scenarios)(
    'confirms and cancels %s presets without putting pending values into FormData',
    (picker, start, end, month) => {
      const onChange = vi.fn(),
        onOk = vi.fn()
      const { container } = render(
        <form>
          <DateRangePicker
            picker={picker}
            name="range"
            defaultPanelMonth={month}
            needConfirm
            onChange={onChange}
            onOk={onOk}
            presets={[
              { key: 'period', label: '报告区间', value: [start, end] },
            ]}
          />
        </form>,
      )
      open()
      fireEvent.click(
        screen.getByRole('button', { name: '报告区间', exact: true }),
      )
      expect(fields()[0]).toHaveValue(start)
      expect(onChange).not.toHaveBeenCalled()
      expect(new FormData(container.querySelector('form')!).get('range')).toBe(
        '["",""]',
      )
      expect(cell(end)).toHaveAccessibleName(/范围结束/)
      fireEvent.keyDown(cell(start), { key: 'Escape' })
      expect(fields()[0]).toHaveValue('')
      open()
      fireEvent.click(
        screen.getByRole('button', { name: '报告区间', exact: true }),
      )
      fireEvent.click(screen.getByRole('button', { name: '确定', exact: true }))
      expect(onChange).toHaveBeenCalledExactlyOnceWith([start, end])
      expect(onOk).toHaveBeenCalledExactlyOnceWith([start, end])
      fireEvent.reset(container.querySelector('form')!)
      expect(fields()[0]).toHaveValue('')
      expect(onChange).toHaveBeenCalledTimes(1)
    },
  )

  it('exposes interior and keyboard preview semantics without selecting the hovered month', () => {
    const onChange = vi.fn()
    render(
      <DateRangePicker
        picker="month"
        defaultValue={['2024-02', '2024-05']}
        needConfirm
        onChange={onChange}
        renderCell={(value, picker) =>
          value === '2024-04' ? <span>{picker}结算</span> : null
        }
        getCellDescription={(value) =>
          value === '2024-04' ? '结算窗口' : undefined
        }
      />,
    )
    open(1)
    expect(cell('2024-03')).toHaveAttribute('data-picker-range', 'inside')
    expect(cell('2024-03').parentElement).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(cell('2024-04')).toHaveAccessibleName(/范围内，结算窗口/)
    expect(cell('2024-04')).toHaveTextContent('month结算')
    act(() => cell('2024-05').focus())
    fireEvent.keyDown(cell('2024-05'), { key: 'ArrowRight' })
    expect(cell('2024-06')).toHaveFocus()
    expect(cell('2024-06')).toHaveAttribute('data-picker-preview', '')
    expect(cell('2024-06').parentElement).toHaveAttribute(
      'aria-selected',
      'false',
    )
    expect(fields()[1]).toHaveValue('2024-05')
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.mouseLeave(
      screen.getByRole('grid', { name: /2024年/ }).parentElement!,
    )
    expect(cell('2024-06')).toHaveAttribute('data-picker-preview', '')
    const pointerMove = new Event('pointermove', { bubbles: true })
    Object.defineProperty(pointerMove, 'pointerType', { value: 'mouse' })
    fireEvent(cell('2024-06'), pointerMove)
    fireEvent.mouseLeave(
      screen.getByRole('grid', { name: /2024年/ }).parentElement!,
    )
    expect(cell('2024-06')).not.toHaveAttribute('data-picker-preview')
  })

  it('applies unit min/max and step consistently to typing and static or live presets', () => {
    const onChange = vi.fn(),
      live = vi.fn((): [string, string] => ['2024-01', '2024-02'])
    render(
      <DateRangePicker
        picker="month"
        defaultValue={['2024-01', '2024-05']}
        min="2024-01"
        max="2024-11"
        step={2}
        onChange={onChange}
        presets={[
          { key: 'bad', label: '偶数月份', value: ['2024-02', '2024-04'] },
          { key: 'live', label: '动态月份', value: live },
        ]}
      />,
    )
    open()
    expect(cell('2024-02')).toBeDisabled()
    expect(cell('2024-12')).toBeDisabled()
    expect(screen.getByRole('button', { name: '偶数月份' })).toBeDisabled()
    expect(live).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '动态月份' }))
    expect(live).toHaveBeenCalledOnce()
    expect(screen.getByRole('alert')).toHaveTextContent('快捷范围当前不可选')
    fireEvent.keyDown(cell('2024-01'), { key: 'Escape' })
    fireEvent.change(fields()[1], { target: { value: '2024-02' } })
    fireEvent.keyDown(fields()[1], { key: 'Enter' })
    expect(screen.getByRole('alert')).toHaveTextContent('YYYY-MM')
    fireEvent.blur(fields()[1])
    expect(fields()[1]).toHaveValue('2024-05')
    fireEvent.change(fields()[1], { target: { value: '2024-09' } })
    fireEvent.keyDown(fields()[1], { key: 'Enter' })
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['2024-01', '2024-09'])
  })

  it('uses ISO week identity for crossing, invalid week input and from restrictions', () => {
    const onChange = vi.fn(),
      disabledDate = vi.fn(
        (value: string, info: { endpoint: string; from?: string }) =>
          info.endpoint === 'end' && Boolean(info.from && value > '2021-W03'),
      )
    render(
      <DateRangePicker
        picker="week"
        defaultValue={['2020-W53', '2021-W02']}
        min="2020-W50"
        max="2021-W08"
        disabledDate={disabledDate}
        onChange={onChange}
      />,
    )
    open(1)
    expect(disabledDate).toHaveBeenCalledWith('2021-W04', {
      endpoint: 'end',
      from: '2020-W53',
    })
    expect(cell('2021-W04')).toBeDisabled()
    fireEvent.keyDown(cell('2021-W02'), { key: 'Escape' })
    fireEvent.change(fields()[1], { target: { value: '2021-W53' } })
    fireEvent.keyDown(fields()[1], { key: 'Enter' })
    expect(screen.getByRole('alert')).toHaveTextContent('YYYY-Www')
    fireEvent.blur(fields()[1])
    expect(fields()[1]).toHaveValue('2021-W02')
    fireEvent.change(fields()[0], { target: { value: '2021-W03' } })
    fireEvent.keyDown(fields()[0], { key: 'Enter' })
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['2021-W03', ''])
  })

  it('protects a locked quarter while allowing an explicit open interval and clearing its other endpoint', () => {
    const onChange = vi.fn()
    render(
      <DateRangePicker
        picker="quarter"
        defaultValue={['2024-Q2', '']}
        disabled={[true, false]}
        allowEmpty={[false, true]}
        onChange={onChange}
        presets={[
          { key: 'locked', label: '替换起点', value: ['2024-Q1', '2024-Q4'] },
        ]}
      />,
    )
    expect(fields()[0]).toBeDisabled()
    open(1)
    expect(cell('2024-Q1')).toBeDisabled()
    expect(screen.getByRole('button', { name: '替换起点' })).toBeDisabled()
    fireEvent.click(cell('2024-Q3'))
    expect(onChange).toHaveBeenLastCalledWith(['2024-Q2', '2024-Q3'])
    fireEvent.click(screen.getByRole('button', { name: '清空结束季度' }))
    expect(onChange).toHaveBeenLastCalledWith(['2024-Q2', ''])
    open(1)
    fireEvent.click(screen.getByRole('button', { name: '应用范围' }))
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it('discards typed confirmation on external close and receives controlled empty and changed tuples', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <DateRangePicker
        picker="year"
        needConfirm
        open
        defaultValue={['2024', '2026']}
        onChange={onChange}
      />,
    )
    fireEvent.change(fields()[1], { target: { value: '2027' } })
    rerender(
      <DateRangePicker
        picker="year"
        needConfirm
        open={false}
        defaultValue={['2024', '2026']}
        onChange={onChange}
      />,
    )
    expect(fields()[1]).toHaveValue('2026')
    expect(onChange).not.toHaveBeenCalled()
    rerender(
      <DateRangePicker
        picker="year"
        value={undefined}
        defaultValue={['2024', '2026']}
        onChange={onChange}
      />,
    )
    expect(fields()[0]).toHaveValue('')
    rerender(
      <DateRangePicker
        picker="year"
        value={['2030', '2035']}
        onChange={onChange}
      />,
    )
    expect(fields()[0]).toHaveValue('2030')
    expect(fields()[1]).toHaveValue('2035')
  })

  it('starts a new period session when switching the public picker', () => {
    const { rerender } = render(
      <DateRangePicker
        picker="month"
        defaultValue={['2024-02', '2024-05']}
        needConfirm
      />,
    )
    open()
    fireEvent.click(cell('2024-03'))
    rerender(
      <DateRangePicker
        picker="quarter"
        defaultValue={['2024-Q1', '2024-Q3']}
        needConfirm
      />,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(fields()[0]).toHaveValue('2024-Q1')
    expect(fields()[1]).toHaveValue('2024-Q3')
  })

  it('links yearly panels by a decade and keeps hierarchy navigation separate from selection', () => {
    const onChange = vi.fn(),
      onPanelMonthChange = vi.fn()
    render(
      <DateRangePicker
        picker="year"
        defaultValue={['2024', '2026']}
        panelMonth="2024-01"
        onChange={onChange}
        onPanelMonthChange={onPanelMonthChange}
      />,
    )
    open()
    const grids = screen.getAllByRole('grid')
    expect(grids[0]).toHaveAccessibleName(/2020–2029/)
    expect(grids[1]).toHaveAccessibleName(/2030–2039/)
    const second = grids[1].parentElement!
    fireEvent.click(within(second).getByRole('button', { name: '下一页' }))
    expect(onPanelMonthChange).toHaveBeenLastCalledWith('2034-01')
    const first = grids[0].parentElement!
    fireEvent.click(
      within(first).getByRole('button', { name: '浏览2020–2029' }),
    )
    fireEvent.click(
      within(first).getByRole('button', { name: '2030–2039', exact: true }),
    )
    expect(onPanelMonthChange).toHaveBeenLastCalledWith('2030-01')
    expect(onChange).not.toHaveBeenCalled()
    expect(fields()[0]).toHaveValue('2024')
  })

  it('preserves RTL keyboard order, readonly panel boundaries and external focus', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <ConfigProvider direction="rtl">
        <DateRangePicker
          picker="quarter"
          mode="panel"
          defaultValue={['2024-Q1', '2024-Q3']}
          onChange={onChange}
        />
        <button>外部</button>
      </ConfigProvider>,
    )
    act(() => cell('2024-Q1').focus())
    fireEvent.keyDown(cell('2024-Q1'), { key: 'ArrowLeft' })
    expect(cell('2024-Q2')).toHaveFocus()
    expect(onChange).not.toHaveBeenCalled()
    act(() => screen.getByRole('button', { name: '外部' }).focus())
    rerender(
      <ConfigProvider direction="rtl">
        <DateRangePicker
          picker="quarter"
          mode="panel"
          defaultValue={['2024-Q1', '2024-Q3']}
          readOnly
          onChange={onChange}
        />
        <button>外部</button>
      </ConfigProvider>,
    )
    expect(cell('2024-Q2')).toBeDisabled()
    expect(screen.getByRole('button', { name: '外部' })).toHaveFocus()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('validates a period tuple as one project Form value and restores it on reset', async () => {
    const onFinish = vi.fn()
    render(
      <Form
        initialValues={{ period: ['2024-02', '2024-05'] }}
        validateOn="blur"
        onFinish={onFinish}
      >
        <FormItem
          name="period"
          label="报告月份"
          emptyValue={[]}
          rules={[
            { required: true, message: '请选择完整月份' },
            {
              validator: (value) =>
                Array.isArray(value) && value.every(Boolean)
                  ? undefined
                  : '请选择完整月份',
            },
          ]}
          control={<DateRangePicker picker="month" />}
        />
        <button type="submit">提交</button>
        <button type="reset">重置</button>
      </Form>,
    )
    open()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    fireEvent.click(cell('2024-03'))
    fireEvent.click(cell('2024-06'))
    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledExactlyOnceWith({
        period: ['2024-03', '2024-06'],
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: '重置' }))
    expect(fields()[0]).toHaveValue('2024-02')
    expect(fields()[1]).toHaveValue('2024-05')
  })
})
