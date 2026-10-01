import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  Button,
  ConfigProvider,
  Descriptions,
  type DescriptionItem,
} from '@/shared/ui'

function term(label: string) {
  return screen
    .getAllByRole('term')
    .find((element) => element.querySelector('span')?.textContent === label)!
}

function cell(label: string) {
  return term(label).parentElement!
}

function definition(label: string) {
  return within(cell(label)).getByRole('definition')
}

describe('Descriptions', () => {
  it('names its region, preserves native term-definition pairs and exposes an extra action', () => {
    const edit = vi.fn()
    render(
      <Descriptions
        title="任务详情"
        extra={<Button onClick={edit}>编辑</Button>}
        items={[{ key: 'status', label: '阶段', children: '已完成' }]}
      />,
    )
    const region = screen.getByRole('region', { name: '任务详情' })
    expect(
      within(region).getByRole('heading', { name: '任务详情' }),
    ).toBeInTheDocument()
    expect(within(region).getByRole('definition')).toHaveTextContent('已完成')
    expect(
      within(region).getByRole('term').querySelector('[aria-hidden]'),
    ).toHaveTextContent(':')
    fireEvent.click(within(region).getByRole('button', { name: '编辑' }))
    expect(edit).toHaveBeenCalledOnce()
  })

  it('packs wide items into rows, fills remaining columns and never creates extra columns', () => {
    const items: DescriptionItem[] = [
      { key: 'a', label: 'A', children: 'a', span: 2 },
      { key: 'b', label: 'B', children: 'b', span: 2 },
      { key: 'c', label: 'C', children: 'c', span: 'filled' },
      { key: 'd', label: 'D', children: 'd', span: 999 },
      { key: 'e', label: 'E', children: 'e', span: -2 },
    ]
    render(<Descriptions column={3} items={items} bordered />)
    expect(cell('A').style.getPropertyValue('--description-span-sm')).toBe('3')
    expect(cell('B').style.getPropertyValue('--description-row-sm')).toBe('2')
    expect(cell('C').style.getPropertyValue('--description-start-sm')).toBe('3')
    expect(cell('C').style.getPropertyValue('--description-span-sm')).toBe('1')
    expect(cell('D').style.getPropertyValue('--description-span-sm')).toBe('3')
    expect(cell('E').style.getPropertyValue('--description-span-sm')).toBe('3')
    expect(cell('E').style.getPropertyValue('--description-row-sm')).toBe('4')
    for (const label of ['A', 'B', 'C', 'D', 'E']) {
      expect(cell(label).style.getPropertyValue('--description-span-xs')).toBe(
        '1',
      )
    }
  })

  it('inherits responsive columns and spans and normalizes non-finite values', () => {
    const { rerender } = render(
      <Descriptions
        column={{ xs: 1, md: 3, xl: 4 }}
        items={[
          { key: 'one', label: '一', children: 'one' },
          { key: 'two', label: '二', children: 'two', span: { xs: 1, md: 2 } },
          { key: 'three', label: '三', children: 'three', span: 'filled' },
        ]}
      />,
    )
    const body = cell('一').parentElement!
    expect(body.style.getPropertyValue('--description-columns-sm')).toBe('1')
    expect(body.style.getPropertyValue('--description-columns-lg')).toBe('3')
    expect(body.style.getPropertyValue('--description-columns-xxl')).toBe('4')
    expect(cell('二').style.getPropertyValue('--description-span-md')).toBe('2')
    expect(cell('三').style.getPropertyValue('--description-row-md')).toBe('2')
    expect(cell('三').style.getPropertyValue('--description-span-md')).toBe('3')
    expect(cell('三').style.getPropertyValue('--description-row-xl')).toBe('1')
    expect(cell('三').style.getPropertyValue('--description-start-xl')).toBe(
      '4',
    )
    rerender(
      <Descriptions
        column={Number.NaN}
        items={[
          {
            key: 'one',
            label: '一',
            children: 'one',
            span: Number.POSITIVE_INFINITY,
          },
        ]}
      />,
    )
    expect(
      cell('一').parentElement!.style.getPropertyValue(
        '--description-columns-sm',
      ),
    ).toBe('3')
    expect(cell('一').style.getPropertyValue('--description-span-sm')).toBe('3')
  })

  it('preserves source reading order and pairs definitions in vertical bordered layout', () => {
    render(
      <Descriptions
        bordered
        layout="vertical"
        column={2}
        items={[
          { key: 'one', label: '第一项', children: '第一值' },
          { key: 'two', label: '第二项', children: '第二值' },
          { key: 'three', label: '第三项', children: '第三值' },
        ]}
      />,
    )
    expect(
      [...cell('第一项').parentElement!.querySelectorAll('dt,dd')].map(
        (element) => element.textContent,
      ),
    ).toEqual(['第一项', '第一值', '第二项', '第二值', '第三项', '第三值'])
    expect(cell('第一项').className).toContain('grid-rows-subgrid')
    expect(cell('第三项').style.getPropertyValue('--description-row-sm')).toBe(
      '3',
    )
    expect(term('第一项').className).not.toContain('border-e')
    expect(definition('第一项').className).not.toContain('border-s')
  })

  it('inherits size and direction and lets explicit sizes override the provider', () => {
    const { rerender } = render(
      <ConfigProvider componentSize="small" direction="rtl">
        <Descriptions
          title="局部详情"
          items={[{ key: 'one', label: '字段', children: '值' }]}
        />
      </ConfigProvider>,
    )
    const region = screen.getByRole('region', { name: '局部详情' })
    expect(region).toHaveAttribute('dir', 'rtl')
    expect(region).toHaveAttribute('data-ui-size', 'small')
    expect(term('字段').className).toContain('py-2')
    rerender(
      <ConfigProvider componentSize="small">
        <Descriptions
          title="局部详情"
          size="large"
          items={[{ key: 'one', label: '字段', children: '值' }]}
        />
      </ConfigProvider>,
    )
    expect(region).toHaveAttribute('data-ui-size', 'large')
    expect(term('字段').className).toContain('py-4')
  })

  it('supports semantic Tailwind overrides, hides colons and honors an explicit accessible name', () => {
    render(
      <Descriptions
        title="视觉标题"
        aria-label="自定义区域"
        colon={false}
        classNames={{ label: 'text-foreground', content: 'font-semibold' }}
        items={[
          {
            key: 'one',
            label: '字段',
            children: '值',
            labelClassName: 'font-bold',
            contentClassName: 'text-muted-foreground',
          },
        ]}
      />,
    )
    expect(
      screen.getByRole('region', { name: '自定义区域' }),
    ).not.toHaveAttribute('aria-labelledby')
    const label = term('字段')
    const content = definition('字段')
    expect(content).not.toHaveAttribute('aria-labelledby')
    expect(label.querySelector('[aria-hidden]')).toBeNull()
    expect(label.className).toContain('text-foreground')
    expect(label.className).toContain('font-bold')
    expect(content.className).toContain('text-muted-foreground')
    expect(content.className).toContain('font-semibold')
  })

  it('keeps the title and extra action when no fields are available', () => {
    render(
      <Descriptions
        title="空详情"
        emptyText="暂无记录"
        extra={<Button>重新加载详情</Button>}
        items={[]}
      />,
    )
    const region = screen.getByRole('region', { name: '空详情' })
    expect(within(region).getByText('暂无记录')).toBeInTheDocument()
    expect(
      within(region).getByRole('button', { name: '重新加载详情' }),
    ).toBeInTheDocument()
    expect(within(region).queryByRole('term')).toBeNull()
  })
})
