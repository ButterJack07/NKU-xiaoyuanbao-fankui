(function () {
  'use strict';
  var rows = [], form = document.getElementById('caseForm'), list = document.getElementById('caseList');
  function toast(text, type) { var node = document.getElementById('toast'); node.textContent = text; node.className = 'toast show ' + (type || ''); setTimeout(function () { node.className = 'toast'; }, 3500); }
  function esc(value) { return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function downloadName(row) {
    var original = row.file_name || row.title || '';
    var dot = original.lastIndexOf('.');
    var extension = dot >= 0 ? original.slice(dot).toLowerCase().replace(/[^a-z0-9.]/g, '') : '';
    if (!extension && row.file_type) {
      extension = ({ Word: '.docx', Excel: '.xlsx', CSV: '.csv', PDF: '.pdf', ZIP: '.zip' })[row.file_type] || '';
    }
    return 'TC-' + String(row.case_no).padStart(3, '0') + extension;
  }
  function render() {
    var empty = document.getElementById('caseEmpty');
    list.innerHTML = rows.map(function (row) {
      var fileType = row.file_type || (row.title && row.title.toLowerCase().includes('.doc') ? 'Word' : row.title && row.title.toLowerCase().includes('.xls') ? 'Excel' : '表单');
      var note = row.note || row.module || '—';
      var download = row.file_url ? '<a class="case-download-link" href="' + esc(row.file_url) + '" download="' + esc(downloadName(row)) + '" data-case-download="' + esc(row.id) + '">下载</a>' : '<span class="case-download-link disabled">下载</span>';
      return '<tr><td>TC-' + String(row.case_no).padStart(3, '0') + '</td><td class="case-file-name">' + esc(row.file_name || row.title) + '</td><td>' + esc(row.submitter_name || row.submitter || '当前成员') + '</td><td>' + new Date(row.created_at).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) + '</td><td>' + esc(fileType) + '</td><td>' + esc(note) + '</td><td>' + download + '</td></tr>';
    }).join('');
    empty.classList.toggle('hidden', rows.length !== 0);
  }
  function visibleRows() { var query = (document.getElementById('caseSearch').value || '').trim().toLowerCase(); return rows.filter(function (row) { return !query || [row.title, row.file_name, row.module, row.submitter_name, row.submitter, row.steps, row.status].join(' ').toLowerCase().includes(query); }); }
  async function load() { try { rows = await window.PatchworkAPI.listTestCases(); render(); } catch (error) { toast(error.message, 'error'); } }
  form.addEventListener('submit', async function (event) { event.preventDefault(); var button = form.querySelector('button'); button.disabled = true; try { var data = Object.fromEntries(new FormData(form).entries()); var session = (await window.PATCHWORK_AUTH.getSession()).data.session; data.submitter_id = session.user.id; rows.unshift((await window.PatchworkAPI.createTestCase(data))[0]); form.reset(); render(); toast('测试用例已提交。', 'success'); } catch (error) { toast(error.message, 'error'); } finally { button.disabled = false; } });
  document.getElementById('exportCases').addEventListener('click', function () { var csv = '\ufeff编号,标题,模块,前置条件,步骤,预期结果,优先级,状态\n' + rows.map(function (r) { return [r.case_no, r.title, r.module, r.preconditions, r.steps, r.expected_result, r.priority, r.status].map(function (v) { return '"' + String(v || '').replace(/"/g, '""') + '"'; }).join(','); }).join('\n'); var link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); link.download = 'test-cases.csv'; link.click(); });
  document.getElementById('caseSearch').addEventListener('input', function () { var original = rows; rows = visibleRows(); render(); rows = original; });
  list.addEventListener('click', async function (event) {
    var link = event.target.closest('[data-case-download]');
    if (!link) return;
    event.preventDefault();
    var row = rows.find(function (item) { return String(item.id) === link.dataset.caseDownload; });
    if (!row || !row.file_url) return;
    link.textContent = '下载中…';
    try {
      var response = await fetch(row.file_url);
      if (!response.ok) throw new Error('文件下载失败');
      var blob = await response.blob();
      var objectUrl = URL.createObjectURL(blob);
      var anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = downloadName(row);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      window.open(row.file_url, '_blank', 'noopener');
    } finally { link.textContent = '下载'; }
  });
  document.getElementById('uploadCaseButton').addEventListener('click', function () { window.location.href = 'upload-test-case.html'; });
  window.PATCHWORK_READY.then(load);
})();
