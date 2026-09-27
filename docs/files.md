# files 能力模块

从 `@/capabilities/files` 导入。模块只负责文件交互和传输，不依赖业务实体或具体接口。

| 能力     | API                                          | 说明                                                                             |
| -------- | -------------------------------------------- | -------------------------------------------------------------------------------- |
| 文件选择 | `FilePicker`、`FileDropzone`                 | `rules`、`onFiles`、`onRejected`、`multiple`、`disabled`；选择和拖放走同一套校验 |
| 校验     | `validateFile(file, rules, signal?)`         | 支持 MIME/扩展名、文件大小、图片尺寸、音视频时长；返回结构化问题列表             |
| 预览     | `FilePreview`                                | 图片和视频使用临时对象 URL；切换或卸载时释放资源，其他文件展示基本信息           |
| 上传     | `useFileUpload(transport)`、`UploadProgress` | 状态为 idle / uploading / completed / cancelled / error；支持进度、取消、重试    |
| 传输     | `createXhrUploader(url, options?)`           | XHR 提供上传进度及 AbortSignal 取消；调用方提供真实上传地址和必要请求头          |

`rules` 可设置 `accept`、`maxBytes`、`maxImageWidth`、`maxImageHeight`、`maxMediaDurationSeconds`。客户端校验只用于及时反馈，服务端仍须校验文件内容和权限。

`/__ui` 的文件演示使用本地模拟上传，以便稳定检查进度和取消；真实接口接入时将 `createXhrUploader` 作为 `useFileUpload` 的传输函数。组件和校验逻辑不需要随接口替换。
