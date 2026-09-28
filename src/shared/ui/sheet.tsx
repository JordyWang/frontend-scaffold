import * as DialogPrimitive from '@radix-ui/react-dialog'
import { type ReactElement, type ReactNode } from 'react'
import { Button } from './button'
import { CloseIcon } from './icons'
import { usePortalContainer } from './portal-context'

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
        <DialogPrimitive.Overlay className="ui-overlay" />
        <DialogPrimitive.Content
          className={`ui-sheet ui-sheet--${side}`}
          aria-describedby={description ? undefined : ''}
        >
          <div className="ui-dialog__head">
            <div>
              <DialogPrimitive.Title className="ui-dialog__title">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="ui-dialog__description">
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
          <div className="ui-sheet__body">{children}</div>
          {footer && <div className="ui-dialog__footer">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
