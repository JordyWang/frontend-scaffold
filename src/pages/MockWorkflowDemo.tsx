import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/shared/api/request'
import {
  FilePicker,
  FilePreview,
  UploadProgress,
  useFileUpload,
  type FileValidationResult,
  type UploadTransport,
} from '@/capabilities/files'
import {
  createMockAiTaskClient,
  PromptInput,
  TaskActions,
  TaskProgress,
  TaskStatus,
  useAiTask,
} from '@/capabilities/ai'
import { VideoPlayer } from '@/capabilities/video'
import { AudioPlayer } from '@/capabilities/audio'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ErrorState,
  LoadingState,
} from '@/shared/ui'

type MockMedia = {
  items: {
    id: string
    type: 'video' | 'audio'
    src: string
    poster?: string
  }[]
}

const workflowUpload: UploadTransport = (_file, { signal, onProgress }) =>
  new Promise((resolve, reject) => {
    let progress = 0
    const timer = window.setInterval(() => {
      progress = Math.min(100, progress + 20)
      onProgress(progress)
      if (progress === 100) {
        cleanup()
        resolve()
      }
    }, 120)
    const onAbort = () => {
      cleanup()
      reject(new DOMException('已取消', 'AbortError'))
    }
    const cleanup = () => {
      window.clearInterval(timer)
      signal.removeEventListener('abort', onAbort)
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })

export function MockWorkflowDemo() {
  const [file, setFile] = useState<File | null>(null)
  const [issues, setIssues] = useState<string[]>([])
  const [mediaType, setMediaType] = useState<'video' | 'audio'>('video')
  const upload = useFileUpload(workflowUpload)
  const aiClient = useMemo(() => createMockAiTaskClient(), [])
  const task = useAiTask(aiClient, { pollIntervalMs: 300 })
  const media = useQuery({
    queryKey: ['mock-workflow-media'],
    queryFn: ({ signal }) => apiGet<MockMedia>('/dev/media', { signal }),
  })
  const preview = media.data?.items.find((item) => item.type === mediaType)
  const readyToSubmit = upload.status === 'completed' && !task.isBusy
  const showPreview = task.phase === 'completed' && preview

  function chooseFile(files: File[]) {
    upload.reset()
    task.reset()
    setFile(files[0] ?? null)
    setIssues([])
  }

  function rejectFiles(results: FileValidationResult[]) {
    setIssues(
      results.flatMap(({ file: rejected, issues: fileIssues }) =>
        fileIssues.map(({ message }) => `${rejected.name}：${message}`),
      ),
    )
  }

  return (
    <div className="ui-workflow" role="group" aria-label="完整 Mock 示例流程">
      <Card>
        <CardHeader>
          <CardTitle>1. 选择并上传文件</CardTitle>
          <CardDescription>
            本地模拟上传；选择新文件会重置当前任务。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilePicker
            label="选择流程文件"
            rules={{
              accept: ['image/*', 'video/*', 'audio/*'],
              maxBytes: 10 * 1024 * 1024,
            }}
            onFiles={chooseFile}
            onRejected={rejectFiles}
          />
          {issues.length > 0 && (
            <ul role="alert" className="ui-field__error">
              {issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          )}
          {file && <FilePreview file={file} />}
          <Button
            disabled={!file || upload.status === 'uploading'}
            onClick={() => {
              if (!file) return
              task.reset()
              void upload.start(file)
            }}
          >
            开始流程上传
          </Button>
          <UploadProgress
            label="流程文件上传"
            status={upload.status}
            progress={upload.progress}
            error={upload.error}
            onCancel={upload.cancel}
            onRetry={
              file
                ? () => {
                    task.reset()
                    void upload.start(file)
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. 提交并跟踪任务</CardTitle>
          <CardDescription>
            上传完成后提交；输入“失败”可检查失败、取消和重试。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PromptInput
            onSubmit={(prompt) =>
              void task.submit({ prompt, fileIds: file ? [file.name] : [] })
            }
            disabled={!readyToSubmit}
            loading={task.phase === 'submitting'}
          />
          <div className="flex items-center justify-between gap-3">
            <span>流程任务状态</span>
            <TaskStatus task={task.task} />
          </div>
          <TaskProgress task={task.task} />
          {task.message && (
            <p role="alert" className="ui-field__error">
              {task.message}
            </p>
          )}
          {task.task?.error && (
            <p role="alert" className="ui-field__error">
              {task.task.error}
            </p>
          )}
          <TaskActions
            state={task}
            onCancel={() => void task.cancel()}
            onRetry={() => void task.retry()}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. 预览任务结果</CardTitle>
          <CardDescription>
            任务完成后，从 JSON Mock 数据选择视频或音频预览。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {media.isPending ? (
            <LoadingState label="正在加载媒体样例…" />
          ) : media.isError ? (
            <ErrorState
              title="媒体样例加载失败"
              description={media.error.message}
              onRetry={() => void media.refetch()}
            />
          ) : (
            <>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="结果媒体类型"
              >
                <Button
                  variant={mediaType === 'video' ? 'primary' : 'outline'}
                  aria-pressed={mediaType === 'video'}
                  onClick={() => setMediaType('video')}
                >
                  视频结果
                </Button>
                <Button
                  variant={mediaType === 'audio' ? 'primary' : 'outline'}
                  aria-pressed={mediaType === 'audio'}
                  onClick={() => setMediaType('audio')}
                >
                  音频结果
                </Button>
              </div>
              {showPreview && preview.type === 'video' ? (
                <VideoPlayer
                  key={preview.id}
                  title="流程视频结果"
                  source={{
                    src: preview.src,
                    type: 'video/mp4',
                    poster: preview.poster,
                  }}
                />
              ) : showPreview && preview.type === 'audio' ? (
                <AudioPlayer
                  key={preview.id}
                  title="流程音频结果"
                  source={{ src: preview.src, type: 'audio/wav' }}
                />
              ) : (
                <p
                  role="status"
                  className="rounded-[var(--radius-md)] border border-border p-6 text-muted-foreground"
                >
                  {task.phase === 'failed' || task.phase === 'cancelled'
                    ? '任务未完成，请重试后预览。'
                    : '任务完成后可预览媒体结果。'}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
