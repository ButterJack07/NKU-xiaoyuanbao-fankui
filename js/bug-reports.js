(function () {
  'use strict';
  var rows = [], profiles = [], list = document.getElementById('bugReportList'), departmentFromUrl = new URLSearchParams(window.location.search).get('department'), isDepartmentPage = document.body.classList.contains('department-bugs-page');
  function esc(value) { return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function formatDate(value) { return value ? new Date(value).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'; }
  function toast(text, type) { var node = document.getElementById('toast'); node.textContent = text; node.className = 'toast show ' + (type || ''); setTimeout(function () { node.className = 'toast'; }, 3200); }
  function profileFor(id) { return profiles.find(function (profile) { return profile.id === id; }); }
  function personLink(id, fallback, type) { var person = profileFor(id); if (!person && !fallback) return '—'; var label = person ? (person.full_name || person.username) : fallback; return '<button class="person-link" type="button" data-person-id="' + esc(id || '') + '" data-person-type="' + type + '">' + esc(label) + '</button>'; }
  function openContactModal(id, fallback, type) { var person = profileFor(id); var label = person ? (person.full_name || person.username) : (fallback || '—'); var department = person ? (person.department === '测试' ? '测试组' : person.department) : '—'; var modal = document.getElementById('contactModal'); if (!modal) { modal = document.createElement('div'); modal.id = 'contactModal'; modal.className = 'modal-backdrop'; document.body.appendChild(modal); } modal.innerHTML = '<section class="user-modal contact-modal"><div class="developer-modal-header"><div><h2>' + (type === 'assignee' ? '跟进人联系方式' : '提交人联系方式') + '</h2><p class="user-modal-identity">' + esc('缺陷相关人员') + '</p><p class="user-modal-help">用于缺陷沟通，请优先在可联系时间内联系。</p></div><button class="icon-button" type="button" data-close-contact>×</button></div><div class="contact-content"><strong>人员信息</strong><div class="contact-card"><b>' + esc(label) + '｜' + esc(department) + '</b><span>微信：' + esc(person && person.wechat || '—') + '　QQ：' + esc(person && person.qq || '—') + '</span><span>电话：' + esc(person && person.phone || '—') + '</span><span>可联系时间：' + esc(person && person.contact_time || '—') + '</span></div><div class="contact-actions"><button class="case-action-button" type="button" data-close-contact>关闭</button></div></div></section>'; modal.querySelectorAll('[data-close-contact]').forEach(function (button) { button.onclick = function () { modal.classList.add('hidden'); }; }); modal.classList.remove('hidden'); }
  function render() {
    var query = document.getElementById('bugReportSearch').value.trim().toLowerCase();
    var department = departmentFromUrl || document.getElementById('bugReportDepartment').value;
    var status = document.getElementById('bugReportStatus').value;
    var myOnly = document.getElementById('myBugFilter').checked;
    var profile = window.PATCHWORK_PROFILE;
    var visible = rows.filter(function (bug) { var mine = profile && (bug.submitter_id === profile.id || bug.assignee_id === profile.id || bug.follow_up_id === profile.id); return (!query || String(bug.title || '').toLowerCase().includes(query)) && (department === 'all' || bug.assignee_department === department) && (status === 'all' || bug.status === status) && (!myOnly || mine); });
    list.innerHTML = visible.map(function (bug) { var importance = { heavy: '严重', medium: '一般', light: '轻微' }[bug.importance] || bug.importance || '—'; var state = { open: '未完成', in_progress: '处理中', resolved: '已完成' }[bug.status] || bug.status || '—'; var stateClass = bug.status === 'resolved' ? 'bug-status-done' : bug.status === 'in_progress' ? 'bug-status-progress' : 'bug-status-open'; var code = bug.bug_no ? 'BUG-' + String(bug.bug_no).padStart(4, '0') : 'BUG-0001'; var departmentCell = departmentFromUrl ? '' : '<td>' + esc(bug.assignee_department || '—') + '</td>'; return '<tr><td>' + code + '</td><td class="case-file-name">' + esc(bug.title) + '</td><td>' + personLink(bug.submitter_id, bug.reporter, 'submitter') + '</td>' + departmentCell + '<td>' + personLink(bug.assignee_id || bug.follow_up_id, bug.assignee, 'assignee') + '</td><td class="' + stateClass + '">' + esc(state) + '</td><td class="' + (bug.importance === 'heavy' ? 'department-severe' : '') + '">' + esc(importance) + '</td><td>' + formatDate(bug.updated_at || bug.created_at) + '</td><td><button class="case-download-link" type="button" data-bug-id="' + esc(bug.id) + '">查看详情</button></td></tr>'; }).join('');
    document.getElementById('bugReportEmpty').classList.toggle('hidden', visible.length !== 0);
  }
  function exportReports() {
    var query = document.getElementById('bugReportSearch').value.trim().toLowerCase();
    var department = departmentFromUrl || document.getElementById('bugReportDepartment').value;
    var status = document.getElementById('bugReportStatus').value;
    var visible = rows.filter(function (bug) { return (!query || String(bug.title || '').toLowerCase().includes(query)) && (department === 'all' || bug.assignee_department === department) && (status === 'all' || bug.status === status); });
    var csv = '\ufeff缺陷编号,问题标题,提交人,归属部门,当前跟进人,状态,严重程度,最后更新时间\n' + visible.map(function (bug) { var values = [bug.bug_no ? 'BUG-' + String(bug.bug_no).padStart(4, '0') : 'BUG-0001', bug.title, bug.reporter, bug.assignee_department, bug.assignee, { open: '待处理', in_progress: '处理中', resolved: '已解决' }[bug.status] || bug.status, { heavy: '严重', medium: '一般', light: '轻微' }[bug.importance] || bug.importance, formatDate(bug.updated_at || bug.created_at)]; return values.map(function (value) { return '"' + String(value || '').replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); link.download = (department === 'all' ? 'bug-reports' : department + '-bug-reports') + '.csv'; link.click();
  }
  function setupDepartmentView() {
    var breadcrumbBar = document.querySelector('.bug-report-breadcrumb');
    if (!departmentFromUrl) {
      if (breadcrumbBar) breadcrumbBar.classList.remove('hidden');
      return;
    }
    if (breadcrumbBar) breadcrumbBar.classList.add('hidden');
    document.querySelectorAll('.bug-department-column').forEach(function (node) { node.classList.add('hidden'); });
    document.getElementById('bugReportTable').classList.add('department-only-table');
    var title = document.getElementById(isDepartmentPage ? 'departmentBugTitle' : 'bugReportTitle');
    var breadcrumb = document.getElementById('bugReportBreadcrumb');
    var description = document.getElementById(isDepartmentPage ? 'departmentBugDescription' : 'bugReportDescription');
    var departmentSelect = document.getElementById('bugReportDepartment');
    if (title) title.textContent = departmentFromUrl + '缺陷列表';
    if (breadcrumb) breadcrumb.textContent = departmentFromUrl + '缺陷列表';
    var descriptions = {
      '技术—前端': '仅显示归属于技术—前端部门的缺陷；本部门成员可查看、指定跟进人与处理；转组仅本部门组长、超级管理员可操作。',
      '技术—后端': '仅显示归属于技术—后端部门的缺陷；本部门成员可查看、指定跟进人与处理；转组仅本部门组长、超级管理员可操作。',
      '设计': '仅显示归属于设计部门的缺陷；本部门成员可查看、指定跟进人与处理；转组仅本部门组长、超级管理员可操作。',
      '产品': '仅显示归属于产品部门的缺陷；本部门成员可查看、指定跟进人与处理；转组仅本部门组长、超级管理员可操作。'
    };
    if (description) description.textContent = descriptions[departmentFromUrl] || '仅显示归属于' + departmentFromUrl + '部门的缺陷；本部门成员可查看、指定跟进人与处理；转组仅本部门组长、超级管理员可操作。';
    if (departmentSelect) {
      departmentSelect.value = departmentFromUrl;
      departmentSelect.disabled = true;
      departmentSelect.classList.add('hidden');
      departmentSelect.setAttribute('aria-label', '当前部门');
    }
    document.title = '校缘宝内测管理网站 · ' + departmentFromUrl + '缺陷列表';
  }
  async function load() { try { var result = await Promise.all([window.PatchworkAPI.listBugs(), window.PatchworkAPI.listProfiles()]); rows = result[0]; profiles = result[1] || []; render(); } catch (error) { toast(error.message || '缺陷列表加载失败。', 'error'); } }
  ['bugReportSearch', 'bugReportDepartment', 'bugReportStatus', 'myBugFilter'].forEach(function (id) { var node = document.getElementById(id); node.addEventListener('input', render); node.addEventListener('change', render); });
  var newBugReport = document.getElementById('newBugReport');
  if (newBugReport) newBugReport.addEventListener('click', function () { window.location.href = 'submit-bug.html'; });
  document.getElementById('exportBugReports').addEventListener('click', exportReports);
  list.addEventListener('click', function (event) { var person = event.target.closest('[data-person-id]'); if (person) { event.stopPropagation(); openContactModal(person.dataset.personId, person.textContent, person.dataset.personType); return; } var button = event.target.closest('[data-bug-id]'); if (button) window.location.href = 'bug-detail.html?bug=' + encodeURIComponent(button.dataset.bugId) + (departmentFromUrl ? '&department=' + encodeURIComponent(departmentFromUrl) : ''); });
  if (departmentFromUrl && newBugReport) newBugReport.classList.add('hidden');
  if (!departmentFromUrl && !isDepartmentPage) document.getElementById('exportBugReports').classList.add('hidden');
  setupDepartmentView();
  window.PATCHWORK_READY.then(load).catch(function (error) { toast(error.message, 'error'); });
})();
