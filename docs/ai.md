# AI 能力模块

从 `@/capabilities/ai` 导入。模块负责异步任务的状态转换和轮询，业务页面只提供输入并展示状态。

## 任务状态

```text
queued → running → completed
                 ↘ failed → retry → queued
                 ↘ cancelled → retry → queued
```

`aiTaskReducer` 会忽略不同任务的快照和不允许的回退转换。`useAiTask(client)` 提供 `submit`、`cancel`、`retry`、`reset`，并返回 `phase`、当前 `task`、`isBusy`、`canCancel` 和 `canRetry`。传入 `storageKey` 后会保存最新任务快照，页面重新进入时恢复任务并继续轮询；存储不可用时会自动退化为内存状态。

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

`TaskProgress` 对未知进度使用原生不确定进度语义并显示“处理中”，不会把未知值误报为 0%。`/__ui` 使用 `createMockAiTaskClient` 演示成功、取消、失败、重试、未知进度和刷新恢复。输入包含“失败”会触发一次失败，重试会进入新的任务并最终完成。

## 对话组件与数据流

这层参考 Ant Design X 的 `Bubble`、`Conversations`、`Welcome`、`Prompts`、`Sender` 和 `Think` 的交互职责，但页面只依赖项目自己的 API：

| 项目组件            | 交互职责                                     |
| ------------------- | -------------------------------------------- |
| `ConversationList`  | 会话切换、新建和删除；桌面侧栏在 H5 横向滚动 |
| `MessageBubble`     | 用户/AI 消息、流式增量、失败重试和取消反馈   |
| `WelcomePanel`      | 没有消息时的欢迎态                           |
| `PromptSuggestions` | 快捷提示按钮                                 |
| `ThinkingIndicator` | AI 思考中的可访问状态                        |
| `PromptComposer`    | Enter 发送、Shift + Enter 换行、停止生成     |
| `AiChatWorkbench`   | 将上述组件组合成可运行的对话工作台           |

`AiSessionClient` 对应 X SDK 中会话管理和流式请求的职责，底层可以接入 SSE、Fetch 或 WebSocket；组件不感知传输方式。

```ts
type AiSessionClient = {
  listConversations(options): Promise<AiConversation[]>
  createConversation(input, options): Promise<AiConversation>
  deleteConversation(id, options): Promise<void>
  sendMessage(id, input, options): Promise<void>
}

type AiStreamEvent =
  | { type: 'thinking'; messageId: string }
  | { type: 'delta'; messageId: string; delta: string }
  | { type: 'complete'; messageId: string }
  | { type: 'error'; messageId: string; error: string }
  | { type: 'cancelled'; messageId: string }
```

`useAiChat(client)` 负责会话列表、当前会话、消息状态和请求取消，返回 `send`、`cancel`、`retry`、`selectConversation`、`createConversation` 与 `deleteConversation`。`createMockAiChatClient` 以确定性的增量事件演示思考、流式输出、错误、取消和一次性失败后的重试。

### 与 Ant Design X / X SDK 的边界

- 组件层借鉴 RICH 阶段：欢迎 → 提示 → 输入 → 思考 → 增量表达 → 反馈。
- 数据层借鉴 `useXChat` / `useXConversations` 的职责拆分，但使用 `AiConversation` 和 `AiStreamEvent`，避免业务代码绑定第三方类型。
- 不在本阶段引入 Markdown、代码高亮、工具调用卡片、来源引用和多模型 Provider；这些能力在消息流契约稳定后作为独立渲染器或 Provider 增加。
