import {
  useEffect,
  useRef,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react'

/** Restore an uncontrolled field's initial value when its native form resets. */
export function useNativeFormReset<
  T extends HTMLInputElement | HTMLTextAreaElement,
>(
  fieldRef: RefObject<T | null>,
  controlled: boolean,
  initialValue: string,
  setValue: Dispatch<SetStateAction<string>>,
) {
  const initialValueRef = useRef(initialValue)

  useEffect(() => {
    if (controlled) return
    const form = fieldRef.current?.form
    if (!form) return
    const restore = () => setValue(initialValueRef.current)
    form.addEventListener('reset', restore)
    return () => form.removeEventListener('reset', restore)
  }, [controlled, fieldRef, setValue])
}
