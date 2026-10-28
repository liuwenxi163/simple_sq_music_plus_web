# SQ Music Listening Room（维护分支）

基于 [SQMusic](https://github.com/59799517/simple_sq_music_plus) 与其 Web 客户端维护，面向自托管 NAS 的播放、音乐下载、歌单同步与曲库整理。

本分支新增：桌面与手机浏览器听歌界面、持续播放队列、收藏、同步歌词、浏览器媒体按键、本地音乐索引与支持 Range 的音频读取；修复 QQ 授权连接偶发失败时后台线程中断。

- 前端：[simple_sq_music_plus_web](https://github.com/liuwenxi163/simple_sq_music_plus_web)
- 服务端：[simple_sq_music_plus](https://github.com/liuwenxi163/simple_sq_music_plus)
- 手机端目前为响应式 Web/PWA，不是原生手机应用。后台播放与媒体按键取决于浏览器和系统限制；PWA 安装通常需要 HTTPS。
- 在线音源仍受平台账号权限、链接有效期、跨域及浏览器编解码支持影响。APE/WMA 不直接在浏览器播放。
- LyricFlow 独立服务基于 [laoning666/lyricFlow](https://github.com/laoning666/lyricFlow)，固定提交 ef2aef4a615f03e66d9942b6f6ec2d061405befa，遵循 **CC BY-NC 4.0，仅限非商业使用**。发布包保留原始许可；不能将整套集成声称为可任意商用。

## 持久化与配置

保留现有 MySQL 数据目录与音乐目录。后端 `SQ_DATA_DIR` 挂载独立可写目录，保存收藏与听歌状态；`JWT_SECRET` 至少 32 字节，存入私有环境文件。LyricFlow 挂载同一音乐目录到 `/music`，独立 `/state` 保存任务，后端与 worker 使用相同 `LYRICFLOW_KEY`（至少 32 字符），通过内部 `LYRICFLOW_URL` 通信，不公开 worker 端口。

默认只补全缺少的 .lrc 和 cover.jpg，不覆盖既有侧车文件；勾选写入文件时只补齐缺失标签。整理任务串行执行，等待加运行合计最多 256 个；重启后未完成任务标为已中断，可在界面重试。曲库扫描同时最多 1 次，最多索引 100,000 首，未请求的重复扫描合并。

## 下载音质

在「下载」页顶部设置「新任务音质」，默认「最高可用音质」，从歌曲返回的可用版本中选择最高档，通常优先 FLAC 无损。设置保存到服务器，适用于后续下载；已完成的 MP3 需要重新添加下载才能获得另一份无损文件。实际可用版本取决于平台、歌曲和账号权限，不保证所有歌曲都有 Hi-Res。任务列表显示所选音质。

在线播放优先选用浏览器兼容的 MP3，与 NAS 下载音质分开，播放参数不会覆盖下载设置。

## 发布

本分支的 Actions 替代上游镜像仓库密钥。推送维护分支会打包、验证并创建以提交 SHA 命名的不可变 Release 包。镜像基于固定摘要的上游运行时，在 NAS 离线构建增量层（后端使用缓存的固定 JDK 与依赖编译，并执行 QQ 故障测试）；音乐、数据库和状态均位于外部挂载目录。

可选自动部署：配置仓库变量 `NAS_GITOPS_REPO` 与仅能写该配置仓库的部署密钥 `NAS_GITOPS_KEY`。Actions 将 Release URL、SHA256 与镜像标签写入已有 sqmusic Stack；NAS 拉取控制器校验摘要、预构建全部镜像，再替换服务并健康检查。初始化时必须先配置服务、挂载与私有环境文件。构建或检查失败不发布成功状态；健康失败恢复上一份 Compose。

## 原项目文档

以下保留上游说明和署名，部分原始发布地址仅适用于上游版本。

---

# Vue 3 + Vite


 [simple_sq_music_plus](https://github.com/59799517/simple_sq_music_plus)的前端页面

### 使用方法：
1. npm install
2. npm run dev

### 打包
npm run build

### docker 打包
docker build -t simple_sq_music_plus_web .

### 修改后端接口地址：
src/utils/api.js 文件修改即可
