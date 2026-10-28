// PGLITE_MODULE may point to an external @electric-sql/pglite installation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require(process.env.PGLITE_MODULE || '@electric-sql/pglite');
(async () => {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.uid',true),'')::uuid $$;
    create table profiles(id uuid primary key, active boolean default true, role text default 'member', department text, is_product_lead boolean default false, review_stage integer default 0, full_name text, username text);
    create sequence product_request_no_seq;
    create table bug_reports(id uuid primary key default gen_random_uuid(), submitter_id uuid, request_type text default 'bug', submission_source text default 'test', status text, product_request_no bigint default nextval('product_request_no_seq'), request_code text, assignee_department text default '技术—前端', fix_plan text default '', assignee text default '', resolved_at timestamptz, attachment_urls text[] default '{}', review_note text, reviewer_id uuid, updated_at timestamptz);
    create table bug_review_events(bug_id uuid,stage integer,action text,note text,reviewer_id uuid,reviewer_name text);
    create function public.is_admin() returns boolean language sql as $$ select exists(select 1 from profiles where id=auth.uid() and active and role='admin') $$;
    create function public.current_department() returns text language sql as $$ select department from profiles where id=auth.uid() and active $$;
    create function public.current_review_stage() returns integer language sql as $$ select coalesce((select review_stage from profiles where id=auth.uid() and active),0) $$;
    insert into profiles(id,department,is_product_lead,review_stage) values
      ('00000000-0000-0000-0000-000000000001','产品',true,0),
      ('00000000-0000-0000-0000-000000000002','产品',false,0),
      ('00000000-0000-0000-0000-000000000003','测试',false,1),
      ('00000000-0000-0000-0000-000000000004','测试',false,2);
  `);
  const sql = fs.readFileSync(path.join(__dirname,'../supabase-product-deputy.sql'),'utf8');
  await db.exec(sql); await db.exec(sql);
  await db.exec(`
    update profiles set is_product_deputy=true where id='00000000-0000-0000-0000-000000000002';
    create trigger source_guard before insert on bug_reports for each row execute function enforce_bug_report_submission_source();
    create trigger review_guard before update on bug_reports for each row execute function enforce_bug_review_stage();
    create trigger auto_approval after insert on bug_reports for each row execute function record_product_bug_auto_approvals();
  `);
  const login = n => db.exec(`set request.uid='00000000-0000-0000-0000-${String(n).padStart(12,'0')}'`);
  const insert = async (type, source, status) => (await db.query('insert into bug_reports(request_type,submission_source,status) values($1,$2,$3) returning *',[type,source,status])).rows[0];
  await login(2);
  const bug = await insert('bug','product','open');
  assert.equal(bug.status,'pending_review_2');
  assert.deepEqual((await db.query('select stage from bug_review_events where bug_id=$1',[bug.id])).rows.map(r=>r.stage),[1]);
  const request = await insert('product_change','product_change','open');
  assert.equal(request.status,'pending_review_1');
  assert.match(request.request_code,/^PRO-/);
  await assert.rejects(db.query("update bug_reports set status='open' where id=$1",[request.id]),/产品负责人审核/);
  await assert.rejects(db.query('select * from review_product_request($1,true,\'\')',[request.id]),/仅产品负责人/);
  await login(3);
  await assert.rejects(db.query("update bug_reports set status='open' where id=$1",[request.id]),/产品负责人审核/);
  await assert.rejects(db.query("update bug_reports set status='open' where id=$1",[bug.id]),/第二审核人/);
  const testBug = await insert('bug','test','pending_review_1');
  assert.equal(testBug.status,'pending_review_1');
  await login(4);
  await db.query("update bug_reports set status='open' where id=$1",[bug.id]);
  await login(1);
  let reviewed = (await db.query('select * from review_product_request($1,false,$2)',[request.id,'补充说明'])).rows[0];
  assert.equal(reviewed.status,'rejected');
  await login(2);
  await db.query("update bug_reports set status='pending_review_1' where id=$1",[request.id]);
  await login(1);
  reviewed = (await db.query('select * from review_product_request($1,true,$2)',[request.id,'同意'])).rows[0];
  assert.equal(reviewed.status,'open');
  await assert.rejects(db.query('select * from review_product_request($1,true,\'\')',[request.id]),/已完成审核/);
  const direct = await insert('product_change','product_change','pending_review_1');
  assert.equal(direct.status,'open');
  assert.equal((await db.query('select count(*)::int as n from bug_review_events where bug_id=$1',[direct.id])).rows[0].n,2);
  await assert.rejects(db.exec("update profiles set is_product_deputy=true where is_product_lead"),/profiles_product_deputy_check/);
  await db.exec(`
    alter table bug_reports enable row level security;
    create policy read_reports on bug_reports for select to authenticated using(true);
    create policy submitter_update on bug_reports for update to authenticated using(submitter_id=auth.uid()) with check(true);
    grant usage on schema public,auth to authenticated;
    grant select on profiles to authenticated;
    grant select,insert,update on bug_reports to authenticated;
    grant usage on sequence product_request_no_seq to authenticated;
    set role authenticated;
  `);
  await login(2);
  const rlsRequest = await insert('product_change','product_change','open');
  assert.equal(rlsRequest.status,'pending_review_1');
  await login(1);
  assert.equal((await db.query("update bug_reports set review_note='负责人可编辑' where id=$1 returning *",[rlsRequest.id])).rows.length,1);
  await db.query('select * from review_product_request($1,true,\'RLS审核\')',[rlsRequest.id]);
  await login(3);
  await assert.rejects(insert('product_change','product_change','open'),/仅产品负责人/);
  await db.close();
  console.log('PASS: deputy submission, automatic stage-one approval, reviewer isolation, lead approval/rejection, resubmission, direct dispatch and migration rerun');
})().catch(error => { console.error(error); process.exitCode=1; });
