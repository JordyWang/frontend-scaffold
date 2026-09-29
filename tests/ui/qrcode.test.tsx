import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { QRCode } from '@/shared/ui'

afterEach(() => vi.restoreAllMocks())

describe('QRCode', () => {
  it('renders a labelled SVG QR code with project colors', () => {
    render(
      <QRCode
        value="https://ant.design/index-cn"
        type="svg"
        color="#1677ff"
        bgColor="#eff6ff"
        aria-label="文档二维码"
      />,
    )

    const image = screen.getByRole('img', { name: '文档二维码' })
    expect(image.tagName).toBe('svg')
    expect(image).toHaveAttribute('viewBox')
    expect(image.querySelectorAll('rect').length).toBeGreaterThan(10)
    expect(image.querySelector('rect[fill="#1677ff"]')).toBeTruthy()
    expect(
      document.querySelector('[data-qrcode-type="svg"]'),
    ).toBeInTheDocument()
  })

  it('shows an expired state and exposes a refresh action', () => {
    const onRefresh = vi.fn()
    render(
      <QRCode
        value="refresh-me"
        status="expired"
        onRefresh={onRefresh}
        type="svg"
      />,
    )

    expect(screen.getByText('二维码已失效')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '刷新' }))
    expect(onRefresh).toHaveBeenCalledOnce()
  })

  it('supports custom status rendering and loading semantics', () => {
    const statusRender = vi.fn(({ status, onRefresh }) => (
      <button type="button" onClick={onRefresh}>
        {status} 状态
      </button>
    ))
    render(
      <QRCode
        value="loading"
        status="loading"
        statusRender={statusRender}
        type="svg"
      />,
    )

    expect(statusRender).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'loading',
        onRefresh: expect.any(Function),
      }),
    )
    expect(
      screen.getByRole('button', { name: 'loading 状态' }),
    ).toBeInTheDocument()
  })

  it('keeps a canvas variant available for touch-sized layouts', () => {
    const context = {
      fillStyle: '',
      fillRect: vi.fn(),
      setTransform: vi.fn(),
    }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    )
    render(<QRCode value="canvas" type="canvas" size={96} />)
    const canvas = document.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas?.getAttribute('aria-label')).toBe('二维码')
    expect(document.querySelector('[data-qrcode-type="canvas"]')).toHaveStyle({
      width: '96px',
      height: '96px',
    })
  })
})
