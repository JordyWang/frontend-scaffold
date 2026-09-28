import { toast as sonnerToast } from 'sonner'

export type ToastOptions = {
  title: string
  description?: string
  variant?: 'default' | 'success' | 'warning' | 'error'
  duration?: number
}

export type NotificationOptions = Omit<ToastOptions, 'title'> & {
  message: string
}

export type MessageContent =
  string | (Omit<ToastOptions, 'title'> & { content: string })

function messageOptions(content: MessageContent): ToastOptions {
  return typeof content === 'string'
    ? { title: content }
    : { title: content.content, ...content }
}

export function toast({
  title,
  description,
  variant = 'default',
  duration,
}: ToastOptions) {
  const options = { description, duration }
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
    return toast({ title: options.message, ...options })
  },
  success(options: Omit<NotificationOptions, 'variant'>) {
    return toast({ title: options.message, ...options, variant: 'success' })
  },
  warning(options: Omit<NotificationOptions, 'variant'>) {
    return toast({ title: options.message, ...options, variant: 'warning' })
  },
  error(options: Omit<NotificationOptions, 'variant'>) {
    return toast({ title: options.message, ...options, variant: 'error' })
  },
  close: dismissToast,
}

/** Compact message API for one-line feedback, backed by the same ToastProvider. */
export const message = {
  open(content: MessageContent) {
    return toast(messageOptions(content))
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
    return toast({ ...messageOptions(content), duration: 0 })
  },
  destroy: dismissToast,
}
