import { useCallback, useEffect, useReducer, useRef } from 'react'
import {
  aiTaskReducer,
  canCancelTask,
  canRetryTask,
  initialAiTaskState,
  type AiTaskInput,
  type AiTaskSnapshot,
} from './task-machine'

export type AiTaskClient = {
  submit: (
    input: AiTaskInput,
    options: { signal: AbortSignal },
  ) => Promise<AiTaskSnapshot>
  get: (
    taskId: string,
    options: { signal: AbortSignal },
  ) => Promise<AiTaskSnapshot>
  cancel: (
    taskId: string,
    options: { signal: AbortSignal },
  ) => Promise<AiTaskSnapshot>
  retry: (
    task: AiTaskSnapshot,
    options: { signal: AbortSignal },
  ) => Promise<AiTaskSnapshot>
}

export type UseAiTaskOptions = {
  pollIntervalMs?: number
  /** Persist the latest task snapshot so a page re-entry can resume polling. */
  storageKey?: string
}

const taskStatuses = [
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled',
] as const

function isTaskSnapshot(value: unknown): value is AiTaskSnapshot {
  if (!value || typeof value !== 'object') return false
  const task = value as Partial<AiTaskSnapshot>
  return (
    typeof task.id === 'string' &&
    Boolean(task.input) &&
    typeof task.input?.prompt === 'string' &&
    typeof task.status === 'string' &&
    taskStatuses.includes(task.status as (typeof taskStatuses)[number]) &&
    (task.progress === null || typeof task.progress === 'number')
  )
}

function restoreState(storageKey?: string) {
  if (!storageKey || typeof window === 'undefined') return initialAiTaskState
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return initialAiTaskState
    const task: unknown = JSON.parse(raw)
    if (!isTaskSnapshot(task)) return initialAiTaskState
    return { phase: task.status, task }
  } catch {
    return initialAiTaskState
  }
}

export function useAiTask(
  client: AiTaskClient,
  { pollIntervalMs = 1000, storageKey }: UseAiTaskOptions = {},
) {
  const [state, dispatch] = useReducer(aiTaskReducer, storageKey, restoreState)
  const requestRef = useRef<AbortController | null>(null)

  const stopRequest = useCallback(() => {
    requestRef.current?.abort()
    requestRef.current = null
  }, [])

  const submit = useCallback(
    async (input: AiTaskInput) => {
      stopRequest()
      const controller = new AbortController()
      requestRef.current = controller
      dispatch({ type: 'submit-start' })
      try {
        const task = await client.submit(input, { signal: controller.signal })
        if (!controller.signal.aborted) dispatch({ type: 'submitted', task })
      } catch (error) {
        if (!controller.signal.aborted)
          dispatch({
            type: 'request-error',
            message: error instanceof Error ? error.message : '提交任务失败',
          })
      } finally {
        if (requestRef.current === controller) requestRef.current = null
      }
    },
    [client, stopRequest],
  )

  const cancel = useCallback(async () => {
    const task = state.task
    if (
      !task ||
      !canCancelTask({ ...initialAiTaskState, phase: task.status, task })
    )
      return
    const controller = new AbortController()
    stopRequest()
    requestRef.current = controller
    try {
      const cancelled = await client.cancel(task.id, {
        signal: controller.signal,
      })
      if (!controller.signal.aborted)
        dispatch({ type: 'cancelled', task: cancelled })
    } catch (error) {
      if (!controller.signal.aborted)
        dispatch({
          type: 'request-error',
          message: error instanceof Error ? error.message : '取消任务失败',
        })
    } finally {
      if (requestRef.current === controller) requestRef.current = null
    }
  }, [client, state.task, stopRequest])

  const retry = useCallback(async () => {
    const task = state.task
    if (
      !task ||
      !canRetryTask({ ...initialAiTaskState, phase: task.status, task })
    )
      return
    stopRequest()
    const controller = new AbortController()
    requestRef.current = controller
    dispatch({ type: 'retry-start' })
    try {
      const retried = await client.retry(task, { signal: controller.signal })
      if (!controller.signal.aborted)
        dispatch({ type: 'submitted', task: retried })
    } catch (error) {
      if (!controller.signal.aborted)
        dispatch({
          type: 'request-error',
          message: error instanceof Error ? error.message : '重试任务失败',
        })
    } finally {
      if (requestRef.current === controller) requestRef.current = null
    }
  }, [client, state.task, stopRequest])

  useEffect(() => {
    const task = state.task
    if (!task || (task.status !== 'queued' && task.status !== 'running')) return
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const next = await client.get(task.id, { signal: controller.signal })
        if (!controller.signal.aborted)
          dispatch({ type: 'snapshot', task: next })
      } catch (error) {
        if (!controller.signal.aborted)
          dispatch({
            type: 'request-error',
            message: error instanceof Error ? error.message : '查询任务失败',
          })
      }
    }, pollIntervalMs)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [client, pollIntervalMs, state.task])

  useEffect(() => stopRequest, [stopRequest])

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return
    try {
      if (state.task)
        window.localStorage.setItem(storageKey, JSON.stringify(state.task))
      else window.localStorage.removeItem(storageKey)
    } catch {
      // Storage can be unavailable in private browsing or embedded webviews.
    }
  }, [state.task, storageKey])

  return {
    ...state,
    isBusy:
      state.phase === 'submitting' ||
      state.phase === 'queued' ||
      state.phase === 'running',
    canCancel: canCancelTask(state),
    canRetry: canRetryTask(state),
    submit,
    cancel,
    retry,
    reset: () => {
      stopRequest()
      dispatch({ type: 'reset' })
    },
  }
}
