# ai 能力模块

从 `@/capabilities/ai` 导入。模块负责异步任务的状态转换和轮询，业务页面只提供输入并展示状态。

## 任务状态

```text
queued → running → completed
                 ↘ failed → retry → queued
                 ↘ cancelled → retry → queued
```

`aiTaskReducer` 会忽略不同任务的快照和不允许的回退转换。`useAiTask(client)` 提供 `submit`、`cancel`、`retry`、`reset`，并返回 `phase`、当前 `task`、`isBusy`、`canCancel` 和 `canRetry`。

## 客户端接口

业务 API 通过 `AiTaskClient` 注入：

```ts
type AiTaskClient = {
  submit(input, options): Promise<AiTaskSnapshot>
  get(taskId, options): Promise<AiTaskSnapshot>
  cancel(taskId, options): Promise<AiTaskSnapshot>
  retry(task, options): Promise<AiTaskSnapshot>
}
```

轮询间隔由 `pollIntervalMs` 控制。每个请求都带 `AbortSignal`，组件卸载、重新提交或取消任务时会停止旧请求。

## 展示组件

- `PromptInput`：任务输入和提交按钮。
- `TaskStatus`：排队、运行、完成、失败和取消状态。
- `TaskProgress`：运行中的进度。
- `TaskActions`：取消和重试动作。

`/__ui` 使用 `createMockAiTaskClient` 演示成功、取消、失败和重试。输入包含“失败”会触发一次失败，重试会进入新的任务并最终完成。
