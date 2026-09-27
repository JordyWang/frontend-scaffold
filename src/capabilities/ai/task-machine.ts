export type AiTaskStatus =
  'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export type AiTaskInput = {
  prompt: string
  fileIds?: string[]
}

export type AiTaskResult = {
  title: string
  summary: string
  mediaUrl?: string
}

export type AiTaskSnapshot = {
  id: string
  input: AiTaskInput
  status: AiTaskStatus
  progress: number | null
  result?: AiTaskResult
  error?: string
}

export type AiTaskPhase = 'idle' | 'submitting' | AiTaskStatus

export type AiTaskMachineState = {
  phase: AiTaskPhase
  task: AiTaskSnapshot | null
  message?: string
}

export type AiTaskEvent =
  | { type: 'submit-start' }
  | { type: 'submitted'; task: AiTaskSnapshot }
  | { type: 'snapshot'; task: AiTaskSnapshot }
  | { type: 'retry-start' }
  | { type: 'cancelled'; task?: AiTaskSnapshot }
  | { type: 'request-error'; message: string }
  | { type: 'reset' }

export const initialAiTaskState: AiTaskMachineState = {
  phase: 'idle',
  task: null,
}

const transitions: Record<AiTaskStatus, readonly AiTaskStatus[]> = {
  queued: ['queued', 'running', 'cancelled', 'failed'],
  running: ['running', 'completed', 'cancelled', 'failed'],
  completed: ['completed'],
  failed: ['failed'],
  cancelled: ['cancelled'],
}

function phaseForTask(task: AiTaskSnapshot): AiTaskPhase {
  return task.status
}

function canTransition(from: AiTaskStatus, to: AiTaskStatus) {
  return transitions[from].includes(to)
}

export function aiTaskReducer(
  state: AiTaskMachineState,
  event: AiTaskEvent,
): AiTaskMachineState {
  switch (event.type) {
    case 'submit-start':
      return { phase: 'submitting', task: null }
    case 'retry-start':
      return { phase: 'submitting', task: state.task }
    case 'submitted':
      return { phase: phaseForTask(event.task), task: event.task }
    case 'snapshot': {
      if (!state.task || state.task.id !== event.task.id) return state
      if (!canTransition(state.task.status, event.task.status)) return state
      return { phase: phaseForTask(event.task), task: event.task }
    }
    case 'cancelled': {
      if (!state.task) return state
      const task = event.task ?? {
        ...state.task,
        status: 'cancelled' as const,
        progress: state.task.progress,
      }
      return { phase: 'cancelled', task }
    }
    case 'request-error':
      return { ...state, message: event.message }
    case 'reset':
      return initialAiTaskState
  }
}

export function canCancelTask(state: AiTaskMachineState) {
  return state.phase === 'queued' || state.phase === 'running'
}

export function canRetryTask(state: AiTaskMachineState) {
  return state.phase === 'failed' || state.phase === 'cancelled'
}
