import { Toaster } from 'sonner'

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      theme="system"
      mobileOffset={{
        bottom: 'max(1rem, env(safe-area-inset-bottom))',
        left: '1rem',
        right: '1rem',
      }}
      closeButton
      visibleToasts={3}
      toastOptions={{ className: 'ui-toast' }}
    />
  )
}
