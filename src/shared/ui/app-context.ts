import { createContext, useContext } from 'react'
import {
  message,
  notification,
  type MessageContent,
  type NotificationOptions,
} from './toast'

export type AppModalOptions = NotificationOptions & {
  okText?: string
}

export type AppModalApi = {
  open: (options: AppModalOptions) => string | number
  confirm: (options: AppModalOptions) => string | number
  info: (options: AppModalOptions) => string | number
  success: (options: AppModalOptions) => string | number
  warning: (options: AppModalOptions) => string | number
  error: (options: AppModalOptions) => string | number
  destroy: (id?: string | number) => void
}

export type AppContextValue = {
  message: typeof message
  notification: typeof notification
  modal: AppModalApi
}

const modalApi: AppModalApi = {
  open: (options) => notification.open(options),
  confirm: (options) => notification.open(options),
  info: (options) => notification.open(options),
  success: (options) => notification.success(options),
  warning: (options) => notification.warning(options),
  error: (options) => notification.error(options),
  destroy: notification.close,
}

export const AppContext = createContext<AppContextValue>({
  message,
  notification,
  modal: modalApi,
})

export function useApp() {
  return useContext(AppContext)
}

export type AppMessageContent = MessageContent

export { modalApi }
