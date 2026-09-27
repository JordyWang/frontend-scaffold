import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  Button,
  ErrorBoundary,
  FormField,
  Input,
  List,
  Pagination,
  Portal,
  Table,
} from '@/shared/ui'

describe('shared/ui contracts', () => {
  it('prevents a second action while a button is loading', () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        保存
      </Button>,
    )
    const button = screen.getByRole('button', { name: '保存' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('connects form errors and descriptions to the input', () => {
    render(
      <FormField
        label="名称"
        required
        description="至少两个字符"
        error="名称太短"
        control={<Input />}
      />,
    )
    const input = screen.getByRole('textbox', { name: '名称' })
    expect(input).toBeRequired()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    const ids = input.getAttribute('aria-describedby')?.split(' ') ?? []
    expect(ids).toHaveLength(2)
    expect(document.getElementById(ids[0])).toHaveTextContent('至少两个字符')
    expect(document.getElementById(ids[1])).toHaveTextContent('名称太短')
  })

  it('keeps pagination in range', () => {
    const onPageChange = vi.fn()
    render(
      <Pagination
        page={1}
        pageSize={10}
        total={21}
        onPageChange={onPageChange}
      />,
    )
    expect(screen.getByRole('button', { name: '上一页' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '下一页' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('shows loading, empty and error feedback for data components', () => {
    const columns = [
      {
        key: 'name',
        header: '名称',
        render: (row: { id: string; name: string }) => row.name,
      },
    ]
    const props = {
      items: [] as { id: string }[],
      getKey: (row: { id: string }) => row.id,
      renderItem: (row: { id: string }) => row.id,
    }
    const { rerender } = render(<List {...props} loading />)
    expect(screen.getByRole('status')).toHaveTextContent('正在加载')
    rerender(<List {...props} />)
    expect(screen.getByText('暂无内容')).toBeInTheDocument()
    rerender(
      <Table
        caption="示例"
        columns={columns}
        rows={[]}
        getRowKey={(row) => row.id}
        error="接口失败"
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('接口失败')
  })

  it('renders portals outside the local parent', () => {
    const { container } = render(
      <div>
        <Portal>
          <span>弹出内容</span>
        </Portal>
      </div>,
    )
    expect(container).not.toHaveTextContent('弹出内容')
    expect(screen.getByText('弹出内容').parentElement).toBe(document.body)
  })

  it('lets a failed subtree recover through the error boundary', async () => {
    const onError = vi.fn()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    function Fragile({ fail }: { fail: boolean }) {
      if (fail) throw new Error('boom')
      return <p>恢复成功</p>
    }
    const { rerender } = render(
      <ErrorBoundary onError={onError}>
        <Fragile fail />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('页面加载失败')
    expect(onError).toHaveBeenCalledOnce()
    rerender(
      <ErrorBoundary onError={onError}>
        <Fragile fail={false} />
      </ErrorBoundary>,
    )
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '重试' }))
    })
    expect(screen.getByText('恢复成功')).toBeInTheDocument()
    consoleError.mockRestore()
  })
})
