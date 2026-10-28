# 校缘宝内测管理网站

校缘宝是面向内测团队的缺陷、测试用例、公告和账号协作平台。项目是静态前端，使用 Supabase 提供认证、数据库、文件存储和安全管理接口。

## 在线部署

- GitHub 仓库：<https://github.com/ButterJack07/NKU-xiaoyuanbao-fankui>
- GitHub Pages：<https://butterjack07.github.io/NKU-xiaoyuanbao-fankui/>
- Cloudflare Pages：部署后使用 Cloudflare 自动生成的 `*.pages.dev` 地址。

当前站点版本标识为：

```text
1.5.2
```

## 核心功能

- 账号/姓名 + 密码登录，账号由管理员创建，姓名登录要求姓名唯一。
- 部门工作台：测试、技术—前端、技术—后端、设计、产品。
- 超级管理员用户管理、普通用户创建、批量 XLSX 导入、编辑和密码重置。
- 测试组首页、测试用例上传、编号、搜索、排序、批量 ZIP 下载。
- 软件缺陷报告提交、部门分发、部门列表、详情页、负责人、状态、转组和流转日志。
- 缺陷附件下载，文件名按 `BUG-0001-01.ext` 规则生成。
- 公告消息：系统公告和管理员公告，支持按部门范围查看与管理员/组长发布。
- 个人信息、联系方式、按日联系时间、账户管理和密码修改。
- Cloudflare Worker 定时访问 Supabase 健康检查接口。

## 页面入口

```text
login.html                  登录
index.html                  测试组首页
test-cases.html             测试用例列表
upload-test-case.html       上传测试用例
bug-reports.html            测试组软件缺陷列表
department-bugs.html        部门缺陷列表
submit-bug.html             新建缺陷报告
bug-detail.html             缺陷详情
announcements.html          公告消息
announcement-detail.html    公告详情
user-management.html        超级管理员用户管理
```

## 部门和角色

部门：

```text
管理
测试
技术—前端
技术—后端
设计
产品
```

角色：

```text
member   普通成员
leader   部门组长
admin    超级管理员
```

普通成员只能访问自己的部门工作台。测试组成员进入测试组首页；其他部门成员直接进入本部门缺陷列表。超级管理员可以访问用户管理和全部业务内容。

## Supabase 初始化

1. 在 Supabase 创建项目。
2. 在 SQL Editor 执行最新版 `supabase.sql`。
3. 创建 Storage buckets：
   - `bug-attachments`
   - `test-case-files`
4. 在 `js/config.js` 配置 Project URL 和公开 Publishable/anon key：

```js
window.PATCHWORK_CONFIG = {
  supabaseUrl: 'https://你的项目.supabase.co',
  supabaseAnonKey: '你的公开 publishable key',
  tableName: 'bug_reports',
  storageBucket: 'bug-attachments',
  testCaseStorageBucket: 'test-case-files',
  authEmailDomain: 'team.xiaoyuanbao.internal',
  version: '1.5.2'
};
```

前端只能使用公开 key，不能写入数据库密码、Secret key 或 `service_role key`。

### 初始化超级管理员

使用 `admin-bootstrap.sql` 模板：

1. 在 Supabase Authentication 中创建 Auth 用户。
2. 内部邮箱格式为：

```text
账号@team.xiaoyuanbao.internal
```

3. 复制 User UID。
4. 将模板中的占位符替换后，在 SQL Editor 执行。
5. 超级管理员部门固定为 `管理`，角色为 `admin`。

### Edge Functions

项目使用以下 Supabase Edge Functions：

```text
admin-create-user          超管创建普通用户
admin-reset-password       超管将密码重置为工号
resolve-login-identity     姓名登录解析账号
```

它们的代码位于：

```text
supabase/functions/
```

部署时不要把 `SUPABASE_SERVICE_ROLE_KEY` 放入前端；它只能作为 Edge Function 的服务端密钥。

## Cloudflare Worker 保活

Worker 位于：

```text
keepalive-worker/
```

作用是每 24 小时只读访问 Supabase `healthcheck` 表。当前 Cloudflare Cron 应设置为：

```text
0 0 * * *
```

需要配置两个 Worker 变量：

```text
SUPABASE_URL
SUPABASE_ANON_KEY
```

不要配置或提交 `SUPABASE_SERVICE_ROLE_KEY`。先在 Supabase 执行 `supabase.sql` 中的 healthcheck 建表部分，再部署 Worker。

## 本地运行

### 产品副负责人（1.5.2）

在已有审核流程、部门进度和产品需求权限迁移（含 `supabase-pending-assignee.sql`）之后，在 Supabase SQL Editor 执行 `supabase-product-deputy.sql`。

- 超级管理员在“用户管理 → 编辑用户”中指定产品副负责人，与产品负责人在同处设置；副负责人须属于产品部门，不能同时担任产品负责人。
- 产品副负责人可进入产品工作台、提交缺陷报告和产品修改需求。
- 副负责人提交缺陷默认通过第一审核，等待第二审核，通过后才进入部门处理。
- 副负责人提交修改需求须由产品负责人在需求详情中通过或驳回；通过后直接分发，驳回后提交人可修改并重新提交。
- 产品负责人发布修改需求继续免审直接分发；副负责人不获得产品负责人的跨部门处理权限。
- 推送静态页面不会自动执行数据库迁移，须单独执行上述 SQL 后刷新页面。

### 多部门独立处理与数据看板

在审核流程迁移完成后执行 `supabase-department-progress.sql`，启用每个处理部门独立的状态、跟进人和备注。迁移会将旧报告状态初始化到原处理部门，重复执行不会覆盖已有部门状态。

- “更新处理部门”支持多选，原部门默认勾选；保留部门继续保留进度，新增部门从待处理开始。
- 部门列表和导出显示本部门状态；所有已分配部门都完成时报告才算完成，部分完成也计为处理中。
- 全部登录成员可从“公告信息”下方进入 `data-dashboard.html`，查看报告状态圆环和四部门处理总表；未分发报告单独统计。
- 数据库更新通过行锁 RPC 执行，避免并发时覆盖其他部门的处理信息。
- 产品负责人可在产品修改需求详情页选择处理部门，更新备注、跟进人、状态和处理部门。启用该权限前执行 `supabase-product-request-actions.sql`。
- 缺陷报告和产品修改需求都支持“待定”跟进人。被分发部门成员可将本部门跟进人设为待定；具体成员仍由本部门组长、产品负责人或超级管理员指定。已有数据库执行 `supabase-pending-assignee.sql` 启用该权限。

不要直接双击 HTML 文件。使用 HTTP 静态服务器：

```bash
python -m http.server 8080
```

访问：

```text
http://localhost:8080/login.html
```

直接使用 `file:///` 会导致 Supabase Auth、CDN、Storage 和跨域请求异常。

## GitHub Pages / Cloudflare Pages

这是纯静态项目，不需要构建工具：

```text
Framework preset: None
Build command: exit 0
Build output directory: .
```

`index.html` 位于仓库根目录时，Root directory 使用 `/`。GitHub 推送后，Pages 会自动重新部署。

Cloudflare Pages 和 Supabase Edge Functions 是独立部署的：更新前端只需推送 GitHub；更新 Edge Function 必须单独重新部署对应函数。

## 安全说明

- 不要提交密码、数据库密码、Supabase Secret key 或 service role key。
- Publishable/anon key 可以出现在静态前端，但权限由 RLS 控制。
- Auth 用户密码不能从 Supabase 读取，只能重置。
- 普通用户创建和密码重置必须通过 Edge Function。
- 修改数据库结构后，及时在 Supabase SQL Editor 执行对应迁移并刷新 schema cache。
