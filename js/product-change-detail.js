(function () {
  'use strict';
  var id = new URLSearchParams(location.search).get('bug'), bug, members = [], departments = ['技术—前端','技术—后端','设计','产品'], editExistingAttachments = [], editFiles = [];
  var TECH_DEPARTMENTS = ['技术—前端','技术—后端'];
  function isTechLeader(profile) { return Boolean(profile && profile.role === 'leader' && TECH_DEPARTMENTS.indexOf(profile.department) !== -1); }
  var statusText = { open:'未处理', in_progress:'处理中', resolved:'已完成' };
  function esc(v) { return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function toast(message, type) { var n=document.getElementById('toast'); n.textContent=message; n.className='toast show '+(type||''); setTimeout(function(){n.className='toast';},3500); }
  function isProductManager(profile) { return Boolean(profile && (profile.role === 'admin' || (profile.department === '产品' && profile.is_product_lead))); }
  function currentProfile() { return window.PATCHWORK_PROFILE || {}; }
  function requestedDepartment() { return new URLSearchParams(location.search).get('department') || ''; }
  function actionDepartments() {
    var profile = currentProfile(), all = reportDepartments();
    if (isProductManager(profile)) return all;
    var own = requestedDepartment() || profile.department;
    return all.filter(function(dep) { return dep === own; });
  }
  function selectedActionDepartment() { var select = document.getElementById('requestActionDepartment'); return select && select.value ? select.value : ''; }
  function actionState(dep) { return window.PatchworkAPI.departmentState(bug, dep); }
  function actionPermissions(dep, state) {
    var profile = currentProfile(), manager = isProductManager(profile), leader = Boolean(profile.role === 'leader' && profile.department === dep), assignee = Boolean(state.assignee_id && state.assignee_id === profile.id);
    return { manager: manager, assign: manager || leader, operate: manager || leader || assignee };
  }
  function setupBreadcrumb() {
    var profile = window.PATCHWORK_PROFILE || {}, home = document.getElementById('requestHomeLink'), list = document.getElementById('requestListLink');
    if (!home || !list) return;
    if (isProductManager(profile)) {
      home.textContent = '产品负责人工作台'; home.href = 'index.html';
      list.textContent = '产品修改需求'; list.href = 'product-change-requests.html';
      return;
    }
    var department = new URLSearchParams(location.search).get('department') || (profile.department !== '产品' ? profile.department : '');
    home.textContent = '工作台'; home.href = 'index.html';
    list.textContent = department ? department + '缺陷列表' : '缺陷列表';
    list.href = department ? 'department-bugs.html?department=' + encodeURIComponent(department) : 'index.html';
  }
  function attachmentLabel(url) {
    var name = String(url || '').split('?')[0].split('#')[0].split('/').pop() || '附件';
    try { name = decodeURIComponent(name); } catch (error) {}
    return name.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i, '');
  }
  function renderEditAttachmentFiles() {
    var existing = document.getElementById('editRequestExistingAttachments');
    if (existing) {
      existing.innerHTML = editExistingAttachments.length ? '<p class="existing-attachments-title">现有附件</p>' + editExistingAttachments.map(function(url, index) {
        return '<div class="file-item"><span class="file-type">FILE</span><span><strong>' + esc(attachmentLabel(url)) + '</strong><small>已上传</small></span><button type="button" data-remove-existing-attachment="' + index + '" aria-label="移除现有附件">×</button></div>';
      }).join('') : '';
      existing.querySelectorAll('[data-remove-existing-attachment]').forEach(function(button) {
        button.onclick = function() { editExistingAttachments.splice(Number(button.getAttribute('data-remove-existing-attachment')), 1); renderEditAttachmentFiles(); };
      });
    }
    var list = document.getElementById('editRequestFileList');
    if (list) {
      list.innerHTML = editFiles.map(function(file, index) {
        return '<div class="file-item"><span class="file-type">FILE</span><span><strong>' + esc(file.name) + '</strong><small>' + Math.ceil(file.size / 1024) + ' KB</small></span><button type="button" data-remove-edit-file="' + index + '" aria-label="移除附件">×</button></div>';
      }).join('');
      list.querySelectorAll('[data-remove-edit-file]').forEach(function(button) {
        button.onclick = function() { editFiles.splice(Number(button.getAttribute('data-remove-edit-file')), 1); renderEditAttachmentFiles(); };
      });
    }
  }
  function acceptEditFiles(incoming) {
    var files = Array.from(incoming), room = 8 - editExistingAttachments.length - editFiles.length;
    if (files.length > room) { toast('附件最多 8 个。', 'error'); return; }
    var oversized = files.find(function(file) { return file.size > 10 * 1024 * 1024; });
    if (oversized) { toast(oversized.name + ' 超过 10 MB 限制。', 'error'); return; }
    editFiles = editFiles.concat(files);
    renderEditAttachmentFiles();
  }
  function reportDepartments() { return String(bug.assignee_department||'').split(',').map(function(x){return x.trim();}).filter(Boolean); }
  function overall() { var states=reportDepartments().map(function(d){return window.PatchworkAPI.departmentState(bug,d).status;}); return states.length&&states.every(function(s){return s==='resolved';})?'resolved':states.some(function(s){return s!=='open';})?'in_progress':'open'; }
  function render() {
    setupBreadcrumb();
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
    document.getElementById('requestAttachments').innerHTML=window.PatchworkAttachments?window.PatchworkAttachments.render(bug.attachment_urls||[],{code:window.PatchworkAPI.reportCode(bug)}):((bug.attachment_urls||[]).length?bug.attachment_urls.map(function(url,i){return '<a class="detail-attachment-download" href="'+esc(url)+'" target="_blank" rel="noopener">查看附件 '+(i+1)+'</a>';}).join(' '):'无附件');
    var state=overall();
    document.getElementById('requestOverallStatus').innerHTML='<span class="overview-status overview-'+state+'">'+statusText[state]+'</span>';
    var profile=currentProfile();
    document.getElementById('requestEditAction').classList.toggle('hidden', !isProductManager(profile));
    var departmentSelect=document.getElementById('requestActionDepartment'), available=actionDepartments(), previous=departmentSelect.value, requested=requestedDepartment();
    var target=available.indexOf(previous)!==-1?previous:(available.indexOf(requested)!==-1?requested:available[0]||'');
    departmentSelect.innerHTML=available.map(function(dep){return '<option value="'+esc(dep)+'">'+esc(dep)+'</option>';}).join('');
    departmentSelect.value=target;
    departmentSelect.disabled=available.length<=1;
    var currentState=target?actionState(target):{status:'open',assignee:'',assignee_id:null,note:''}, permissions=actionPermissions(target,currentState);
    document.getElementById('requestActionAssignee').textContent=target?(currentState.assignee||'待定'):'—';
    document.getElementById('requestActionStatus').textContent=target?(statusText[currentState.status]||currentState.status||'未处理'):'—';
    document.getElementById('requestActionNote').textContent=target?(currentState.note||'暂无备注'):'暂无备注';
    var canAssign=Boolean(target&&permissions.assign), canOperate=Boolean(target&&permissions.operate);
    document.getElementById('requestNoteButton').classList.toggle('hidden', !canOperate);
    document.getElementById('requestAssigneeButton').classList.toggle('hidden', !canAssign);
    document.getElementById('requestTransferButton').classList.toggle('hidden', !canAssign);
    document.getElementById('requestStatusButton').classList.toggle('hidden', !canOperate);
    document.getElementById('requestAssigneeButton').title=target?'指定'+target+'的跟进人':'';
    document.getElementById('requestNotice').textContent=!target?'当前账号暂无可操作的处理部门。':permissions.manager?'可切换处理部门并更新其备注、跟进人、状态和处理部门；各部门状态互不影响。':permissions.assign?'当前处理部门：'+target+'。可更新本部门备注、跟进人、状态和处理部门。':permissions.operate?'当前处理部门：'+target+'。可填写本部门备注并更新状态。':'当前处理部门：'+target+'。仅对应部门成员可处理，产品负责人可更新全部部门。';
    document.getElementById('requestDepartmentRows').innerHTML=reportDepartments().map(function(dep){
      var item=window.PatchworkAPI.departmentState(bug,dep), label=statusText[item.status]||item.status||'未处理';
      var canComment=isProductManager(profile)||profile.department===dep;
      var noteEditor=canComment?'<form class="request-note-form" data-note-form="'+esc(dep)+'"><label><span>添加跟进备注</span><textarea name="note" rows="2" maxlength="3000" placeholder="补充本部门处理进展"></textarea></label><button class="case-action-button" type="submit">添加备注</button><p class="request-note-feedback hidden" aria-live="polite"></p></form>':'';
      return '<article class="request-department-card"><header><div class="request-department-identity"><span class="request-department-mark">'+esc(dep.slice(-2))+'</span><div><strong>'+esc(dep)+'</strong><small>处理部门</small></div></div><span class="overview-status overview-'+esc(item.status)+'">'+esc(label)+'</span></header><div class="request-department-meta"><div><span>跟进人</span><strong>'+esc(item.assignee||'待定')+'</strong></div><div><span>处理状态</span><strong>'+esc(label)+'</strong></div></div><div class="request-department-note"><span>跟进备注</span><p>'+esc(item.note||'暂无备注')+'</p></div>'+noteEditor+'</article>';
    }).join('');
    document.querySelectorAll('[data-note-form]').forEach(function(form){form.onsubmit=async function(event){event.preventDefault();var dep=form.dataset.noteForm,textarea=form.elements.note,value=textarea.value.trim(),feedback=form.querySelector('.request-note-feedback'),button=form.querySelector('button[type="submit"]');if(!value){feedback.textContent='请填写跟进备注。';feedback.classList.remove('hidden');return;}button.disabled=true;feedback.classList.add('hidden');try{var result=await window.PatchworkAPI.updateDepartmentProgress(bug.id,dep,{note:value});if(!result||!result[0])throw new Error('备注未保存');bug=result[0];render();toast(dep+'跟进备注已添加。','success');}catch(error){feedback.textContent=error.message||'备注保存失败。';feedback.classList.remove('hidden');button.disabled=false;}};});
  }
  function reportLabel() { return window.PatchworkAPI.reportCode(bug) + '｜' + (bug.title || ''); }
  function ensureActionModals() {
    if (!document.getElementById('requestAssigneeModal')) {
      var assigneeModal = document.createElement('div');
      assigneeModal.id = 'requestAssigneeModal';
      assigneeModal.className = 'modal-backdrop hidden';
      assigneeModal.innerHTML = '<section class="user-modal assignee-modal"><div class="developer-modal-header"><div><h2>指定跟进人</h2><p id="requestAssigneeInfo" class="user-modal-identity"></p><p class="user-modal-help">仅可选择当前处理部门的成员。</p></div><button id="closeRequestAssignee" class="icon-button" type="button">×</button></div><div class="assignee-form"><label class="field"><span>跟进人</span><select id="requestAssigneeSelect"><option value="">待定</option></select></label><p id="requestCurrentAssigneeHint" class="user-modal-help"></p><p id="requestAssigneeError" class="login-error hidden"></p><div class="edit-user-actions"><button id="cancelRequestAssignee" class="user-cancel-button" type="button">取消</button><button id="confirmRequestAssignee" class="case-action-button" type="button">确认指定</button></div></div></section>';
      document.body.appendChild(assigneeModal);
    }
    if (!document.getElementById('requestStatusModal')) {
      var statusModal = document.createElement('div');
      statusModal.id = 'requestStatusModal';
      statusModal.className = 'modal-backdrop hidden';
      statusModal.innerHTML = '<section class="user-modal assignee-modal"><div class="developer-modal-header"><div><h2>更改当前状态</h2><p id="requestStatusInfo" class="user-modal-identity"></p><p class="user-modal-help">仅更新当前处理部门，不影响其他部门。</p></div><button id="closeRequestStatus" class="icon-button" type="button">×</button></div><div class="assignee-form"><label class="field"><span>当前状态</span><select id="requestStatusSelect"><option value="open">未处理</option><option value="in_progress">处理中</option><option value="resolved">已完成</option></select></label><p id="requestStatusError" class="login-error hidden"></p><div class="edit-user-actions"><button id="cancelRequestStatus" class="user-cancel-button" type="button">取消</button><button id="confirmRequestStatus" class="case-action-button" type="button">确认更改</button></div></div></section>';
      document.body.appendChild(statusModal);
    }
    if (!document.getElementById('requestTransferModal')) {
      var transferModal = document.createElement('div');
      transferModal.id = 'requestTransferModal';
      transferModal.className = 'modal-backdrop hidden';
      transferModal.innerHTML = '<section class="user-modal assignee-modal"><div class="developer-modal-header"><div><h2>更新处理部门</h2><p id="requestTransferInfo" class="user-modal-identity"></p><p class="user-modal-help">支持多选。保留部门的处理状态不变，新增部门从待处理开始，取消勾选的部门退出当前任务。</p></div><button id="closeRequestTransfer" class="icon-button" type="button">×</button></div><div class="assignee-form"><div class="field"><span>处理部门（可多选）</span><div id="requestTransferDepartments" class="request-transfer-list"></div></div><label class="field"><span>处理部门调整说明（选填）</span><textarea id="requestTransferReason" rows="4" placeholder="处理部门调整说明（选填）"></textarea></label><p id="requestTransferError" class="login-error hidden"></p><div class="edit-user-actions"><button id="cancelRequestTransfer" class="user-cancel-button" type="button">取消</button><button id="confirmRequestTransfer" class="case-action-button" type="button">保存处理部门</button></div></div></section>';
      document.body.appendChild(transferModal);
    }
    document.getElementById('closeRequestAssignee').onclick = closeRequestAssigneeModal;
    document.getElementById('cancelRequestAssignee').onclick = closeRequestAssigneeModal;
    document.getElementById('confirmRequestAssignee').onclick = confirmRequestAssignee;
    document.getElementById('requestAssigneeModal').onclick = function(event) { if (event.target === event.currentTarget) closeRequestAssigneeModal(); };
    document.getElementById('closeRequestStatus').onclick = closeRequestStatusModal;
    document.getElementById('cancelRequestStatus').onclick = closeRequestStatusModal;
    document.getElementById('confirmRequestStatus').onclick = confirmRequestStatus;
    document.getElementById('requestStatusModal').onclick = function(event) { if (event.target === event.currentTarget) closeRequestStatusModal(); };
    document.getElementById('closeRequestTransfer').onclick = closeRequestTransferModal;
    document.getElementById('cancelRequestTransfer').onclick = closeRequestTransferModal;
    document.getElementById('confirmRequestTransfer').onclick = confirmRequestTransfer;
    document.getElementById('requestTransferModal').onclick = function(event) { if (event.target === event.currentTarget) closeRequestTransferModal(); };
  }
  function openRequestInlineNote() {
    var dep = selectedActionDepartment();
    if (!dep) return;
    var note = document.getElementById('requestActionNote');
    note.innerHTML = '<textarea id="requestInlineNoteInput" class="inline-note-input" rows="5" maxlength="3000" placeholder="填写本部门处理备注">' + esc(actionState(dep).note || '') + '</textarea><div class="inline-note-actions"><button id="cancelRequestInlineNote" class="user-cancel-button" type="button">取消</button><button id="saveRequestInlineNote" class="case-action-button" type="button">保存备注</button></div>';
    document.getElementById('cancelRequestInlineNote').onclick = render;
    document.getElementById('saveRequestInlineNote').onclick = saveRequestInlineNote;
    document.getElementById('requestInlineNoteInput').focus();
  }
  async function saveRequestInlineNote() {
    var dep = selectedActionDepartment(), input = document.getElementById('requestInlineNoteInput'), button = document.getElementById('saveRequestInlineNote');
    if (!dep || !input) return;
    button.disabled = true;
    button.textContent = '保存中…';
    try {
      var result = await window.PatchworkAPI.updateDepartmentProgress(bug.id, dep, { note: input.value.trim() });
      if (!result || !result[0]) throw new Error('备注未保存');
      bug = result[0];
      render();
      toast(dep + '跟进备注已更新。', 'success');
    } catch (error) {
      toast(error.message || '备注保存失败。', 'error');
      button.disabled = false;
      button.textContent = '保存备注';
    }
  }
  function openRequestAssigneeModal() {
    var dep = selectedActionDepartment();
    if (!dep) return;
    ensureActionModals();
    var state = actionState(dep), select = document.getElementById('requestAssigneeSelect');
    select.innerHTML = '<option value="">待定</option>' + members.filter(function(item) { return item.department === dep; }).map(function(item) { return '<option value="' + esc(item.id) + '">' + esc(item.full_name || item.username) + '</option>'; }).join('');
    select.value = state.assignee_id || '';
    document.getElementById('requestAssigneeInfo').textContent = reportLabel() + ' · ' + dep;
    document.getElementById('requestCurrentAssigneeHint').textContent = '当前跟进人：' + (state.assignee || '待定') + '（' + dep + '）';
    document.getElementById('requestAssigneeError').classList.add('hidden');
    document.getElementById('requestAssigneeModal').classList.remove('hidden');
  }
  function closeRequestAssigneeModal() { document.getElementById('requestAssigneeModal').classList.add('hidden'); }
  async function confirmRequestAssignee() {
    var dep = selectedActionDepartment(), selectedId = document.getElementById('requestAssigneeSelect').value, selected = selectedId ? members.find(function(item) { return item.id === selectedId; }) : null;
    var error = document.getElementById('requestAssigneeError'), button = document.getElementById('confirmRequestAssignee');
    if (!dep || (selectedId && !selected)) { error.textContent = '请选择本部门成员或待定。'; error.classList.remove('hidden'); return; }
    button.disabled = true;
    button.textContent = '保存中…';
    try {
      var result = await window.PatchworkAPI.updateDepartmentProgress(bug.id, dep, { assignee_id: selected ? selected.id : null });
      if (!result || !result[0]) throw new Error('跟进人未保存');
      bug = result[0];
      closeRequestAssigneeModal();
      render();
      toast(dep + (selected ? '跟进人已更新。' : '跟进人已设为待定。'), 'success');
    } catch (e) {
      error.textContent = e.message || '指定跟进人失败。';
      error.classList.remove('hidden');
    } finally {
      button.disabled = false;
      button.textContent = '确认指定';
    }
  }
  function openRequestStatusModal() {
    var dep = selectedActionDepartment();
    if (!dep) return;
    ensureActionModals();
    document.getElementById('requestStatusInfo').textContent = reportLabel() + ' · ' + dep;
    document.getElementById('requestStatusSelect').value = actionState(dep).status;
    document.getElementById('requestStatusError').classList.add('hidden');
    document.getElementById('requestStatusModal').classList.remove('hidden');
  }
  function closeRequestStatusModal() { document.getElementById('requestStatusModal').classList.add('hidden'); }
  async function confirmRequestStatus() {
    var dep = selectedActionDepartment(), value = document.getElementById('requestStatusSelect').value;
    var error = document.getElementById('requestStatusError'), button = document.getElementById('confirmRequestStatus');
    button.disabled = true;
    button.textContent = '保存中…';
    try {
      var result = await window.PatchworkAPI.updateDepartmentProgress(bug.id, dep, { status: value });
      if (!result || !result[0]) throw new Error('状态未保存');
      bug = result[0];
      closeRequestStatusModal();
      render();
      toast(dep + '状态已更新，其他部门不受影响。', 'success');
    } catch (e) {
      error.textContent = e.message || '状态更新失败。';
      error.classList.remove('hidden');
    } finally {
      button.disabled = false;
      button.textContent = '确认更改';
    }
  }
  function openRequestTransferModal() {
    var dep = selectedActionDepartment();
    if (!dep) return;
    ensureActionModals();
    var assigned = reportDepartments();
    document.getElementById('requestTransferDepartments').innerHTML = departments.map(function(item) {
      var itemState = window.PatchworkAPI.departmentState(bug, item), checked = assigned.indexOf(item) !== -1;
      var label = statusText[itemState.status] || '未分配';
      return '<label class="request-transfer-option"><input type="checkbox" value="' + esc(item) + '"' + (checked ? ' checked' : '') + '><span><strong>' + esc(item) + '</strong><small>' + (checked ? '当前：' + esc(label) : '当前：未分配') + '</small></span></label>';
    }).join('');
    document.getElementById('requestTransferInfo').textContent = reportLabel();
    document.getElementById('requestTransferReason').value = '';
    document.getElementById('requestTransferError').classList.add('hidden');
    document.getElementById('confirmRequestTransfer').textContent = '保存处理部门';
    document.getElementById('requestTransferModal').classList.remove('hidden');
  }
  function closeRequestTransferModal() { document.getElementById('requestTransferModal').classList.add('hidden'); }
  async function confirmRequestTransfer() {
    var targets = Array.from(document.querySelectorAll('#requestTransferDepartments input:checked')).map(function(input) { return input.value; });
    var error = document.getElementById('requestTransferError'), button = document.getElementById('confirmRequestTransfer'), note = document.getElementById('requestTransferReason').value.trim();
    if (!targets.length) { error.textContent = '请至少选择一个处理部门。'; error.classList.remove('hidden'); return; }
    button.disabled = true;
    try {
      var session = (await window.PATCHWORK_AUTH.getSession()).data.session;
      var rows = await window.PATCHWORK_SUPABASE.rpc('update_bug_departments', { p_bug_id: bug.id, p_departments: targets, p_note: note });
      if (rows.error) throw rows.error;
      await window.PatchworkAPI.createAssignmentEvent({ bug_id: bug.id, from_department: bug.assignee_department || '', to_department: targets.join(','), from_user_id: bug.follow_up_id || null, to_user_id: null, note: note, created_by: session.user.id });
      var refreshed = await window.PatchworkAPI.listBugs();
      bug = (refreshed || []).find(function(item) { return item.id === bug.id; }) || bug;
      closeRequestTransferModal();
      render();
      toast('处理部门已更新。', 'success');
    } catch (e) {
      error.textContent = e.message || '处理部门更新失败。';
      error.classList.remove('hidden');
    } finally {
      button.disabled = false;
      button.textContent = '保存处理部门';
    }
  }
  function openEditModal(){var form=document.getElementById('editProductRequestForm');['title','module','change_reason','before_logic','after_logic','exception_handling','impact_scope','desired_date'].forEach(function(name){form.elements[name].value=bug[name]||'';});editExistingAttachments=(bug.attachment_urls||[]).slice();editFiles=[];var fileInput=document.getElementById('editRequestAttachments');if(fileInput)fileInput.value='';renderEditAttachmentFiles();document.getElementById('editRequestCode').textContent=window.PatchworkAPI.reportCode(bug)+'｜'+(bug.title||'');document.getElementById('editProductRequestError').classList.add('hidden');document.getElementById('editProductRequestModal').classList.remove('hidden');}
  function closeEditModal(){document.getElementById('editProductRequestModal').classList.add('hidden');}
  async function saveEdit(event){event.preventDefault();var form=event.currentTarget,button=document.getElementById('saveProductRequestEdit'),error=document.getElementById('editProductRequestError');var patch={};['title','module','change_reason','before_logic','after_logic','exception_handling','impact_scope'].forEach(function(name){patch[name]=form.elements[name].value.trim();});patch.desired_date=form.elements.desired_date.value;patch.description=patch.change_reason;patch.repro_steps=patch.before_logic;patch.expected_result=patch.after_logic;patch.actual_result=patch.exception_handling;patch.updated_at=new Date().toISOString();button.disabled=true;button.textContent='保存中…';error.classList.add('hidden');try{var attachmentUrls=editExistingAttachments.slice();for(var i=0;i<editFiles.length;i+=1)attachmentUrls.push(await window.PatchworkAPI.uploadFile(editFiles[i]));patch.attachment_urls=attachmentUrls;var result=await window.PatchworkAPI.updateBug(bug.id,patch);if(!result||!result[0])throw new Error('需求未保存');bug=result[0];editFiles=[];closeEditModal();render();toast('产品修改需求内容已更新。','success');}catch(e){error.textContent=e.message||'需求修改失败。';error.classList.remove('hidden');}finally{button.disabled=false;button.textContent='保存修改';}}
  async function load(){try{await window.PATCHWORK_READY;var results=await Promise.all([window.PatchworkAPI.listBugs(),window.PatchworkAPI.listProfiles().catch(function(){return [];})]);var result=results[0];members=results[1]||[];bug=(result||[]).find(function(item){return item.id===id&&item.request_type==='product_change';});if(!bug)throw new Error('找不到该产品修改需求。');var profile=window.PATCHWORK_PROFILE||{},techLeader=isTechLeader(profile)&&reportDepartments().some(function(dep){return TECH_DEPARTMENTS.indexOf(dep)!==-1;});if(!techLeader){if(profile.role!=='admin'&&profile.department!=='产品'&&reportDepartments().indexOf(profile.department)===-1)throw new Error('当前账号没有查看该需求的权限。');if(profile.role!=='admin'&&profile.department==='产品'&&!profile.is_product_lead&&reportDepartments().indexOf(profile.department)===-1)throw new Error('仅产品负责人可查看此需求。');}render();}catch(e){toast(e.message||'产品修改需求加载失败。','error');}}
  document.getElementById('editProductRequest').addEventListener('click',openEditModal);document.getElementById('closeEditProductRequest').addEventListener('click',closeEditModal);document.getElementById('cancelEditProductRequest').addEventListener('click',closeEditModal);document.getElementById('editProductRequestModal').addEventListener('click',function(event){if(event.target===event.currentTarget)closeEditModal();});document.getElementById('editProductRequestForm').addEventListener('submit',saveEdit);
  var editAttachmentInput=document.getElementById('editRequestAttachments');if(editAttachmentInput)editAttachmentInput.addEventListener('change',function(){acceptEditFiles(editAttachmentInput.files);editAttachmentInput.value='';});
  var editDropzone=document.getElementById('editRequestDropzone');if(editDropzone){['dragenter','dragover'].forEach(function(name){editDropzone.addEventListener(name,function(event){event.preventDefault();editDropzone.classList.add('dragging');});});['dragleave','drop'].forEach(function(name){editDropzone.addEventListener(name,function(event){event.preventDefault();editDropzone.classList.remove('dragging');});});editDropzone.addEventListener('drop',function(event){acceptEditFiles(event.dataTransfer.files);});}
  ensureActionModals();
  document.getElementById('requestActionDepartment').addEventListener('change',render);
  document.getElementById('requestNoteButton').addEventListener('click',openRequestInlineNote);
  document.getElementById('requestAssigneeButton').addEventListener('click',openRequestAssigneeModal);
  document.getElementById('requestTransferButton').addEventListener('click',openRequestTransferModal);
  document.getElementById('requestStatusButton').addEventListener('click',openRequestStatusModal);
  load();
})();
