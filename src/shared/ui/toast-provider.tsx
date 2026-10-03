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
      toastOptions={{
        closeButtonAriaLabel: '关闭提示',
        classNames: {
          toast: 'border! border-border! bg-card! text-card-foreground!',
          loader: '[&_.sonner-loading-bar]:bg-primary!',
          closeButton: 'size-11! border-border! bg-card! text-card-foreground!',
        },
      }}
    />
  )
}
