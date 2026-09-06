(function () {
  'use strict';
  var rows = [], list = document.getElementById('bugReportList');
  function esc(value) { return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function formatDate(value) { return value ? new Date(value).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'; }
  function toast(text, type) { var node = document.getElementById('toast'); node.textContent = text; node.className = 'toast show ' + (type || ''); setTimeout(function () { node.className = 'toast'; }, 3200); }
  function render() {
    var query = document.getElementById('bugReportSearch').value.trim().toLowerCase();
    var department = document.getElementById('bugReportDepartment').value;
    var status = document.getElementById('bugReportStatus').value;
    var visible = rows.filter(function (bug) { return (!query || String(bug.title || '').toLowerCase().includes(query)) && (department === 'all' || bug.assignee_department === department) && (status === 'all' || bug.status === status); });
    list.innerHTML = visible.map(function (bug) { var importance = { heavy: '严重', medium: '一般', light: '轻微' }[bug.importance] || bug.importance || '—'; var state = { open: '待处理', in_progress: '处理中', resolved: '已解决' }[bug.status] || bug.status || '—'; return '<tr><td>BUG-' + esc(bug.id.slice(0, 8).toUpperCase()) + '</td><td class="case-file-name">' + esc(bug.title) + '</td><td>' + esc(bug.reporter || '—') + '</td><td>' + esc(bug.assignee_department || '—') + '</td><td>' + esc(bug.assignee || '—') + '</td><td>' + esc(state) + '</td><td class="' + (bug.importance === 'heavy' ? 'department-severe' : '') + '">' + esc(importance) + '</td><td>' + formatDate(bug.updated_at || bug.created_at) + '</td><td><button class="case-download-link" type="button" data-bug-id="' + esc(bug.id) + '">查看详情</button></td></tr>'; }).join('');
    document.getElementById('bugReportEmpty').classList.toggle('hidden', visible.length !== 0);
  }
  async function load() { try { rows = await window.PatchworkAPI.listBugs(); render(); } catch (error) { toast(error.message || '缺陷列表加载失败。', 'error'); } }
  ['bugReportSearch', 'bugReportDepartment', 'bugReportStatus'].forEach(function (id) { var node = document.getElementById(id); node.addEventListener('input', render); node.addEventListener('change', render); });
  document.getElementById('newBugReport').addEventListener('click', function () { window.location.href = 'submit-bug.html'; });
  list.addEventListener('click', function (event) { var button = event.target.closest('[data-bug-id]'); if (button) window.location.href = 'submit-bug.html?bug=' + encodeURIComponent(button.dataset.bugId); });
  window.PATCHWORK_READY.then(load).catch(function (error) { toast(error.message, 'error'); });
})();
