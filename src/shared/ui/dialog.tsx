import * as DialogPrimitive from '@radix-ui/react-dialog'
import { type ReactElement, type ReactNode } from 'react'
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

export type DialogProps = {
  title: ReactNode
  description?: string
  trigger?: ReactElement
  children: ReactNode
  footer?: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  closeLabel?: string
}

export function Dialog({
  title,
  description,
  trigger,
  children,
  footer,
  open,
  defaultOpen,
  onOpenChange,
  closeLabel = '关闭对话框',
}: DialogProps) {
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
          className={`${overlayPanelStyles} top-1/2 left-1/2 max-h-[min(90dvh,46rem)] w-[min(calc(100vw-2rem),32rem)] -translate-x-1/2 -translate-y-1/2`}
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
          <div className={overlayBodyStyles}>{children}</div>
          {footer && <div className={overlayFooterStyles}>{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
