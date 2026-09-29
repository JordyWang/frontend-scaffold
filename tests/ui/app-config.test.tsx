import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  App,
  Button,
  ConfigProvider,
  getPrefixCls,
  Input,
  Select,
  Textarea,
  useApp,
  useConfig,
  usePrefixCls,
  warning,
} from '@/shared/ui'

function ConfigProbe() {
  const config = useConfig()
  const buttonPrefix = usePrefixCls('button')
  return (
    <output data-testid="config">
      {config.prefixCls}|{config.iconPrefixCls}|{config.componentSize}|
      {config.direction}|{buttonPrefix}
    </output>
  )
}

describe('App and ConfigProvider boundaries', () => {
  it('inherits Ant Design-style configuration and local theme tokens', () => {
    render(
      <ConfigProvider
        prefixCls="demo"
        iconPrefixCls="demoicon"
        componentSize="small"
        direction="rtl"
        locale="zh-CN"
        theme={{
          mode: 'dark',
          density: 'compact',
          tokens: { primary: '#1677ff' },
        }}
      >
        <ConfigProbe />
      </ConfigProvider>,
    )
    expect(screen.getByTestId('config')).toHaveTextContent(
      'demo|demoicon|small|rtl|demo-button',
    )
    const scope = screen.getByTestId('config').parentElement
    expect(scope).toHaveAttribute('data-ui-theme', 'dark')
    expect(scope).toHaveAttribute('data-ui-density', 'compact')
    expect(scope).toHaveAttribute('data-ui-component-size', 'small')
    expect(scope).toHaveStyle({ '--ui-seed-primary': '#1677ff' })
  })

  it('supports nesting and preserves parent values when no override is given', () => {
    render(
      <ConfigProvider prefixCls="outer">
        <ConfigProvider>
          <ConfigProbe />
        </ConfigProvider>
      </ConfigProvider>,
    )
    expect(screen.getByTestId('config')).toHaveTextContent(
      'outer|uiicon|middle|ltr|outer-button',
    )
  })

  it('applies componentSize to core controls while preserving explicit sizes', () => {
    render(
      <ConfigProvider componentSize="large">
        <Button>全局按钮</Button>
        <Button size="small">小号按钮</Button>
        <Input aria-label="全局输入" />
        <Textarea aria-label="全局文本域" />
        <Select
          aria-label="全局选择"
          options={[{ value: 'one', label: '一' }]}
        />
      </ConfigProvider>,
    )

    expect(screen.getByRole('button', { name: '全局按钮' })).toHaveClass(
      'ui-button--large',
    )
    expect(screen.getByRole('button', { name: '小号按钮' })).toHaveClass(
      'ui-button--small',
    )
    expect(screen.getByRole('textbox', { name: '全局输入' })).toHaveClass(
      'min-h-12',
    )
    expect(screen.getByRole('textbox', { name: '全局文本域' })).toHaveClass(
      'py-3',
    )
    expect(screen.getByRole('combobox', { name: '全局选择' })).toHaveClass(
      'ui-input--large',
    )
  })

  it('exposes app-level message, notification and modal APIs', () => {
    function AppProbe() {
      const app = useApp()
      return (
        <output data-testid="app-api">
          {String(typeof app.message.success)}|
          {String(typeof app.notification.open)}|
          {String(typeof app.modal.confirm)}
        </output>
      )
    }
    render(
      <App>
        <AppProbe />
      </App>,
    )
    expect(screen.getByTestId('app-api')).toHaveTextContent(
      'function|function|function',
    )
    expect(screen.getByTestId('app-api').parentElement).toHaveAttribute(
      'data-ui-app',
    )
  })

  it('renders modal.confirm as a real dialog and closes after confirmation', async () => {
    const onOk = vi.fn()
    function ModalProbe() {
      const { modal } = useApp()
      return (
        <button
          type="button"
          onClick={() =>
            modal.confirm({
              title: '确认操作',
              content: '确定继续吗？',
              okText: '继续',
              cancelText: '取消',
              onOk,
            })
          }
        >
          打开确认框
        </button>
      )
    }
    render(
      <App>
        <ModalProbe />
      </App>,
    )
    fireEvent.click(screen.getByRole('button', { name: '打开确认框' }))
    expect(screen.getByRole('dialog', { name: '确认操作' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '继续' }))
    expect(onOk).toHaveBeenCalledOnce()
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: '确认操作' }),
      ).not.toBeInTheDocument(),
    )
  })

  it('closes a modal with Escape and invokes onCancel', async () => {
    const onCancel = vi.fn()
    function ModalProbe() {
      const { modal } = useApp()
      return (
        <button
          type="button"
          onClick={() => modal.confirm({ title: '可取消', onCancel })}
        >
          打开可取消框
        </button>
      )
    }

    render(
      <App>
        <ModalProbe />
      </App>,
    )
    fireEvent.click(screen.getByRole('button', { name: '打开可取消框' }))
    expect(screen.getByRole('dialog', { name: '可取消' })).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: '可取消' }),
      ).not.toBeInTheDocument(),
    )
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('provides stable utility helpers and development warnings', () => {
    expect(getPrefixCls()).toBe('ui')
    expect(getPrefixCls('button')).toBe('ui-button')
    expect(getPrefixCls('button', 'custom-button')).toBe('custom-button')
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    warning(false, '测试警告')
    expect(spy).toHaveBeenCalledWith('[shared/ui] 测试警告')
    warning(true, '不应输出')
  })
})
