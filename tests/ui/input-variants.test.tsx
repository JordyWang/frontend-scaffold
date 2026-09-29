import { createRef } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  Form,
  FormField,
  FormItem,
  PasswordInput,
  SearchInput,
} from '@/shared/ui'

describe('input variants', () => {
  it('searches by Enter and button, then clears without submitting a parent form', () => {
    const onSearch = vi.fn()
    const onValueChange = vi.fn()
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <SearchInput
          aria-label="搜索内容"
          allowClear
          onSearch={onSearch}
          onValueChange={onValueChange}
        />
      </form>,
    )
    const input = screen.getByRole('searchbox', { name: '搜索内容' })
    fireEvent.change(input, { target: { value: '设计系统' } })
    expect(onValueChange).toHaveBeenCalledWith('设计系统')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSearch).toHaveBeenCalledWith('设计系统')
    expect(onSubmit).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '清空搜索' }))
    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: '搜索' }))
    expect(onSearch).toHaveBeenLastCalledWith('')
  })

  it('keeps the controlled search value authoritative and blocks duplicate loading actions', () => {
    const ref = createRef<HTMLInputElement>()
    const onSearch = vi.fn()
    const onValueChange = vi.fn()
    const { rerender } = render(
      <SearchInput
        ref={ref}
        aria-label="查找组件"
        value="按钮"
        allowClear
        onSearch={onSearch}
        onValueChange={onValueChange}
      />,
    )
    const input = screen.getByRole('searchbox', { name: '查找组件' })
    expect(ref.current).toBe(input)
    fireEvent.click(screen.getByRole('button', { name: '清空搜索' }))
    expect(onValueChange).toHaveBeenCalledWith('')
    expect(input).toHaveValue('按钮')

    rerender(
      <SearchInput
        aria-label="查找组件"
        value="按钮"
        allowClear
        loading
        onSearch={onSearch}
        onValueChange={onValueChange}
      />,
    )
    const submit = screen.getByRole('button', { name: '搜索' })
    expect(submit).toBeDisabled()
    expect(submit).toHaveAttribute('aria-busy', 'true')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSearch).not.toHaveBeenCalled()
  })

  it('toggles password visibility without changing its value or submitting', () => {
    const ref = createRef<HTMLInputElement>()
    const onVisibleChange = vi.fn()
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <PasswordInput
          ref={ref}
          aria-label="登录密码"
          defaultValue="secret-123"
          onVisibleChange={onVisibleChange}
        />
      </form>,
    )
    const input = screen.getByLabelText('登录密码')
    expect(ref.current).toBe(input)
    expect(input).toHaveAttribute('type', 'password')
    const toggle = screen.getByRole('button', { name: '显示密码' })
    toggle.focus()
    fireEvent.keyDown(toggle, { key: 'Enter' })
    fireEvent.click(toggle)
    expect(input).toHaveAttribute('type', 'text')
    expect(input).toHaveValue('secret-123')
    expect(screen.getByRole('button', { name: '隐藏密码' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(onVisibleChange).toHaveBeenCalledWith(true)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('keeps controlled password visibility authoritative', () => {
    const onVisibleChange = vi.fn()
    const { rerender } = render(
      <PasswordInput
        aria-label="受控密码"
        value="secret"
        visible={false}
        onVisibleChange={onVisibleChange}
        readOnly
      />,
    )
    const input = screen.getByLabelText('受控密码')
    fireEvent.click(screen.getByRole('button', { name: '显示密码' }))
    expect(onVisibleChange).toHaveBeenCalledWith(true)
    expect(input).toHaveAttribute('type', 'password')

    rerender(
      <PasswordInput
        aria-label="受控密码"
        value="secret"
        visible
        disabled
        onVisibleChange={onVisibleChange}
        readOnly
      />,
    )
    expect(input).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: '隐藏密码' })).toBeDisabled()
  })

  it('links password errors through FormField and search values through FormItem', async () => {
    const onFinish = vi.fn()
    render(
      <>
        <FormField label="密码" error="密码无效" control={<PasswordInput />} />
        <Form onFinish={onFinish}>
          <FormItem
            name="query"
            label="关键词"
            trigger="onValueChange"
            rules={[{ required: true, message: '请输入关键词' }]}
            control={<SearchInput />}
          />
          <button type="submit">提交</button>
        </Form>
      </>,
    )
    const password = screen.getByLabelText('密码')
    expect(password).toHaveAttribute('aria-invalid', 'true')
    expect(password).toHaveAttribute('aria-describedby')
    const query = screen.getByRole('searchbox', { name: '关键词' })
    fireEvent.change(query, { target: { value: 'Tailwind' } })
    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith({ query: 'Tailwind' }),
    )
  })
})
