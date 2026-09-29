import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { Button, Textarea } from '@/shared/ui'

export type PromptComposerProps = {
  onSubmit: (content: string) => void
  onCancel?: () => void
  disabled?: boolean
  loading?: boolean
  placeholder?: string
}

export function PromptComposer({
  onSubmit,
  onCancel,
  disabled,
  loading,
  placeholder = '输入消息，Enter 发送，Shift + Enter 换行',
}: PromptComposerProps) {
  const [value, setValue] = useState('')
  const canSubmit = Boolean(value.trim()) && !disabled && !loading

  function submit(event?: FormEvent) {
    event?.preventDefault()
    const content = value.trim()
    if (!content || !canSubmit) return
    onSubmit(content)
    setValue('')
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form
      className="grid gap-[var(--space-sm)] rounded-[var(--radius-lg)] border border-border bg-card p-[var(--space-sm)]"
      onSubmit={submit}
    >
      <Textarea
        aria-label="发送消息"
        className="min-h-20 resize-y border-0 p-2 focus-visible:outline-offset-[-2px]"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled || loading}
        rows={3}
      />
      <div className="flex items-center justify-between gap-[var(--space-sm)] px-2 pb-1 max-sm:flex-wrap">
        <span className="text-sm leading-normal text-muted-foreground">
          内容会以流式消息返回
        </span>
        {loading && onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            停止生成
          </Button>
        ) : (
          <Button type="submit" disabled={!canSubmit} loading={loading}>
            发送
          </Button>
        )}
      </div>
    </form>
  )
}
