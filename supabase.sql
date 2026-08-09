-- 在 Supabase SQL Editor 中执行本文件。
create extension if not exists pgcrypto;

create table if not exists public.bugs (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  description text not null check (char_length(description) between 1 and 3000),
  reporter text not null check (char_length(reporter) between 1 and 40),
  team text not null default '' check (char_length(team) <= 60),
  module text not null check (char_length(module) between 1 and 60),
  environment text not null default '' check (char_length(environment) <= 200),
  severity text not null default 'major' check (severity in ('blocker', 'critical', 'major', 'minor')),
  priority text not null default 'medium' check (priority in ('urgent', 'high', 'medium', 'low')),
  repro_steps text not null check (char_length(repro_steps) between 1 and 3000),
  expected_result text not null default '' check (char_length(expected_result) <= 1500),
  actual_result text not null default '' check (char_length(actual_result) <= 1500),
  attachment_urls text[] not null default '{}',
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  fix_plan text not null default '' check (char_length(fix_plan) <= 3000),
  assignee text not null default '' check (char_length(assignee) <= 40),
  target_date date,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.developers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  department text not null check (char_length(department) between 1 and 60),
  role text not null default '' check (char_length(role) <= 60),
  contact text not null default '' check (char_length(contact) <= 120),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, department)
);

alter table public.bugs add column if not exists assignee_department text not null default '';
alter table public.bugs add column if not exists assignee_id uuid references public.developers(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bugs_assignee_department_length'
  ) then
    alter table public.bugs
      add constraint bugs_assignee_department_length check (char_length(assignee_department) <= 60);
  end if;
end $$;

create index if not exists bugs_status_idx on public.bugs (status);
create index if not exists bugs_created_at_idx on public.bugs (created_at desc);
create index if not exists bugs_assignee_id_idx on public.bugs (assignee_id);
create index if not exists bugs_assignee_department_idx on public.bugs (assignee_department);
create index if not exists developers_department_idx on public.developers (department);

alter table public.bugs enable row level security;
alter table public.developers enable row level security;

drop policy if exists "internal read bugs" on public.bugs;
create policy "internal read bugs"
on public.bugs for select to anon
using (true);

drop policy if exists "internal create bugs" on public.bugs;
create policy "internal create bugs"
on public.bugs for insert to anon
with check (
  status = 'open'
  and fix_plan = ''
  and assignee = ''
  and resolved_at is null
  and cardinality(attachment_urls) <= 3
);

drop policy if exists "internal update bugs" on public.bugs;
create policy "internal update bugs"
on public.bugs for update to anon
using (true)
with check (
  status in ('open', 'in_progress', 'resolved')
  and char_length(fix_plan) <= 3000
  and char_length(assignee) <= 40
  and char_length(assignee_department) <= 60
);

drop policy if exists "internal read developers" on public.developers;
create policy "internal read developers"
on public.developers for select to anon
using (true);

drop policy if exists "internal create developers" on public.developers;
create policy "internal create developers"
on public.developers for insert to anon
with check (
  active = true
  and char_length(name) between 1 and 40
  and char_length(department) between 1 and 60
);

drop policy if exists "internal update developers" on public.developers;
create policy "internal update developers"
on public.developers for update to anon
using (true)
with check (
  char_length(name) between 1 and 40
  and char_length(department) between 1 and 60
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bug-attachments',
  'bug-attachments',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "internal upload bug attachments" on storage.objects;
create policy "internal upload bug attachments"
on storage.objects for insert to anon
with check (bucket_id = 'bug-attachments');

drop policy if exists "public read bug attachments" on storage.objects;
create policy "public read bug attachments"
on storage.objects for select to public
using (bucket_id = 'bug-attachments');

-- 该方案按需求采用匿名内部访问。正式上线时建议接入 Supabase Auth，
-- 将看板 update 策略限制为 authenticated 开发成员，并关闭公网访问。
