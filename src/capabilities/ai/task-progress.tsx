import { type AiTaskSnapshot } from './task-machine'

export function TaskProgress({ task }: { task: AiTaskSnapshot | null }) {
  if (
    !task ||
    task.status === 'completed' ||
    task.status === 'failed' ||
    task.status === 'cancelled'
  )
    return null
  const rawProgress = task.progress
  const hasProgress =
    typeof rawProgress === 'number' && Number.isFinite(rawProgress)
  const progress = hasProgress ? Math.max(0, Math.min(100, rawProgress)) : 0
  const progressLabel = hasProgress ? `${Math.round(progress)}%` : '处理中'
  return (
    <div className="ui-ai-progress" aria-live="polite">
      <div className="ui-ai-progress__row">
        <span>任务进度</span>
        <span>{progressLabel}</span>
      </div>
      <progress
        aria-label="任务进度"
        aria-valuetext={hasProgress ? progressLabel : '进度未知，任务处理中'}
        max={100}
        value={hasProgress ? progress : undefined}
      />
    </div>
  )
}
