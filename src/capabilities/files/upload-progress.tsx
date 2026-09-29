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
    <div className="ui-upload-progress" aria-live="polite">
      <div className="ui-upload-progress__row">
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
        className="ui-upload-progress__bar"
      />
      {error && (
        <p role="alert" className="ui-field__error">
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
