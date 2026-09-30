import { useRef, useState, type ReactNode } from 'react'
import { Button } from './button'
import { Empty } from './empty'

export type ErrorStateProps = {
  title?: string
  description?: string
  onRetry?: () => void | Promise<void>
  action?: ReactNode
}

export function LoadingState({ label = '正在加载…' }: { label?: string }) {
  return (
    <p
      role="status"
      className="rounded-[var(--radius-md)] border border-border p-6 text-muted-foreground"
    >
      {label}
    </p>
  )
}

export function ErrorState({
  title = '加载失败',
  description,
  onRetry,
  action,
}: ErrorStateProps) {
  const retryingRef = useRef(false)
  const [retrying, setRetrying] = useState(false)
  const [retryFailed, setRetryFailed] = useState(false)

  async function retry() {
    if (!onRetry || retryingRef.current) return
    retryingRef.current = true
    setRetrying(true)
    setRetryFailed(false)
    try {
      await onRetry()
    } catch {
      setRetryFailed(true)
    } finally {
      retryingRef.current = false
      setRetrying(false)
    }
  }

  return (
    <div role="alert">
      <Empty
        title={title}
        description={
          retryFailed
            ? `${description ? `${description} ` : ''}重试失败，请再次尝试。`
            : description
        }
        action={
          action ??
          (onRetry ? (
            <Button variant="outline" loading={retrying} onClick={retry}>
              重试
            </Button>
          ) : undefined)
        }
      />
    </div>
  )
}
