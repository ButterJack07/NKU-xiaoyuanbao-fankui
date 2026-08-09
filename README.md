# Patchwork Bug 反馈系统

一个无需自建后端的双页面内部 Bug 工作流：

- 网站 A：`submit.html`，提交问题信息与附件。
- 网站 B：`index.html`，查看、搜索和筛选问题，填写修复计划并标记已解决。
- 数据层：浏览器通过 Supabase REST API 和 Storage API 直接通信。

## 快速启动

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

5. 使用静态服务器运行项目，不要直接双击 HTML：

```bash
python -m http.server 8080
```

浏览器访问：

- 提交端：http://localhost:8080/submit.html
- 看板端：http://localhost:8080/index.html

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

当前策略适合受控网络内的原型和小型内部团队：匿名访问者可以读、新建和更新 Bug。若网页可能暴露到公网，应接入 Supabase Auth，并将更新权限限制给 `authenticated` 开发成员；提交端可以按需保留匿名创建权限。
