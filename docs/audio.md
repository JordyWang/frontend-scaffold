# audio 能力模块

从 `@/capabilities/audio` 导入。模块封装浏览器原生 `<audio>`，业务页面只提供媒体地址和标题。

```tsx
<AudioPlayer
  source={{ src: '/media/example.wav', type: 'audio/wav' }}
  title="示例音频"
/>
```

`AudioPlayer` 提供播放、暂停、前后跳转 10 秒、进度拖动、音量、静音和媒体错误重试。按钮和进度条适合 H5 触控；音频元素支持 Enter 和 Space 播放/暂停。

`useAudioPlayer(options)` 返回 `audioRef`、`status`、`currentTime`、`duration`、`volume`、`muted`、`error`，以及 `play`、`pause`、`togglePlay`、`seek`、`seekBy`、`setVolume`、`setMuted`、`toggleMuted` 和 `reload`。状态由浏览器媒体事件推进，组件卸载时移除监听。

状态为 `idle`、`loading`、`ready`、`playing`、`paused`、`ended`、`error`。加载失败或格式不支持时会显示可重试提示。`/__ui` 包含本地 WAV、错误资源和触控操作示例。
