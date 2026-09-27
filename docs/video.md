# video 能力模块

从 `@/capabilities/video` 导入。模块封装浏览器原生 `<video>`，业务页面只提供媒体资源和展示标题，不直接管理媒体事件。

## API

```tsx
const source = {
  src: '/media/example.mp4',
  type: 'video/mp4',
  poster: '/media/example-poster.svg',
  subtitles: [
    {
      src: '/media/example.zh-CN.vtt',
      srcLang: 'zh-CN',
      label: '中文',
      default: true,
    },
  ],
}

<VideoPlayer source={source} title="示例视频" />
```

`VideoPlayer` 提供播放、暂停、前后跳转 10 秒、进度拖动、音量、静音、全屏、字幕和媒体错误重试。按钮和进度条保持至少 44px 的触控区域；视频元素支持 Enter 和 Space 播放/暂停，`playsInline` 避免 H5 播放时强制离开页面。

## Hook

`useVideoPlayer(options)` 返回 `videoRef`、播放器状态和控制方法：

- 状态：`idle`、`loading`、`ready`、`playing`、`paused`、`ended`、`error`
- 状态数据：`currentTime`、`duration`、`buffered`、`volume`、`muted`、`isFullscreen`、`error`
- 方法：`play`、`pause`、`togglePlay`、`seek`、`seekBy`、`setVolume`、`setMuted`、`toggleMuted`、`reload`、`toggleFullscreen`

状态只由浏览器媒体事件推进，组件卸载时会移除事件监听。播放被浏览器自动播放策略拦截时，调用方可根据 `error.message` 提示用户点击播放。

## `/__ui` 示例

开发预览包含：

- 本地 MP4 播放、海报和中文字幕
- 加载、就绪、播放、暂停、结束状态
- 不存在的媒体资源及重试错误状态
- 键盘控制、触控按钮、进度拖动和全屏入口

真实业务接入时只替换 `VideoSource`，不需要修改状态机或控制栏。
