const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parseHTML } = require(process.env.DOM_MODULE || 'linkedom');
const root = path.join(__dirname,'..');
const source = fs.readFileSync(path.join(root,'js/workspace-nav.js'),'utf8');
const flush = () => new Promise(resolve=>setImmediate(resolve));
(async()=>{
  const { document,window } = parseHTML('<html><head></head><body><span id="tasksBadge"></span></body></html>');
  const profile = { id:'me',department:'设计' };
  window.setInterval=()=>0;
  const bugs = [{id:'shared',request_type:'product_change',title:'跨部门任务',status:'in_progress',assignee_department:'设计,技术—后端',department_progress:{'设计':{status:'open',assignee_id:'me'},'技术—后端':{status:'in_progress',assignee_id:'other'}}},
    {id:'pending',title:'部门待定任务',status:'open',assignee_department:'设计',department_progress:{'设计':{status:'open',assignee_id:null}}},
    {id:'review',title:'审核中不能算任务',status:'pending_review_2',assignee_department:'设计',assignee_id:'me'},
    {id:'other',title:'别人的任务',status:'open',assignee_department:'设计',department_progress:{'设计':{status:'open',assignee_id:'other'}}}];
  window.PATCHWORK_PROFILE=profile;window.PATCHWORK_READY=Promise.resolve();
  window.PatchworkAPI={listBugs:async()=>bugs,reportCode:b=>b.id,departmentState:(b,d)=>b.department_progress?.[d]||{status:b.status,assignee_id:b.assignee_id}};
  const ctx=vm.createContext({window,document,console,closeInbox(){},scheduleInboxLoad(){}});
  const functions=source.slice(source.indexOf('  var taskItems'),source.indexOf('\n  function inboxEscape'));
  const escape=source.slice(source.indexOf('  function inboxEscape'),source.indexOf('\n  function inboxDate'));
  vm.runInContext(functions+escape,ctx);
  await vm.runInContext('openTasks()',ctx);
  assert.equal(document.getElementById('tasksBadge').textContent,'2');
  let list=document.getElementById('tasksList');
  assert.equal(list.querySelectorAll('.task-item').length,2);
  assert.match(list.innerHTML,/本部门待指定跟进人/);
  assert.match(list.innerHTML,/product-change-detail.html\?bug=shared/);
  assert.equal(list.querySelector('input').hasAttribute('checked'),false);
  bugs[0].department_progress['设计'].status='resolved';
  window.dispatchEvent(new window.Event('patchwork:reports-changed'));await flush();
  assert.equal(document.getElementById('tasksBadge').textContent,'1');
  assert.equal(list.querySelectorAll('input[checked]').length,1);
  assert.equal(bugs[0].status,'in_progress');
  bugs[0].department_progress['设计'].status='open';
  await vm.runInContext('openTasks()',ctx);
  assert.equal(list.querySelectorAll('input[checked]').length,0);
  assert.equal(document.getElementById('tasksBadge').textContent,'2');
  console.log('PASS: assigned tasks, pending department tasks, department-specific automatic completion and reopening');
})().catch(error=>{console.error(error);process.exitCode=1;});
