# Supabase 配置指南

本文说明如何为校园宝 Bug 反馈平台配置 Supabase 数据库和附件存储。

配置完成后：

- `submit.html` 可以提交 Bug 信息并上传附件。
- `index.html` 可以读取 Bug 列表、填写修复计划、指定负责人并标记问题为已解决。
- 浏览器通过 Supabase REST API 和 Storage API 直接访问数据，不需要自建后端。

> Supabase 常被误写为 Superbase。本文使用其官方名称 Supabase。

---

## 1. 创建 Supabase 项目

1. 打开 [Supabase](https://supabase.com/) 并登录。
2. 点击 **New project** 创建项目。
3. 选择所属 Organization。
4. 填写项目名称，例如 `patchwork-bugs`。
5. 设置一个安全的数据库密码。
6. 选择距离团队较近的 Region。
7. 点击 **Create new project**，等待项目初始化完成。

数据库密码只用于管理 PostgreSQL 数据库，不参与本项目前端请求。不要将数据库密码写入 HTML、JavaScript、Markdown 或提交到 Git。

---

## 2. 创建数据表和附件存储桶

项目已经提供完整初始化脚本：

```text
supabase.sql
```

执行步骤：

1. 进入 Supabase 项目控制台。
2. 在左侧菜单打开 **SQL Editor**。
3. 点击 **New query**。
4. 打开本地 `supabase.sql`，复制其中的全部 SQL。
5. 粘贴到 SQL Editor。
6. 点击 **Run** 执行。

该脚本会自动完成：

- 创建 `public.bugs` 表。
- 创建独立的 `public.developers` 开发人员目录表。
- 为 Bug 增加负责部门和开发人员关联字段。
- 创建状态和创建时间索引。
- 开启 Row Level Security（RLS）。
- 创建 Bug 查询、提交和更新策略。
- 创建公开附件桶 `bug-attachments`。
- 限制附件最大为 20 MB。
- 创建附件上传和读取策略。

脚本使用了 `if not exists` 和 `drop policy if exists`，因此在调整策略后可以重新执行。

---

## 3. 检查 bugs 数据表

执行 SQL 后，在 Supabase 左侧打开 **Table Editor**，检查是否存在 `bugs` 表。

主要字段如下：

| 字段 | 类型 | 用途 |
|---|---|---|
| `id` | `uuid` | Bug 唯一编号，数据库自动生成 |
| `title` | `text` | 问题标题 |
| `description` | `text` | 问题描述 |
| `reporter` | `text` | 反馈人 |
| `team` | `text` | 反馈人所属团队 |
| `module` | `text` | 出现问题的功能模块 |
| `environment` | `text` | 系统、浏览器、版本或服务器环境 |
| `severity` | `text` | 严重程度 |
| `priority` | `text` | 修复优先级 |
| `repro_steps` | `text` | 复现步骤 |
| `expected_result` | `text` | 预期结果 |
| `actual_result` | `text` | 实际结果 |
| `attachment_urls` | `text[]` | 附件公开地址数组 |
| `status` | `text` | `open`、`in_progress` 或 `resolved` |
| `fix_plan` | `text` | 开发人员填写的修复计划 |
| `assignee` | `text` | 修复负责人 |
| `target_date` | `date` | 计划完成日期 |
| `resolved_at` | `timestamptz` | 实际解决时间 |
| `created_at` | `timestamptz` | 创建时间 |
| `updated_at` | `timestamptz` | 最后更新时间 |

字段枚举值：

```text
severity: blocker / critical / major / minor
priority: urgent / high / medium / low
status: open / in_progress / resolved
```

### developers 开发人员表

| 字段 | 类型 | 用途 |
|---|---|---|
| `id` | `uuid` | 开发人员唯一编号 |
| `name` | `text` | 姓名 |
| `department` | `text` | 所属或负责部门 |
| `role` | `text` | 岗位和职责 |
| `contact` | `text` | 邮箱、企业微信或其他联系方式 |
| `active` | `boolean` | 是否仍在分配列表中 |

看板登记开发人员后，会将信息写入该表。分配任务时可以先选择部门，再选择该部门中的具体开发人员；只选择部门时，任务会直接分配给整个部门，该部门每位已登记成员登录后都能看到。

开发人员登录不需要新增数据库账号。看板会从 `developers` 表读取已登记人员，用户选择自己的身份后，将人员 ID、姓名和部门保存在当前浏览器的 `localStorage` 中：

```text
xiaoyuanbao-current-developer
```

刷新页面后，网站会使用该 ID 匹配最新的开发人员记录，并在看板顶部显示直接分配给该人员或其所在部门、且尚未解决的任务。指定了具体人员的任务只展示给该人员；仅指定部门的任务会展示给部门内每一位成员。这个功能用于个人任务视图，不属于安全身份认证；如需权限隔离，仍应接入 Supabase Auth。

---

## 4. 检查附件 Storage

在 Supabase 左侧打开 **Storage**，确认存在：

```text
bug-attachments
```

当前配置：

- Bucket 为公开读取。
- 匿名用户可以上传附件。
- 单个文件最大 20 MB。
- 支持 PNG、JPEG、GIF、WebP、TXT、LOG 和 PDF 等文件。
- 网站 A 最多允许每条 Bug 选择 3 个附件。

如果 Storage 中没有该 Bucket，通常表示 `supabase.sql` 没有完整执行。重新执行脚本并检查 SQL Editor 返回的错误。

---

## 5. 获取 Project URL 和公开 Key

前端需要两个公开配置：

- Project URL
- anon key 或 publishable key

不同版本的 Supabase 控制台入口可能略有差异，通常可以在以下位置找到：

```text
Project Settings → API
```

或：

```text
Project Settings → Data API
Project Settings → API Keys
```

Project URL 类似：

```text
https://abcdefghijk.supabase.co
```

公开 Key 可能标记为：

```text
anon public
```

或：

```text
Publishable key
```

前端允许使用这些公开凭据，因为实际权限受 RLS 策略控制。

绝对不要使用：

- 数据库密码
- `service_role` key
- Secret key
- 管理员 JWT
- 任何可以绕过 RLS 的凭据

`service_role` key 会绕过 RLS。将其写入前端等同于向所有网页访问者开放数据库管理权限。

---

## 6. 配置前端连接

打开：

```text
js/config.js
```

默认内容为：

```js
window.PATCHWORK_CONFIG = {
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseAnonKey: 'your-anon-or-publishable-key',
  tableName: 'bugs',
  storageBucket: 'bug-attachments'
};
```

替换 URL 和公开 Key：

```js
window.PATCHWORK_CONFIG = {
  supabaseUrl: 'https://abcdefghijk.supabase.co',
  supabaseAnonKey: '你的-anon-或-publishable-key',
  tableName: 'bugs',
  storageBucket: 'bug-attachments'
};
```

注意：

- URL 不要填写控制台页面地址。
- URL 和 Key 必须来自同一个 Supabase 项目。
- 不要在值的前后保留空格。
- `tableName` 必须与数据库表名 `bugs` 一致。
- `storageBucket` 必须与 Storage Bucket 名称 `bug-attachments` 一致。

---

## 7. 启动网站

不要直接双击 HTML 文件。建议在项目目录运行静态服务器：

```bash
python -m http.server 8080
```

然后访问：

```text
提交端：http://localhost:8080/submit.html
修复看板：http://localhost:8080/index.html
```

如果端口 `8080` 已被占用，可以换成其他端口：

```bash
python -m http.server 8090
```

---

## 8. 验证数据库连接

### 8.1 验证 Bug 提交

1. 打开 `submit.html`。
2. 填写所有必填项。
3. 可选择一个小于 20 MB 的图片或文本附件。
4. 点击“提交 Bug 反馈”。
5. 页面应显示提交成功和 Bug 编号。
6. 返回 Supabase **Table Editor**。
7. 打开 `bugs` 表，确认出现新记录。

### 8.2 验证看板读取

1. 打开 `index.html`。
2. 页面应展示刚才提交的 Bug。
3. 检查标题、模块、严重程度和状态是否正确。
4. 点击 Bug 行打开详情抽屉。

### 8.3 验证修复计划更新

1. 在 Bug 详情中填写修复计划。
2. 填写负责人和计划完成日期。
3. 点击“保存修复计划”。
4. Bug 状态应自动变成“修复中”。
5. 勾选“标记为已解决”并再次保存。
6. Bug 状态应变成“已解决”。
7. 在 Table Editor 中检查 `status`、`fix_plan`、`assignee` 和 `resolved_at`。

### 8.4 验证附件

1. 在 Supabase 左侧打开 **Storage**。
2. 进入 `bug-attachments`。
3. 检查按日期生成的目录。
4. 在网站 B 的 Bug 详情中点击附件链接。
5. 浏览器应能正常打开或下载附件。

---

## 9. 数据库通信方式

### 新建 Bug

```http
POST {SUPABASE_URL}/rest/v1/bugs
```

### 获取 Bug 列表

```http
GET {SUPABASE_URL}/rest/v1/bugs?select=...&order=created_at.desc
```

### 更新修复计划和状态

```http
PATCH {SUPABASE_URL}/rest/v1/bugs?id=eq.{BUG_ID}
```

### 上传附件

```http
POST {SUPABASE_URL}/storage/v1/object/bug-attachments/{FILE_PATH}
```

REST 请求使用以下请求头：

```http
apikey: <SUPABASE_ANON_KEY>
Authorization: Bearer <SUPABASE_ANON_KEY>
Content-Type: application/json
```

附件上传的 `Content-Type` 根据文件类型设置。

---

## 10. RLS 策略说明

`supabase.sql` 为 `bugs` 表开启了 Row Level Security。

当前策略允许 `anon` 角色：

- `select`：读取 Bug 列表和详情。
- `insert`：提交初始状态为 `open` 的 Bug。
- `update`：填写修复计划、负责人、日期和修改状态。

创建 Bug 时，数据库会要求：

- 初始状态必须为 `open`。
- 初始修复计划必须为空。
- 初始负责人必须为空。
- 初始解决时间必须为空。
- 附件地址不能超过 3 个。

这可以阻止提交端直接创建伪造的“已解决”记录，但当前仍属于匿名内部访问方案。

---

## 11. 常见问题排查

### 页面提示数据库尚未连接

检查 `js/config.js` 是否仍然包含：

```text
your-project
your-anon-or-publishable-key
```

如果仍是占位内容，网站不会发送数据库请求。

### 401 Unauthorized

可能原因：

- anon/publishable key 填写错误。
- Key 前后包含空格。
- Project URL 与 Key 不属于同一个项目。
- 错误地填写了数据库密码。

重新从 Supabase API 设置复制 URL 和公开 Key。

### 403 Forbidden

可能原因：

- RLS 已开启，但策略没有成功创建。
- 提交数据不符合 `with check` 条件。
- Storage 没有匿名上传策略。
- 使用的数据库角色与策略不匹配。

重新执行 `supabase.sql`，并在 Supabase 的 Policies 页面检查策略。

### 404 Not Found

可能原因：

- `tableName` 不是 `bugs`。
- `storageBucket` 不是 `bug-attachments`。
- Project URL 填写错误。
- 数据表不在 `public` schema 中。

### 看板没有数据显示

检查：

- `bugs` 表中是否确实存在记录。
- 浏览器开发者工具 Network 中 `/rest/v1/bugs` 的响应状态。
- `bugs` 表是否存在 `select` RLS 策略。
- 浏览器控制台是否有跨域、网络或 JavaScript 错误。

### 附件上传失败

检查：

- Storage 中是否存在 `bug-attachments`。
- 文件是否超过 20 MB。
- 文件类型是否被允许。
- `storage.objects` 是否存在上传策略。
- Bucket 是否配置为 Public。

`.log` 文件在部分浏览器中可能被识别为 `application/octet-stream`，初始化 SQL 已允许该类型。

### 修改修复计划失败

检查：

- `bugs` 表是否存在 `update` 策略。
- 修复计划是否超过 3000 个字符。
- 负责人是否超过 40 个字符。
- Network 中 PATCH 请求的响应内容。

---

## 12. 浏览器调试方法

1. 按 `F12` 打开开发者工具。
2. 打开 **Network** 面板。
3. 提交 Bug 或保存修复计划。
4. 查找 `/rest/v1/bugs` 或 `/storage/v1/object/` 请求。
5. 检查：
   - Request URL
   - Request Method
   - Status Code
   - Request Headers
   - Request Payload
   - Response

常见成功状态：

| 操作 | 常见状态码 |
|---|---|
| 查询 Bug | `200` |
| 新建 Bug | `201` |
| 更新 Bug | `200` |
| 上传附件 | `200` |

---

## 13. 内部系统安全建议

当前实现按照“开发组内部原型”设计，匿名访问者可以读取、新建和更新 Bug。如果网站地址可能被公网访问，仅依赖 anon key 并不能识别团队成员。

正式使用建议：

1. 开启 Supabase Auth。
2. 要求开发人员登录后才能打开网站 B。
3. 将 `update` 策略从 `anon` 改为 `authenticated`。
4. 根据产品需要决定网站 A 是否允许匿名提交。
5. 将项目部署在公司 VPN、内网或访问控制网关后。
6. 为 Storage 附件配置私有 Bucket 和带时效的 Signed URL。
7. 对敏感附件进行病毒扫描和内容审查。
8. 增加操作日志，记录状态和修复计划由谁修改。

不要依赖“前端没有显示按钮”来控制权限。真正的权限必须通过 Supabase RLS、身份认证或服务端接口实现。

---

## 14. 配置检查清单

上线前逐项检查：

- [ ] Supabase 项目创建完成。
- [ ] `supabase.sql` 执行成功。
- [ ] `public.bugs` 表存在。
- [ ] `bugs` 表已开启 RLS。
- [ ] `select`、`insert`、`update` 策略存在。
- [ ] `bug-attachments` Storage Bucket 存在。
- [ ] Bucket 上传和读取策略存在。
- [ ] `js/config.js` 已填写正确的 Project URL。
- [ ] `js/config.js` 已填写 anon/publishable key。
- [ ] 前端没有填写数据库密码或 service role key。
- [ ] 网站 A 可以提交 Bug。
- [ ] 网站 A 可以上传附件。
- [ ] 网站 B 可以读取 Bug。
- [ ] 网站 B 可以保存修复计划。
- [ ] 网站 B 可以标记 Bug 为已解决。

完成以上步骤后，校园宝 Bug 反馈平台即可通过 Supabase 在两个页面之间同步 Bug 数据。
