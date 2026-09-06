-- 安全初始化说明：本文件不包含密码，也不会自动创建 auth.users。
-- 1. 在 Supabase Dashboard -> Authentication -> Users 中创建用户：
--    内部登录标识：251220157@team.xiaoyuanbao.internal
--    密码：请在 Supabase Dashboard 中手动设置临时初始密码；不要写入本文件。
--    该地址不是用户真实邮箱，只是 Supabase Auth 的内部登录标识。
-- 2. 复制创建出的 User UID，替换下面的 YOUR_AUTH_USER_UUID。
-- 3. 在 SQL Editor 执行下面 INSERT。

insert into public.profiles (
  id, username, full_name, employee_no, department, role, active
) values (
  'dd99ce7b-95c8-45fa-adac-3921a7ab848b'::uuid,
  '251220157',
  '251220157',
  '251220157',
  '测试',
  'admin',
  true
)
on conflict (id) do update set
  username = excluded.username,
  full_name = excluded.full_name,
  employee_no = excluded.employee_no,
  department = excluded.department,
  role = 'admin',
  active = true,
  updated_at = now();
