import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Popconfirm } from '@/shared/ui'

describe('Popconfirm controlled contract', () => {
  it('supports default open, disabled triggers and hiding the cancel action', () => {
    const onConfirm = vi.fn()
    render(
      <>
        <Popconfirm
          title="删除记录？"
          description="操作不可撤销。"
          defaultOpen
          showCancel={false}
          okText="继续删除"
          okButtonProps={{ variant: 'destructive', 'aria-label': '确认删除' }}
          onConfirm={onConfirm}
        >
          <button type="button">删除记录</button>
        </Popconfirm>
        <Popconfirm title="禁用操作" disabled>
          <button type="button">禁用删除</button>
        </Popconfirm>
      </>,
    )
    expect(screen.getByRole('dialog')).toHaveTextContent('操作不可撤销。')
    expect(screen.queryByRole('button', { name: '取消' })).toBeNull()
    const confirm = screen.getByRole('button', { name: '确认删除' })
    expect(confirm).toHaveClass('bg-destructive')
    fireEvent.click(confirm)
    expect(onConfirm).toHaveBeenCalledOnce()
    return waitFor(() => expect(screen.queryByRole('dialog')).toBeNull()).then(
      () => {
        const disabled = screen.getByRole('button', { name: '禁用删除' })
        expect(disabled).toBeDisabled()
        fireEvent.click(disabled)
        expect(screen.queryByText('禁用操作')).toBeNull()
      },
    )
  })

  it('requests controlled open changes and waits for the caller to accept them', () => {
    const onOpenChange = vi.fn()
    const onCancel = vi.fn()
    const onConfirm = vi.fn()
    const { rerender } = render(
      <Popconfirm
        title="受控确认"
        open={false}
        onOpenChange={onOpenChange}
        onCancel={onCancel}
        onConfirm={onConfirm}
      >
        <button type="button">打开受控确认</button>
      </Popconfirm>,
    )
    const trigger = screen.getByRole('button', { name: '打开受控确认' })
    fireEvent.click(trigger)
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.queryByRole('dialog')).toBeNull()

    rerender(
      <Popconfirm
        title="受控确认"
        open
        onOpenChange={onOpenChange}
        onCancel={onCancel}
        onConfirm={onConfirm}
      >
        <button type="button">打开受控确认</button>
      </Popconfirm>,
    )
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(onCancel).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '确定' }))
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)
    rerender(
      <Popconfirm
        title="受控确认"
        open={false}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      >
        <button type="button">打开受控确认</button>
      </Popconfirm>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
