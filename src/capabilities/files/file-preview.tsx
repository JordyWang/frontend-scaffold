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
    <div className={cn('ui-file-preview', className)}>
      <div className="ui-file-preview__thumb">
        {file.type.startsWith('image/') ? (
          <img ref={imageRef} alt={`文件预览：${file.name}`} />
        ) : file.type.startsWith('video/') ? (
          <video
            ref={videoRef}
            preload="metadata"
            muted
            playsInline
            aria-label={`视频预览：${file.name}`}
          />
        ) : (
          <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
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
      <div className="ui-file-preview__info">
        <p className="ui-file-preview__name" title={file.name}>
          {file.name}
        </p>
        <p className="ui-file-preview__meta">
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
