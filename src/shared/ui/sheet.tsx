import * as DialogPrimitive from '@radix-ui/react-dialog'
import { type ReactElement, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { Button } from './button'
import { useConfig } from './config-context'
import { CloseIcon } from './icons'
import { usePortalContainer } from './portal-context'
import {
  overlayBackdropStyles,
  overlayBodyStyles,
  overlayDescriptionStyles,
  overlayFooterStyles,
  overlayHeaderStyles,
  overlayPanelStyles,
  overlayTitleStyles,
} from './tailwind-styles'

export type SheetProps = {
  title: ReactNode
  description?: string
  trigger?: ReactElement
  children: ReactNode
  footer?: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  side?: 'left' | 'right' | 'bottom'
  closeLabel?: string
}

export function Sheet({
  title,
  description,
  trigger,
  children,
  footer,
  open,
  defaultOpen,
  onOpenChange,
  side = 'right',
  closeLabel = '关闭面板',
}: SheetProps) {
  const { direction } = useConfig()
  const portalContainer = usePortalContainer()
  return (
    <DialogPrimitive.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      {trigger && (
        <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      )}
      <DialogPrimitive.Portal container={portalContainer}>
        <DialogPrimitive.Overlay className={overlayBackdropStyles} />
        <DialogPrimitive.Content
          dir={direction}
          className={cn(
            overlayPanelStyles,
            'bottom-0 w-[min(100vw,26rem)] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] max-sm:inset-x-0 max-sm:top-auto max-sm:w-full max-sm:max-h-[85dvh] max-sm:rounded-t-[var(--ui-overlay-radius)] max-sm:rounded-b-none max-sm:pt-0',
            side === 'right' && 'top-0 right-0',
            side === 'left' && 'top-0 left-0',
            side === 'bottom' &&
              'inset-x-0 max-h-[85dvh] w-full rounded-t-[var(--ui-overlay-radius)] rounded-b-none pt-0',
          )}
          aria-describedby={description ? undefined : ''}
        >
          <div className={overlayHeaderStyles}>
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className={overlayTitleStyles}>
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description
                  className={overlayDescriptionStyles}
                >
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" aria-label={closeLabel}>
                <CloseIcon />
              </Button>
            </DialogPrimitive.Close>
          </div>
          <div className={`${overlayBodyStyles} flex-1`}>{children}</div>
          {footer && <div className={overlayFooterStyles}>{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
