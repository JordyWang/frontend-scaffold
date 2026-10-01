import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfigProvider, DateRangePicker, Form, FormItem } from '@/shared/ui'

const start = () => screen.getByRole('combobox', { name: '开始日期' })
const end = () => screen.getByRole('combobox', { name: '结束日期' })
const day = (value: string) =>
  document.querySelector<HTMLButtonElement>(
    '[data-calendar-date="' + value + '"]',
  )!
const open = () => fireEvent.keyDown(start(), { key: 'ArrowDown' })

describe('DateRangePicker calendar session', () => {
  it('moves from the start to the end and commits only a complete leap-month range', () => {
    const onChange = vi.fn(),
      onCalendarChange = vi.fn()
    const { container } = render(
      <form>
        <DateRangePicker
          name="period"
          defaultPanelMonth="2024-02"
          onChange={onChange}
          onCalendarChange={onCalendarChange}
        />
      </form>,
    )
    open()
    fireEvent.click(day('2024-02-28'))
    expect(onCalendarChange).toHaveBeenCalledWith(['2024-02-28', ''], {
      endpoint: 'start',
    })
    expect(day('2024-02-28')).toHaveFocus()
    expect(onChange).not.toHaveBeenCalled()
    expect(new FormData(container.querySelector('form')!).get('period')).toBe(
      '["",""]',
    )
    fireEvent.keyDown(day('2024-02-28'), { key: 'ArrowRight' })
    expect(day('2024-02-29')).toHaveFocus()
    fireEvent.keyDown(day('2024-02-29'), { key: 'ArrowRight' })
    expect(day('2024-03-01')).toHaveFocus()
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.click(day('2024-03-02'))
    expect(onChange).toHaveBeenCalledExactlyOnceWith([
      '2024-02-28',
      '2024-03-02',
    ])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(end()).toHaveFocus()
    expect(new FormData(container.querySelector('form')!).get('period')).toBe(
      '["2024-02-28","2024-03-02"]',
    )
  })

  it('keeps explicit controlled emptiness authoritative and receives external tuples', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <DateRangePicker
        value={undefined}
        defaultValue={['2024-02-10', '2024-02-14']}
        defaultPanelMonth="2024-02"
        onChange={onChange}
      />,
    )
    expect(start()).toHaveValue('')
    open()
    fireEvent.click(day('2024-02-10'))
    fireEvent.click(day('2024-02-14'))
    expect(onChange).toHaveBeenCalledWith(['2024-02-10', '2024-02-14'])
    expect(start()).toHaveValue('')
    rerender(<DateRangePicker value={['2024-02-10', '2024-02-14']} />)
    expect(start()).toHaveValue('2024-02-10')
    expect(end()).toHaveValue('2024-02-14')
  })

  it('holds presets and endpoint changes for confirmation and discards them on Escape or outside focus', () => {
    const onChange = vi.fn(),
      onOk = vi.fn()
    render(
      <>
        <DateRangePicker
          defaultValue={['2024-02-10', '2024-02-14']}
          needConfirm
          onChange={onChange}
          onOk={onOk}
          presets={[
            { key: 'leap', label: '闰月', value: ['2024-02-28', '2024-03-02'] },
          ]}
        />
        <button>外部</button>
      </>,
    )
    open()
    fireEvent.click(screen.getByRole('button', { name: '闰月', exact: true }))
    expect(start()).toHaveValue('2024-02-28')
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.keyDown(day('2024-02-28'), { key: 'Escape' })
    expect(start()).toHaveValue('2024-02-10')
    open()
    fireEvent.click(day('2024-02-28'))
    fireEvent.click(day('2024-02-29'))
    act(() => start().focus())
    fireEvent.click(start())
    expect(start()).toHaveValue('2024-02-28')
    expect(end()).toHaveValue('2024-02-29')
    act(() => screen.getByRole('button', { name: '外部' }).focus())
    expect(start()).toHaveValue('2024-02-10')
    open()
    fireEvent.click(screen.getByRole('button', { name: '闰月', exact: true }))
    fireEvent.click(screen.getByRole('button', { name: '确定', exact: true }))
    expect(onChange).toHaveBeenCalledExactlyOnceWith([
      '2024-02-28',
      '2024-03-02',
    ])
    expect(onOk).toHaveBeenCalledExactlyOnceWith(['2024-02-28', '2024-03-02'])
  })

  it('protects a disabled endpoint during selection, clearing, crossing and preset changes', () => {
    const onChange = vi.fn()
    render(
      <DateRangePicker
        disabled={[true, false]}
        defaultValue={['2024-02-28', '2024-03-02']}
        defaultPanelMonth="2024-02"
        onChange={onChange}
        presets={[
          {
            key: 'bad',
            label: '修改锁定端',
            value: ['2024-02-27', '2024-03-02'],
          },
        ]}
      />,
    )
    expect(start()).toBeDisabled()
    expect(
      screen.queryByRole('button', { name: '清空开始日期' }),
    ).not.toBeInTheDocument()
    fireEvent.keyDown(end(), { key: 'ArrowDown' })
    expect(day('2024-02-27')).toBeDisabled()
    expect(screen.getByRole('button', { name: '修改锁定端' })).toBeDisabled()
    fireEvent.click(day('2024-03-03'))
    expect(onChange).toHaveBeenCalledWith(['2024-02-28', '2024-03-03'])
    fireEvent.click(screen.getByRole('button', { name: '清空结束日期' }))
    expect(onChange).toHaveBeenLastCalledWith(['2024-02-28', ''])
  })

  it('uses endpoint and from information for date restrictions and rejects stale dynamic presets', () => {
    const disabledDate = vi.fn(
      (date: string, info: { endpoint: string; from?: string }) =>
        info.endpoint === 'end' && Boolean(info.from && date > '2024-03-06'),
    )
    const preset = vi.fn((): [string, string] => ['2024-02-28', '2024-03-08'])
    render(
      <DateRangePicker
        defaultPanelMonth="2024-02"
        disabledDate={disabledDate}
        presets={[{ key: 'live', label: '动态范围', value: preset }]}
      />,
    )
    expect(preset).not.toHaveBeenCalled()
    open()
    fireEvent.click(day('2024-02-28'))
    expect(disabledDate).toHaveBeenCalledWith('2024-03-08', {
      endpoint: 'end',
      from: '2024-02-28',
    })
    expect(day('2024-03-08')).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '动态范围' }))
    expect(preset).toHaveBeenCalledOnce()
    expect(screen.getByRole('alert')).toHaveTextContent('快捷范围当前不可选')
  })

  it('commits an explicitly allowed open interval through the apply action', () => {
    const onChange = vi.fn()
    render(
      <DateRangePicker
        allowEmpty={[false, true]}
        defaultPanelMonth="2024-02"
        onChange={onChange}
      />,
    )
    open()
    expect(screen.getByRole('button', { name: '应用范围' })).toBeDisabled()
    fireEvent.click(day('2024-02-28'))
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '应用范围' }))
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['2024-02-28', ''])
  })

  it('commits typed ISO endpoints, clears a crossed endpoint and restores invalid drafts on blur', () => {
    const onChange = vi.fn()
    render(
      <DateRangePicker
        defaultValue={['2024-02-10', '2024-02-14']}
        min="2024-02-01"
        max="2024-03-31"
        onChange={onChange}
      />,
    )
    fireEvent.change(start(), { target: { value: '2024-02-20' } })
    fireEvent.keyDown(start(), { key: 'Enter' })
    expect(onChange).toHaveBeenLastCalledWith(['2024-02-20', ''])
    fireEvent.change(end(), { target: { value: '2024-02-29' } })
    fireEvent.keyDown(end(), { key: 'Enter' })
    expect(onChange).toHaveBeenLastCalledWith(['2024-02-20', '2024-02-29'])
    fireEvent.change(start(), { target: { value: '2023-02-29' } })
    fireEvent.keyDown(start(), { key: 'Enter' })
    expect(screen.getByRole('alert')).toHaveTextContent('请输入可选的日期范围')
    fireEvent.blur(start())
    expect(start()).toHaveValue('2024-02-20')
    expect(screen.getByRole('alert')).toHaveTextContent('已恢复原范围')
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it('reports controlled open, endpoint and linked month requests without replacing their values', () => {
    const onOpenChange = vi.fn(),
      onActiveEndpointChange = vi.fn(),
      onPanelMonthChange = vi.fn()
    const { rerender } = render(
      <DateRangePicker
        open={false}
        activeEndpoint="start"
        panelMonth="2024-02"
        onOpenChange={onOpenChange}
        onActiveEndpointChange={onActiveEndpointChange}
        onPanelMonthChange={onPanelMonthChange}
      />,
    )
    fireEvent.keyDown(end(), { key: 'ArrowDown' })
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(onActiveEndpointChange).toHaveBeenCalledWith('end')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    rerender(
      <DateRangePicker
        open
        activeEndpoint="start"
        panelMonth="2024-02"
        onPanelMonthChange={onPanelMonthChange}
      />,
    )
    fireEvent.click(
      within(screen.getByRole('dialog')).getAllByRole('button', {
        name: '下个月',
        exact: true,
      })[0],
    )
    expect(onPanelMonthChange).toHaveBeenCalledWith('2024-03')
    expect(
      screen.getByRole('grid', { name: /范围月份，2024年2月/ }),
    ).toBeInTheDocument()
  })

  it('resets an external native form and submits only confirmed values, including disabled omission', () => {
    const onChange = vi.fn()
    const { container, rerender } = render(
      <>
        <form id="range-form" />
        <DateRangePicker
          name="range"
          form="range-form"
          defaultValue={['2024-02-10', '2024-02-14']}
          needConfirm
          onChange={onChange}
        />
      </>,
    )
    open()
    fireEvent.click(day('2024-02-28'))
    const form = container.querySelector('form')!
    expect(new FormData(form).get('range')).toBe('["2024-02-10","2024-02-14"]')
    fireEvent.reset(form)
    expect(start()).toHaveValue('2024-02-10')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
    rerender(
      <>
        <form id="range-form" />
        <DateRangePicker name="range" form="range-form" disabled />
      </>,
    )
    expect(new FormData(form).has('range')).toBe(false)
  })

  it('preserves field Tab order and pending dates when returning from the first panel button', () => {
    render(<DateRangePicker needConfirm defaultPanelMonth="2024-02" />)
    open()
    fireEvent.click(day('2024-02-28'))
    const popup = screen.getByRole('dialog')
    const first = within(popup).getByRole('button', { name: /^开始日期：/ })
    act(() => first.focus())
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })
    expect(end()).toHaveFocus()
    expect(start()).toHaveValue('2024-02-28')
    expect(popup).toBeInTheDocument()
  })

  it('discards an unconfirmed range on footer Tab and skips a disappearing end clear button', () => {
    const onChange = vi.fn()
    render(
      <DateRangePicker
        needConfirm
        defaultPanelMonth="2024-02"
        onChange={onChange}
      />,
    )
    open()
    fireEvent.click(day('2024-02-10'))
    fireEvent.click(day('2024-02-14'))
    const confirm = screen.getByRole('button', { name: '确定', exact: true })
    act(() => confirm.focus())
    fireEvent.keyDown(confirm, { key: 'Tab' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(start()).toHaveValue('')
    expect(end()).toHaveValue('')
    expect(
      screen.getByRole('button', { name: '打开结束日期面板' }),
    ).toHaveFocus()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('checks day steps for input, calendar dates and presets and protects a locked end', () => {
    const onChange = vi.fn()
    render(
      <DateRangePicker
        defaultValue={['2024-02-03', '2024-02-09']}
        min="2024-02-01"
        max="2024-02-29"
        step={2}
        disabled={[false, true]}
        onChange={onChange}
        presets={[
          {
            key: 'step',
            label: '步长不符',
            value: ['2024-02-02', '2024-02-09'],
          },
        ]}
      />,
    )
    fireEvent.change(start(), { target: { value: '2024-02-02' } })
    fireEvent.keyDown(start(), { key: 'Enter' })
    expect(screen.getByRole('alert')).toHaveTextContent('请输入可选的日期范围')
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.blur(start())
    open()
    expect(day('2024-02-02')).toBeDisabled()
    expect(day('2024-02-11')).toBeDisabled()
    expect(screen.getByRole('button', { name: '步长不符' })).toBeDisabled()
    fireEvent.click(day('2024-02-05'))
    expect(onChange).toHaveBeenCalledExactlyOnceWith([
      '2024-02-05',
      '2024-02-09',
    ])
    expect(end()).toHaveValue('2024-02-09')
    expect(end()).toBeDisabled()
  })

  it('validates only after composite blur and integrates completed ranges with the project Form', async () => {
    const onFinish = vi.fn(),
      onBlur = vi.fn()
    render(
      <Form validateOn="blur" onFinish={onFinish}>
        <FormItem
          name="range"
          label="预约范围"
          emptyValue={[]}
          rules={[
            {
              validator: (value) =>
                Array.isArray(value) &&
                value.length === 2 &&
                value.every(Boolean)
                  ? undefined
                  : '选择完整范围',
            },
          ]}
          control={
            <DateRangePicker defaultPanelMonth="2024-02" onBlur={onBlur} />
          }
        />
        <button type="submit">提交</button>
      </Form>,
    )
    expect(
      screen.getByRole('group', { name: '预约范围', exact: true }),
    ).toBeInTheDocument()
    expect(start()).toHaveAccessibleName('开始日期')
    expect(end()).toHaveAccessibleName('结束日期')
    act(() => start().focus())
    open()
    fireEvent.click(day('2024-02-28'))
    expect(onBlur).not.toHaveBeenCalled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    fireEvent.click(day('2024-03-02'))
    act(() => screen.getByRole('button', { name: '提交' }).focus())
    await waitFor(() => expect(onBlur).toHaveBeenCalledOnce())
    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith({
        range: ['2024-02-28', '2024-03-02'],
      }),
    )
  })

  it('shows range and preview semantics in an inline RTL calendar without publishing navigation', () => {
    const onChange = vi.fn()
    render(
      <ConfigProvider direction="rtl">
        <DateRangePicker
          mode="panel"
          defaultValue={['2024-02-10', '2024-02-14']}
          needConfirm
          onChange={onChange}
        />
      </ConfigProvider>,
    )
    expect(
      screen.getByRole('group', { name: '日期范围', exact: true }),
    ).toHaveAttribute('dir', 'rtl')
    expect(day('2024-02-10')).toHaveAttribute('data-calendar-range', 'start')
    expect(day('2024-02-12').closest('td')).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(day('2024-02-14')).toHaveAccessibleName(/范围结束/)
    act(() => day('2024-02-10').focus())
    fireEvent.keyDown(day('2024-02-10'), { key: 'ArrowLeft' })
    expect(day('2024-02-11')).toHaveFocus()
    expect(day('2024-02-11')).toHaveAttribute('data-calendar-preview')
    expect(onChange).not.toHaveBeenCalled()
  })
})
