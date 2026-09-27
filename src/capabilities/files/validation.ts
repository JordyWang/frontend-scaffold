export type FileValidationRules = {
  accept?: readonly string[]
  maxBytes?: number
  maxImageWidth?: number
  maxImageHeight?: number
  maxMediaDurationSeconds?: number
}

export type FileIssueCode =
  'type' | 'size' | 'dimensions' | 'duration' | 'metadata'
export type FileIssue = { code: FileIssueCode; message: string }
export type FileValidationResult = {
  file: File
  valid: boolean
  issues: FileIssue[]
  metadata?: { width?: number; height?: number; durationSeconds?: number }
}

function matchesAccept(file: File, patterns: readonly string[]) {
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  return patterns.some((raw) => {
    const pattern = raw.trim().toLowerCase()
    if (!pattern) return false
    if (pattern.startsWith('.')) return name.endsWith(pattern)
    if (pattern.endsWith('/*')) return type.startsWith(pattern.slice(0, -1))
    return type === pattern
  })
}

function metadataFromElement(
  file: File,
  kind: 'image' | 'audio' | 'video',
  signal?: AbortSignal,
): Promise<{ width?: number; height?: number; durationSeconds?: number }> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException('已取消', 'AbortError'))
      return
    }
    const url = URL.createObjectURL(file)
    const element =
      kind === 'image' ? new Image() : document.createElement(kind)
    const timeout = window.setTimeout(
      () => finish(new Error('读取文件信息超时')),
      10_000,
    )
    let settled = false
    const onAbort = () =>
      finish(signal?.reason ?? new DOMException('已取消', 'AbortError'))
    const finish = (
      error?: unknown,
      metadata?: { width?: number; height?: number; durationSeconds?: number },
    ) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      signal?.removeEventListener('abort', onAbort)
      URL.revokeObjectURL(url)
      if (error) reject(error)
      else resolve(metadata ?? {})
    }
    signal?.addEventListener('abort', onAbort, { once: true })
    element.onerror = () => finish(new Error('无法读取文件信息'))
    if (kind === 'image') {
      const image = element as HTMLImageElement
      image.onload = () =>
        finish(undefined, {
          width: image.naturalWidth,
          height: image.naturalHeight,
        })
      image.src = url
    } else {
      const media = element as HTMLMediaElement
      media.onloadedmetadata = () =>
        finish(undefined, {
          width:
            kind === 'video'
              ? (media as HTMLVideoElement).videoWidth
              : undefined,
          height:
            kind === 'video'
              ? (media as HTMLVideoElement).videoHeight
              : undefined,
          durationSeconds: media.duration,
        })
      media.preload = 'metadata'
      media.src = url
    }
  })
}

export async function validateFile(
  file: File,
  rules: FileValidationRules = {},
  signal?: AbortSignal,
): Promise<FileValidationResult> {
  const issues: FileIssue[] = []
  if (rules.accept?.length && !matchesAccept(file, rules.accept))
    issues.push({ code: 'type', message: '文件类型不受支持' })
  if (rules.maxBytes !== undefined && file.size > rules.maxBytes)
    issues.push({
      code: 'size',
      message: `文件不能超过 ${formatBytes(rules.maxBytes)}`,
    })
  const imageFile =
    file.type.startsWith('image/') ||
    /\.(png|jpe?g|gif|webp|bmp|avif|heic|heif)$/i.test(file.name)
  const videoFile =
    file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v)$/i.test(file.name)
  const audioFile =
    file.type.startsWith('audio/') ||
    /\.(mp3|m4a|wav|ogg|aac|flac)$/i.test(file.name)
  const needsImage =
    imageFile &&
    (rules.maxImageWidth !== undefined || rules.maxImageHeight !== undefined)
  const needsDuration =
    (audioFile || videoFile) && rules.maxMediaDurationSeconds !== undefined
  let metadata: FileValidationResult['metadata']
  if (issues.length === 0 && (needsImage || needsDuration)) {
    try {
      metadata = await metadataFromElement(
        file,
        needsImage ? 'image' : videoFile ? 'video' : 'audio',
        signal,
      )
      if (needsImage && (!metadata.width || !metadata.height)) {
        issues.push({ code: 'metadata', message: '无法读取图片尺寸' })
      } else if (
        needsImage &&
        ((rules.maxImageWidth !== undefined &&
          metadata.width! > rules.maxImageWidth) ||
          (rules.maxImageHeight !== undefined &&
            metadata.height! > rules.maxImageHeight))
      ) {
        issues.push({ code: 'dimensions', message: '图片尺寸超出限制' })
      }
      if (
        needsDuration &&
        (!Number.isFinite(metadata.durationSeconds) ||
          (metadata.durationSeconds ?? 0) > rules.maxMediaDurationSeconds!)
      ) {
        issues.push({ code: 'duration', message: '媒体时长超出限制' })
      }
    } catch (error) {
      if (signal?.aborted) throw error
      issues.push({ code: 'metadata', message: '无法读取文件信息' })
    }
  }
  return { file, valid: issues.length === 0, issues, metadata }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
