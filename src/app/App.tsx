import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { router } from '@/app/router'
import { App as UiApp } from '@/shared/ui/app'
import { ConfigProvider } from '@/shared/ui/config-provider'
import { ErrorBoundary } from '@/shared/ui/error-boundary'
import { ToastProvider } from '@/shared/ui/toast-provider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

export function App() {
  return (
    <ConfigProvider>
      <UiApp>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
          <ToastProvider />
        </ErrorBoundary>
      </UiApp>
    </ConfigProvider>
  )
}
