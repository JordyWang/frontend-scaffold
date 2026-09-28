import { describe, expect, it } from 'vitest'
import {
  derivePrimaryTokens,
  deriveStatusTokens,
} from '@/shared/ui/theme-colors'

function contrastRatio(first: string, second: string) {
  const luminance = (color: string) => {
    const channels = [1, 3, 5].map((index) => {
      const value = Number.parseInt(color.slice(index, index + 2), 16) / 255
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  }
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a)
  return (values[0] + 0.05) / (values[1] + 0.05)
}

describe('primary theme derivation', () => {
  it('chooses readable button text for light, dark and middle luminance seeds', () => {
    expect(derivePrimaryTokens('#0f766e')?.onPrimary).toBe('#ffffff')
    expect(derivePrimaryTokens('#5eead4')?.onPrimary).toBe('#111827')
    expect(derivePrimaryTokens('#777777')?.onPrimary).toBe('#000000')
  })

  it('moves interaction colors toward higher contrast with the chosen text', () => {
    for (const seed of ['#0f766e', '#5eead4', '#777777']) {
      const palette = derivePrimaryTokens(seed)
      if (!palette?.hover || !palette.active)
        throw new Error('Missing derived palette')
      const baseContrast = contrastRatio(seed, palette.onPrimary)
      expect(baseContrast).toBeGreaterThanOrEqual(4.5)
      expect(
        contrastRatio(palette.hover, palette.onPrimary),
      ).toBeGreaterThanOrEqual(baseContrast)
      expect(
        contrastRatio(palette.active, palette.onPrimary),
      ).toBeGreaterThanOrEqual(baseContrast)
    }
  })

  it('preserves an explicit foreground and leaves non-hex colors to the caller', () => {
    expect(derivePrimaryTokens('#5eead4', '#ffffff')?.onPrimary).toBe('#ffffff')
    expect(derivePrimaryTokens('var(--brand)')).toBeNull()
    expect(derivePrimaryTokens('0f766e')).toBeNull()
  })

  it('derives readable status foregrounds for custom destructive colors', () => {
    expect(deriveStatusTokens('#fb7185')?.onStatus).toBe('#111827')
    expect(deriveStatusTokens('#b91c1c')?.onStatus).toBe('#ffffff')
    expect(deriveStatusTokens('var(--error)')).toBeNull()
    expect(deriveStatusTokens('var(--error)', '#ffffff')?.onStatus).toBe(
      '#ffffff',
    )
  })
})
