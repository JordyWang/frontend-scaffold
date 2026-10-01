import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DatePicker,
  DateRangePicker,
  TimePicker,
  TimeRangePicker,
} from '@/shared/ui'

const option = (unit: string, value: number) =>
  document.querySelector<HTMLButtonElement>(
    '[data-time-unit="' + unit + '"][data-time-value="' + value + '"]',
  )!
const confirm = () =>
  fireEvent.click(screen.getByRole('button', { name: '确定', exact: true }))
function geometry(unit: string) {
  const column = document.querySelector<HTMLDivElement>(
    '[data-time-scroll-unit="' + unit + '"]',
  )!
  vi.spyOn(column, 'getBoundingClientRect').mockImplementation(
    () => new DOMRect(0, 100, 80, 224),
  )
  vi.spyOn(column, 'getClientRects').mockReturnValue([
    new DOMRect(0, 100, 80, 224),
  ] as unknown as DOMRectList)
  Object.defineProperty(column, 'clientHeight', {
    configurable: true,
    value: 224,
  })
  column
    .querySelectorAll<HTMLButtonElement>('[data-time-unit]')
    .forEach((button, index) => {
      vi.spyOn(button, 'getBoundingClientRect').mockImplementation(
        () => new DOMRect(0, 100 + index * 44 - column.scrollTop, 80, 44),
      )
    })
  return column
}
function move(column: HTMLElement, index: number, armed = true) {
  if (armed) fireEvent.wheel(column, { deltaY: 44 })
  column.scrollTop = index * 44
  fireEvent.scroll(column)
}
const settle = () => act(() => vi.advanceTimersByTime(160))

beforeEach(() => {
  vi.useFakeTimers()
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
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('time preview stays separate from selected and submitted values', () => {
  it('previews a selectable mouse option by default, leaves ARIA selection and FormData unchanged and confirms only the selected value', () => {
    const onChange = vi.fn(),
      onOk = vi.fn()
    const { container } = render(
      <form>
        <TimePicker
          mode="panel"
          name="time"
          defaultValue="09:30"
          onChange={onChange}
          onOk={onOk}
        />
      </form>,
    )
    const field = screen.getByRole('textbox', { name: '时间', exact: true })
    fireEvent.pointerEnter(option('hour', 10), { pointerType: 'mouse' })
    expect(field).toHaveValue('10:30')
    expect(field).toHaveAttribute('data-picker-preview', 'hover')
    expect(option('hour', 9)).toHaveAttribute('aria-selected', 'true')
    expect(option('hour', 10)).toHaveAttribute('aria-selected', 'false')
    expect(new FormData(container.querySelector('form')!).get('time')).toBe(
      '09:30',
    )
    expect(onChange).not.toHaveBeenCalled()
    confirm()
    expect(field).toHaveValue('09:30')
    expect(onOk).toHaveBeenCalledWith('09:30')
    expect(onChange).not.toHaveBeenCalled()
  })
  it('never previews touch or disabled options, respects the opt-out and clears on keyboard browsing', () => {
    const { rerender } = render(
      <TimePicker
        mode="panel"
        defaultValue="09:30"
        disabledHours={() => [11]}
      />,
    )
    const field = screen.getByRole('textbox', { name: '时间', exact: true })
    fireEvent.pointerEnter(option('hour', 10), { pointerType: 'touch' })
    expect(field).toHaveValue('09:30')
    fireEvent.pointerEnter(option('hour', 11), { pointerType: 'mouse' })
    expect(field).toHaveValue('09:30')
    fireEvent.pointerEnter(option('hour', 10), { pointerType: 'mouse' })
    expect(field).toHaveValue('10:30')
    fireEvent.keyDown(option('hour', 9), { key: 'ArrowDown' })
    expect(field).toHaveValue('09:30')
    rerender(
      <TimePicker mode="panel" defaultValue="09:30" previewValue={false} />,
    )
    fireEvent.pointerEnter(option('hour', 10), { pointerType: 'mouse' })
    expect(field).toHaveValue('09:30')
  })
  it('restores after leave, rejects newly disabled previews and does not resurrect them on re-enable', () => {
    const view = (disabled = false) => (
      <TimePicker
        mode="panel"
        defaultValue="09:30"
        disabledHours={() => (disabled ? [10] : [])}
      />
    )
    const { rerender } = render(view())
    const field = screen.getByRole('textbox', { name: '时间', exact: true })
    fireEvent.pointerEnter(option('hour', 10), { pointerType: 'mouse' })
    fireEvent.pointerLeave(option('hour', 10), { pointerType: 'mouse' })
    expect(field).toHaveValue('09:30')
    fireEvent.pointerEnter(option('hour', 10), { pointerType: 'mouse' })
    rerender(view(true))
    expect(field).toHaveValue('09:30')
    rerender(view())
    expect(field).toHaveValue('09:30')
  })
  it('keeps manual editing independent and drops popup preview on cancel and reopen', () => {
    render(<TimePicker defaultValue="09:30" />)
    const field = screen.getByRole('combobox')
    fireEvent.keyDown(field, { key: 'ArrowDown' })
    fireEvent.pointerEnter(option('hour', 10), { pointerType: 'mouse' })
    fireEvent.keyDown(field, { key: 'Escape' })
    expect(field).toHaveValue('09:30')
    fireEvent.keyDown(field, { key: 'ArrowDown' })
    expect(field).toHaveValue('09:30')
    fireEvent.change(field, { target: { value: '12:45' } })
    fireEvent.pointerEnter(option('hour', 13), { pointerType: 'mouse' })
    expect(field).toHaveValue('12:45')
    fireEvent.keyDown(field, { key: 'Enter' })
    expect(field).toHaveValue('12:45')
  })
  it('previews only the active range endpoint and preserves the opposite endpoint when hovering across it', () => {
    const onChange = vi.fn(),
      onCalendarChange = vi.fn()
    render(
      <TimeRangePicker
        mode="panel"
        defaultValue={['09:30', '17:00']}
        onChange={onChange}
        onCalendarChange={onCalendarChange}
      />,
    )
    const start = screen.getByRole('textbox', {
        name: '开始时间',
        exact: true,
      }),
      end = screen.getByRole('textbox', { name: '结束时间', exact: true })
    fireEvent.pointerEnter(option('hour', 18), { pointerType: 'mouse' })
    expect(start).toHaveValue('18:30')
    expect(end).toHaveValue('17:00')
    fireEvent.click(screen.getByRole('button', { name: /^结束时间：/ }))
    expect(start).toHaveValue('09:30')
    fireEvent.pointerEnter(option('hour', 19), { pointerType: 'mouse' })
    expect(end).toHaveValue('19:00')
    confirm()
    expect(end).toHaveValue('17:00')
    expect(onChange).not.toHaveBeenCalled()
    expect(onCalendarChange).not.toHaveBeenCalled()
  })
  it('routes showTime preview settings and keeps the selected date when previewing time', () => {
    const onCalendarChange = vi.fn()
    render(
      <DatePicker
        showTime
        defaultValue="2024-02-29T09:30"
        mode="panel"
        onCalendarChange={onCalendarChange}
      />,
    )
    fireEvent.click(
      screen.getByRole('button', { name: '调整时间', exact: true }),
    )
    fireEvent.pointerEnter(option('hour', 10), { pointerType: 'mouse' })
    expect(screen.getByRole('textbox')).toHaveValue('2024-02-29 10:30')
    fireEvent.click(
      screen.getByRole('button', { name: '选择日期', exact: true }),
    )
    expect(screen.getByRole('textbox')).toHaveValue('2024-02-29 09:30')
    expect(onCalendarChange).not.toHaveBeenCalled()
  })
  it('date-time range previews use date and endpoint restrictions without mutating its tuple', () => {
    const onChange = vi.fn()
    render(
      <DateRangePicker
        showTime={{ secondStep: 15 }}
        mode="panel"
        defaultValue={['2024-02-29T23:30:15', '2024-03-01T00:30:15']}
        defaultActiveEndpoint="end"
        disabledSeconds={(_hour, _minute, date, info) =>
          date === '2024-03-01' && info.endpoint === 'end' ? [30] : []
        }
        onChange={onChange}
      />,
    )
    fireEvent.click(
      screen.getByRole('button', { name: '调整时间', exact: true }),
    )
    fireEvent.pointerEnter(option('second', 30), { pointerType: 'mouse' })
    expect(
      screen.getByRole('textbox', { name: '结束日期时间', exact: true }),
    ).toHaveValue('2024-03-01 00:30:15')
    fireEvent.pointerEnter(option('second', 45), { pointerType: 'mouse' })
    expect(
      screen.getByRole('textbox', { name: '结束日期时间', exact: true }),
    ).toHaveValue('2024-03-01 00:30:45')
    confirm()
    expect(onChange).not.toHaveBeenCalled()
    expect(
      screen.getByRole('textbox', { name: '结束日期时间', exact: true }),
    ).toHaveValue('2024-03-01 00:30:15')
  })
})

describe('user scroll changes the selected value only after scrolling settles', () => {
  it('ignores programmatic scrolling and keyboard reveal, debounces wheel events and skips disabled rows', () => {
    const onChange = vi.fn()
    render(
      <TimePicker
        mode="panel"
        needConfirm={false}
        changeOnScroll
        defaultValue="09:30"
        disabledHours={() => [10]}
        onChange={onChange}
      />,
    )
    const column = geometry('hour'),
      field = screen.getByRole('textbox')
    move(column, 12, false)
    settle()
    expect(onChange).not.toHaveBeenCalled()
    move(column, 10.4)
    act(() => vi.advanceTimersByTime(100))
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.scroll(column)
    settle()
    expect(onChange).toHaveBeenCalledExactlyOnceWith('11:30')
    expect(field).toHaveValue('11:30')
    fireEvent.keyDown(option('hour', 11), { key: 'End' })
    move(column, 23, false)
    settle()
    expect(onChange).toHaveBeenCalledOnce()
  })
  it('default scroll is browse-only even after a wheel gesture', () => {
    const onChange = vi.fn()
    render(
      <TimePicker
        mode="panel"
        needConfirm={false}
        defaultValue="09:30"
        onChange={onChange}
      />,
    )
    move(geometry('hour'), 12)
    settle()
    expect(screen.getByRole('textbox')).toHaveValue('09:30')
    expect(onChange).not.toHaveBeenCalled()
  })
  it('touch scrolling obeys confirmation and never exposes a hover value', () => {
    const onChange = vi.fn(),
      onOk = vi.fn()
    const { container } = render(
      <form>
        <TimePicker
          mode="panel"
          changeOnScroll
          name="time"
          defaultValue="09:30"
          onChange={onChange}
          onOk={onOk}
        />
      </form>,
    )
    const column = geometry('minute')
    fireEvent.pointerDown(column, { pointerType: 'touch' })
    move(column, 45, false)
    settle()
    expect(screen.getByRole('textbox')).toHaveValue('09:30')
    fireEvent.pointerUp(column, { pointerType: 'touch' })
    settle()
    expect(screen.getByRole('textbox')).toHaveValue('09:45')
    expect(screen.getByRole('textbox')).not.toHaveAttribute(
      'data-picker-preview',
    )
    expect(new FormData(container.querySelector('form')!).get('time')).toBe(
      '09:30',
    )
    expect(onChange).not.toHaveBeenCalled()
    confirm()
    expect(onChange).toHaveBeenCalledExactlyOnceWith('09:45')
    expect(onOk).toHaveBeenCalledWith('09:45')
  })
  it('abandons pending scroll when focus leaves, the panel closes or availability changes', () => {
    const onChange = vi.fn()
    const view = (disabled = false) => (
      <>
        <TimePicker
          mode="panel"
          changeOnScroll
          defaultValue="09:30"
          disabled={disabled}
          needConfirm={false}
          onChange={onChange}
        />
        <button>外部焦点</button>
      </>
    )
    const { rerender, unmount } = render(view())
    const column = geometry('hour')
    move(column, 12)
    act(() => screen.getByRole('button', { name: '外部焦点' }).focus())
    settle()
    expect(onChange).not.toHaveBeenCalled()
    move(column, 12)
    rerender(view(true))
    settle()
    expect(onChange).not.toHaveBeenCalled()
    rerender(view())
    move(column, 13)
    unmount()
    settle()
    expect(onChange).not.toHaveBeenCalled()
  })
  it('finishes a scrollbar drag released outside its column without committing while the pointer is held', () => {
    const onChange = vi.fn()
    render(
      <TimePicker
        mode="panel"
        changeOnScroll
        needConfirm={false}
        defaultValue="09:30"
        onChange={onChange}
      />,
    )
    const column = geometry('hour')
    fireEvent.pointerDown(column, { pointerType: 'mouse' })
    move(column, 12, false)
    fireEvent(column, new Event('scrollend', { bubbles: true }))
    settle()
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.pointerUp(document.body, { pointerType: 'mouse' })
    settle()
    expect(onChange).toHaveBeenCalledExactlyOnceWith('12:30')
    expect(screen.getByRole('textbox')).toHaveValue('12:30')
  })
  it('range scroll clears a crossed editable endpoint and waits for a complete confirmation', () => {
    const onChange = vi.fn(),
      onCalendarChange = vi.fn()
    render(
      <TimeRangePicker
        mode="panel"
        changeOnScroll
        defaultValue={['09:30', '17:00']}
        onChange={onChange}
        onCalendarChange={onCalendarChange}
      />,
    )
    move(geometry('hour'), 18)
    settle()
    expect(
      screen.getByRole('textbox', { name: '结束时间', exact: true }),
    ).toHaveValue('')
    expect(
      screen.getByRole('button', { name: '确定', exact: true }),
    ).toBeDisabled()
    expect(onCalendarChange).toHaveBeenLastCalledWith(['18:30', ''], {
      endpoint: 'start',
    })
    expect(onChange).not.toHaveBeenCalled()
  })
  it('routes date-time scroll to the current date and retains the single confirmation contract', () => {
    const onChange = vi.fn(),
      onCalendarChange = vi.fn()
    render(
      <DatePicker
        showTime={{ changeOnScroll: true, minuteStep: 15 }}
        mode="panel"
        defaultValue="2024-02-29T09:30"
        onChange={onChange}
        onCalendarChange={onCalendarChange}
      />,
    )
    fireEvent.click(
      screen.getByRole('button', { name: '调整时间', exact: true }),
    )
    move(geometry('minute'), 3)
    settle()
    expect(screen.getByRole('textbox')).toHaveValue('2024-02-29 09:45')
    expect(onCalendarChange).toHaveBeenLastCalledWith('2024-02-29T09:45', {
      part: 'time',
    })
    expect(onChange).not.toHaveBeenCalled()
    confirm()
    expect(onChange).toHaveBeenCalledExactlyOnceWith('2024-02-29T09:45')
  })
})
