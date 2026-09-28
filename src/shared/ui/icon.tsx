import type { SVGProps } from 'react'
import { cn } from '@/shared/lib/utils'

const paths = {
  check: <path d="m4 10 4 4 8-8" />,
  close: <path d="M5 5l10 10M15 5 5 15" />,
  info: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 9v5M10 6.5h.01" />
    </>
  ),
  warning: (
    <>
      <path d="M9.1 3.5a1 1 0 0 1 1.8 0l7 12.5a1 1 0 0 1-.9 1.5H3a1 1 0 0 1-.9-1.5z" />
      <path d="M10 8v4M10 15h.01" />
    </>
  ),
  search: (
    <>
      <circle cx="9" cy="9" r="5.5" />
      <path d="m13 13 4 4" />
    </>
  ),
} as const

export type IconProps = SVGProps<SVGSVGElement> & {
  name: keyof typeof paths
  size?: number
  label?: string
}

export function Icon({
  name,
  size = 20,
  label,
  className,
  ...props
}: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('ui-icon', className)}
      {...props}
    >
      {paths[name]}
    </svg>
  )
}
