-- 在已执行 supabase-review.sql 的线上数据库中执行。本迁移不删除报告/审核历史。
begin;

alter table public.bug_reports add column if not exists department_progress jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists is_product_lead boolean not null default false;

create or replace function public.sync_bug_department_progress()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  dep text;
  previous jsonb;
  entry jsonb;
  next_progress jsonb := '{}'::jsonb;
  all_done boolean := true;
  any_started boolean := false;
  actor public.profiles%rowtype;
begin
  select * into actor from public.profiles where id = auth.uid() and active;
  if tg_op = 'UPDATE' then
    previous := old.department_progress;
    if auth.uid() is not null and new.department_progress is distinct from old.department_progress then
      if actor.id is null then raise exception '账号无效'; end if;
      if actor.role <> 'admin' and actor.role <> 'leader' then
        for dep in select jsonb_object_keys(coalesce(old.department_progress, '{}') || coalesce(new.department_progress, '{}')) loop
          if (actor.role <> 'leader' or dep <> actor.department) and (new.department_progress -> dep) is distinct from (old.department_progress -> dep) then
            raise exception '只能修改自己部门的处理信息';
          end if;
        end loop;
        if not actor.department = any(string_to_array(old.assignee_department, ',')) then
          raise exception '当前部门未被分配此报告';
        end if;
        if actor.role <> 'leader' and coalesce(old.department_progress -> actor.department ->> 'assignee_id','') <> actor.id::text then
          raise exception '仅本部门组长或本部门跟进人可更新处理信息';
        end if;
        if actor.role = 'leader' then
          for dep in select jsonb_object_keys(coalesce(old.department_progress, '{}') || coalesce(new.department_progress, '{}')) loop
            if dep <> actor.department and (new.department_progress -> dep -> 'assignee_id') is distinct from (old.department_progress -> dep -> 'assignee_id') then
              raise exception '组长只能指定或修改自己部门的跟进人';
            end if;
          end loop;
        end if;
        if actor.role <> 'leader' and (
          (new.department_progress -> actor.department -> 'assignee_id') is distinct from (old.department_progress -> actor.department -> 'assignee_id')
          or (new.department_progress -> actor.department -> 'assignee') is distinct from (old.department_progress -> actor.department -> 'assignee')
        ) then raise exception '仅组长可指定跟进人'; end if;
      end if;
      if old.status not in ('open', 'in_progress', 'resolved') then raise exception '报告尚未分发'; end if;
    end if;
    if auth.uid() is not null and old.status in ('open', 'in_progress', 'resolved')
      and new.status is distinct from old.status and new.department_progress is not distinct from old.department_progress then
      raise exception '请更新部门处理状态，不能直接更改报告的汇总状态';
    end if;
    if auth.uid() is not null and old.status in ('open', 'in_progress', 'resolved')
      and new.assignee_department is distinct from old.assignee_department
      and not (actor.role = 'admin' or (actor.role = 'leader' and actor.department = any(string_to_array(old.assignee_department, ',')))) then
      raise exception '仅当前处理部门组长或超级管理员可更新处理部门';
    end if;
  else
    previous := '{}'::jsonb;
    new.department_progress := '{}'::jsonb;
  end if;

  foreach dep in array string_to_array(coalesce(new.assignee_department, ''), ',') loop
    if dep = '' then continue; end if;
    if dep not in ('技术—前端', '技术—后端', '设计', '产品') then raise exception '处理部门无效'; end if;
    entry := coalesce(new.department_progress -> dep, previous -> dep);
    if entry is null then
      entry := jsonb_build_object('status', 'open', 'assignee_id', null, 'assignee', '', 'note', '');
    end if;
    if coalesce(entry ->> 'status', '') not in ('open', 'in_progress', 'resolved') then raise exception '部门状态无效'; end if;
    next_progress := next_progress || jsonb_build_object(dep, entry);
    all_done := all_done and (entry ->> 'status' = 'resolved');
    any_started := any_started or (entry ->> 'status' <> 'open');
  end loop;
  new.department_progress := next_progress;
  if new.status in ('open', 'in_progress', 'resolved') then
    new.status := case when all_done and next_progress <> '{}'::jsonb then 'resolved' when any_started then 'in_progress' else 'open' end;
    new.resolved_at := case when new.status = 'resolved' then coalesce(new.resolved_at, now()) else null end;
  end if;
  return new;
end $$;

-- 重跑迁移时也将新增的产品修改需求类别初始化进同一部门处理流程。
update public.bug_reports b
set department_progress = (
  select coalesce(jsonb_object_agg(dep, coalesce(b.department_progress -> dep,
    jsonb_build_object('status', case when b.status in ('open','in_progress','resolved') then b.status else 'open' end,
      'assignee_id', b.assignee_id, 'assignee', coalesce(b.assignee, ''), 'note', coalesce(b.transfer_note, '')))), '{}'::jsonb)
  from unnest(string_to_array(b.assignee_department, ',')) as departments(dep) where dep <> ''
)
where b.request_type = 'product_change'
  and exists (select 1 from unnest(string_to_array(b.assignee_department, ',')) as departments(dep) where dep <> '' and not b.department_progress ? dep);

create table if not exists public.bug_department_changes (
  id uuid primary key default gen_random_uuid(),
  bug_id uuid not null references public.bug_reports(id) on delete cascade,
  previous_departments text not null,
  next_departments text not null,
  note text not null default '',
  changed_by uuid references auth.users(id),
  changed_by_name text not null default '',
  created_at timestamptz not null default now()
);
alter table public.bug_department_changes add column if not exists changed_by_name text not null default '';
alter table public.bug_department_changes enable row level security;
drop policy if exists "team read department changes" on public.bug_department_changes;
create policy "team read department changes" on public.bug_department_changes for select to authenticated using (true);

create or replace function public.log_bug_department_change()
returns trigger language plpgsql security definer set search_path = public
as $$
declare changer_name text;
begin
  if new.assignee_department is distinct from old.assignee_department then
    select coalesce(full_name, username, '成员') into changer_name from public.profiles where id = auth.uid();
    insert into public.bug_department_changes (bug_id, previous_departments, next_departments, note, changed_by, changed_by_name)
    values (new.id, coalesce(old.assignee_department,''), coalesce(new.assignee_department,''), coalesce(new.transfer_note,''), auth.uid(), coalesce(changer_name, '成员'));
  end if;
  return new;
end $$;
drop trigger if exists bug_reports_log_department_change on public.bug_reports;
create trigger bug_reports_log_department_change after update of assignee_department on public.bug_reports
for each row execute function public.log_bug_department_change();

-- 首次迁移：每个原处理部门继承迁移前状态，重跑不覆盖已有独立状态。
update public.bug_reports b
set department_progress = (
  select coalesce(jsonb_object_agg(dep, coalesce(b.department_progress -> dep,
    jsonb_build_object('status', case when b.status in ('open','in_progress','resolved') then b.status else 'open' end,
      'assignee_id', b.assignee_id, 'assignee', coalesce(b.assignee, ''), 'note', coalesce(b.transfer_note, '')))), '{}'::jsonb)
  from unnest(string_to_array(b.assignee_department, ',')) as departments(dep) where dep <> ''
)
where exists (
  select 1 from unnest(string_to_array(b.assignee_department, ',')) as departments(dep)
  where dep <> '' and not b.department_progress ? dep
);

drop trigger if exists z90_bug_department_progress on public.bug_reports;
create trigger z90_bug_department_progress before insert or update on public.bug_reports
for each row execute function public.sync_bug_department_progress();

-- 行锁下仅更新一个部门，避免两个部门同时操作互相覆盖。
create or replace function public.update_bug_department_progress(p_bug_id uuid, p_department text, p_patch jsonb)
returns setof public.bug_reports language plpgsql security definer set search_path = public
as $$
declare b public.bug_reports%rowtype; actor public.profiles%rowtype; entry jsonb; selected public.profiles%rowtype;
begin
  select * into actor from public.profiles where id = auth.uid() and active;
  if actor.id is null then raise exception '请先登录有效账号'; end if;
  select * into b from public.bug_reports where id = p_bug_id for update;
  if not found then raise exception '报告不存在'; end if;
  if p_department is null or not coalesce(p_department = any(string_to_array(b.assignee_department, ',')), false) then raise exception '该部门未分配此报告'; end if;
  if actor.role <> 'admin' and actor.department is distinct from p_department then raise exception '只能处理自己部门的任务'; end if;
  if b.status not in ('open','in_progress','resolved') then raise exception '报告尚未分发'; end if;
  if actor.role not in ('leader','admin') and coalesce(b.department_progress -> p_department ->> 'assignee_id','') <> actor.id::text then raise exception '仅本部门组长或本部门跟进人可以处理'; end if;
  if p_patch is null or jsonb_typeof(p_patch) <> 'object' or p_patch - array['status','assignee_id','assignee','note']::text[] <> '{}'::jsonb then
    raise exception '处理字段无效';
  end if;
  if actor.role not in ('leader','admin') and p_patch ? 'assignee_id' then raise exception '仅本部门组长可指定跟进人'; end if;
  entry := b.department_progress -> p_department;
  if p_patch ? 'assignee_id' then
    if actor.role not in ('leader','admin') then raise exception '仅组长或超管可指定跟进人'; end if;
    if p_patch ->> 'assignee_id' is not null then
      select * into selected from public.profiles where id = (p_patch ->> 'assignee_id')::uuid and active and department = p_department;
      if selected.id is null then raise exception '跟进人必须是当前部门成员'; end if;
      p_patch := p_patch || jsonb_build_object('assignee', coalesce(selected.full_name, selected.username));
    else
      p_patch := p_patch || jsonb_build_object('assignee', '');
    end if;
  elsif p_patch ? 'assignee' then raise exception '请通过指定跟进人修改姓名'; end if;
  if actor.role not in ('leader','admin') and coalesce(entry ->> 'assignee_id', '') <> actor.id::text then
    raise exception '仅本部门组长或当前部门跟进人可以处理';
  end if;
  if p_patch ? 'status' and coalesce(p_patch ->> 'status','') not in ('open','in_progress','resolved') then raise exception '处理状态无效'; end if;
  if length(coalesce(p_patch ->> 'note','')) > 3000 then raise exception '处理备注最多3000字'; end if;
  entry := coalesce(entry, '{}'::jsonb) || p_patch || jsonb_build_object('updated_at', now());
  return query update public.bug_reports set department_progress = jsonb_set(coalesce(department_progress, '{}'::jsonb), array[p_department], entry), updated_at = now()
    where id = p_bug_id returning *;
end $$;
revoke all on function public.update_bug_department_progress(uuid,text,jsonb) from public, anon;
grant execute on function public.update_bug_department_progress(uuid,text,jsonb) to authenticated;

-- 多选更新处理部门使用行锁；取消勾选的部门保留状态 JSON，未来重新勾选可恢复原状态。
create or replace function public.update_bug_departments(p_bug_id uuid, p_departments text[], p_note text default '')
returns setof public.bug_reports language plpgsql security definer set search_path = public
as $$
declare b public.bug_reports%rowtype; actor public.profiles%rowtype; dep text; progress jsonb; entry jsonb;
begin
  select * into actor from public.profiles where id = auth.uid() and active;
  if actor.id is null then raise exception '请先登录有效账号'; end if;
  select * into b from public.bug_reports where id = p_bug_id for update;
  if not found then raise exception '报告不存在'; end if;
  if b.status not in ('open','in_progress','resolved') then raise exception '报告尚未分发'; end if;
  if not (actor.role = 'admin' or (actor.role = 'leader' and actor.department = any(string_to_array(b.assignee_department, ',')))) then raise exception '仅当前处理部门组长或超级管理员可更新处理部门'; end if;
  if p_departments is null or cardinality(p_departments) = 0 then raise exception '至少保留一个处理部门'; end if;
  foreach dep in array p_departments loop
    if dep not in ('技术—前端','技术—后端','设计','产品') then raise exception '处理部门无效：%', dep; end if;
  end loop;
  progress := coalesce(b.department_progress, '{}'::jsonb);
  foreach dep in array p_departments loop
    entry := progress -> dep;
    if entry is null then progress := jsonb_set(progress, array[dep], jsonb_build_object('status','open','assignee_id',null,'assignee','','note',''), true); end if;
  end loop;
  return query update public.bug_reports set assignee_department = array_to_string(p_departments, ','), department_progress = progress, transfer_note = coalesce(p_note,''), updated_at = now() where id = p_bug_id returning *;
end $$;
revoke all on function public.update_bug_departments(uuid,text[],text) from public, anon;
grant execute on function public.update_bug_departments(uuid,text[],text) to authenticated;

notify pgrst, 'reload schema';
commit;
