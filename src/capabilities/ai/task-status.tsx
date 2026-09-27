import { type AiTaskSnapshot } from './task-machine'

const labels: Record<AiTaskSnapshot['status'], string> = {
  queued: '排队中',
  running: '运行中',
  completed: '已完成',
  failed: '失败',
  cancelled: '已取消',
}

export function TaskStatus({ task }: { task: AiTaskSnapshot | null }) {
  if (!task)
    return (
      <span role="status" className="ui-ai-status ui-ai-status--idle">
        尚未提交
      </span>
    )
  return (
    <span
      role="status"
      className={`ui-ai-status ui-ai-status--${task.status}`}
      aria-label={`任务状态：${labels[task.status]}`}
    >
      {labels[task.status]}
    </span>
  )
}
