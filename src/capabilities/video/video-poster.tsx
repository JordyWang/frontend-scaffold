import { type ImgHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

export type VideoPosterProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string
  alt?: string
}

export function VideoPoster({
  className,
  alt = '视频封面',
  ...props
}: VideoPosterProps) {
  return (
    <img
      className={cn(
        'block max-w-full rounded-[var(--radius-md)] object-cover',
        className,
      )}
      alt={alt}
      loading="lazy"
      {...props}
    />
  )
}
