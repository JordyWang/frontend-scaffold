import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfigProvider, Image, ImagePreviewGroup } from '@/shared/ui'

function loadPreview(dialog: HTMLElement, width = 640, height = 360) {
  const image = dialog.querySelector<HTMLImageElement>(
    '[data-ui-image-preview]',
  )!
  Object.defineProperties(image, {
    naturalWidth: { configurable: true, value: width },
    naturalHeight: { configurable: true, value: height },
  })
  fireEvent.load(image)
  return image
}

describe('Image preview', () => {
  it('opens a named preview, limits transforms and returns focus to its thumbnail', async () => {
    const onOpenChange = vi.fn()
    render(
      <Image
        src="/cover.svg"
        alt="视频封面"
        preview={{ maxScale: 2, onOpenChange }}
      />,
    )
    const trigger = screen.getByRole('button', { name: '预览：视频封面' })
    trigger.focus()
    fireEvent.click(trigger)
    const dialog = screen.getByRole('dialog', { name: '图片预览' })
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(
      within(dialog).getByRole('button', { name: '放大图片' }),
    ).toBeDisabled()
    const image = loadPreview(dialog)
    fireEvent.click(within(dialog).getByRole('button', { name: '放大图片' }))
    fireEvent.click(within(dialog).getByRole('button', { name: '放大图片' }))
    expect(
      within(dialog).getByRole('status', { name: '图片缩放比例' }),
    ).toHaveTextContent('200%')
    expect(
      within(dialog).getByRole('button', { name: '放大图片' }),
    ).toBeDisabled()
    fireEvent.click(
      within(dialog).getByRole('button', { name: '向右旋转图片' }),
    )
    expect(image.style.transform).toContain('rotate(90deg)')
    const flip = within(dialog).getByRole('button', { name: '水平翻转图片' })
    fireEvent.click(flip)
    expect(flip).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(within(dialog).getByRole('button', { name: '重置图片' }))
    expect(flip).toHaveAttribute('aria-pressed', 'false')
    expect(
      within(dialog).getByRole('button', { name: '缩小图片' }),
    ).toBeDisabled()
    fireEvent.keyDown(dialog.querySelector('header')!, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(trigger).toHaveFocus()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('honors controlled open state and retries failed full-size images', () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <Image
        src="/thumbnail.svg"
        alt="大图"
        preview={{ src: '/full.svg', open: false, onOpenChange }}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '预览：大图' }))
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.queryByRole('dialog')).toBeNull()
    rerender(
      <Image
        src="/thumbnail.svg"
        alt="大图"
        preview={{ src: '/full.svg', open: true, onOpenChange }}
      />,
    )
    const dialog = screen.getByRole('dialog', { name: '图片预览' })
    const firstImage = dialog.querySelector<HTMLImageElement>(
      '[data-ui-image-preview]',
    )!
    expect(firstImage).toHaveAttribute('src', '/full.svg')
    fireEvent.error(firstImage)
    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      '图片预览加载失败',
    )
    fireEvent.click(
      within(dialog).getByRole('button', { name: '重试加载图片' }),
    )
    expect(dialog.querySelector('[data-ui-image-preview]')).not.toBe(firstImage)
    loadPreview(dialog)
    expect(within(dialog).queryByRole('alert')).toBeNull()
    expect(
      within(dialog).getByRole('button', { name: '放大图片' }),
    ).toBeEnabled()
  })

  it('keeps display-only images native and recovers after a source change', () => {
    const onError = vi.fn()
    const { rerender } = render(
      <Image
        src="/broken.svg"
        alt="封面"
        fallback="图片不可用"
        preview={false}
        onError={onError}
      />,
    )
    expect(screen.queryByRole('button')).toBeNull()
    fireEvent.error(screen.getByRole('img', { name: '封面' }))
    expect(onError).toHaveBeenCalledOnce()
    expect(screen.getByRole('img', { name: '封面' })).toHaveTextContent(
      '图片不可用',
    )
    rerender(<Image src="/new.svg" alt="封面" preview={false} />)
    expect(screen.getByRole('img', { name: '封面' })).toHaveAttribute(
      'src',
      '/new.svg',
    )
  })

  it('supports wheel zoom and keyboard panning within image bounds', () => {
    render(
      <Image src="/cover.svg" alt="封面" preview={{ defaultOpen: true }} />,
    )
    const dialog = screen.getByRole('dialog', { name: '图片预览' })
    const stage = within(dialog).getByRole('group', { name: '图片预览区域' })
    Object.defineProperties(stage, {
      clientWidth: { configurable: true, value: 320 },
      clientHeight: { configurable: true, value: 300 },
    })
    fireEvent(window, new Event('resize'))
    const image = loadPreview(dialog)
    fireEvent.wheel(stage, { deltaY: -100 })
    expect(
      within(dialog).getByRole('status', { name: '图片缩放比例' }),
    ).toHaveTextContent('150%')
    fireEvent.keyDown(stage, { key: 'ArrowRight', shiftKey: true })
    expect(image.style.transform).toContain('translate(40px, 0px)')
    for (let index = 0; index < 10; index++)
      fireEvent.keyDown(stage, { key: 'ArrowRight', shiftKey: true })
    expect(image.style.transform).toContain('translate(80px, 0px)')
    fireEvent.keyDown(stage, { key: '0' })
    expect(
      within(dialog).getByRole('status', { name: '图片缩放比例' }),
    ).toHaveTextContent('100%')
  })

  it('resets transforms on gallery changes and restores the activated thumbnail', async () => {
    render(
      <ImagePreviewGroup
        items={[
          { src: '/one.svg', alt: '第一张' },
          { src: '/two.svg', alt: '第二张' },
        ]}
      />,
    )
    const trigger = screen.getByRole('button', { name: '预览：第二张' })
    trigger.focus()
    fireEvent.click(trigger)
    const dialog = screen.getByRole('dialog', { name: '相册预览' })
    loadPreview(dialog)
    fireEvent.click(within(dialog).getByRole('button', { name: '放大图片' }))
    const previous = within(dialog).getByRole('button', { name: '上一张图片' })
    previous.focus()
    fireEvent.click(previous)
    expect(
      within(dialog).getByRole('status', { name: '图片序号' }),
    ).toHaveTextContent('1 / 2')
    expect(
      within(dialog).getByRole('status', { name: '图片缩放比例' }),
    ).toHaveTextContent('100%')
    expect(dialog.querySelector('[data-ui-image-preview]')).toHaveAttribute(
      'alt',
      '第一张',
    )
    loadPreview(dialog)
    fireEvent.keyDown(dialog.querySelector('header')!, { key: 'ArrowRight' })
    expect(
      within(dialog).getByRole('status', { name: '图片序号' }),
    ).toHaveTextContent('2 / 2')
    fireEvent.click(
      within(dialog).getByRole('button', { name: '关闭图片预览' }),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(trigger).toHaveFocus()
  })

  it('supports two-pointer pinch and drag while optional wheel zoom is disabled', () => {
    render(
      <Image
        src="/cover.svg"
        alt="封面"
        preview={{ defaultOpen: true, wheel: false }}
      />,
    )
    const dialog = screen.getByRole('dialog', { name: '图片预览' })
    const stage = within(dialog).getByRole('group', { name: '图片预览区域' })
    Object.defineProperties(stage, {
      clientWidth: { configurable: true, value: 320 },
      clientHeight: { configurable: true, value: 300 },
    })
    fireEvent(window, new Event('resize'))
    const image = loadPreview(dialog)
    fireEvent.wheel(stage, { deltaY: -100 })
    expect(
      within(dialog).getByRole('status', { name: '图片缩放比例' }),
    ).toHaveTextContent('100%')
    const pointer = (type: string, pointerId: number, clientX: number) => {
      const event = new Event(type, { bubbles: true })
      Object.defineProperties(event, {
        button: { value: 0 },
        pointerId: { value: pointerId },
        clientX: { value: clientX },
        clientY: { value: 100 },
      })
      fireEvent(stage, event)
    }
    pointer('pointerdown', 1, 100)
    pointer('pointerdown', 2, 200)
    pointer('pointermove', 2, 250)
    expect(
      within(dialog).getByRole('status', { name: '图片缩放比例' }),
    ).toHaveTextContent('150%')
    pointer('pointerup', 2, 250)
    pointer('pointermove', 1, 130)
    expect(image.style.transform).toContain('translate(30px, 0px)')
    pointer('pointerup', 1, 130)
    fireEvent.click(stage)
    expect(dialog).toBeInTheDocument()
  })

  it('clamps controlled gallery indices and follows RTL keyboard order', () => {
    const onCurrentChange = vi.fn()
    const items = [
      { src: '/one.svg', alt: '第一张' },
      { src: '/two.svg', alt: '第二张' },
    ]
    const { rerender } = render(
      <ConfigProvider direction="rtl">
        <ImagePreviewGroup
          items={items}
          current={99}
          open
          onCurrentChange={onCurrentChange}
        />
      </ConfigProvider>,
    )
    const dialog = screen.getByRole('dialog', { name: '相册预览' })
    expect(
      within(dialog).getByRole('status', { name: '图片序号' }),
    ).toHaveTextContent('2 / 2')
    fireEvent.keyDown(dialog.querySelector('header')!, { key: 'ArrowRight' })
    expect(onCurrentChange).toHaveBeenCalledWith(0)
    expect(
      within(dialog).getByRole('status', { name: '图片序号' }),
    ).toHaveTextContent('2 / 2')
    rerender(<ImagePreviewGroup items={[]} current={99} open />)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText('暂无图片')).toBeInTheDocument()
  })
})
