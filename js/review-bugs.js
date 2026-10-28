(function () {
  'use strict';
  var rows = [], profiles = [], list = document.getElementById('reviewList');
  var STAGE_TEXT = { pending_review_1: '待一审', pending_review_2: '待二审' };
  function esc(value) { return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function formatDate(value) { return value ? new Date(value).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'; }
  function toast(text, type) { var node = document.getElementById('toast'); node.textContent = text; node.className = 'toast show ' + (type || ''); setTimeout(function () { node.className = 'toast'; }, 3200); }
  function profileName(id, fallback) { var person = profiles.find(function (item) { return item.id === id; }); return person ? (person.full_name || person.username) : (fallback || '—'); }
  function allowedStatuses() {
    var profile = window.PATCHWORK_PROFILE;
    if (!profile) return [];
    var stage = Number(profile.review_stage);
    if (stage === 1) return ['pending_review_1'];
    if (stage === 2) return ['pending_review_2'];
    return [];
  }
  function render() {
    var allowed = allowedStatuses();
    var profile = window.PATCHWORK_PROFILE;
    var query = document.getElementById('reviewSearch').value.trim().toLowerCase();
    var title = document.getElementById('reviewTitle');
    var description = document.getElementById('reviewDescription');
    if (!allowed.length) {
      list.innerHTML = '';
      document.getElementById('reviewEmpty').classList.remove('hidden');
      document.getElementById('reviewEmpty').textContent = '当前账号没有审核权限。';
      if (title) title.textContent = '待审核缺陷';
      return;
    }
    if (title) title.textContent = allowed[0] === 'pending_review_1' ? '待一审缺陷' : '待二审缺陷';
    var visible = rows.filter(function (bug) { return allowed.indexOf(bug.status) !== -1 && (!query || String(bug.title || '').toLowerCase().includes(query)); });
    list.innerHTML = visible.map(function (bug) {
      var importance = { heavy: '严重', medium: '一般', light: '轻微' }[bug.importance] || bug.importance || '—';
      var code = window.PatchworkAPI.reportCode(bug);
      return '<tr><td>' + code + '</td><td class="case-file-name">' + esc(bug.title) + '</td><td>' + esc(profileName(bug.submitter_id, bug.reporter)) + '</td><td>' + esc(bug.assignee_department || '—') + '</td><td class="' + (bug.importance === 'heavy' ? 'department-severe' : '') + '">' + esc(importance) + '</td><td>' + esc(STAGE_TEXT[bug.status] || bug.status) + '</td><td>' + formatDate(bug.created_at) + '</td><td><button class="case-action-button" type="button" data-review-id="' + esc(bug.id) + '">审核</button></td></tr>';
    }).join('');
    document.getElementById('reviewEmpty').classList.toggle('hidden', visible.length !== 0);
    if (!visible.length) document.getElementById('reviewEmpty').textContent = '当前没有需要你审核的缺陷报告';
  }
  async function load() {
    try {
      await window.PATCHWORK_READY;
      var profile = window.PATCHWORK_PROFILE;
      if (!profile) return;
      if (!(Number(profile.review_stage) > 0)) {
        document.getElementById('reviewEmpty').classList.remove('hidden');
        document.getElementById('reviewEmpty').textContent = '当前账号没有审核权限。';
        return;
      }
      var result = await Promise.all([window.PatchworkAPI.listBugs(), window.PatchworkAPI.listProfiles()]);
      rows = (result[0] || []).filter(function(bug){return bug.request_type !== 'product_change';});
      profiles = result[1] || [];
      render();
    } catch (error) { toast(error.message || '待审核列表加载失败。', 'error'); }
  }
  document.getElementById('reviewSearch').addEventListener('input', render);
  list.addEventListener('click', function (event) { var button = event.target.closest('[data-review-id]'); if (button) window.location.href = 'bug-detail.html?bug=' + encodeURIComponent(button.dataset.reviewId); });
  window.PATCHWORK_READY.then(load).catch(function (error) { toast(error.message, 'error'); });
})();
