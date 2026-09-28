import { useState } from 'react'
import type { FormInstance, FormValues } from './form'

/** Creates an instance object that is wired by the nearest Form. */
export function useForm<TValues extends FormValues = FormValues>() {
  const [form] = useState(() => ({}) as FormInstance<TValues>)
  return form
}
