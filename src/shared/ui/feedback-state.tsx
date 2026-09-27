import { type ReactNode } from 'react'
import { Button } from './button'
import { Empty } from './empty'

export type ErrorStateProps = {
  title?: string
  description?: string
  onRetry?: () => void
  action?: ReactNode
}

export function LoadingState({ label = '正在加载…' }: { label?: string }) {
  return (
    <p role="status" className="ui-data-status">
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
  return (
    <div role="alert">
      <Empty
        title={title}
        description={description}
        action={
          action ??
          (onRetry ? (
            <Button variant="outline" onClick={onRetry}>
              重试
            </Button>
          ) : undefined)
        }
      />
    </div>
  )
}
