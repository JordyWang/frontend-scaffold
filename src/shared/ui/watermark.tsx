import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'

export type WatermarkProps = Omit<HTMLAttributes<HTMLDivElement>, 'content'> & {
  content?: string | string[]
  /** Optional image URL. Provide content as a fallback if it cannot be loaded. */
  image?: string
  markSize?: [width: number, height: number]
  gap?: [horizontal: number, vertical: number]
  offset?: [horizontal: number, vertical: number]
  rotate?: number
  opacity?: number
  fontSize?: number
  onRemove?: () => void
  children: ReactNode
}

function positive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function nonnegative(value: number, fallback: number): number {
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

/** Decorative, repeated watermark that never intercepts content interaction. */
export const Watermark = forwardRef<HTMLDivElement, WatermarkProps>(
  function Watermark(
    {
      content,
      image,
      markSize = [120, 64],
      gap = [100, 100],
      offset,
      rotate = -22,
      opacity = 0.18,
      fontSize = 16,
      onRemove,
      children,
      className,
      ...props
    },
    forwardedRef,
  ) {
    const rootRef = useRef<HTMLDivElement | null>(null)
    const overlayRef = useRef<HTMLDivElement | null>(null)
    const colorRef = useRef<HTMLSpanElement | null>(null)
    const [tile, setTile] = useState<string | null>(null)
    const lines = Array.isArray(content) ? content : content ? [content] : []
    const contentKey = JSON.stringify(lines)
    const markWidth = positive(markSize[0], 120)
    const markHeight = positive(markSize[1], 64)
    const gapX = nonnegative(gap[0], 100)
    const gapY = nonnegative(gap[1], 100)
    const offsetX = Number.isFinite(offset?.[0]) ? offset![0] : gapX / 2
    const offsetY = Number.isFinite(offset?.[1]) ? offset![1] : gapY / 2
    const tileWidth = markWidth + gapX
    const tileHeight = markHeight + gapY
    const safeOpacity = Number.isFinite(opacity)
      ? Math.max(0, Math.min(1, opacity))
      : 0.18
    const safeFontSize = positive(fontSize, 16)
    const safeRotate = Number.isFinite(rotate) ? rotate : -22

    useEffect(() => {
      const root = rootRef.current
      if (!root) return
      const textLines = JSON.parse(contentKey) as string[]
      let alive = true
      let generation = 0

      const renderTile = (allowImage = true) => {
        const current = ++generation
        if ((!image || !allowImage) && textLines.length === 0) {
          setTile(null)
          return
        }
        const ratio = Math.min(3, Math.max(1, window.devicePixelRatio || 1))
        const canvas = document.createElement('canvas')
        canvas.width = Math.ceil(tileWidth * ratio)
        canvas.height = Math.ceil(tileHeight * ratio)
        let context: CanvasRenderingContext2D | null = null
        try {
          context = canvas.getContext('2d')
        } catch {
          setTile(null)
          return
        }
        if (!context) return

        const draw = (loadedImage?: HTMLImageElement) => {
          if (!alive || current !== generation) return
          context.scale(ratio, ratio)
          context.translate(tileWidth / 2, tileHeight / 2)
          context.rotate((safeRotate * Math.PI) / 180)
          context.globalAlpha = safeOpacity
          if (loadedImage) {
            context.drawImage(
              loadedImage,
              -markWidth / 2,
              -markHeight / 2,
              markWidth,
              markHeight,
            )
          } else {
            context.fillStyle = colorRef.current
              ? getComputedStyle(colorRef.current).color
              : '#475569'
            context.font = `${safeFontSize}px sans-serif`
            context.textAlign = 'center'
            context.textBaseline = 'middle'
            const lineHeight = safeFontSize * 1.45
            const start = -((textLines.length - 1) * lineHeight) / 2
            textLines.forEach((line, index) =>
              context.fillText(line, 0, start + index * lineHeight, markWidth),
            )
          }
          try {
            setTile(canvas.toDataURL('image/png'))
          } catch {
            if (loadedImage && textLines.length > 0) renderTile(false)
            else setTile(null)
          }
        }

        if (!image || !allowImage) {
          draw()
          return
        }
        const picture = new window.Image()
        picture.crossOrigin = 'anonymous'
        picture.onload = () => draw(picture)
        picture.onerror = () => {
          if (!alive || current !== generation) return
          if (textLines.length > 0) draw()
          else setTile(null)
        }
        picture.src = image
      }

      renderTile()
      const observer = new MutationObserver(() => renderTile())
      const scope = root.closest('[data-ui-theme]')
      const options: MutationObserverInit = {
        attributes: true,
        attributeFilter: ['data-ui-theme', 'class', 'style'],
      }
      if (scope) observer.observe(scope, options)
      observer.observe(document.documentElement, options)
      const media = window.matchMedia?.('(prefers-color-scheme: dark)')
      const onColorSchemeChange = () => renderTile()
      media?.addEventListener('change', onColorSchemeChange)
      return () => {
        alive = false
        observer.disconnect()
        media?.removeEventListener('change', onColorSchemeChange)
      }
    }, [
      contentKey,
      image,
      markWidth,
      markHeight,
      tileWidth,
      tileHeight,
      safeRotate,
      safeOpacity,
      safeFontSize,
    ])

    useEffect(() => {
      const root = rootRef.current
      if (!root || !tile) return
      let alive = true
      const observer = new MutationObserver(() => {
        const overlay = overlayRef.current
        if (!alive || !overlay || root.contains(overlay)) return
        root.appendChild(overlay)
        onRemove?.()
      })
      observer.observe(root, { childList: true })
      return () => {
        alive = false
        observer.disconnect()
      }
    }, [tile, onRemove])

    return (
      <div
        {...props}
        ref={(node) => {
          rootRef.current = node
          if (typeof forwardedRef === 'function') forwardedRef(node)
          else if (forwardedRef) forwardedRef.current = node
        }}
        className={cn('relative isolate', className)}
      >
        {children}
        <span
          ref={colorRef}
          aria-hidden="true"
          className="pointer-events-none absolute size-0 overflow-hidden text-muted-foreground"
        />
        {tile && (
          <div
            ref={overlayRef}
            aria-hidden="true"
            data-watermark-overlay=""
            className="pointer-events-none absolute inset-0 z-10 bg-repeat"
            style={{
              backgroundImage: `url("${tile}")`,
              backgroundSize: `${tileWidth}px ${tileHeight}px`,
              backgroundPosition: `${offsetX}px ${offsetY}px`,
            }}
          />
        )}
      </div>
    )
  },
)
