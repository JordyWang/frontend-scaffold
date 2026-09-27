import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorState } from './feedback-state'

export type ErrorBoundaryProps = {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
}

type ErrorBoundaryState = { error: Error | null }

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (!this.state.error) return this.props.children
    return (
      this.props.fallback?.(this.state.error, this.reset) ?? (
        <ErrorState
          title="页面加载失败"
          description="请重试。"
          onRetry={this.reset}
        />
      )
    )
  }
}
