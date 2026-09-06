-- 公告持久化表：系统自动公告和管理员公告共用。
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('system', 'manual')),
  audience text not null default 'all' check (audience in ('all', '测试', '技术—前端', '技术—后端', '设计', '产品')),
  badge text not null default '公告',
  title text not null check (char_length(title) between 1 and 160),
  content text not null check (char_length(content) between 1 and 10000),
  author_id uuid references auth.users(id),
  author_name text not null default '',
  bug_id uuid references public.bug_reports(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

create or replace function public.can_publish_announcements()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and active = true
      and role in ('leader', 'admin')
  );
$$;

drop policy if exists "team read announcements" on public.announcements;
create policy "team read announcements"
on public.announcements for select to authenticated
using (
  audience = 'all'
  or public.is_admin()
  or public.current_department() = '测试'
  or public.current_department() = audience
);

drop policy if exists "leaders create announcements" on public.announcements;
create policy "leaders create announcements"
on public.announcements for insert to authenticated
with check (
  public.can_publish_announcements()
  and author_id = auth.uid()
  and type = 'manual'
);

drop policy if exists "admins manage announcements" on public.announcements;
create policy "admins manage announcements"
on public.announcements for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create index if not exists announcements_created_at_idx on public.announcements (created_at desc);
create index if not exists announcements_audience_idx on public.announcements (audience, type);

notify pgrst, 'reload schema';
