import { createRef } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfigProvider, FormField, Slider, Tooltip } from '@/shared/ui'
import {
  createSliderScale,
  insertSliderValue,
  nextSliderValue,
  normalizeSliderValues,
  shiftSliderRange,
  sliderCoordinateReversed,
  sliderDots,
  sliderPercent,
  snapSliderValue,
  suggestSliderValue,
} from '@/shared/ui/slider-state'

function pointer(target: Element, type: string, x: number, y = 22) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX: x,
    clientY: y,
  })
  Object.defineProperty(event, 'pointerId', { value: 1 })
  fireEvent(target, event)
}
function geometry(container: HTMLElement) {
  const root = container.querySelector<HTMLElement>('[data-slider-root]')!
  const rail = container.querySelector<HTMLElement>('[data-slider-rail]')!
  vi.spyOn(rail, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 100,
    bottom: 100,
    width: 100,
    height: 100,
    toJSON: () => ({}),
  })
  return { root, rail }
}
const marks = [0, 20, 60, 100].map((value) => ({ value, label: `${value}%` }))

describe('Slider scale and constraints', () => {
  it('agrees with an independently enumerated set of legal discrete interval offsets', () => {
    const allowed = [0, 20, 30, 60, 100]
    const scale = createSliderScale(0, 100, null, allowed)
    const offsets = allowed
      .map((point) => point - 20)
      .filter((offset) => allowed.includes(60 + offset))
    for (let desired = -100; desired <= 100; desired += 3) {
      const expected = [...offsets].sort(
        (left, right) =>
          Math.abs(left - desired) - Math.abs(right - desired) || left - right,
      )[0]
      expect(shiftSliderRange([20, 60], desired, scale)).toEqual([
        20 + expected,
        60 + expected,
      ])
    }
  })
  it('snaps decimals and off-grid marks without leaking binary rounding', () => {
    const scale = createSliderScale(0.1, 1, 0.1, [0.35])
    expect(snapSliderValue(0.30000000000000004, scale)).toBe(0.3)
    expect(snapSliderValue(0.349, scale)).toBe(0.35)
    expect(nextSliderValue(0.3, 1, scale)).toBe(0.35)
    expect(nextSliderValue(0.35, 1, scale)).toBe(0.4)
    expect(nextSliderValue(0.4, -1, scale)).toBe(0.35)
    expect(nextSliderValue(0.9, 10, scale)).toBe(1)
    expect(snapSliderValue(4e-14, createSliderScale(0, 1e-13, 1e-14))).toBe(
      4e-14,
    )
  })
  it('keeps min and max selectable in marks-only mode and filters invalid marks', () => {
    const scale = createSliderScale(10, 90, null, [
      20,
      60,
      60,
      -1,
      100,
      Number.NaN,
    ])
    expect(scale.marks).toEqual([20, 60])
    expect(snapSliderValue(40, scale)).toBe(20)
    expect(nextSliderValue(20, 1, scale)).toBe(60)
    expect(nextSliderValue(60, 1, scale)).toBe(90)
    expect(nextSliderValue(20, -1, scale)).toBe(10)
    expect(normalizeSliderValues([100, -1, 60], true, scale)).toEqual([
      10, 60, 90,
    ])
  })
  it('normalizes non-finite or inverted bounds without unbounded dot generation', () => {
    expect(createSliderScale(Number.NaN, Number.POSITIVE_INFINITY, 0)).toEqual({
      min: 0,
      max: 0,
      step: 1,
      marks: [],
    })
    expect(createSliderScale(20, 10).max).toBe(20)
    expect(
      sliderDots(createSliderScale(0, 100, 0.000001), true).length,
    ).toBeLessThanOrEqual(502)
    expect(
      sliderDots(createSliderScale(0, 100, Number.MIN_VALUE), true),
    ).toEqual([0, 100])
  })
  it('shifts ranges without changing their width or crossing the bounds', () => {
    const scale = createSliderScale(0, 100, 5)
    expect(shiftSliderRange([20, 50], 17, scale)).toEqual([35, 65])
    expect(shiftSliderRange([20, 50], 90, scale)).toEqual([70, 100])
    expect(shiftSliderRange([20, 50], -90, scale)).toEqual([0, 30])
    const discrete = createSliderScale(0, 100, null, [20, 40, 60, 80])
    expect(shiftSliderRange([20, 60], 30, discrete)).toEqual([40, 80])
    expect(shiftSliderRange([20, 60], 99, discrete)).toEqual([60, 100])
  })
  it('maps values to the same physical coordinates used by RTL and vertical gestures', () => {
    const scale = createSliderScale()
    expect(
      sliderPercent(
        20,
        scale,
        sliderCoordinateReversed('horizontal', false, 'rtl'),
      ),
    ).toBe(80)
    expect(
      sliderPercent(
        20,
        scale,
        sliderCoordinateReversed('horizontal', true, 'rtl'),
      ),
    ).toBe(20)
    expect(
      sliderPercent(
        20,
        scale,
        sliderCoordinateReversed('vertical', false, 'ltr'),
      ),
    ).toBe(80)
    expect(
      sliderPercent(
        20,
        scale,
        sliderCoordinateReversed('vertical', true, 'rtl'),
      ),
    ).toBe(20)
  })
})

describe('Slider inputs and interactions', () => {
  it('disables marks that no editable handle can reach across a frozen boundary', () => {
    const onChange = vi.fn()
    render(
      <Slider
        range
        value={[20, 60]}
        disabled={[true, false]}
        marks={marks}
        onChange={onChange}
      />,
    )
    expect(screen.getByRole('button', { name: '0%' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '100%' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: '0%' }))
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '100%' }))
    expect(onChange).toHaveBeenCalledExactlyOnceWith([20, 100])
  })
  it('restores owned focus after a handle is removed or disabled, while leaving external focus alone', () => {
    const { rerender } = render(
      <Slider range value={[20, 50, 80]} label="区间" />,
    )
    act(() => screen.getAllByRole('slider')[2].focus())
    rerender(<Slider range value={[20, 50]} label="区间" />)
    expect(screen.getAllByRole('slider')[1]).toHaveFocus()
    rerender(
      <Slider range value={[20, 50]} label="区间" disabled={[false, true]} />,
    )
    expect(screen.getAllByRole('slider')[0]).toHaveFocus()
    rerender(<Slider range value={[20, 50]} label="区间" disabled />)
    expect(screen.getByRole('group', { name: '区间' })).toHaveFocus()
    rerender(
      <>
        <Slider range value={[20, 50]} label="区间" />
        <button>外部操作</button>
      </>,
    )
    act(() => screen.getByRole('button', { name: '外部操作' }).focus())
    rerender(
      <>
        <Slider range value={[20, 50, 80]} label="区间" disabled />
        <button>外部操作</button>
      </>,
    )
    expect(screen.getByRole('button', { name: '外部操作' })).toHaveFocus()
  })

  it('honors cancelled native resets and forms referenced outside the component tree', async () => {
    const { container } = render(
      <>
        <form
          id="external-slider-form"
          onReset={(event) => event.preventDefault()}
        />
        <Slider name="ratio" form="external-slider-form" defaultValue={30} />
      </>,
    )
    const input = screen.getByRole('slider')
    fireEvent.change(input, { target: { value: '80' } })
    fireEvent.reset(container.querySelector('form')!)
    await act(async () => {
      await Promise.resolve()
    })
    expect(input).toHaveValue('80')
    expect(new FormData(container.querySelector('form')!).get('ratio')).toBe(
      '80',
    )
  })

  it('preserves native input refs, field labels, error semantics and scalar form data', () => {
    const ref = createRef<HTMLInputElement>()
    const { container } = render(
      <form>
        <FormField
          label="音量"
          error="音量错误"
          control={<Slider ref={ref} defaultValue={30} name="volume" />}
        />
      </form>,
    )
    const slider = screen.getByRole('slider', { name: '音量' })
    expect(ref.current).toBe(slider)
    expect(slider).toHaveAttribute('aria-invalid', 'true')
    expect(slider).toHaveAccessibleDescription('音量错误')
    expect(new FormData(container.querySelector('form')!).get('volume')).toBe(
      '30',
    )
  })
  it('coalesces key repeats into one completion callback on keyup', () => {
    const onChange = vi.fn(),
      onChangeComplete = vi.fn()
    render(
      <Slider
        label="音量"
        defaultValue={20}
        step={5}
        onChange={onChange}
        onChangeComplete={onChangeComplete}
        tooltip={false}
      />,
    )
    const input = screen.getByRole('slider', { name: '音量' })
    fireEvent.keyDown(input, { key: 'ArrowRight' })
    fireEvent.keyDown(input, { key: 'ArrowRight', repeat: true })
    expect(input).toHaveValue('30')
    expect(onChange.mock.calls.map(([value]) => value)).toEqual([25, 30])
    expect(onChangeComplete).not.toHaveBeenCalled()
    fireEvent.keyUp(input, { key: 'ArrowRight' })
    expect(onChangeComplete).toHaveBeenCalledExactlyOnceWith(30)
    fireEvent.keyUp(input, { key: 'ArrowRight' })
    expect(onChangeComplete).toHaveBeenCalledTimes(1)
  })
  it('keeps controlled values and explicit undefined under owner control', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <Slider value={20} label="音量" onChange={onChange} />,
    )
    const input = screen.getByRole('slider', { name: '音量' })
    fireEvent.keyDown(input, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith(21)
    expect(input).toHaveValue('20')
    rerender(
      <Slider
        value={undefined}
        min={10}
        defaultValue={40}
        label="音量"
        onChange={onChange}
      />,
    )
    expect(input).toHaveValue('10')
    fireEvent.change(input, { target: { value: '30' } })
    expect(onChange).toHaveBeenLastCalledWith(30)
    expect(input).toHaveValue('10')
  })
  it('navigates marks-only values and commits a mark action without duplicate input changes', () => {
    const onChange = vi.fn(),
      onChangeComplete = vi.fn()
    render(
      <Slider
        label="温度"
        step={null}
        defaultValue={20}
        marks={marks}
        onChange={onChange}
        onChangeComplete={onChangeComplete}
      />,
    )
    const input = screen.getByRole('slider', { name: '温度' })
    fireEvent.keyDown(input, { key: 'ArrowRight' })
    fireEvent.keyUp(input, { key: 'ArrowRight' })
    expect(input).toHaveValue('60')
    fireEvent.click(screen.getByRole('button', { name: '100%' }))
    expect(input).toHaveValue('100')
    expect(onChange.mock.calls.map(([value]) => value)).toEqual([60, 100])
    expect(onChangeComplete.mock.calls.map(([value]) => value)).toEqual([
      60, 100,
    ])
  })
  it('labels each range endpoint, prevents crossing and submits one JSON field', () => {
    const onChange = vi.fn()
    const { container } = render(
      <form>
        <FormField
          label="预算"
          control={
            <Slider
              range
              defaultValue={[20, 60]}
              name="budget"
              onChange={onChange}
            />
          }
        />
      </form>,
    )
    const lower = screen.getByRole('slider', { name: '预算 下限' })
    const upper = screen.getByRole('slider', { name: '预算 上限' })
    expect(lower).toHaveAttribute('max', '60')
    expect(upper).toHaveAttribute('min', '20')
    fireEvent.keyDown(lower, { key: 'End' })
    fireEvent.keyUp(lower, { key: 'End' })
    expect(onChange).toHaveBeenCalledWith([60, 60])
    expect(
      new FormData(container.querySelector('form')!).getAll('budget'),
    ).toEqual(['[60,60]'])
  })
  it('keeps individually disabled handles as boundaries for other handles and track dragging', () => {
    const onChange = vi.fn()
    const { container } = render(
      <Slider
        range
        draggableTrack
        defaultValue={[20, 50, 80]}
        disabled={[false, true, false]}
        label="区间"
        onChange={onChange}
      />,
    )
    const handles = screen.getAllByRole('slider')
    expect(handles[1]).toBeDisabled()
    fireEvent.keyDown(handles[0], { key: 'End' })
    fireEvent.keyUp(handles[0], { key: 'End' })
    expect(onChange).toHaveBeenCalledWith([50, 50, 80])
    fireEvent.keyDown(handles[2], { key: 'Home' })
    fireEvent.keyUp(handles[2], { key: 'Home' })
    expect(onChange).toHaveBeenLastCalledWith([50, 50, 50])
    expect(container.querySelector('[data-slider-draggable-track]')).toBeNull()
  })
  it('uses physical left/right keys in RTL and reversed axes', () => {
    const { rerender } = render(
      <ConfigProvider direction="rtl">
        <Slider defaultValue={20} label="音量" />
      </ConfigProvider>,
    )
    const input = screen.getByRole('slider', { name: '音量' })
    fireEvent.keyDown(input, { key: 'ArrowRight' })
    fireEvent.keyUp(input, { key: 'ArrowRight' })
    expect(input).toHaveValue('19')
    rerender(
      <ConfigProvider direction="rtl">
        <Slider reverse label="音量" />
      </ConfigProvider>,
    )
    fireEvent.keyDown(input, { key: 'ArrowRight' })
    fireEvent.keyUp(input, { key: 'ArrowRight' })
    expect(input).toHaveValue('20')
    rerender(
      <Slider label="音量" defaultValue={20} orientation="vertical" reverse />,
    )
    const vertical = screen.getByRole('slider', { name: '音量' })
    fireEvent.keyDown(vertical, { key: 'ArrowUp' })
    fireEvent.keyUp(vertical, { key: 'ArrowUp' })
    expect(vertical).toHaveAttribute('aria-orientation', 'vertical')
    expect(vertical).toHaveValue('19')
  })
  it('chooses the nearest handle on the rail and completes once after a drag', () => {
    const onChange = vi.fn(),
      onChangeComplete = vi.fn()
    const { container } = render(
      <Slider
        range
        defaultValue={[20, 60]}
        label="区间"
        onChange={onChange}
        onChangeComplete={onChangeComplete}
      />,
    )
    const { root, rail } = geometry(container)
    pointer(rail, 'pointerdown', 85)
    pointer(root, 'pointermove', 95)
    expect(screen.getAllByRole('slider')[1]).toHaveValue('95')
    expect(onChangeComplete).not.toHaveBeenCalled()
    pointer(root, 'pointerup', 95)
    expect(onChangeComplete).toHaveBeenCalledExactlyOnceWith([20, 95])
    pointer(root, 'pointerup', 95)
    expect(onChangeComplete).toHaveBeenCalledTimes(1)
  })
  it('drags the whole range and retains its distance at the upper boundary', () => {
    const onChangeComplete = vi.fn()
    const { container } = render(
      <Slider
        range
        draggableTrack
        defaultValue={[20, 60]}
        onChangeComplete={onChangeComplete}
      />,
    )
    const { root } = geometry(container)
    const track = container.querySelector('[data-slider-draggable-track]')!
    pointer(track, 'pointerdown', 40)
    pointer(root, 'pointermove', 95)
    pointer(root, 'pointerup', 95)
    expect(
      screen
        .getAllByRole('slider')
        .map((input) => (input as HTMLInputElement).value),
    ).toEqual(['60', '100'])
    expect(onChangeComplete).toHaveBeenCalledExactlyOnceWith([60, 100])
  })
  it('cancels pending completion on pointer cancellation or an external value update', () => {
    const onChangeComplete = vi.fn()
    const { container, rerender } = render(
      <Slider value={20} onChangeComplete={onChangeComplete} />,
    )
    const { root, rail } = geometry(container)
    pointer(rail, 'pointerdown', 50)
    pointer(root, 'pointercancel', 50)
    expect(onChangeComplete).not.toHaveBeenCalled()
    pointer(rail, 'pointerdown', 40)
    rerender(<Slider value={90} onChangeComplete={onChangeComplete} />)
    pointer(root, 'pointerup', 40)
    expect(onChangeComplete).not.toHaveBeenCalled()
    expect(screen.getByRole('slider')).toHaveValue('90')
  })
  it('blocks keyboard-only changes and read-only or disabled interaction', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <Slider keyboard={false} defaultValue={20} onChange={onChange} />,
    )
    const input = screen.getByRole('slider')
    fireEvent.keyDown(input, { key: 'End' })
    fireEvent.keyUp(input, { key: 'End' })
    expect(input).toHaveValue('20')
    rerender(<Slider readOnly marks={marks} onChange={onChange} />)
    fireEvent.change(input, { target: { value: '50' } })
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: '60%' })).toBeDisabled()
    rerender(<Slider disabled onChange={onChange} />)
    expect(input).toBeDisabled()
  })
  it('resets uncontrolled scalar and range fields without emitting value callbacks', async () => {
    const onChange = vi.fn()
    const { container } = render(
      <form>
        <Slider name="single" defaultValue={30} onChange={onChange} />
        <Slider
          range
          name="range"
          defaultValue={[20, 60]}
          onChange={onChange}
        />
        <button type="reset">重置</button>
      </form>,
    )
    fireEvent.change(screen.getAllByRole('slider')[0], {
      target: { value: '80' },
    })
    fireEvent.change(screen.getAllByRole('slider')[2], {
      target: { value: '90' },
    })
    onChange.mockClear()
    fireEvent.click(screen.getByRole('button', { name: '重置' }))
    await waitFor(() =>
      expect(new FormData(container.querySelector('form')!).get('range')).toBe(
        '[20,60]',
      ),
    )
    expect(new FormData(container.querySelector('form')!).get('single')).toBe(
      '30',
    )
    expect(onChange).not.toHaveBeenCalled()
  })
  it('shows formatted value tooltips on focus and dismisses automatic tips with Escape', () => {
    render(
      <Slider
        label="音量"
        defaultValue={30}
        tooltip={{ formatter: (value) => `${value}%` }}
      />,
    )
    const input = screen.getByRole('slider', { name: '音量' })
    fireEvent.focus(input)
    expect(screen.getByRole('tooltip')).toHaveTextContent('30%')
    expect(input).toHaveAttribute('aria-valuetext', '30%')
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).toBeNull()
  })
  it('supports explicit tooltip visibility without breaking standalone tooltip control', () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <Tooltip title="受控提示" open={false} onOpenChange={onOpenChange}>
        <button>帮助</button>
      </Tooltip>,
    )
    fireEvent.focus(screen.getByRole('button', { name: '帮助' }))
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.queryByRole('tooltip')).toBeNull()
    rerender(
      <Tooltip title="受控提示" open onOpenChange={onOpenChange}>
        <button>帮助</button>
      </Tooltip>,
    )
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Escape' })
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(screen.getByRole('tooltip')).toHaveTextContent('受控提示')
    rerender(<Slider tooltip={{ open: true, formatter: null }} />)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })
})

describe('Slider editable nodes', () => {
  it('finds free step and mark values without enumerating dense grids', () => {
    const discrete = createSliderScale(0, 100, null, [20, 50, 80])
    expect(insertSliderValue([20, 80], 47, discrete)).toEqual({
      values: [20, 50, 80],
      index: 1,
    })
    expect(insertSliderValue([20, 50, 80], 49, discrete)).toBeNull()
    expect(suggestSliderValue([0, 20, 50, 80, 100], discrete)).toBeNull()
    expect(suggestSliderValue([20, 80], discrete)).toBe(50)
    expect(
      suggestSliderValue([0, 100], createSliderScale(0, 100, 0.000001)),
    ).toBe(50)
    for (let mask = 0; mask < 32; mask++) {
      const points = [0, 20, 50, 80, 100].filter(
        (_, index) => mask & (1 << index),
      )
      const suggestion = suggestSliderValue(points, discrete)
      if (points.length === 5) expect(suggestion).toBeNull()
      else {
        expect([0, 20, 50, 80, 100]).toContain(suggestion)
        expect(points).not.toContain(suggestion)
      }
    }
  })
  it('adds, snaps, rejects duplicates, respects limits and focuses the inserted node', () => {
    const onChange = vi.fn(),
      onChangeComplete = vi.fn()
    render(
      <Slider
        range
        editable={{ minCount: 1, maxCount: 3 }}
        label="节点"
        defaultValue={[20, 80]}
        step={5}
        onChange={onChange}
        onChangeComplete={onChangeComplete}
      />,
    )
    const draft = screen.getByRole('textbox', { name: '节点新增节点值' })
    fireEvent.change(draft, { target: { value: '21' } })
    fireEvent.click(screen.getByRole('button', { name: '节点添加节点' }))
    expect(screen.getByRole('status')).toHaveTextContent('此位置已有节点')
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.change(draft, { target: { value: '47' } })
    fireEvent.keyDown(draft, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledExactlyOnceWith([20, 45, 80])
    expect(onChangeComplete).toHaveBeenCalledExactlyOnceWith([20, 45, 80])
    expect(screen.getAllByRole('slider')[1]).toHaveFocus()
    expect(screen.getByRole('button', { name: '节点添加节点' })).toBeDisabled()
    fireEvent.keyDown(screen.getAllByRole('slider')[1], { key: 'Delete' })
    expect(onChange).toHaveBeenLastCalledWith([20, 80])
    expect(screen.getAllByRole('slider')[1]).toHaveFocus()
    fireEvent.keyDown(screen.getAllByRole('slider')[1], { key: 'Backspace' })
    expect(onChange).toHaveBeenLastCalledWith([20])
    expect(screen.getByRole('slider')).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('slider'), { key: 'Delete' })
    expect(screen.getAllByRole('slider')).toHaveLength(1)
    expect(
      screen.getByRole('button', { name: '节点移除选中节点' }),
    ).toBeDisabled()
  })
  it('supports empty range values, removing the last node and adding after an empty form reset', async () => {
    const onChange = vi.fn()
    const { container } = render(
      <form aria-label="节点表单">
        <Slider
          range
          editable
          name="nodes"
          label="节点"
          defaultValue={[]}
          onChange={onChange}
        />
        <button type="reset">重置节点</button>
      </form>,
    )
    const form = container.querySelector('form')!
    expect(screen.queryByRole('slider')).toBeNull()
    expect(screen.getByRole('group', { name: '节点' })).not.toHaveAttribute(
      'aria-disabled',
    )
    expect(new FormData(form).get('nodes')).toBe('[]')
    const add = screen.getByRole('button', { name: '节点添加节点' })
    fireEvent.click(add)
    expect(screen.getByRole('slider')).toHaveValue('0')
    expect(screen.getByRole('slider')).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('slider'), { key: 'Delete' })
    expect(screen.queryByRole('slider')).toBeNull()
    expect(add).toHaveFocus()
    expect(new FormData(form).get('nodes')).toBe('[]')
    fireEvent.click(add)
    onChange.mockClear()
    fireEvent.click(screen.getByRole('button', { name: '重置节点' }))
    await waitFor(() => expect(screen.queryByRole('slider')).toBeNull())
    expect(new FormData(form).get('nodes')).toBe('[]')
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.click(add)
    expect(screen.getByRole('slider')).toHaveFocus()
  })
  it('makes one completion for insertion and drag, removes only on release, and cancels drag removal', () => {
    const onChange = vi.fn(),
      onChangeComplete = vi.fn()
    const { container } = render(
      <Slider
        range
        editable
        defaultValue={[20, 80]}
        onChange={onChange}
        onChangeComplete={onChangeComplete}
      />,
    )
    const { root, rail } = geometry(container)
    pointer(rail, 'pointerdown', 50)
    expect(screen.getAllByRole('slider')).toHaveLength(3)
    pointer(root, 'pointermove', 55)
    pointer(root, 'pointerup', 55)
    expect(onChangeComplete).toHaveBeenCalledExactlyOnceWith([20, 55, 80])
    const middle = screen.getAllByRole('slider')[1].parentElement!
    pointer(middle, 'pointerdown', 55)
    pointer(root, 'pointermove', 55, 160)
    expect(screen.getByRole('status')).toHaveTextContent('松开后移除节点')
    expect(screen.getAllByRole('slider')).toHaveLength(3)
    pointer(root, 'pointercancel', 55, 160)
    expect(screen.getAllByRole('slider')).toHaveLength(3)
    expect(onChangeComplete).toHaveBeenCalledTimes(1)
    pointer(middle, 'pointerdown', 55)
    pointer(root, 'pointerup', 55, 160)
    expect(onChange).toHaveBeenLastCalledWith([20, 80])
    expect(onChangeComplete).toHaveBeenLastCalledWith([20, 80])
    expect(screen.getAllByRole('slider')[1]).toHaveFocus()
  })
  it('preserves controlled values until accepted and keeps moved external focus', () => {
    const onChange = vi.fn(),
      onChangeComplete = vi.fn()
    const { rerender } = render(
      <>
        <Slider
          range
          editable
          value={[20, 80]}
          label="节点"
          onChange={onChange}
          onChangeComplete={onChangeComplete}
        />
        <button>外部</button>
      </>,
    )
    const draft = screen.getByRole('textbox', { name: '节点新增节点值' })
    fireEvent.change(draft, { target: { value: '50' } })
    fireEvent.click(screen.getByRole('button', { name: '节点添加节点' }))
    expect(screen.getAllByRole('slider')).toHaveLength(2)
    expect(onChange).toHaveBeenCalledExactlyOnceWith([20, 50, 80])
    act(() => screen.getByRole('button', { name: '外部' }).focus())
    rerender(
      <>
        <Slider
          range
          editable
          value={[20, 50, 80]}
          label="节点"
          onChange={onChange}
          onChangeComplete={onChangeComplete}
        />
        <button>外部</button>
      </>,
    )
    expect(screen.getByRole('button', { name: '外部' })).toHaveFocus()
    expect(screen.getAllByRole('slider')).toHaveLength(3)
  })
  it('blocks editing around frozen nodes, read-only values and disabled fieldsets', () => {
    const onChange = vi.fn()
    const { rerender, container } = render(
      <Slider
        range
        editable
        label="节点"
        value={[20, 80]}
        disabled={[true, false]}
        onChange={onChange}
      />,
    )
    expect(screen.getByRole('button', { name: '节点添加节点' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: '节点移除选中节点' }),
    ).toBeDisabled()
    fireEvent.keyDown(screen.getAllByRole('slider')[1], { key: 'Delete' })
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.keyDown(screen.getAllByRole('slider')[1], { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith([20, 81])
    onChange.mockClear()
    rerender(
      <Slider
        range
        editable
        label="节点"
        value={[20, 80]}
        readOnly
        onChange={onChange}
      />,
    )
    expect(screen.getByRole('textbox')).toBeDisabled()
    rerender(
      <fieldset disabled>
        <Slider
          range
          editable
          label="节点"
          defaultValue={[]}
          onChange={onChange}
        />
      </fieldset>,
    )
    const { rail } = geometry(container)
    pointer(rail, 'pointerdown', 50)
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.queryByRole('slider')).toBeNull()
  })
  it('keeps external node counts and only restricts user edits when limits change', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <Slider
        range
        editable={{ minCount: 2, maxCount: 2 }}
        value={[20, 50, 80]}
        onChange={onChange}
      />,
    )
    expect(screen.getAllByRole('slider')).toHaveLength(3)
    expect(screen.getByRole('button', { name: '数值添加节点' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: '数值移除选中节点' }),
    ).toBeEnabled()
    rerender(
      <Slider
        range
        editable={{ minCount: 2, maxCount: 2 }}
        value={[]}
        onChange={onChange}
      />,
    )
    expect(screen.queryByRole('slider')).toBeNull()
    expect(screen.getByRole('button', { name: '数值添加节点' })).toBeEnabled()
    expect(onChange).not.toHaveBeenCalled()
  })
  it('retains canonical FormData and validation while an uncommitted edit draft is invalid', () => {
    const { container } = render(
      <form>
        <Slider
          range
          editable
          label="节点"
          name="points"
          defaultValue={[20, 80]}
        />
      </form>,
    )
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'invalid' },
    })
    const form = container.querySelector('form')!
    expect(form.checkValidity()).toBe(true)
    expect(new FormData(form).get('points')).toBe('[20,80]')
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' })
    expect(screen.getByRole('status')).toHaveTextContent('请输入有效的节点值')
    expect(new FormData(form).get('points')).toBe('[20,80]')
  })
})

describe('Slider editable session boundaries', () => {
  it('cancels a pending removal when count limits change and preserves the node', () => {
    const complete = vi.fn()
    const { container, rerender } = render(
      <Slider
        range
        editable
        defaultValue={[20, 80]}
        onChangeComplete={complete}
      />,
    )
    const { root } = geometry(container)
    pointer(screen.getAllByRole('slider')[0].parentElement!, 'pointerdown', 20)
    pointer(root, 'pointermove', 20, 160)
    expect(screen.getByRole('status')).toHaveTextContent('松开后移除节点')
    rerender(
      <Slider
        range
        editable={{ minCount: 2 }}
        defaultValue={[20, 80]}
        onChangeComplete={complete}
      />,
    )
    pointer(root, 'pointerup', 20, 160)
    expect(screen.getAllByRole('slider')).toHaveLength(2)
    expect(complete).not.toHaveBeenCalled()
  })
  it('retains nodes after IME or repeated Delete keys and permits explicit buttons when keyboard is off', () => {
    const { rerender } = render(
      <Slider range editable defaultValue={[20, 80]} />,
    )
    const first = screen.getAllByRole('slider')[0]
    fireEvent.keyDown(first, { key: 'Delete', isComposing: true })
    fireEvent.keyDown(first, { key: 'Delete', repeat: true })
    expect(screen.getAllByRole('slider')).toHaveLength(2)
    rerender(<Slider range editable defaultValue={[20, 80]} keyboard={false} />)
    fireEvent.keyDown(first, { key: 'Delete' })
    expect(screen.getAllByRole('slider')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: '数值移除选中节点' }))
    expect(screen.getAllByRole('slider')).toHaveLength(1)
  })
  it('restores an external native form that starts empty and never edits a frozen future slot', async () => {
    const { container, rerender } = render(
      <>
        <form id="empty-slider-form">
          <button type="reset">外部重置</button>
        </form>
        <Slider
          range
          editable
          form="empty-slider-form"
          name="points"
          defaultValue={[]}
        />
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: '数值添加节点' }))
    expect(new FormData(container.querySelector('form')!).get('points')).toBe(
      '[0]',
    )
    fireEvent.click(screen.getByRole('button', { name: '外部重置' }))
    await waitFor(() => expect(screen.queryByRole('slider')).toBeNull())
    expect(new FormData(container.querySelector('form')!).get('points')).toBe(
      '[]',
    )
    rerender(
      <Slider range editable defaultValue={[]} disabled={[false, true]} />,
    )
    expect(screen.getByRole('button', { name: '数值添加节点' })).toBeDisabled()
    expect(screen.getByRole('textbox')).toBeDisabled()
  })
  it('gives editing priority over whole-track dragging and preserves a clicked overlapping handle', () => {
    const { container } = render(
      <Slider range editable draggableTrack defaultValue={[20, 20, 80]} />,
    )
    const { root } = geometry(container)
    expect(container.querySelector('[data-slider-draggable-track]')).toBeNull()
    const first = screen.getAllByRole('slider')[0].parentElement!
    pointer(first, 'pointerdown', 20)
    pointer(root, 'pointermove', 10)
    pointer(root, 'pointerup', 10)
    expect(screen.getAllByRole('slider')[0]).toHaveValue('10')
    expect(screen.getAllByRole('slider')[1]).toHaveValue('20')
  })
})

describe('Slider controlled insertion focus', () => {
  it('waits for the final accepted pointer value before focusing the new handle', () => {
    const onChange = vi.fn()
    const { container, rerender } = render(
      <Slider range editable value={[20, 80]} onChange={onChange} />,
    )
    const { root, rail } = geometry(container)
    act(() => screen.getAllByRole('slider')[0].focus())
    pointer(rail, 'pointerdown', 50)
    expect(screen.getAllByRole('slider')[0]).toHaveFocus()
    pointer(root, 'pointermove', 55)
    pointer(root, 'pointerup', 55)
    expect(onChange).toHaveBeenLastCalledWith([20, 55, 80])
    expect(screen.getAllByRole('slider')).toHaveLength(2)
    rerender(<Slider range editable value={[20, 55, 80]} onChange={onChange} />)
    expect(screen.getAllByRole('slider')[1]).toHaveFocus()
    expect(screen.getAllByRole('slider')[1]).toHaveValue('55')
  })
})
