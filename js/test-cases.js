(function () {
  'use strict';
  var rows = [], form = document.getElementById('caseForm'), list = document.getElementById('caseList'), batchMode = false, sortAscending = false;
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
  function zipName() {
    var now = new Date();
    var pad = function (value) { return String(value).padStart(2, '0'); };
    return 'test-cases-' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + '-' + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds()) + '.zip';
  }
  function render() {
    var empty = document.getElementById('caseEmpty');
    list.innerHTML = rows.map(function (row) {
      var fileType = row.file_type || (row.title && row.title.toLowerCase().includes('.doc') ? 'Word' : row.title && row.title.toLowerCase().includes('.xls') ? 'Excel' : '表单');
      var note = row.note || row.module || '—';
      var download = row.file_url ? '<a class="case-download-link" href="' + esc(row.file_url) + '" download="' + esc(downloadName(row)) + '" data-case-download="' + esc(row.id) + '">下载</a>' : '<span class="case-download-link disabled">下载</span>';
      var checkbox = batchMode ? '<input class="case-select" type="checkbox" data-case-select="' + esc(row.id) + '" aria-label="选择 ' + esc(row.file_name || row.title) + '">' : '';
      return '<tr><td>' + checkbox + '</td><td>TC-' + String(row.case_no).padStart(3, '0') + '</td><td class="case-file-name">' + esc(row.file_name || row.title) + '</td><td>' + esc(row.submitter_name || row.submitter || '当前成员') + '</td><td>' + new Date(row.created_at).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) + '</td><td>' + esc(fileType) + '</td><td>' + esc(note) + '</td><td>' + download + '</td></tr>';
    }).join('');
    empty.classList.toggle('hidden', rows.length !== 0);
  }
  function visibleRows() { var query = (document.getElementById('caseSearch').value || '').trim().toLowerCase(); return rows.filter(function (row) { return !query || [row.title, row.file_name, row.module, row.submitter_name, row.submitter, row.steps, row.status].join(' ').toLowerCase().includes(query); }); }
  async function load() {
    try {
      var result = await Promise.all([window.PatchworkAPI.listTestCases(), window.PatchworkAPI.listProfiles()]);
      var profiles = result[1] || [];
      var profileMap = profiles.reduce(function (map, profile) { map[profile.id] = profile; return map; }, {});
      rows = (result[0] || []).map(function (row) {
        var profile = profileMap[row.submitter_id];
        return Object.assign({}, row, { submitter_name: profile ? (profile.full_name || profile.username) : '未知用户' });
      });
      render();
    } catch (error) { toast(error.message, 'error'); }
  }
  form.addEventListener('submit', async function (event) { event.preventDefault(); var button = form.querySelector('button'); button.disabled = true; try { var data = Object.fromEntries(new FormData(form).entries()); var session = (await window.PATCHWORK_AUTH.getSession()).data.session; data.submitter_id = session.user.id; rows.unshift((await window.PatchworkAPI.createTestCase(data))[0]); form.reset(); render(); toast('测试用例已提交。', 'success'); } catch (error) { toast(error.message, 'error'); } finally { button.disabled = false; } });
  document.getElementById('exportCases').addEventListener('click', async function () {
    if (!batchMode) { batchMode = true; document.getElementById('caseSelectHeading').classList.remove('hidden'); this.textContent = '下载已选文件（ZIP）'; render(); return; }
    var selected = Array.from(document.querySelectorAll('[data-case-select]:checked')).map(function (node) { return rows.find(function (row) { return String(row.id) === node.dataset.caseSelect; }); }).filter(function (row) { return row && row.file_url; });
    if (!selected.length) { toast('请先勾选要下载的测试用例。', ''); return; }
    if (!window.JSZip) { toast('ZIP 组件加载失败，请刷新页面后重试。', 'error'); return; }
    var button = this; button.disabled = true; button.textContent = '正在打包…';
    try { var zip = new window.JSZip(); for (var i = 0; i < selected.length; i += 1) zip.file(downloadName(selected[i]), await window.PatchworkAPI.downloadFile(selected[i].file_url)); var blob = await zip.generateAsync({ type: 'blob' }); var link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = zipName(); link.click(); toast('ZIP 文件已生成。', 'success'); }
    catch (error) { toast(error.message || '打包下载失败。', 'error'); }
    finally { button.disabled = false; button.textContent = '下载已选文件（ZIP）'; }
  });
  document.getElementById('caseSortIcon').textContent = '↓';
  document.getElementById('sortCaseNo').addEventListener('click', function () { sortAscending = !sortAscending; rows.sort(function (a, b) { return (Number(a.case_no) - Number(b.case_no)) * (sortAscending ? 1 : -1); }); document.getElementById('caseSortIcon').textContent = sortAscending ? '↑' : '↓'; render(); });
  document.getElementById('selectAllCases').addEventListener('change', function (event) { document.querySelectorAll('[data-case-select]').forEach(function (node) { node.checked = event.target.checked; }); });
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
