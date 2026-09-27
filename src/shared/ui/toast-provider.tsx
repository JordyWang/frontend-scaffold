import { Toaster } from 'sonner'

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      closeButton
      visibleToasts={3}
      toastOptions={{ className: 'ui-toast' }}
    />
  )
}
