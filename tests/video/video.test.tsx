import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  VideoPlayer,
  clampVolume,
  createInitialVideoPlayerState,
  formatTimecode,
  videoPlayerReducer,
  type VideoSource,
} from '@/capabilities/video'

const source: VideoSource = {
  src: '/mock/media/sample.mp4',
  type: 'video/mp4',
  poster: '/mock/media/poster.svg',
  subtitles: [
    {
      src: '/mock/media/sample.vtt',
      srcLang: 'zh-CN',
      label: '中文',
      default: true,
    },
  ],
}

const mediaMethods = new Map<string, PropertyDescriptor | undefined>()

beforeEach(() => {
  for (const name of ['load', 'pause', 'play', 'requestFullscreen']) {
    mediaMethods.set(
      name,
      Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, name),
    )
  }
  Object.defineProperty(HTMLMediaElement.prototype, 'load', {
    configurable: true,
    value: vi.fn(),
  })
  Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    value: vi.fn(),
  })
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: vi.fn(async () => undefined),
  })
  Object.defineProperty(HTMLMediaElement.prototype, 'requestFullscreen', {
    configurable: true,
    value: vi.fn(async () => undefined),
  })
})

afterEach(() => {
  for (const [name, descriptor] of mediaMethods) {
    if (descriptor)
      Object.defineProperty(HTMLMediaElement.prototype, name, descriptor)
    else
      delete (HTMLMediaElement.prototype as unknown as Record<string, unknown>)[
        name
      ]
  }
  vi.restoreAllMocks()
})

describe('video player state machine', () => {
  it('tracks loading, playback, progress, completion and media errors', () => {
    let state = createInitialVideoPlayerState()
    state = videoPlayerReducer(state, { type: 'load-start', source })
    expect(state.status).toBe('loading')
    state = videoPlayerReducer(state, { type: 'loaded-metadata', duration: 2 })
    expect(state.status).toBe('ready')
    state = videoPlayerReducer(state, { type: 'play' })
    state = videoPlayerReducer(state, { type: 'time-update', currentTime: 1.2 })
    expect(state).toMatchObject({ status: 'playing', currentTime: 1.2 })
    state = videoPlayerReducer(state, { type: 'ended' })
    expect(state).toMatchObject({ status: 'ended', currentTime: 2 })
    state = videoPlayerReducer(state, {
      type: 'error',
      error: { code: 4, message: '格式不支持' },
    })
    expect(state).toMatchObject({ status: 'error', error: { code: 4 } })
  })

  it('clamps volume and ignores invalid progress values', () => {
    expect(clampVolume(-1)).toBe(0)
    expect(clampVolume(2)).toBe(1)
    expect(formatTimecode(3661.9)).toBe('01:01:01')
    let state = createInitialVideoPlayerState()
    state = videoPlayerReducer(state, {
      type: 'progress',
      buffered: Number.NaN,
    })
    expect(state.buffered).toBe(0)
  })
})

describe('VideoPlayer', () => {
  it('responds to native media events and exposes accessible controls', async () => {
    const { container } = render(
      <VideoPlayer source={source} title="测试视频" />,
    )
    const video = container.querySelector('video')!
    Object.defineProperty(video, 'duration', { configurable: true, value: 2 })
    Object.defineProperty(video, 'currentTime', {
      configurable: true,
      writable: true,
      value: 0,
    })

    expect(screen.getByRole('status')).toHaveTextContent('正在加载视频')
    expect(video).toHaveAttribute('playsinline')
    expect(container.querySelector('track')).toHaveAttribute('srclang', 'zh-CN')

    fireEvent.loadedMetadata(video)
    expect(screen.getByRole('status')).toHaveTextContent('视频已就绪')
    expect(screen.getByRole('slider', { name: /视频进度/ })).toHaveAttribute(
      'max',
      '2',
    )

    fireEvent.play(video)
    expect(screen.getByRole('button', { name: '暂停视频' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '后退 10 秒' }))
    expect(video.currentTime).toBe(0)

    fireEvent.input(screen.getByRole('slider', { name: /视频进度/ }), {
      target: { value: '1.5' },
    })
    expect(video.currentTime).toBe(1.5)

    fireEvent.click(screen.getByRole('button', { name: '静音视频' }))
    expect(screen.getByRole('button', { name: '取消静音' })).toBeInTheDocument()

    fireEvent.ended(video)
    expect(screen.getByRole('status')).toHaveTextContent('播放结束')

    await act(async () => {
      fireEvent.error(video)
    })
    expect(screen.getByRole('alert')).toHaveTextContent('视频加载失败')
    fireEvent.click(screen.getByRole('button', { name: '重试播放' }))
    expect(HTMLMediaElement.prototype.load).toHaveBeenCalled()
  })

  it('supports play and fullscreen actions from touch-sized buttons', async () => {
    const { container } = render(<VideoPlayer source={source} />)
    const video = container.querySelector('video')!
    const play = screen.getByRole('button', { name: '播放视频' })
    await act(async () => {
      fireEvent.click(play)
    })
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '进入全屏' }))
    })
    expect(video.requestFullscreen).toHaveBeenCalled()
  })

  it('plays from keyboard focus on the media element', async () => {
    const { container } = render(<VideoPlayer source={source} />)
    const video = container.querySelector('video')!
    expect(video).toHaveAttribute('tabindex', '0')
    await act(async () => {
      fireEvent.keyDown(video, { key: 'Enter' })
    })
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled()
  })
})
