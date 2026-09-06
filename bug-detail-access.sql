-- 确保已登录成员可以查看缺陷详情。
-- 如果 bug_reports 表已有 team read bug reports 策略，无需重复执行。
drop policy if exists "team read bug reports" on public.bug_reports;
create policy "team read bug reports"
on public.bug_reports for select to authenticated
using (true);

notify pgrst, 'reload schema';
