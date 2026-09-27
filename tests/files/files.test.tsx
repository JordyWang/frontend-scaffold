import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  FileDropzone,
  FilePicker,
  FilePreview,
  createXhrUploader,
  useFileUpload,
  validateFile,
  type UploadTransport,
} from '@/capabilities/files'

const originalCreateObjectURL = Object.getOwnPropertyDescriptor(
  URL,
  'createObjectURL',
)
const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(
  URL,
  'revokeObjectURL',
)

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  for (const [name, descriptor] of [
    ['createObjectURL', originalCreateObjectURL],
    ['revokeObjectURL', originalRevokeObjectURL],
  ] as const) {
    if (descriptor) Object.defineProperty(URL, name, descriptor)
    else delete (URL as unknown as Record<string, unknown>)[name]
  }
})

describe('file validation and selection', () => {
  it('rejects unsupported types and oversized files', async () => {
    const file = new File(['12345'], 'note.txt', { type: 'text/plain' })
    const result = await validateFile(file, {
      accept: ['image/*'],
      maxBytes: 3,
    })
    expect(result.valid).toBe(false)
    expect(result.issues.map((issue) => issue.code)).toEqual(['type', 'size'])
  })

  it('accepts extensions when MIME information is missing', async () => {
    const file = new File(['data'], 'photo.PNG')
    expect((await validateFile(file, { accept: ['.png'] })).valid).toBe(true)
  })

  it('reads image dimensions and releases the object URL', async () => {
    const revoke = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:test'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revoke,
    })
    class FakeImage {
      naturalWidth = 2000
      naturalHeight = 1000
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_value: string) {
        queueMicrotask(() => this.onload?.())
      }
    }
    vi.stubGlobal('Image', FakeImage)
    const file = new File(['image'], 'large.png', { type: 'image/png' })
    const result = await validateFile(file, { maxImageWidth: 1200 })
    expect(result.issues[0]?.code).toBe('dimensions')
    expect(result.metadata?.width).toBe(2000)
    expect(revoke).toHaveBeenCalledWith('blob:test')
  })

  it('rejects a media file that exceeds the duration limit', async () => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:video'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })
    const create = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation(((
      tagName: string,
    ) => {
      const element = create(tagName)
      if (tagName === 'video') {
        Object.defineProperty(element, 'duration', {
          configurable: true,
          value: 150,
        })
        queueMicrotask(() => element.dispatchEvent(new Event('loadedmetadata')))
      }
      return element
    }) as typeof document.createElement)
    const file = new File(['video'], 'clip.mp4', { type: 'video/mp4' })
    const result = await validateFile(file, { maxMediaDurationSeconds: 120 })
    expect(result.issues[0]?.code).toBe('duration')
    expect(result.metadata?.durationSeconds).toBe(150)
  })

  it('reports rejected files and accepts valid files through the picker', async () => {
    const onFiles = vi.fn()
    const onRejected = vi.fn()
    const { container } = render(
      <FilePicker
        rules={{ accept: ['image/*'] }}
        onFiles={onFiles}
        onRejected={onRejected}
      />,
    )
    const input = container.querySelector('input[type=file]')!
    fireEvent.change(input, {
      target: { files: [new File(['x'], 'bad.txt', { type: 'text/plain' })] },
    })
    await waitFor(() => expect(onRejected).toHaveBeenCalledOnce())
    fireEvent.change(input, {
      target: { files: [new File(['x'], 'good.png', { type: 'image/png' })] },
    })
    await waitFor(() => expect(onFiles).toHaveBeenCalledOnce())
    expect(onFiles.mock.calls[0][0][0].name).toBe('good.png')
  })

  it('uses the same validation when a file is dropped', async () => {
    const onFiles = vi.fn()
    const onRejected = vi.fn()
    render(
      <FileDropzone
        rules={{ accept: ['image/*'] }}
        onFiles={onFiles}
        onRejected={onRejected}
      />,
    )
    const zone = screen.getByText('或将文件拖放到这里').parentElement!
    fireEvent.drop(zone, {
      dataTransfer: {
        files: [new File(['x'], 'bad.txt', { type: 'text/plain' })],
      },
    })
    await waitFor(() => expect(onRejected).toHaveBeenCalledOnce())
    expect(onFiles).not.toHaveBeenCalled()
  })

  it('releases a preview URL when removed', () => {
    const revoke = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:preview'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revoke,
    })
    const file = new File(['x'], 'photo.png', { type: 'image/png' })
    const { unmount } = render(<FilePreview file={file} />)
    expect(
      screen.getByRole('img', { name: '文件预览：photo.png' }),
    ).toHaveAttribute('src', 'blob:preview')
    unmount()
    expect(revoke).toHaveBeenCalledWith('blob:preview')
  })
})

describe('upload cancellation', () => {
  it('keeps a cancelled upload from becoming complete', async () => {
    let reportProgress: ((value: number) => void) | undefined
    const transport: UploadTransport = (_file, { signal, onProgress }) =>
      new Promise((_resolve, reject) => {
        reportProgress = onProgress
        signal.addEventListener('abort', () =>
          reject(new DOMException('cancelled', 'AbortError')),
        )
      })
    const { result } = renderHook(() => useFileUpload(transport))
    const file = new File(['data'], 'test.png', { type: 'image/png' })
    await act(async () => {
      void result.current.start(file)
    })
    act(() => reportProgress?.(45))
    expect(result.current.progress).toBe(45)
    act(() => result.current.cancel())
    await waitFor(() => expect(result.current.status).toBe('cancelled'))
    expect(result.current.progress).toBe(45)
  })

  it('aborts the XHR transport when its signal is cancelled', async () => {
    const abort = vi.fn()
    class FakeXhr {
      upload = { onprogress: null }
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      onabort: (() => void) | null = null
      open() {}
      setRequestHeader() {}
      send() {}
      set withCredentials(_value: boolean) {}
      abort() {
        abort()
        this.onabort?.()
      }
    }
    vi.stubGlobal('XMLHttpRequest', FakeXhr)
    const controller = new AbortController()
    const promise = createXhrUploader('/upload')(new File(['x'], 'a.txt'), {
      signal: controller.signal,
      onProgress: vi.fn(),
    })
    controller.abort()
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
    expect(abort).toHaveBeenCalledOnce()
  })
})
