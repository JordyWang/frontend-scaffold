import { toast as sonnerToast } from 'sonner'

export type ToastOptions = {
  id?: string | number
  title: string
  description?: string
  variant?: 'default' | 'info' | 'success' | 'warning' | 'error' | 'loading'
  duration?: number
}

export type NotificationOptions = Omit<ToastOptions, 'title'> & {
  message: string
}

export type MessageContent =
  string | (Omit<ToastOptions, 'title'> & { content: string })

function messageOptions(content: MessageContent): ToastOptions {
  if (typeof content === 'string') return { title: content }
  const { content: title, ...options } = content
  return { title, ...options }
}

function notificationOptions({
  message,
  ...options
}: NotificationOptions): ToastOptions {
  return { title: message, ...options }
}

export function toast({
  id,
  title,
  description,
  variant = 'default',
  duration,
}: ToastOptions) {
  const options = {
    id,
    description,
    duration: duration ?? (variant === 'loading' ? 0 : undefined),
  }
  if (variant === 'loading') return sonnerToast.loading(title, options)
  if (variant === 'info') return sonnerToast.info(title, options)
  if (variant === 'success') return sonnerToast.success(title, options)
  if (variant === 'warning') return sonnerToast.warning(title, options)
  if (variant === 'error') return sonnerToast.error(title, options)
  return sonnerToast(title, options)
}

export function dismissToast(id?: string | number) {
  sonnerToast.dismiss(id)
}

/** Message-shaped notification API for pages that prefer Ant Design naming. */
export const notification = {
  open(options: NotificationOptions) {
    return toast(notificationOptions(options))
  },
  info(options: Omit<NotificationOptions, 'variant'>) {
    return toast({ ...notificationOptions(options), variant: 'info' })
  },
  success(options: Omit<NotificationOptions, 'variant'>) {
    return toast({ ...notificationOptions(options), variant: 'success' })
  },
  warning(options: Omit<NotificationOptions, 'variant'>) {
    return toast({ ...notificationOptions(options), variant: 'warning' })
  },
  error(options: Omit<NotificationOptions, 'variant'>) {
    return toast({ ...notificationOptions(options), variant: 'error' })
  },
  close: dismissToast,
}

/** Compact message API for one-line feedback, backed by the same ToastProvider. */
export const message = {
  open(content: MessageContent) {
    return toast(messageOptions(content))
  },
  info(content: MessageContent) {
    return toast({ ...messageOptions(content), variant: 'info' })
  },
  success(content: MessageContent) {
    return toast({ ...messageOptions(content), variant: 'success' })
  },
  warning(content: MessageContent) {
    return toast({ ...messageOptions(content), variant: 'warning' })
  },
  error(content: MessageContent) {
    return toast({ ...messageOptions(content), variant: 'error' })
  },
  loading(content: MessageContent) {
    return toast({ ...messageOptions(content), variant: 'loading' })
  },
  destroy: dismissToast,
}
