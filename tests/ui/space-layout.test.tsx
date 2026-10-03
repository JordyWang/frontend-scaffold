import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Space } from '@/shared/ui'

describe('Space layout', () => {
  it('uses independent gaps and places vertical separators after their items', () => {
    render(
      <Space
        aria-label="操作"
        direction="vertical"
        size={[12, 'small']}
        split="/"
      >
        <button type="button">查看</button>
        <button type="button">编辑</button>
      </Space>,
    )
    const space = screen.getByLabelText('操作')
    expect(space).toHaveClass('flex-col')
    expect(space.style.getPropertyValue('--ui-space-gap-x')).toBe('12px')
    expect(space.style.getPropertyValue('--ui-space-gap-y')).toBe(
      'var(--space-sm)',
    )
    const firstItem = screen.getByRole('button', { name: '查看' }).parentElement
    expect(firstItem).toHaveClass('flex-col')
    expect(firstItem?.lastElementChild).toHaveAttribute('aria-hidden', 'true')
    expect(firstItem?.lastElementChild).toHaveTextContent('/')
    expect(
      screen.getByRole('button', { name: '编辑' }).parentElement,
    ).not.toHaveTextContent('/')
  })

  it('keeps a horizontal item and its separator together when wrapping', () => {
    render(
      <Space aria-label="选项" size={[24, 8]} split="·" wrap>
        <button type="button">甲</button>
        <button type="button">乙</button>
        <button type="button">丙</button>
      </Space>,
    )
    const space = screen.getByLabelText('选项')
    expect(space).toHaveClass('flex-row', 'flex-wrap')
    expect(space.children).toHaveLength(3)
    expect(space.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2)
    expect(
      [...space.children].map((child) => child.firstElementChild?.textContent),
    ).toEqual(['甲', '乙', '丙'])
  })

  it('preserves keyed child state when the item order changes', () => {
    const input = (key: string, label: string) => (
      <input key={key} aria-label={label} defaultValue={label} />
    )
    const { rerender } = render(
      <Space>
        {input('first', '第一个')}
        {input('second', '第二个')}
      </Space>,
    )
    const first = screen.getByRole('textbox', { name: '第一个' })
    first.setAttribute('data-preserved', 'true')
    rerender(
      <Space>
        {input('second', '第二个')}
        {input('first', '第一个')}
      </Space>,
    )
    expect(screen.getByRole('textbox', { name: '第一个' })).toBe(first)
    expect(first).toHaveAttribute('data-preserved', 'true')
  })
})
