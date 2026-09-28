import {
  cloneElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { FormField, type FormFieldProps } from './form-field'

export type FormValues = Record<string, unknown>

export type FormRule<TValues extends FormValues = FormValues> = {
  required?: boolean
  message?: string
  validator?: (
    value: unknown,
    values: Partial<TValues>,
  ) => string | undefined | Promise<string | undefined>
}

export type FormInstance<TValues extends FormValues = FormValues> = {
  getFieldValue: (name: string) => unknown
  getFieldsValue: () => Partial<TValues>
  setFieldValue: (name: string, value: unknown) => void
  setFieldsValue: (values: Partial<TValues>) => void
  resetFields: (names?: string[]) => void
  validateFields: () => Promise<TValues>
}

type FieldRegistration<TValues extends FormValues> = {
  rules: FormRule<TValues>[]
}

type FormContextValue<TValues extends FormValues> = {
  values: Partial<TValues>
  errors: Record<string, string>
  validateOn: 'submit' | 'change' | 'blur'
  registerField: (name: string, rules: FormRule<TValues>[]) => () => void
  setFieldValue: (name: string, value: unknown) => void
  validateField: (name: string) => Promise<string | undefined>
}

const FormContext = createContext<FormContextValue<FormValues> | null>(null)

export type FormProps<TValues extends FormValues = FormValues> = Omit<
  FormHTMLAttributes<HTMLFormElement>,
  'onSubmit' | 'onChange' | 'onReset'
> & {
  initialValues?: Partial<TValues>
  values?: Partial<TValues>
  form?: FormInstance<TValues>
  layout?: 'vertical' | 'horizontal' | 'inline'
  validateOn?: 'submit' | 'change' | 'blur'
  onValuesChange?: (
    changedValues: Partial<TValues>,
    values: Partial<TValues>,
  ) => void
  onFinish?: (values: TValues) => void | Promise<void>
  onFinishFailed?: (
    errors: Record<string, string>,
    values: Partial<TValues>,
  ) => void
  onReset?: () => void
  children?: ReactNode
}

function isEmptyValue(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  )
}

/** A project-owned form coordinator for values, rules and accessible FormField errors. */
export function Form<TValues extends FormValues = FormValues>({
  initialValues = {},
  values: controlledValues,
  form,
  layout = 'vertical',
  validateOn = 'submit',
  onValuesChange,
  onFinish,
  onFinishFailed,
  onReset,
  className,
  children,
  ...props
}: FormProps<TValues>) {
  const [internalValues, setInternalValues] =
    useState<Partial<TValues>>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const valuesRef = useRef<Partial<TValues>>(controlledValues ?? internalValues)
  const fieldsRef = useRef(new Map<string, FieldRegistration<TValues>>())
  useEffect(() => {
    valuesRef.current = controlledValues ?? internalValues
  }, [controlledValues, internalValues])

  const setValues = useCallback(
    (changedValues: Partial<TValues>) => {
      const nextValues = { ...valuesRef.current, ...changedValues }
      valuesRef.current = nextValues as Partial<TValues>
      if (controlledValues === undefined)
        setInternalValues(nextValues as Partial<TValues>)
      onValuesChange?.(changedValues, nextValues)
    },
    [controlledValues, onValuesChange],
  )

  const runValidation = useCallback(async (name: string) => {
    const registration = fieldsRef.current.get(name)
    if (!registration) return undefined
    const value = valuesRef.current[name]
    for (const rule of registration.rules) {
      if (rule.required && isEmptyValue(value))
        return rule.message ?? '此项为必填项'
      if (!rule.validator) continue
      try {
        const message = await rule.validator(value, valuesRef.current)
        if (message) return message
      } catch (error) {
        if (error instanceof Error && error.message) return error.message
        return rule.message ?? '输入值无效'
      }
    }
    return undefined
  }, [])

  const validateField = useCallback(
    async (name: string) => {
      const message = await runValidation(name)
      setErrors((current) => {
        if (!message) {
          if (!(name in current)) return current
          const next = { ...current }
          delete next[name]
          return next
        }
        return { ...current, [name]: message }
      })
      return message
    },
    [runValidation],
  )

  const validateFields = useCallback(async () => {
    const nextErrors: Record<string, string> = {}
    for (const name of fieldsRef.current.keys()) {
      const message = await runValidation(name)
      if (message) nextErrors[name] = message
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) throw nextErrors
    return valuesRef.current as TValues
  }, [runValidation])

  const resetFields = useCallback(
    (names?: string[]) => {
      const targetNames = names ?? Object.keys(initialValues)
      const nextValues = { ...valuesRef.current } as Record<string, unknown>
      for (const name of targetNames) {
        if (Object.prototype.hasOwnProperty.call(initialValues, name))
          nextValues[name] = initialValues[name]
        else delete nextValues[name]
      }
      valuesRef.current = nextValues as Partial<TValues>
      if (controlledValues === undefined)
        setInternalValues(nextValues as Partial<TValues>)
      setErrors((current) => {
        const next = { ...current }
        for (const name of targetNames) delete next[name]
        return next
      })
      onValuesChange?.(
        nextValues as Partial<TValues>,
        nextValues as Partial<TValues>,
      )
    },
    [controlledValues, initialValues, onValuesChange],
  )

  const instance = useMemo<FormInstance<TValues>>(
    () => ({
      getFieldValue: (name) => valuesRef.current[name],
      getFieldsValue: () => ({ ...valuesRef.current }),
      setFieldValue: (name, value) =>
        setValues({ [name]: value } as Partial<TValues>),
      setFieldsValue: (nextValues) => setValues(nextValues),
      resetFields,
      validateFields,
    }),
    [resetFields, setValues, validateFields],
  )
  useEffect(() => {
    if (form) Object.assign(form, instance)
  }, [form, instance])

  const contextValue: FormContextValue<TValues> = {
    values: controlledValues ?? internalValues,
    errors,
    validateOn,
    registerField: (name, rules) => {
      fieldsRef.current.set(name, { rules })
      return () => fieldsRef.current.delete(name)
    },
    setFieldValue: (name, value) =>
      setValues({ [name]: value } as Partial<TValues>),
    validateField,
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const nextValues = await validateFields()
      await onFinish?.(nextValues)
    } catch (error) {
      onFinishFailed?.(
        (error as Record<string, string>) ?? {},
        valuesRef.current,
      )
    }
  }

  function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    resetFields()
    onReset?.()
  }

  return (
    <FormContext.Provider value={contextValue}>
      <form
        {...props}
        className={cn('ui-form', `ui-form--${layout}`, className)}
        noValidate
        onSubmit={handleSubmit}
        onReset={handleReset}
      >
        {children}
      </form>
    </FormContext.Provider>
  )
}

export type FormItemProps<TValues extends FormValues = FormValues> = Omit<
  FormFieldProps,
  'control' | 'error' | 'required'
> & {
  name: string
  control: ReactElement
  rules?: FormRule<TValues>[]
  valuePropName?: string
  trigger?: string
  getValueFromEvent?: (...args: unknown[]) => unknown
}

function defaultValueFromEvent(valuePropName: string, firstArgument: unknown) {
  if (
    firstArgument &&
    typeof firstArgument === 'object' &&
    'target' in firstArgument
  ) {
    const target = firstArgument.target as HTMLInputElement
    return valuePropName === 'checked' ? target.checked : target.value
  }
  return firstArgument
}

/** A FormField adapter that connects project controls to the parent Form store. */
export function FormItem<TValues extends FormValues = FormValues>({
  name,
  control,
  rules = [],
  valuePropName = 'value',
  trigger = 'onChange',
  getValueFromEvent,
  ...fieldProps
}: FormItemProps<TValues>) {
  const context = useContext(FormContext) as FormContextValue<TValues> | null

  if (!context)
    return (
      <FormField
        {...fieldProps}
        control={control as FormFieldProps['control']}
        required={rules.some((rule) => rule.required)}
      />
    )

  return (
    <ConnectedFormItem
      context={context}
      name={name}
      control={control}
      rules={rules}
      valuePropName={valuePropName}
      trigger={trigger}
      getValueFromEvent={getValueFromEvent}
      fieldProps={fieldProps}
    />
  )
}

type ConnectedFormItemProps<TValues extends FormValues> = {
  context: FormContextValue<TValues>
  name: string
  control: ReactElement
  rules: FormRule<TValues>[]
  valuePropName: string
  trigger: string
  getValueFromEvent?: (...args: unknown[]) => unknown
  fieldProps: Omit<FormFieldProps, 'control' | 'error' | 'required'>
}

function ConnectedFormItem<TValues extends FormValues>({
  context,
  name,
  control,
  rules,
  valuePropName,
  trigger,
  getValueFromEvent,
  fieldProps,
}: ConnectedFormItemProps<TValues>) {
  useEffect(() => context.registerField(name, rules), [context, name, rules])

  const controlProps = control.props as Record<string, unknown>
  const hasValue = Object.prototype.hasOwnProperty.call(context.values, name)
  const currentValue = context.values[name]
  const originalTrigger = controlProps[trigger]
  const originalBlur = controlProps.onBlur
  const injectedProps: Record<string, unknown> = {
    [trigger]: (...args: unknown[]) => {
      if (typeof originalTrigger === 'function') originalTrigger(...args)
      const nextValue = getValueFromEvent
        ? getValueFromEvent(...args)
        : defaultValueFromEvent(valuePropName, args[0])
      context.setFieldValue(name, nextValue)
      if (context.validateOn === 'change') void context.validateField(name)
    },
    onBlur: (event: unknown) => {
      if (typeof originalBlur === 'function') originalBlur(event)
      if (context.validateOn === 'blur') void context.validateField(name)
    },
  }
  if (hasValue) injectedProps[valuePropName] = currentValue

  const connectedControl = cloneElement(control, injectedProps)
  const required = rules.some((rule) => rule.required)
  return (
    <FormField
      {...fieldProps}
      control={connectedControl as FormFieldProps['control']}
      required={required}
      error={context.errors[name]}
    />
  )
}
