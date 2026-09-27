import { type AiTaskSnapshot } from './task-machine'

export function TaskProgress({ task }: { task: AiTaskSnapshot | null }) {
  if (
    !task ||
    task.status === 'completed' ||
    task.status === 'failed' ||
    task.status === 'cancelled'
  )
    return null
  const progress = task.progress ?? 0
  return (
    <div className="ui-ai-progress" aria-live="polite">
      <div className="ui-ai-progress__row">
        <span>任务进度</span>
        <span>{progress}%</span>
      </div>
      <progress aria-label="任务进度" max={100} value={progress} />
    </div>
  )
}
