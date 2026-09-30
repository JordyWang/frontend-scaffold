import { useEffect, useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { FloatButton, type FloatButtonProps } from './overlay'

export type BackTopProps = Omit<FloatButtonProps, 'label'> & {
  label?: string
  target?: () => Window | HTMLElement | null
  visibilityHeight?: number
  showProgress?: boolean
  behavior?: ScrollBehavior
}

type ScrollState = { visible: boolean; progress: number }

function isWindowTarget(target: Window | HTMLElement): target is Window {
  return 'document' in target
}

function getScrollState(
  target: Window | HTMLElement,
  threshold: number,
): ScrollState {
  const scrollTop = isWindowTarget(target)
    ? Math.max(
        target.scrollY,
        target.document.documentElement.scrollTop,
        target.document.body.scrollTop,
      )
    : target.scrollTop
  const scrollableHeight = isWindowTarget(target)
    ? Math.max(
        target.document.documentElement.scrollHeight,
        target.document.body.scrollHeight,
      ) - target.innerHeight
    : target.scrollHeight - target.clientHeight

  return {
    visible: scrollTop > threshold,
    progress:
      scrollableHeight > 0
        ? Math.min(100, Math.max(0, (scrollTop / scrollableHeight) * 100))
        : 0,
  }
}

/** A scroll-aware FloatButton for the page or a scrollable element. */
export function BackTop({
  label = '回到顶部',
  target,
  visibilityHeight = 400,
  showProgress = false,
  behavior = 'smooth',
  variant = 'outline',
  className,
  children,
  onClick,
  ...props
}: BackTopProps) {
  const [scrollState, setScrollState] = useState<ScrollState>({
    visible: false,
    progress: 0,
  })

  useEffect(() => {
    const scrollTarget = target ? target() : window
    if (!scrollTarget) return

    let frame = 0
    const update = () => {
      const next = getScrollState(scrollTarget, visibilityHeight)
      setScrollState((current) =>
        current.visible === next.visible && current.progress === next.progress
          ? current
          : next,
      )
    }
    const scheduleUpdate = () => {
      if (!window.requestAnimationFrame) {
        update()
        return
      }
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        update()
      })
    }

    update()
    scrollTarget.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(scheduleUpdate)
    observer?.observe(
      isWindowTarget(scrollTarget)
        ? scrollTarget.document.documentElement
        : scrollTarget,
    )

    return () => {
      scrollTarget.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      observer?.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [target, visibilityHeight])

  if (!scrollState.visible) return null

  const progress = Math.round(scrollState.progress)
  const circumference = 2 * Math.PI * 19

  return (
    <FloatButton
      {...props}
      label={label}
      variant={variant}
      className={cn(variant === 'outline' && 'text-primary', className)}
      data-ui-back-top=""
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        const scrollTarget = target ? target() : window
        if (!scrollTarget) return
        const reducedMotion = window.matchMedia?.(
          '(prefers-reduced-motion: reduce)',
        ).matches
        scrollTarget.scrollTo({
          top: 0,
          behavior: reducedMotion ? 'auto' : behavior,
        })
      }}
    >
      {showProgress && (
        <svg
          aria-hidden="true"
          data-scroll-progress={progress}
          className="pointer-events-none absolute inset-0 size-full -rotate-90"
          viewBox="0 0 44 44"
          fill="none"
        >
          <circle
            cx="22"
            cy="22"
            r="19"
            stroke="currentColor"
            opacity="0.2"
            strokeWidth="2"
          />
          <circle
            cx="22"
            cy="22"
            r="19"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress / 100)}
            strokeLinecap="round"
          />
        </svg>
      )}
      {children ?? (
        <svg
          aria-hidden="true"
          className="size-5"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 16V4m-5 5 5-5 5 5" />
        </svg>
      )}
    </FloatButton>
  )
}
