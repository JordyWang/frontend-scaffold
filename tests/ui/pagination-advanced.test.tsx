import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Pagination } from '@/shared/ui'

describe('Pagination advanced controls', () => {
  it('shows the visible item range and validates quick jumps', () => {
    const onPageChange = vi.fn()
    render(
      <Pagination
        page={3}
        pageSize={10}
        total={25}
        onPageChange={onPageChange}
        showQuickJumper
        showTotal
      />,
    )
    expect(screen.getByText('第 21–25 条，共 25 条')).toBeVisible()
    const input = screen.getByRole('textbox', { name: '目标页码' })
    fireEvent.change(input, { target: { value: '4' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onPageChange).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('请输入 1–3 页')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(
      document.getElementById(input.getAttribute('aria-describedby') ?? ''),
    ).toBe(screen.getByRole('alert'))
    fireEvent.change(input, { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: '前往' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
    expect(input).toHaveValue('')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('keeps a page size control available even with one page', () => {
    const onPageSizeChange = vi.fn()
    render(
      <Pagination
        page={1}
        pageSize={10}
        total={5}
        onPageChange={vi.fn()}
        onPageSizeChange={onPageSizeChange}
      />,
    )
    expect(
      screen.getByRole('combobox', { name: '每页条数' }),
    ).toHaveTextContent('10 条/页')
    expect(screen.getByRole('button', { name: '下一页' })).toBeDisabled()
  })

  it('keeps a requested total visible for an empty dataset', () => {
    render(
      <Pagination
        page={1}
        pageSize={10}
        total={0}
        onPageChange={vi.fn()}
        showTotal
      />,
    )
    expect(screen.getByText('共 0 条')).toBeVisible()
    expect(screen.getByRole('button', { name: '下一页' })).toBeDisabled()
  })

  it('disables every pagination action while loading', () => {
    render(
      <Pagination
        page={2}
        pageSize={10}
        total={35}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        showQuickJumper
        loading
      />,
    )
    expect(screen.getByRole('combobox', { name: '每页条数' })).toBeDisabled()
    expect(screen.getByRole('textbox', { name: '目标页码' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '前往' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '下一页' })).toBeDisabled()
    expect(screen.getByRole('navigation', { name: '分页' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
  })

  it('disables page, size, jump and load-more controls together', () => {
    const onPageChange = vi.fn()
    const onPageSizeChange = vi.fn()
    const { rerender } = render(
      <Pagination
        page={2}
        pageSize={10}
        total={35}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        showQuickJumper
        disabled
      />,
    )
    const navigation = screen.getByRole('navigation', { name: '分页' })
    expect(navigation).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('combobox', { name: '每页条数' })).toBeDisabled()
    expect(screen.getByRole('textbox', { name: '目标页码' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '前往' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '下一页' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '前往第 3 页' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '下一页' }))
    expect(onPageChange).not.toHaveBeenCalled()
    expect(onPageSizeChange).not.toHaveBeenCalled()

    rerender(
      <Pagination
        page={2}
        pageSize={10}
        total={35}
        onPageChange={onPageChange}
        mode="load-more"
        disabled
      />,
    )
    expect(screen.getByRole('button', { name: '加载更多' })).toBeDisabled()
  })
})
