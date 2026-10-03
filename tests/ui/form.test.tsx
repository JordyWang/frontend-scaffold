import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  Checkbox,
  Form,
  FormItem,
  RadioGroup,
  TreeSelect,
  useForm,
  type FormInstance,
} from '@/shared/ui'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((complete) => {
    resolve = complete
  })
  return { promise, resolve }
}

describe('Form coordinator', () => {
  it('revalidates a previously checked dependent field when its source changes', async () => {
    render(
      <Form
        validateOn="blur"
        initialValues={{ password: 'alpha', confirmation: 'alpha' }}
      >
        <FormItem name="password" label="密码" control={<input />} />
        <FormItem
          name="confirmation"
          label="确认密码"
          dependencies={['password']}
          rules={[
            {
              validator: (value, values) =>
                value === values.password ? undefined : '两次输入不一致',
            },
          ]}
          control={<input />}
        />
      </Form>,
    )
    const password = screen.getByRole('textbox', { name: '密码' })
    const confirmation = screen.getByRole('textbox', { name: '确认密码' })
    await act(async () => fireEvent.blur(confirmation))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    fireEvent.change(password, { target: { value: 'beta' } })
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('两次输入不一致'),
    )
    expect(confirmation).toHaveAttribute('aria-invalid', 'true')

    fireEvent.change(password, { target: { value: 'alpha' } })
    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument(),
    )
    expect(confirmation).not.toHaveAttribute('aria-invalid', 'true')
  })

  it('revalidates a dependent field when both fields change in one update', async () => {
    const onFinish = vi.fn()
    function Example() {
      const form = useForm()
      return (
        <Form
          form={form}
          initialValues={{ password: 'alpha', confirmation: 'alpha' }}
          onFinish={onFinish}
        >
          <FormItem name="password" label="密码" control={<input />} />
          <FormItem
            name="confirmation"
            label="确认密码"
            dependencies={['password']}
            rules={[
              {
                validator: (value, values) =>
                  value === values.password ? undefined : '两次输入不一致',
              },
            ]}
            control={<input />}
          />
          <button type="submit">校验</button>
          <button
            type="button"
            onClick={() =>
              form.setFieldsValue({ password: 'beta', confirmation: 'gamma' })
            }
          >
            批量更新
          </button>
        </Form>
      )
    }
    render(<Example />)
    fireEvent.click(screen.getByRole('button', { name: '校验' }))
    await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1))
    fireEvent.click(screen.getByRole('button', { name: '批量更新' }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('两次输入不一致'),
    )
  })

  it('waits for controlled acceptance before checking dependents', async () => {
    const validator = vi.fn(
      (value: unknown, values: Record<string, unknown>) =>
        value === values.password ? undefined : '两次输入不一致',
    )
    const fields = (password: string) => (
      <Form values={{ password, confirmation: 'alpha' }} validateOn="change">
        <FormItem name="password" label="密码" control={<input />} />
        <FormItem
          name="confirmation"
          label="确认密码"
          dependencies={['password']}
          rules={[{ validator }]}
          control={<input />}
        />
      </Form>
    )
    const { rerender } = render(fields('alpha'))
    fireEvent.change(screen.getByRole('textbox', { name: '密码' }), {
      target: { value: 'beta' },
    })
    expect(validator).not.toHaveBeenCalled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    rerender(fields('beta'))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('两次输入不一致'),
    )
    expect(validator).toHaveBeenCalledWith('alpha', {
      password: 'beta',
      confirmation: 'alpha',
    })
  })

  it('ignores an obsolete asynchronous dependent error after another source change', async () => {
    const obsolete = deferred<string | undefined>()
    const validator = vi.fn((_: unknown, values: Record<string, unknown>) =>
      values.password === 'beta' ? obsolete.promise : undefined,
    )
    render(
      <Form
        initialValues={{ password: 'alpha', confirmation: 'alpha' }}
        validateOn="change"
      >
        <FormItem name="password" label="密码" control={<input />} />
        <FormItem
          name="confirmation"
          label="确认密码"
          dependencies={['password']}
          rules={[{ validator }]}
          control={<input />}
        />
      </Form>,
    )
    const password = screen.getByRole('textbox', { name: '密码' })
    fireEvent.change(password, { target: { value: 'beta' } })
    await waitFor(() =>
      expect(validator).toHaveBeenCalledWith('alpha', {
        password: 'beta',
        confirmation: 'alpha',
      }),
    )
    fireEvent.change(password, { target: { value: 'gamma' } })
    await waitFor(() =>
      expect(validator).toHaveBeenCalledWith('alpha', {
        password: 'gamma',
        confirmation: 'alpha',
      }),
    )
    await act(async () => obsolete.resolve('旧来源错误'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('submits only accepted controlled values and keeps rejected changes visible as requests', async () => {
    const onValuesChange = vi.fn()
    const onFinish = vi.fn()
    const onFinishFailed = vi.fn()
    const form = {} as FormInstance<{ name: string }>
    const props = { onValuesChange, onFinish, onFinishFailed }
    const fields = (name: string) => (
      <Form
        {...props}
        form={form}
        values={{ name }}
        initialValues={{ name: '初始值' }}
      >
        <FormItem
          name="name"
          label="受控名称"
          rules={[{ required: true, message: '请输入名称' }]}
          control={<input />}
        />
        <button type="submit">提交</button>
        <button type="reset">重置</button>
      </Form>
    )
    const { rerender } = render(fields(''))
    const input = screen.getByRole('textbox', { name: '受控名称' })

    fireEvent.change(input, { target: { value: '待接受' } })
    expect(onValuesChange).toHaveBeenLastCalledWith(
      { name: '待接受' },
      { name: '待接受' },
    )
    expect(input).toHaveValue('')
    expect(form.getFieldValue('name')).toBe('')
    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() =>
      expect(onFinishFailed).toHaveBeenCalledWith(
        { name: '请输入名称' },
        { name: '' },
      ),
    )
    expect(onFinish).not.toHaveBeenCalled()

    rerender(fields('待接受'))
    expect(input).toHaveValue('待接受')
    expect(form.getFieldsValue()).toEqual({ name: '待接受' })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith({ name: '待接受' }),
    )

    fireEvent.click(screen.getByRole('button', { name: '重置' }))
    expect(onValuesChange).toHaveBeenLastCalledWith(
      { name: '初始值' },
      { name: '初始值' },
    )
    expect(input).toHaveValue('待接受')
    expect(form.getFieldValue('name')).toBe('待接受')
    rerender(fields('初始值'))
    expect(input).toHaveValue('初始值')
    expect(form.getFieldValue('name')).toBe('初始值')
  })

  it('validates accepted controlled changes and ignores stale asynchronous results', async () => {
    const oldResult = deferred<string | undefined>()
    const validator = vi.fn((value: unknown) =>
      value === '旧值' ? oldResult.promise : Promise.resolve(undefined),
    )
    const fields = (name: string) => (
      <Form values={{ name }} validateOn="change">
        <FormItem
          name="name"
          label="受控校验"
          rules={[{ validator }]}
          control={<input />}
        />
      </Form>
    )
    const { rerender } = render(fields('初始'))
    const input = screen.getByRole('textbox', { name: '受控校验' })
    fireEvent.change(input, { target: { value: '旧值' } })
    expect(validator).not.toHaveBeenCalled()

    rerender(fields('旧值'))
    await waitFor(() =>
      expect(validator).toHaveBeenCalledWith('旧值', { name: '旧值' }),
    )
    rerender(fields('新值'))
    await waitFor(() =>
      expect(validator).toHaveBeenCalledWith('新值', { name: '新值' }),
    )
    await act(async () => oldResult.resolve('旧值无效'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(input).toHaveValue('新值')
  })

  it('rechecks an accepted controlled value after blur', async () => {
    const validator = vi.fn((value: unknown) =>
      value === '无效' ? '名称不可用' : undefined,
    )
    const fields = (name: string) => (
      <Form values={{ name }} validateOn="blur">
        <FormItem
          name="name"
          label="失焦校验"
          rules={[{ validator }]}
          control={<input />}
        />
      </Form>
    )
    const { rerender } = render(fields('有效'))
    const input = screen.getByRole('textbox', { name: '失焦校验' })
    fireEvent.change(input, { target: { value: '无效' } })
    fireEvent.blur(input)
    await waitFor(() =>
      expect(validator).toHaveBeenCalledWith('有效', { name: '有效' }),
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    rerender(fields('无效'))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('名称不可用'),
    )
    expect(validator).toHaveBeenCalledWith('无效', { name: '无效' })
  })

  it('requires a checked boolean field before submit and after reset', async () => {
    const onFinish = vi.fn()
    render(
      <Form onFinish={onFinish}>
        <FormItem
          name="consent"
          valuePropName="checked"
          rules={[{ required: true, message: '请同意条款' }]}
          control={<Checkbox label="同意条款" />}
        />
        <button type="submit">提交</button>
        <button type="reset">重置</button>
      </Form>,
    )
    const checkbox = screen.getByRole('checkbox', { name: '同意条款' })
    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('请同意条款'),
    )
    expect(checkbox).toHaveAttribute('aria-invalid', 'true')
    expect(onFinish).not.toHaveBeenCalled()

    fireEvent.click(checkbox)
    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith({ consent: true }),
    )

    fireEvent.click(screen.getByRole('button', { name: '重置' }))
    expect(checkbox).not.toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('请同意条款'),
    )
    expect(onFinish).toHaveBeenCalledTimes(1)
  })

  it('passes horizontal and inline layout to FormField without changing labels', () => {
    const { rerender } = render(
      <Form layout="horizontal">
        <FormItem
          name="email"
          label="邮箱"
          description="用于接收通知"
          control={<input />}
        />
      </Form>,
    )
    const field = screen.getByRole('textbox', { name: '邮箱' }).parentElement
    expect(field).toHaveClass(
      'sm:grid-cols-[minmax(7rem,0.35fr)_minmax(0,1fr)]',
    )
    expect(screen.getByText('用于接收通知')).toHaveClass('sm:col-start-2')

    rerender(
      <Form layout="inline">
        <FormItem name="query" label="搜索" control={<input />} />
      </Form>,
    )
    expect(
      screen.getByRole('textbox', { name: '搜索' }).parentElement,
    ).toHaveClass('flex-[1_1_12rem]')
  })

  it('focuses the first invalid control after submit validation fails', async () => {
    render(
      <Form>
        <FormItem
          name="name"
          label="名称"
          rules={[{ required: true, message: '请输入名称' }]}
          control={<input />}
        />
        <FormItem
          name="email"
          label="邮箱"
          rules={[{ required: true, message: '请输入邮箱' }]}
          control={<input />}
        />
        <button type="submit">提交</button>
      </Form>,
    )

    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: '名称' })).toHaveFocus(),
    )
    expect(screen.getByText('请输入名称')).toBeInTheDocument()
  })

  it('scrolls the first error once and honors custom or disabled scrolling', async () => {
    const options = { block: 'start' as const, inline: 'nearest' as const }
    const renderForm = (
      scrollToFirstError: boolean | ScrollIntoViewOptions,
    ) => (
      <>
        <button type="button">表单外操作</button>
        <Form scrollToFirstError={scrollToFirstError}>
          <FormItem
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
            control={<input />}
          />
          <button type="submit">提交</button>
        </Form>
      </>
    )
    const { rerender } = render(renderForm(options))
    const input = screen.getByRole('textbox', { name: '名称' })
    const scrollIntoView = vi.fn()
    Object.defineProperty(input, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })
    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() => expect(input).toHaveFocus())
    expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith(options)

    const outside = screen.getByRole('button', { name: '表单外操作' })
    outside.focus()
    rerender(renderForm({ ...options }))
    expect(outside).toHaveFocus()
    expect(scrollIntoView).toHaveBeenCalledTimes(1)

    rerender(renderForm(false))
    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() => expect(input).toHaveFocus())
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
  })

  it('focuses the first option inside an invalid composite control', async () => {
    render(
      <Form>
        <FormItem
          name="view"
          rules={[{ required: true, message: '请选择展示方式' }]}
          control={
            <RadioGroup
              label="展示方式"
              options={[
                { value: 'list', label: '列表' },
                { value: 'grid', label: '网格' },
              ]}
            />
          }
        />
        <button type="submit">提交</button>
      </Form>,
    )

    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() =>
      expect(screen.getByRole('radio', { name: '列表' })).toHaveFocus(),
    )
  })

  it('discards stale asynchronous field errors after a newer value validates', async () => {
    const oldResult = deferred<string | undefined>()
    const validator = vi.fn((value: unknown) =>
      value === 'old' ? oldResult.promise : Promise.resolve(undefined),
    )
    render(
      <Form validateOn="change">
        <FormItem
          name="name"
          label="名称"
          rules={[{ validator }]}
          control={<input />}
        />
      </Form>,
    )

    const input = screen.getByRole('textbox', { name: '名称' })
    fireEvent.change(input, { target: { value: 'old' } })
    fireEvent.change(input, { target: { value: 'new' } })
    await waitFor(() => expect(validator).toHaveBeenCalledTimes(2))
    await act(async () => oldResult.resolve('旧值无效'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('validates the latest values before completing a pending submit', async () => {
    const firstResult = deferred<string | undefined>()
    const onFinish = vi.fn()
    const validator = vi.fn((value: unknown) =>
      value === 'old' ? firstResult.promise : Promise.resolve(undefined),
    )
    render(
      <Form onFinish={onFinish}>
        <FormItem
          name="name"
          label="名称"
          rules={[{ validator }]}
          control={<input />}
        />
        <button type="submit">提交</button>
      </Form>,
    )

    const input = screen.getByRole('textbox', { name: '名称' })
    fireEvent.change(input, { target: { value: 'old' } })
    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() =>
      expect(validator).toHaveBeenCalledWith('old', { name: 'old' }),
    )
    fireEvent.change(input, { target: { value: 'new' } })
    await act(async () => firstResult.resolve('旧值无效'))

    await waitFor(() => expect(onFinish).toHaveBeenCalledWith({ name: 'new' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('reports submit callback errors separately from validation failures', async () => {
    const error = new Error('保存失败')
    const onFinishFailed = vi.fn()
    const onFinishError = vi.fn()
    render(
      <Form
        initialValues={{ name: '有效名称' }}
        onFinish={async () => {
          throw error
        }}
        onFinishFailed={onFinishFailed}
        onFinishError={onFinishError}
      >
        <FormItem name="name" label="名称" control={<input />} />
        <button type="submit">提交</button>
      </Form>,
    )

    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() =>
      expect(onFinishError).toHaveBeenCalledWith(error, { name: '有效名称' }),
    )
    expect(onFinishFailed).not.toHaveBeenCalled()
  })

  it('resets fields introduced after initial values', async () => {
    function Example() {
      const form = useForm()
      return (
        <Form form={form} initialValues={{ original: '初始值' }}>
          <FormItem name="original" label="原字段" control={<input />} />
          <FormItem name="added" label="新增字段" control={<input />} />
          <button type="button" onClick={() => form.resetFields()}>
            重置
          </button>
        </Form>
      )
    }
    render(<Example />)
    fireEvent.change(screen.getByRole('textbox', { name: '原字段' }), {
      target: { value: '已更改' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: '新增字段' }), {
      target: { value: '后来加入' },
    })
    fireEvent.click(screen.getByRole('button', { name: '重置' }))

    expect(screen.getByRole('textbox', { name: '原字段' })).toHaveValue(
      '初始值',
    )
    expect(screen.getByRole('textbox', { name: '新增字段' })).toHaveValue('')
  })

  it('uses an explicit empty array for a multi-select field and reset', async () => {
    const onFinish = vi.fn()
    function Example() {
      const form = useForm()
      return (
        <Form form={form} onFinish={onFinish}>
          <FormItem
            name="teams"
            label="团队"
            emptyValue={[]}
            rules={[{ required: true, message: '请选择团队' }]}
            control={
              <TreeSelect
                multiple
                allowClear
                treeData={[{ value: 'design', label: '设计组' }]}
              />
            }
          />
          <button type="submit">提交</button>
          <button type="button" onClick={() => form.resetFields()}>
            重置
          </button>
        </Form>
      )
    }
    render(<Example />)
    const trigger = screen.getByRole('combobox', { name: '团队' })
    expect(screen.queryByRole('button', { name: '清除树形选择' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('请选择团队'),
    )
    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('treeitem', { name: '设计组' }))
    expect(trigger).toHaveTextContent('设计组')
    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith({ teams: ['design'] }),
    )
    fireEvent.click(screen.getByRole('button', { name: '重置' }))
    expect(trigger).toHaveTextContent('请选择')
    expect(screen.queryByRole('button', { name: '清除树形选择' })).toBeNull()
  })

  it('cancels pending validation and submit when reset is requested', async () => {
    const pendingResult = deferred<string | undefined>()
    const onFinish = vi.fn()
    const onFinishFailed = vi.fn()
    function Example() {
      const form = useForm()
      return (
        <Form
          form={form}
          initialValues={{ name: '' }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
        >
          <FormItem
            name="name"
            label="名称"
            rules={[{ validator: () => pendingResult.promise }]}
            control={<input />}
          />
          <button type="submit">提交</button>
          <button type="button" onClick={() => form.resetFields()}>
            重置
          </button>
        </Form>
      )
    }
    render(<Example />)
    fireEvent.change(screen.getByRole('textbox', { name: '名称' }), {
      target: { value: 'old' },
    })
    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    fireEvent.click(screen.getByRole('button', { name: '重置' }))
    await act(async () => pendingResult.resolve('旧校验错误'))

    expect(onFinish).not.toHaveBeenCalled()
    expect(onFinishFailed).not.toHaveBeenCalled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '名称' })).toHaveValue('')
  })

  it('supports blur as a custom value trigger without losing blur validation', async () => {
    const onFinish = vi.fn()
    render(
      <Form validateOn="blur" onFinish={onFinish}>
        <FormItem
          name="name"
          label="名称"
          trigger="onBlur"
          valuePropName="data-value"
          getValueFromEvent={(event) =>
            (event as React.FocusEvent<HTMLButtonElement>).target.value
          }
          rules={[{ required: true, message: '请输入名称' }]}
          control={
            <button type="button" value="已输入">
              字段
            </button>
          }
        />
        <button type="submit">提交</button>
      </Form>,
    )

    fireEvent.blur(screen.getByRole('button', { name: '名称' }))
    fireEvent.click(screen.getByRole('button', { name: '提交' }))
    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith({ name: '已输入' }),
    )
  })
})
