import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Masonry, type MasonryItem } from '@/shared/ui'

const originalRect = HTMLElement.prototype.getBoundingClientRect

afterEach(() => vi.restoreAllMocks())

function mockMeasurements(width: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement) {
      if (this.getAttribute('role') === 'list') return { width } as DOMRect
      if (this.hasAttribute('data-masonry-item'))
        return {
          height: Number(this.firstElementChild?.getAttribute('data-height')),
        } as DOMRect
      return originalRect.call(this)
    },
  )
}

const items: MasonryItem[] = [
  { key: 'a', content: <div data-height="100">项目 A</div> },
  { key: 'b', content: <div data-height="200">项目 B</div> },
  { key: 'c', content: <div data-height="50">项目 C</div> },
]

describe('Masonry', () => {
  it('places items in the shortest column while preserving DOM order', () => {
    mockMeasurements(640)
    const onLayoutChange = vi.fn()
    render(
      <Masonry
        aria-label="卡片布局"
        items={items}
        columns={{ base: 1, sm: 2 }}
        gap={[10, 12]}
        onLayoutChange={onLayoutChange}
      />,
    )
    const list = screen.getByRole('list', { name: '卡片布局' })
    const cards = screen.getAllByRole('listitem')
    expect(cards.map((card) => card.textContent)).toEqual([
      '项目 A',
      '项目 B',
      '项目 C',
    ])
    expect(cards.map((card) => card.getAttribute('data-column'))).toEqual([
      '0',
      '1',
      '0',
    ])
    expect(cards[2]).toHaveStyle({ top: '112px', left: '0px' })
    expect(list).toHaveStyle({ height: '200px' })
    expect(onLayoutChange).toHaveBeenCalledWith([
      { key: 'a', column: 0 },
      { key: 'b', column: 1 },
      { key: 'c', column: 0 },
    ])
  })

  it('recalculates when items change and respects a pinned column', () => {
    mockMeasurements(360)
    const { rerender } = render(
      <Masonry items={items} columns={{ base: 2 }} gap={8} />,
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    rerender(
      <Masonry
        items={[
          ...items,
          {
            key: 'd',
            column: 1,
            content: <div data-height="80">项目 D</div>,
          },
        ]}
        columns={{ base: 2 }}
        gap={8}
      />,
    )
    const cards = screen.getAllByRole('listitem')
    expect(cards).toHaveLength(4)
    expect(cards[3]).toHaveAttribute('data-column', '1')
    expect(cards[3]).toHaveStyle({ top: '208px' })
  })
})
