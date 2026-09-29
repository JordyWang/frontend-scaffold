import { createContext, useContext, type ReactNode } from 'react'
import { message, notification, type MessageContent } from './toast'

export type AppModalOptions = {
  title?: ReactNode
  content?: ReactNode
  description?: string
  okText?: string
  cancelText?: string
  onOk?: () => void | Promise<void>
  onCancel?: () => void
}

export type AppModalApi = {
  open: (options: AppModalOptions) => string
  confirm: (options: AppModalOptions) => string
  info: (options: AppModalOptions) => string
  success: (options: AppModalOptions) => string
  warning: (options: AppModalOptions) => string
  error: (options: AppModalOptions) => string
  destroy: (id?: string | number) => void
}

export type AppModalKind =
  'default' | 'confirm' | 'info' | 'success' | 'warning' | 'error'

export type AppContextValue = {
  message: typeof message
  notification: typeof notification
  modal: AppModalApi
}

export type AppModalOpen = (
  options: AppModalOptions,
  kind: AppModalKind,
) => string

export function createModalApi(
  open: AppModalOpen,
  destroy: (id?: string | number) => void,
): AppModalApi {
  return {
    open: (options) => open(options, 'default'),
    confirm: (options) => open(options, 'confirm'),
    info: (options) => open(options, 'info'),
    success: (options) => open(options, 'success'),
    warning: (options) => open(options, 'warning'),
    error: (options) => open(options, 'error'),
    destroy,
  }
}

export const modalApi = createModalApi((options) => {
  const id = `fallback-modal-${Date.now()}`
  notification.open({
    message: String(options.title ?? options.content ?? '提示'),
    description: options.description,
  })
  return id
}, notification.close)

export const AppContext = createContext<AppContextValue>({
  message,
  notification,
  modal: modalApi,
})

export function useApp() {
  return useContext(AppContext)
}

export type AppMessageContent = MessageContent
