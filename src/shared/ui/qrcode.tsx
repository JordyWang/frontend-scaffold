import {
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
} from 'react'
import * as QRCodeEncoder from 'qrcode'
import { cn } from '@/shared/lib/utils'
import { Button } from './button'
import { Spinner } from './spinner'

type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'
type QrMatrix = QRCodeEncoder.BitMatrix

const quietZone = 4

export type QrCodeStatus = 'active' | 'expired' | 'loading'

export type QrCodeStatusInfo = {
  status: QrCodeStatus
  onRefresh: () => void
}

export type QRCodeProps = {
  value: string
  size?: number
  color?: string
  bgColor?: string
  bordered?: boolean
  errorLevel?: ErrorCorrectionLevel
  icon?: string | ReactNode
  iconSize?: number | [number, number]
  status?: QrCodeStatus
  statusRender?: (info: QrCodeStatusInfo) => ReactNode
  onRefresh?: () => void
  type?: 'canvas' | 'svg'
  className?: string
  style?: CSSProperties
  'aria-label'?: string
}

function IconOverlay({
  icon,
  iconSize,
  bgColor,
}: Pick<QRCodeProps, 'icon' | 'iconSize' | 'bgColor'>) {
  if (!icon) return null
  const [width, height] = Array.isArray(iconSize)
    ? iconSize
    : [iconSize ?? 40, iconSize ?? 40]
  return (
    <span
      className="pointer-events-none absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded p-1"
      style={{ width, height, backgroundColor: bgColor }}
      aria-hidden="true"
    >
      {typeof icon === 'string' ? (
        <img src={icon} alt="" className="size-full object-contain" />
      ) : (
        icon
      )}
    </span>
  )
}

function QrSvg({
  matrix,
  color,
  bgColor,
  label,
}: {
  matrix: QrMatrix
  color: string
  bgColor: string
  label: string
}) {
  const total = matrix.size + quietZone * 2
  const darkModules: string[] = []
  for (let y = 0; y < matrix.size; y += 1)
    for (let x = 0; x < matrix.size; x += 1)
      if (matrix.get(y, x)) darkModules.push(`${x},${y}`)

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${total} ${total}`}
      className="block size-full"
      shapeRendering="crispEdges"
    >
      <title>{label}</title>
      <rect width={total} height={total} fill={bgColor} />
      {darkModules.map((position) => {
        const [x, y] = position.split(',').map(Number)
        return (
          <rect
            key={position}
            x={x + quietZone}
            y={y + quietZone}
            width="1"
            height="1"
            fill={color}
          />
        )
      })}
    </svg>
  )
}

function QrCanvas({
  matrix,
  color,
  bgColor,
  label,
}: {
  matrix: QrMatrix
  color: string
  bgColor: string
  label: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const total = matrix.size + quietZone * 2
    canvas.width = total
    canvas.height = total
    context.fillStyle = bgColor
    context.fillRect(0, 0, total, total)
    context.fillStyle = color
    for (let y = 0; y < matrix.size; y += 1)
      for (let x = 0; x < matrix.size; x += 1)
        if (matrix.get(y, x))
          context.fillRect(x + quietZone, y + quietZone, 1, 1)
  }, [bgColor, color, matrix])
  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      className="block size-full [image-rendering:pixelated]"
    />
  )
}

/** Project-owned QRCode API, with a standards-based encoder and Tailwind states. */
export function QRCode({
  value,
  size = 160,
  color = '#000000',
  bgColor = '#ffffff',
  bordered = true,
  errorLevel,
  icon,
  iconSize,
  status = 'active',
  statusRender,
  onRefresh,
  type = 'canvas',
  className,
  style,
  'aria-label': ariaLabel = '二维码',
}: QRCodeProps) {
  const level = errorLevel ?? (icon ? 'H' : 'M')
  const matrix = useMemo(() => {
    if (!value) return null
    try {
      return QRCodeEncoder.create(value, { errorCorrectionLevel: level })
        .modules
    } catch {
      return null
    }
  }, [level, value])
  const refresh = () => onRefresh?.()
  const statusContent = statusRender?.({ status, onRefresh: refresh })

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[var(--ui-card-radius)] p-2',
        bordered && 'border border-border bg-card shadow-sm',
        className,
      )}
      style={{ width: size, height: size, ...style }}
      data-qrcode-status={status}
      data-qrcode-type={type}
    >
      <div className="relative size-full" style={{ backgroundColor: bgColor }}>
        {matrix ? (
          type === 'svg' ? (
            <QrSvg
              matrix={matrix}
              color={color}
              bgColor={bgColor}
              label={ariaLabel}
            />
          ) : (
            <QrCanvas
              matrix={matrix}
              color={color}
              bgColor={bgColor}
              label={ariaLabel}
            />
          )
        ) : (
          <div
            role="img"
            aria-label="二维码内容无效或过长"
            className="flex size-full items-center justify-center p-3 text-center text-xs text-muted-foreground"
          >
            二维码内容无效或过长
          </div>
        )}
        <IconOverlay icon={icon} iconSize={iconSize} bgColor={bgColor} />
        {status !== 'active' && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/90 p-3 text-center text-sm text-card-foreground backdrop-blur-[2px]">
            {statusContent ??
              (status === 'loading' ? (
                <Spinner label="二维码生成中" size="small" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span>二维码已失效</span>
                  {onRefresh && (
                    <Button size="small" variant="primary" onClick={refresh}>
                      刷新
                    </Button>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

export type { ErrorCorrectionLevel as QRCodeErrorLevel }
