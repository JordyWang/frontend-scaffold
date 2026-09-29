import { createContext } from 'react'

export type FormLayout = 'vertical' | 'horizontal' | 'inline'

export const FormLayoutContext = createContext<FormLayout>('vertical')
