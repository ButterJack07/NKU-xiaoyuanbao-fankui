# The World 数据库工作流说明

本文整理《The World》当前的数据库与数据持久化工作流，方便后续模仿、迁移或搭建类似项目。

当前项目是一个纯前端静态游戏：

- 游戏页面由 `index.html`、`css/style.css` 和 `js/*.js` 组成。
- 本地游戏进度使用浏览器 `localStorage` 保存。
- Supabase 只负责在线排行榜，不负责游戏主存档。
- 浏览器直接通过 Supabase REST API 访问数据库，不经过自建后端。
- 当前方案适合原型、个人项目和休闲排行榜，不适合需要严格防作弊的竞技游戏。

---

## 1. 整体架构

```text
浏览器
  ├── localStorage
  │     ├── 各模式游戏存档
  │     ├── 地图种子
  │     ├── 本地排行榜
  │     └── 当前页面状态
  │
  └── Supabase REST API
        └── public.scores
              ├── 上传成绩
              └── 查询在线排行榜
```

### 数据职责划分

| 数据 | 存储位置 | 用途 |
|---|---|---|
| 游戏日期、人口、建筑、物品栏 | `localStorage` | 恢复本地游戏进度 |
| 地图种子 | `localStorage` | 重新生成相同地图 |
| 地貌揭示进度 | `localStorage` | 恢复探索状态 |
| 本地历史成绩 | `localStorage` | 离线排行榜 |
| 在线成绩 | Supabase `scores` 表 | 多个玩家共享排行榜 |
| 数据库密码 | 不应放在项目中 | 仅用于数据库管理，不参与前端请求 |

当前项目没有把完整游戏状态上传到服务器。因此，玩家刷新页面时，游戏状态来自本地；打开在线排行榜时，成绩来自 Supabase。

---

## 2. Supabase 项目创建

### 2.1 创建项目

1. 打开 Supabase 控制台。
2. 创建一个新的 Project。
3. 设置项目名称、数据库密码和区域。
4. 等待项目初始化完成。

数据库密码只在管理数据库、执行迁移或使用 PostgreSQL 客户端时需要。它不是前端配置，不能写入 `js/data.js`，也不能提交到 Git。

### 2.2 获取前端配置

在 Supabase 项目的 API 设置中获取：

- Project URL，例如：`https://your-project.supabase.co`
- `anon` / `publishable` public key

前端只需要 Project URL 和公开 anon key。当前项目使用的是旧式 `anon` key 命名，Supabase 新界面也可能称为 publishable key。

---

## 3. 创建排行榜表

在 Supabase 的 **SQL Editor** 中执行以下 SQL：

```sql
create table public.scores (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  mode text not null,
  player_name text not null default '',
  save_name text,
  save_ts bigint not null default 0,
  days integer not null default 0,
  civ integer not null default 0
);
```

### 字段说明

| 字段 | 类型 | 作用 |
|---|---|---|
| `id` | `bigint` | 数据库自动生成的记录 ID |
| `created_at` | `timestamptz` | 本次成绩提交时间 |
| `mode` | `text` | 游戏模式，例如 `civilization`、`freedom` |
| `player_name` | `text` | 玩家名 |
| `save_name` | `text` | 存档备注名，可为空 |
| `save_ts` | `bigint` | 存档创建时间戳，用于识别同一个存档 |
| `days` | `integer` | 游戏经过的天数 |
| `civ` | `integer` | 提交时的文明指数 |

### 为什么同时保存 `created_at` 和 `save_ts`

- `created_at` 表示这一条成绩什么时候上传。
- `save_ts` 表示成绩属于哪个存档。

同一个存档可能在多个时间点提交成绩。前端查询后会按照 `save_ts` 去重，只保留同一存档最新提交的一条记录。

例如：

```text
存档 A 第一次提交：save_ts = 1000, created_at = 10:00
存档 A 第二次提交：save_ts = 1000, created_at = 12:00
```

排行榜最终只展示第二条成绩。

---

## 4. 开启 RLS 和配置访问策略

执行以下 SQL：

```sql
alter table public.scores enable row level security;

create policy "anon insert scores"
on public.scores
for insert
to anon
with check (
  mode in ('civilization', 'technology', 'freedom')
  and length(player_name) <= 12
  and length(coalesce(save_name, '')) <= 12
  and days >= 0
  and civ >= 0
);

create policy "anon select scores"
on public.scores
for select
to anon
using (true);
```

### 策略含义

- 开启 RLS 后，默认情况下客户端不能访问表数据。
- `anon insert scores` 允许未登录用户提交符合基本格式的成绩。
- `anon select scores` 允许未登录用户查询排行榜。
- 当前没有开放 `update` 和 `delete`，因此匿名客户端不能直接修改或删除已有记录。

如果希望完全复刻当前项目 README 中的宽松策略，也可以使用：

```sql
create policy "anon insert"
on public.scores
for insert
to anon
with check (true);

create policy "anon select"
on public.scores
for select
to anon
using (true);
```

但推荐使用前面的带基本校验版本。数据库校验不能防止作弊，却可以挡住明显的错误数据。

---

## 5. 旧版表结构升级

如果已经创建过旧版 `scores` 表，但缺少 `save_ts` 字段，执行：

```sql
alter table public.scores
add column if not exists save_ts bigint not null default 0;
```

如果旧表缺少其他字段，可以逐个补充：

```sql
alter table public.scores
add column if not exists save_name text;

alter table public.scores
add column if not exists days integer not null default 0;

alter table public.scores
add column if not exists civ integer not null default 0;
```

执行升级后，可以在 Supabase 的 **Table Editor** 中检查 `scores` 表的字段是否完整。

---

## 6. 前端配置位置

当前配置位于 `js/data.js` 文件底部：

```js
Game.SUPABASE_URL = 'https://your-project.supabase.co';
Game.SUPABASE_ANON_KEY = 'your-anon-or-publishable-key';
Game.ONLINE_TABLE = 'scores';
```

项目通过下面的函数判断在线排行榜是否启用：

```js
Game.ONLINE_ENABLED = function () {
  return Boolean(Game.SUPABASE_URL && Game.SUPABASE_ANON_KEY);
};
```

### 前端可以暴露什么

可以暴露：

- Project URL
- anon public key / publishable key

绝对不能暴露：

- 数据库密码
- service role key
- 管理员 JWT
- 云服务器 SSH 密钥
- 其他可以绕过 RLS 的凭据

anon key 本身不是管理员密码，它的权限由 Supabase 的 RLS 策略限制。service role key 会绕过 RLS，放进前端后等同于把数据库管理权限交给所有访问网页的人。

---

## 7. 成绩提交工作流

核心实现位于 `js/main.js` 的在线排行部分。

### 7.1 触发时机

当前项目在以下情况下提交成绩：

1. 文明模式达到文明指数目标并触发胜利界面。
2. 自由模式返回主菜单时。
3. 玩家名为空时，不提交在线成绩。

科技模式目前锁定，尚未有完整胜利流程。

### 7.2 提交前检查

```js
if (!Game.ONLINE_ENABLED()) return;
if (!Game.state || !Game.state.playerName) return;
```

这意味着：

- 没有配置 Supabase 时，游戏仍可以正常运行。
- 没有填写玩家名时，只保留本地成绩，不上传在线榜。
- 在线提交失败不会阻塞游戏。

### 7.3 实际提交数据

前端向以下地址发送 POST 请求：

```text
{SUPABASE_URL}/rest/v1/scores
```

请求体大致如下：

```json
{
  "mode": "civilization",
  "player_name": "玩家名",
  "save_name": "我的第一个存档",
  "save_ts": 1730000000000,
  "days": 720,
  "civ": 9999,
  "created_at": "2026-08-09T12:00:00.000Z"
}
```

请求头使用：

```http
apikey: <SUPABASE_ANON_KEY>
Authorization: Bearer <SUPABASE_ANON_KEY>
Content-Type: application/json
```

对应的 JavaScript 形式：

```js
fetch(Game.SUPABASE_URL + '/rest/v1/' + Game.ONLINE_TABLE, {
  method: 'POST',
  headers: {
    apikey: Game.SUPABASE_ANON_KEY,
    Authorization: 'Bearer ' + Game.SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
}).catch(function () {
  // 在线提交失败不影响本地游戏
});
```

---

## 8. 排行榜读取工作流

### 8.1 查询接口

前端按照游戏模式查询：

```text
GET {SUPABASE_URL}/rest/v1/scores
  ?select=player_name,save_name,save_ts,days,civ,created_at
  &mode=eq.civilization
  &order=created_at.desc
```

只选择需要展示的字段，可以减少返回数据量，也避免把不必要的字段暴露给客户端。

### 8.2 前端处理步骤

读取数据后，前端依次执行：

1. 按 `save_ts` 对成绩去重。
2. 同一个存档只保留最新提交的记录。
3. 文明模式、科技模式按 `days` 升序排序。
4. 自由模式按 `civ` 降序排序。
5. 截取前 10 名。

伪代码：

```js
const latestBySave = new Map();

rows.forEach(row => {
  const key = String(row.save_ts || 0);
  if (!latestBySave.has(key)) {
    latestBySave.set(key, row);
  }
});

const entries = Array.from(latestBySave.values());

if (mode === 'freedom') {
  entries.sort((a, b) => b.civ - a.civ);
} else {
  entries.sort((a, b) => a.days - b.days);
}

return entries.slice(0, 10);
```

由于查询已经按 `created_at desc` 排序，所以第一次遇到某个 `save_ts` 时，就是该存档最新的成绩。

---

## 9. 本地存档工作流

本地数据实现位于 `js/state.js`、`js/inventory.js` 和 `js/main.js`。

### 9.1 存档 key

| Key | 示例 | 用途 |
|---|---|---|
| `tw-seed-{mode}` | `tw-seed-civilization` | 保存对应模式的地图种子 |
| `tw-game-{mode}` | `tw-game-civilization` | 保存对应模式的游戏状态 |
| `tw-rank` | `tw-rank` | 保存本地排行榜 |
| `tw-screen` | `tw-screen` | 保存当前页面是菜单还是游戏 |
| `tw-last` | `tw-last` | 保存最近游玩的模式 |

### 9.2 游戏存档内容

每次保存会序列化以下数据：

- 存档版本号
- 地图种子
- 人口和小人位置
- 建筑位置、朝向、劳动力数量
- 文明指数
- 游戏日期
- 游戏模式
- 是否已经获胜
- 玩家名和存档名
- 存档创建时间戳
- 基地位置和大小
- 物品栏
- 合成器内容
- 特殊地貌揭示进度

示例结构：

```json
{
  "version": 2,
  "seed": 123456789,
  "villagers": 5,
  "buildings": [],
  "civ": 120,
  "day": 360,
  "mode": "civilization",
  "playerName": "玩家名",
  "saveName": "存档一",
  "createdAt": 1730000000000,
  "base": { "x": 14, "y": 9, "w": 3, "h": 3 },
  "placed": [],
  "crafting": [],
  "clumps": []
}
```

### 9.3 保存时机

游戏会在以下操作后保存：

- 游戏循环定期保存。
- 物品栏发生变化。
- 合成成功。
- 建筑放置或升级。
- 劳动力分配变化。
- 玩家名或存档名变化。
- 游戏速度切换。

浏览器刷新后，项目先根据模式读取种子，再重新生成确定性地图，最后把本地存档中的动态状态恢复上去。

---

## 10. 本地排行榜与在线排行榜的区别

### 本地排行榜

- 存在浏览器本机的 `localStorage` 中。
- 无需网络。
- 可以记录没有玩家名的成绩。
- 只对当前浏览器、当前设备有效。
- 玩家可以通过开发者工具修改。

### 在线排行榜

- 存在 Supabase 的 `public.scores` 表中。
- 多个设备和玩家可以共享。
- 需要网络连接。
- 当前使用匿名写入。
- 不能依赖客户端数据防作弊。

两种排行榜互不替代：本地榜用于离线体验，在线榜用于跨设备展示和分享。

---

## 11. 从零搭建同类数据库流程

如果要模仿本项目搭建一个新的在线排行榜，可以按下面顺序操作：

### 第一步：设计数据结构

先确定：

- 一条成绩记录代表什么。
- 是否允许同一存档重复提交。
- 排行榜按分数高低还是用时长短排序。
- 是否需要玩家名、存档名和提交时间。

### 第二步：创建 Supabase 项目

创建项目并保存：

- Project URL
- anon / publishable key
- 数据库密码，仅用于管理操作

### 第三步：执行建表 SQL

在 SQL Editor 创建表、字段、默认值和主键。

### 第四步：开启 RLS

至少创建：

- `select` 策略：允许排行榜读取。
- `insert` 策略：允许客户端提交成绩。

如使用公开匿名写入，必须在应用层和数据库层都做基本的字段校验。

### 第五步：配置前端

在配置文件中填写：

```js
Game.SUPABASE_URL = 'https://your-project.supabase.co';
Game.SUPABASE_ANON_KEY = 'your-public-key';
Game.ONLINE_TABLE = 'scores';
```

### 第六步：实现上传函数

上传函数应做到：

- 先判断配置是否存在。
- 先判断用户是否填写必要信息。
- 映射游戏状态到数据库字段。
- 使用 `fetch` 调用 REST API。
- 捕获网络错误，不阻塞游戏。

### 第七步：实现查询函数

查询函数应做到：

- 按模式过滤。
- 只请求展示所需字段。
- 按提交时间倒序读取。
- 按存档 ID 去重。
- 按当前模式规则排序。
- 限制最终展示数量。

### 第八步：做错误测试

至少测试：

- 没有配置 URL 和 key。
- 玩家名为空。
- 网络断开。
- RLS 策略未配置。
- 表名写错。
- 字段名写错。
- 数据库表为空。
- 同一个存档重复上传。

---

## 12. 常见错误排查

### 401 Unauthorized

可能原因：

- anon key 错误。
- key 前后包含多余空格。
- Project URL 和 key 不属于同一个 Supabase 项目。

检查 `js/data.js` 中的配置是否来自同一个项目。

### 403 Forbidden

可能原因：

- RLS 已开启但没有对应 policy。
- policy 只允许其他角色，没有允许 `anon`。
- 插入数据违反了 `with check` 条件。

在 Supabase 的 Authentication / Policies 页面检查 `scores` 表策略。

### 404 Not Found

可能原因：

- 表名错误。
- REST API 地址错误。
- 表没有创建在 `public` schema。

当前项目期望的请求地址是：

```text
https://your-project.supabase.co/rest/v1/scores
```

### 读取为空

可能原因：

- 数据库中还没有成绩。
- `mode` 值不匹配。
- 前端去重时多个记录使用了相同的 `save_ts`。
- 查询请求失败但页面只显示了空状态。

可以在浏览器开发者工具的 Network 面板中检查接口响应。

### 浏览器 Network 调试

打开浏览器开发者工具：

1. 进入 **Network**。
2. 打开游戏排行榜。
3. 查找 `/rest/v1/scores` 请求。
4. 检查 Request URL、Request Headers、Request Payload 和 Response。
5. 如果提交失败，查看 HTTP 状态码和 Supabase 返回的 JSON 错误信息。

---

## 13. 安全边界和后续升级

当前方案是：

```text
浏览器保存游戏状态
浏览器计算成绩
浏览器直接提交成绩
```

因此，玩家可以通过开发者工具修改：

- 文明指数。
- 游戏天数。
- 玩家名。
- 提交请求内容。

这不是 Supabase 配置错误，而是纯客户端排行榜的天然限制。

如果未来需要更可靠的排行榜，建议升级为：

1. 用户登录系统。
2. 服务端保存游戏状态。
3. 服务端根据事件重新计算成绩。
4. 通过 Supabase Edge Functions 接收提交请求。
5. 数据库只允许 Edge Function 使用 service role 写入。
6. 客户端只能查询排行榜，不能直接写入 `scores`。
7. 增加请求频率限制、签名、回放校验或服务器权威 tick。

对于当前游戏，推荐先保留纯静态方案，等核心玩法稳定后再升级后端架构。

---

## 14. 凭据管理注意事项

项目根目录中曾存在 `superbase password.txt`。数据库密码属于敏感信息：

- 不要把数据库密码写入本文档。
- 不要把数据库密码写入 `js/data.js`。
- 不要提交到 GitHub 或其他公开仓库。
- 如果该密码是真实密码并曾经暴露，建议立即在 Supabase 控制台重置。
- 后续应删除明文密码文件，并把类似文件加入 `.gitignore`。

建议的 `.gitignore` 内容：

```gitignore
*.password.txt
*password*.txt
.env
.env.*
```

注意：anon public key 可以出现在前端，但它不能替代数据库密码，也不能当作 service role key 使用。

---

## 15. 当前项目关键文件索引

| 文件 | 数据库相关职责 |
|---|---|
| `js/data.js` | Supabase URL、公开 key、表名配置 |
| `js/main.js` | 上传成绩、读取在线排行、去重、排序、展示错误状态 |
| `js/state.js` | 本地游戏存档、模式存档、种子和版本迁移 |
| `js/inventory.js` | 物品栏变化后触发保存 |
| `js/crafting.js` | 合成变化后触发保存 |
| `README.md` | 游戏功能和原有 Supabase SQL 简要说明 |
| `index.html` | 排行榜按钮和排行榜界面结构 |

推荐阅读顺序：

1. 先看本文第 1～5 节，完成 Supabase 表和策略。
2. 再看 `js/data.js`，填入前端公开配置。
3. 再看 `js/main.js` 的在线排行部分，理解 REST 请求。
4. 最后看 `js/state.js`，理解本地存档与在线排行榜的边界。
