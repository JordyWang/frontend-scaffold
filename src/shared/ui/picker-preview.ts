import { useCallback, useState } from 'react'

/** A visual preview is scoped to the current selection session, never a draft. */
export function usePickerPreview(
  scope: string,
  enabled: boolean,
  available: (value: string) => boolean,
) {
  const [state, setState] = useState<{ scope: string; value?: string }>({
    scope,
  })
  const allowed = state.value ? available(state.value) : false
  if (state.scope !== scope || (state.value && (!enabled || !allowed)))
    setState({ scope })
  const onPreview = useCallback(
    (value?: string) =>
      setState((previous) =>
        previous.scope === scope && previous.value === value
          ? previous
          : { scope, value },
      ),
    [scope],
  )
  return {
    preview:
      enabled && state.scope === scope && state.value && allowed
        ? state.value
        : undefined,
    onPreview,
  }
}
