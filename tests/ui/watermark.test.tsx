import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Watermark } from '@/shared/ui'

afterEach(() => vi.restoreAllMocks())

describe('Watermark', () => {
  it('keeps content interactive and restores a removed decorative overlay', async () => {
    const fillText = vi.fn()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      scale: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      fillText,
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/png;base64,watermark',
    )
    const onAction = vi.fn()
    const onRemove = vi.fn()
    const { container } = render(
      <Watermark content={['内部', '水印']} onRemove={onRemove}>
        <button type="button" onClick={onAction}>
          内容操作
        </button>
      </Watermark>,
    )
    await waitFor(() =>
      expect(
        container.querySelector('[data-watermark-overlay]'),
      ).not.toBeNull(),
    )
    expect(fillText).toHaveBeenCalledTimes(2)
    const overlay = container.querySelector(
      '[data-watermark-overlay]',
    ) as HTMLElement
    expect(overlay).toHaveAttribute('aria-hidden', 'true')
    expect(overlay).toHaveClass('pointer-events-none')
    fireEvent.click(screen.getByRole('button', { name: '内容操作' }))
    expect(onAction).toHaveBeenCalledOnce()

    overlay.remove()
    await waitFor(() => expect(container.contains(overlay)).toBe(true))
    expect(onRemove).toHaveBeenCalledOnce()
  })
})
