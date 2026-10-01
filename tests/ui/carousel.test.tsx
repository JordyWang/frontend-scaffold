import { createRef, useEffect } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  Carousel,
  ConfigProvider,
  Input,
  type CarouselHandle,
} from '@/shared/ui'

const items = [
  <Input key="draft" aria-label="轮播草稿" defaultValue="初始" />,
  <p key="two">第二项</p>,
  <button key="three">内容操作</button>,
]
const viewport = () => screen.getByRole('group', { name: '轮播幻灯片' })
const dots = () => screen.getByRole('group', { name: '轮播页码' })
const status = () =>
  screen
    .getByRole('region', { name: '轮播内容' })
    .querySelector('[data-carousel-status]')!
const dot = (index: number) =>
  within(dots()).getByRole('button', { name: `切换到第 ${index + 1} 项` })

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('Carousel', () => {
  it('retains slides once, excludes inactive content and keeps edited input state', () => {
    const mounted = vi.fn()
    function Content() {
      useEffect(mounted, [])
      return <p>副作用内容</p>
    }
    render(<Carousel items={[...items, <Content key="effect" />]} />)
    const input = screen.getByRole('textbox', { name: '轮播草稿' })
    fireEvent.change(input, { target: { value: '保留的草稿' } })
    expect(mounted).toHaveBeenCalledOnce()
    fireEvent.click(dot(1))
    expect(screen.queryByRole('textbox', { name: '轮播草稿' })).toBeNull()
    expect(input.closest('[data-carousel-slide]')).toHaveAttribute('inert')
    expect(input.closest('[data-carousel-slide]')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(mounted).toHaveBeenCalledOnce()
    fireEvent.click(dot(0))
    expect(screen.getByRole('textbox', { name: '轮播草稿' })).toBe(input)
    expect(input).toHaveValue('保留的草稿')
    expect(input.closest('[data-carousel-slide]')).not.toHaveAttribute('inert')
    expect(dot(0)).toHaveAttribute('aria-current', 'true')
    const slide = document.getElementById(
      dot(0).getAttribute('aria-controls')!,
    )!
    expect(slide).toHaveAttribute('aria-roledescription', 'slide')
    expect(slide).toHaveAttribute('aria-label', '1 / 4')
  })

  it('wraps navigation, ignores duplicate requests and keeps controlled state authoritative', () => {
    const before = vi.fn()
    const change = vi.fn()
    const after = vi.fn()
    const { rerender } = render(
      <Carousel
        items={items}
        index={0}
        speed={0}
        onBeforeChange={before}
        onChange={change}
        onAfterChange={after}
      />,
    )
    fireEvent.click(dot(0))
    expect(change).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '上一项' }))
    expect(before).toHaveBeenLastCalledWith(0, 2)
    expect(change).toHaveBeenLastCalledWith(2)
    expect(status()).toHaveTextContent('1 / 3')
    expect(after).not.toHaveBeenCalled()
    rerender(
      <Carousel
        items={items}
        index={2}
        speed={0}
        onChange={change}
        onAfterChange={after}
      />,
    )
    expect(status()).toHaveTextContent('3 / 3')
    expect(after).toHaveBeenLastCalledWith(2)
    fireEvent.click(screen.getByRole('button', { name: '下一项' }))
    expect(change).toHaveBeenLastCalledWith(0)
  })

  it('lets an explicit method reset a clamped controlled value without a redundant transition', () => {
    const ref = createRef<CarouselHandle>()
    const change = vi.fn()
    const before = vi.fn()
    const after = vi.fn()
    render(
      <Carousel
        ref={ref}
        items={[items[0]]}
        index={2}
        onChange={change}
        onBeforeChange={before}
        onAfterChange={after}
      />,
    )
    expect(status()).toHaveTextContent('1 / 1')
    expect(change).not.toHaveBeenCalled()
    act(() => ref.current!.goTo(0, { animate: false }))
    expect(change).toHaveBeenCalledWith(0)
    expect(before).not.toHaveBeenCalled()
    expect(after).not.toHaveBeenCalled()
  })

  it('normalizes non-finite and fractional indices, clears truncated uncontrolled state and shows empty/single states', () => {
    const change = vi.fn()
    const { rerender } = render(
      <Carousel items={items} defaultIndex={2.8} onChange={change} />,
    )
    expect(status()).toHaveTextContent('3 / 3')
    rerender(<Carousel items={[items[0]]} onChange={change} />)
    expect(status()).toHaveTextContent('1 / 1')
    expect(screen.queryByRole('button', { name: '下一项' })).toBeNull()
    rerender(<Carousel items={items} onChange={change} />)
    expect(status()).toHaveTextContent('1 / 3')
    rerender(<Carousel items={items} index={NaN} onChange={change} />)
    expect(status()).toHaveTextContent('1 / 3')
    rerender(<Carousel items={[]} emptyText="没有图片" onChange={change} />)
    expect(screen.getByText('没有图片')).toBeVisible()
    expect(screen.queryByRole('button')).toBeNull()
    expect(change).not.toHaveBeenCalled()
  })

  it('limits finite navigation and keeps keyboard behavior out of slide inputs', () => {
    render(<Carousel items={items} infinite={false} />)
    expect(screen.getByRole('button', { name: '上一项' })).toBeDisabled()
    viewport().focus()
    fireEvent.keyDown(viewport(), { key: 'ArrowLeft' })
    expect(status()).toHaveTextContent('1 / 3')
    const input = screen.getByRole('textbox', { name: '轮播草稿' })
    input.focus()
    fireEvent.keyDown(input, { key: 'End' })
    expect(status()).toHaveTextContent('1 / 3')
    fireEvent.keyDown(viewport(), { key: 'End' })
    expect(screen.getByRole('button', { name: '下一项' })).toBeDisabled()
    fireEvent.keyDown(viewport(), { key: 'ArrowRight' })
    expect(status()).toHaveTextContent('3 / 3')
    fireEvent.keyDown(viewport(), { key: 'Home' })
    expect(status()).toHaveTextContent('1 / 3')
  })

  it('uses a roving dot entry and logical RTL/vertical keyboard navigation', () => {
    render(
      <ConfigProvider direction="rtl">
        <Carousel items={items} dotPlacement="start" />
      </ConfigProvider>,
    )
    expect(screen.getByRole('region', { name: '轮播内容' })).toHaveAttribute(
      'dir',
      'rtl',
    )
    expect(dot(0)).toHaveAttribute('tabindex', '0')
    expect(dot(1)).toHaveAttribute('tabindex', '-1')
    dot(0).focus()
    fireEvent.keyDown(dot(0), { key: 'ArrowLeft' })
    expect(dot(1)).toHaveFocus()
    expect(dot(1)).toHaveAttribute('aria-current', 'true')
    fireEvent.keyDown(dot(1), { key: 'ArrowDown' })
    expect(dot(2)).toHaveFocus()
    fireEvent.keyDown(dot(2), { key: 'ArrowUp' })
    expect(dot(1)).toHaveFocus()
    fireEvent.keyDown(dot(1), { key: 'End' })
    expect(dot(2)).toHaveFocus()
    fireEvent.keyDown(dot(2), { key: 'ArrowLeft' })
    expect(dot(0)).toHaveFocus()
  })

  it('honors prevented keyboard events and preserves focus outside the carousel', () => {
    const renderContent = (index: number) => (
      <>
        <button>外部</button>
        <Carousel
          items={items}
          index={index}
          onKeyDown={(event) => event.preventDefault()}
        />
      </>
    )
    const { rerender } = render(renderContent(0))
    fireEvent.keyDown(viewport(), { key: 'End' })
    expect(status()).toHaveTextContent('1 / 3')
    screen.getByRole('textbox', { name: '轮播草稿' }).focus()
    const outside = screen.getByRole('button', { name: '外部' })
    outside.focus()
    rerender(renderContent(2))
    expect(outside).toHaveFocus()
  })

  it('restores focus after a focused slide or navigation control becomes unavailable', () => {
    const { rerender } = render(<Carousel items={items} index={0} />)
    screen.getByRole('textbox', { name: '轮播草稿' }).focus()
    rerender(<Carousel items={items} index={2} />)
    expect(viewport()).toHaveFocus()
    dot(2).focus()
    rerender(<Carousel items={[]} />)
    expect(viewport()).toHaveFocus()
  })

  it('exposes methods and reports animation completion only after the actual transition', async () => {
    const pending: (() => void)[] = []
    const animations: {
      cancel: ReturnType<typeof vi.fn>
      finished: Promise<void>
    }[] = []
    const animate = vi.fn(() => {
      const animation = {
        cancel: vi.fn(),
        finished: new Promise<void>((resolve) => pending.push(resolve)),
      }
      animations.push(animation)
      return animation
    })
    const original = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'animate',
    )
    Object.defineProperty(HTMLElement.prototype, 'animate', {
      configurable: true,
      value: animate,
    })
    try {
      const ref = createRef<CarouselHandle>()
      const after = vi.fn()
      const { unmount } = render(
        <Carousel ref={ref} items={items} onAfterChange={after} />,
      )
      act(() => ref.current!.next())
      expect(status()).toHaveTextContent('2 / 3')
      expect(animate).toHaveBeenCalledTimes(2)
      expect(after).not.toHaveBeenCalled()
      await act(async () => {
        for (const resolve of pending) resolve()
        await Promise.resolve()
      })
      expect(after).toHaveBeenLastCalledWith(1)
      act(() => ref.current!.goTo(0, { animate: false }))
      expect(animate).toHaveBeenCalledTimes(2)
      expect(after).toHaveBeenLastCalledWith(0)
      act(() => ref.current!.prev())
      expect(status()).toHaveTextContent('3 / 3')
      expect(animate).toHaveBeenCalledTimes(4)
      unmount()
      expect(
        animations.every(
          (animation) => animation.cancel.mock.calls.length === 1,
        ),
      ).toBe(true)
      expect(ref.current).toBeNull()
    } finally {
      if (original)
        Object.defineProperty(HTMLElement.prototype, 'animate', original)
      else Reflect.deleteProperty(HTMLElement.prototype, 'animate')
    }
  })

  it('settles the visible slide once when motion configuration changes during a transition', async () => {
    const pending: (() => void)[] = []
    const cancel = vi.fn()
    const original = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'animate',
    )
    Object.defineProperty(HTMLElement.prototype, 'animate', {
      configurable: true,
      value: () => ({
        cancel,
        finished: new Promise<void>((resolve) => pending.push(resolve)),
      }),
    })
    try {
      const after = vi.fn()
      const { rerender } = render(
        <Carousel items={items} index={0} onAfterChange={after} />,
      )
      rerender(<Carousel items={items} index={1} onAfterChange={after} />)
      expect(after).not.toHaveBeenCalled()
      rerender(
        <Carousel
          items={items}
          index={1}
          effect="fade"
          onAfterChange={after}
        />,
      )
      expect(cancel).toHaveBeenCalledTimes(2)
      expect(after).toHaveBeenCalledExactlyOnceWith(1)
      await act(async () => {
        for (const resolve of pending) resolve()
        await Promise.resolve()
      })
      expect(after).toHaveBeenCalledOnce()
    } finally {
      if (original)
        Object.defineProperty(HTMLElement.prototype, 'animate', original)
      else Reflect.deleteProperty(HTMLElement.prototype, 'animate')
    }
  })

  it('rebinds dot progress when indicators are hidden, restored or moved without leaking old animations', () => {
    const cancel = vi.fn()
    const animate = vi.fn(() => ({ cancel, finished: Promise.resolve() }))
    const original = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'animate',
    )
    Object.defineProperty(HTMLElement.prototype, 'animate', {
      configurable: true,
      value: animate,
    })
    try {
      const { rerender, unmount } = render(
        <Carousel items={items} autoplay dotProgress />,
      )
      expect(animate).toHaveBeenCalledOnce()
      rerender(<Carousel items={items} autoplay dotProgress dots={false} />)
      expect(cancel).toHaveBeenCalledOnce()
      expect(animate).toHaveBeenCalledOnce()
      rerender(
        <Carousel items={items} autoplay dotProgress dotPlacement="bottom" />,
      )
      expect(animate).toHaveBeenCalledTimes(2)
      rerender(
        <Carousel items={items} autoplay dotProgress dotPlacement="top" />,
      )
      expect(cancel).toHaveBeenCalledTimes(2)
      expect(animate).toHaveBeenCalledTimes(3)
      unmount()
      expect(cancel).toHaveBeenCalledTimes(3)
    } finally {
      if (original)
        Object.defineProperty(HTMLElement.prototype, 'animate', original)
      else Reflect.deleteProperty(HTMLElement.prototype, 'animate')
    }
  })

  it('keeps controlled autoplay requests running and uses the latest callback without restarting the interval', () => {
    vi.useFakeTimers()
    const first = vi.fn()
    const next = vi.fn()
    const { rerender, unmount } = render(
      <Carousel
        items={items}
        index={0}
        autoplay
        interval={1000}
        onChange={first}
      />,
    )
    act(() => vi.advanceTimersByTime(500))
    rerender(
      <Carousel
        items={items}
        index={0}
        autoplay
        interval={1000}
        onChange={next}
      />,
    )
    act(() => vi.advanceTimersByTime(500))
    expect(first).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith(1)
    act(() => vi.advanceTimersByTime(1000))
    expect(next).toHaveBeenCalledTimes(2)
    unmount()
    act(() => vi.advanceTimersByTime(5000))
    expect(next).toHaveBeenCalledTimes(2)
  })

  it('stops finite autoplay at the final slide and can restart explicitly from the beginning', () => {
    vi.useFakeTimers()
    render(<Carousel items={items} autoplay infinite={false} interval={1000} />)
    act(() => vi.advanceTimersByTime(1000))
    act(() => vi.advanceTimersByTime(1000))
    expect(status()).toHaveTextContent('3 / 3')
    expect(status()).toHaveAttribute('aria-live', 'polite')
    act(() => vi.advanceTimersByTime(5000))
    expect(status()).toHaveTextContent('3 / 3')
    fireEvent.click(screen.getByRole('button', { name: '开始自动播放' }))
    expect(status()).toHaveTextContent('1 / 3')
    expect(status()).toHaveAttribute('aria-live', 'off')
  })

  it('pauses in a hidden document and restarts with a fresh interval when visible', () => {
    vi.useFakeTimers()
    render(<Carousel items={items} autoplay interval={1000} />)
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    fireEvent(document, new Event('visibilitychange'))
    act(() => vi.advanceTimersByTime(3000))
    expect(status()).toHaveTextContent('1 / 3')
    hidden.mockReturnValue(false)
    fireEvent(document, new Event('visibilitychange'))
    act(() => vi.advanceTimersByTime(1000))
    expect(status()).toHaveTextContent('2 / 3')
  })

  it('resets a reduced-motion override when the preference changes and pauses on hover or touch', () => {
    vi.useFakeTimers()
    let matches = true
    let change = () => {}
    vi.stubGlobal('matchMedia', () => ({
      get matches() {
        return matches
      },
      addEventListener: (_: string, callback: () => void) => {
        change = callback
      },
      removeEventListener: vi.fn(),
    }))
    render(<Carousel items={items} autoplay interval={1000} />)
    expect(status()).toHaveAttribute('aria-live', 'polite')
    fireEvent.click(screen.getByRole('button', { name: '开始自动播放' }))
    act(() => vi.advanceTimersByTime(1000))
    expect(status()).toHaveTextContent('2 / 3')
    act(() => {
      matches = false
      change()
    })
    act(() => {
      matches = true
      change()
    })
    act(() => vi.advanceTimersByTime(1000))
    expect(status()).toHaveTextContent('2 / 3')
    fireEvent.click(screen.getByRole('button', { name: '开始自动播放' }))
    fireEvent.touchStart(viewport())
    expect(status()).toHaveAttribute('aria-live', 'polite')
    fireEvent.click(screen.getByRole('button', { name: '开始自动播放' }))
    fireEvent.mouseEnter(screen.getByRole('region', { name: '轮播内容' }))
    expect(status()).toHaveAttribute('aria-live', 'polite')
  })

  it('treats invalid intervals as the default and re-enables autoplay as a fresh request', () => {
    vi.useFakeTimers()
    const { rerender } = render(
      <Carousel items={items} autoplay interval={NaN} />,
    )
    act(() => vi.advanceTimersByTime(3999))
    expect(status()).toHaveTextContent('1 / 3')
    act(() => vi.advanceTimersByTime(1))
    expect(status()).toHaveTextContent('2 / 3')
    fireEvent.mouseEnter(screen.getByRole('region', { name: '轮播内容' }))
    rerender(<Carousel items={items} autoplay={false} />)
    rerender(<Carousel items={items} autoplay interval={1000} />)
    expect(status()).toHaveAttribute('aria-live', 'off')
    act(() => vi.advanceTimersByTime(1000))
    expect(status()).toHaveTextContent('3 / 3')
  })

  it('keeps autoplay paused if enabled while an input already holds focus', () => {
    vi.useFakeTimers()
    const { rerender } = render(
      <Carousel items={items} autoplay={false} interval={1000} />,
    )
    act(() => screen.getByRole('textbox', { name: '轮播草稿' }).focus())
    rerender(<Carousel items={items} autoplay interval={1000} />)
    expect(status()).toHaveAttribute('aria-live', 'polite')
    act(() => vi.advanceTimersByTime(3000))
    expect(status()).toHaveTextContent('1 / 3')
  })

  it('recognizes deliberate swipes while ignoring vertical motion, cancellation and interactive targets', () => {
    const { rerender } = render(<Carousel items={items} />)
    function pointer(
      type: string,
      target: HTMLElement,
      x: number,
      y = 0,
      pointerType = 'touch',
    ) {
      const event = new Event(type, { bubbles: true, cancelable: true })
      Object.assign(event, {
        pointerId: 1,
        isPrimary: true,
        button: 0,
        clientX: x,
        clientY: y,
        pointerType,
      })
      fireEvent(target, event)
    }
    const input = screen.getByRole('textbox', { name: '轮播草稿' })
    pointer('pointerdown', input, 100)
    pointer('pointerup', input, 0)
    expect(status()).toHaveTextContent('1 / 3')
    pointer('pointerdown', viewport(), 100)
    pointer('pointerup', viewport(), 90, 100)
    expect(status()).toHaveTextContent('1 / 3')
    pointer('pointerdown', viewport(), 100)
    pointer('pointercancel', viewport(), 0)
    pointer('pointerup', viewport(), 0)
    expect(status()).toHaveTextContent('1 / 3')
    pointer('pointerdown', viewport(), 100)
    pointer('pointerup', viewport(), 0)
    expect(status()).toHaveTextContent('2 / 3')
    pointer('pointerdown', viewport(), 100, 0, 'mouse')
    pointer('pointerup', viewport(), 0, 0, 'mouse')
    expect(status()).toHaveTextContent('2 / 3')
    rerender(<Carousel items={items} draggable dir="rtl" />)
    pointer('pointerdown', viewport(), 0, 0, 'mouse')
    pointer('pointerup', viewport(), 100, 0, 'mouse')
    expect(status()).toHaveTextContent('3 / 3')
    rerender(<Carousel items={items} swipe={false} />)
    pointer('pointerdown', viewport(), 100)
    pointer('pointerup', viewport(), 0)
    expect(status()).toHaveTextContent('3 / 3')
  })
})
