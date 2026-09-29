import {
  useCallback,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import {
  AppContext,
  createModalApi,
  type AppModalKind,
  type AppModalOptions,
  type AppModalOpen,
} from './app-context'
import { Button } from './button'
import { Dialog } from './dialog'
import { message, notification } from './toast'

export type AppProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  children: ReactNode
}

type AppModalState = AppModalOptions & {
  id: string
  kind: AppModalKind
}

/** App-level context matching Ant Design's useApp boundary. */
export function App({ children, className, ...props }: AppProps) {
  const [modals, setModals] = useState<AppModalState[]>([])
  const destroy = useCallback((id?: string | number) => {
    if (id === undefined) setModals([])
    else
      setModals((current) => current.filter((modal) => modal.id !== String(id)))
  }, [])
  const open = useCallback<AppModalOpen>((options, kind) => {
    const id = `app-modal-${Date.now()}-${Math.random().toString(36).slice(2)}`
    setModals((current) => [...current, { ...options, id, kind }])
    return id
  }, [])
  const modal = useMemo(() => createModalApi(open, destroy), [destroy, open])

  const closeModal = useCallback(
    (modal: AppModalState, confirmed: boolean) => {
      if (confirmed) {
        void (async () => {
          try {
            await modal.onOk?.()
            destroy(modal.id)
          } catch {
            // Keep the dialog open when an async confirmation rejects.
          }
        })()
      } else {
        modal.onCancel?.()
        destroy(modal.id)
      }
    },
    [destroy],
  )

  return (
    <AppContext.Provider value={{ message, notification, modal }}>
      <div {...props} data-ui-app="" className={cn('contents', className)}>
        {children}
      </div>
      {modals.map((item) => (
        <Dialog
          key={item.id}
          open
          title={item.title ?? '提示'}
          description={item.description}
          onOpenChange={(openState) => {
            if (!openState) closeModal(item, false)
          }}
          footer={
            <div className="flex justify-end gap-2">
              {(item.kind === 'confirm' || item.cancelText) && (
                <Button
                  variant="outline"
                  onClick={() => closeModal(item, false)}
                >
                  {item.cancelText ?? '取消'}
                </Button>
              )}
              <Button onClick={() => closeModal(item, true)}>
                {item.okText ?? '确定'}
              </Button>
            </div>
          }
        >
          {item.content ?? '请确认此操作。'}
        </Dialog>
      ))}
    </AppContext.Provider>
  )
}

export type {
  AppContextValue,
  AppMessageContent,
  AppModalApi,
  AppModalKind,
  AppModalOptions,
  AppModalOpen,
} from './app-context'
