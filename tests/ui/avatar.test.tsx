import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Avatar, AvatarGroup, ConfigProvider, Icon } from '@/shared/ui'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Avatar', () => {
  it('keeps one accessible name, falls back after failure and retries a changed source', () => {
    const onError = vi.fn()
    const { rerender } = render(
      <Avatar src="/broken.svg" label="团队成员" onError={onError}>
        AB
      </Avatar>,
    )
    const avatar = screen.getByRole('img', { name: '团队成员' })
    const image = avatar.querySelector('img')!
    expect(screen.getAllByRole('img')).toHaveLength(1)
    expect(image).toHaveAttribute('alt', '')
    fireEvent.error(image)
    expect(onError).toHaveBeenCalledOnce()
    expect(avatar.querySelector('img')).toBeNull()
    expect(avatar).toHaveTextContent('AB')
    rerender(
      <Avatar src="/valid.svg" label="团队成员">
        AB
      </Avatar>,
    )
    expect(avatar.querySelector('img')).toHaveAttribute('src', '/valid.svg')
    rerender(
      <Avatar src="/broken.svg" label="团队成员">
        AB
      </Avatar>,
    )
    expect(avatar.querySelector('img')).toHaveAttribute('src', '/broken.svg')
  })

  it('prefers an icon as fallback and lets onError disable automatic fallback', () => {
    const veto = vi.fn(() => false)
    const { rerender } = render(
      <Avatar
        src="/broken.svg"
        label="图标成员"
        icon={<Icon name="user" />}
        onError={veto}
      >
        AB
      </Avatar>,
    )
    const avatar = screen.getByRole('img', { name: '图标成员' })
    fireEvent.error(avatar.querySelector('img')!)
    expect(veto).toHaveBeenCalledOnce()
    expect(avatar.querySelector('img')).not.toBeNull()
    rerender(
      <Avatar src="/broken.svg" label="图标成员" icon={<Icon name="user" />}>
        AB
      </Avatar>,
    )
    fireEvent.error(avatar.querySelector('img')!)
    expect(avatar.querySelector('svg')).not.toBeNull()
    expect(avatar).not.toHaveTextContent('AB')
  })

  it('forwards native image options and resets failure when srcSet changes', () => {
    const { rerender } = render(
      <Avatar
        label="响应式图片"
        src="/small.svg"
        srcSet="/large.svg 2x"
        sizes="40px"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        loading="eager"
        draggable
      />,
    )
    const avatar = screen.getByRole('img', { name: '响应式图片' })
    const image = avatar.querySelector('img')!
    expect(image).toHaveAttribute('srcset', '/large.svg 2x')
    expect(image).toHaveAttribute('sizes', '40px')
    expect(image).toHaveAttribute('crossorigin', 'anonymous')
    expect(image).toHaveAttribute('referrerpolicy', 'no-referrer')
    expect(image).toHaveAttribute('loading', 'eager')
    expect(image).toHaveAttribute('draggable', 'true')
    fireEvent.error(image)
    expect(avatar.querySelector('img')).toBeNull()
    rerender(
      <Avatar label="响应式图片" src="/small.svg" srcSet="/other.svg 2x" />,
    )
    expect(avatar.querySelector('img')).toHaveAttribute(
      'srcset',
      '/other.svg 2x',
    )
  })

  it('fits text when content, gap or container width changes and cleans up its observer', () => {
    let width = 40
    let textWidth = 80
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(
      () => width,
    )
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(
      () => textWidth,
    )
    let resize!: () => void
    const disconnect = vi.fn()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resize = callback
        }
        observe = vi.fn()
        disconnect = disconnect
      },
    )
    const { rerender, unmount } = render(
      <Avatar label="长名称">LONGNAME</Avatar>,
    )
    const text = screen.getByText('LONGNAME')
    expect(text.style.transform).toBe('scale(0.4)')
    width = 80
    fireEvent(window, new Event('resize'))
    expect(text.style.transform).toBe('scale(0.9)')
    rerender(
      <Avatar label="长名称" gap={8}>
        LONGNAME
      </Avatar>,
    )
    expect(text.style.transform).toBe('scale(0.8)')
    textWidth = 120
    act(() => resize())
    expect(text.style.transform).toBe(`scale(${64 / 120})`)
    width = 240
    fireEvent(window, new Event('resize'))
    expect(text.style.transform).toBe('scale(1)')
    expect(resize).toBeTypeOf('function')
    width = 40
    textWidth = 16
    rerender(
      <Avatar label="长名称" gap={8}>
        AB
      </Avatar>,
    )
    expect(screen.getByText('AB').style.transform).toBe('scale(1)')
    unmount()
    expect(disconnect).toHaveBeenCalledTimes(3)
  })

  it('uses valid sizes and inherits missing responsive sizes from smaller breakpoints', () => {
    const { rerender } = render(
      <Avatar label="尺寸" size={{ xs: 32, md: 48, xl: 64 }}>
        A
      </Avatar>,
    )
    const avatar = screen.getByRole('img', { name: '尺寸' })
    expect(avatar.style.getPropertyValue('--avatar-xs')).toBe('32px')
    expect(avatar.style.getPropertyValue('--avatar-sm')).toBe('32px')
    expect(avatar.style.getPropertyValue('--avatar-md')).toBe('48px')
    expect(avatar.style.getPropertyValue('--avatar-lg')).toBe('48px')
    expect(avatar.style.getPropertyValue('--avatar-xxl')).toBe('64px')
    rerender(
      <Avatar label="尺寸" size={Number.NaN}>
        A
      </Avatar>,
    )
    expect(avatar.style.getPropertyValue('--avatar-size')).toBe('40px')
    rerender(
      <Avatar
        label="尺寸"
        size={{ xs: -10, sm: 32, md: Number.POSITIVE_INFINITY }}
      >
        A
      </Avatar>,
    )
    expect(avatar.style.getPropertyValue('--avatar-xs')).toBe('40px')
    expect(avatar.style.getPropertyValue('--avatar-md')).toBe('32px')
  })
})

describe('AvatarGroup', () => {
  const items = [
    { key: 'a', label: '设计师', children: '设' },
    { key: 'b', label: '开发者', children: '开' },
    { key: 'c', label: '测试者', children: '测' },
  ]

  it('reveals all hidden names through the shared popover and closes with Escape', () => {
    render(<AvatarGroup label="项目组" items={items} maxCount={1} />)
    const group = screen.getByRole('group', { name: '项目组' })
    expect(
      within(group).getByRole('img', { name: '设计师' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('开发者')).toBeNull()
    const trigger = within(group).getByRole('button', {
      name: '查看其余 2 位成员',
    })
    trigger.focus()
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const popover = screen.getByRole('dialog', { name: '项目组 · 其余成员' })
    expect(within(popover).getByText('开发者')).toBeInTheDocument()
    expect(within(popover).getByText('测试者')).toBeInTheDocument()
    fireEvent.keyDown(trigger, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(trigger).toHaveFocus()
  })

  it('supports zero visible members, an empty group and invalid limits', () => {
    const { rerender } = render(
      <AvatarGroup label="项目组" items={items} maxCount={0} />,
    )
    expect(screen.queryByRole('img')).toBeNull()
    expect(
      screen.getByRole('button', { name: '查看其余 3 位成员' }),
    ).toBeInTheDocument()
    rerender(<AvatarGroup label="项目组" items={[]} />)
    expect(screen.getByRole('group', { name: '项目组' })).toHaveTextContent(
      '暂无成员',
    )
    expect(screen.queryByRole('button')).toBeNull()
    rerender(<AvatarGroup label="项目组" items={items} maxCount={Number.NaN} />)
    expect(screen.getAllByRole('img')).toHaveLength(3)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('applies group sizing, shape and RTL direction to members and the overflow panel', () => {
    render(
      <ConfigProvider direction="rtl">
        <AvatarGroup
          label="RTL 项目组"
          items={items}
          size="small"
          shape="square"
          maxCount={1}
        />
      </ConfigProvider>,
    )
    expect(screen.getByRole('group', { name: 'RTL 项目组' })).toHaveAttribute(
      'dir',
      'rtl',
    )
    const avatar = screen.getByRole('img', { name: '设计师' })
    expect(avatar.className).toContain('size-8')
    expect(avatar.className).not.toContain('rounded-full')
    fireEvent.click(screen.getByRole('button', { name: '查看其余 2 位成员' }))
    expect(screen.getByRole('dialog')).toHaveAttribute('dir', 'rtl')
  })
})
