import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  App,
  ConfigProvider,
  getPrefixCls,
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
