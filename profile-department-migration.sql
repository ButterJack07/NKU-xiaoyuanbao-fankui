-- 将 profiles.department 的合法值扩展为“管理”，供超级管理员使用。
-- 先删除旧约束，再创建新约束；不会修改现有用户数据。

alter table public.profiles drop constraint if exists profiles_department_check;
alter table public.profiles add constraint profiles_department_check
  check (department in ('管理', '测试', '技术—前端', '技术—后端', '设计', '产品'));

notify pgrst, 'reload schema';
