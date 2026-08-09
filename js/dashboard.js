(function () {
  'use strict';

  var bugs = [];
  var developers = [];
  var currentDeveloper = null;
  var currentStatus = 'all';
  var currentBugId = null;
  var bugList = document.getElementById('bugList');
  var loadingState = document.getElementById('loadingState');
  var emptyState = document.getElementById('emptyState');
  var drawer = document.getElementById('detailDrawer');
  var backdrop = document.getElementById('detailBackdrop');
  var configNotice = document.getElementById('configNotice');
  var identityStorageKey = 'xiaoyuanbao-current-developer';

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
    renderMyTasks();
  }

  function uniqueDepartments() {
    return developers.map(function (developer) { return developer.department; }).filter(function (department, index, rows) {
      return department && rows.indexOf(department) === index;
    });
  }

  function readStoredIdentity() {
    try {
      return JSON.parse(localStorage.getItem(identityStorageKey) || 'null');
    } catch (error) {
      localStorage.removeItem(identityStorageKey);
      return null;
    }
  }

  function restoreIdentity() {
    var stored = readStoredIdentity();
    currentDeveloper = stored ? developers.find(function (developer) { return developer.id === stored.id; }) || null : null;
    if (stored && !currentDeveloper) localStorage.removeItem(identityStorageKey);
    renderIdentity();
    renderMyTasks();
  }

  function loginDeveloper(developer) {
    currentDeveloper = developer;
    localStorage.setItem(identityStorageKey, JSON.stringify({ id: developer.id, name: developer.name, department: developer.department }));
    renderIdentity();
    renderMyTasks();
    closeLoginModal();
    showToast('已以 ' + developer.name + ' 的身份登录。', 'success');
  }

  function logoutDeveloper() {
    currentDeveloper = null;
    localStorage.removeItem(identityStorageKey);
    renderIdentity();
    renderMyTasks();
    closeLoginModal();
    showToast('已退出当前开发人员身份。');
  }

  function renderIdentity() {
    var avatar = document.getElementById('identityAvatar');
    var label = document.getElementById('identityLabel');
    var name = document.getElementById('identityName');
    if (currentDeveloper) {
      avatar.textContent = currentDeveloper.name.slice(0, 1);
      label.textContent = currentDeveloper.department;
      name.textContent = currentDeveloper.name;
    } else {
      avatar.textContent = '?';
      label.textContent = '开发人员';
      name.textContent = '选择登录';
    }
    renderLoginDirectory();
  }

  function myTaskRows() {
    if (!currentDeveloper) return [];
    return bugs.filter(function (bug) {
      return bug.status !== 'resolved' && bug.assignee_id === currentDeveloper.id;
    });
  }

  function renderMyTasks() {
    var loginState = document.getElementById('myTasksLogin');
    var emptyState = document.getElementById('myTasksEmpty');
    var list = document.getElementById('myTasksList');
    var identity = document.getElementById('myTasksIdentity');
    if (!currentDeveloper) {
      identity.textContent = '登录后查看个人任务';
      loginState.classList.remove('hidden');
      emptyState.classList.add('hidden');
      list.classList.add('hidden');
      list.innerHTML = '';
      return;
    }

    var rows = myTaskRows();
    identity.textContent = currentDeveloper.name + ' · ' + currentDeveloper.department + ' · ' + rows.length + ' 项';
    loginState.classList.add('hidden');
    emptyState.classList.toggle('hidden', rows.length !== 0);
    list.classList.toggle('hidden', rows.length === 0);
    list.innerHTML = rows.map(function (bug) {
      return '<button class="my-task-card" type="button" data-bug-id="' + escapeHtml(bug.id) + '"><span class="my-task-priority severity-' + escapeHtml(bug.severity) + '">' + escapeHtml(labels.priority[bug.priority] || bug.priority) + '</span><span><small>' + escapeHtml(bug.module) + ' · ' + formatDate(bug.created_at) + '</small><strong>' + escapeHtml(bug.title) + '</strong></span><span class="status-pill status-' + escapeHtml(bug.status) + '"><i></i>' + escapeHtml(labels.status[bug.status]) + '</span><b>→</b></button>';
    }).join('');
    list.querySelectorAll('.my-task-card').forEach(function (button) {
      button.addEventListener('click', function () { openDrawer(button.dataset.bugId); });
    });
  }

  function renderLoginDirectory() {
    var list = document.getElementById('loginDeveloperList');
    var empty = document.getElementById('loginEmpty');
    var logoutArea = document.getElementById('logoutArea');
    if (!developers.length) {
      list.innerHTML = '';
      list.classList.add('hidden');
      empty.classList.remove('hidden');
    } else {
      empty.classList.add('hidden');
      list.classList.remove('hidden');
      list.innerHTML = developers.map(function (developer) {
        var isCurrent = currentDeveloper && currentDeveloper.id === developer.id;
        return '<button class="login-developer-card ' + (isCurrent ? 'is-current' : '') + '" type="button" data-developer-id="' + escapeHtml(developer.id) + '"><span class="developer-avatar">' + escapeHtml(developer.name.slice(0, 1)) + '</span><span><strong>' + escapeHtml(developer.name) + '</strong><small>' + escapeHtml(developer.department) + (developer.role ? ' · ' + escapeHtml(developer.role) : '') + '</small></span><b>' + (isCurrent ? '当前身份 ✓' : '登录 →') + '</b></button>';
      }).join('');
      list.querySelectorAll('.login-developer-card').forEach(function (button) {
        button.addEventListener('click', function () {
          var developer = developers.find(function (item) { return item.id === button.dataset.developerId; });
          if (developer) loginDeveloper(developer);
        });
      });
    }
    logoutArea.classList.toggle('hidden', !currentDeveloper);
  }

  function renderDeveloperDirectory() {
    var list = document.getElementById('developerList');
    var suggestions = document.getElementById('departmentSuggestions');
    document.getElementById('developerCount').textContent = developers.length + ' 人';
    suggestions.innerHTML = uniqueDepartments().map(function (department) {
      return '<option value="' + escapeHtml(department) + '"></option>';
    }).join('');

    if (!developers.length) {
      list.innerHTML = '<div class="directory-empty">尚未登记开发人员</div>';
      return;
    }

    list.innerHTML = developers.map(function (developer) {
      return '<article class="developer-card"><span class="developer-avatar">' + escapeHtml(developer.name.slice(0, 1)) + '</span><div><strong>' + escapeHtml(developer.name) + '</strong><small>' + escapeHtml(developer.department) + (developer.role ? ' · ' + escapeHtml(developer.role) : '') + '</small></div>' + (developer.contact ? '<a href="mailto:' + escapeHtml(developer.contact) + '" title="' + escapeHtml(developer.contact) + '">联系</a>' : '') + '</article>';
    }).join('');
  }

  function filteredBugs() {
    var query = document.getElementById('searchInput').value.trim().toLowerCase();
    var severity = document.getElementById('severityFilter').value;
    return bugs.filter(function (bug) {
      var matchesStatus = currentStatus === 'all' || bug.status === currentStatus;
      var matchesSeverity = severity === 'all' || bug.severity === severity;
      var haystack = [bug.title, bug.module, bug.reporter, bug.team, bug.assignee, bug.assignee_department].join(' ').toLowerCase();
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
        '<div class="bug-owner"><span>' + (bug.assignee ? escapeHtml(bug.assignee.slice(0, 1).toUpperCase()) : (bug.assignee_department ? '部' : '?')) + '</span><div><small>' + escapeHtml(bug.assignee_department || '负责人') + '</small><strong>' + escapeHtml(bug.assignee || (bug.assignee_department ? '部门待认领' : '待分配')) + '</strong></div></div>' +
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
    var departments = uniqueDepartments();
    if (bug.assignee_department && departments.indexOf(bug.assignee_department) === -1) departments.push(bug.assignee_department);
    var departmentOptions = '<option value="">暂不分配部门</option>' + departments.map(function (department) {
      return '<option value="' + escapeHtml(department) + '" ' + (department === bug.assignee_department ? 'selected' : '') + '>' + escapeHtml(department) + '</option>';
    }).join('');
    var developerOptions = buildDeveloperOptions(bug.assignee_department, bug.assignee_id, bug.assignee);

    document.getElementById('drawerContent').innerHTML =
      '<div class="detail-badges"><span class="tag severity-' + escapeHtml(bug.severity) + '">' + escapeHtml(labels.severity[bug.severity]) + '</span><span class="tag priority-tag">' + escapeHtml(labels.priority[bug.priority]) + '</span><span class="status-pill status-' + escapeHtml(bug.status) + '"><i></i>' + escapeHtml(labels.status[bug.status]) + '</span></div>' +
      '<dl class="detail-grid"><div><dt>反馈人</dt><dd>' + escapeHtml(bug.reporter) + '</dd></div><div><dt>团队</dt><dd>' + escapeHtml(bug.team || '—') + '</dd></div><div><dt>模块</dt><dd>' + escapeHtml(bug.module) + '</dd></div><div><dt>环境</dt><dd>' + escapeHtml(bug.environment || '—') + '</dd></div></dl>' +
      detailBlock('问题描述', bug.description) + detailBlock('复现步骤', bug.repro_steps, 'numbered-text') +
      detailBlock('预期结果', bug.expected_result) + detailBlock('实际结果', bug.actual_result) +
      (attachments ? '<section class="detail-block"><h3>附件</h3><div class="attachment-list">' + attachments + '</div></section>' : '') +
      '<section class="fix-panel"><div class="fix-panel-title"><span>FIX PLAN</span><h3>修复计划</h3></div>' +
        '<form id="fixForm">' +
          '<label class="field field-full"><span>处理方案</span><textarea name="fix_plan" rows="5" maxlength="3000" placeholder="填写问题原因、修改方案和验证方式…">' + escapeHtml(bug.fix_plan || '') + '</textarea></label>' +
          '<div class="assignment-box"><div class="assignment-heading"><strong>快速分配</strong><small>先选负责部门，再从该部门选择具体人员</small></div>' +
            '<div class="field-row"><label class="field"><span>负责部门</span><select id="assigneeDepartment" name="assignee_department">' + departmentOptions + '</select></label><label class="field"><span>负责人员</span><select id="assigneeDeveloper" name="assignee_id">' + developerOptions + '</select></label></div>' +
            '<p id="assignmentHint" class="assignment-hint"></p>' +
          '</div>' +
          '<label class="field field-full"><span>计划完成日</span><input name="target_date" type="date" value="' + escapeHtml(bug.target_date || '') + '"></label>' +
          '<label class="resolve-check"><input name="resolved" type="checkbox" ' + (bug.status === 'resolved' ? 'checked' : '') + '><span class="check-box">✓</span><span><strong>标记为已解决</strong><small>勾选后，该问题会进入已解决列表</small></span></label>' +
          '<button class="button button-primary button-full" type="submit">保存修复计划 →</button>' +
        '</form></section>';

    document.getElementById('fixForm').addEventListener('submit', saveFixPlan);
    document.getElementById('assigneeDepartment').addEventListener('change', updateDeveloperSelect);
    document.getElementById('assigneeDeveloper').addEventListener('change', updateAssignmentHint);
    updateAssignmentHint();
  }

  function buildDeveloperOptions(department, selectedId, legacyName) {
    var matching = developers.filter(function (developer) {
      return !department || developer.department === department;
    });
    var options = '<option value="">' + (department ? '部门统一负责 / 待认领' : '暂不指定人员') + '</option>';
    options += matching.map(function (developer) {
      return '<option value="' + escapeHtml(developer.id) + '" ' + (developer.id === selectedId ? 'selected' : '') + '>' + escapeHtml(developer.name) + (department ? '' : ' · ' + escapeHtml(developer.department)) + '</option>';
    }).join('');
    if (legacyName && !developers.some(function (developer) { return developer.id === selectedId; })) {
      options += '<option value="legacy" selected>' + escapeHtml(legacyName) + '（原记录）</option>';
    }
    return options;
  }

  function updateDeveloperSelect() {
    var department = document.getElementById('assigneeDepartment').value;
    var select = document.getElementById('assigneeDeveloper');
    select.innerHTML = buildDeveloperOptions(department, '', '');
    updateAssignmentHint();
  }

  function updateAssignmentHint() {
    var departmentSelect = document.getElementById('assigneeDepartment');
    var developerSelect = document.getElementById('assigneeDeveloper');
    var hint = document.getElementById('assignmentHint');
    if (!departmentSelect || !developerSelect || !hint) return;
    var developer = developers.find(function (item) { return item.id === developerSelect.value; });
    if (developer) {
      if (departmentSelect.value !== developer.department) departmentSelect.value = developer.department;
      hint.textContent = '将分配给 ' + developer.department + ' 的 ' + developer.name + (developer.role ? '（' + developer.role + '）' : '') + '。';
    } else if (departmentSelect.value) {
      hint.textContent = '将分配给 ' + departmentSelect.value + '，由部门内部认领。';
    } else {
      hint.textContent = '当前任务尚未分配。';
    }
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
    if (document.getElementById('developerModal').classList.contains('hidden') && document.getElementById('loginModal').classList.contains('hidden')) {
      document.body.classList.remove('drawer-open');
    }
    currentBugId = null;
  }

  async function saveFixPlan(event) {
    event.preventDefault();
    var button = event.currentTarget.querySelector('button[type="submit"]');
    var formData = new FormData(event.currentTarget);
    var resolved = formData.get('resolved') === 'on';
    var current = bugs.find(function (bug) { return bug.id === currentBugId; });
    var selectedDeveloperId = formData.get('assignee_id');
    var developer = developers.find(function (item) { return item.id === selectedDeveloperId; });
    var keepLegacyAssignment = selectedDeveloperId === 'legacy';
    var department = developer ? developer.department : (keepLegacyAssignment ? current.assignee_department : formData.get('assignee_department'));
    var assignee = developer ? developer.name : (keepLegacyAssignment ? current.assignee : '');
    var status = resolved ? 'resolved' : (formData.get('fix_plan').trim() || department || assignee ? 'in_progress' : 'open');
    var patch = {
      fix_plan: formData.get('fix_plan').trim(),
      assignee: assignee,
      assignee_department: department,
      assignee_id: developer ? developer.id : (keepLegacyAssignment ? current.assignee_id : null),
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

  async function loadDevelopers() {
    developers = await window.PatchworkAPI.listDevelopers();
    renderDeveloperDirectory();
    restoreIdentity();
  }

  function openLoginModal() {
    renderLoginDirectory();
    document.getElementById('loginModal').classList.remove('hidden');
    document.body.classList.add('drawer-open');
  }

  function closeLoginModal() {
    document.getElementById('loginModal').classList.add('hidden');
    if (document.getElementById('developerModal').classList.contains('hidden') && !drawer.classList.contains('open')) {
      document.body.classList.remove('drawer-open');
    }
  }

  function openDeveloperModal() {
    document.getElementById('developerModal').classList.remove('hidden');
    document.body.classList.add('drawer-open');
  }

  function closeDeveloperModal() {
    document.getElementById('developerModal').classList.add('hidden');
    if (document.getElementById('loginModal').classList.contains('hidden') && !drawer.classList.contains('open')) {
      document.body.classList.remove('drawer-open');
    }
  }

  async function saveDeveloper(event) {
    event.preventDefault();
    var button = document.getElementById('saveDeveloperButton');
    var data = Object.fromEntries(new FormData(event.currentTarget).entries());
    data.name = data.name.trim();
    data.department = data.department.trim();
    data.role = data.role.trim();
    data.contact = data.contact.trim();
    data.active = true;
    button.disabled = true;
    button.textContent = '正在登记…';
    try {
      var rows = await window.PatchworkAPI.createDeveloper(data);
      developers.push(rows[0]);
      developers.sort(function (a, b) { return (a.department + a.name).localeCompare(b.department + b.name, 'zh-CN'); });
      renderDeveloperDirectory();
      renderLoginDirectory();
      event.currentTarget.reset();
      showToast('开发人员已登记，可在任务中快速分配。', 'success');
    } catch (error) {
      var message = error.message && error.message.includes('duplicate key') ? '该人员已在此部门登记。' : (error.message || '登记失败，请稍后重试。');
      showToast(message, 'error');
    } finally {
      button.disabled = false;
      button.textContent = '登记并加入分配列表 →';
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
  document.getElementById('openDeveloperModal').addEventListener('click', openDeveloperModal);
  document.getElementById('openLoginModal').addEventListener('click', openLoginModal);
  document.getElementById('loginFromTasks').addEventListener('click', openLoginModal);
  document.getElementById('closeLoginModal').addEventListener('click', closeLoginModal);
  document.getElementById('loginModal').addEventListener('click', function (event) { if (event.target === event.currentTarget) closeLoginModal(); });
  document.getElementById('logoutButton').addEventListener('click', logoutDeveloper);
  document.getElementById('registerFromLogin').addEventListener('click', function () {
    closeLoginModal();
    openDeveloperModal();
  });
  document.getElementById('closeDeveloperModal').addEventListener('click', closeDeveloperModal);
  document.getElementById('developerModal').addEventListener('click', function (event) { if (event.target === event.currentTarget) closeDeveloperModal(); });
  document.getElementById('developerForm').addEventListener('submit', saveDeveloper);
  backdrop.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeDrawer();
      closeDeveloperModal();
      closeLoginModal();
    }
  });

  if (!window.PatchworkAPI.isConfigured()) {
    configNotice.textContent = '当前为未连接状态：请在 js/config.js 填入 Supabase 配置，并执行 supabase.sql。';
    configNotice.classList.remove('hidden');
  }
  Promise.all([loadDevelopers(), loadBugs()]).catch(function (error) {
    showToast(error.message || '团队信息加载失败，请确认已执行最新 supabase.sql。', 'error');
  });
})();
