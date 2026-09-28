type Rgb = { r: number; g: number; b: number }

function parseHex(color: string): Rgb | null {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())
  if (!match) return null
  const value = match[1]
  const full =
    value.length === 3
      ? [...value].map((digit) => digit + digit).join('')
      : value
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  }
}

function luminance({ r, g, b }: Rgb) {
  const channels = [r, g, b].map((channel) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

function contrast(first: Rgb, second: Rgb) {
  const a = luminance(first)
  const b = luminance(second)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

function mix(base: Rgb, target: Rgb, amount: number): Rgb {
  return {
    r: Math.round(base.r * (1 - amount) + target.r * amount),
    g: Math.round(base.g * (1 - amount) + target.g * amount),
    b: Math.round(base.b * (1 - amount) + target.b * amount),
  }
}

function toHex({ r, g, b }: Rgb) {
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

const white = { r: 255, g: 255, b: 255 }
const ink = { r: 17, g: 24, b: 39 }
const black = { r: 0, g: 0, b: 0 }

function chooseForeground(background: Rgb) {
  const whiteRatio = contrast(white, background)
  const inkRatio = contrast(ink, background)
  if (whiteRatio >= 4.5 || inkRatio >= 4.5) {
    return whiteRatio >= inkRatio ? '#ffffff' : '#111827'
  }
  return contrast(black, background) > whiteRatio ? '#000000' : '#ffffff'
}

function accessibleVariant(background: Rgb, foreground: Rgb, amount: number) {
  const lighter = mix(background, white, amount)
  const darker = mix(background, black, amount)
  return toHex(
    contrast(foreground, lighter) >= contrast(foreground, darker)
      ? lighter
      : darker,
  )
}

/** Derive readable button text and interaction colors for a hex primary seed. */
export function derivePrimaryTokens(primary: string, onPrimary?: string) {
  const background = parseHex(primary)
  if (!background) return null
  const foreground = onPrimary ?? chooseForeground(background)
  const foregroundRgb = parseHex(foreground)
  return {
    onPrimary: foreground,
    hover: foregroundRgb
      ? accessibleVariant(background, foregroundRgb, 0.08)
      : undefined,
    active: foregroundRgb
      ? accessibleVariant(background, foregroundRgb, 0.16)
      : undefined,
  }
}

/** Derive a readable foreground for a status or destructive surface. */
export function deriveStatusTokens(seed: string, onStatus?: string) {
  const background = parseHex(seed)
  if (!background) return onStatus ? { onStatus } : null
  return { onStatus: onStatus ?? chooseForeground(background) }
}
