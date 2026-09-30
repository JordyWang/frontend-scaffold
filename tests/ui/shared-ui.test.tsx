import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  Button,
  Card,
  Checkbox,
  ErrorBoundary,
  FormField,
  Image,
  Input,
  List,
  message,
  Modal,
  Pagination,
  Portal,
  RadioGroup,
  Switch,
  Table,
  Tabs,
  ThemeScope,
  Drawer,
} from '@/shared/ui'

describe('shared/ui contracts', () => {
  it('supports Ant Design-style button shape, block and danger contracts', () => {
    render(
      <>
        <Button
          danger
          shape="round"
          block
          icon={<span aria-hidden="true">!</span>}
        >
          删除
        </Button>
        <Button
          size="icon"
          shape="circle"
          icon={<span aria-hidden="true">+</span>}
          aria-label="新增"
        />
      </>,
    )
    expect(screen.getByRole('button', { name: '删除' })).toHaveClass(
      'bg-destructive',
      'rounded-full',
      'w-full',
    )
    expect(screen.getByRole('button', { name: '新增' })).toHaveClass(
      'rounded-full',
      'p-0',
    )
  })

  it('supports declarative card slots while keeping loading content accessible', () => {
    const onAction = vi.fn()
    const { rerender } = render(
      <Card
        title="任务结果"
        extra={<button type="button">更多</button>}
        cover={<img src="/poster.svg" alt="任务封面" />}
        actions={[
          <button type="button" onClick={onAction}>
            打开
          </button>,
        ]}
        hoverable
      >
        <p>已完成</p>
      </Card>,
    )
    expect(screen.getByText('任务结果')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '任务封面' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '打开' }))
    expect(onAction).toHaveBeenCalledOnce()

    rerender(<Card title="加载中" loading />)
    expect(screen.getByRole('status', { name: '正在加载' })).toBeInTheDocument()
    expect(screen.queryByText('已完成')).toBeNull()
  })

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
    expect(input).toHaveAttribute('aria-labelledby', 'custom-name-label')
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
    expect(screen.getByRole('button', { name: '前往第 1 页' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    fireEvent.click(screen.getByRole('button', { name: '前往第 3 页' }))
    expect(onPageChange).toHaveBeenCalledWith(3)
    fireEvent.click(screen.getByRole('button', { name: '下一页' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('shows a bounded page window and keeps navigation disabled while loading', () => {
    const onPageChange = vi.fn()
    render(
      <Pagination
        page={20}
        pageSize={10}
        total={500}
        onPageChange={onPageChange}
        loading
      />,
    )
    expect(screen.getByRole('button', { name: '前往第 1 页' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: '前往第 20 页' }),
    ).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: '前往第 50 页' })).toBeDisabled()
    expect(screen.getAllByText('…')).toHaveLength(2)
    expect(
      screen.getAllByRole('button', { name: /前往第/ }).length,
    ).toBeLessThanOrEqual(7)
  })

  it('guards pagination against an invalid page size', () => {
    const onPageChange = vi.fn()
    render(
      <Pagination
        page={1}
        pageSize={0}
        total={2}
        onPageChange={onPageChange}
      />,
    )
    expect(screen.getByRole('button', { name: '下一页' })).toBeEnabled()
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

  it('keeps list context and custom layout across data states', () => {
    const props = {
      items: [{ id: 'one', name: '任务一' }],
      getKey: (row: { id: string; name: string }) => row.id,
      renderItem: (row: { id: string; name: string }) => row.name,
      label: '任务列表',
      className: 'custom-list',
    }
    const { rerender } = render(<List {...props} loading />)
    const region = screen.getByRole('region', { name: '任务列表' })
    expect(region).toHaveClass('custom-list')
    expect(region).toHaveAttribute('aria-busy', 'true')
    expect(region).toContainElement(screen.getByRole('status'))

    rerender(<List {...props} error="加载失败" />)
    expect(region).not.toHaveAttribute('aria-busy')
    expect(region).toContainElement(screen.getByRole('alert'))

    rerender(<List {...props} items={[]} />)
    expect(region).toContainElement(screen.getByRole('status'))
    expect(screen.getByText('暂无内容')).toBeInTheDocument()

    rerender(<List {...props} />)
    expect(screen.getByRole('list', { name: '任务列表' })).toHaveTextContent(
      '任务一',
    )
    expect(region).toHaveClass('custom-list')
  })

  it('keeps table semantics and region context across data states', () => {
    const columns = [
      {
        key: 'name',
        header: '名称',
        rowScope: 'row' as const,
        render: (row: { id: string; name: string }) => row.name,
      },
      {
        key: 'status',
        header: '状态',
        render: (row: { id: string; name: string; status: string }) =>
          row.status,
      },
    ]
    const rows = [{ id: '1', name: '任务一', status: '进行中' }]
    const { rerender } = render(
      <Table
        caption="任务表"
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        className="test-table"
      />,
    )
    expect(screen.getByRole('region', { name: '任务表' })).toHaveClass(
      'test-table',
    )
    expect(screen.getByRole('rowheader', { name: '任务一' })).toHaveAttribute(
      'scope',
      'row',
    )

    rerender(
      <Table
        caption="任务表"
        columns={columns}
        rows={[]}
        getRowKey={(row) => row.id}
        className="test-table"
      />,
    )
    expect(screen.getByRole('region', { name: '任务表' })).toHaveClass(
      'test-table',
    )
    expect(screen.getByRole('status')).toHaveTextContent('暂无数据')
  })

  it('supports controlled tabs, disabled entries and vertical orientation', () => {
    const onValueChange = vi.fn()
    const items = [
      {
        value: 'disabled',
        label: '不可用',
        content: '不可用内容',
        disabled: true,
      },
      { value: 'first', label: '第一项', content: '第一项内容' },
      { value: 'second', label: '第二项', content: '第二项内容' },
    ]
    const { rerender } = render(
      <Tabs
        items={items}
        value="first"
        onValueChange={onValueChange}
        orientation="vertical"
        activationMode="manual"
      />,
    )
    expect(screen.getByRole('tablist')).toHaveAttribute(
      'aria-orientation',
      'vertical',
    )
    expect(screen.getByRole('tablist').parentElement).toHaveClass('flex-row')
    expect(screen.getByRole('tablist')).toHaveClass('flex-col')
    expect(screen.getByRole('tab', { name: '不可用' })).toBeDisabled()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('第一项内容')
    const secondTab = screen.getByRole('tab', { name: '第二项' })
    secondTab.focus()
    fireEvent.keyDown(secondTab, { key: 'Enter' })
    expect(onValueChange).toHaveBeenCalledWith('second')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('第一项内容')
    rerender(
      <Tabs
        items={items}
        value="second"
        onValueChange={onValueChange}
        orientation="vertical"
      />,
    )
    expect(screen.getByRole('tabpanel')).toHaveTextContent('第二项内容')
  })

  it('keeps an uncontrolled tab panel visible when the active item disappears', () => {
    const items = [
      { value: 'first', label: '第一项', content: '第一项内容' },
      { value: 'second', label: '第二项', content: '第二项内容' },
    ]
    const { rerender } = render(
      <Tabs items={items} defaultValue="second" label="动态分组" />,
    )
    expect(screen.getByRole('tabpanel')).toHaveTextContent('第二项内容')
    screen.getByRole('tab', { name: '第二项' }).focus()

    rerender(
      <Tabs items={items.slice(0, 1)} defaultValue="second" label="动态分组" />,
    )
    expect(screen.getByRole('tab', { name: '第一项' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tabpanel')).toHaveTextContent('第一项内容')
    expect(screen.getByRole('tab', { name: '第一项' })).toHaveFocus()

    rerender(<Tabs items={items} defaultValue="second" label="动态分组" />)
    expect(screen.getByRole('tabpanel')).toHaveTextContent('第二项内容')
    screen.getByRole('tab', { name: '第二项' }).focus()

    rerender(
      <Tabs
        items={[items[0], { ...items[1], disabled: true }]}
        defaultValue="second"
        label="动态分组"
      />,
    )
    expect(screen.getByRole('tab', { name: '第一项' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tabpanel')).toHaveTextContent('第一项内容')
    expect(screen.getByRole('tab', { name: '第一项' })).toHaveFocus()
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
      <ThemeScope
        mode="dark"
        density="compact"
        tokens={{
          primary: '#4096ff',
          components: {
            button: { radius: '999px', height: '48px' },
            field: { height: '48px' },
            card: { radius: '1rem' },
            overlay: { radius: '1.25rem' },
            menu: { radius: '0.75rem' },
            segmented: { radius: '0.5rem', height: '46px' },
          },
        }}
      >
        局部主题
      </ThemeScope>,
    )
    const scope = screen.getByText('局部主题')
    expect(scope).toHaveAttribute('data-ui-theme', 'dark')
    expect(scope).toHaveAttribute('data-ui-density', 'compact')
    expect(scope).toHaveStyle({ '--ui-seed-primary': '#4096ff' })
    expect(scope).toHaveStyle({ '--ui-map-primary-text': '#111827' })
    expect(scope).toHaveStyle({ '--ui-map-accent-text': 'var(--foreground)' })
    expect(scope).toHaveStyle({ '--ui-button-radius-override': '999px' })
    expect(scope).toHaveStyle({ '--ui-button-height-override': '48px' })
    expect(scope).toHaveStyle({ '--ui-field-height-override': '48px' })
    expect(scope).toHaveStyle({ '--ui-card-radius-override': '1rem' })
    expect(scope).toHaveStyle({ '--ui-overlay-radius-override': '1.25rem' })
    expect(scope).toHaveStyle({ '--ui-menu-radius-override': '0.75rem' })
    expect(scope).toHaveStyle({ '--ui-segmented-radius-override': '0.5rem' })
    expect(scope).toHaveStyle({ '--ui-segmented-height-override': '46px' })
    expect(document.documentElement).not.toHaveAttribute('data-ui-theme')
  })

  it('provides Ant Design semantic aliases without changing project APIs', () => {
    render(
      <>
        <Modal
          title="模态框"
          trigger={<button type="button">打开模态框</button>}
        >
          内容
        </Modal>
        <Drawer title="抽屉" trigger={<button type="button">打开抽屉</button>}>
          内容
        </Drawer>
      </>,
    )
    expect(
      screen.getByRole('button', { name: '打开模态框' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '打开抽屉' })).toBeInTheDocument()
  })

  it('exposes message helpers alongside the project toast API', () => {
    expect(typeof message.success).toBe('function')
    expect(typeof message.loading).toBe('function')
    expect(typeof message.destroy).toBe('function')
  })

  it('accepts explicit status foregrounds for non-hex theme values', () => {
    render(
      <ThemeScope
        tokens={{
          success: 'var(--brand-success)',
          onSuccess: '#ffffff',
          warning: 'rgb(240 180 20)',
          onWarning: '#111827',
          error: 'var(--brand-error)',
          onError: '#ffffff',
        }}
      >
        非十六进制状态主题
      </ThemeScope>,
    )
    const scope = screen.getByText('非十六进制状态主题')
    expect(scope).toHaveStyle({ '--ui-map-success-text': '#ffffff' })
    expect(scope).toHaveStyle({ '--ui-map-warning-text': '#111827' })
    expect(scope).toHaveStyle({ '--ui-map-error-text': '#ffffff' })
    expect(scope).toHaveStyle({ '--ui-map-danger-text': '#ffffff' })
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
