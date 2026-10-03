import {
  cloneElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/utils'
import { FormField, type FormFieldProps } from './form-field'
import { FormLayoutContext } from './form-layout-context'

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
  getRules: () => FormRule<TValues>[]
  getDependencies: () => string[]
}

type FormContextValue<TValues extends FormValues> = {
  values: Partial<TValues>
  errors: Record<string, string>
  controlled: boolean
  validateOn: 'submit' | 'change' | 'blur'
  registerField: (
    name: string,
    getRules: () => FormRule<TValues>[],
    getDependencies: () => string[],
  ) => () => void
  setFieldValue: (name: string, value: unknown) => void
  validateField: (name: string) => Promise<string | undefined>
  requestValidation: (name: string, afterAcceptance?: boolean) => void
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
  scrollToFirstError?: boolean | ScrollIntoViewOptions
  onValuesChange?: (
    changedValues: Partial<TValues>,
    values: Partial<TValues>,
  ) => void
  onFinish?: (values: TValues) => void | Promise<void>
  onFinishError?: (error: unknown, values: TValues) => void
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
    value === false ||
    (Array.isArray(value) && value.length === 0)
  )
}

class FormValidationCancelled extends Error {
  constructor() {
    super('Form validation was cancelled by reset')
    this.name = 'AbortError'
  }
}

/** A project-owned form coordinator for values, rules and accessible FormField errors. */
export function Form<TValues extends FormValues = FormValues>({
  initialValues = {},
  values: controlledValues,
  form,
  layout = 'vertical',
  validateOn = 'submit',
  scrollToFirstError = true,
  onValuesChange,
  onFinish,
  onFinishError,
  onFinishFailed,
  onReset,
  className,
  children,
  ...props
}: FormProps<TValues>) {
  const [internalValues, setInternalValues] =
    useState<Partial<TValues>>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [focusErrorRequest, setFocusErrorRequest] = useState(0)
  const handledFocusErrorRequest = useRef(0)
  const valuesRef = useRef<Partial<TValues>>(controlledValues ?? internalValues)
  const formRef = useRef<HTMLFormElement>(null)
  const fieldsRef = useRef(new Map<string, FieldRegistration<TValues>>())
  const validatedFieldsRef = useRef(new Set<string>())
  const valuesVersionRef = useRef(0)
  const fieldsVersionRef = useRef(0)
  const resetVersionRef = useRef(0)
  const pendingControlledValidationRef = useRef(new Set<string>())
  const previousControlledValuesRef = useRef(controlledValues)
  const previousInternalValuesRef = useRef(internalValues)
  useLayoutEffect(() => {
    if (controlledValues === undefined) return
    valuesRef.current = controlledValues
    valuesVersionRef.current += 1
  }, [controlledValues])

  useEffect(() => {
    if (
      focusErrorRequest === 0 ||
      handledFocusErrorRequest.current === focusErrorRequest
    )
      return
    const firstInvalid = formRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    )
    if (!firstInvalid) return
    handledFocusErrorRequest.current = focusErrorRequest
    const focusTarget = firstInvalid?.matches(
      'button,input,textarea,select,[tabindex]:not([tabindex="-1"])',
    )
      ? firstInvalid
      : firstInvalid?.querySelector<HTMLElement>(
          'button,input,textarea,select,[tabindex]:not([tabindex="-1"])',
        )
    if (scrollToFirstError && firstInvalid?.scrollIntoView)
      firstInvalid.scrollIntoView(
        scrollToFirstError === true
          ? { block: 'center', inline: 'nearest' }
          : scrollToFirstError,
      )
    focusTarget?.focus({ preventScroll: true })
  }, [errors, focusErrorRequest, scrollToFirstError])

  const setValues = useCallback(
    (changedValues: Partial<TValues>) => {
      const nextValues = { ...valuesRef.current, ...changedValues }
      if (controlledValues === undefined) {
        valuesRef.current = nextValues as Partial<TValues>
        valuesVersionRef.current += 1
        setInternalValues(nextValues as Partial<TValues>)
        setErrors((current) => {
          const next = { ...current }
          for (const name of Object.keys(changedValues)) delete next[name]
          return next
        })
      }
      onValuesChange?.(changedValues, nextValues)
    },
    [controlledValues, onValuesChange],
  )

  const registerField = useCallback(
    (
      name: string,
      getRules: () => FormRule<TValues>[],
      getDependencies: () => string[],
    ) => {
      const registration = { getRules, getDependencies }
      fieldsRef.current.set(name, registration)
      fieldsVersionRef.current += 1
      return () => {
        if (fieldsRef.current.get(name) !== registration) return
        fieldsRef.current.delete(name)
        fieldsVersionRef.current += 1
      }
    },
    [],
  )

  const runValidation = useCallback(
    async (name: string, snapshot: Partial<TValues>) => {
      const registration = fieldsRef.current.get(name)
      if (!registration) return undefined
      const value = snapshot[name]
      for (const rule of registration.getRules()) {
        if (rule.required && isEmptyValue(value))
          return rule.message ?? '此项为必填项'
        if (!rule.validator) continue
        try {
          const message = await rule.validator(value, snapshot)
          if (message) return message
        } catch (error) {
          if (error instanceof Error && error.message) return error.message
          return rule.message ?? '输入值无效'
        }
      }
      return undefined
    },
    [],
  )

  const validateField = useCallback(
    async (name: string) => {
      const resetVersion = resetVersionRef.current
      while (fieldsRef.current.has(name)) {
        const valuesVersion = valuesVersionRef.current
        const fieldsVersion = fieldsVersionRef.current
        const snapshot = { ...valuesRef.current }
        const message = await runValidation(name, snapshot)
        if (resetVersion !== resetVersionRef.current) return undefined
        if (
          valuesVersion !== valuesVersionRef.current ||
          fieldsVersion !== fieldsVersionRef.current
        )
          continue
        setErrors((current) => {
          if (!message) {
            if (!(name in current)) return current
            const next = { ...current }
            delete next[name]
            return next
          }
          return { ...current, [name]: message }
        })
        validatedFieldsRef.current.add(name)
        return message
      }
      return undefined
    },
    [runValidation],
  )

  const revalidateDependents = useCallback(
    (changedNames: string[]) => {
      if (changedNames.length === 0) return
      const changed = new Set(changedNames)
      const dependents = [...fieldsRef.current.entries()]
        .filter(([name, registration]) =>
          registration
            .getDependencies()
            .some((source) => source !== name && changed.has(source)),
        )
        .map(([name]) => name)
      if (dependents.length === 0) return
      setErrors((current) => {
        if (!dependents.some((name) => name in current)) return current
        const next = { ...current }
        for (const name of dependents) delete next[name]
        return next
      })
      for (const name of dependents) {
        if (validateOn === 'change' || validatedFieldsRef.current.has(name))
          void validateField(name)
      }
    },
    [validateField, validateOn],
  )

  useEffect(() => {
    const previous = previousInternalValuesRef.current
    previousInternalValuesRef.current = internalValues
    if (controlledValues !== undefined) return
    const changedNames = [
      ...new Set([...Object.keys(previous), ...Object.keys(internalValues)]),
    ].filter((name) => !Object.is(previous[name], internalValues[name]))
    revalidateDependents(changedNames)
  }, [controlledValues, internalValues, revalidateDependents])

  const requestValidation = useCallback(
    (name: string, afterAcceptance = false) => {
      if (controlledValues !== undefined && afterAcceptance) {
        pendingControlledValidationRef.current.add(name)
        return
      }
      void validateField(name)
    },
    [controlledValues, validateField],
  )

  useEffect(() => {
    const previous = previousControlledValuesRef.current
    previousControlledValuesRef.current = controlledValues
    if (controlledValues === undefined) {
      pendingControlledValidationRef.current.clear()
      return
    }
    if (previous === undefined) return
    const changedNames = [
      ...new Set([...Object.keys(previous), ...Object.keys(controlledValues)]),
    ].filter((name) => !Object.is(previous[name], controlledValues[name]))
    if (changedNames.length === 0) return
    setErrors((current) => {
      const next = { ...current }
      for (const name of changedNames) delete next[name]
      return next
    })
    for (const name of changedNames) {
      if (
        validateOn === 'change' ||
        pendingControlledValidationRef.current.has(name)
      ) {
        pendingControlledValidationRef.current.delete(name)
        void validateField(name)
      }
    }
    revalidateDependents(changedNames)
  }, [controlledValues, revalidateDependents, validateField, validateOn])

  const validateFields = useCallback(async () => {
    const resetVersion = resetVersionRef.current
    while (true) {
      const valuesVersion = valuesVersionRef.current
      const fieldsVersion = fieldsVersionRef.current
      const snapshot = { ...valuesRef.current }
      const results = await Promise.all(
        [...fieldsRef.current.keys()].map(
          async (name) => [name, await runValidation(name, snapshot)] as const,
        ),
      )
      if (resetVersion !== resetVersionRef.current)
        throw new FormValidationCancelled()
      if (
        valuesVersion !== valuesVersionRef.current ||
        fieldsVersion !== fieldsVersionRef.current
      )
        continue
      const nextErrors: Record<string, string> = {}
      for (const [name, message] of results)
        if (message) nextErrors[name] = message
      for (const [name] of results) validatedFieldsRef.current.add(name)
      setErrors(nextErrors)
      if (Object.keys(nextErrors).length > 0) throw nextErrors
      return snapshot as TValues
    }
  }, [runValidation])

  const resetFields = useCallback(
    (names?: string[]) => {
      const targetNames = names ?? [
        ...new Set([
          ...Object.keys(valuesRef.current),
          ...Object.keys(initialValues),
        ]),
      ]
      const nextValues = { ...valuesRef.current } as Record<string, unknown>
      const changedValues: Record<string, unknown> = {}
      for (const name of targetNames) {
        if (Object.prototype.hasOwnProperty.call(initialValues, name)) {
          nextValues[name] = initialValues[name]
          changedValues[name] = initialValues[name]
        } else {
          delete nextValues[name]
          changedValues[name] = undefined
        }
      }
      resetVersionRef.current += 1
      pendingControlledValidationRef.current.clear()
      if (controlledValues === undefined) {
        for (const name of targetNames) validatedFieldsRef.current.delete(name)
        valuesRef.current = nextValues as Partial<TValues>
        previousInternalValuesRef.current = nextValues as Partial<TValues>
        valuesVersionRef.current += 1
        setInternalValues(nextValues as Partial<TValues>)
        setErrors((current) => {
          const next = { ...current }
          for (const name of targetNames) delete next[name]
          return next
        })
      }
      onValuesChange?.(
        changedValues as Partial<TValues>,
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
    controlled: controlledValues !== undefined,
    validateOn,
    registerField,
    setFieldValue: (name, value) =>
      setValues({ [name]: value } as Partial<TValues>),
    validateField,
    requestValidation,
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    let nextValues: TValues
    try {
      nextValues = await validateFields()
    } catch (error) {
      if (error instanceof FormValidationCancelled) return
      setFocusErrorRequest((request) => request + 1)
      onFinishFailed?.(
        (error as Record<string, string>) ?? {},
        valuesRef.current,
      )
      return
    }
    try {
      await onFinish?.(nextValues)
    } catch (error) {
      if (!onFinishError) throw error
      onFinishError(error, nextValues)
    }
  }

  function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    resetFields()
    onReset?.()
  }

  return (
    <FormContext.Provider value={contextValue}>
      <FormLayoutContext.Provider value={layout}>
        <form
          {...props}
          ref={formRef}
          className={cn(
            'flex gap-6',
            layout === 'inline'
              ? 'flex-row flex-wrap items-end gap-4'
              : 'flex-col',
            className,
          )}
          noValidate
          onSubmit={handleSubmit}
          onReset={handleReset}
        >
          {children}
        </form>
      </FormLayoutContext.Provider>
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
  dependencies?: string[]
  valuePropName?: string
  emptyValue?: unknown
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
  dependencies = [],
  valuePropName = 'value',
  emptyValue = '',
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
      dependencies={dependencies}
      valuePropName={valuePropName}
      emptyValue={emptyValue}
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
  dependencies: string[]
  valuePropName: string
  emptyValue: unknown
  trigger: string
  getValueFromEvent?: (...args: unknown[]) => unknown
  fieldProps: Omit<FormFieldProps, 'control' | 'error' | 'required'>
}

function ConnectedFormItem<TValues extends FormValues>({
  context,
  name,
  control,
  rules,
  dependencies,
  valuePropName,
  emptyValue,
  trigger,
  getValueFromEvent,
  fieldProps,
}: ConnectedFormItemProps<TValues>) {
  const registerField = context.registerField
  useEffect(
    () =>
      registerField(
        name,
        () => rules,
        () => dependencies,
      ),
    [dependencies, registerField, name, rules],
  )

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
      if (
        context.validateOn === 'change' ||
        (trigger === 'onBlur' && context.validateOn === 'blur')
      )
        context.requestValidation(
          name,
          !Object.is(context.values[name], nextValue),
        )
    },
  }
  if (trigger !== 'onBlur')
    injectedProps.onBlur = (event: unknown) => {
      if (typeof originalBlur === 'function') originalBlur(event)
      if (context.validateOn === 'blur') {
        void context.validateField(name)
        if (context.controlled) context.requestValidation(name, true)
      }
    }
  if (hasValue || valuePropName === 'value' || valuePropName === 'checked')
    injectedProps[valuePropName] =
      currentValue ?? (valuePropName === 'checked' ? false : emptyValue)

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
