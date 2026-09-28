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
    <div className="ui-ai-welcome" role="status">
      <div
        className="ui-ai-welcome__icon"
        aria-hidden={icon ? undefined : true}
      >
        {icon ?? <span>AI</span>}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}
