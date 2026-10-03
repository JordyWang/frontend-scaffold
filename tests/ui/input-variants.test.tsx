import { createRef } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  Form,
  FormField,
  FormItem,
  ConfigProvider,
  Mentions,
  PasswordInput,
  SearchInput,
} from '@/shared/ui'

describe('input variants', () => {
  it('inherits the global component size for input variants and mentions', () => {
    render(
      <ConfigProvider componentSize="large">
        <SearchInput aria-label="大号搜索" />
        <PasswordInput aria-label="大号密码" />
        <Mentions aria-label="大号提及" options={[]} />
      </ConfigProvider>,
    )

    expect(screen.getByRole('searchbox', { name: '大号搜索' })).toHaveClass(
      'min-h-12',
    )
    expect(screen.getByLabelText('大号密码')).toHaveClass('min-h-12')
    expect(screen.getByRole('combobox', { name: '大号提及' })).toHaveClass(
      'py-3',
    )
  })

  it('searches by Enter and button, then clears without submitting a parent form', async () => {
    const onSearch = vi.fn()
    const onValueChange = vi.fn()
    const onChange = vi.fn()
    const onClear = vi.fn()
    const changedValues: string[] = []
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <SearchInput
          aria-label="搜索内容"
          allowClear
          onSearch={onSearch}
          onValueChange={onValueChange}
          onChange={(event) => {
            changedValues.push(event.currentTarget.value)
            onChange(event)
          }}
          onClear={onClear}
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
    expect(onValueChange).toHaveBeenLastCalledWith('')
    expect(changedValues).toEqual(['设计系统', ''])
    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onChange.mock.calls[1][0].nativeEvent).toBeInstanceOf(Event)
    expect(onClear).toHaveBeenCalledOnce()
    await waitFor(() => expect(input).toHaveFocus())
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

  it('preserves composition, read-only values and explicit valid aria state', () => {
    const onSearch = vi.fn()
    render(
      <>
        <SearchInput
          aria-label="只读搜索"
          defaultValue="任务"
          allowClear
          readOnly
          onSearch={onSearch}
          aria-invalid="false"
        />
        <PasswordInput
          aria-label="只读密码"
          defaultValue="secret"
          allowClear
          readOnly
        />
      </>,
    )
    const search = screen.getByRole('searchbox', { name: '只读搜索' })
    const password = screen.getByLabelText('只读密码')
    expect(search).toHaveAttribute('readonly')
    expect(password).toHaveAttribute('readonly')
    expect(search).toHaveAttribute('aria-invalid', 'false')
    expect(search.closest('[data-ui-affix-root]')).not.toHaveAttribute(
      'data-invalid',
    )
    expect(screen.queryByRole('button', { name: '清空搜索' })).toBeNull()
    expect(screen.queryByRole('button', { name: '清空密码' })).toBeNull()
    fireEvent.keyDown(search, { key: 'Enter', isComposing: true })
    fireEvent.keyDown(search, { key: 'Enter', keyCode: 229 })
    expect(onSearch).not.toHaveBeenCalled()
    fireEvent.keyDown(search, { key: 'Enter' })
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('任务')
  })

  it('supports variants, affixes and a linked character count', () => {
    render(
      <>
        <SearchInput
          aria-label="警告搜索"
          variant="filled"
          status="warning"
          prefix="🔎"
          suffix="件"
          count={{ max: 2 }}
          defaultValue="任务列表"
        />
        <PasswordInput
          aria-label="错误密码"
          variant="underlined"
          status="error"
          count
          defaultValue="secret"
        />
      </>,
    )
    const search = screen.getByRole('searchbox', { name: '警告搜索' })
    const searchRoot = search.closest('[data-ui-affix-root]')
    expect(searchRoot).toHaveClass('bg-muted')
    expect(searchRoot).toHaveAttribute('data-status', 'warning')
    expect(searchRoot).toHaveAttribute('data-count-exceeded', 'true')
    expect(search).toHaveAttribute('aria-invalid', 'true')
    expect(search).toHaveAttribute('aria-describedby')
    expect(searchRoot).toHaveTextContent('4 / 2')
    expect(searchRoot).toHaveTextContent('件')

    const password = screen.getByLabelText('错误密码')
    const passwordRoot = password.closest('[data-ui-affix-root]')
    expect(passwordRoot).toHaveClass('border-b')
    expect(passwordRoot).toHaveAttribute('data-status', 'error')
    expect(password).toHaveAttribute('aria-invalid', 'true')
    expect(password).toHaveAttribute('aria-describedby')
    expect(passwordRoot).toHaveTextContent('6')
  })

  it('clears password through native change and restores the initial value on form reset', async () => {
    const onValueChange = vi.fn()
    const onClear = vi.fn()
    const changedValues: string[] = []
    render(
      <form aria-label="密码表单">
        <PasswordInput
          aria-label="可清空密码"
          defaultValue="secret"
          allowClear
          onValueChange={onValueChange}
          onClear={onClear}
          onChange={(event) => changedValues.push(event.currentTarget.value)}
        />
        <button type="reset">重置密码表单</button>
      </form>,
    )
    const input = screen.getByLabelText('可清空密码')
    fireEvent.click(screen.getByRole('button', { name: '清空密码' }))
    expect(input).toHaveValue('')
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('')
    expect(changedValues).toEqual([''])
    expect(onClear).toHaveBeenCalledOnce()
    await waitFor(() => expect(input).toHaveFocus())
    fireEvent.click(screen.getByRole('button', { name: '重置密码表单' }))
    expect(input).toHaveValue('secret')
    expect(screen.getByRole('button', { name: '清空密码' })).toBeVisible()
    expect(onValueChange).toHaveBeenCalledOnce()
  })

  it('keeps a controlled password until its owner supplies the next value', () => {
    const onValueChange = vi.fn()
    const onChange = vi.fn()
    const { rerender } = render(
      <PasswordInput
        aria-label="受控值密码"
        value="secret"
        allowClear
        onValueChange={onValueChange}
        onChange={onChange}
      />,
    )
    const input = screen.getByLabelText('受控值密码')
    fireEvent.click(screen.getByRole('button', { name: '清空密码' }))
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('')
    expect(onChange).toHaveBeenCalledOnce()
    expect(input).toHaveValue('secret')
    rerender(<PasswordInput aria-label="受控值密码" value="" allowClear />)
    expect(input).toHaveValue('')
    expect(screen.queryByRole('button', { name: '清空密码' })).toBeNull()
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
