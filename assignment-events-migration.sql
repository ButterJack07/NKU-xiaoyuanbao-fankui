-- 确保转组日志表可记录原部门、目标部门、操作人、时间和原因。
create table if not exists public.assignment_events (
  id uuid primary key default gen_random_uuid(),
  bug_id uuid not null references public.bug_reports(id) on delete cascade,
  from_department text not null default '',
  to_department text not null default '',
  from_user_id uuid references auth.users(id),
  to_user_id uuid references auth.users(id),
  note text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.assignment_events enable row level security;

drop policy if exists "team read assignment events" on public.assignment_events;
create policy "team read assignment events" on public.assignment_events
  for select to authenticated using (true);

drop policy if exists "team create assignment events" on public.assignment_events;
create policy "team create assignment events" on public.assignment_events
  for insert to authenticated with check (created_by = auth.uid());

notify pgrst, 'reload schema';
