import {
  colorToHex,
  colorToRgb,
  displayPickerColor,
  normalizePickerColor,
  parsePickerColor,
  rgbToColor,
  type ColorPickerFormat,
} from './color-picker-state'

export type ColorPickerColorMode = 'single' | 'gradient'
export type ColorPickerStop = { color: string; percent: number }

const position = (value: number) =>
  Math.round(Math.max(0, Math.min(100, value)) * 100) / 100

/** Split only outside color functions; arbitrary CSS is never evaluated. */
function splitStops(body: string) {
  let depth = 0,
    start = 0
  const parts: string[] = []
  for (let index = 0; index < body.length; index++) {
    if (body[index] === '(') depth++
    else if (body[index] === ')') depth--
    else if (body[index] === ',' && !depth) {
      parts.push(body.slice(start, index).trim())
      start = index + 1
    }
    if (depth < 0) return null
  }
  if (depth) return null
  parts.push(body.slice(start).trim())
  return parts
}
export function parsePickerGradient(
  raw: string,
  disabledAlpha = false,
): ColorPickerStop[] | null {
  const match = /^linear-gradient\((.*)\)$/is.exec(raw.trim())
  if (!match) return null
  const parts = splitStops(match[1])
  if (
    !parts ||
    !/^(?:90deg|to right)$/i.test(parts.shift() ?? '') ||
    parts.length < 2
  )
    return null
  const stops: ColorPickerStop[] = []
  for (const part of parts) {
    const stop = /^(.*?)\s+((?:\d+(?:\.\d*)?|\.\d+))%$/.exec(part)
    if (!stop) return null
    const color = parsePickerColor(stop[1]),
      percent = Number(stop[2])
    if (!color || !Number.isFinite(percent) || percent > 100) return null
    stops.push({
      color: colorToHex(disabledAlpha ? { ...color, a: 1 } : color),
      percent: position(percent),
    })
  }
  return stops.sort((a, b) => a.percent - b.percent)
}
export function gradientToCss(
  stops: ColorPickerStop[],
  reverse = false,
  format: ColorPickerFormat = 'hex',
) {
  const ordered = reverse ? [...stops].reverse() : stops
  return `linear-gradient(90deg, ${ordered.map((stop) => `${displayPickerColor(stop.color, format)} ${reverse ? position(100 - stop.percent) : stop.percent}%`).join(', ')})`
}
export function normalizePickerPaint(
  raw: string | undefined,
  disabledAlpha: boolean,
  modes: ColorPickerColorMode[],
) {
  if (raw === '') return ''
  const gradient = raw && parsePickerGradient(raw, disabledAlpha)
  if (gradient)
    return modes.includes('gradient')
      ? gradientToCss(gradient)
      : gradient[0].color
  const color = normalizePickerColor(raw, disabledAlpha)
  return modes.includes('single')
    ? color
    : gradientToCss([
        { color, percent: 0 },
        { color, percent: 100 },
      ])
}
export function displayPickerPaint(raw: string, format: ColorPickerFormat) {
  const gradient = parsePickerGradient(raw)
  return gradient
    ? gradientToCss(gradient, false, format)
    : displayPickerColor(raw, format)
}
/** CSS gradients interpolate premultiplied sRGB, so transparent endpoints keep their hue. */
export function sampleGradient(stops: ColorPickerStop[], percent: number) {
  let left = stops[0]
  if (percent < left.percent) return left.color
  for (let index = 1; index < stops.length; index++) {
    const right = stops[index]
    if (percent < right.percent) {
      const ratio = (percent - left.percent) / (right.percent - left.percent)
      const a = colorToRgb(parsePickerColor(left.color)!),
        b = colorToRgb(parsePickerColor(right.color)!)
      const alpha = a.a * (1 - ratio) + b.a * ratio
      const mix = (channel: 'r' | 'g' | 'b') =>
        alpha
          ? (a[channel] * a.a * (1 - ratio) + b[channel] * b.a * ratio) / alpha
          : a[channel] * (1 - ratio) + b[channel] * ratio
      return colorToHex(
        rgbToColor({
          r: Math.round(mix('r')),
          g: Math.round(mix('g')),
          b: Math.round(mix('b')),
          a: alpha,
        }),
      )
    }
    left = right
  }
  return left.color
}
export function insertGradientStop(stops: ColorPickerStop[], percent: number) {
  if (!Number.isFinite(percent)) return null
  const at = position(percent)
  if (stops.some((stop) => stop.percent === at)) return null
  const added = { color: sampleGradient(stops, at), percent: at }
  const next = [...stops, added].sort((a, b) => a.percent - b.percent)
  return { stops: next, index: next.indexOf(added) }
}
export function suggestGradientPosition(stops: ColorPickerStop[]) {
  const points = [0, ...stops.map((stop) => stop.percent), 100]
  const occupied = new Set(stops.map((stop) => stop.percent))
  let gap = 0,
    next: number | null = null
  for (let index = 1; index < points.length; index++) {
    const width = points[index] - points[index - 1]
    const candidate = position((points[index] + points[index - 1]) / 2)
    if (width > gap && !occupied.has(candidate)) {
      gap = width
      next = candidate
    }
  }
  return next
}
