(function () {
  'use strict';
  var rows = [], departments = ['技术—前端', '技术—后端', '设计', '产品'];
  var labels = { open: '未处理', in_progress: '处理中', resolved: '已完成', undistributed: '未分发' };
  var colors = { resolved: '#39896a', in_progress: '#e7a139', open: '#e77664', undistributed: '#b5b8c0' };
  function esc(value) { return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function assigned(bug) { return String(bug.assignee_department || '').split(',').filter(Boolean); }
  function overall(bug) {
    if (!['open', 'in_progress', 'resolved'].includes(bug.status)) return 'undistributed';
    var states = assigned(bug).map(function (dep) { return window.PatchworkAPI.departmentState(bug, dep).status; });
    if (states.length && states.every(function (state) { return state === 'resolved'; })) return 'resolved';
    return states.some(function (state) { return state !== 'open'; }) ? 'in_progress' : 'open';
  }
  function pill(state) { return '<span class="overview-status overview-' + state + '">' + labels[state] + '</span>'; }
  function render() {
    var counts = { resolved: 0, in_progress: 0, open: 0, undistributed: 0 };
    rows.forEach(function (bug) { counts[overall(bug)] += 1; });
    var offset = 0, segments = [];
    Object.keys(counts).forEach(function (state) { var end = offset + (rows.length ? counts[state] / rows.length * 100 : 0); if (end > offset) segments.push(colors[state] + ' ' + offset + '% ' + end + '%'); offset = end; });
    document.getElementById('progressRing').style.background = segments.length ? 'conic-gradient(' + segments.join(',') + ')' : '#e7e7e7';
    document.getElementById('progressRing').setAttribute('aria-label', Object.keys(counts).map(function (state) { return labels[state] + counts[state] + '份'; }).join('，'));
    document.getElementById('overviewTotal').textContent = rows.length;
    document.getElementById('overviewLegend').innerHTML = Object.keys(counts).map(function (state) { return '<div><i style="background:' + colors[state] + '"></i><span>' + labels[state] + '</span><strong>' + counts[state] + '</strong></div>'; }).join('');
    var query = document.getElementById('overviewSearch').value.trim().toLowerCase(), selected = document.getElementById('overviewStatus').value;
    var visible = rows.filter(function (bug) { return (selected === 'all' || overall(bug) === selected) && (!query || (window.PatchworkAPI.reportCode(bug) + ' ' + bug.title).toLowerCase().includes(query)); });
    document.getElementById('overviewRows').innerHTML = visible.map(function (bug) {
      return '<tr><td>' + esc(window.PatchworkAPI.reportCode(bug)) + '</td><td class="case-file-name" title="' + esc(bug.title) + '">' + (bug.request_type === 'product_change' ? '<small>产品</small> ' : '') + esc(bug.title) + '</td><td>' + pill(overall(bug)) + '</td>' + departments.map(function (dep) {
        if (!assigned(bug).includes(dep)) return '<td class="overview-unassigned">未分配</td>';
        return '<td>' + pill(overall(bug) === 'undistributed' ? 'undistributed' : window.PatchworkAPI.departmentState(bug, dep).status) + '</td>';
      }).join('') + '</tr>';
    }).join('');
    document.getElementById('overviewEmpty').classList.toggle('hidden', visible.length !== 0);
  }
  async function load() {
    var button = document.getElementById('refreshOverview'), error = document.getElementById('overviewError'); button.disabled = true; error.classList.add('hidden');
    try { await window.PATCHWORK_READY; rows = await window.PatchworkAPI.listBugs(); render(); }
    catch (e) { error.textContent = e.message; error.classList.remove('hidden'); }
    finally { button.disabled = false; }
  }
  document.getElementById('overviewSearch').addEventListener('input', render);
  document.getElementById('overviewStatus').addEventListener('change', render);
  document.getElementById('refreshOverview').onclick = load;
  load();
})();
