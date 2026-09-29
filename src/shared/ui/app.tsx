import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { AppContext, modalApi } from './app-context'
import { message, notification } from './toast'

export type AppProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  children: ReactNode
}

/** App-level context matching Ant Design's useApp boundary. */
export function App({ children, className, ...props }: AppProps) {
  return (
    <AppContext.Provider value={{ message, notification, modal: modalApi }}>
      <div {...props} data-ui-app="" className={cn('contents', className)}>
        {children}
      </div>
    </AppContext.Provider>
  )
}

export type {
  AppContextValue,
  AppMessageContent,
  AppModalApi,
  AppModalOptions,
} from './app-context'
