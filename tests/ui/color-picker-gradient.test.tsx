import { useState } from 'react'
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ColorPicker, ConfigProvider, Form, FormItem } from '@/shared/ui'
import {
  gradientToCss,
  insertGradientStop,
  normalizePickerPaint,
  parsePickerGradient,
  sampleGradient,
  suggestGradientPosition,
} from '@/shared/ui/color-picker-gradient-state'

const blue = 'linear-gradient(90deg, #1677ff 0%, #13c2c2 100%)'
const redBlue = 'linear-gradient(90deg, #ff0000 0%, #0000ff 100%)'
function key(target: HTMLElement, value: string, options = {}) {
  fireEvent.keyDown(target, { key: value, ...options })
  fireEvent.keyUp(target, { key: value, ...options })
}
function editor() {
  return screen.getByRole('group', { name: '颜色渐变编辑', exact: true })
}
function stops() {
  return within(editor()).getAllByRole('slider')
}
function canonical() {
  return document
    .querySelector('[data-color-root]')!
    .getAttribute('data-color-value')
}
function pointer(target: HTMLElement, type: string, x: number) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX: x,
    clientY: 20,
  })
  Object.defineProperty(event, 'pointerId', { value: 1 })
  fireEvent(target, event)
}

describe('ColorPicker gradient strings and interpolation', () => {
  it('parses nested color functions and normalizes alpha, ordering and precision', () => {
    const result = parsePickerGradient(
      'linear-gradient(to right, rgba(22, 119, 255, .5) 100%, rgb(100% 0% 0%) 0%, #1234 33.333%)',
    )!
    expect(result).toEqual([
      { color: '#ff0000', percent: 0 },
      { color: '#11223344', percent: 33.33 },
      { color: '#1677ff80', percent: 100 },
    ])
    expect(gradientToCss(result)).toBe(
      'linear-gradient(90deg, #ff0000 0%, #11223344 33.33%, #1677ff80 100%)',
    )
    expect(gradientToCss(parsePickerGradient(blue)!, true)).toBe(
      'linear-gradient(90deg, #13c2c2 0%, #1677ff 100%)',
    )
    expect(
      parsePickerGradient('linear-gradient(90deg, #fff 50%, #000 50%)'),
    ).toEqual([
      { color: '#ffffff', percent: 50 },
      { color: '#000000', percent: 50 },
    ])
  })
  it('rejects unsupported directions, implicit positions and arbitrary CSS without throwing', () => {
    for (const raw of [
      'linear-gradient(#fff, #000)',
      'linear-gradient(180deg, #fff 0%, #000 100%)',
      'linear-gradient(90deg, #fff)',
      'linear-gradient(90deg, red 0%, #000 100%)',
      'linear-gradient(90deg, #fff -1%, #000 100%)',
      'linear-gradient(90deg, #fff 0%, #000 101%)',
      'linear-gradient(90deg, rgb(0,0,0 0%, #fff 100%)',
      'linear-gradient(90deg, url(test) 0%, #000 100%)',
      'linear-gradient(90deg, #fff 0%, #000 100%); color:red',
    ])
      expect(parsePickerGradient(raw)).toBeNull()
  })
  it('keeps empty values and applies mode and opacity normalization without callbacks', () => {
    expect(normalizePickerPaint('', false, ['gradient'])).toBe('')
    expect(normalizePickerPaint('#abc8', true, ['gradient'])).toBe(
      'linear-gradient(90deg, #aabbcc 0%, #aabbcc 100%)',
    )
    expect(normalizePickerPaint(blue, false, ['single'])).toBe('#1677ff')
    expect(normalizePickerPaint('invalid', false, ['gradient'])).toBe(
      'linear-gradient(90deg, #000000 0%, #000000 100%)',
    )
  })
  it('interpolates independent opaque and premultiplied alpha reference colors', () => {
    const opaque = parsePickerGradient(redBlue)!
    expect(sampleGradient(opaque, 25)).toBe('#bf0040')
    expect(sampleGradient(opaque, 50)).toBe('#800080')
    expect(sampleGradient(parsePickerGradient(blue)!, 50)).toBe('#159de1')
    expect(
      sampleGradient(
        [
          { color: '#ff0000', percent: 0 },
          { color: '#0000ff00', percent: 100 },
        ],
        50,
      ),
    ).toBe('#ff000080')
    expect(
      sampleGradient(
        [
          { color: '#ff0000', percent: 20 },
          { color: '#00ff00', percent: 20 },
          { color: '#0000ff', percent: 80 },
        ],
        20,
      ),
    ).toBe('#00ff00')
    expect(sampleGradient(opaque, -1)).toBe('#ff0000')
    expect(sampleGradient(opaque, 101)).toBe('#0000ff')
  })
  it('inserts interpolated stops without mutating input and suggests the largest unoccupied gap', () => {
    const original = parsePickerGradient(redBlue)!
    const inserted = insertGradientStop(original, 50)!
    expect(inserted.index).toBe(1)
    expect(inserted.stops[1]).toEqual({ color: '#800080', percent: 50 })
    expect(original).toHaveLength(2)
    expect(insertGradientStop(inserted.stops, 50)).toBeNull()
    expect(insertGradientStop(original, NaN)).toBeNull()
    expect(suggestGradientPosition(inserted.stops)).toBe(25)
    expect(
      suggestGradientPosition(
        Array.from({ length: 10001 }, (_, index) => ({
          color: '#000000',
          percent: index / 100,
        })),
      ),
    ).toBeNull()
  })
})

describe('ColorPicker gradient editing', () => {
  it('edits only the selected stop with the shared color controls and preserves canonical output across formats', () => {
    const change = vi.fn(),
      complete = vi.fn()
    render(
      <ColorPicker
        mode="panel"
        colorMode="gradient"
        defaultValue={redBlue}
        onChange={change}
        onChangeComplete={complete}
      />,
    )
    fireEvent.click(
      within(editor()).getByRole('button', { name: /选择第 2 色标/ }),
    )
    const input = screen.getByRole('textbox', { name: '颜色颜色值' })
    expect(input).toHaveValue('#0000ff')
    fireEvent.change(input, { target: { value: 'rgba(0,255,0,.5)' } })
    key(input, 'Enter')
    expect(change).toHaveBeenCalledExactlyOnceWith(
      'linear-gradient(90deg, #ff0000 0%, #00ff0080 100%)',
    )
    expect(complete).toHaveBeenCalledExactlyOnceWith(canonical())
    fireEvent.change(screen.getByRole('combobox', { name: '颜色编码格式' }), {
      target: { value: 'rgb' },
    })
    expect(input).toHaveValue('rgba(0, 255, 0, 0.5)')
    expect(change).toHaveBeenCalledTimes(1)
  })
  it('adds and removes stops with focus recovery and enforces the two-stop floor', () => {
    const complete = vi.fn()
    render(
      <ColorPicker
        mode="panel"
        colorMode="gradient"
        defaultValue={redBlue}
        onChangeComplete={complete}
      />,
    )
    expect(screen.getByRole('button', { name: '移除第 1 色标' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '添加色标' }))
    expect(stops()).toHaveLength(3)
    expect(stops()[1]).toHaveFocus()
    expect(canonical()).toBe(
      'linear-gradient(90deg, #ff0000 0%, #800080 50%, #0000ff 100%)',
    )
    expect(complete).toHaveBeenCalledTimes(1)
    key(stops()[1], 'Delete')
    expect(stops()).toHaveLength(2)
    expect(stops()[1]).toHaveFocus()
    expect(canonical()).toBe(redBlue)
    expect(complete).toHaveBeenCalledTimes(2)
    key(stops()[1], 'Backspace')
    expect(stops()).toHaveLength(2)
  })
  it('keeps repeat and IME delete events from removing stops', () => {
    render(
      <ColorPicker
        mode="panel"
        colorMode="gradient"
        defaultValue="linear-gradient(90deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)"
      />,
    )
    key(stops()[1], 'Delete', { repeat: true })
    key(stops()[1], 'Delete', { isComposing: true })
    key(stops()[1], 'Delete', { keyCode: 229 })
    expect(stops()).toHaveLength(3)
  })
  it('moves positions with RTL-aware keys and adjacent boundaries without changing stop colors', () => {
    const change = vi.fn(),
      complete = vi.fn()
    render(
      <ConfigProvider direction="rtl">
        <ColorPicker
          mode="panel"
          colorMode="gradient"
          defaultValue="linear-gradient(90deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)"
          onChange={change}
          onChangeComplete={complete}
        />
      </ConfigProvider>,
    )
    act(() => stops()[1].focus())
    key(stops()[1], 'ArrowLeft')
    expect(canonical()).toBe(
      'linear-gradient(90deg, #ff0000 0%, #00ff00 50.01%, #0000ff 100%)',
    )
    expect(screen.getByRole('textbox', { name: '颜色颜色值' })).toHaveValue(
      '#00ff00',
    )
    key(stops()[1], 'End')
    expect(stops()[1]).toHaveValue('100')
    expect(complete).toHaveBeenCalledTimes(2)
    key(stops()[1], 'ArrowLeft')
    expect(change).toHaveBeenCalledTimes(2)
  })
  it('inserts and drags a rail stop in one pointer session; cancellation suppresses completion', () => {
    const complete = vi.fn()
    const { container } = render(
      <ColorPicker
        mode="panel"
        colorMode="gradient"
        defaultValue={redBlue}
        onChangeComplete={complete}
      />,
    )
    const rail = editor().querySelector<HTMLElement>('[data-slider-rail]')!
    vi.spyOn(rail, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      width: 100,
      height: 44,
      right: 100,
      bottom: 44,
      toJSON: () => ({}),
    })
    pointer(rail, 'pointerdown', 25)
    pointer(
      container.querySelector<HTMLElement>('[data-color-gradient]')!,
      'pointermove',
      40,
    )
    pointer(
      container.querySelector<HTMLElement>('[data-color-gradient]')!,
      'pointerup',
      40,
    )
    expect(canonical()).toBe(
      'linear-gradient(90deg, #ff0000 0%, #bf0040 40%, #0000ff 100%)',
    )
    expect(complete).toHaveBeenCalledTimes(1)
    pointer(rail, 'pointerdown', 60)
    pointer(rail, 'pointercancel', 60)
    expect(complete).toHaveBeenCalledTimes(1)
    key(screen.getByRole('textbox', { name: '颜色颜色值' }), 'Enter')
    expect(complete).toHaveBeenCalledTimes(1)
  })
  it('keeps pointer cancellation from leaking into an unrelated unchanged color commit', () => {
    const complete = vi.fn()
    render(
      <ColorPicker
        mode="panel"
        colorMode="gradient"
        defaultValue={redBlue}
        onChangeComplete={complete}
      />,
    )
    key(stops()[0], 'ArrowRight')
    complete.mockClear()
    const rail = editor().querySelector<HTMLElement>('[data-slider-rail]')!
    vi.spyOn(rail, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 44,
      right: 100,
      bottom: 44,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    pointer(stops()[0], 'pointerdown', 0)
    pointer(rail, 'pointermove', 20)
    pointer(stops()[0], 'pointercancel', 20)
    expect(canonical()).toBe(
      'linear-gradient(90deg, #ff0000 20.01%, #0000ff 100%)',
    )
    key(screen.getByRole('textbox', { name: '颜色颜色值' }), 'Enter')
    expect(complete).not.toHaveBeenCalled()
  })
  it('switches allowed modes with one completion and keeps clear genuinely empty', () => {
    const change = vi.fn(),
      complete = vi.fn(),
      mode = vi.fn()
    render(
      <ColorPicker
        mode="panel"
        colorMode={['single', 'gradient']}
        defaultValue="#1677ff80"
        allowClear
        onChange={change}
        onChangeComplete={complete}
        onColorModeChange={mode}
      />,
    )
    fireEvent.click(screen.getByRole('radio', { name: '渐变' }))
    expect(canonical()).toBe(
      'linear-gradient(90deg, #1677ff80 0%, #1677ff80 100%)',
    )
    expect(mode).toHaveBeenCalledExactlyOnceWith('gradient')
    expect(complete).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('radio', { name: '单色' }))
    expect(canonical()).toBe('#1677ff80')
    expect(complete).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByRole('radio', { name: '渐变' }))
    fireEvent.click(screen.getByRole('button', { name: '清除颜色' }))
    expect(canonical()).toBe('')
    expect(screen.getByRole('button', { name: '清除颜色' })).toBeDisabled()
    expect(change).toHaveBeenLastCalledWith('')
  })
  it('applies gradient and single presets consistently and strips every stop alpha when required', () => {
    render(
      <ColorPicker
        mode="panel"
        colorMode="gradient"
        disabledAlpha
        defaultValue={blue}
        presets={[
          {
            key: 'brand',
            label: '品牌',
            colors: [
              {
                value: 'linear-gradient(90deg, #ff000080 0%, #00ff0040 100%)',
                label: '渐变预设',
              },
              { value: '#0000ff80', label: '单点蓝' },
            ],
          },
        ]}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '渐变预设' }))
    expect(canonical()).toBe('linear-gradient(90deg, #ff0000 0%, #00ff00 100%)')
    fireEvent.click(
      within(editor()).getByRole('button', { name: /选择第 2 色标/ }),
    )
    fireEvent.click(screen.getByRole('button', { name: '单点蓝' }))
    expect(canonical()).toBe('linear-gradient(90deg, #ff0000 0%, #0000ff 100%)')
    expect(screen.queryByRole('slider', { name: '颜色透明度' })).toBeNull()
  })
  it('holds controlled values and waits for acceptance before focusing an inserted stop', () => {
    const change = vi.fn(),
      complete = vi.fn()
    const { rerender } = render(
      <ColorPicker
        mode="panel"
        colorMode="gradient"
        value={redBlue}
        onChange={change}
        onChangeComplete={complete}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '添加色标' }))
    const next = 'linear-gradient(90deg, #ff0000 0%, #800080 50%, #0000ff 100%)'
    expect(change).toHaveBeenCalledExactlyOnceWith(next)
    expect(complete).toHaveBeenCalledExactlyOnceWith(next)
    expect(canonical()).toBe(redBlue)
    expect(stops()).toHaveLength(2)
    rerender(
      <ColorPicker
        mode="panel"
        colorMode="gradient"
        value={next}
        onChange={change}
        onChangeComplete={complete}
      />,
    )
    expect(stops()[1]).toHaveFocus()
  })
  it('does not reclaim outside focus after deferred controlled acceptance', () => {
    const change = vi.fn()
    const { rerender } = render(
      <>
        <ColorPicker
          mode="panel"
          colorMode="gradient"
          value={redBlue}
          onChange={change}
        />
        <button>外部操作</button>
      </>,
    )
    fireEvent.click(screen.getByRole('button', { name: '添加色标' }))
    const outside = screen.getByRole('button', { name: '外部操作' })
    act(() => outside.focus())
    rerender(
      <>
        <ColorPicker
          mode="panel"
          colorMode="gradient"
          value={change.mock.calls[0][0]}
          onChange={change}
        />
        <button>外部操作</button>
      </>,
    )
    expect(outside).toHaveFocus()
  })
  it('protects read-only controls and dynamic disabling terminates a live insertion', () => {
    const complete = vi.fn()
    const { rerender } = render(
      <ColorPicker
        mode="panel"
        colorMode="gradient"
        defaultValue={blue}
        readOnly
        onChangeComplete={complete}
      />,
    )
    expect(screen.getByRole('button', { name: '添加色标' })).toBeDisabled()
    expect(stops()[0]).toBeDisabled()
    rerender(
      <ColorPicker
        mode="panel"
        colorMode="gradient"
        defaultValue={blue}
        onChangeComplete={complete}
      />,
    )
    const rail = editor().querySelector<HTMLElement>('[data-slider-rail]')!
    vi.spyOn(rail, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 44,
      right: 100,
      bottom: 44,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    pointer(rail, 'pointerdown', 50)
    rerender(
      <ColorPicker
        mode="panel"
        colorMode="gradient"
        defaultValue={blue}
        disabled
        onChangeComplete={complete}
      />,
    )
    pointer(rail, 'pointerup', 50)
    expect(complete).not.toHaveBeenCalled()
  })
  it('submits canonical gradients, validates clear and resets external native forms silently', async () => {
    const change = vi.fn()
    const { container } = render(
      <>
        <form id="paint">
          <button type="reset">重置</button>
        </form>
        <ColorPicker
          form="paint"
          name="paint"
          mode="panel"
          colorMode="gradient"
          defaultValue={blue}
          required
          allowClear
          onChange={change}
        />
      </>,
    )
    const form = container.querySelector('form')!
    expect(new FormData(form).get('paint')).toBe(blue)
    expect(form.checkValidity()).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: '清除颜色' }))
    act(() => {
      expect(form.checkValidity()).toBe(false)
    })
    change.mockClear()
    fireEvent.click(screen.getByRole('button', { name: '重置' }))
    await waitFor(() => expect(new FormData(form).get('paint')).toBe(blue))
    expect(change).not.toHaveBeenCalled()
    expect(stops()).toHaveLength(2)
  })
  it('submits gradients through the project Form string contract', async () => {
    const finish = vi.fn()
    render(
      <Form initialValues={{ paint: blue }} onFinish={finish}>
        <FormItem
          name="paint"
          label="渐变"
          control={<ColorPicker label="渐变" colorMode="gradient" />}
        />
        <button type="submit">提交</button>
      </Form>,
    )
    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() =>
      expect(finish).toHaveBeenCalledExactlyOnceWith({ paint: blue }),
    )
  })
  it('keeps mode controls out of native FormData and restores focus when the switch is removed', () => {
    const { container, rerender } = render(
      <form>
        <ColorPicker
          mode="panel"
          colorMode={['single', 'gradient']}
          name="paint"
          defaultValue={blue}
        />
      </form>,
    )
    const form = container.querySelector('form')!
    expect([...new FormData(form).entries()]).toEqual([['paint', blue]])
    act(() => screen.getByRole('radio', { name: '渐变' }).focus())
    rerender(
      <form>
        <ColorPicker
          mode="panel"
          colorMode="gradient"
          name="paint"
          defaultValue={blue}
        />
      </form>,
    )
    expect(stops()[0]).toHaveFocus()
    expect([...new FormData(form).entries()]).toEqual([['paint', blue]])
  })
  it('preserves gradient structure when native reset is cancelled and adapts native mode to an opaque first stop', async () => {
    const { container, rerender } = render(
      <form onReset={(event) => event.preventDefault()}>
        <ColorPicker
          mode="panel"
          colorMode="gradient"
          name="paint"
          defaultValue={blue}
        />
        <button type="reset">取消的重置</button>
      </form>,
    )
    const form = container.querySelector('form')!
    fireEvent.click(screen.getByRole('button', { name: '添加色标' }))
    const added = canonical()
    fireEvent.click(screen.getByRole('button', { name: '取消的重置' }))
    await act(async () => {
      await Promise.resolve()
    })
    expect(new FormData(form).get('paint')).toBe(added)
    expect(stops()).toHaveLength(3)
    rerender(
      <ColorPicker
        mode="native"
        colorMode="gradient"
        value="linear-gradient(90deg, #1677ff80 0%, #13c2c200 100%)"
      />,
    )
    expect(screen.getByLabelText('颜色')).toHaveValue('#1677ff')
  })
  it('supports completion-only control without publishing a partial stop edit', () => {
    function Example() {
      const [value, setValue] = useState(redBlue)
      return (
        <ColorPicker
          mode="panel"
          colorMode="gradient"
          value={value}
          onChangeComplete={setValue}
        />
      )
    }
    render(<Example />)
    fireEvent.keyDown(stops()[0], { key: 'ArrowRight' })
    expect(canonical()).toBe(redBlue)
    fireEvent.keyUp(stops()[0], { key: 'ArrowRight' })
    expect(canonical()).toBe(
      'linear-gradient(90deg, #ff0000 0.01%, #0000ff 100%)',
    )
  })
})
