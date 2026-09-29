import { Button } from '@/shared/ui'
import { type UploadState } from './upload'

export type UploadProgressProps = UploadState & {
  onCancel?: () => void
  onRetry?: () => void
  label?: string
}

const statusText: Record<UploadState['status'], string> = {
  idle: '尚未上传',
  uploading: '正在上传',
  completed: '上传完成',
  cancelled: '已取消上传',
  error: '上传失败',
}

export function UploadProgress({
  status,
  progress,
  error,
  onCancel,
  onRetry,
  label = '文件上传',
}: UploadProgressProps) {
  return (
    <div
      className="grid gap-[var(--space-sm)] rounded-[var(--radius-md)] border border-border bg-card p-[var(--space-md)]"
      aria-live="polite"
    >
      <div className="flex flex-wrap justify-between gap-[var(--space-sm)] font-semibold">
        <span>
          {label}：{statusText[status]}
        </span>
        <span>
          {status === 'uploading' || status === 'completed'
            ? `${progress}%`
            : null}
        </span>
      </div>
      <progress
        aria-label={label}
        max={100}
        value={progress}
        className="h-3 w-full accent-primary"
      />
      {error && (
        <p role="alert" className="text-sm leading-normal text-destructive">
          {error}
        </p>
      )}
      {status === 'uploading' && onCancel && (
        <Button
          variant="outline"
          size="small"
          className="justify-self-start"
          onClick={onCancel}
        >
          取消上传
        </Button>
      )}
      {(status === 'error' || status === 'cancelled') && onRetry && (
        <Button
          variant="outline"
          size="small"
          className="justify-self-start"
          onClick={onRetry}
        >
          重试上传
        </Button>
      )}
    </div>
  )
}
