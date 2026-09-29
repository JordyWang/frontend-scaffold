import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BorderBeam } from '@/shared/ui'

describe('BorderBeam', () => {
  it('keeps content accessible while exposing configurable decoration', () => {
    render(
      <BorderBeam
        aria-label="边框示例"
        color="#1677ff"
        duration={4}
        borderWidth={2}
        reverse
      >
        <button type="button">内容操作</button>
      </BorderBeam>,
    )
    const root = screen.getByRole('button', { name: '内容操作' }).parentElement
      ?.parentElement
    expect(root).toHaveAttribute('data-border-beam')
    expect(root).toHaveAttribute('aria-label', '边框示例')
    const beam = root?.querySelector('[data-border-beam-light]')
    expect(beam).toHaveStyle({
      animationDuration: '4s',
      animationDirection: 'reverse',
    })
    expect(beam).toHaveStyle({
      background:
        'conic-gradient(from 0deg, transparent 0deg, transparent 300deg, #1677ff 340deg, transparent 360deg)',
    })
  })
})
