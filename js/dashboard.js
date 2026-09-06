(function () {
  'use strict';

  var bugs = [];
  var developers = [];
  var currentDeveloper = null;
  var currentProfile = null;
  var currentStatus = 'all';
  var currentDepartment = 'all';
  var departmentFromUrl = new URLSearchParams(window.location.search).get('department');
  var currentBugId = null;
  var previewImages = [];
  var previewIndex = 0;
  var accessRedirectTimer = null;
  var bugList = document.getElementById('bugList');
  var loadingState = document.getElementById('loadingState');
  var emptyState = document.getElementById('emptyState');
  var drawer = document.getElementById('detailDrawer');
  var backdrop = document.getElementById('detailBackdrop');
  var configNotice = document.getElementById('configNotice');
  var identityStorageKey = 'xiaoyuanbao-current-developer';

  var labels = {
    importance: { light: '轻', medium: '中', heavy: '重' },
    status: { open: '待处理', in_progress: '修复中', resolved: '已解决' }
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function bugCode(bug) {
    return bug && bug.bug_no ? 'BUG-' + String(bug.bug_no).padStart(4, '0') : 'BUG-0001';
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
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast show ' + (type || '');
    window.setTimeout(function () { toast.className = 'toast'; }, 3800);
  }

  function updateStats() {
    var statTotal = document.getElementById('statTotal'); if (statTotal) statTotal.textContent = bugs.length;
    var statOpen = document.getElementById('statOpen'); if (statOpen) statOpen.textContent = bugs.filter(function (bug) { return bug.status === 'open'; }).length;
    var statProgress = document.getElementById('statProgress'); if (statProgress) statProgress.textContent = bugs.filter(function (bug) { return bug.status === 'in_progress'; }).length;
    var statResolved = document.getElementById('statResolved'); if (statResolved) statResolved.textContent = bugs.filter(function (bug) { return bug.status === 'resolved'; }).length;
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
    currentProfile = window.PATCHWORK_PROFILE || null;
    var stored = readStoredIdentity();
    currentDeveloper = currentProfile ? developers.find(function (developer) {
      return developer.name === currentProfile.full_name && developer.department === currentProfile.department;
    }) || null : (stored ? developers.find(function (developer) { return developer.id === stored.id; }) || null : null);
    if (currentProfile) localStorage.removeItem(identityStorageKey);
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

  async function logoutDeveloper() {
    currentDeveloper = null;
    currentProfile = null;
    localStorage.removeItem(identityStorageKey);
    if (window.PATCHWORK_AUTH) await window.PATCHWORK_AUTH.signOut();
    renderIdentity();
    renderMyTasks();
    closeLoginModal();
    showToast('已退出当前开发人员身份。');
  }

  function renderIdentity() {
    var avatar = document.getElementById('identityAvatar');
    var label = document.getElementById('identityLabel');
    var name = document.getElementById('identityName');
    if (!avatar || !label || !name) return;
    if (currentProfile) {
      avatar.textContent = (currentProfile.full_name || currentProfile.username).slice(0, 1);
      label.textContent = currentProfile.role === 'admin' ? '超级管理员' : currentProfile.department;
      name.textContent = currentProfile.full_name || currentProfile.username;
    } else if (currentDeveloper) {
      avatar.textContent = currentDeveloper.name.slice(0, 1);
      label.textContent = currentDeveloper.department;
      name.textContent = currentDeveloper.name;
    } else {
      avatar.textContent = '?';
      label.textContent = '开发人员';
      name.textContent = '选择登录';
    }
    var topAvatar = document.getElementById('topUserAvatar');
    var topName = document.getElementById('topUserName');
    var topDepartment = document.getElementById('topUserDepartment');
    if (topAvatar && topName && topDepartment) {
      topAvatar.textContent = currentProfile ? (currentProfile.full_name || currentProfile.username).slice(0, 1) : (currentDeveloper ? currentDeveloper.name.slice(0, 1) : '?');
      topName.textContent = currentProfile ? (currentProfile.full_name || currentProfile.username) : (currentDeveloper ? currentDeveloper.name : '当前成员');
      topDepartment.textContent = currentProfile ? (currentProfile.role === 'admin' ? '超级管理员 · 已登录' : currentProfile.department + ' · 已登录') : (currentDeveloper ? currentDeveloper.department + ' · 已登录' : '测试组 · 未登录');
    }
    renderLoginDirectory();
  }

  function myTaskRows() {
    var identity = currentProfile || currentDeveloper;
    if (!identity) return [];
    var identityId = currentProfile ? currentProfile.id : currentDeveloper.id;
    var identityDepartment = currentProfile ? currentProfile.department : currentDeveloper.department;
    return bugs.filter(function (bug) {
      var assignedToMe = bug.assignee_id === identityId;
      var assignedToMyDepartment = !bug.assignee_id && bug.assignee_department === identityDepartment;
      return bug.status !== 'resolved' && (assignedToMe || assignedToMyDepartment);
    });
  }

  function renderMyTasks() {
    var loginState = document.getElementById('myTasksLogin');
    var emptyState = document.getElementById('myTasksEmpty');
    var list = document.getElementById('myTasksList');
    var identity = document.getElementById('myTasksIdentity');
    if (!loginState || !emptyState || !list || !identity) return;
    if (!currentProfile && !currentDeveloper) {
      identity.textContent = '登录后查看个人任务';
      loginState.classList.remove('hidden');
      emptyState.classList.add('hidden');
      list.classList.add('hidden');
      list.innerHTML = '';
      return;
    }

    var rows = myTaskRows();
    var taskIdentity = currentProfile || currentDeveloper;
    identity.textContent = (taskIdentity.full_name || taskIdentity.name || taskIdentity.username) + ' · ' + taskIdentity.department + ' · ' + rows.length + ' 项';
    loginState.classList.add('hidden');
    emptyState.classList.toggle('hidden', rows.length !== 0);
    list.classList.toggle('hidden', rows.length === 0);
    list.innerHTML = rows.map(function (bug) {
      return '<button class="my-task-card importance-' + escapeHtml(bug.importance) + '" type="button" data-bug-id="' + escapeHtml(bug.id) + '"><span class="my-task-priority">' + escapeHtml(labels.importance[bug.importance] || bug.importance) + '</span><span><small>' + escapeHtml(bug.module) + ' · ' + formatDate(bug.created_at) + '</small><strong>' + escapeHtml(bug.title) + '</strong></span><span class="status-pill status-' + escapeHtml(bug.status) + '"><i></i>' + escapeHtml(labels.status[bug.status]) + '</span><b>→</b></button>';
    }).join('');
    list.querySelectorAll('.my-task-card').forEach(function (button) {
      button.addEventListener('click', function () { openDrawer(button.dataset.bugId); });
    });
  }

  function renderLoginDirectory() {
    var list = document.getElementById('loginDeveloperList');
    var empty = document.getElementById('loginEmpty');
    var logoutArea = document.getElementById('logoutArea');
    if (!list || !empty || !logoutArea) return;
    var registerButton = document.getElementById('registerFromLogin');
    if (registerButton) registerButton.closest('.login-register').classList.toggle('hidden', !currentProfile || currentProfile.role !== 'admin');
    if (!developers.length) {
      list.innerHTML = '';
      list.classList.add('hidden');
      empty.classList.remove('hidden');
    } else {
      empty.classList.add('hidden');
      list.classList.remove('hidden');
      var selectedDepartment = document.getElementById('loginDepartmentFilter').value;
      var query = document.getElementById('loginSearchInput').value.trim().toLowerCase();
      var rows = developers.filter(function (developer) {
        var matchesDepartment = selectedDepartment === 'all' || developer.department === selectedDepartment;
        var matchesQuery = !query || developer.name.toLowerCase().includes(query);
        return matchesDepartment && matchesQuery;
      });
      list.innerHTML = rows.map(function (developer) {
        var isCurrent = currentDeveloper && currentDeveloper.id === developer.id;
        return '<button class="login-developer-card ' + (isCurrent ? 'is-current' : '') + '" type="button" data-developer-id="' + escapeHtml(developer.id) + '"><span class="developer-avatar">' + escapeHtml(developer.name.slice(0, 1)) + '</span><span><strong>' + escapeHtml(developer.name) + '</strong><small>' + escapeHtml(developer.department) + '</small></span><b>' + (isCurrent ? '当前身份 ✓' : '登录 →') + '</b></button>';
      }).join('');
      if (!rows.length) {
        list.innerHTML = '<div class="login-filter-empty">没有符合条件的人员</div>';
      }
      list.querySelectorAll('.login-developer-card').forEach(function (button) {
        button.addEventListener('click', function () {
          var developer = developers.find(function (item) { return item.id === button.dataset.developerId; });
          if (developer) loginDeveloper(developer);
        });
      });
    }
    logoutArea.classList.toggle('hidden', !currentDeveloper && !currentProfile);
  }

  function renderLoginFilters() {
    var select = document.getElementById('loginDepartmentFilter');
    if (!select) return;
    var current = select.value;
    var departments = uniqueDepartments();
    select.innerHTML = '<option value="all">全部部门</option>' + departments.map(function (department) {
      return '<option value="' + escapeHtml(department) + '">' + escapeHtml(department) + '</option>';
    }).join('');
    if (departments.indexOf(current) === -1) select.value = 'all';
  }

  function renderDeveloperDirectory() {
    var list = document.getElementById('developerList');
    var suggestions = document.getElementById('departmentSuggestions');
    var count = document.getElementById('developerCount');
    if (!list || !suggestions || !count) return;
    count.textContent = developers.length + ' 人';
    renderLoginFilters();
    suggestions.innerHTML = uniqueDepartments().map(function (department) {
      return '<option value="' + escapeHtml(department) + '"></option>';
    }).join('');

    if (!developers.length) {
      list.innerHTML = '<div class="directory-empty">尚未登记开发人员</div>';
      return;
    }

    list.innerHTML = developers.map(function (developer) {
      return '<article class="developer-card"><span class="developer-avatar">' + escapeHtml(developer.name.slice(0, 1)) + '</span><div><strong>' + escapeHtml(developer.name) + '</strong><small>' + escapeHtml(developer.department) + '</small></div></article>';
    }).join('');
  }

  function filteredBugs() {
    var query = document.getElementById('searchInput').value.trim().toLowerCase();
    var importance = document.getElementById('importanceFilter').value;
    return bugs.filter(function (bug) {
      var matchesStatus = currentStatus === 'all' || bug.status === currentStatus;
      var matchesImportance = importance === 'all' || bug.importance === importance;
      var matchesDepartment = currentDepartment === 'all' || bug.assignee_department === currentDepartment;
      var haystack = [bug.title, bug.module, bug.reporter, bug.assignee, bug.assignee_department].join(' ').toLowerCase();
      return matchesStatus && matchesImportance && matchesDepartment && (!query || haystack.includes(query));
    });
  }

  if (departmentFromUrl) {
    currentDepartment = departmentFromUrl;
    var departmentFilter = document.getElementById('departmentFilter');
    if (departmentFilter) departmentFilter.value = departmentFromUrl;
  }

  function updateWorkspaceView() {
    var isDepartmentView = Boolean(departmentFromUrl);
    document.querySelectorAll('.department-workspace:not(.department-table-panel)').forEach(function (node) { node.classList.add('hidden'); });
    document.querySelectorAll('.department-table-panel').forEach(function (node) { node.classList.toggle('hidden', !isDepartmentView); });
    var title = document.getElementById('workspaceTitle');
    var description = document.getElementById('workspaceDescription');
    var eyebrow = document.getElementById('workspaceEyebrow');
    var role = document.getElementById('workspaceRole');
    var breadcrumb = document.getElementById('workspaceBreadcrumb');
    var breadcrumbWrap = document.getElementById('workspaceBreadcrumbWrap');
    var listTitle = document.getElementById('departmentListTitle');
    var testGroupServices = document.getElementById('testGroupServices');
    var departmentCaseShell = document.getElementById('departmentCaseShell');
    var workspaceHeading = document.getElementById('workspaceHeading');
    var accessDenied = document.getElementById('accessDenied');
    var accessDeniedText = document.getElementById('accessDeniedText');
    var profileDepartment = currentProfile && currentProfile.department;
    var denied = departmentFromUrl && currentProfile && currentProfile.role !== 'admin' && profileDepartment !== departmentFromUrl;
    if (accessDenied) accessDenied.classList.toggle('hidden', !denied);
    if (accessDeniedText && denied) accessDeniedText.textContent = '当前账号无权限访问' + departmentFromUrl + '的工作台。';
    if (denied) {
      if (workspaceHeading) workspaceHeading.classList.add('hidden');
      if (testGroupServices) testGroupServices.classList.add('hidden');
      if (departmentCaseShell) departmentCaseShell.classList.add('hidden');
      var countdown = document.getElementById('accessDeniedCountdown');
      var seconds = 5;
      if (accessRedirectTimer) window.clearInterval(accessRedirectTimer);
      if (countdown) countdown.textContent = seconds + ' 秒后返回你的工作台';
      accessRedirectTimer = window.setInterval(function () {
        seconds -= 1;
        if (countdown) countdown.textContent = seconds > 0 ? seconds + ' 秒后返回你的工作台' : '正在返回你的工作台…';
        if (seconds <= 0) {
          window.clearInterval(accessRedirectTimer);
          var home = profileDepartment === '测试' ? 'index.html' : 'index.html?department=' + encodeURIComponent(profileDepartment || '测试');
          window.location.replace(home);
        }
      }, 1000);
      return;
    }
    if (!title || !description) return;
    if (isDepartmentView) {
      if (testGroupServices) testGroupServices.classList.add('hidden');
      if (departmentCaseShell) departmentCaseShell.classList.remove('hidden');
      if (workspaceHeading) workspaceHeading.classList.add('hidden');
      title.textContent = departmentFromUrl + '缺陷列表';
      var departmentDescriptions = {
        '技术—前端': '仅显示当前归属为技术—前端的缺陷；本部门成员可查看、指定跟进人与处理；转组仅本部门组长、超级管理员可操作。',
        '技术—后端': '仅显示当前归属为技术—后端的缺陷；本部门成员可查看、指定跟进人与处理；转组仅本部门组长、超级管理员可操作。',
        '设计': '仅显示当前归属为设计的缺陷；本部门成员可查看、指定跟进人与处理；转组仅本部门组长、超级管理员可操作。',
        '产品': '仅显示当前归属为产品的缺陷；本部门成员可查看、指定跟进人与处理；转组仅本部门组长、超级管理员可操作。'
      };
      description.textContent = departmentDescriptions[departmentFromUrl] || '查看、分配和跟进本部门负责的测试缺陷。';
      eyebrow.textContent = 'DEPARTMENT / BUG REGISTER';
      role.textContent = departmentFromUrl + '工作台';
      breadcrumb.textContent = departmentFromUrl + '缺陷列表';
      if (breadcrumbWrap) breadcrumbWrap.classList.add('hidden');
      if (listTitle) listTitle.textContent = departmentFromUrl + '缺陷列表';
      var departmentCaseTitle = document.getElementById('departmentCaseTitle');
      var departmentCaseDescription = document.getElementById('departmentCaseDescription');
      if (departmentCaseTitle) departmentCaseTitle.textContent = departmentFromUrl + '缺陷列表';
      if (departmentCaseDescription) departmentCaseDescription.textContent = departmentDescriptions[departmentFromUrl] || '仅显示当前归属为' + departmentFromUrl + '的缺陷；本部门成员可查看、指定跟进人与处理；转组仅本部门组长、超级管理员可操作。';
    } else {
      if (testGroupServices) testGroupServices.classList.remove('hidden');
      if (departmentCaseShell) departmentCaseShell.classList.add('hidden');
      if (workspaceHeading) workspaceHeading.classList.remove('hidden');
      title.textContent = '测试组首页';
      description.textContent = '测试组所有成员均可查看测试用例与BUG；两条业务线仍相对独立。';
      eyebrow.textContent = 'TEST GROUP / WORKSPACE';
      role.textContent = '内部协作空间';
      breadcrumb.textContent = '测试组首页';
      if (breadcrumbWrap) breadcrumbWrap.classList.add('hidden');
      if (listTitle) listTitle.textContent = 'Bug 列表';
    }
  }
  updateWorkspaceView();
  if (departmentFromUrl) {
    document.querySelectorAll('.department-table-panel').forEach(function (node) { node.classList.remove('hidden'); });
    document.querySelectorAll('.home-services').forEach(function (node) { node.classList.add('hidden'); });
  }
  function renderDepartmentCaseList() {
    var list = document.getElementById('departmentCaseList');
    var empty = document.getElementById('departmentCaseEmpty');
    if (!list || !empty || !departmentFromUrl) return;
    var query = (document.getElementById('departmentCaseSearch').value || '').trim().toLowerCase();
    var status = document.getElementById('departmentCaseStatus').value;
    var importance = document.getElementById('departmentCaseImportance').value;
    var filtered = bugs.filter(function (bug) { return bug.assignee_department === departmentFromUrl && (status === 'all' || bug.status === status) && (importance === 'all' || bug.importance === importance) && (!query || String(bug.title || '').toLowerCase().includes(query)); });
    list.innerHTML = filtered.map(function (bug) {
      var mine = currentProfile && bug.assignee_id === currentProfile.id;
      var statusLabel = { open: '待处理', in_progress: '处理中', resolved: '已解决' }[bug.status] || bug.status || '—';
      var importanceLabel = { heavy: '严重', medium: '一般', light: '轻微' }[bug.importance] || bug.importance || '—';
      return '<tr><td>' + bugCode(bug) + '</td><td class="case-file-name">' + escapeHtml(bug.title) + '</td><td>' + escapeHtml(bug.reporter || '—') + '</td><td><a class="case-download-link" href="mailto:">联系提交人</a></td><td class="' + (mine ? 'department-mine' : '') + '">' + escapeHtml(mine ? (bug.assignee || '—') + '（我的）' : (bug.assignee || '—')) + '</td><td>' + escapeHtml(statusLabel) + '</td><td class="' + (bug.importance === 'heavy' ? 'department-severe' : '') + '">' + escapeHtml(importanceLabel) + '</td><td>' + escapeHtml(formatDate(bug.updated_at || bug.created_at, true)) + '</td><td><button class="case-download-link" type="button" data-department-case="' + escapeHtml(bug.id) + '">查看详情</button></td></tr>';
    }).join('');
    empty.classList.toggle('hidden', filtered.length !== 0);
  }
  ['departmentCaseSearch', 'departmentCaseStatus', 'departmentCaseImportance'].forEach(function (id) { var node = document.getElementById(id); if (node) { node.addEventListener('input', renderDepartmentCaseList); node.addEventListener('change', renderDepartmentCaseList); } });
  document.addEventListener('click', function (event) { var button = event.target.closest('[data-department-case]'); if (button) openDrawer(button.dataset.departmentCase); });
  var departmentCaseExport = document.getElementById('departmentCaseExport');
  if (departmentCaseExport) departmentCaseExport.addEventListener('click', function () { var rows = Array.from(document.querySelectorAll('#departmentCaseList tr')).map(function (row) { return Array.from(row.children).map(function (cell) { return cell.textContent.trim(); }); }); var csv = '\ufeff缺陷编号,问题标题,提交人,联系方式,当前跟进人,状态,严重程度,最后更新时间,操作\n' + rows.map(function (row) { return row.map(function (value) { return '"' + value.replace(/"/g, '""') + '"'; }).join(','); }).join('\n'); var link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); link.download = 'department-bugs.csv'; link.click(); });
  ['departmentSearch', 'departmentStatusFilter', 'departmentImportanceFilter'].forEach(function (id) { var node = document.getElementById(id); if (node) node.addEventListener('input', renderDepartmentTable); if (node) node.addEventListener('change', renderDepartmentTable); });
  document.addEventListener('click', function (event) { var button = event.target.closest('[data-department-bug]'); if (button) openDrawer(button.dataset.departmentBug); });
  var departmentExport = document.getElementById('exportDepartmentReport');
  if (departmentExport) departmentExport.addEventListener('click', function () {
    var rows = Array.from(document.querySelectorAll('#departmentBugList tr')).map(function (row) { return Array.from(row.children).slice(0, 8).map(function (cell) { return cell.textContent.trim(); }); });
    var csv = '\ufeff缺陷编号,问题标题,提交人,联系方式,当前跟进人,状态,严重程度,最后更新时间\n' + rows.map(function (row) { return row.map(function (value) { return '"' + value.replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); link.download = 'department-bugs.csv'; link.click();
  });

  function renderList() {
    var rows = filteredBugs();
    bugList.innerHTML = '';
    loadingState.classList.add('hidden');
    bugList.classList.toggle('hidden', rows.length === 0);
    emptyState.classList.toggle('hidden', rows.length !== 0);

    rows.forEach(function (bug) {
      var article = document.createElement('article');
      article.className = 'bug-row importance-' + escapeHtml(bug.importance) + (bug.status === 'resolved' ? ' is-resolved' : '');
      article.tabIndex = 0;
      article.setAttribute('role', 'button');
      article.innerHTML =
        '<div class="bug-main">' +
          '<div class="bug-meta"><span>#' + escapeHtml(bug.id.slice(0, 8).toUpperCase()) + '</span><span>' + escapeHtml(bug.module) + '</span><span>' + formatDate(bug.created_at) + '</span></div>' +
          '<h3>' + escapeHtml(bug.title) + '</h3>' +
          '<p>' + escapeHtml(bug.description) + '</p>' +
          '<div class="bug-tags"><span class="tag importance-tag importance-' + escapeHtml(bug.importance) + '">重要程度 · ' + escapeHtml(labels.importance[bug.importance] || bug.importance) + '</span></div>' +
        '</div>' +
        '<div class="bug-owner"><span>' + (bug.assignee ? escapeHtml(bug.assignee.slice(0, 1).toUpperCase()) : (bug.assignee_department ? '部' : '?')) + '</span><div><small>' + escapeHtml(bug.assignee_department || '负责人') + '</small><strong>' + escapeHtml(bug.assignee || (bug.assignee_department ? '分配给部门' : '待分配')) + '</strong></div></div>' +
        '<div class="status-pill status-' + escapeHtml(bug.status) + '"><i></i>' + escapeHtml(labels.status[bug.status] || bug.status) + '</div>' +
        '<span class="row-arrow">→</span>';
      article.addEventListener('click', function () { openDrawer(bug.id); });
      article.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') openDrawer(bug.id);
      });
      bugList.appendChild(article);
    });
  }

  function renderDepartmentTable() {
    var table = document.getElementById('departmentBugList');
    var empty = document.getElementById('departmentEmpty');
    if (!table || !departmentFromUrl) return;
    var query = (document.getElementById('departmentSearch').value || '').trim().toLowerCase();
    var status = document.getElementById('departmentStatusFilter').value;
    var importance = document.getElementById('departmentImportanceFilter').value;
    var rows = bugs.filter(function (bug) {
      return bug.assignee_department === departmentFromUrl &&
        (status === 'all' || bug.status === status) &&
        (importance === 'all' || bug.importance === importance) &&
        (!query || bug.title.toLowerCase().includes(query));
    });
    table.innerHTML = rows.map(function (bug) {
      var currentName = bug.assignee || '—';
      var isMine = currentProfile && bug.assignee_id === currentProfile.id;
      var importanceLabel = { heavy: '严重', medium: '一般', light: '轻微' }[bug.importance] || bug.importance || '—';
      var statusLabel = { open: '待处理', in_progress: '处理中', resolved: '已解决' }[bug.status] || bug.status || '—';
      return '<tr><td>' + bugCode(bug) + '</td><td class="department-title-cell">' + escapeHtml(bug.title) + '</td><td>' + escapeHtml(bug.reporter || '—') + '</td><td><a class="department-link" href="mailto:">联系提交人</a></td><td class="' + (isMine ? 'department-mine' : '') + '">' + escapeHtml(isMine ? currentName + '（我的）' : currentName) + '</td><td>' + escapeHtml(statusLabel) + '</td><td class="' + (bug.importance === 'heavy' ? 'department-severe' : '') + '">' + escapeHtml(importanceLabel) + '</td><td>' + escapeHtml(formatDate(bug.updated_at || bug.created_at)) + '</td><td><button class="department-link" type="button" data-department-bug="' + escapeHtml(bug.id) + '">查看详情</button></td></tr>';
    }).join('');
    empty.classList.toggle('hidden', rows.length !== 0);
  }

  function detailBlock(title, value, className) {
    if (!value) return '';
    return '<section class="detail-block ' + (className || '') + '"><h3>' + title + '</h3><p>' + escapeHtml(value).replace(/\n/g, '<br>') + '</p></section>';
  }

  function isImageAttachment(url) {
    try {
      var pathname = new URL(url, window.location.href).pathname.toLowerCase();
      return /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/.test(pathname);
    } catch (error) {
      return /\.(png|jpe?g|gif|webp|bmp|svg|avif)(?:\?|#|$)/i.test(url);
    }
  }

  function attachmentName(url, index) {
    try {
      var name = decodeURIComponent(new URL(url, window.location.href).pathname.split('/').pop() || '');
      return name.replace(/^[0-9a-f-]{36}-/i, '') || '附件 ' + (index + 1);
    } catch (error) {
      return '附件 ' + (index + 1);
    }
  }

  function renderAttachments(urls) {
    if (!urls || !urls.length) return '';
    var imageItems = [];
    var fileItems = [];
    urls.forEach(function (url, index) {
      var safeUrl = escapeHtml(url);
      var name = attachmentName(url, index);
      if (isImageAttachment(url)) {
        imageItems.push('<button class="attachment-thumbnail" type="button" data-preview-index="' + imageItems.length + '" aria-label="预览图片 ' + escapeHtml(name) + '"><span class="thumbnail-image-wrap"><img src="' + safeUrl + '" alt="' + escapeHtml(name) + ' 缩略图" loading="lazy"><i>图片无法加载</i></span><span><strong>' + escapeHtml(name) + '</strong><small>点击查看大图</small></span></button>');
      } else {
        fileItems.push('<a class="attachment-link" href="' + safeUrl + '" target="_blank" rel="noopener">' + escapeHtml(name) + ' ↗</a>');
      }
    });
    previewImages = urls.filter(isImageAttachment).map(function (url, index) { return { url: url, name: attachmentName(url, index) }; });
    return '<section class="detail-block"><h3>问题图片</h3>' + (imageItems.length ? '<div class="attachment-gallery">' + imageItems.join('') + '</div>' : '') + (fileItems.length ? '<div class="attachment-list">' + fileItems.join('') + '</div>' : '') + '</section>';
  }

  function bindAttachmentPreviews() {
    document.querySelectorAll('.attachment-thumbnail').forEach(function (button) {
      button.addEventListener('click', function () {
        openImagePreview(Number(button.dataset.previewIndex));
      });
      var image = button.querySelector('img');
      image.addEventListener('error', function () { button.classList.add('image-load-failed'); });
    });
  }

  function renderPreviewImage() {
    var image = previewImages[previewIndex];
    if (!image) return;
    var content = document.getElementById('imagePreviewContent');
    var loading = document.getElementById('imagePreviewLoading');
    var error = document.getElementById('imagePreviewError');
    content.classList.add('is-loading');
    loading.classList.remove('hidden');
    error.classList.add('hidden');
    content.src = image.url;
    document.getElementById('imagePreviewTitle').textContent = image.name;
    document.getElementById('imagePreviewCounter').textContent = (previewIndex + 1) + ' / ' + previewImages.length;
    document.getElementById('openOriginalImage').href = image.url;
    document.getElementById('previousPreviewImage').disabled = previewImages.length < 2;
    document.getElementById('nextPreviewImage').disabled = previewImages.length < 2;
    document.querySelectorAll('.image-preview-strip button').forEach(function (button, index) {
      button.classList.toggle('active', index === previewIndex);
    });
  }

  function renderPreviewStrip() {
    var strip = document.getElementById('imagePreviewStrip');
    strip.classList.toggle('hidden', previewImages.length < 2);
    strip.innerHTML = previewImages.map(function (image, index) {
      return '<button type="button" data-preview-strip-index="' + index + '" aria-label="查看第 ' + (index + 1) + ' 张图片"><img src="' + escapeHtml(image.url) + '" alt=""></button>';
    }).join('');
    strip.querySelectorAll('button').forEach(function (button) {
      button.addEventListener('click', function () {
        previewIndex = Number(button.dataset.previewStripIndex);
        renderPreviewImage();
      });
    });
  }

  function openImagePreview(index) {
    var modal = document.getElementById('imagePreviewModal');
    if (!previewImages.length) return;
    previewIndex = Math.max(0, Math.min(index || 0, previewImages.length - 1));
    renderPreviewStrip();
    renderPreviewImage();
    modal.classList.remove('hidden');
    document.body.classList.add('drawer-open');
  }

  function movePreview(step) {
    if (previewImages.length < 2) return;
    previewIndex = (previewIndex + step + previewImages.length) % previewImages.length;
    renderPreviewImage();
  }

  function closeImagePreview() {
    var modal = document.getElementById('imagePreviewModal');
    if (modal.classList.contains('hidden')) return;
    modal.classList.add('hidden');
    document.getElementById('imagePreviewContent').src = '';
    if (document.getElementById('developerModal').classList.contains('hidden') && document.getElementById('loginModal').classList.contains('hidden') && !drawer.classList.contains('open')) {
      document.body.classList.remove('drawer-open');
    }
  }

  function renderDrawer(bug) {
    document.getElementById('drawerCode').textContent = bugCode(bug) + ' · ' + formatDate(bug.created_at, true);
    document.getElementById('drawerTitle').textContent = bug.title;
    var attachments = renderAttachments(bug.attachment_urls || []);
    var departments = uniqueDepartments();
    if (bug.assignee_department && departments.indexOf(bug.assignee_department) === -1) departments.push(bug.assignee_department);
    var departmentOptions = '<option value="">暂不分配部门</option>' + departments.map(function (department) {
      return '<option value="' + escapeHtml(department) + '" ' + (department === bug.assignee_department ? 'selected' : '') + '>' + escapeHtml(department) + '</option>';
    }).join('');
    var developerOptions = buildDeveloperOptions(bug.assignee_department, bug.assignee_id, bug.assignee);

    document.getElementById('drawerContent').innerHTML =
      '<div class="detail-badges"><span class="tag importance-tag importance-' + escapeHtml(bug.importance) + '">重要程度 · ' + escapeHtml(labels.importance[bug.importance]) + '</span><span class="status-pill status-' + escapeHtml(bug.status) + '"><i></i>' + escapeHtml(labels.status[bug.status]) + '</span></div>' +
       '<dl class="detail-grid"><div><dt>反馈人</dt><dd>' + escapeHtml(bug.reporter) + '</dd></div><div><dt>模块</dt><dd>' + escapeHtml(bug.module) + '</dd></div><div><dt>环境</dt><dd>' + escapeHtml(bug.environment || '—') + '</dd></div></dl>' +
      detailBlock('问题描述', bug.description) + detailBlock('复现步骤', bug.repro_steps, 'numbered-text') +
      detailBlock('预期结果', bug.expected_result) + detailBlock('实际结果', bug.actual_result) +
      attachments +
      '<section class="fix-panel"><div class="fix-panel-title"><span>FIX PLAN</span><h3>修复计划</h3></div>' +
        '<form id="fixForm">' +
          '<label class="field field-full"><span>处理方案</span><textarea name="fix_plan" rows="5" maxlength="3000" placeholder="填写问题原因、修改方案和验证方式…">' + escapeHtml(bug.fix_plan || '') + '</textarea></label>' +
          '<div class="assignment-box"><div class="assignment-heading"><strong>快速分配</strong><small>先选负责部门，再从该部门选择具体人员</small></div>' +
           '<div class="field-row"><label class="field"><span>负责部门</span><select id="assigneeDepartment" name="assignee_department">' + departmentOptions + '</select></label><label class="field"><span>负责人员</span><select id="assigneeDeveloper" name="assignee_id">' + developerOptions + '</select></label></div>' +
             '<label class="field field-full"><span>转组 / 跟进备注</span><textarea name="transfer_note" rows="3" maxlength="1000" placeholder="说明移交原因、当前处理重点或给接收组的提醒…">' + escapeHtml(bug.transfer_note || '') + '</textarea></label>' +
            '<p id="assignmentHint" class="assignment-hint"></p>' +
          '</div>' +
          '<label class="field field-full"><span>计划完成日</span><input name="target_date" type="date" value="' + escapeHtml(bug.target_date || '') + '"></label>' +
          '<label class="resolve-check"><input name="resolved" type="checkbox" ' + (bug.status === 'resolved' ? 'checked' : '') + '><span class="check-box">✓</span><span><strong>标记为已解决</strong><small>勾选后，该问题会进入已解决列表</small></span></label>' +
          '<button class="button button-primary button-full" type="submit">保存修复计划 →</button>' +
        '</form></section>';

    document.getElementById('fixForm').addEventListener('submit', saveFixPlan);
    document.getElementById('assigneeDepartment').addEventListener('change', updateDeveloperSelect);
    document.getElementById('assigneeDeveloper').addEventListener('change', updateAssignmentHint);
    bindAttachmentPreviews();
    updateAssignmentHint();
  }

  function buildDeveloperOptions(department, selectedId, legacyName) {
    var matching = developers.filter(function (developer) {
      return !department || developer.department === department;
    });
    var options = '<option value="">' + (department ? '直接分配给该部门' : '暂不指定人员') + '</option>';
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
      hint.textContent = '将分配给 ' + developer.department + ' 的 ' + developer.name + '。';
    } else if (departmentSelect.value) {
      hint.textContent = '将直接分配给 ' + departmentSelect.value + '，该部门每位成员都能在“分配给我的任务”中看到。';
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
       transfer_note: formData.get('transfer_note').trim(),
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
      if (department !== current.assignee_department) {
        var session = window.PATCHWORK_AUTH && (await window.PATCHWORK_AUTH.getSession()).data.session;
        if (session) await window.PatchworkAPI.createAssignmentEvent({ bug_id: current.id, from_department: current.assignee_department || '', to_department: department || '', from_user_id: current.follow_up_id || null, to_user_id: developer ? developer.id : null, note: patch.transfer_note, created_by: session.user.id });
      }
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
      renderDepartmentTable();
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

  async function loadCurrentProfile() {
    if (!window.PATCHWORK_AUTH || !window.PATCHWORK_AUTH.getSession) return null;
    await window.PATCHWORK_READY;
    currentProfile = window.PATCHWORK_PROFILE || null;
    renderIdentity();
    renderMyTasks();
    updateWorkspaceView();
    renderDepartmentTable();
    return currentProfile;
  }

  function openLoginModal() {
    if (currentProfile) {
      if (window.confirm('当前账号：' + (currentProfile.full_name || currentProfile.username) + '\n角色：' + currentProfile.role + '\n\n是否退出登录？')) logoutDeveloper();
      return;
    }
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
  var searchInput = document.getElementById('searchInput'); if (searchInput) searchInput.addEventListener('input', renderList);
  var importanceFilter = document.getElementById('importanceFilter'); if (importanceFilter) importanceFilter.addEventListener('change', renderList);
  var departmentFilterNode = document.getElementById('departmentFilter'); if (departmentFilterNode) departmentFilterNode.addEventListener('change', function (event) { currentDepartment = event.target.value; renderList(); });
  var loginSearchInput = document.getElementById('loginSearchInput'); if (loginSearchInput) loginSearchInput.addEventListener('input', renderLoginDirectory);
  var loginDepartmentFilter = document.getElementById('loginDepartmentFilter'); if (loginDepartmentFilter) loginDepartmentFilter.addEventListener('change', renderLoginDirectory);
  var refreshButton = document.getElementById('refreshButton'); if (refreshButton) refreshButton.addEventListener('click', loadBugs);
  var exportBugs = document.getElementById('exportBugs'); if (exportBugs) exportBugs.addEventListener('click', function () {
    var headers = ['编号', '标题', '反馈人', '模块', '部门', '负责人', '状态', '重要程度', '描述', '修复计划'];
    var csv = '\ufeff' + headers.join(',') + '\n' + filteredBugs().map(function (bug) { return [bug.id, bug.title, bug.reporter, bug.module, bug.assignee_department, bug.assignee, labels.status[bug.status], labels.importance[bug.importance], bug.description, bug.fix_plan].map(function (value) { return '"' + String(value || '').replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); link.download = 'bug-reports.csv'; link.click();
  });
  var closeDrawerButton = document.getElementById('closeDrawer'); if (closeDrawerButton) closeDrawerButton.addEventListener('click', closeDrawer);
  var closeImageButton = document.getElementById('closeImagePreview'); if (closeImageButton) closeImageButton.addEventListener('click', closeImagePreview);
  var previousPreview = document.getElementById('previousPreviewImage'); if (previousPreview) previousPreview.addEventListener('click', function () { movePreview(-1); });
  var nextPreview = document.getElementById('nextPreviewImage'); if (nextPreview) nextPreview.addEventListener('click', function () { movePreview(1); });
  var previewContent = document.getElementById('imagePreviewContent'); if (previewContent) previewContent.addEventListener('load', function (event) {
    event.currentTarget.classList.remove('is-loading');
    document.getElementById('imagePreviewLoading').classList.add('hidden');
  });
  if (previewContent) previewContent.addEventListener('error', function (event) {
    event.currentTarget.classList.add('is-loading');
    document.getElementById('imagePreviewLoading').classList.add('hidden');
    document.getElementById('imagePreviewError').classList.remove('hidden');
  });
  var imagePreviewModal = document.getElementById('imagePreviewModal'); if (imagePreviewModal) imagePreviewModal.addEventListener('click', function (event) {
    if (event.target === event.currentTarget || event.target.id === 'imagePreviewStage') closeImagePreview();
  });
  var openLoginButton = document.getElementById('openLoginModal'); if (openLoginButton) openLoginButton.addEventListener('click', openLoginModal);
  var loginFromTasks = document.getElementById('loginFromTasks'); if (loginFromTasks) loginFromTasks.addEventListener('click', openLoginModal);
  var closeLoginButton = document.getElementById('closeLoginModal'); if (closeLoginButton) closeLoginButton.addEventListener('click', closeLoginModal);
  var loginModal = document.getElementById('loginModal'); if (loginModal) loginModal.addEventListener('click', function (event) { if (event.target === event.currentTarget) closeLoginModal(); });
  var logoutButton = document.getElementById('logoutButton'); if (logoutButton) logoutButton.addEventListener('click', logoutDeveloper);
  var registerButton = document.getElementById('registerFromLogin'); if (registerButton) registerButton.addEventListener('click', function () {
    closeLoginModal();
    openDeveloperModal();
  });
  var closeDeveloperButton = document.getElementById('closeDeveloperModal'); if (closeDeveloperButton) closeDeveloperButton.addEventListener('click', closeDeveloperModal);
  var developerModal = document.getElementById('developerModal'); if (developerModal) developerModal.addEventListener('click', function (event) { if (event.target === event.currentTarget) closeDeveloperModal(); });
  var developerForm = document.getElementById('developerForm'); if (developerForm) developerForm.addEventListener('submit', saveDeveloper);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (event) {
    if (!document.getElementById('imagePreviewModal').classList.contains('hidden') && event.key === 'ArrowLeft') movePreview(-1);
    if (!document.getElementById('imagePreviewModal').classList.contains('hidden') && event.key === 'ArrowRight') movePreview(1);
    if (event.key === 'Escape') {
      if (!document.getElementById('imagePreviewModal').classList.contains('hidden')) {
        closeImagePreview();
      } else {
        closeDrawer();
        closeDeveloperModal();
        closeLoginModal();
      }
    }
  });

  if (!window.PatchworkAPI.isConfigured()) {
    configNotice.textContent = '当前为未连接状态：请在 js/config.js 填入 Supabase 配置，并执行 supabase.sql。';
    configNotice.classList.remove('hidden');
  }
  Promise.all([loadCurrentProfile(), loadDevelopers(), loadBugs()]).catch(function (error) {
    showToast(error.message || '团队信息加载失败，请确认已执行最新 supabase.sql。', 'error');
  });
})();
