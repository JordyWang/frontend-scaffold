import { createRef } from 'react'
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
  ColorPicker,
  ConfigProvider,
  Form,
  FormField,
  FormItem,
  type ColorPickerHandle,
} from '@/shared/ui'
import {
  colorFromPoint,
  colorToHex,
  colorToRgb,
  displayPickerColor,
  normalizePickerColor,
  parsePickerColor,
  rgbToColor,
} from '@/shared/ui/color-picker-state'

function key(control: HTMLElement, key: string) {
  fireEvent.keyDown(control, { key })
  fireEvent.keyUp(control, { key })
}
function open(label = '颜色') {
  fireEvent.click(screen.getByRole('button', { name: label, exact: true }))
  return screen.getByRole('dialog', { name: `${label}选择面板` })
}
function pointer(target: Element, type: string, x: number, y: number) {
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

describe('ColorPicker canonical colors', () => {
  it('round-trips an independently enumerated RGB cube and alpha bytes', () => {
    for (const r of [0, 1, 22, 128, 254, 255])
      for (const g of [0, 1, 22, 128, 254, 255])
        for (const b of [0, 1, 22, 128, 254, 255])
          for (const alpha of [0, 128, 255]) {
            const color = rgbToColor({ r, g, b, a: alpha / 255 })
            const hex = `#${[r, g, b, ...(alpha === 255 ? [] : [alpha])].map((n) => n.toString(16).padStart(2, '0')).join('')}`
            expect(colorToHex(color)).toBe(hex)
            expect(colorToRgb(parsePickerColor(hex)!)).toEqual({
              r,
              g,
              b,
              a: alpha / 255,
            })
          }
  })
  it('parses supported Hex, RGB and HSB strings including shorthand and percentages', () => {
    for (const [raw, canonical] of [
      ['#abc', '#aabbcc'],
      ['#1234', '#11223344'],
      ['#1677FF80', '#1677ff80'],
      ['rgb(100% 0% 0% / 50%)', '#ff000080'],
      ['rgba(22, 119, 255, 0.5)', '#1677ff80'],
      ['hsb(120, 100%, 100%)', '#00ff00'],
      ['hsba(360deg, 100%, 100%, 50%)', '#ff000080'],
      ['transparent', '#00000000'],
    ])
      expect(normalizePickerColor(raw)).toBe(canonical)
    expect(normalizePickerColor('#1234', true)).toBe('#112233')
    expect(normalizePickerColor('')).toBe('')
    expect(normalizePickerColor(undefined)).toBe('#000000')
  })
  it('rejects invalid drafts, unsupported CSS and out-of-range channels', () => {
    for (const raw of [
      '',
      '#12',
      '#12345',
      'red',
      'rgb(256, 0, 0)',
      'rgba(0,0,0,2)',
      'rgb(0,,0)',
      'rgb(0 0 0 / 0.5 / 0.5)',
      'hsb(-1,100%,100%)',
      'hsb(0,101%,100%)',
      'rgb(0x20,0,0)',
      'var(--primary)',
      'url(https://example.com)',
    ])
      expect(parsePickerColor(raw)).toBeNull()
    expect(normalizePickerColor('invalid')).toBe('#000000')
  })
  it('formats presentation without losing the canonical color and preserves an achromatic hue', () => {
    expect(displayPickerColor('#ff000080', 'rgb')).toBe(
      'rgba(255, 0, 0, 0.502)',
    )
    expect(displayPickerColor('#00ff00', 'hsb')).toBe('hsb(120, 100%, 100%)')
    expect(parsePickerColor('#808080', 215)!.h).toBe(215)
    expect(
      colorFromPoint({ h: 120, s: 0, b: 0, a: 0.5 }, 50, 25, 100, 100),
    ).toEqual({ h: 120, s: 50, b: 75, a: 0.5 })
    expect(
      colorFromPoint({ h: 120, s: 0, b: 0, a: 1 }, -50, 200, 100, 100),
    ).toEqual({ h: 120, s: 0, b: 0, a: 1 })
  })
})

describe('ColorPicker panels and fields', () => {
  it('opens the project panel, links field semantics and restores focus on Escape', () => {
    render(
      <FormField
        label="主题色"
        error="需要有效颜色"
        control={<ColorPicker label="主题色" defaultValue="#abc" showText />}
      />,
    )
    const trigger = screen.getByRole('button', { name: '主题色', exact: true })
    expect(trigger).toHaveAttribute('value', '#aabbcc')
    expect(trigger).toHaveAttribute('aria-labelledby')
    expect(trigger).toHaveAttribute('aria-describedby')
    expect(trigger).toHaveAttribute('aria-invalid', 'true')
    const panel = open('主题色')
    expect(trigger).toHaveAttribute('aria-controls', panel.id)
    expect(
      within(panel).getByRole('slider', { name: '主题色色相' }),
    ).toHaveFocus()
    key(within(panel).getByRole('slider', { name: '主题色色相' }), 'Escape')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(trigger).toHaveFocus()
  })
  it('changes independent color channels and completes changed keyboard sessions only once', () => {
    const change = vi.fn(),
      complete = vi.fn()
    render(
      <ColorPicker
        label="颜色"
        defaultValue="#ff0000"
        onChange={change}
        onChangeComplete={complete}
      />,
    )
    const panel = open()
    const hue = within(panel).getByRole('slider', { name: '颜色色相' })
    for (let count = 0; count < 3; count++)
      fireEvent.keyDown(hue, { key: 'ArrowRight' })
    expect(complete).not.toHaveBeenCalled()
    fireEvent.keyUp(hue, { key: 'ArrowRight' })
    expect(complete).toHaveBeenCalledExactlyOnceWith('#ff0d00')
    key(within(panel).getByRole('slider', { name: '颜色透明度' }), 'Home')
    expect(change).toHaveBeenLastCalledWith('#ff0d0000')
    expect(complete).toHaveBeenLastCalledWith('#ff0d0000')
  })
  it('switches formats independently, edits channels, accepts alpha and rejects invalid drafts', () => {
    const change = vi.fn(),
      formatChange = vi.fn(),
      complete = vi.fn()
    render(
      <ColorPicker
        defaultValue="#ff0000"
        onChange={change}
        onFormatChange={formatChange}
        onChangeComplete={complete}
      />,
    )
    const panel = open()
    const input = within(panel).getByRole('textbox', { name: '颜色颜色值' })
    fireEvent.change(
      within(panel).getByRole('combobox', { name: '颜色编码格式' }),
      { target: { value: 'rgb' } },
    )
    expect(input).toHaveValue('rgb(255, 0, 0)')
    expect(formatChange).toHaveBeenCalledExactlyOnceWith('rgb')
    expect(change).not.toHaveBeenCalled()
    fireEvent.change(input, { target: { value: 'rgba(0, 255, 0, 0.5)' } })
    key(input, 'Enter')
    expect(
      screen.getByRole('button', { name: '颜色', exact: true }),
    ).toHaveAttribute('value', '#00ff0080')
    expect(complete).toHaveBeenCalledExactlyOnceWith('#00ff0080')
    fireEvent.change(input, { target: { value: 'invalid' } })
    key(input, 'Enter')
    expect(within(panel).getByRole('alert')).toHaveTextContent('请输入有效')
    expect(change).toHaveBeenCalledTimes(1)
    key(input, 'Escape')
    expect(within(panel).queryByRole('alert')).toBeNull()
    expect(input).toHaveValue('rgba(0, 255, 0, 0.5)')
    expect(screen.getByRole('dialog')).toBe(panel)
    fireEvent.change(
      within(panel).getByRole('spinbutton', { name: '颜色RGB R' }),
      { target: { value: '255' } },
    )
    fireEvent.blur(within(panel).getByRole('spinbutton', { name: '颜色RGB R' }))
    expect(change).toHaveBeenLastCalledWith('#ffff0080')
    expect(complete).toHaveBeenLastCalledWith('#ffff0080')
  })
  it('uses pointer coordinates for both channels and cancels completion without reverting live values', () => {
    const change = vi.fn(),
      complete = vi.fn()
    render(
      <ColorPicker
        defaultValue="#00ff00"
        onChange={change}
        onChangeComplete={complete}
      />,
    )
    const panel = open(),
      area = panel.querySelector<HTMLElement>('[data-color-area]')!
    vi.spyOn(area, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    pointer(area, 'pointerdown', 100, 50)
    expect(change).toHaveBeenLastCalledWith('#008000')
    pointer(area, 'pointermove', 50, 0)
    expect(change).toHaveBeenLastCalledWith('#80ff80')
    expect(complete).not.toHaveBeenCalled()
    pointer(area, 'pointercancel', 50, 0)
    expect(complete).not.toHaveBeenCalled()
    expect(
      screen.getByRole('button', { name: '颜色', exact: true }),
    ).toHaveAttribute('value', '#80ff80')
    pointer(area, 'pointerdown', 100, 0)
    pointer(area, 'pointerup', 100, 0)
    expect(complete).toHaveBeenCalledExactlyOnceWith('#00ff00')
  })
  it('holds controlled values until accepted and does not publish format normalization', () => {
    const change = vi.fn(),
      complete = vi.fn()
    const { rerender } = render(
      <ColorPicker
        value="#ff0000"
        defaultFormat="rgb"
        onChange={change}
        onChangeComplete={complete}
      />,
    )
    const panel = open(),
      input = within(panel).getByRole('textbox')
    fireEvent.change(input, { target: { value: '#00ff00' } })
    key(input, 'Enter')
    expect(change).toHaveBeenCalledExactlyOnceWith('#00ff00')
    expect(complete).toHaveBeenCalledExactlyOnceWith('#00ff00')
    expect(
      screen.getByRole('button', { name: '颜色', exact: true }),
    ).toHaveAttribute('value', '#ff0000')
    rerender(
      <ColorPicker
        value="#00ff00"
        defaultFormat="rgb"
        onChange={change}
        onChangeComplete={complete}
      />,
    )
    expect(input).toHaveValue('rgb(0, 255, 0)')
    rerender(<ColorPicker value={undefined} onChange={change} />)
    expect(
      screen.getByRole('button', { name: '颜色', exact: true }),
    ).toHaveAttribute('value', '#000000')
    expect(change).toHaveBeenCalledTimes(1)
  })
  it('preserves hidden hue and saturation changes for black or gray before brightness increases', () => {
    const change = vi.fn()
    render(<ColorPicker defaultValue="#000000" onChange={change} />)
    const panel = open()
    const hue = within(panel).getByRole('slider', { name: '颜色色相' })
    key(hue, 'End')
    expect(hue).toHaveValue('360')
    key(within(panel).getByRole('slider', { name: '颜色饱和度' }), 'End')
    expect(change).not.toHaveBeenCalled()
    key(within(panel).getByRole('slider', { name: '颜色亮度' }), 'End')
    expect(change).toHaveBeenCalledExactlyOnceWith('#ff0000')
  })
  it('applies opaque mode to every editing source and protects read-only/disabled controls', () => {
    const change = vi.fn()
    const { rerender } = render(
      <ColorPicker
        defaultValue="#ff000080"
        disabledAlpha
        disabledFormat
        onChange={change}
      />,
    )
    const panel = open()
    expect(
      within(panel).queryByRole('slider', { name: '颜色透明度' }),
    ).toBeNull()
    expect(within(panel).getByRole('combobox')).toBeDisabled()
    const input = within(panel).getByRole('textbox')
    fireEvent.change(input, { target: { value: '#00ff0080' } })
    key(input, 'Enter')
    expect(change).toHaveBeenLastCalledWith('#00ff00')
    rerender(<ColorPicker readOnly defaultValue="#ff0000" onChange={change} />)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(
      screen.getByRole('button', { name: '颜色', exact: true }),
    ).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(screen.getByRole('button', { name: '颜色', exact: true }))
    expect(screen.queryByRole('dialog')).toBeNull()
    rerender(<ColorPicker mode="panel" disabled onChange={change} />)
    for (const control of screen.getAllByRole('slider'))
      expect(control).toBeDisabled()
  })
  it('selects labeled presets, ignores invalid colors and clears canonically once', () => {
    const change = vi.fn(),
      complete = vi.fn(),
      clear = vi.fn()
    render(
      <ColorPicker
        allowClear
        onChange={change}
        onChangeComplete={complete}
        onClear={clear}
        presets={[
          {
            key: 'brand',
            label: '常用色',
            colors: [
              { value: '#1677ff80', label: '半透明蓝' },
              { value: 'invalid', label: '无效色' },
            ],
          },
        ]}
      />,
    )
    const panel = open()
    expect(within(panel).queryByRole('button', { name: '无效色' })).toBeNull()
    fireEvent.click(within(panel).getByRole('button', { name: '半透明蓝' }))
    expect(change).toHaveBeenCalledExactlyOnceWith('#1677ff80')
    expect(complete).toHaveBeenCalledExactlyOnceWith('#1677ff80')
    expect(
      within(panel).getByRole('button', { name: '半透明蓝' }),
    ).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(within(panel).getByRole('button', { name: '清除颜色' }))
    expect(change).toHaveBeenLastCalledWith('')
    expect(complete).toHaveBeenLastCalledWith('')
    expect(clear).toHaveBeenCalledTimes(1)
    expect(
      within(panel).getByRole('button', { name: '清除颜色' }),
    ).toBeDisabled()
  })
  it('uses a common focus/blur handle across popup, panel and native modes', () => {
    const ref = createRef<ColorPickerHandle>()
    const { rerender } = render(<ColorPicker ref={ref} />)
    act(() => ref.current!.focus())
    expect(
      screen.getByRole('button', { name: '颜色', exact: true }),
    ).toHaveFocus()
    act(() => ref.current!.blur())
    expect(
      screen.getByRole('button', { name: '颜色', exact: true }),
    ).not.toHaveFocus()
    rerender(<ColorPicker mode="panel" ref={ref} />)
    act(() => ref.current!.focus())
    expect(screen.getByRole('slider', { name: '颜色色相' })).toHaveFocus()
    rerender(<ColorPicker mode="native" ref={ref} />)
    act(() => ref.current!.focus())
    expect(screen.getByLabelText('颜色')).toHaveFocus()
    expect(screen.getByLabelText('颜色')).toHaveAttribute('type', 'color')
  })
  it('autofocuses the first available inline control and retains concise HSB channel values', () => {
    render(
      <ColorPicker
        mode="panel"
        autoFocus
        defaultValue="#1677ff"
        defaultFormat="hsb"
      />,
    )
    expect(screen.getByRole('slider', { name: '颜色色相' })).toHaveFocus()
    expect(screen.getByRole('spinbutton', { name: '颜色HSB H' })).toHaveValue(
      215.02,
    )
    expect(screen.getByRole('spinbutton', { name: '颜色HSB S' })).toHaveValue(
      91.37,
    )
    expect(screen.getByRole('spinbutton', { name: '颜色HSB B' })).toHaveValue(
      100,
    )
  })
  it('keeps fractional HSB channels valid in native inline forms', () => {
    const { container } = render(
      <form>
        <ColorPicker
          mode="panel"
          name="color"
          defaultValue="#1677ff"
          defaultFormat="hsb"
        />
      </form>,
    )
    const form = container.querySelector('form')!
    expect(form.checkValidity()).toBe(true)
    expect(new FormData(form).get('color')).toBe('#1677ff')
  })
  it('recovers owned popup focus when the control becomes read-only or disabled', () => {
    const { rerender, container } = render(<ColorPicker />)
    const panel = open()
    expect(
      within(panel).getByRole('slider', { name: '颜色色相' }),
    ).toHaveFocus()
    rerender(<ColorPicker readOnly />)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(
      screen.getByRole('button', { name: '颜色', exact: true }),
    ).toHaveFocus()
    rerender(<ColorPicker />)
    open()
    rerender(<ColorPicker disabled />)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(container.querySelector('[data-color-root]')).toHaveFocus()
  })
  it('does not reclaim outside focus when an externally controlled popup closes', () => {
    const { rerender } = render(
      <>
        <ColorPicker open />
        <button>下一字段</button>
      </>,
    )
    const outside = screen.getByRole('button', { name: '下一字段' })
    act(() => outside.focus())
    rerender(
      <>
        <ColorPicker open={false} />
        <button>下一字段</button>
      </>,
    )
    expect(outside).toHaveFocus()
  })
  it('validates cleared native fields, isolates draft errors and resets without value callbacks', async () => {
    const change = vi.fn()
    const { container } = render(
      <form>
        <ColorPicker
          name="color"
          required
          allowClear
          defaultValue="#ff0000"
          onChange={change}
        />
        <button type="reset">重置颜色</button>
      </form>,
    )
    const form = container.querySelector('form')!
    const panel = open(),
      input = within(panel).getByRole('textbox')
    fireEvent.change(input, { target: { value: 'invalid' } })
    expect(form.checkValidity()).toBe(true)
    expect(new FormData(form).get('color')).toBe('#ff0000')
    fireEvent.click(within(panel).getByRole('button', { name: '清除颜色' }))
    let valid = true
    act(() => {
      valid = form.checkValidity()
    })
    expect(valid).toBe(false)
    expect(
      screen.getByRole('button', { name: '颜色', exact: true }),
    ).toHaveFocus()
    expect(
      screen.getByRole('button', { name: '颜色', exact: true }),
    ).toHaveAttribute('aria-invalid', 'true')
    expect(new FormData(form).get('color')).toBe('')
    change.mockClear()
    fireEvent.click(screen.getByRole('button', { name: '重置颜色' }))
    await waitFor(() => expect(new FormData(form).get('color')).toBe('#ff0000'))
    expect(change).not.toHaveBeenCalled()
    expect(form.checkValidity()).toBe(true)
  })
  it('supports external form reset and respects a cancelled reset', async () => {
    const { container } = render(
      <>
        <form id="external">
          <button type="reset">外部重置</button>
        </form>
        <ColorPicker form="external" name="color" defaultValue="#ff0000" />
      </>,
    )
    const form = container.querySelector('form')!
    const input = within(open()).getByRole('textbox')
    fireEvent.change(input, { target: { value: '#00ff00' } })
    key(input, 'Enter')
    form.addEventListener('reset', (event) => event.preventDefault(), {
      once: true,
    })
    fireEvent.click(screen.getByRole('button', { name: '外部重置' }))
    await act(async () => {
      await Promise.resolve()
    })
    expect(new FormData(form).get('color')).toBe('#00ff00')
    fireEvent.click(screen.getByRole('button', { name: '外部重置' }))
    await waitFor(() => expect(new FormData(form).get('color')).toBe('#ff0000'))
  })
  it('submits through project Form and validates an empty color', async () => {
    const finish = vi.fn(),
      fail = vi.fn()
    render(
      <Form
        initialValues={{ color: '' }}
        onFinish={finish}
        onFinishFailed={fail}
      >
        <FormItem
          name="color"
          label="颜色"
          rules={[{ required: true, message: '请选择颜色' }]}
          control={<ColorPicker label="颜色" allowClear />}
        />
        <button type="submit">提交</button>
      </Form>,
    )
    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() => expect(fail).toHaveBeenCalledTimes(1))
    const input = within(open()).getByRole('textbox')
    fireEvent.change(input, { target: { value: '#1677ff80' } })
    key(input, 'Enter')
    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() =>
      expect(finish).toHaveBeenCalledExactlyOnceWith({ color: '#1677ff80' }),
    )
  })
  it('keeps format and open state controlled and follows RTL portal direction', () => {
    const openChange = vi.fn(),
      formatChange = vi.fn()
    const { rerender } = render(
      <ConfigProvider direction="rtl">
        <ColorPicker
          open={false}
          format="hex"
          onOpenChange={openChange}
          onFormatChange={formatChange}
        />
      </ConfigProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: '颜色', exact: true }))
    expect(openChange).toHaveBeenCalledExactlyOnceWith(true)
    expect(screen.queryByRole('dialog')).toBeNull()
    rerender(
      <ConfigProvider direction="rtl">
        <ColorPicker
          open
          format="hex"
          onOpenChange={openChange}
          onFormatChange={formatChange}
        />
      </ConfigProvider>,
    )
    const panel = screen.getByRole('dialog')
    expect(panel).toHaveAttribute('dir', 'rtl')
    fireEvent.change(within(panel).getByRole('combobox'), {
      target: { value: 'rgb' },
    })
    expect(formatChange).toHaveBeenCalledExactlyOnceWith('rgb')
    expect(within(panel).getByRole('combobox')).toHaveValue('hex')
  })
})
