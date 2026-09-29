import { type ReactNode } from 'react'

export type WelcomePanelProps = {
  title?: string
  description?: string
  icon?: ReactNode
}

export function WelcomePanel({
  title = '你好，我是 AI 助手',
  description = '描述你的目标，我会用流式消息逐步返回结果。',
  icon,
}: WelcomePanelProps) {
  return (
    <div
      className="grid min-h-64 content-center justify-items-center gap-[var(--space-sm)] px-[var(--space-md)] py-[var(--space-xl)] text-center"
      role="status"
    >
      <div
        className="grid size-12 place-items-center rounded-2xl bg-accent font-extrabold text-accent-foreground"
        aria-hidden={icon ? undefined : true}
      >
        {icon ?? <span>AI</span>}
      </div>
      <h3 className="m-0">{title}</h3>
      <p className="m-0 max-w-md leading-[1.6] text-muted-foreground">
        {description}
      </p>
    </div>
  )
}
