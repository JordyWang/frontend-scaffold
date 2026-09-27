import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AudioPlayer,
  audioPlayerReducer,
  clampAudioVolume,
  createInitialAudioPlayerState,
  formatAudioTimecode,
} from '@/capabilities/audio'

const source = { src: '/mock/media/sample.wav', type: 'audio/wav' }
const originals = new Map<string, PropertyDescriptor | undefined>()

beforeEach(() => {
  for (const name of ['load', 'pause', 'play']) {
    originals.set(
      name,
      Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, name),
    )
    Object.defineProperty(HTMLMediaElement.prototype, name, {
      configurable: true,
      value: name === 'play' ? vi.fn(async () => undefined) : vi.fn(),
    })
  }
})

afterEach(() => {
  for (const [name, descriptor] of originals) {
    if (descriptor)
      Object.defineProperty(HTMLMediaElement.prototype, name, descriptor)
    else
      delete (HTMLMediaElement.prototype as unknown as Record<string, unknown>)[
        name
      ]
  }
  vi.restoreAllMocks()
})

describe('audio player state machine', () => {
  it('tracks loading, playback, completion and failure', () => {
    let state = createInitialAudioPlayerState()
    state = audioPlayerReducer(state, { type: 'load-start', source })
    expect(state.status).toBe('loading')
    state = audioPlayerReducer(state, { type: 'loaded-metadata', duration: 4 })
    state = audioPlayerReducer(state, { type: 'play' })
    state = audioPlayerReducer(state, { type: 'time-update', currentTime: 2 })
    expect(state).toMatchObject({ status: 'playing', currentTime: 2 })
    state = audioPlayerReducer(state, { type: 'ended' })
    expect(state).toMatchObject({ status: 'ended', currentTime: 4 })
    state = audioPlayerReducer(state, {
      type: 'error',
      error: { code: 4, message: '格式不支持' },
    })
    expect(state).toMatchObject({ status: 'error', error: { code: 4 } })
    expect(clampAudioVolume(2)).toBe(1)
    expect(formatAudioTimecode(61.9)).toBe('01:01')
  })
})

describe('AudioPlayer', () => {
  it('responds to media events, seeking, mute, keyboard and retry', async () => {
    const { container } = render(
      <AudioPlayer source={source} title="测试音频" />,
    )
    const audio = container.querySelector('audio')!
    Object.defineProperty(audio, 'duration', { configurable: true, value: 4 })
    Object.defineProperty(audio, 'currentTime', {
      configurable: true,
      writable: true,
      value: 0,
    })
    expect(screen.getByRole('status')).toHaveTextContent('正在加载音频')
    fireEvent.loadedMetadata(audio)
    expect(screen.getByRole('status')).toHaveTextContent('音频已就绪')
    await act(async () => fireEvent.keyDown(audio, { key: 'Enter' }))
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled()
    fireEvent.play(audio)
    expect(screen.getByRole('button', { name: '暂停音频' })).toBeInTheDocument()
    fireEvent.change(screen.getByRole('slider', { name: /音频进度/ }), {
      target: { value: '2' },
    })
    expect(audio.currentTime).toBe(2)
    fireEvent.click(screen.getByRole('button', { name: '静音音频' }))
    expect(screen.getByRole('button', { name: '取消静音' })).toBeInTheDocument()
    fireEvent.ended(audio)
    expect(screen.getByRole('status')).toHaveTextContent('播放结束')
    fireEvent.error(audio)
    expect(screen.getByRole('alert')).toHaveTextContent('音频加载失败')
    fireEvent.click(screen.getByRole('button', { name: '重试播放' }))
    expect(HTMLMediaElement.prototype.load).toHaveBeenCalled()
  })
})
