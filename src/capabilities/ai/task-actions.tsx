import { Button } from '@/shared/ui'
import { type AiTaskMachineState } from './task-machine'

export function TaskActions({
  state,
  onCancel,
  onRetry,
}: {
  state: AiTaskMachineState
  onCancel: () => void
  onRetry: () => void
}) {
  if (state.phase === 'queued' || state.phase === 'running')
    return (
      <Button variant="outline" onClick={onCancel}>
        取消任务
      </Button>
    )
  if (state.phase === 'failed' || state.phase === 'cancelled')
    return (
      <Button variant="outline" onClick={onRetry}>
        重试任务
      </Button>
    )
  return null
}
