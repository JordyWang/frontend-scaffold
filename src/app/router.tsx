import { createBrowserRouter } from 'react-router'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  ...(import.meta.env.DEV
    ? [
        {
          path: '/__ui',
          lazy: async () => {
            const { DevWorkbenchPage } =
              await import('@/pages/DevWorkbenchPage')
            return { Component: DevWorkbenchPage }
          },
        },
      ]
    : []),
  { path: '*', element: <NotFoundPage /> },
])
