-- 1.6：在审核流程、部门进度、产品需求操作及待定跟进人迁移之后执行，可重复执行。
begin;
alter table public.profiles add column if not exists is_product_deputy boolean not null default false;
alter table public.profiles drop constraint if exists profiles_product_deputy_check;
alter table public.profiles add constraint profiles_product_deputy_check check (
  not is_product_deputy or not is_product_lead
);

create or replace function public.is_product_lead()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from profiles where id=auth.uid() and active and is_product_lead); $$;

create or replace function public.is_product_deputy()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from profiles where id=auth.uid() and active and is_product_deputy and not is_product_lead); $$;

create or replace function public.enforce_bug_report_submission_source()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not exists(select 1 from profiles where id=auth.uid() and active) then raise exception '请先登录有效账号'; end if;
  if new.request_type = 'product_change' or new.submission_source = 'product_change' then
    if not (public.is_product_lead() or public.is_product_deputy() or public.is_admin()) then raise exception '仅产品负责人或产品副负责人可提交产品修改需求'; end if;
    new.request_type := 'product_change';
    new.submission_source := 'product_change';
    new.status := case when public.is_product_deputy() then 'pending_review_1' else 'open' end;
    if new.product_request_no is null then new.product_request_no := nextval('public.product_request_no_seq'); end if;
    new.request_code := 'PRO-' || lpad(new.product_request_no::text,4,'0');
  elsif public.is_product_deputy() then
    new.status := 'pending_review_2';
    new.submission_source := 'product';
  elsif new.submission_source = 'product' then
    if not public.is_product_lead() or new.status <> 'open' then raise exception '仅产品负责人或产品副负责人可发布产品缺陷报告'; end if;
  elsif new.submission_source is distinct from 'test' or new.status <> 'pending_review_1' then
    raise exception '测试端缺陷报告必须进入第一审核环节';
  end if;
  new.submitter_id := auth.uid();
  return new;
end $$;

drop policy if exists "internal create bug reports" on public.bug_reports;
create policy "internal create bug reports" on public.bug_reports for insert to authenticated with check (
  submitter_id = auth.uid() and exists(select 1 from profiles where id=auth.uid() and active)
  and (
    (request_type = 'bug' and submission_source = 'test' and status='pending_review_1' and not public.is_product_deputy())
    or (request_type = 'bug' and submission_source='product' and (
      (public.is_product_deputy() and status='pending_review_2')
      or (public.is_product_lead() and status='open')))
    or (request_type='product_change' and submission_source='product_change' and (
      (public.is_product_deputy() and status='pending_review_1')
      or ((public.is_product_lead() or public.is_admin()) and not public.is_product_deputy() and status='open')))
  ) and assignee_department <> ''
  and string_to_array(assignee_department, ',') <@ array['技术—前端','技术—后端','设计','产品']::text[]
  and fix_plan='' and assignee='' and resolved_at is null and cardinality(attachment_urls)<=8
);

create or replace function public.record_product_bug_auto_approvals()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.submission_source in ('product','product_change') and new.status='open' then
    insert into bug_review_events(bug_id,stage,action,note,reviewer_name) values
      (new.id,1,'approve','产品端直发，默认通过审核。','系统自动通过（产品端上传）'),
      (new.id,2,'approve','产品端直发，默认通过审核。','系统自动通过（产品端上传）');
  elsif new.request_type='bug' and new.submission_source='product' and new.status='pending_review_2' then
    insert into bug_review_events(bug_id,stage,action,note,reviewer_name)
      values(new.id,1,'approve','产品副负责人提交，默认通过第一审核，等待第二审核。','系统自动通过（产品副负责人）');
  end if;
  return new;
end $$;

-- 产品需求独立于测试组的一、二审权限；副负责人不能自行通过或改为直发。
create or replace function public.enforce_bug_review_stage()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.request_type is distinct from old.request_type or new.submission_source is distinct from old.submission_source or new.submitter_id is distinct from old.submitter_id then
    raise exception '不能修改报告类型、来源或提交人';
  end if;
  if old.request_type='product_change' then
    if old.status in ('pending_review_1','rejected') then
      if public.is_product_lead() then
        if new.status is distinct from old.status and old.submitter_id=auth.uid() then raise exception '不能审核本人提交的需求'; end if;
        if new.status not in (old.status,'open','rejected') then raise exception '产品需求审核状态无效'; end if;
      elsif old.submitter_id=auth.uid() and old.status='rejected' and new.status='pending_review_1' then
        null;
      else
        raise exception '产品修改需求须由产品负责人审核';
      end if;
    elsif new.status in ('pending_review_1','pending_review_2','rejected') then
      raise exception '已分发需求不能退回审核';
    end if;
    return new;
  end if;
  if old.status='pending_review_1' and new.status is distinct from old.status then
    if new.status not in ('pending_review_2','rejected') or public.current_review_stage()<>1 then raise exception '当前用户不是第一审核人，无法完成第一审核'; end if;
  elsif old.status='pending_review_2' and new.status is distinct from old.status then
    if new.status not in ('open','rejected') or public.current_review_stage()<>2 then raise exception '当前用户不是第二审核人，无法完成第二审核'; end if;
  elsif old.status in ('rejected','postponed') and old.submitter_id=auth.uid() and public.is_product_deputy() and new.status in ('pending_review_1','pending_review_2') then
    new.status := 'pending_review_2';
  end if;
  return new;
end $$;

drop policy if exists "product lead update change requests" on public.bug_reports;
create policy "product lead update change requests" on public.bug_reports for update to authenticated
using (request_type='product_change' and public.is_product_lead())
with check (request_type='product_change' and public.is_product_lead() and char_length(review_note)<=1000);

drop policy if exists "internal delete bug reports" on public.bug_reports;
create policy "internal delete bug reports" on public.bug_reports for delete to authenticated
using (public.is_admin() or (submitter_id=auth.uid() and (request_type<>'product_change' or status='rejected')));

create or replace function public.review_product_request(p_bug_id uuid, p_approve boolean, p_note text default '')
returns setof public.bug_reports language plpgsql security definer set search_path = public
as $$
declare b public.bug_reports%rowtype; actor public.profiles%rowtype;
begin
  if not public.is_product_lead() then raise exception '仅产品负责人可审核产品修改需求'; end if;
  if p_approve is null then raise exception '请选择审核结果'; end if;
  if length(coalesce(p_note,''))>1000 then raise exception '审核备注最多1000字'; end if;
  select * into b from bug_reports where id=p_bug_id for update;
  if not found or b.request_type<>'product_change' or b.status<>'pending_review_1' then raise exception '需求不存在或已完成审核，请刷新'; end if;
  if b.submitter_id=auth.uid() then raise exception '不能审核本人提交的需求'; end if;
  select * into actor from profiles where id=auth.uid();
  return query update bug_reports set status=case when p_approve then 'open' else 'rejected' end,
    review_note=coalesce(p_note,''), reviewer_id=auth.uid(), updated_at=now() where id=p_bug_id returning *;
  insert into bug_review_events(bug_id,stage,action,note,reviewer_id,reviewer_name)
    values(p_bug_id,1,case when p_approve then 'approve' else 'reject' end,coalesce(p_note,''),auth.uid(),coalesce(actor.full_name,actor.username));
end $$;
revoke all on function public.review_product_request(uuid,boolean,text) from public,anon;
grant execute on function public.review_product_request(uuid,boolean,text) to authenticated;

-- 更新当前安装的处理函数，仅去掉产品负责人身份的部门前置条件，保留已有处理规则。
do $$
declare signature text; definition text;
begin
  foreach signature in array array['public.sync_bug_department_progress()', 'public.update_bug_department_progress(uuid,text,jsonb)', 'public.update_bug_departments(uuid,text[],text)'] loop
    if to_regprocedure(signature) is not null then
      definition := pg_get_functiondef(to_regprocedure(signature));
      definition := replace(definition, 'actor.department = ''产品'' and actor.is_product_lead', 'actor.is_product_lead');
      execute definition;
    end if;
  end loop;
end $$;
notify pgrst, 'reload schema';
commit;
