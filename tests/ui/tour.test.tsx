import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Tour } from '@/shared/ui'

afterEach(() => vi.restoreAllMocks())

const steps = [
  { key: 'one', title: '第一步', description: '先看这里' },
  { key: 'two', title: '第二步', description: '再看这里' },
]

describe('Tour', () => {
  it('moves with keyboard and calls finish/close callbacks', () => {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    })
    const onChange = vi.fn()
    const onFinish = vi.fn()
    const onClose = vi.fn()
    function ControlledTour() {
      const [current, setCurrent] = useState(0)
      const [open, setOpen] = useState(true)
      return (
        <>
          <button type="button">打开前焦点</button>
          <Tour
            open={open}
            current={current}
            steps={steps}
            onChange={(next) => {
              setCurrent(next)
              onChange(next)
            }}
            onFinish={() => {
              setOpen(false)
              onFinish()
            }}
            onClose={() => {
              setOpen(false)
              onClose()
            }}
          />
        </>
      )
    }
    render(<ControlledTour />)
    expect(screen.getByRole('dialog', { name: '第一步' })).toBeInTheDocument()
    expect(screen.getByLabelText('第 1 步，共 2 步')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith(1)
    fireEvent.keyDown(document, { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenLastCalledWith(0)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
    // Re-open the controlled tour for the finish path.
    render(
      <Tour
        open
        current={1}
        steps={steps}
        onFinish={onFinish}
        onClose={onClose}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '完成' }))
    expect(onFinish).toHaveBeenCalledOnce()
  })

  it('highlights a target while preserving the target control and mask options', () => {
    const target = document.createElement('button')
    target.textContent = '目标'
    document.body.append(target)
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      top: 80,
      left: 40,
      right: 160,
      bottom: 120,
      width: 120,
      height: 40,
    } as DOMRect)
    Object.defineProperty(target, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    })
    render(
      <Tour
        open
        mask={{ color: 'rgba(0, 0, 0, 0.4)' }}
        steps={[{ key: 'target', target, title: '目标引导' }]}
      />,
    )
    expect(document.querySelectorAll('[data-tour-mask]')).toHaveLength(4)
    expect(screen.getByRole('dialog', { name: '目标引导' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '目标' })).toBe(target)
  })

  it('keeps arrow keys available while editing a field in the tour card', () => {
    const onChange = vi.fn()
    render(
      <Tour
        open
        steps={[
          {
            key: 'input',
            title: '输入引导',
            description: <input aria-label="说明输入" />,
          },
          { key: 'next', title: '下一步引导' },
        ]}
        onChange={onChange}
      />,
    )
    const input = screen.getByRole('textbox', { name: '说明输入' })
    input.focus()
    fireEvent.keyDown(input, { key: 'ArrowRight' })
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.keyDown(document, { key: 'Escape' })
  })

  it('keeps focus in a controlled tour when a close request is rejected', async () => {
    const onClose = vi.fn()
    const renderTour = (open: boolean) => (
      <>
        <button type="button">打开引导</button>
        <Tour
          open={open}
          onClose={onClose}
          steps={[{ key: 'guarded', title: '受控引导' }]}
        />
      </>
    )
    const { rerender } = render(renderTour(false))
    const opener = screen.getByRole('button', { name: '打开引导' })
    opener.focus()
    rerender(renderTour(true))
    const close = screen.getByRole('button', { name: '关闭引导' })
    await waitFor(() => expect(close).toHaveFocus())

    fireEvent.click(close)
    expect(onClose).toHaveBeenCalledOnce()
    close.blur()
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    )
    expect(screen.getByRole('dialog', { name: '受控引导' })).toBeVisible()
    expect(close).toHaveFocus()

    rerender(renderTour(false))
    await waitFor(() => expect(opener).toHaveFocus())
  })
})
