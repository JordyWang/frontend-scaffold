import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast as sonnerToast } from 'sonner'
import { dismissToast, message, notification, toast } from '@/shared/ui'

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  }),
}))

beforeEach(() => vi.resetAllMocks())

describe('Toast manager', () => {
  it('uses a visible loading state and updates it by the same id', () => {
    vi.mocked(sonnerToast.loading).mockReturnValue('task-1')
    const id = message.loading({
      id: 'task-1',
      content: '处理中',
      description: '正在上传',
    })
    expect(id).toBe('task-1')
    expect(sonnerToast.loading).toHaveBeenCalledWith('处理中', {
      id: 'task-1',
      description: '正在上传',
      duration: 0,
    })

    message.success({ id, content: '已完成' })
    expect(sonnerToast.success).toHaveBeenCalledWith('已完成', {
      id: 'task-1',
      description: undefined,
      duration: undefined,
    })
    dismissToast(id)
    expect(sonnerToast.dismiss).toHaveBeenCalledWith('task-1')
  })

  it('preserves explicit duration and exposes information messages', () => {
    message.loading({ content: '稍候', duration: 2500 })
    expect(sonnerToast.loading).toHaveBeenCalledWith('稍候', {
      id: undefined,
      description: undefined,
      duration: 2500,
    })
    message.info('同步提示')
    notification.info({ message: '系统通知', description: '更新完成' })
    expect(sonnerToast.info).toHaveBeenNthCalledWith(1, '同步提示', {
      id: undefined,
      description: undefined,
      duration: undefined,
    })
    expect(sonnerToast.info).toHaveBeenNthCalledWith(2, '系统通知', {
      id: undefined,
      description: '更新完成',
      duration: undefined,
    })
    toast({ title: '普通提示' })
    expect(sonnerToast).toHaveBeenCalledWith('普通提示', {
      id: undefined,
      description: undefined,
      duration: undefined,
    })
  })
})
