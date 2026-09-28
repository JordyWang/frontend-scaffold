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
