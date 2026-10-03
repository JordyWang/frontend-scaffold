import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Flex, Stack } from '@/shared/ui'

describe('Flex', () => {
  it('uses a horizontal layout while Stack keeps its vertical default', () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <>
        <Flex ref={ref} aria-label="操作区" gap="sm">
          <button type="button">操作</button>
        </Flex>
        <Stack aria-label="表单区">字段</Stack>
      </>,
    )
    const flex = screen.getByLabelText('操作区')
    expect(flex).toBe(ref.current)
    expect(flex).toHaveClass('flex-row')
    expect(flex.style.getPropertyValue('--ui-flex-gap')).toBe('var(--space-sm)')
    expect(screen.getByLabelText('表单区')).toHaveClass('flex-col')
    expect(screen.getByRole('button', { name: '操作' })).toBeInTheDocument()
  })

  it('supports vertical, wrapping and numeric spacing without changing child order', () => {
    render(
      <Flex
        aria-label="条目"
        direction="column"
        wrap
        align="baseline"
        justify="evenly"
        gap={12}
      >
        <span>甲</span>
        <span>乙</span>
      </Flex>,
    )
    const flex = screen.getByLabelText('条目')
    expect(flex).toHaveClass(
      'flex-col',
      'flex-wrap',
      'items-baseline',
      'justify-evenly',
    )
    expect(flex.style.getPropertyValue('--ui-flex-gap')).toBe('12px')
    expect([...flex.children].map((child) => child.textContent)).toEqual([
      '甲',
      '乙',
    ])
  })
})
