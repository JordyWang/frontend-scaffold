import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  Button,
  Checkbox,
  ErrorBoundary,
  FormField,
  Image,
  Input,
  List,
  Pagination,
  Portal,
  RadioGroup,
  Switch,
  Table,
  ThemeScope,
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
        control={<Input id="custom-name" />}
      />,
    )
    const input = screen.getByRole('textbox', { name: '名称' })
    expect(input).toHaveAttribute('id', 'custom-name')
    expect(input).toBeRequired()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    const ids = input.getAttribute('aria-describedby')?.split(' ') ?? []
    expect(ids).toHaveLength(2)
    expect(document.getElementById(ids[0])).toHaveTextContent('至少两个字符')
    expect(document.getElementById(ids[1])).toHaveTextContent('名称太短')
  })

  it('connects self-labelled checkbox errors without nesting labels', () => {
    const { container } = render(
      <FormField
        required
        description="确认后才能继续"
        error="请同意条款"
        control={<Checkbox label="同意条款" />}
      />,
    )
    const checkbox = screen.getByRole('checkbox', { name: '同意条款' })
    expect(checkbox).toBeRequired()
    expect(checkbox).toHaveAttribute('aria-invalid', 'true')
    expect(container.querySelectorAll('label')).toHaveLength(1)
    expect(screen.getByRole('alert')).toHaveTextContent('请同意条款')
    const ids = checkbox.getAttribute('aria-describedby')?.split(' ') ?? []
    expect(ids).toHaveLength(2)
    expect(document.getElementById(ids[0])).toHaveTextContent('确认后才能继续')
    expect(document.getElementById(ids[1])).toHaveTextContent('请同意条款')
  })

  it('connects a radio group legend, required state and error', () => {
    render(
      <FormField
        required
        error="请选择展示方式"
        control={
          <RadioGroup
            label="展示方式"
            options={[
              { value: 'list', label: '列表' },
              { value: 'grid', label: '网格' },
            ]}
          />
        }
      />,
    )
    const group = screen.getByRole('group', { name: '展示方式' })
    expect(group).toHaveAttribute('aria-invalid', 'true')
    expect(
      document.getElementById(group.getAttribute('aria-describedby') ?? ''),
    ).toHaveTextContent('请选择展示方式')
    expect(screen.getByRole('radio', { name: '列表' })).toBeRequired()
    expect(screen.getByRole('radio', { name: '列表' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
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

  it('keeps local theme and density on their own scope', () => {
    render(
      <ThemeScope mode="dark" density="compact" tokens={{ primary: '#5eead4' }}>
        局部主题
      </ThemeScope>,
    )
    const scope = screen.getByText('局部主题')
    expect(scope).toHaveAttribute('data-ui-theme', 'dark')
    expect(scope).toHaveAttribute('data-ui-density', 'compact')
    expect(scope).toHaveStyle({ '--ui-seed-primary': '#5eead4' })
    expect(scope).toHaveStyle({ '--ui-map-primary-text': '#111827' })
    expect(scope).toHaveStyle({ '--ui-map-accent-text': 'var(--foreground)' })
    expect(document.documentElement).not.toHaveAttribute('data-ui-theme')
  })

  it('mounts a portal inside its nearest theme scope', () => {
    render(
      <ThemeScope mode="dark">
        <Portal>
          <span>局部弹出内容</span>
        </Portal>
      </ThemeScope>,
    )
    expect(screen.getByText('局部弹出内容').parentElement).toHaveAttribute(
      'data-ui-theme',
      'dark',
    )
  })

  it('uses native checkbox, radio and switch behavior', () => {
    const onValueChange = vi.fn()
    render(
      <>
        <Checkbox label="接收通知" />
        <RadioGroup
          label="布局"
          options={[
            { value: 'list', label: '列表' },
            { value: 'grid', label: '网格' },
          ]}
          onValueChange={onValueChange}
        />
        <Switch label="启用提醒" />
      </>,
    )
    fireEvent.click(screen.getByRole('checkbox', { name: '接收通知' }))
    expect(screen.getByRole('checkbox', { name: '接收通知' })).toBeChecked()
    fireEvent.click(screen.getByRole('radio', { name: '网格' }))
    expect(onValueChange).toHaveBeenCalledWith('grid')
    expect(screen.getByRole('radio', { name: '网格' })).toBeChecked()
    fireEvent.click(screen.getByRole('switch', { name: '启用提醒' }))
    expect(screen.getByRole('switch', { name: '启用提醒' })).toBeChecked()
  })

  it('replaces a failed image with labelled fallback', () => {
    render(<Image src="/missing.png" alt="封面" fallback="图片不可用" />)
    fireEvent.error(screen.getByRole('img', { name: '封面' }))
    expect(screen.getByRole('img', { name: '封面' })).toHaveTextContent(
      '图片不可用',
    )
  })
})
