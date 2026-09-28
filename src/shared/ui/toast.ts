import { toast as sonnerToast } from 'sonner'

export type ToastOptions = {
  title: string
  description?: string
  variant?: 'default' | 'success' | 'warning' | 'error'
  duration?: number
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
