import { type AiTaskSnapshot } from './task-machine'

const baseStyles =
  'inline-flex min-h-7 items-center rounded-full px-[0.625rem] py-1 text-sm leading-none font-[650]'

const statusStyles: Record<AiTaskSnapshot['status'], string> = {
  queued: 'bg-muted text-muted-foreground',
  running: 'bg-accent text-accent-foreground',
  completed: 'bg-[var(--ui-map-success-bg)] text-[var(--ui-color-success)]',
  failed: 'bg-[var(--ui-map-error-bg)] text-[var(--ui-color-error)]',
  cancelled: 'bg-secondary text-secondary-foreground',
}

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
      <span
        role="status"
        data-ai-task-status="idle"
        className={`${baseStyles} bg-muted text-muted-foreground`}
      >
        尚未提交
      </span>
    )
  return (
    <span
      role="status"
      data-ai-task-status={task.status}
      className={`${baseStyles} ${statusStyles[task.status]}`}
      aria-label={`任务状态：${labels[task.status]}`}
    >
      {labels[task.status]}
    </span>
  )
}
