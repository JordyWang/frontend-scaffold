import { type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export type EmptyProps = {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function Empty({ title, description, action, className }: EmptyProps) {
  return (
    <div className={cn('ui-empty', className)}>
      <svg
        aria-hidden="true"
        viewBox="0 0 48 48"
        fill="none"
        className="ui-empty__icon"
      >
        <rect
          x="7"
          y="13"
          width="34"
          height="27"
          rx="5"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M16 13V9a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v4M17 27h14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <p className="ui-empty__title">{title}</p>
      {description && <p className="ui-empty__description">{description}</p>}
      {action && <div className="ui-empty__action">{action}</div>}
    </div>
  )
}
