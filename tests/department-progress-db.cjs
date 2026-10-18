// Run with PGLITE_MODULE pointing to an installed @electric-sql/pglite module.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require(process.env.PGLITE_MODULE || '@electric-sql/pglite');
(async () => {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.uid',true),'')::uuid $$;
    create table public.profiles(id uuid primary key, active boolean default true, role text, department text, full_name text, username text);
    create table public.bug_reports(id uuid primary key default gen_random_uuid(), status text, assignee_department text, assignee_id uuid, assignee text, transfer_note text, updated_at timestamptz, resolved_at timestamptz);
    insert into auth.users values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');
    insert into public.profiles(id,role,department) values ('00000000-0000-0000-0000-000000000001','leader','技术—前端'),('00000000-0000-0000-0000-000000000002','leader','技术—后端');
    insert into public.bug_reports(id,status,assignee_department) values ('00000000-0000-0000-0000-000000000010','open','技术—前端,技术—后端');
  `);
  const migration = fs.readFileSync(path.join(__dirname, '../supabase-department-progress.sql'), 'utf8');
  await db.exec(migration);
  await db.exec(migration); // Repeated execution preserves existing state.
  await db.exec(`set request.uid = '00000000-0000-0000-0000-000000000001'`);
  await db.query(`select * from update_bug_department_progress($1,$2,$3)`, ['00000000-0000-0000-0000-000000000010','技术—前端',{status:'resolved'}]);
  let row = (await db.query('select * from bug_reports')).rows[0];
  assert.equal(row.status, 'in_progress');
  assert.equal(row.department_progress['技术—后端'].status, 'open');
  await assert.rejects(db.query(`select * from update_bug_department_progress($1,$2,$3)`, ['00000000-0000-0000-0000-000000000010','技术—后端',{status:'resolved'}]), /只能处理自己部门/);
  await db.exec(`set request.uid = '00000000-0000-0000-0000-000000000002'`);
  await db.query(`select * from update_bug_department_progress($1,$2,$3)`, ['00000000-0000-0000-0000-000000000010','技术—后端',{status:'resolved'}]);
  row = (await db.query('select * from bug_reports')).rows[0];
  assert.equal(row.status, 'resolved');
  await db.exec(`update bug_reports set assignee_department='技术—前端,技术—后端,设计'`);
  row = (await db.query('select * from bug_reports')).rows[0];
  assert.equal(row.department_progress['技术—前端'].status, 'resolved');
  assert.equal(row.department_progress['设计'].status, 'open');
  assert.equal(row.status, 'in_progress');
  await db.exec(`set request.uid = '00000000-0000-0000-0000-000000000001'`);
  await assert.rejects(db.query(`select * from update_bug_department_progress($1,$2,$3)`, ['00000000-0000-0000-0000-000000000010','技术—前端',{assignee_id:'00000000-0000-0000-0000-000000000002'}]), /跟进人必须是当前部门成员/);
  await db.exec(`set request.uid = '00000000-0000-0000-0000-000000000002'`);
  await db.exec(`update bug_reports set assignee_department='技术—前端,技术—后端'`);
  assert.equal((await db.query('select status from bug_reports')).rows[0].status, 'resolved');
  await assert.rejects(db.exec(`update bug_reports set status='open'`), /不能直接更改报告/);

  // Legacy group leader must retain other departments and preserve a newly removed department's progress.
  await db.exec(`insert into auth.users(id) values ('00000000-0000-0000-0000-000000000003'); insert into public.profiles(id,role,department) values ('00000000-0000-0000-0000-000000000003','leader','技术—前端') on conflict (id) do update set role='leader',department='技术—前端';`);
  await db.exec(`set request.uid = '00000000-0000-0000-0000-000000000003'`);
  await db.query(`select * from update_bug_departments($1,$2,$3)`, ['00000000-0000-0000-0000-000000000010',['技术—前端','设计'],'保留其他组']);
  row = (await db.query('select * from bug_reports')).rows[0];
  assert.equal(row.assignee_department, '技术—前端,设计');
  assert.equal(row.department_progress['技术—前端'].status, 'resolved');
  assert.equal(row.department_progress['设计'].status, 'open');
  assert.equal(row.status, 'in_progress');
  assert.equal((await db.query('select count(*)::int as n from bug_department_changes')).rows[0].n, 3);
  await db.close();
  console.log('PASS: SQL migration rerun, independent state, aggregation, department changes and cross-department permissions');
})().catch(error => { console.error(error); process.exitCode = 1; });
