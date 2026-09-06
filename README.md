# 校缘宝内测管理网站

校缘宝是面向内测团队的缺陷、测试用例、公告和账号协作平台。项目是静态前端，使用 Supabase 提供认证、数据库、文件存储和安全管理接口。

## 在线部署

- GitHub 仓库：<https://github.com/ButterJack07/NKU-xiaoyuanbao-fankui>
- GitHub Pages：<https://butterjack07.github.io/NKU-xiaoyuanbao-fankui/>
- Cloudflare Pages：部署后使用 Cloudflare 自动生成的 `*.pages.dev` 地址。

当前站点版本标识为：

```text
先行版
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
  version: '先行版'
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
