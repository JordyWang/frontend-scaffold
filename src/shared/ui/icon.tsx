import type { SVGProps } from 'react'
import { cn } from '@/shared/lib/utils'

const paths = {
  user: (
    <>
      <circle cx="10" cy="6" r="3" />
      <path d="M3 18v-2a7 7 0 0 1 14 0v2" />
    </>
  ),
  home: (
    <>
      <path d="m3 9 7-6 7 6v8H3z" />
      <path d="M8 17v-5h4v5" />
    </>
  ),
  check: <path d="m4 10 4 4 8-8" />,
  copy: <path d="M7 7h10v11H7ZM4 13H2V2h10v2" />,
  edit: <path d="m13 3 4 4M3 17l1-5L14 2l4 4L8 16ZM3 17l5-1" />,
  grip: <path d="M7 4h.01M13 4h.01M7 10h.01M13 10h.01M7 16h.01M13 16h.01" />,
  folder: (
    <path d="M2 5a1 1 0 0 1 1-1h5l2 2h7a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1Z" />
  ),
  file: <path d="M4 2h7l5 5v11H4ZM11 2v5h5M7 11h6M7 14h6" />,
  close: <path d="M5 5l10 10M15 5 5 15" />,
  calendar: (
    <path d="M3 4h14v13H3ZM3 8h14M6 2v4M14 2v4M6 11h.01M10 11h.01M14 11h.01M6 14h.01M10 14h.01" />
  ),
  clock: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 5v5l3 2" />
    </>
  ),
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
  zoomIn: (
    <>
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="m12.5 12.5 4.5 4.5M6 8.5h5M8.5 6v5" />
    </>
  ),
  zoomOut: (
    <>
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="m12.5 12.5 4.5 4.5M6 8.5h5" />
    </>
  ),
  rotateLeft: <path d="M3 8a7 7 0 1 1 1 7M3 3v5h5" />,
  rotateRight: <path d="M17 8a7 7 0 1 0-1 7M17 3v5h-5" />,
  flipHorizontal: (
    <>
      <path d="M10 2v16M7 5 2 15h5zM13 5l5 10h-5z" />
    </>
  ),
  flipVertical: <path d="M2 10h16M5 7l10-5v5zM5 13l10 5v-5z" />,
  reset: <path d="M3 8a7 7 0 1 1 1 7M3 3v5h5M10 6v4l3 2" />,
  arrowLeft: <path d="m12 4-6 6 6 6" />,
  arrowRight: <path d="m8 4 6 6-6 6" />,
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
