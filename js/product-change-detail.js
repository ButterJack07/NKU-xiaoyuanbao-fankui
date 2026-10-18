(function () {
  'use strict';
  var id = new URLSearchParams(location.search).get('bug'), bug, departments = ['技术—前端','技术—后端','设计','产品'];
  var statusText = { open:'未处理', in_progress:'处理中', resolved:'已完成' };
  function esc(v) { return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function toast(message, type) { var n=document.getElementById('toast'); n.textContent=message; n.className='toast show '+(type||''); setTimeout(function(){n.className='toast';},3500); }
  function reportDepartments() { return String(bug.assignee_department||'').split(',').map(function(x){return x.trim();}).filter(Boolean); }
  function overall() { var states=reportDepartments().map(function(d){return window.PatchworkAPI.departmentState(bug,d).status;}); return states.length&&states.every(function(s){return s==='resolved';})?'resolved':states.some(function(s){return s!=='open';})?'in_progress':'open'; }
  function render() {
    document.title='校缘宝 · '+window.PatchworkAPI.reportCode(bug);
    document.getElementById('requestCode').textContent=window.PatchworkAPI.reportCode(bug);
    document.getElementById('requestTitle').textContent=bug.title||'产品修改需求';
    document.getElementById('requestReporter').textContent=bug.reporter||'—';
    document.getElementById('requestCreated').textContent=bug.created_at?new Date(bug.created_at).toLocaleString('zh-CN'):'—';
    document.getElementById('requestDesiredDate').textContent=bug.desired_date||'—';
    document.getElementById('requestModule').textContent=bug.module||'—';
    document.getElementById('requestReason').textContent=bug.change_reason||bug.description||'—';
    document.getElementById('requestBefore').textContent=bug.before_logic||bug.repro_steps||'—';
    document.getElementById('requestAfter').textContent=bug.after_logic||bug.expected_result||'—';
    document.getElementById('requestExceptions').textContent=bug.exception_handling||bug.actual_result||'—';
    document.getElementById('requestImpact').textContent=bug.impact_scope||'—';
    document.getElementById('requestDepartments').textContent=reportDepartments().join('、')||'—';
    document.getElementById('requestAttachments').innerHTML=(bug.attachment_urls||[]).length?bug.attachment_urls.map(function(url,i){return '<a class="detail-attachment-download" href="'+esc(url)+'" target="_blank" rel="noopener">查看附件 '+(i+1)+'</a>';}).join(' '):'无附件';
    var state=overall();
    document.getElementById('requestOverallStatus').innerHTML='<span class="overview-status overview-'+state+'">'+statusText[state]+'</span>';
    var profile=window.PATCHWORK_PROFILE||{}, ownDept=profile.department;
    document.getElementById('requestNotice').textContent='各部门处理进度由对应部门在缺陷列表中维护。';
    document.getElementById('requestDepartmentRows').innerHTML=reportDepartments().map(function(dep){
      var item=window.PatchworkAPI.departmentState(bug,dep), label=statusText[item.status]||item.status||'未处理';
      return '<article class="request-department-card"><header><div class="request-department-identity"><span class="request-department-mark">'+esc(dep.slice(-2))+'</span><div><strong>'+esc(dep)+'</strong><small>处理部门</small></div></div><span class="overview-status overview-'+esc(item.status)+'">'+esc(label)+'</span></header><div class="request-department-meta"><div><span>跟进人</span><strong>'+esc(item.assignee||'未指定')+'</strong></div><div><span>处理状态</span><strong>'+esc(label)+'</strong></div></div><div class="request-department-note"><span>跟进备注</span><p>'+esc(item.note||'暂无备注')+'</p></div></article>';
    }).join('');
  }
  async function load(){try{await window.PATCHWORK_READY;var result=await window.PatchworkAPI.listBugs();bug=(result||[]).find(function(item){return item.id===id&&item.request_type==='product_change';});if(!bug)throw new Error('找不到该产品修改需求。');var profile=window.PATCHWORK_PROFILE||{};if(profile.role!=='admin'&&profile.department!=='产品'&&reportDepartments().indexOf(profile.department)===-1)throw new Error('当前账号没有查看该需求的权限。');if(profile.role!=='admin'&&profile.department==='产品'&&!profile.is_product_lead&&reportDepartments().indexOf(profile.department)===-1)throw new Error('仅产品负责人可查看此需求。');render();}catch(e){toast(e.message||'产品修改需求加载失败。','error');}}
  load();
})();
