(function () {
  'use strict';
  var rows = [], list = document.getElementById('requestRows');
  function esc(v) { return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
   function overall(bug) { if (['pending_review_1','rejected'].includes(bug.status)) return bug.status; var ds = String(bug.assignee_department || '').split(',').filter(Boolean); var states = ds.map(function (d) { return window.PatchworkAPI.departmentState(bug,d).status; }); return states.length && states.every(function (s) { return s === 'resolved'; }) ? 'resolved' : states.some(function (s) { return s !== 'open'; }) ? 'in_progress' : 'open'; }
  function render() {
    var q = document.getElementById('requestSearch').value.trim().toLowerCase(), s = document.getElementById('requestStatus').value;
    var visible = rows.filter(function (b) { var state = overall(b); return (s === 'all' || s === state) && (!q || ('PRO-' + String(b.product_request_no).padStart(4,'0') + ' ' + b.title).toLowerCase().includes(q)); });
    list.innerHTML = visible.map(function (b) { var state = overall(b), text = {open:'未处理',in_progress:'处理中',resolved:'已完成'}[state]; return '<tr><td>' + esc(window.PatchworkAPI.reportCode(b)) + '</td><td class="case-file-name">' + esc(b.title) + '</td><td>' + esc(b.reporter) + '</td><td>' + esc(String(b.assignee_department || '').split(',').join('、')) + '</td><td>' + esc(text) + '</td><td>' + esc(b.desired_date || '—') + '</td><td>' + new Date(b.created_at).toLocaleString('zh-CN') + '</td><td><button class="case-download-link" type="button" data-request-id="' + esc(b.id) + '">查看详情</button></td></tr>'; }).join('');
    document.getElementById('requestEmpty').classList.toggle('hidden', visible.length > 0);
    Array.from(list.rows).forEach(function(tr,index){ var state=overall(visible[index]); if(state==='pending_review_1')tr.cells[4].textContent='待产品负责人审核'; if(state==='rejected')tr.cells[4].textContent='已驳回'; });
  }
  async function load() {
    await window.PATCHWORK_READY;
    var profile = window.PATCHWORK_PROFILE;
    if (!profile || (!window.PatchworkRoles.productWorkspace(profile) && profile.role !== 'admin')) { window.location.replace('index.html'); return; }
    try { var all = await window.PatchworkAPI.listBugs(); rows = all.filter(function (b) { return b.request_type === 'product_change'; }); render(); }
    catch (e) { window.alert(e.message || '产品修改需求加载失败。'); }
  }
  document.getElementById('requestSearch').addEventListener('input', render);
  document.getElementById('requestStatus').insertAdjacentHTML('beforeend','<option value="pending_review_1">待产品负责人审核</option><option value="rejected">已驳回</option>');
  document.getElementById('requestStatus').addEventListener('change', render);
  document.getElementById('submitProductRequest').onclick = function () { window.location.href = 'submit-product-request.html'; };
  list.addEventListener('click', function (e) { var button = e.target.closest('[data-request-id]'); if (button) window.location.href = 'product-change-detail.html?bug=' + encodeURIComponent(button.dataset.requestId); });
  window.PATCHWORK_READY.then(load).catch(function (e) { window.alert(e.message); });
})();
