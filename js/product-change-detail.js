(function () {
  'use strict';
  var id = new URLSearchParams(location.search).get('bug'), bug, departments = ['技术—前端','技术—后端','设计','产品'], editExistingAttachments = [], editFiles = [];
  var TECH_DEPARTMENTS = ['技术—前端','技术—后端'];
  function isTechLeader(profile) { return Boolean(profile && profile.role === 'leader' && TECH_DEPARTMENTS.indexOf(profile.department) !== -1); }
  var statusText = { open:'未处理', in_progress:'处理中', resolved:'已完成' };
  function esc(v) { return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function toast(message, type) { var n=document.getElementById('toast'); n.textContent=message; n.className='toast show '+(type||''); setTimeout(function(){n.className='toast';},3500); }
  function isProductManager(profile) { return Boolean(profile && (profile.role === 'admin' || (profile.department === '产品' && profile.is_product_lead))); }
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
    var profile=window.PATCHWORK_PROFILE||{}, ownDept=profile.department;
    document.getElementById('requestNotice').textContent='各部门处理进度由对应部门在缺陷列表中维护。';
    document.getElementById('requestEditAction').classList.toggle('hidden', !isProductManager(profile));
    document.getElementById('requestDepartmentRows').innerHTML=reportDepartments().map(function(dep){
      var item=window.PatchworkAPI.departmentState(bug,dep), label=statusText[item.status]||item.status||'未处理';
      var canComment=profile.role==='admin'||profile.department===dep;
      var noteEditor=canComment?'<form class="request-note-form" data-note-form="'+esc(dep)+'"><label><span>添加跟进备注</span><textarea name="note" rows="2" maxlength="3000" placeholder="补充本部门处理进展"></textarea></label><button class="case-action-button" type="submit">添加备注</button><p class="request-note-feedback hidden" aria-live="polite"></p></form>':'';
      return '<article class="request-department-card"><header><div class="request-department-identity"><span class="request-department-mark">'+esc(dep.slice(-2))+'</span><div><strong>'+esc(dep)+'</strong><small>处理部门</small></div></div><span class="overview-status overview-'+esc(item.status)+'">'+esc(label)+'</span></header><div class="request-department-meta"><div><span>跟进人</span><strong>'+esc(item.assignee||'未指定')+'</strong></div><div><span>处理状态</span><strong>'+esc(label)+'</strong></div></div><div class="request-department-note"><span>跟进备注</span><p>'+esc(item.note||'暂无备注')+'</p></div>'+noteEditor+'</article>';
    }).join('');
    document.querySelectorAll('[data-note-form]').forEach(function(form){form.onsubmit=async function(event){event.preventDefault();var dep=form.dataset.noteForm,textarea=form.elements.note,value=textarea.value.trim(),feedback=form.querySelector('.request-note-feedback'),button=form.querySelector('button[type="submit"]');if(!value){feedback.textContent='请填写跟进备注。';feedback.classList.remove('hidden');return;}button.disabled=true;feedback.classList.add('hidden');try{var result=await window.PatchworkAPI.updateDepartmentProgress(bug.id,dep,{note:value});if(!result||!result[0])throw new Error('备注未保存');bug=result[0];render();toast(dep+'跟进备注已添加。','success');}catch(error){feedback.textContent=error.message||'备注保存失败。';feedback.classList.remove('hidden');button.disabled=false;}};});
  }
  function openEditModal(){var form=document.getElementById('editProductRequestForm');['title','module','change_reason','before_logic','after_logic','exception_handling','impact_scope','desired_date'].forEach(function(name){form.elements[name].value=bug[name]||'';});editExistingAttachments=(bug.attachment_urls||[]).slice();editFiles=[];var fileInput=document.getElementById('editRequestAttachments');if(fileInput)fileInput.value='';renderEditAttachmentFiles();document.getElementById('editRequestCode').textContent=window.PatchworkAPI.reportCode(bug)+'｜'+(bug.title||'');document.getElementById('editProductRequestError').classList.add('hidden');document.getElementById('editProductRequestModal').classList.remove('hidden');}
  function closeEditModal(){document.getElementById('editProductRequestModal').classList.add('hidden');}
  async function saveEdit(event){event.preventDefault();var form=event.currentTarget,button=document.getElementById('saveProductRequestEdit'),error=document.getElementById('editProductRequestError');var patch={};['title','module','change_reason','before_logic','after_logic','exception_handling','impact_scope'].forEach(function(name){patch[name]=form.elements[name].value.trim();});patch.desired_date=form.elements.desired_date.value;patch.description=patch.change_reason;patch.repro_steps=patch.before_logic;patch.expected_result=patch.after_logic;patch.actual_result=patch.exception_handling;patch.updated_at=new Date().toISOString();button.disabled=true;button.textContent='保存中…';error.classList.add('hidden');try{var attachmentUrls=editExistingAttachments.slice();for(var i=0;i<editFiles.length;i+=1)attachmentUrls.push(await window.PatchworkAPI.uploadFile(editFiles[i]));patch.attachment_urls=attachmentUrls;var result=await window.PatchworkAPI.updateBug(bug.id,patch);if(!result||!result[0])throw new Error('需求未保存');bug=result[0];editFiles=[];closeEditModal();render();toast('产品修改需求内容已更新。','success');}catch(e){error.textContent=e.message||'需求修改失败。';error.classList.remove('hidden');}finally{button.disabled=false;button.textContent='保存修改';}}
  async function load(){try{await window.PATCHWORK_READY;var result=await window.PatchworkAPI.listBugs();bug=(result||[]).find(function(item){return item.id===id&&item.request_type==='product_change';});if(!bug)throw new Error('找不到该产品修改需求。');var profile=window.PATCHWORK_PROFILE||{},techLeader=isTechLeader(profile)&&reportDepartments().some(function(dep){return TECH_DEPARTMENTS.indexOf(dep)!==-1;});if(!techLeader){if(profile.role!=='admin'&&profile.department!=='产品'&&reportDepartments().indexOf(profile.department)===-1)throw new Error('当前账号没有查看该需求的权限。');if(profile.role!=='admin'&&profile.department==='产品'&&!profile.is_product_lead&&reportDepartments().indexOf(profile.department)===-1)throw new Error('仅产品负责人可查看此需求。');}render();}catch(e){toast(e.message||'产品修改需求加载失败。','error');}}
  document.getElementById('editProductRequest').addEventListener('click',openEditModal);document.getElementById('closeEditProductRequest').addEventListener('click',closeEditModal);document.getElementById('cancelEditProductRequest').addEventListener('click',closeEditModal);document.getElementById('editProductRequestModal').addEventListener('click',function(event){if(event.target===event.currentTarget)closeEditModal();});document.getElementById('editProductRequestForm').addEventListener('submit',saveEdit);
  var editAttachmentInput=document.getElementById('editRequestAttachments');if(editAttachmentInput)editAttachmentInput.addEventListener('change',function(){acceptEditFiles(editAttachmentInput.files);editAttachmentInput.value='';});
  var editDropzone=document.getElementById('editRequestDropzone');if(editDropzone){['dragenter','dragover'].forEach(function(name){editDropzone.addEventListener(name,function(event){event.preventDefault();editDropzone.classList.add('dragging');});});['dragleave','drop'].forEach(function(name){editDropzone.addEventListener(name,function(event){event.preventDefault();editDropzone.classList.remove('dragging');});});editDropzone.addEventListener('drop',function(event){acceptEditFiles(event.dataTransfer.files);});}
  load();
})();
