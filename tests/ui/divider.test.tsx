import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Divider } from '@/shared/ui'

describe('Divider', () => {
  it('keeps a native separator without a title, including vertical lines', () => {
    const { container } = render(
      <div>
        <Divider data-testid="horizontal" variant="dotted" />
        <Divider
          data-testid="vertical"
          orientation="vertical"
          variant="dashed"
        />
      </div>,
    )

    const horizontal = screen.getByTestId('horizontal')
    const vertical = screen.getByTestId('vertical')
    expect(horizontal.tagName).toBe('HR')
    expect(horizontal).toHaveAttribute('aria-orientation', 'horizontal')
    expect(horizontal).toHaveClass('border-dotted')
    expect(vertical.tagName).toBe('HR')
    expect(vertical).toHaveAttribute('aria-orientation', 'vertical')
    expect(vertical).toHaveClass('border-dashed')
    expect(container.querySelectorAll('hr')).toHaveLength(2)
  })

  it('names titled separators and exposes title placement and plain text', () => {
    render(
      <div>
        <Divider variant="dashed" titlePlacement="start">
          任务概览
        </Divider>
        <Divider variant="dotted" titlePlacement="end" plain>
          更多信息
        </Divider>
        <Divider aria-label="分组" titlePlacement="center">
          自定义标题
        </Divider>
      </div>,
    )

    const start = screen.getByRole('separator', { name: '任务概览' })
    const end = screen.getByRole('separator', { name: '更多信息' })
    const custom = screen.getByRole('separator', { name: '分组' })
    expect(start.tagName).toBe('DIV')
    expect(start.firstElementChild).toHaveClass('w-4', 'border-dashed')
    expect(end.lastElementChild).toHaveClass('w-4', 'border-dotted')
    expect(screen.getByText('更多信息')).toHaveClass('font-normal')
    expect(custom).toHaveAttribute('aria-label', '分组')
    expect(custom).not.toHaveAttribute('aria-labelledby')
    expect(screen.getByText('自定义标题')).toHaveClass('break-words')
  })
})
