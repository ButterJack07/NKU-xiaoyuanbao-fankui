# 校园宝 Bug 反馈平台

一个无需自建后端的双页面内部 Bug 工作流：

- 网站 A：`submit.html`，提交问题信息与相关图片。
- 网站 B：`index.html`，查看、搜索和筛选问题，填写修复计划并标记已解决。
- 数据层：浏览器通过 Supabase REST API 和 Storage API 直接通信。

## 在线访问

项目已通过 GitHub Pages 部署，可以直接访问：

- Bug 修复看板：https://butterjack07.github.io/NKU-xiaoyuanbao-fankui/
- Bug 提交页面：https://butterjack07.github.io/NKU-xiaoyuanbao-fankui/submit.html
- GitHub 仓库：https://github.com/ButterJack07/NKU-xiaoyuanbao-fankui

GitHub Pages 发布后可能需要几分钟完成部署。如果页面暂时显示 404，请稍后刷新，并在仓库的 **Settings → Pages** 中检查部署状态。

## 功能说明

### Bug 提交端

- 填写标题、反馈人、团队、功能模块和运行环境。
- 设置严重程度和修复优先级。
- 提供问题描述、复现步骤、预期结果和实际结果。
- 上传 PNG、JPG、GIF、WebP、BMP 或 AVIF 图片。
- 每条 Bug 最多上传 3 张图片，每张不超过 5 MB。

### Bug 修复看板

- 查看待处理、修复中和已解决问题的数量。
- 按关键词、状态和严重程度筛选 Bug。
- 查看完整问题描述、复现步骤和问题图片。
- 图片附件会在问题详情中显示缩略图，点击后可在当前页面弹窗查看大图。
- 登记开发人员姓名、部门、岗位和联系方式。
- 从已登记人员中直接选择登录，并在浏览器 `localStorage` 保存当前身份。
- 登录后在看板顶部查看直接分配给本人或所在部门的任务，点击即可进入问题详情。
- 可直接分配给整个部门，让每位部员都能看到；也可以指定具体负责人。
- 填写修复计划、负责人和计划完成日期。
- 勾选并保存已解决的 Bug。

## 使用流程

1. 测试或产品人员打开 Bug 提交页面。
2. 填写问题信息并上传相关截图或问题图片。
3. 数据通过 Supabase REST API 写入 `bugs` 表。
4. 开发人员在修复看板查看问题并填写修复计划。
5. 开始处理后，问题状态自动变为“修复中”。
6. 修复并验证完成后，勾选“标记为已解决”。

## Supabase 配置

1. 在 Supabase 创建一个项目。
2. 打开 SQL Editor，完整执行 `supabase.sql`。
3. 在 Project Settings / API 中复制 Project URL 和 anon/publishable key。
4. 修改 `js/config.js`：

```js
window.PATCHWORK_CONFIG = {
  supabaseUrl: 'https://你的项目.supabase.co',
  supabaseAnonKey: '你的 anon 或 publishable key',
  tableName: 'bugs',
  storageBucket: 'bug-attachments'
};
```

更完整的数据库创建、Storage、RLS 策略和错误排查说明请查看 [`sp.md`](sp.md)。

如果数据库是在开发人员功能上线前创建的，也需要重新执行最新版 `supabase.sql`，以创建 `developers` 表并为 `bugs` 表增加部门和人员关联字段。

> 前端只能使用 Supabase 的 anon/publishable key。不要使用数据库密码、Secret key 或 service role key。

## 本地运行

使用静态服务器运行项目，不要直接双击 HTML：

```bash
python -m http.server 8080
```

浏览器访问：

- 提交端：http://localhost:8080/submit.html
- 看板端：http://localhost:8080/index.html

## GitHub Pages 部署

本项目是纯静态网站，可以直接使用 GitHub Pages：

1. 打开 GitHub 仓库的 **Settings → Pages**。
2. 在 **Build and deployment** 中选择 **Deploy from a branch**。
3. Branch 选择 `main`，目录选择 `/ (root)`。
4. 点击 **Save**，等待 GitHub Actions 完成部署。
5. 后续推送到 `main` 分支后，GitHub Pages 会自动更新。

前端的 Supabase Project URL 和 publishable key 可以出现在 GitHub Pages 中，它们的实际访问权限由 `supabase.sql` 中的 RLS 策略控制。数据库密码和 service role key 绝对不能提交到仓库。

## 数据流

```text
submit.html
  ├── POST /storage/v1/object/bug-attachments/...  上传附件
  └── POST /rest/v1/bugs                       新建 Bug

index.html
  ├── GET /rest/v1/bugs                        获取列表
  └── PATCH /rest/v1/bugs?id=eq.{id}           保存修复计划/状态
```

公开的 anon/publishable key 仅获得 `supabase.sql` 中 RLS 策略授予的权限。不要把数据库密码、service role key 或管理员凭据写入前端。

## 安全说明

当前 GitHub Pages 地址可以被公网访问，而现有 Supabase 策略允许匿名访问者读取、新建和更新 Bug，因此当前版本适合演示、原型或地址受控的小型团队。

正式作为内部系统使用时，建议：

- 接入 Supabase Auth，要求开发人员登录后才能修改 Bug。
- 将数据库 `update` 策略限制为 `authenticated` 用户。
- 根据需要保留匿名提交，或同样要求提交人员登录。
- 将附件 Bucket 改为私有，通过 Signed URL 访问。
- 使用公司 VPN、身份访问网关或其他内网访问控制保护页面。
- 如果数据库密码曾被提交到 Git 历史，立即在 Supabase 控制台重置密码。
