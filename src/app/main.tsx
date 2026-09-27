import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from '@/app/App'
import '@/shared/styles/index.css'

async function bootstrap() {
  if (import.meta.env.MODE === 'mock') {
    const { worker } = await import('@/mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }

  const root = document.getElementById('root')

  if (!root) {
    throw new Error('Root element #root was not found')
  }

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

void bootstrap()
