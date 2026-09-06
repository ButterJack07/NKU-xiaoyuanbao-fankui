-- 测试用例文件上传字段迁移
-- 在 Supabase SQL Editor 中完整执行一次。

alter table public.test_cases add column if not exists file_name text;
alter table public.test_cases add column if not exists file_url text;
alter table public.test_cases add column if not exists file_type text;
alter table public.test_cases add column if not exists note text not null default '';

-- 刷新 Supabase PostgREST 的表结构缓存
notify pgrst, 'reload schema';

-- 验证字段是否存在
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'test_cases'
  and column_name in ('file_name', 'file_url', 'file_type', 'note')
order by column_name;
