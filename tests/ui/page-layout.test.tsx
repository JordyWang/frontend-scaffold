import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Layout } from '@/shared/ui'

afterEach(() => vi.unstubAllGlobals())

describe('Layout', () => {
  it('composes semantic header, main, footer and nested sidebars', () => {
    render(
      <Layout aria-label="页面布局">
        <Layout.Header>页头</Layout.Header>
        <Layout>
          <Layout.Sider label="导航" width={180}>
            导航内容
          </Layout.Sider>
          <Layout.Content>主要内容</Layout.Content>
        </Layout>
        <Layout.Footer>页脚</Layout.Footer>
      </Layout>,
    )
    expect(screen.getByRole('banner')).toHaveTextContent('页头')
    expect(screen.getByRole('main')).toHaveTextContent('主要内容')
    expect(screen.getByRole('contentinfo')).toHaveTextContent('页脚')
    expect(
      screen.getByRole('complementary', { name: '导航' }),
    ).toHaveTextContent('导航内容')
    expect(screen.getByText('导航内容').closest('aside')).toHaveStyle({
      width: '180px',
    })
    expect(screen.getByText('主要内容').parentElement).toHaveClass('flex-row')
  })

  it('keeps controlled collapse authoritative until the parent updates it', () => {
    const onCollapse = vi.fn()
    const { rerender } = render(
      <Layout>
        <Layout.Sider
          label="导航"
          collapsed={false}
          collapsible
          onCollapse={onCollapse}
        >
          菜单
        </Layout.Sider>
        <Layout.Content as="div">内容</Layout.Content>
      </Layout>,
    )
    const trigger = screen.getByRole('button', { name: '收起导航' })
    fireEvent.click(trigger)
    expect(onCollapse).toHaveBeenCalledWith(true, 'trigger')
    expect(
      screen.getByRole('complementary', { name: '导航' }),
    ).not.toHaveAttribute('data-collapsed')
    rerender(
      <Layout>
        <Layout.Sider
          label="导航"
          collapsed
          collapsible
          onCollapse={onCollapse}
        >
          菜单
        </Layout.Sider>
        <Layout.Content as="div">内容</Layout.Content>
      </Layout>,
    )
    expect(screen.getByRole('button', { name: '展开导航' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(screen.queryByText('菜单')).not.toBeInTheDocument()
  })

  it('responds to a breakpoint and opens mobile navigation through Sheet', () => {
    let notify: ((event: { matches: boolean }) => void) | undefined
    let matches = false
    vi.stubGlobal('matchMedia', () => ({
      get matches() {
        return matches
      },
      addEventListener: (_name: string, listener: typeof notify) => {
        notify = listener
      },
      removeEventListener: () => {},
    }))
    const onBreakpoint = vi.fn()
    const onCollapse = vi.fn()
    render(
      <Layout>
        <Layout.Sider
          label="导航"
          breakpoint="md"
          onBreakpoint={onBreakpoint}
          onCollapse={onCollapse}
        >
          <button type="button">菜单操作</button>
        </Layout.Sider>
        <Layout.Content as="div">内容</Layout.Content>
      </Layout>,
    )
    matches = true
    act(() => notify?.({ matches: true }))
    expect(onBreakpoint).toHaveBeenCalledWith(true)
    expect(onCollapse).toHaveBeenCalledWith(true, 'breakpoint')
    const trigger = screen.getByRole('button', { name: '展开导航' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(
      screen.queryByRole('button', { name: '菜单操作' }),
    ).not.toBeInTheDocument()

    fireEvent.click(trigger)
    expect(onCollapse).toHaveBeenCalledWith(false, 'trigger')
    expect(screen.getByRole('dialog', { name: '导航' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '菜单操作' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '关闭面板' }))
    expect(onCollapse).toHaveBeenLastCalledWith(true, 'trigger')
    expect(
      screen.queryByRole('dialog', { name: '导航' }),
    ).not.toBeInTheDocument()
  })
})
