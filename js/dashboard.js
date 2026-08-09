(function () {
  'use strict';

  var bugs = [];
  var currentStatus = 'all';
  var currentBugId = null;
  var bugList = document.getElementById('bugList');
  var loadingState = document.getElementById('loadingState');
  var emptyState = document.getElementById('emptyState');
  var drawer = document.getElementById('detailDrawer');
  var backdrop = document.getElementById('detailBackdrop');
  var configNotice = document.getElementById('configNotice');

  var labels = {
    severity: { blocker: '阻断', critical: '严重', major: '主要', minor: '次要' },
    priority: { urgent: 'P0', high: 'P1', medium: 'P2', low: 'P3' },
    status: { open: '待处理', in_progress: '修复中', resolved: '已解决' }
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function formatDate(value, includeTime) {
    if (!value) return '—';
    var date = new Date(value);
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: includeTime ? '2-digit' : undefined,
      minute: includeTime ? '2-digit' : undefined
    }).format(date);
  }

  function showToast(message, type) {
    var toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show ' + (type || '');
    window.setTimeout(function () { toast.className = 'toast'; }, 3800);
  }

  function updateStats() {
    document.getElementById('statTotal').textContent = bugs.length;
    document.getElementById('statOpen').textContent = bugs.filter(function (bug) { return bug.status === 'open'; }).length;
    document.getElementById('statProgress').textContent = bugs.filter(function (bug) { return bug.status === 'in_progress'; }).length;
    document.getElementById('statResolved').textContent = bugs.filter(function (bug) { return bug.status === 'resolved'; }).length;
  }

  function filteredBugs() {
    var query = document.getElementById('searchInput').value.trim().toLowerCase();
    var severity = document.getElementById('severityFilter').value;
    return bugs.filter(function (bug) {
      var matchesStatus = currentStatus === 'all' || bug.status === currentStatus;
      var matchesSeverity = severity === 'all' || bug.severity === severity;
      var haystack = [bug.title, bug.module, bug.reporter, bug.team, bug.assignee].join(' ').toLowerCase();
      return matchesStatus && matchesSeverity && (!query || haystack.includes(query));
    });
  }

  function renderList() {
    var rows = filteredBugs();
    bugList.innerHTML = '';
    loadingState.classList.add('hidden');
    bugList.classList.toggle('hidden', rows.length === 0);
    emptyState.classList.toggle('hidden', rows.length !== 0);

    rows.forEach(function (bug) {
      var article = document.createElement('article');
      article.className = 'bug-row' + (bug.status === 'resolved' ? ' is-resolved' : '');
      article.tabIndex = 0;
      article.setAttribute('role', 'button');
      article.innerHTML =
        '<div class="bug-status-line status-' + escapeHtml(bug.status) + '"></div>' +
        '<div class="bug-main">' +
          '<div class="bug-meta"><span>#' + escapeHtml(bug.id.slice(0, 8).toUpperCase()) + '</span><span>' + escapeHtml(bug.module) + '</span><span>' + formatDate(bug.created_at) + '</span></div>' +
          '<h3>' + escapeHtml(bug.title) + '</h3>' +
          '<p>' + escapeHtml(bug.description) + '</p>' +
          '<div class="bug-tags"><span class="tag severity-' + escapeHtml(bug.severity) + '">' + escapeHtml(labels.severity[bug.severity] || bug.severity) + '</span><span class="tag priority-tag">' + escapeHtml(labels.priority[bug.priority] || bug.priority) + '</span></div>' +
        '</div>' +
        '<div class="bug-owner"><span>' + (bug.assignee ? escapeHtml(bug.assignee.slice(0, 1).toUpperCase()) : '?') + '</span><div><small>负责人</small><strong>' + escapeHtml(bug.assignee || '待分配') + '</strong></div></div>' +
        '<div class="status-pill status-' + escapeHtml(bug.status) + '"><i></i>' + escapeHtml(labels.status[bug.status] || bug.status) + '</div>' +
        '<span class="row-arrow">→</span>';
      article.addEventListener('click', function () { openDrawer(bug.id); });
      article.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') openDrawer(bug.id);
      });
      bugList.appendChild(article);
    });
  }

  function detailBlock(title, value, className) {
    if (!value) return '';
    return '<section class="detail-block ' + (className || '') + '"><h3>' + title + '</h3><p>' + escapeHtml(value).replace(/\n/g, '<br>') + '</p></section>';
  }

  function renderDrawer(bug) {
    document.getElementById('drawerCode').textContent = '#' + bug.id.slice(0, 8).toUpperCase() + ' · ' + formatDate(bug.created_at, true);
    document.getElementById('drawerTitle').textContent = bug.title;
    var attachments = (bug.attachment_urls || []).map(function (url, index) {
      return '<a class="attachment-link" href="' + escapeHtml(url) + '" target="_blank" rel="noopener">附件 ' + (index + 1) + ' ↗</a>';
    }).join('');

    document.getElementById('drawerContent').innerHTML =
      '<div class="detail-badges"><span class="tag severity-' + escapeHtml(bug.severity) + '">' + escapeHtml(labels.severity[bug.severity]) + '</span><span class="tag priority-tag">' + escapeHtml(labels.priority[bug.priority]) + '</span><span class="status-pill status-' + escapeHtml(bug.status) + '"><i></i>' + escapeHtml(labels.status[bug.status]) + '</span></div>' +
      '<dl class="detail-grid"><div><dt>反馈人</dt><dd>' + escapeHtml(bug.reporter) + '</dd></div><div><dt>团队</dt><dd>' + escapeHtml(bug.team || '—') + '</dd></div><div><dt>模块</dt><dd>' + escapeHtml(bug.module) + '</dd></div><div><dt>环境</dt><dd>' + escapeHtml(bug.environment || '—') + '</dd></div></dl>' +
      detailBlock('问题描述', bug.description) + detailBlock('复现步骤', bug.repro_steps, 'numbered-text') +
      detailBlock('预期结果', bug.expected_result) + detailBlock('实际结果', bug.actual_result) +
      (attachments ? '<section class="detail-block"><h3>附件</h3><div class="attachment-list">' + attachments + '</div></section>' : '') +
      '<section class="fix-panel"><div class="fix-panel-title"><span>FIX PLAN</span><h3>修复计划</h3></div>' +
        '<form id="fixForm">' +
          '<label class="field field-full"><span>处理方案</span><textarea name="fix_plan" rows="5" maxlength="3000" placeholder="填写问题原因、修改方案和验证方式…">' + escapeHtml(bug.fix_plan || '') + '</textarea></label>' +
          '<div class="field-row"><label class="field"><span>负责人</span><input name="assignee" maxlength="40" value="' + escapeHtml(bug.assignee || '') + '" placeholder="开发负责人"></label><label class="field"><span>计划完成日</span><input name="target_date" type="date" value="' + escapeHtml(bug.target_date || '') + '"></label></div>' +
          '<label class="resolve-check"><input name="resolved" type="checkbox" ' + (bug.status === 'resolved' ? 'checked' : '') + '><span class="check-box">✓</span><span><strong>标记为已解决</strong><small>勾选后，该问题会进入已解决列表</small></span></label>' +
          '<button class="button button-primary button-full" type="submit">保存修复计划 →</button>' +
        '</form></section>';

    document.getElementById('fixForm').addEventListener('submit', saveFixPlan);
  }

  function openDrawer(id) {
    var bug = bugs.find(function (item) { return item.id === id; });
    if (!bug) return;
    currentBugId = id;
    renderDrawer(bug);
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    backdrop.classList.remove('hidden');
    document.body.classList.add('drawer-open');
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    backdrop.classList.add('hidden');
    document.body.classList.remove('drawer-open');
    currentBugId = null;
  }

  async function saveFixPlan(event) {
    event.preventDefault();
    var button = event.currentTarget.querySelector('button[type="submit"]');
    var formData = new FormData(event.currentTarget);
    var resolved = formData.get('resolved') === 'on';
    var current = bugs.find(function (bug) { return bug.id === currentBugId; });
    var status = resolved ? 'resolved' : (formData.get('fix_plan').trim() || formData.get('assignee').trim() ? 'in_progress' : 'open');
    var patch = {
      fix_plan: formData.get('fix_plan').trim(),
      assignee: formData.get('assignee').trim(),
      target_date: formData.get('target_date') || null,
      status: status,
      resolved_at: resolved ? (current.resolved_at || new Date().toISOString()) : null,
      updated_at: new Date().toISOString()
    };

    button.disabled = true;
    button.textContent = '正在保存…';
    try {
      var rows = await window.PatchworkAPI.updateBug(currentBugId, patch);
      var updated = rows[0];
      bugs = bugs.map(function (bug) { return bug.id === updated.id ? updated : bug; });
      updateStats();
      renderList();
      renderDrawer(updated);
      showToast('修复计划已保存。', 'success');
    } catch (error) {
      showToast(error.message || '保存失败，请稍后重试。', 'error');
      button.disabled = false;
      button.textContent = '保存修复计划 →';
    }
  }

  async function loadBugs() {
    loadingState.classList.remove('hidden');
    bugList.classList.add('hidden');
    emptyState.classList.add('hidden');
    try {
      bugs = await window.PatchworkAPI.listBugs();
      updateStats();
      renderList();
    } catch (error) {
      loadingState.classList.add('hidden');
      emptyState.classList.remove('hidden');
      emptyState.querySelector('h3').textContent = '暂时无法读取问题列表';
      emptyState.querySelector('p').textContent = error.message;
    }
  }

  document.querySelectorAll('.filter-chip').forEach(function (button) {
    button.addEventListener('click', function () {
      document.querySelectorAll('.filter-chip').forEach(function (item) { item.classList.remove('active'); });
      button.classList.add('active');
      currentStatus = button.dataset.status;
      renderList();
    });
  });
  document.getElementById('searchInput').addEventListener('input', renderList);
  document.getElementById('severityFilter').addEventListener('change', renderList);
  document.getElementById('refreshButton').addEventListener('click', loadBugs);
  document.getElementById('closeDrawer').addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeDrawer(); });

  if (!window.PatchworkAPI.isConfigured()) {
    configNotice.textContent = '当前为未连接状态：请在 js/config.js 填入 Supabase 配置，并执行 supabase.sql。';
    configNotice.classList.remove('hidden');
  }
  loadBugs();
})();
