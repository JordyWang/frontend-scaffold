import fixtures from '@/mocks/data/ai-tasks.json'
import type { AiTaskClient } from './client'
import type { AiTaskInput, AiTaskSnapshot } from './task-machine'

type MockJob = { task: AiTaskSnapshot; polls: number; shouldFail: boolean }

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason ?? new DOMException('已取消', 'AbortError'))
      return
    }
    const timer = window.setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(signal.reason ?? new DOMException('已取消', 'AbortError'))
      },
      { once: true },
    )
  })

export function createMockAiTaskClient(): AiTaskClient & {
  fixtures: typeof fixtures.items
} {
  const jobs = new Map<string, MockJob>()
  let sequence = 0
  const createTask = (input: AiTaskInput): AiTaskSnapshot => ({
    id: `mock-task-${++sequence}`,
    input,
    status: 'queued',
    progress: 0,
  })
  const submitTask = async (
    input: AiTaskInput,
    signal: AbortSignal,
    shouldFail = /失败|fail/i.test(input.prompt),
  ) => {
    await wait(80, signal)
    const task = createTask(input)
    jobs.set(task.id, { task, polls: 0, shouldFail })
    return task
  }

  return {
    fixtures: fixtures.items,
    async submit(input, { signal }) {
      return submitTask(input, signal)
    },
    async get(id, { signal }) {
      await wait(80, signal)
      const job = jobs.get(id)
      if (!job) throw new Error('任务不存在')
      if (job.task.status === 'cancelled') return job.task
      job.polls += 1
      if (job.shouldFail && job.polls >= 3)
        job.task = {
          ...job.task,
          status: 'failed',
          progress: null,
          error: 'Mock 任务失败，请重试',
        }
      else if (job.polls === 1)
        job.task = { ...job.task, status: 'running', progress: 35 }
      else if (job.polls === 2)
        job.task = { ...job.task, status: 'running', progress: 72 }
      else if (job.polls >= 3)
        job.task = {
          ...job.task,
          status: 'completed',
          progress: 100,
          result: {
            title: '任务已完成',
            summary: `已处理：${job.task.input.prompt}`,
          },
        }
      return job.task
    },
    async cancel(id, { signal }) {
      await wait(60, signal)
      const job = jobs.get(id)
      if (!job) throw new Error('任务不存在')
      job.task = {
        ...job.task,
        status: 'cancelled',
        progress: job.task.progress,
      }
      return job.task
    },
    async retry(task, { signal }) {
      return submitTask(task.input, signal, false)
    },
  }
}
