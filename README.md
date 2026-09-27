# React PC / H5 前端脚手架

同一套 React Web 代码支持 PC 浏览器和手机 H5。当前阶段已准备工程、设计变量、JSON Mock 和开发预览入口，通用组件按 [组件实现约定](docs/component-conventions.md) 逐步加入。

## 环境

- Node.js 20.19+
- pnpm 10.32+

## 启动

```bash
pnpm install
pnpm dev:mock
```

打开终端输出的地址。开发环境中的 `/__ui` 用于查看组件状态、文件能力、AI 任务、设计变量和 JSON Mock；生产构建不会注册这个路由。组件 API 见 [docs/shared-ui.md](docs/shared-ui.md)，文件模块约定见 [docs/files.md](docs/files.md)，AI 模块约定见 [docs/ai.md](docs/ai.md)。

首次运行端到端测试前安装固定版本浏览器：

```bash
pnpm exec playwright install chromium
```

连接真实后端时，将 `.env.example` 复制为 `.env.development.local`，调整 `API_PROXY_TARGET`，然后运行 `pnpm dev`。浏览器通过 `/api` 请求接口，Vite 在开发环境中代理到后端。

## 常用命令

| 命令             | 用途                                        |
| ---------------- | ------------------------------------------- |
| `pnpm dev`       | 使用真实接口启动开发服务                    |
| `pnpm dev:mock`  | 使用 `src/mocks/data/*.json` 启动 Mock 模式 |
| `pnpm lint`      | 检查代码规范                                |
| `pnpm typecheck` | 检查 TypeScript 类型                        |
| `pnpm test`      | 运行单元与组件测试                          |
| `pnpm test:e2e`  | 在桌面和手机视口运行浏览器冒烟测试          |
| `pnpm build`     | 生成生产构建                                |

Mock 模式通过 MSW 拦截 `/api/*` 请求。修改 JSON 文件后刷新页面即可查看更新；未配置的接口会明确报错。音视频 Mock 数据的地址位于 `src/mocks/data/media.json`，样例媒体文件放在 `public/mock/media`。

架构与组件范围见 [完整方案](docs/react-pc-h5-scaffold-plan.md)。
