import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  aiChatReducer,
  aiTaskReducer,
  createMockAiChatClient,
  createMockAiTaskClient,
  getActiveConversation,
  initialAiChatState,
  initialAiTaskState,
  TaskProgress,
  useAiChat,
  useAiTask,
  type AiChatState,
  type AiTaskClient,
  type AiTaskSnapshot,
} from '@/capabilities/ai'

function snapshot(
  status: AiTaskSnapshot['status'],
  overrides: Partial<AiTaskSnapshot> = {},
): AiTaskSnapshot {
  return {
    id: 'task-1',
    input: { prompt: '测试任务' },
    status,
    progress: status === 'completed' ? 100 : 0,
    ...overrides,
  }
}

describe('AI task state machine', () => {
  it('renders unknown progress as indeterminate instead of zero percent', () => {
    render(<TaskProgress task={snapshot('running', { progress: null })} />)
    expect(screen.getByText('处理中')).toBeInTheDocument()
    const progress = screen.getByRole('progressbar', { name: '任务进度' })
    expect(progress).not.toHaveAttribute('value')
    expect(progress).toHaveAttribute('aria-valuetext', '进度未知，任务处理中')
  })

  it('allows forward progress and rejects stale or impossible transitions', () => {
    let state = aiTaskReducer(initialAiTaskState, {
      type: 'submitted',
      task: snapshot('queued'),
    })
    state = aiTaskReducer(state, {
      type: 'snapshot',
      task: snapshot('running', { progress: 40 }),
    })
    expect(state.phase).toBe('running')
    expect(state.task?.progress).toBe(40)
    state = aiTaskReducer(state, {
      type: 'snapshot',
      task: snapshot('completed'),
    })
    expect(state.phase).toBe('completed')
    state = aiTaskReducer(state, {
      type: 'snapshot',
      task: snapshot('running', { progress: 50 }),
    })
    expect(state.phase).toBe('completed')
    state = aiTaskReducer(state, {
      type: 'snapshot',
      task: snapshot('completed', { id: 'other' }),
    })
    expect(state.task?.id).toBe('task-1')
  })

  it('keeps failed and cancelled tasks retryable', () => {
    let state = aiTaskReducer(initialAiTaskState, {
      type: 'submitted',
      task: snapshot('running'),
    })
    state = aiTaskReducer(state, {
      type: 'snapshot',
      task: snapshot('failed', { error: '失败' }),
    })
    expect(state.phase).toBe('failed')
    state = aiTaskReducer(state, { type: 'retry-start' })
    expect(state.phase).toBe('submitting')
    state = aiTaskReducer(state, {
      type: 'submitted',
      task: snapshot('queued', { id: 'task-2' }),
    })
    state = aiTaskReducer(state, { type: 'cancelled' })
    expect(state.phase).toBe('cancelled')
  })
})

describe('AI conversation state machine', () => {
  it('appends messages and applies stream events without losing earlier content', () => {
    const conversation = {
      id: 'conversation-1',
      title: '新对话',
      messages: [],
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    const userMessage = {
      id: 'user-1',
      conversationId: conversation.id,
      role: 'user' as const,
      content: '你好',
      status: 'complete' as const,
      createdAt: conversation.updatedAt,
    }
    const assistantMessage = {
      id: 'assistant-1',
      conversationId: conversation.id,
      role: 'assistant' as const,
      content: '',
      status: 'thinking' as const,
      createdAt: conversation.updatedAt,
    }
    let state: AiChatState = aiChatReducer(initialAiChatState, {
      type: 'loaded',
      conversations: [conversation],
    })
    state = aiChatReducer(state, {
      type: 'send-start',
      conversationId: conversation.id,
      userMessage,
      assistantMessage,
    })
    state = aiChatReducer(state, {
      type: 'stream-event',
      conversationId: conversation.id,
      event: { type: 'delta', messageId: assistantMessage.id, delta: '你好，' },
    })
    state = aiChatReducer(state, {
      type: 'stream-event',
      conversationId: conversation.id,
      event: {
        type: 'delta',
        messageId: assistantMessage.id,
        delta: '我是 AI。',
      },
    })
    state = aiChatReducer(state, {
      type: 'stream-event',
      conversationId: conversation.id,
      event: { type: 'complete', messageId: assistantMessage.id },
    })
    const active = getActiveConversation(state)
    expect(active?.title).toBe('你好')
    expect(active?.messages.at(-1)).toMatchObject({
      content: '你好，我是 AI。',
      status: 'complete',
    })
    expect(state.phase).toBe('ready')
  })

  it('marks an assistant message as failed and keeps it retryable', () => {
    const conversation = {
      id: 'conversation-1',
      title: '失败示例',
      messages: [],
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    const assistant = {
      id: 'assistant-1',
      conversationId: conversation.id,
      role: 'assistant' as const,
      content: '',
      status: 'thinking' as const,
      createdAt: conversation.updatedAt,
    }
    const user = {
      id: 'user-1',
      conversationId: conversation.id,
      role: 'user' as const,
      content: '失败',
      status: 'complete' as const,
      createdAt: conversation.updatedAt,
    }
    let state = aiChatReducer(initialAiChatState, {
      type: 'loaded',
      conversations: [conversation],
    })
    state = aiChatReducer(state, {
      type: 'send-start',
      conversationId: conversation.id,
      userMessage: user,
      assistantMessage: assistant,
    })
    state = aiChatReducer(state, {
      type: 'stream-event',
      conversationId: conversation.id,
      event: {
        type: 'error',
        messageId: assistant.id,
        error: '请求失败',
      },
    })
    expect(state.phase).toBe('error')
    expect(getActiveConversation(state)?.messages.at(-1)).toMatchObject({
      status: 'error',
      error: '请求失败',
    })
  })
})

describe('useAiTask', () => {
  it('polls queued tasks until completion', async () => {
    let poll = 0
    const client: AiTaskClient = {
      submit: vi.fn(async (input) => snapshot('queued', { input })),
      get: vi.fn(async () => {
        poll += 1
        return poll === 1
          ? snapshot('running', { progress: 50 })
          : snapshot('completed', {
              result: { title: '完成', summary: '处理完成' },
            })
      }),
      cancel: vi.fn(async () => snapshot('cancelled')),
      retry: vi.fn(async (task) =>
        snapshot('queued', { id: `${task.id}-retry`, input: task.input }),
      ),
    }
    const { result } = renderHook(() =>
      useAiTask(client, { pollIntervalMs: 5 }),
    )
    await act(async () => {
      await result.current.submit({ prompt: '测试任务' })
    })
    expect(result.current.phase).toBe('queued')
    await waitFor(() => expect(result.current.phase).toBe('completed'), {
      timeout: 200,
    })
    expect(result.current.task?.result?.title).toBe('完成')
    expect(client.get).toHaveBeenCalledTimes(2)
  })

  it('cancels active work and uses the mock client retry path', async () => {
    const client = createMockAiTaskClient()
    const { result } = renderHook(() =>
      useAiTask(client, { pollIntervalMs: 1000 }),
    )
    await act(async () => {
      await result.current.submit({ prompt: '失败任务' })
    })
    expect(result.current.canCancel).toBe(true)
    await act(async () => {
      await result.current.cancel()
    })
    expect(result.current.phase).toBe('cancelled')
    expect(result.current.canRetry).toBe(true)
    await act(async () => {
      await result.current.retry()
    })
    expect(result.current.phase).toBe('queued')
  })

  it('restores a persisted task and keeps it available on page re-entry', async () => {
    localStorage.clear()
    const client: AiTaskClient = {
      submit: vi.fn(async (input) => snapshot('running', { input })),
      get: vi.fn(async () => snapshot('running', { progress: null })),
      cancel: vi.fn(async () => snapshot('cancelled')),
      retry: vi.fn(async (task) =>
        snapshot('queued', { id: `${task.id}-retry`, input: task.input }),
      ),
    }
    const options = { pollIntervalMs: 1000, storageKey: 'ai-task' }
    const first = renderHook(() => useAiTask(client, options))
    await act(async () => {
      await first.result.current.submit({ prompt: '恢复任务' })
    })
    expect(localStorage.getItem('ai-task')).toContain('恢复任务')
    first.unmount()

    const second = renderHook(() => useAiTask(client, options))
    expect(second.result.current.phase).toBe('running')
    expect(second.result.current.task?.input.prompt).toBe('恢复任务')
    second.unmount()
    localStorage.clear()
  })
})

describe('useAiChat', () => {
  it('streams a mock reply and supports cancellation', async () => {
    const client = createMockAiChatClient()
    const { result } = renderHook(() => useAiChat(client))
    await waitFor(() => expect(result.current.phase).toBe('ready'))
    await act(async () => {
      await result.current.send('给我一个摘要')
    })
    await waitFor(() => expect(result.current.phase).toBe('ready'))
    expect(result.current.activeConversation?.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: '给我一个摘要' }),
        expect.objectContaining({
          role: 'assistant',
          status: 'complete',
          content: expect.stringContaining('Mock 流式回复'),
        }),
      ]),
    )

    act(() => {
      void result.current.send('这次取消')
    })
    await waitFor(() => expect(result.current.phase).toBe('streaming'))
    act(() => result.current.cancel())
    await waitFor(() => expect(result.current.phase).toBe('ready'))
    expect(result.current.activeConversation?.messages.at(-1)).toMatchObject({
      status: 'cancelled',
    })
  })

  it('exposes a failed message that can be retried', async () => {
    const client = createMockAiChatClient()
    const { result } = renderHook(() => useAiChat(client))
    await waitFor(() => expect(result.current.phase).toBe('ready'))
    await act(async () => {
      await result.current.send('失败')
    })
    await waitFor(() => expect(result.current.phase).toBe('error'))
    const failed = result.current.activeConversation?.messages.at(-1)
    expect(failed).toMatchObject({ status: 'error' })
    const failedId = failed?.id
    expect(failedId).toBeTruthy()
    await act(async () => {
      await result.current.retry(failedId!)
    })
    await waitFor(() => expect(result.current.phase).toBe('ready'))
    expect(result.current.activeConversation?.messages.at(-1)).toMatchObject({
      status: 'complete',
    })
  })
})
