import { useEffect, useRef } from 'react'
import { Button } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { formatBytes } from './validation'

export type FilePreviewProps = {
  file: File
  onRemove?: () => void
  className?: string
}

export function FilePreview({ file, onRemove, className }: FilePreviewProps) {
  const imageRef = useRef<HTMLImageElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canPreview =
    file.type.startsWith('image/') || file.type.startsWith('video/')
  useEffect(() => {
    if (!canPreview) return
    const objectUrl = URL.createObjectURL(file)
    const element = file.type.startsWith('image/')
      ? imageRef.current
      : videoRef.current
    if (element) element.src = objectUrl
    return () => {
      element?.removeAttribute('src')
      URL.revokeObjectURL(objectUrl)
    }
  }, [file, canPreview])

  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-[var(--space-md)] rounded-[var(--radius-md)] border border-border bg-card p-[var(--space-sm)]',
        className,
      )}
    >
      <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-sm)] bg-muted text-muted-foreground">
        {file.type.startsWith('image/') ? (
          <img
            ref={imageRef}
            alt={`文件预览：${file.name}`}
            className="size-full object-cover"
          />
        ) : file.type.startsWith('video/') ? (
          <video
            ref={videoRef}
            preload="metadata"
            muted
            playsInline
            aria-label={`视频预览：${file.name}`}
            className="size-full object-cover"
          />
        ) : (
          <svg
            viewBox="0 0 48 48"
            fill="none"
            aria-hidden="true"
            className="size-8"
          >
            <path
              d="M12 5h17l8 8v29H12a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M29 5v9h8M15 25h15M15 32h12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate font-semibold" title={file.name}>
          {file.name}
        </p>
        <p className="m-0 text-sm text-muted-foreground [overflow-wrap:anywhere]">
          {formatBytes(file.size)} · {file.type || '未知类型'}
        </p>
      </div>
      {onRemove && (
        <Button
          variant="ghost"
          size="small"
          onClick={onRemove}
          aria-label={`移除 ${file.name}`}
        >
          移除
        </Button>
      )}
    </div>
  )
}
