# 完整 Mock 示例流程

开发环境的 `/__ui` 在 Mock 模式下展示一条独立流程：

```text
选择文件 → 本地模拟上传 → 提交 AI 任务 → 轮询状态 → 预览视频或音频
                                           ↘ 失败 / 取消 → 重试
```

流程页面只组合 `capabilities/files`、`capabilities/ai`、`capabilities/video` 和 `capabilities/audio`，不把业务步骤写回这些模块。文件校验、上传、任务状态和媒体播放各自维持独立 API。媒体元数据从 `/api/dev/media` 的 JSON Mock 加载，视频和音频文件来自 `public/mock/media`。

输入包含“失败”会使 Mock 任务失败一次，重试后完成；运行中的任务可取消并重试。上传可取消和重试。选择新文件或重新上传会重置当前任务。该流程用于验证模块协作，接入真实业务前仍需替换上传传输和 AI 客户端。
