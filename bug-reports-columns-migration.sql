-- 修复现有 bug_reports 表缺少流转字段的问题。
-- 只增加字段，不删除或修改现有缺陷数据。

alter table public.bug_reports
  add column if not exists transfer_from text not null default '';

alter table public.bug_reports
  add column if not exists transfer_note text not null default '';

alter table public.bug_reports
  add column if not exists follow_up_id uuid references auth.users(id);

alter table public.bug_reports
  add column if not exists assigned_at timestamptz;

notify pgrst, 'reload schema';

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'bug_reports'
  and column_name in ('transfer_from', 'transfer_note', 'follow_up_id', 'assigned_at')
order by column_name;
