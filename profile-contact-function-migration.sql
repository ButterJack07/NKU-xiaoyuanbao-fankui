-- 修复个人信息保存 RPC 函数签名。
-- 前端现在传入 QQ、微信、电话、统一联系时间和按日联系时间。

alter table public.profiles
  add column if not exists qq text not null default '';

alter table public.profiles
  add column if not exists wechat text not null default '';

alter table public.profiles
  add column if not exists phone text not null default '';

alter table public.profiles
  add column if not exists contact_time text not null default '';

alter table public.profiles
  add column if not exists contact_schedule jsonb not null default '{}'::jsonb;

drop function if exists public.update_my_contact_profile(text, text, text, text);
drop function if exists public.update_my_contact_profile(text, text, text, text, jsonb);

create or replace function public.update_my_contact_profile(
  p_qq text default '',
  p_wechat text default '',
  p_phone text default '',
  p_contact_time text default '',
  p_contact_schedule jsonb default '{}'::jsonb
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.profiles;
begin
  update public.profiles
  set qq = coalesce(p_qq, ''),
      wechat = coalesce(p_wechat, ''),
      phone = coalesce(p_phone, ''),
      contact_time = coalesce(p_contact_time, ''),
      contact_schedule = coalesce(p_contact_schedule, '{}'::jsonb),
      updated_at = now()
  where id = auth.uid()
    and active = true
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception '当前账号不可修改个人信息';
  end if;

  return updated_profile;
end;
$$;

revoke all on function public.update_my_contact_profile(text, text, text, text, jsonb) from public;
grant execute on function public.update_my_contact_profile(text, text, text, text, jsonb) to authenticated;

notify pgrst, 'reload schema';

select
  p.oid::regprocedure as function_signature
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'update_my_contact_profile';
