import { fireEvent, render, screen } from '@testing-library/react'
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
})
