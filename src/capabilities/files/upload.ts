import { useCallback, useEffect, useRef, useState } from 'react'

export type UploadStatus =
  'idle' | 'uploading' | 'completed' | 'cancelled' | 'error'
export type UploadState = {
  status: UploadStatus
  progress: number
  error?: string
}
export type UploadTransport = (
  file: File,
  context: { signal: AbortSignal; onProgress: (progress: number) => void },
) => Promise<void>

const initialState: UploadState = { status: 'idle', progress: 0 }

export function useFileUpload(transport: UploadTransport) {
  const [state, setState] = useState<UploadState>(initialState)
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  const cancel = useCallback(() => {
    if (!controllerRef.current) return
    controllerRef.current.abort()
    controllerRef.current = null
    setState((current) => ({ ...current, status: 'cancelled' }))
  }, [])

  const reset = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    setState(initialState)
  }, [])

  const start = useCallback(
    async (file: File) => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      setState({ status: 'uploading', progress: 0 })
      try {
        await transport(file, {
          signal: controller.signal,
          onProgress: (value) => {
            if (
              controllerRef.current !== controller ||
              controller.signal.aborted
            )
              return
            setState({
              status: 'uploading',
              progress: Math.max(0, Math.min(100, Math.round(value))),
            })
          },
        })
        if (controllerRef.current === controller && !controller.signal.aborted)
          setState({ status: 'completed', progress: 100 })
      } catch (error) {
        if (controllerRef.current === controller && !controller.signal.aborted)
          setState({
            status: 'error',
            progress: 0,
            error: error instanceof Error ? error.message : '上传失败',
          })
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null
      }
    },
    [transport],
  )

  return { ...state, start, cancel, reset }
}

export type XhrUploadOptions = {
  fieldName?: string
  method?: 'POST' | 'PUT'
  headers?: Record<string, string>
  withCredentials?: boolean
}

export function createXhrUploader(
  url: string,
  options: XhrUploadOptions = {},
): UploadTransport {
  return (file, { signal, onProgress }) =>
    new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException('已取消', 'AbortError'))
        return
      }
      const xhr = new XMLHttpRequest()
      const onAbort = () => xhr.abort()
      const cleanup = () => signal.removeEventListener('abort', onAbort)
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable)
          onProgress((event.loaded / event.total) * 100)
      }
      xhr.onload = () => {
        cleanup()
        if (xhr.status >= 200 && xhr.status < 300) resolve()
        else reject(new Error(`上传失败（${xhr.status}）`))
      }
      xhr.onerror = () => {
        cleanup()
        reject(new Error('网络错误，上传失败'))
      }
      xhr.onabort = () => {
        cleanup()
        reject(new DOMException('已取消', 'AbortError'))
      }
      xhr.open(options.method ?? 'POST', url)
      xhr.withCredentials = options.withCredentials ?? false
      Object.entries(options.headers ?? {}).forEach(([key, value]) =>
        xhr.setRequestHeader(key, value),
      )
      signal.addEventListener('abort', onAbort, { once: true })
      const body = new FormData()
      body.append(options.fieldName ?? 'file', file)
      try {
        xhr.send(body)
      } catch (error) {
        cleanup()
        reject(error)
      }
    })
}
