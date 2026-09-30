import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BackTop } from '@/shared/ui'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('BackTop', () => {
  it('tracks an element threshold and scroll progress, then returns it to the top', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    Object.defineProperties(container, {
      scrollHeight: { configurable: true, value: 1000 },
      clientHeight: { configurable: true, value: 200 },
    })
    const scrollTo = vi.fn()
    container.scrollTo = scrollTo

    const { unmount } = render(
      <BackTop target={() => container} visibilityHeight={100} showProgress />,
    )
    expect(screen.queryByRole('button', { name: '回到顶部' })).toBeNull()

    container.scrollTop = 500
    fireEvent.scroll(container)
    const button = await screen.findByRole('button', { name: '回到顶部' })
    expect(button).toHaveAttribute('data-ui-back-top')
    expect(button.querySelector('[data-scroll-progress]')).toHaveAttribute(
      'data-scroll-progress',
      '63',
    )
    fireEvent.click(button)
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })

    container.scrollTop = 100
    fireEvent.scroll(container)
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: '回到顶部' })).toBeNull(),
    )
    unmount()
    container.remove()
  })

  it('uses immediate scrolling when reduced motion is requested', async () => {
    const scrollY = Object.getOwnPropertyDescriptor(window, 'scrollY')
    const scrollHeight = Object.getOwnPropertyDescriptor(
      document.documentElement,
      'scrollHeight',
    )
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 500,
    })
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 1500,
    })
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})

    try {
      render(<BackTop visibilityHeight={200} />)
      fireEvent.click(await screen.findByRole('button', { name: '回到顶部' }))
      expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })
    } finally {
      if (scrollY) Object.defineProperty(window, 'scrollY', scrollY)
      if (scrollHeight)
        Object.defineProperty(
          document.documentElement,
          'scrollHeight',
          scrollHeight,
        )
    }
  })
})
