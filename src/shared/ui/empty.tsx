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
    <div
      className={cn(
        'flex min-h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-center',
        className,
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 48 48"
        fill="none"
        className="size-12 text-muted-foreground"
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
      <p className="m-0 font-semibold">{title}</p>
      {description && (
        <p className="m-0 text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
