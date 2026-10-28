(function () {
  'use strict';
  var form = document.getElementById('productRequestForm'), input = document.getElementById('requestAttachments'), files = [], button = document.getElementById('requestSubmitButton');
  function toast(message) { var n = document.getElementById('toast'); n.textContent = message; n.className = 'toast show error'; setTimeout(function () { n.className = 'toast'; }, 4000); }
  function renderFiles() { document.getElementById('requestFileList').innerHTML = files.map(function (f,i) { return '<div class="file-item"><span class="file-type">FILE</span><span><strong>' + f.name.replace(/[&<>]/g,'') + '</strong><small>' + Math.ceil(f.size/1024) + ' KB</small></span><button type="button" data-remove-file="' + i + '">×</button></div>'; }).join(''); }
  input.addEventListener('change', function () { var incoming = Array.from(input.files); if (incoming.some(function (f) { return f.size > 10*1024*1024; })) { toast('每个附件不能超过 10 MB。'); return; } files = files.concat(incoming).slice(0,8); renderFiles(); input.value = ''; });
  document.getElementById('requestFileList').addEventListener('click', function (e) { var b=e.target.closest('[data-remove-file]'); if (b) { files.splice(Number(b.dataset.removeFile),1); renderFiles(); } });
  form.addEventListener('submit', async function (e) {
    e.preventDefault(); var err=document.getElementById('requestError'); err.classList.add('hidden');
    await window.PATCHWORK_READY;
    var profile=window.PATCHWORK_PROFILE; if (!profile || (!window.PatchworkRoles.productWorkspace(profile) && profile.role !== 'admin')) { err.textContent='仅产品负责人或产品副负责人可提交产品修改需求。'; err.classList.remove('hidden'); return; }
    var deps=Array.from(form.querySelectorAll('input[name="departments"]:checked')).map(function(x){return x.value;}); if(!deps.length){err.textContent='请至少选择一个归属部门。';err.classList.remove('hidden');return;}
    button.disabled=true; button.querySelector('span').textContent='提交中…';
    try {
      var data=Object.fromEntries(new FormData(form).entries()); delete data.departments; delete data.reporter; data.assignee_department=deps.join(','); data.reporter=profile.full_name||profile.username; data.submitter_id=profile.id; data.request_type='product_change'; data.submission_source='product_change'; data.status='open'; data.importance='medium'; data.assignee=''; data.fix_plan=''; data.resolved_at=null; data.attachment_urls=[];
      // bug_reports also enforces the legacy required bug fields; map the matching request details into them.
      if (window.PatchworkRoles.productDeputy(profile)) data.status='pending_review_1';
      data.description=data.change_reason;
      data.repro_steps=data.before_logic;
      data.expected_result=data.after_logic;
      data.actual_result=data.exception_handling;
      for(var i=0;i<files.length;i++) data.attachment_urls.push(await window.PatchworkAPI.uploadFile(files[i]));
      var created=await window.PatchworkAPI.createBug(data), row=created&&created[0];
      window.alert((data.status === 'open' ? '产品修改需求已分发。' : '产品修改需求已提交，等待产品负责人审核。') + '编号：' + window.PatchworkAPI.reportCode(row));
      window.location.href='product-change-requests.html';
    } catch(error) { err.textContent=error.message||'提交失败。'; err.classList.remove('hidden'); }
    finally { button.disabled=false; button.querySelector('span').textContent=window.PatchworkRoles.productDeputy(profile)?'提交负责人审核':'提交并分发'; }
  });
  window.PATCHWORK_READY.then(function () { if (window.PatchworkRoles.productDeputy(window.PATCHWORK_PROFILE)) { document.querySelector('.bug-submit-title > p:last-child').textContent='副负责人提交的修改需求须经产品负责人审核，通过后分发至所选部门。'; button.querySelector('span').textContent='提交负责人审核'; } });
})();
