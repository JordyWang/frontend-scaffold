import type { SVGProps } from 'react'
import { cn } from '@/shared/lib/utils'

const paths = {
  home: (
    <>
      <path d="m3 9 7-6 7 6v8H3z" />
      <path d="M8 17v-5h4v5" />
    </>
  ),
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
  eye: (
    <>
      <path d="M2 10s2.7-4.5 8-4.5 8 4.5 8 4.5-2.7 4.5-8 4.5S2 10 2 10Z" />
      <circle cx="10" cy="10" r="2.5" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M3 3l14 14M7.3 5.9A9.1 9.1 0 0 1 10 5.5c5.3 0 8 4.5 8 4.5a10 10 0 0 1-2.2 2.6M12.8 14.1a9.1 9.1 0 0 1-2.8.4C4.7 14.5 2 10 2 10a10 10 0 0 1 2.2-2.6" />
      <path d="M8.3 8.3a2.5 2.5 0 0 0 3.4 3.4" />
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
      className={cn('inline-block shrink-0 align-middle', className)}
      {...props}
    >
      {paths[name]}
    </svg>
  )
}
