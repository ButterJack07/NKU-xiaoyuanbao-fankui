const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function apiContext() {
  const calls = [];
  const window = { PATCHWORK_CONFIG: { supabaseUrl: 'https://example.supabase.co', supabaseAnonKey: 'public-key', tableName: 'bug_reports' }, PATCHWORK_AUTH_TOKEN: 'session-token' };
  const context = { window, fetch: async (url, options) => { calls.push({ url, options }); return { ok: true, status: 200, text: async () => '[]' }; } };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/api.js'), 'utf8'), context);
  return { api: window.PatchworkAPI, window, calls };
}
const report = {
  id: 'one', bug_no: 1, title: '多部门任务', status: 'in_progress', assignee_department: '技术—前端,技术—后端',
  department_progress: {
    '技术—前端': { status: 'resolved', assignee_id: 'front-user', assignee: '前端成员', note: '完成' },
    '技术—后端': { status: 'open', assignee_id: 'back-user', assignee: '后端成员', note: '' }
  }
};

test('同一报告在两个部门显示不同状态及跟进人，不修改原始数据', () => {
  const { api } = apiContext();
  assert.equal(api.departmentView(report, '技术—前端').status, 'resolved');
  assert.equal(api.departmentView(report, '技术—后端').status, 'open');
  assert.equal(api.departmentView(report, '技术—后端').assignee_id, 'back-user');
  assert.equal(report.status, 'in_progress');
  assert.equal(api.departmentView(report, null), report);
  const pending = { ...report, status: 'pending_review_2' };
  assert.equal(api.departmentView(pending, '技术—前端').status, 'pending_review_2');
});

test('处理更新仅发送当前部门补丁到原子 RPC，而不是全量覆盖报告', async () => {
  const { api, calls } = apiContext();
  await api.updateDepartmentProgress('one', '技术—后端', { status: 'in_progress' });
  assert.match(calls[0].url, /rpc\/update_bug_department_progress$/);
  assert.deepEqual(JSON.parse(calls[0].options.body), { p_bug_id: 'one', p_department: '技术—后端', p_patch: { status: 'in_progress' } });
  assert.equal(calls[0].options.headers.apikey, 'public-key');
});

test('成功保存处理状态后通知公共任务清单刷新', async () => {
  const { api, window } = apiContext();
  const events=[];
  window.Event=function(type){this.type=type;};
  window.dispatchEvent=event=>events.push(event.type);
  await api.updateDepartmentProgress('one','技术—后端',{status:'resolved'});
  assert.deepEqual(events,['patchwork:reports-changed']);
});

test('圆环按报告汇总，部分完成算处理中，总表显示四部门与未分配', async () => {
  const { api } = apiContext();
  const nodes = {};
  function node(id) { return nodes[id] ||= { value: id === 'overviewStatus' ? 'all' : '', style: {}, classList: { add() {}, remove() {}, toggle() {} }, setAttribute(key, value) { this[key] = value; }, addEventListener() {} }; }
  const done = { ...report, id: 'two', bug_no: 2, status: 'resolved', assignee_department: '设计', department_progress: { '设计': { status: 'resolved' } } };
  const open = { ...report, id: 'three', bug_no: 3, status: 'open', assignee_department: '产品', department_progress: { '产品': { status: 'open' } } };
  const pending = { ...report, id: 'four', bug_no: 4, status: 'pending_review_1' };
  api.listBugs = async () => [report, done, open, pending];
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/data-dashboard.js'), 'utf8'), {
    document: { getElementById: node }, window: { PatchworkAPI: api, PATCHWORK_READY: Promise.resolve() }
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(nodes.overviewTotal.textContent, 4);
  assert.equal(nodes.progressRing['aria-label'], '已完成1份，处理中1份，未处理1份，未分发1份');
  assert.match(nodes.overviewRows.innerHTML, /未分配/);
  assert.equal((nodes.overviewRows.innerHTML.match(/<tr>/g) || []).length, 4);
  nodes.overviewStatus.value = 'resolved';
  await nodes.refreshOverview.onclick();
  assert.equal((nodes.overviewRows.innerHTML.match(/<tr>/g) || []).length, 1);
});
