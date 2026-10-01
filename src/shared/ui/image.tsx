import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ImgHTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { Alert } from './alert'
import { Button } from './button'
import { useConfig } from './config-context'
import { Empty } from './empty'
import { Icon } from './icon'
import { usePortalContainer } from './portal-context'
import { Spinner } from './spinner'

export type ImagePreviewOptions = {
  src?: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  label?: string
  maxScale?: number
  scaleStep?: number
  wheel?: boolean
  maskClosable?: boolean
}

export type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'alt'> & {
  alt: string
  fallback?: ReactNode
  preview?: boolean | ImagePreviewOptions
  containerClassName?: string
}

export type ImagePreviewItem = {
  src: string
  alt: string
  thumbnailSrc?: string
}

export type ImagePreviewGroupProps = Omit<ImagePreviewOptions, 'src'> & {
  items: ImagePreviewItem[]
  current?: number
  defaultCurrent?: number
  onCurrentChange?: (current: number) => void
  className?: string
  imageClassName?: string
}

type ImageTransform = {
  scale: number
  rotate: number
  flipX: boolean
  flipY: boolean
  x: number
  y: number
}

type ImageSize = { width: number; height: number }

type ImageView = {
  source: string
  natural: ImageSize
  transform: ImageTransform
  failed: boolean
  attempt: number
}

const initialTransform: ImageTransform = {
  scale: 1,
  rotate: 0,
  flipX: false,
  flipY: false,
  x: 0,
  y: 0,
}

const thumbnailButtonStyles =
  'relative inline-block min-h-11 min-w-11 w-fit max-w-full cursor-zoom-in touch-manipulation overflow-hidden rounded-[var(--radius-md)] bg-transparent p-0 align-top focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

function initialView(source: string): ImageView {
  return {
    source,
    natural: { width: 0, height: 0 },
    transform: initialTransform,
    failed: false,
    attempt: 0,
  }
}

function fittedSize(natural: ImageSize, stage: ImageSize, rotation: number) {
  const quarterTurn = Math.abs(rotation % 180) === 90
  const width = quarterTurn ? natural.height : natural.width
  const height = quarterTurn ? natural.width : natural.height
  const ratio =
    width > 0 && height > 0 && stage.width > 0 && stage.height > 0
      ? Math.min(1, stage.width / width, stage.height / height)
      : 1
  return { width: natural.width * ratio, height: natural.height * ratio }
}

function limitTransform(
  transform: ImageTransform,
  natural: ImageSize,
  stage: ImageSize,
  maxScale: number,
) {
  const scale = Math.max(1, Math.min(maxScale, transform.scale))
  const fit = fittedSize(natural, stage, transform.rotate)
  const quarterTurn = Math.abs(transform.rotate % 180) === 90
  const width = quarterTurn ? fit.height : fit.width
  const height = quarterTurn ? fit.width : fit.height
  const maxX = Math.max(0, (width * scale - stage.width) / 2)
  const maxY = Math.max(0, (height * scale - stage.height) / 2)
  return {
    ...transform,
    scale,
    x: Math.max(-maxX, Math.min(maxX, transform.x)),
    y: Math.max(-maxY, Math.min(maxY, transform.y)),
  }
}

function PreviewCanvas({
  item,
  current,
  total,
  onCurrentChange,
  label,
  maxScale = 8,
  scaleStep = 0.5,
  wheel = true,
  maskClosable = true,
  onClose,
}: {
  item: ImagePreviewItem
  current: number
  total: number
  onCurrentChange?: (current: number) => void
  label: string
  maxScale?: number
  scaleStep?: number
  wheel?: boolean
  maskClosable?: boolean
  onClose: () => void
}) {
  const { direction } = useConfig()
  const stageRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const gestureMoved = useRef(false)
  const [stage, setStage] = useState<ImageSize>({ width: 0, height: 0 })
  const source = `${current}:${item.src}`
  const [storedView, setView] = useState(() => initialView(source))
  const view = storedView.source === source ? storedView : initialView(source)
  const { natural, transform, failed, attempt } = view
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const drag = useRef<{ x: number; y: number; origin: ImageTransform } | null>(
    null,
  )
  const pinch = useRef<{ distance: number; scale: number } | null>(null)
  const safeMax = Number.isFinite(maxScale)
    ? Math.max(1, Math.min(50, maxScale))
    : 8
  const factor =
    1 +
    (Number.isFinite(scaleStep) ? Math.max(0.1, Math.min(4, scaleStep)) : 0.5)
  const visibleTransform = limitTransform(transform, natural, stage, safeMax)
  const fit = fittedSize(natural, stage, transform.rotate)
  const loaded = natural.width > 0 && !failed
  const changeView = useCallback(
    (update: (previous: ImageView) => ImageView) =>
      setView((previous) =>
        update(previous.source === source ? previous : initialView(source)),
      ),
    [source],
  )
  const changeTransform = useCallback(
    (update: (previous: ImageTransform) => ImageTransform) => {
      changeView((previous) => ({
        ...previous,
        transform: limitTransform(
          update(limitTransform(previous.transform, natural, stage, safeMax)),
          natural,
          stage,
          safeMax,
        ),
      }))
    },
    [changeView, natural, safeMax, stage],
  )

  useEffect(() => {
    pointers.current.clear()
    drag.current = null
    pinch.current = null
    gestureMoved.current = false
  }, [source])

  useEffect(() => {
    const element = stageRef.current
    if (!element) return
    const measure = () => {
      const style = getComputedStyle(element)
      setStage({
        width:
          element.clientWidth -
          (Number.parseFloat(style.paddingLeft) || 0) -
          (Number.parseFloat(style.paddingRight) || 0),
        height:
          element.clientHeight -
          (Number.parseFloat(style.paddingTop) || 0) -
          (Number.parseFloat(style.paddingBottom) || 0),
      })
    }
    measure()
    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    observer?.observe(element)
    window.addEventListener('resize', measure)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  useEffect(() => {
    const element = stageRef.current
    if (!element || !wheel || !loaded) return
    const zoom = (event: WheelEvent) => {
      if (event.deltaY === 0) return
      event.preventDefault()
      event.stopPropagation()
      changeTransform((previous) => ({
        ...previous,
        scale: previous.scale * (event.deltaY < 0 ? factor : 1 / factor),
      }))
    }
    element.addEventListener('wheel', zoom, { passive: false })
    return () => element.removeEventListener('wheel', zoom)
  }, [changeTransform, factor, loaded, wheel])

  const clearPointer = (pointerId: number) => {
    pointers.current.delete(pointerId)
    pinch.current = null
    const remaining = Array.from(pointers.current.values())[0]
    drag.current = remaining ? { ...remaining, origin: visibleTransform } : null
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      onKeyDown={(event) => {
        if (event.altKey || event.ctrlKey || event.metaKey) return
        if (event.shiftKey && event.key.startsWith('Arrow') && loaded) {
          event.preventDefault()
          changeTransform((previous) => ({
            ...previous,
            x:
              previous.x +
              (event.key === 'ArrowLeft'
                ? -40
                : event.key === 'ArrowRight'
                  ? 40
                  : 0),
            y:
              previous.y +
              (event.key === 'ArrowUp'
                ? -40
                : event.key === 'ArrowDown'
                  ? 40
                  : 0),
          }))
        } else if (
          total > 1 &&
          ['ArrowLeft', 'ArrowRight'].includes(event.key)
        ) {
          event.preventDefault()
          const next = (event.key === 'ArrowRight') !== (direction === 'rtl')
          const nextCurrent = Math.max(
            0,
            Math.min(total - 1, current + (next ? 1 : -1)),
          )
          if (nextCurrent !== current) onCurrentChange?.(nextCurrent)
        } else if (loaded && ['+', '=', '-', '0'].includes(event.key)) {
          event.preventDefault()
          if (event.key === '0')
            changeView((previous) => ({
              ...previous,
              transform: initialTransform,
            }))
          else
            changeTransform((previous) => ({
              ...previous,
              scale: previous.scale * (event.key === '-' ? 1 / factor : factor),
            }))
        }
      }}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-border pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(0.5rem,env(safe-area-inset-top))] pb-2">
        <DialogPrimitive.Title className="sr-only">
          {label}
        </DialogPrimitive.Title>
        <DialogPrimitive.Description className="sr-only">
          使用加减键缩放，0 重置，Shift
          加方向键移动图片；相册可用左右方向键切换，Escape 关闭。
        </DialogPrimitive.Description>
        <p className="min-w-0 flex-1 truncate font-semibold">{item.alt}</p>
        <DialogPrimitive.Close asChild>
          <Button variant="ghost" size="icon" aria-label="关闭图片预览">
            <Icon name="close" />
          </Button>
        </DialogPrimitive.Close>
      </header>
      <div
        ref={stageRef}
        role="group"
        aria-label="图片预览区域"
        className="relative flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden py-2 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]"
        onPointerDown={(event) => {
          if (!loaded || event.button !== 0) return
          event.currentTarget.setPointerCapture?.(event.pointerId)
          const point = { x: event.clientX, y: event.clientY }
          pointers.current.set(event.pointerId, point)
          if (pointers.current.size === 1) {
            gestureMoved.current = false
            drag.current = { ...point, origin: visibleTransform }
          } else if (pointers.current.size === 2) {
            gestureMoved.current = true
            const [first, second] = Array.from(pointers.current.values())
            pinch.current = {
              distance: Math.hypot(first.x - second.x, first.y - second.y),
              scale: visibleTransform.scale,
            }
          }
        }}
        onPointerMove={(event) => {
          if (!pointers.current.has(event.pointerId)) return
          pointers.current.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
          })
          if (pointers.current.size === 2 && pinch.current) {
            const [first, second] = Array.from(pointers.current.values())
            const distance = Math.hypot(first.x - second.x, first.y - second.y)
            const gesture = pinch.current
            if (gesture.distance > 0)
              changeTransform((previous) => ({
                ...previous,
                scale: gesture.scale * (distance / gesture.distance),
              }))
          } else if (pointers.current.size === 1 && drag.current) {
            const gesture = drag.current
            if (
              Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) >
              4
            )
              gestureMoved.current = true
            changeTransform((previous) => ({
              ...previous,
              x: gesture.origin.x + event.clientX - gesture.x,
              y: gesture.origin.y + event.clientY - gesture.y,
            }))
          }
        }}
        onPointerUp={(event) => clearPointer(event.pointerId)}
        onPointerCancel={(event) => clearPointer(event.pointerId)}
        onLostPointerCapture={(event) => clearPointer(event.pointerId)}
        onClick={(event) => {
          if (
            !maskClosable ||
            gestureMoved.current ||
            event.target !== event.currentTarget
          )
            return
          const rect = loaded ? imageRef.current?.getBoundingClientRect() : null
          if (
            !rect ||
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onClose()
        }}
      >
        {failed ? (
          <Alert
            title="图片预览加载失败"
            description="请重试加载图片。"
            tone="error"
            action={
              <Button
                variant="outline"
                onClick={() => {
                  changeView((previous) => ({
                    ...initialView(source),
                    attempt: previous.attempt + 1,
                  }))
                }}
              >
                重试加载图片
              </Button>
            }
          />
        ) : (
          <>
            {!loaded && (
              <div className="absolute inset-0 grid place-items-center">
                <Spinner label="正在加载图片预览" />
              </div>
            )}
            <img
              key={`${source}:${attempt}`}
              ref={imageRef}
              src={item.src}
              alt={item.alt}
              draggable={false}
              data-ui-image-preview=""
              className={cn(
                'pointer-events-none shrink-0 select-none object-contain',
                !loaded && 'max-h-full max-w-full',
              )}
              style={{
                width: natural.width > 0 ? fit.width : undefined,
                height: natural.height > 0 ? fit.height : undefined,
                visibility: loaded ? 'visible' : 'hidden',
                transform: `translate(${visibleTransform.x}px, ${visibleTransform.y}px) rotate(${visibleTransform.rotate}deg) scale(${visibleTransform.scale * (visibleTransform.flipX ? -1 : 1)}, ${visibleTransform.scale * (visibleTransform.flipY ? -1 : 1)})`,
              }}
              onLoad={(event) => {
                const naturalSize = {
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                }
                changeView((previous) => ({
                  ...previous,
                  natural: naturalSize,
                }))
              }}
              onError={() =>
                changeView((previous) => ({ ...previous, failed: true }))
              }
            />
          </>
        )}
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-t border-border pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {total > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="上一张图片"
              disabled={current === 0}
              onClick={() => onCurrentChange?.(current - 1)}
            >
              <Icon name={direction === 'rtl' ? 'arrowRight' : 'arrowLeft'} />
            </Button>
            <span
              role="status"
              aria-label="图片序号"
              className="min-w-12 text-center text-sm tabular-nums"
            >
              {current + 1} / {total}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="下一张图片"
              disabled={current === total - 1}
              onClick={() => onCurrentChange?.(current + 1)}
            >
              <Icon name={direction === 'rtl' ? 'arrowLeft' : 'arrowRight'} />
            </Button>
          </div>
        )}
        <div
          role="group"
          aria-label="图片预览工具"
          className="flex flex-wrap items-center justify-center gap-2"
        >
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="缩小图片"
              disabled={!loaded || visibleTransform.scale <= 1}
              onClick={() =>
                changeTransform((previous) => ({
                  ...previous,
                  scale: previous.scale / factor,
                }))
              }
            >
              <Icon name="zoomOut" />
            </Button>
            <span
              role="status"
              aria-label="图片缩放比例"
              className="min-w-12 text-center text-sm tabular-nums"
            >
              {Math.round(visibleTransform.scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="放大图片"
              disabled={!loaded || visibleTransform.scale >= safeMax}
              onClick={() =>
                changeTransform((previous) => ({
                  ...previous,
                  scale: previous.scale * factor,
                }))
              }
            >
              <Icon name="zoomIn" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="向左旋转图片"
              disabled={!loaded}
              onClick={() =>
                changeTransform((previous) => ({
                  ...previous,
                  rotate: previous.rotate - 90,
                }))
              }
            >
              <Icon name="rotateLeft" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="向右旋转图片"
              disabled={!loaded}
              onClick={() =>
                changeTransform((previous) => ({
                  ...previous,
                  rotate: previous.rotate + 90,
                }))
              }
            >
              <Icon name="rotateRight" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="水平翻转图片"
              disabled={!loaded}
              aria-pressed={visibleTransform.flipX}
              onClick={() =>
                changeTransform((previous) => ({
                  ...previous,
                  flipX: !previous.flipX,
                }))
              }
            >
              <Icon name="flipHorizontal" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="垂直翻转图片"
              disabled={!loaded}
              aria-pressed={visibleTransform.flipY}
              onClick={() =>
                changeTransform((previous) => ({
                  ...previous,
                  flipY: !previous.flipY,
                }))
              }
            >
              <Icon name="flipVertical" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="重置图片"
              disabled={!loaded}
              onClick={() =>
                changeView((previous) => ({
                  ...previous,
                  transform: initialTransform,
                }))
              }
            >
              <Icon name="reset" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}

function PreviewDialog({
  children,
  items,
  current,
  onCurrentChange,
  open,
  onOpenChange,
  restoreFocus,
  label = '图片预览',
  ...options
}: Omit<ImagePreviewOptions, 'src' | 'defaultOpen'> & {
  children: ReactNode
  items: ImagePreviewItem[]
  current: number
  onCurrentChange?: (current: number) => void
  restoreFocus: (previous: HTMLElement | null) => void
}) {
  const portalContainer = usePortalContainer()
  const { direction } = useConfig()
  const contentRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const item = items[current]
  return (
    <DialogPrimitive.Root
      open={Boolean(open && item)}
      onOpenChange={onOpenChange}
    >
      {children}
      <DialogPrimitive.Portal container={portalContainer}>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-black/70" />
        <DialogPrimitive.Content
          ref={contentRef}
          dir={direction}
          className="fixed inset-0 z-[91] h-dvh bg-background text-foreground outline-none"
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            previousFocus.current =
              document.activeElement instanceof HTMLElement &&
              document.activeElement !== document.body &&
              !contentRef.current?.contains(document.activeElement)
                ? document.activeElement
                : null
            contentRef.current
              ?.querySelector<HTMLButtonElement>('button')
              ?.focus()
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            restoreFocus(previousFocus.current)
          }}
        >
          {item && (
            <PreviewCanvas
              item={item}
              current={current}
              total={items.length}
              onCurrentChange={onCurrentChange}
              label={label}
              onClose={() => onOpenChange?.(false)}
              {...options}
            />
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/** A native image with an optional focus-managed, full-screen preview. */
export function Image({
  src,
  alt,
  fallback,
  preview = true,
  containerClassName,
  className,
  onError,
  loading = 'lazy',
  ...props
}: ImageProps) {
  const [failure, setFailure] = useState<string | undefined>()
  const [localOpen, setLocalOpen] = useState(
    typeof preview === 'object' && Boolean(preview.defaultOpen),
  )
  const triggerRef = useRef<HTMLButtonElement>(null)
  const activatedRef = useRef<HTMLButtonElement | null>(null)
  const config = typeof preview === 'object' ? preview : undefined
  const previewSrc = config?.src ?? src
  const failed = src !== undefined && failure === src
  const canPreview = Boolean(preview && previewSrc && (!failed || config?.src))
  const open = config?.open ?? localOpen
  const changeOpen = (next: boolean) => {
    if (config?.open === undefined) setLocalOpen(next)
    config?.onOpenChange?.(next)
  }
  const image = failed ? (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        'block min-h-24 max-w-full rounded-[var(--radius-md)] border border-dashed border-border bg-muted p-4 text-muted-foreground',
        className,
      )}
    >
      {fallback ?? alt}
    </div>
  ) : (
    <img
      src={src}
      alt={alt}
      loading={loading}
      className={cn('block max-w-full rounded-[var(--radius-md)]', className)}
      onError={(event) => {
        setFailure(src)
        onError?.(event)
      }}
      {...props}
    />
  )
  if (!canPreview || !previewSrc) return image
  return (
    <PreviewDialog
      {...config}
      open={open}
      onOpenChange={changeOpen}
      items={[{ src: previewSrc, alt }]}
      current={0}
      restoreFocus={(previous) => {
        const target = activatedRef.current ?? previous ?? triggerRef.current
        if (target?.isConnected) target.focus({ preventScroll: true })
        activatedRef.current = null
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={cn(thumbnailButtonStyles, containerClassName)}
        aria-label={`预览：${alt}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={(event) => {
          if (!event.defaultPrevented) {
            activatedRef.current = event.currentTarget
            changeOpen(true)
          }
        }}
      >
        {image}
        <span
          aria-hidden="true"
          className="absolute end-1 bottom-1 rounded bg-card/90 px-2 py-1 text-xs font-semibold text-card-foreground"
        >
          预览
        </span>
      </button>
    </PreviewDialog>
  )
}

/** A project-owned gallery contract; thumbnail and preview URLs may differ. */
export function ImagePreviewGroup({
  items,
  current,
  defaultCurrent = 0,
  onCurrentChange,
  open,
  defaultOpen = false,
  onOpenChange,
  label = '相册预览',
  className,
  imageClassName,
  ...options
}: ImagePreviewGroupProps) {
  const [localCurrent, setLocalCurrent] = useState(defaultCurrent)
  const [localOpen, setLocalOpen] = useState(defaultOpen)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const groupRef = useRef<HTMLDivElement>(null)
  const index = current ?? localCurrent
  const safeCurrent = Number.isFinite(index)
    ? Math.max(0, Math.min(items.length - 1, Math.floor(index)))
    : 0
  const visible = open ?? localOpen
  const changeCurrent = (next: number) => {
    if (current === undefined) setLocalCurrent(next)
    onCurrentChange?.(next)
  }
  const changeOpen = (next: boolean) => {
    if (open === undefined) setLocalOpen(next)
    onOpenChange?.(next)
  }
  return (
    <PreviewDialog
      {...options}
      label={label}
      open={visible}
      onOpenChange={changeOpen}
      items={items}
      current={safeCurrent}
      onCurrentChange={changeCurrent}
      restoreFocus={(previous) => {
        const target = triggerRef.current?.isConnected
          ? triggerRef.current
          : previous?.isConnected
            ? previous
            : groupRef.current?.querySelector<HTMLButtonElement>('button')
        target?.focus({ preventScroll: true })
        triggerRef.current = null
      }}
    >
      <div
        ref={groupRef}
        role="group"
        aria-label={label}
        className={cn('flex flex-wrap gap-3', className)}
      >
        {items.length === 0 ? (
          <Empty title="暂无图片" size="small" />
        ) : (
          items.map((item, itemIndex) => (
            <button
              key={`${itemIndex}:${item.src}`}
              type="button"
              className={thumbnailButtonStyles}
              aria-label={`预览：${item.alt}`}
              aria-haspopup="dialog"
              onClick={(event) => {
                triggerRef.current = event.currentTarget
                changeCurrent(itemIndex)
                changeOpen(true)
              }}
            >
              <Image
                src={item.thumbnailSrc ?? item.src}
                alt={item.alt}
                preview={false}
                className={cn('h-28 w-40 object-cover', imageClassName)}
              />
              <span
                aria-hidden="true"
                className="absolute end-1 bottom-1 rounded bg-card/90 px-2 py-1 text-xs font-semibold text-card-foreground"
              >
                预览
              </span>
            </button>
          ))
        )}
      </div>
    </PreviewDialog>
  )
}
