# React PC / H5 前端脚手架方案

## 1. 目标与范围

本方案面向同一个 React Web 应用，同时支持 PC 浏览器和手机 H5。两种屏幕尺寸共用一套业务代码，通过响应式布局和少量场景化组件调整展示方式。项目以交互型应用为前提，首版采用客户端渲染。

首版脚手架需要让开发者完成依赖安装后即可启动、开发、检查、构建和部署，并提供一条可以在 PC 与手机上走通的示例流程。

## 2. 技术选型

| 领域         | 选择                                  | 用途                                       |
| ------------ | ------------------------------------- | ------------------------------------------ |
| 基础框架     | React + TypeScript 严格模式           | 页面与业务开发、静态类型检查               |
| 构建与包管理 | Vite + pnpm                           | 本地开发、生产构建与锁定依赖               |
| 路由         | React Router                          | 页面导航和路由级按需加载                   |
| 服务端数据   | TanStack Query                        | 请求缓存、加载状态和数据刷新               |
| 本地 Mock    | MSW + JSON 数据文件                   | 无后端时拦截接口请求并返回文件中的数据     |
| 样式         | Tailwind CSS + CSS 变量               | 响应式布局与统一设计变量                   |
| 基础 UI      | shadcn/ui                             | 将基础组件代码保存在项目内，便于维护和调整 |
| 表单         | React Hook Form + Zod                 | 表单状态与可复用的数据校验                 |
| 质量检查     | ESLint + Prettier + TypeScript        | 代码风格、常见问题和类型检查               |
| 测试         | Vitest + Testing Library + Playwright | 关键逻辑、组件交互和跨尺寸流程             |

普通组件状态使用 React 自带能力；服务端数据交给 TanStack Query。只有出现明确的跨页面客户端状态需求时，才引入专门的全局状态库。

## 3. 目录结构

```text
src/
  app/
    providers/          # Query、主题等全局配置
    router/             # 路由定义与页面懒加载
    App.tsx
    main.tsx
  pages/                # 页面入口，负责组合业务功能
  features/             # 按业务功能组织组件、逻辑和接口调用
  capabilities/
    ai/                 # 通用 AI 任务状态、请求与交互组件
    video/              # 视频播放、预览与时间控制
    audio/              # 音频播放与时间控制
    files/              # 文件选择、校验与上传
  mocks/
    browser.ts          # Mock Service Worker 启动入口
    handlers.ts         # 接口路径与 JSON 数据的映射
    data/
      items.json        # 示例列表与详情共用的数据
  shared/
    api/                # 请求封装、错误类型、接口适配
    ui/                 # 项目持有的基础 UI 组件
    styles/             # 全局样式与设计变量
    lib/                # 不依赖业务的通用工具
    types/              # 跨功能使用的类型
public/
  mockServiceWorker.js  # MSW 在本地开发时使用的 Worker 文件
tests/
  e2e/                  # 浏览器端关键流程
```

依赖方向为 `pages → features → capabilities → shared`；页面和功能也可以直接使用 `shared`。`ai`、`video` 与 `audio` 保持独立，都可以依赖 `files`，但不相互引用。业务功能之间避免互相引用；通用能力成熟后再下沉到 `shared`，避免提前建立大量抽象。

## 4. PC 与 H5 适配

采用移动端优先布局，默认从 360px 宽度设计，再扩展到平板和桌面。断点初步设在 768px 和 1200px；实际组件优先根据内容宽度决定布局，不把设备型号写进业务逻辑。

- 页面容器使用弹性宽度和合理的最大宽度，避免固定 375px 设计稿比例缩放。
- 导航、列表、表格等根据空间改变呈现方式。例如桌面表格在手机上可改为卡片列表，而不只是缩小字体。
- 可触控控件保证足够的点击区域；表单检查软键盘、输入类型和自动填充。
- 使用安全区域变量处理刘海屏底部操作栏，使用动态视口高度处理移动浏览器地址栏。
- 弹窗和抽屉检查滚动锁定、焦点管理及返回操作；动画遵循系统减少动态效果设置。
- 图片按显示尺寸加载，并对非首屏资源按需加载。

首版至少检查 360px、390px、768px 和 1280px 宽度，并在 iOS Safari、Android Chrome 上走通关键流程。若产品运行在微信内置浏览器，也将其纳入验收设备。

## 5. UI 组件与替换成本

业务页面只从 `shared/ui` 引用基础组件。第三方 UI 依赖集中在这一层；颜色、字号、间距、圆角等设计变量由项目管理，业务代码不直接依赖组件库主题值。

组件分类参考 [Ant Design 组件总览](https://ant.design/components/overview/)，但按本项目的 PC + H5 场景确定范围。这里的“实现”指在 `shared/ui` 中建立项目自己的组件入口、样式和使用约定，可以使用 shadcn/ui 或底层无障碍组件作为实现基础，并非从零重写所有交互。

### 5.1 组件清单

P0 是第一版脚手架必须提供的基础组件；P1 在出现对应业务页面时加入，不作为第一版的空组件占位。

| 分类     | P0：第一版实现                                                    | P1：按业务接入                                                                                                       |
| -------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 通用     | Button、Icon、Typography                                          | FloatButton                                                                                                          |
| 布局     | Container、Stack/Flex、Grid、Divider                              | Space、Affix                                                                                                         |
| 导航     | Tabs、Pagination                                                  | Breadcrumb、Dropdown、Menu、Steps、Anchor                                                                            |
| 数据录入 | FormField、Input、Textarea、Checkbox、Radio、Switch、Select       | Form、InputNumber、DatePicker、TimePicker、ColorPicker、Upload、AutoComplete、Slider、Cascader、TreeSelect、Transfer |
| 数据展示 | Card、List、Table（基础表格）、Tag、Badge、Image、Empty、Skeleton | Avatar、Descriptions、Collapse、Tooltip、Popover、Carousel、Tree、Timeline、Statistic                                |
| 反馈     | Alert、Dialog/Modal、Drawer/Sheet、Toast/Message、Spinner/Spin    | Popconfirm、Notification、Progress、Result                                                                           |

`FormField` 负责标签、说明和错误信息的展示；数据校验仍由 Zod 定义。`Table` 的 P0 范围是表头、行、空状态和基础加载状态。排序、筛选、固定列、虚拟滚动等能力应由实际业务需求决定，避免预先做成难以维护的通用表格。

在 P0 稳定后，首批 P1 通用能力已按同一套项目 API 接入：`Space`、`Breadcrumb`、`Steps`、`Progress`、`Result`、`Collapse`、`Avatar`、`Descriptions`、`Statistic`、`Timeline`、`Dropdown`、`Tooltip`、`Popover`、`Popconfirm`、`Notification`、`Form`、`InputNumber`、`Slider`、`DatePicker`、`TimePicker`、`ColorPicker`、`AutoComplete`、`Cascader`、`TreeSelect`、`Transfer`、`Upload`、`Segmented`、`Rate`、`Menu`、`Anchor`、`Affix`、`Carousel` 和 `Tree`。这些组件先覆盖语义、状态和响应式布局，复杂的数据编辑和远程上传策略仍按真实页面需求加入。

### 5.2 H5 组件适配要求

- Button、Checkbox、Radio、Switch 等触控组件提供足够的点击区域，并明确按下、禁用和加载状态。
- Tabs 在窄屏可横向滚动；Pagination 可根据页面需求切换为“加载更多”。
- Table 在手机上为关键数据提供卡片或列表呈现方式；列取舍由页面决定，不由组件擅自隐藏数据。
- Select、Dialog、Drawer 在小屏考虑底部弹层或全屏形式，并处理软键盘、安全区域和背景滚动。
- Tooltip、Popover 不能成为手机上获取必要信息的唯一方式；必要说明应直接显示或通过点击打开。
- 所有交互组件支持键盘操作、可见焦点和合适的语义标签，并检查 iOS Safari 与 Android Chrome 的实际行为。

表单校验使用 Zod，避免写入 UI 组件；复杂列表的数据转换与筛选也与展示组件分开。组件替换仍会涉及样式和交互调整，尤其是日期选择器、复杂表格等控件，但业务逻辑不应随之重写。新增第三方组件时先评估可访问性、移动端交互和项目维护情况。

### 5.3 AI 与媒体场景的通用能力

AI 请求通常具有排队、运行、完成或失败等异步状态；视频和音频组件则要处理播放时间、媒体加载和浏览器兼容性。它们的依赖和状态模型不同，因此分别放在 `capabilities/ai`、`capabilities/video` 和 `capabilities/audio`。文件选择与上传由 `capabilities/files` 提供，供这些模块复用。这些模块只承载通用技术能力，不包含具体内容生产流程或业务实体。

| 模块    | P0：首版提供                                                                                                       | P1：明确需要时再加入                                                      |
| ------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `ai`    | PromptInput、TaskStatus、TaskProgress、TaskActions（取消/重试）；统一的异步任务状态和轮询接口                      | ModelSelect、ParameterPanel、ResultCompare、流式输出及 SSE/WebSocket 适配 |
| `video` | VideoPlayer、VideoControls、VideoPoster、Timecode、CaptionTrack；播放、暂停、跳转、音量、全屏及媒体错误状态        | ThumbnailStrip、TrimRange、TimelineRuler、HLS 播放适配                    |
| `audio` | AudioPlayer、AudioControls；播放、暂停、跳转、音量及媒体错误状态                                                   | Waveform、AudioTrim、音轨可视化                                           |
| `files` | FilePicker/Dropzone、FilePreview（静态缩略图与基本信息）、UploadProgress；文件类型、大小、尺寸和时长校验，上传取消 | 分片及断点续传、批量上传、校验和                                          |

P0 的播放器优先封装浏览器原生 `<video>` 和 `<audio>`，保持媒体接口可替换；只有格式或播放要求明确需要时才引入额外播放器依赖。首版不建立完整的媒体编辑器。媒体组件按路由或使用位置加载，避免把播放器代码加入所有页面的初始包。

H5 验收还需覆盖 `playsInline`、用户手势触发播放、触控拖动进度、视频全屏切换、弱网加载及格式不支持时的提示。AI 任务组件需正确呈现未知进度、页面重新进入后的状态恢复，以及取消和重试后的状态变化。

## 6. 请求、环境与错误处理

`shared/api` 提供统一请求入口，支持基础地址、超时或取消、类型化响应，以及可供页面使用的统一错误类型。接口数据由 TanStack Query 管理；页面明确展示加载、空数据、失败和重试状态。

使用 `.env.example` 说明公开的环境变量。浏览器端变量不存放密钥；具体登录态处理方式与后端鉴权方案保持一致。

### 6.1 Mock 启动模式

提供 `pnpm dev:mock`，对应脚本为 `vite --mode mock`。应用入口通过 `import.meta.env.MODE === 'mock'` 判断是否先启动 MSW，再渲染 React 页面；普通 `pnpm dev` 连接配置的真实接口。两种模式共用 `shared/api` 和页面代码，业务组件不根据模式选择不同的数据来源。

Mock 数据存放在 `src/mocks/data/*.json`。`handlers.ts` 导入 JSON 文件，并按照真实接口的路径、方法、状态码和响应结构返回数据。例如 `items.json` 作为列表与详情接口的共同数据源，详情接口按 `id` 从中查找，避免两份样例数据互相矛盾。空列表等场景可以使用独立 JSON 文件；错误场景由 handler 返回约定的错误状态和 JSON 响应。

AI 任务状态及音视频元数据也使用 JSON 文件作为 Mock 数据源；音视频文件本身以本地静态媒体文件提供，JSON 中保存其访问地址。这样可在无后端时检查任务状态、播放器及 H5 兼容行为。

Mock 仅拦截项目约定的 `/api/*` 请求。Mock 模式下，如果页面请求了尚未配置的接口，应明确报错，防止意外访问真实后端。正常生产构建不启动 Mock Worker。修改 JSON 数据后，刷新页面即可验证新的展示结果。

## 7. 开发命令与交付检查

计划提供以下命令：

```text
pnpm dev          # 启动本地开发服务，连接真实接口
pnpm dev:mock     # 启动 Mock 模式，从 JSON 文件加载接口数据
pnpm build        # 生产构建
pnpm preview      # 预览生产构建结果
pnpm lint         # ESLint 检查
pnpm typecheck    # TypeScript 检查
pnpm test         # 单元及组件测试
pnpm test:e2e     # 浏览器关键流程测试
```

CI 执行类型检查、Lint、必要测试和生产构建。部署静态文件时需要配置路由回退到 `index.html`，以支持直接打开非首页路由。

## 8. 第一版实施顺序

1. 建立 Vite + React + TypeScript 项目、目录结构、代码规范和开发命令。
2. 建立设计变量与第 5 节的 P0 基础 UI 组件，完成 PC/H5 页面框架。
3. 建立 `ai`、`video`、`audio`、`files` 的 P0 通用能力，并按使用位置加载媒体代码。
4. 建立路由、请求层、错误状态、环境配置及 JSON 驱动的 Mock 模式。
5. 使用同一套 API 调用实现“列表 → 详情”的示例流程，分别验证 PC/H5 和真实接口/Mock 模式。
6. 增加必要测试、CI 和 README 使用说明。

## 9. 验收标准

- 新成员按 README 执行 `pnpm install` 和 `pnpm dev` 后能启动项目。
- PC 与手机浏览器能够完成同一条示例流程，且无意外横向滚动。
- 页面具备加载、空数据、失败及重试状态。
- `pnpm dev:mock` 无需后端即可从 JSON 文件展示列表和详情；修改 JSON 后页面能显示更新数据。
- Mock 模式下未配置的 `/api/*` 请求明确报错；`pnpm dev` 仍可连接真实接口，生产构建不启动 Mock。
- 第 5 节的 P0 组件通过项目自身入口引用，并在 PC/H5 尺寸下完成交互检查；业务逻辑与 UI 库保持分离。
- AI 任务状态组件与音视频播放器可使用通用 Mock 数据独立演示；`ai`、`video` 和 `audio` 不相互依赖。
- 音视频在目标手机浏览器上能播放、暂停、跳转并正确报告加载或格式错误。
- `lint`、`typecheck`、`test` 和 `build` 均通过。
- 关键流程在规定的屏幕宽度和目标手机浏览器上通过检查。

## 10. 后续架构判断

如果未来出现以搜索引擎收录为核心的公开内容页面，需要重新评估渲染方案。当前 React + Vite 方案针对 PC 与 H5 的交互型应用，不预先引入服务端渲染复杂度。
