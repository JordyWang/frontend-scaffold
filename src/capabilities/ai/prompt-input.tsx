import { useState, type FormEvent } from 'react'
import { Button, Textarea } from '@/shared/ui'

export function PromptInput({
  onSubmit,
  disabled,
  loading,
}: {
  onSubmit: (prompt: string) => void
  disabled?: boolean
  loading?: boolean
}) {
  const [prompt, setPrompt] = useState('')
  function submit(event: FormEvent) {
    event.preventDefault()
    const value = prompt.trim()
    if (!value || disabled || loading) return
    onSubmit(value)
  }
  return (
    <form className="ui-ai-prompt" onSubmit={submit}>
      <Textarea
        aria-label="任务描述"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="描述要执行的任务；输入“失败”可演示失败和重试"
        disabled={disabled || loading}
      />
      <div className="ui-ai-prompt__footer">
        <span className="ui-field__hint">Enter 提交，Shift + Enter 换行</span>
        <Button
          type="submit"
          loading={loading}
          disabled={!prompt.trim() || disabled}
        >
          提交任务
        </Button>
      </div>
    </form>
  )
}
