export type ColorPickerFormat = 'hex' | 'rgb' | 'hsb'
export type PickerColor = { h: number; s: number; b: number; a: number }
export type RgbaColor = { r: number; g: number; b: number; a: number }

const clamp = (value: number, max: number) => Math.max(0, Math.min(max, value))
const round = (value: number, digits = 2) => Number(value.toFixed(digits))
const byte = (value: number) => Math.round(clamp(value, 255))
const hexByte = (value: number) => byte(value).toString(16).padStart(2, '0')

export function colorToRgb(color: PickerColor): RgbaColor {
  const h = (((color.h % 360) + 360) % 360) / 60
  const s = clamp(color.s, 100) / 100,
    b = clamp(color.b, 100) / 100
  const chroma = b * s,
    second = chroma * (1 - Math.abs((h % 2) - 1)),
    base = b - chroma
  const components =
    h < 1
      ? [chroma, second, 0]
      : h < 2
        ? [second, chroma, 0]
        : h < 3
          ? [0, chroma, second]
          : h < 4
            ? [0, second, chroma]
            : h < 5
              ? [second, 0, chroma]
              : [chroma, 0, second]
  return {
    r: byte((components[0] + base) * 255),
    g: byte((components[1] + base) * 255),
    b: byte((components[2] + base) * 255),
    a: clamp(color.a, 1),
  }
}
export function rgbToColor(
  { r, g, b, a }: RgbaColor,
  fallbackHue = 0,
): PickerColor {
  const red = r / 255,
    green = g / 255,
    blue = b / 255
  const max = Math.max(red, green, blue),
    min = Math.min(red, green, blue),
    delta = max - min
  let h = fallbackHue
  if (delta) {
    h =
      max === red
        ? ((green - blue) / delta) % 6
        : max === green
          ? (blue - red) / delta + 2
          : (red - green) / delta + 4
    h = (h * 60 + 360) % 360
  }
  return { h, s: max ? (delta / max) * 100 : 0, b: max * 100, a }
}
export function colorToHex(color: PickerColor) {
  const { r, g, b, a } = colorToRgb(color)
  const alpha = byte(a * 255)
  return `#${hexByte(r)}${hexByte(g)}${hexByte(b)}${alpha === 255 ? '' : hexByte(alpha)}`
}

function numeric(raw: string, max: number) {
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)) return null
  const value = Number(raw)
  return Number.isFinite(value) && value >= 0 && value <= max ? value : null
}
function channel(raw: string, max: number) {
  if (raw.endsWith('%')) {
    const value = numeric(raw.slice(0, -1), 100)
    return value === null ? null : (value * max) / 100
  }
  return numeric(raw, max)
}
/** Parse the project's Hex, RGB and HSB strings; invalid drafts never become black silently. */
export function parsePickerColor(
  raw: string,
  fallbackHue = 0,
): PickerColor | null {
  const value = raw.trim().toLowerCase()
  if (value === 'transparent') return { h: fallbackHue, s: 0, b: 0, a: 0 }
  const hex = /^#([\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/.exec(value)
  if (hex) {
    const expanded =
      hex[1].length < 5
        ? [...hex[1]].map((digit) => digit + digit).join('')
        : hex[1]
    return rgbToColor(
      {
        r: parseInt(expanded.slice(0, 2), 16),
        g: parseInt(expanded.slice(2, 4), 16),
        b: parseInt(expanded.slice(4, 6), 16),
        a: expanded.length === 8 ? parseInt(expanded.slice(6), 16) / 255 : 1,
      },
      fallbackHue,
    )
  }
  const functional = /^(rgb|rgba|hsb|hsba)\(([^()]*)\)$/.exec(value)
  if (!functional) return null
  const [, format, body] = functional
  let tokens: string[]
  if (body.includes(',')) tokens = body.split(',').map((part) => part.trim())
  else {
    const parts = body.trim().split('/')
    if (parts.length > 2) return null
    tokens = parts[0].trim().split(/\s+/)
    if (parts.length === 2) tokens.push(parts[1].trim())
  }
  if (
    tokens.some((token) => !token) ||
    (tokens.length !== 3 && tokens.length !== 4) ||
    (format.endsWith('a') && tokens.length !== 4)
  )
    return null
  const a = tokens.length === 4 ? channel(tokens[3], 1) : 1
  if (a === null) return null
  if (format.startsWith('rgb')) {
    const values = tokens.slice(0, 3).map((token) => channel(token, 255))
    if (values.some((item) => item === null)) return null
    return rgbToColor(
      { r: values[0]!, g: values[1]!, b: values[2]!, a },
      fallbackHue,
    )
  }
  const h = numeric(tokens[0].replace(/deg$/, ''), 360),
    s = channel(tokens[1], 100),
    b = channel(tokens[2], 100)
  return h === null || s === null || b === null ? null : { h: h % 360, s, b, a }
}
export function normalizePickerColor(raw?: string, disabledAlpha = false) {
  if (raw === '') return ''
  const color = parsePickerColor(raw ?? '#000000') ?? { h: 0, s: 0, b: 0, a: 1 }
  return colorToHex(disabledAlpha ? { ...color, a: 1 } : color)
}
export function displayPickerColor(
  raw: string,
  format: ColorPickerFormat,
  fallback?: PickerColor,
) {
  if (!raw) return ''
  const color = fallback ?? parsePickerColor(raw)!
  if (format === 'hex') return colorToHex(color)
  if (format === 'hsb')
    return `${color.a === 1 ? 'hsb' : 'hsba'}(${round(color.h)}, ${round(color.s)}%, ${round(color.b)}%${color.a === 1 ? '' : `, ${round(color.a, 3)}`})`
  const rgb = colorToRgb(color)
  return `${rgb.a === 1 ? 'rgb' : 'rgba'}(${rgb.r}, ${rgb.g}, ${rgb.b}${rgb.a === 1 ? '' : `, ${round(rgb.a, 3)}`})`
}
export function colorFromPoint(
  color: PickerColor,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  return {
    ...color,
    s: width > 0 ? clamp((x / width) * 100, 100) : 0,
    b: height > 0 ? 100 - clamp((y / height) * 100, 100) : 0,
  }
}
