const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly code: 'http' | 'timeout' = 'http',
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type RequestOptions = {
  signal?: AbortSignal
  timeoutMs?: number
}

export async function apiGet<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const endpoint = path.startsWith('/') ? path : `/${path}`
  const controller = new AbortController()
  const onAbort = () => controller.abort(options.signal?.reason)
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 15_000,
  )

  if (options.signal?.aborted) {
    onAbort()
  } else {
    options.signal?.addEventListener('abort', onAbort, { once: true })
  }

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      throw new ApiError(`请求失败（${response.status}）`, response.status)
    }

    return (await response.json()) as T
  } catch (error) {
    if (controller.signal.aborted && !options.signal?.aborted) {
      throw new ApiError('请求超时', null, 'timeout')
    }
    throw error
  } finally {
    clearTimeout(timeout)
    options.signal?.removeEventListener('abort', onAbort)
  }
}
