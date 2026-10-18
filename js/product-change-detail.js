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
    document.getElementById('requestNotice').textContent=reportDepartments().indexOf(ownDept)!==-1?'当前部门：'+ownDept+'。只能修改本部门的处理状态和备注。':'你可以查看各部门的处理进度。';
    document.getElementById('requestDepartmentRows').innerHTML=reportDepartments().map(function(dep){
      var item=window.PatchworkAPI.departmentState(bug,dep), canUpdate=profile.role==='admin'||profile.department===dep;
      var editor=canUpdate?'<div class="request-department-editor"><label>更新本部门状态<select data-request-status="'+esc(dep)+'"><option value="open" '+(item.status==='open'?'selected':'')+'>未处理</option><option value="in_progress" '+(item.status==='in_progress'?'selected':'')+'>处理中</option><option value="resolved" '+(item.status==='resolved'?'selected':'')+'>已完成</option></select></label><label>跟进备注<textarea data-request-note="'+esc(dep)+'" rows="2" maxlength="3000">'+esc(item.note||'')+'</textarea></label><button class="case-action-button" type="button" data-save-department="'+esc(dep)+'">保存本部门进度</button></div>':'';
      return '<article class="request-department-card"><header><strong>'+esc(dep)+'</strong><span class="overview-status overview-'+esc(item.status)+'">'+esc(statusText[item.status]||item.status)+'</span></header><p>跟进人：'+esc(item.assignee||'未指定')+'</p>'+(item.note?'<p>备注：'+esc(item.note)+'</p>':'')+editor+'</article>';
    }).join('');
    document.querySelectorAll('[data-save-department]').forEach(function(button){button.onclick=async function(){var dep=button.dataset.saveDepartment;button.disabled=true;try{var status=document.querySelector('[data-request-status="'+dep+'"]');var note=document.querySelector('[data-request-note="'+dep+'"]');var rows=await window.PatchworkAPI.updateDepartmentProgress(bug.id,dep,{status:status.value,note:note.value.trim()});if(!rows||!rows[0])throw new Error('未能保存部门进度');bug=rows[0];render();toast(dep+'进度已更新。','success');}catch(e){toast(e.message||'保存失败。','error');button.disabled=false;}};});
  }
  async function load(){try{await window.PATCHWORK_READY;var result=await window.PatchworkAPI.listBugs();bug=(result||[]).find(function(item){return item.id===id&&item.request_type==='product_change';});if(!bug)throw new Error('找不到该产品修改需求。');var profile=window.PATCHWORK_PROFILE||{};if(profile.role!=='admin'&&profile.department!=='产品'&&reportDepartments().indexOf(profile.department)===-1)throw new Error('当前账号没有查看该需求的权限。');if(profile.role!=='admin'&&profile.department==='产品'&&!profile.is_product_lead&&reportDepartments().indexOf(profile.department)===-1)throw new Error('仅产品负责人可查看此需求。');render();}catch(e){toast(e.message||'产品修改需求加载失败。','error');}}
  load();
})();
