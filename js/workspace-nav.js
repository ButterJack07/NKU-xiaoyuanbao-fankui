(function () {
  'use strict';

  var topbar = document.querySelector('.topbar');
  var department = new URLSearchParams(window.location.search).get('department');
  var page = window.location.pathname.split('/').pop() || 'index.html';
  var TECH_DEPARTMENTS = ['技术—前端', '技术—后端'];

  function isTechLeader(profile) {
    return Boolean(profile && profile.role === 'leader' && TECH_DEPARTMENTS.indexOf(profile.department) !== -1);
  }

  function canAccessDepartment(profile, target) {
    if (!profile || !target) return false;
    if (profile.role === 'admin') return true;
    if (target === '产品' && window.PatchworkRoles.productWorkspace(profile)) return true;
    if (isTechLeader(profile) && TECH_DEPARTMENTS.indexOf(target) !== -1) return true;
    return profile.department === target;
  }

  var INBOX_STORAGE_PREFIX = 'xiaoyuanbao-inbox-read:';
  var inboxItems = [];
  var inboxProfileId = '';
  var inboxReadMap = {};
  var inboxLoading = false;
  var taskItems = [], tasksLoading = null;

  function collectTasks(bugs, profile) {
    var items = [];
    if (!profile) return items;
    (bugs || []).forEach(function (bug) {
      if (!['open','in_progress','resolved'].includes(bug.status)) return;
      String(bug.assignee_department || '').split(',').filter(Boolean).forEach(function (dep) {
        var state = window.PatchworkAPI.departmentState(bug, dep);
        var assigned = state.assignee_id === profile.id;
        var pending = !state.assignee_id && dep === profile.department;
        if (!assigned && !pending) return;
        items.push({ id: bug.id + ':' + dep, code: window.PatchworkAPI.reportCode(bug), title: bug.title || '未命名报告', department: dep, pending: pending, done: state.status === 'resolved', status: state.status, time: state.updated_at || bug.updated_at || bug.created_at, href: (bug.request_type === 'product_change' ? 'product-change-detail.html?bug=' : 'bug-detail.html?bug=') + encodeURIComponent(bug.id) + '&department=' + encodeURIComponent(dep) });
      });
    });
    return items.sort(function (a,b) { return Number(a.done)-Number(b.done) || new Date(b.time || 0)-new Date(a.time || 0); });
  }

  function renderTasks() {
    var badge = document.getElementById('tasksBadge'), list = document.getElementById('tasksList');
    var count = taskItems.filter(function (item) { return !item.done; }).length;
    if (badge) { badge.textContent = count > 99 ? '99+' : String(count); badge.classList.toggle('hidden', !count); }
    if (!list) return;
    list.innerHTML = taskItems.length ? taskItems.map(function (item) {
      return '<article class="inbox-item task-item' + (item.done ? ' task-done' : '') + '"><input type="checkbox" disabled' + (item.done ? ' checked' : '') + ' aria-label="' + (item.done ? '已完成' : '未完成') + '"><a class="inbox-item-main" href="' + inboxEscape(item.href) + '"><div class="inbox-item-head"><strong>' + inboxEscape(item.code) + '</strong><span>' + inboxEscape(item.department) + '</span></div><h3>' + inboxEscape(item.title) + '</h3><p class="inbox-item-meta">' + (item.done ? '已完成' : item.status === 'in_progress' ? '处理中' : '待处理') + (item.pending ? ' · 本部门待指定跟进人' : ' · 已分配给我') + '</p></a></article>';
    }).join('') : '<div class="inbox-empty">暂无分配给你的工作</div>';
  }

  function ensureTasksModal() {
    if (document.getElementById('tasksModal')) return;
    var modal = document.createElement('div');
    modal.id = 'tasksModal'; modal.className = 'modal-backdrop hidden';
    modal.innerHTML = '<section class="user-modal inbox-modal" role="dialog" aria-modal="true" aria-labelledby="tasksTitle"><div class="developer-modal-header"><div><h2 id="tasksTitle">我的任务</h2><p class="user-modal-help">分配给我及本部门待指定的工作；完成状态按对应部门处理状态自动勾选，无需手动打勾。</p></div><button id="closeTasks" class="icon-button" type="button" aria-label="关闭任务">×</button></div><div id="tasksList" class="inbox-list"></div></section>';
    document.body.appendChild(modal);
    function close() { modal.classList.add('hidden'); document.body.classList.remove('drawer-open'); }
    document.getElementById('closeTasks').onclick = close;
    modal.onclick = function (event) { if (event.target === modal) close(); };
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && !modal.classList.contains('hidden')) close(); });
  }

  async function refreshTasks() {
    if (tasksLoading) return tasksLoading;
    tasksLoading = (async function () {
      try { await window.PATCHWORK_READY; if (!window.PATCHWORK_PROFILE || !window.PatchworkAPI) throw new Error('请先登录后查看任务'); taskItems = collectTasks(await window.PatchworkAPI.listBugs(), window.PATCHWORK_PROFILE); renderTasks(); }
      catch (error) { var list = document.getElementById('tasksList'); if (list) list.innerHTML = '<div class="inbox-empty">任务加载失败：' + inboxEscape(error.message) + '<button type="button" id="retryTasks" class="case-action-button">重试</button></div>'; var retry = document.getElementById('retryTasks'); if (retry) retry.onclick = refreshTasks; }
      finally { tasksLoading = null; }
    })();
    return tasksLoading;
  }

  function openTasks() {
    closeInbox(); ensureTasksModal();
    document.getElementById('tasksModal').classList.remove('hidden'); document.body.classList.add('drawer-open');
    document.getElementById('tasksList').innerHTML = '<div class="inbox-empty">正在加载任务…</div>';
    return refreshTasks();
  }

  window.addEventListener('patchwork:reports-changed', refreshTasks);
  window.addEventListener('patchwork:page-ready', scheduleInboxLoad);
  window.addEventListener('focus', function () { var modal = document.getElementById('tasksModal'); if (modal && !modal.classList.contains('hidden')) refreshTasks(); });
  window.addEventListener('pageshow', function (event) { if (event.persisted && window.PatchworkAPI) refreshTasks(); });
  document.addEventListener('visibilitychange', function () { var modal = document.getElementById('tasksModal'); if (!document.hidden && modal && !modal.classList.contains('hidden')) refreshTasks(); });
  window.setInterval(function () { var modal = document.getElementById('tasksModal'); if (!document.hidden && modal && !modal.classList.contains('hidden')) refreshTasks(); }, 30000);

  function inboxEscape(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function inboxDate(value) {
    var date = value ? new Date(value) : null;
    return date && !isNaN(date.getTime()) ? date.toLocaleString('zh-CN', { hour12: false }) : '—';
  }

  function inboxTruncate(value, max) {
    var text = String(value || '').replace(/\s+/g, ' ').trim();
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  function loadInboxReadState(profileId) {
    inboxReadMap = {};
    try {
      var stored = JSON.parse(localStorage.getItem(INBOX_STORAGE_PREFIX + profileId) || '[]');
      if (Array.isArray(stored)) stored.forEach(function (id) { inboxReadMap[id] = true; });
    } catch (error) {
      inboxReadMap = {};
    }
  }

  function saveInboxReadState() {
    if (!inboxProfileId) return;
    try {
      localStorage.setItem(INBOX_STORAGE_PREFIX + inboxProfileId, JSON.stringify(Object.keys(inboxReadMap)));
    } catch (error) {
      return;
    }
  }

  function updateInboxBadge() {
    var badge = document.getElementById('inboxBadge');
    if (!badge) return;
    var count = inboxItems.filter(function (item) { return !inboxReadMap[item.id]; }).length;
    badge.textContent = count > 99 ? '99+' : String(count);
    badge.classList.toggle('hidden', count === 0);
  }

  function renderInboxList(loading) {
    var list = document.getElementById('inboxList');
    if (!list) return;
    if (loading) {
      list.innerHTML = '<div class="inbox-empty">正在加载消息…</div>';
      return;
    }
    if (!inboxItems.length) {
      list.innerHTML = '<div class="inbox-empty">暂无消息</div>';
      return;
    }
    list.innerHTML = inboxItems.map(function (item) {
      var unread = !inboxReadMap[item.id];
      var meta = item.type === 'reject'
        ? '驳回时间：' + inboxDate(item.time) + ' · 处理人：' + inboxEscape(item.person || '—')
        : '提交人：' + inboxEscape(item.person || '—') + ' · 提交时间：' + inboxDate(item.time);
      var note = item.type === 'reject' && item.note ? '<p class="inbox-item-note">' + inboxEscape(inboxTruncate(item.note, 60)) + '</p>' : '';
      return '<article class="inbox-item' + (unread ? ' unread' : '') + '"><a class="inbox-item-main" href="' + inboxEscape(item.href) + '"><div class="inbox-item-head"><span class="inbox-type inbox-type-' + item.type + '">' + (item.type === 'reject' ? '被驳回' : '待审核') + '</span><strong>' + inboxEscape(item.code) + '</strong></div><h3>' + inboxEscape(item.title) + '</h3><p class="inbox-item-meta">' + meta + '</p>' + note + '</a><button class="inbox-read-toggle' + (unread ? '' : ' read') + '" type="button" data-inbox-read="' + inboxEscape(item.id) + '" aria-pressed="' + String(unread) + '" title="' + (unread ? '当前未读，点击标为已读' : '当前已读，点击标为未读') + '"><span class="inbox-read-track"><i></i></span><span class="inbox-read-text">' + (unread ? '未读' : '已读') + '</span></button></article>';
    }).join('');
    list.querySelectorAll('[data-inbox-read]').forEach(function (button) {
      button.onclick = function (event) {
        event.preventDefault();
        event.stopPropagation();
        var id = button.getAttribute('data-inbox-read');
        if (inboxReadMap[id]) delete inboxReadMap[id]; else inboxReadMap[id] = true;
        saveInboxReadState();
        var unread = !inboxReadMap[id];
        button.classList.toggle('read', !unread);
        button.setAttribute('aria-pressed', String(unread));
        button.title = unread ? '当前未读，点击标为已读' : '当前已读，点击标为未读';
        var label = button.querySelector('.inbox-read-text');
        if (label) label.textContent = unread ? '未读' : '已读';
        var article = button.closest('.inbox-item');
        if (article) article.classList.toggle('unread', unread);
        updateInboxBadge();
      };
    });
  }

  function ensureInboxModal() {
    if (document.getElementById('inboxModal')) return;
    var modal = document.createElement('div');
    modal.id = 'inboxModal';
    modal.className = 'modal-backdrop hidden';
    modal.innerHTML = '<section class="user-modal inbox-modal" role="dialog" aria-modal="true" aria-labelledby="inboxTitle"><div class="developer-modal-header"><div><h2 id="inboxTitle">收件箱</h2><p class="user-modal-identity">被驳回的报告与待审核内容</p><p class="user-modal-help">最新消息排在最上方；可在右侧切换已读或未读。</p></div><button id="closeInbox" class="icon-button" type="button" aria-label="关闭收件箱">×</button></div><div id="inboxList" class="inbox-list"></div></section>';
    document.body.appendChild(modal);
    document.getElementById('closeInbox').onclick = closeInbox;
    modal.addEventListener('click', function (event) { if (event.target === modal) closeInbox(); });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && !modal.classList.contains('hidden')) closeInbox(); });
  }

  function closeInbox() {
    var modal = document.getElementById('inboxModal');
    if (!modal || modal.classList.contains('hidden')) return;
    modal.classList.add('hidden');
    document.body.classList.remove('drawer-open');
  }

  async function openInbox() {
    var tasks = document.getElementById('tasksModal');
    if (tasks) tasks.classList.add('hidden');
    ensureInboxModal();
    var modal = document.getElementById('inboxModal');
    modal.classList.remove('hidden');
    document.body.classList.add('drawer-open');
    renderInboxList(true);
    if (window.PATCHWORK_READY) {
      try { await window.PATCHWORK_READY; } catch (error) {}
    }
    var loaded = await loadInbox();
    if (loaded !== false) renderInboxList();
  }

  function scheduleInboxLoad() {
    if (window.PatchworkAPI) {
      loadInbox();
      return;
    }
    var retry = function () { loadInbox(); };
    if (document.readyState === 'complete') window.setTimeout(retry, 0);
    else window.addEventListener('load', retry, { once: true });
  }

  async function loadInbox() {
    var profile = window.PATCHWORK_PROFILE;
    if (!profile || !window.PatchworkAPI) {
      inboxItems = [];
      updateInboxBadge();
      return true;
    }
    if (inboxLoading) return true;
    inboxLoading = true;
    try {
      var result = await Promise.all([window.PatchworkAPI.listBugs(), window.PatchworkAPI.listProfiles()]);
      var bugs = result[0] || [];
      taskItems = collectTasks(bugs, profile); renderTasks();
      var profiles = result[1] || [];
      var profileMap = {};
      profiles.forEach(function (person) { profileMap[person.id] = person; });
      var reviewStage = Number(profile.review_stage);
      var items = [];
      bugs.forEach(function (bug) {
        var type = '';
        var personName = '';
        if (bug.status === 'rejected' && bug.submitter_id === profile.id) {
          type = 'reject';
          var reviewer = profileMap[bug.reviewer_id];
          personName = reviewer ? (reviewer.full_name || reviewer.username) : '审核人';
        } else if ((bug.request_type === 'product_change' && bug.status === 'pending_review_1' && window.PatchworkRoles.productLead(profile) && bug.submitter_id !== profile.id) || (bug.request_type !== 'product_change' && reviewStage && bug.status === (reviewStage === 1 ? 'pending_review_1' : 'pending_review_2'))) {
          type = 'review';
          var submitter = profileMap[bug.submitter_id];
          personName = submitter ? (submitter.full_name || submitter.username) : (bug.reporter || '提交人');
        }
        if (!type) return;
        items.push({
          id: type + ':' + bug.id + ':' + (bug.updated_at || bug.created_at || ''),
          type: type,
          code: window.PatchworkAPI.reportCode(bug),
          title: bug.title || '未命名报告',
          time: type === 'reject' ? (bug.updated_at || bug.created_at) : (bug.created_at || bug.updated_at),
          person: personName,
          note: bug.review_note || '',
          href: (bug.request_type === 'product_change' ? 'product-change-detail.html?bug=' : 'bug-detail.html?bug=') + encodeURIComponent(bug.id)
        });
      });
      items.sort(function (a, b) { return new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime(); });
      inboxItems = items;
      if (inboxProfileId !== profile.id) {
        inboxProfileId = profile.id;
        loadInboxReadState(profile.id);
      }
      updateInboxBadge();
      var modal = document.getElementById('inboxModal');
      if (modal && !modal.classList.contains('hidden')) renderInboxList();
      return true;
    } catch (error) {
      var modal = document.getElementById('inboxModal');
      if (modal && !modal.classList.contains('hidden')) {
        var list = document.getElementById('inboxList');
        if (list) list.innerHTML = '<div class="inbox-empty">消息加载失败：' + inboxEscape(error.message || '请稍后重试') + '</div>';
      }
      return false;
    } finally {
      inboxLoading = false;
    }
  }

  function renderNavigation() {
    if (!topbar) return;
    var version = window.PATCHWORK_CONFIG && window.PATCHWORK_CONFIG.version ? window.PATCHWORK_CONFIG.version : '1.1.2';
    var navProfile = window.PATCHWORK_PROFILE;
    var navProductLead = window.PatchworkRoles.productWorkspace(navProfile);
    var homeHref = navProductLead ? 'index.html?workspace=test' : 'index.html';
    topbar.innerHTML = '<a class="brand" href="index.html" aria-label="校缘宝内测管理网站首页"><span><strong>校缘宝内测管理网站</strong><small class="brand-version">' + version + '</small></span></a>' +
      '<nav class="topnav" aria-label="主导航"><div class="nav-menu-card">' +
      '<a data-nav="home" class="nav-test-root" href="' + homeHref + '">测试</a>' +
      '<a data-department="技术—前端" href="department-bugs.html?department=技术—前端">技术—前端</a>' +
      '<a data-department="技术—后端" href="department-bugs.html?department=技术—后端">技术—后端</a>' +
      '<a data-department="设计" href="department-bugs.html?department=设计">设计</a>' +
      '<a data-department="产品" href="' + (navProductLead ? 'index.html?workspace=product' : 'department-bugs.html?department=产品') + '">产品</a>' +
      '<a data-review-only class="review-nav-link hidden" href="review-bugs.html">待审核</a>' +
      '<a data-admin-only class="admin-nav-link hidden" href="user-management.html">超级管理员</a>' +
      '</div><a class="nav-notice" href="announcements.html">公告信息</a><a class="nav-data-board" href="data-dashboard.html">数据看板</a><section class="nav-daily-quote" aria-label="每日短句"><blockquote id="dailyQuoteText">愿每一份努力，都能汇成前进的力量。</blockquote><cite id="dailyQuoteAuthor">— 校缘宝</cite></section></nav>' +
      '<div class="topbar-account"><button id="inboxButton" class="inbox-button" type="button" aria-label="打开收件箱"><span class="inbox-label">信息</span><span id="inboxBadge" class="inbox-badge hidden">0</span></button><button id="topUserCard" class="top-user-card" type="button"><span id="topUserAvatar" class="top-user-avatar">?</span><span><strong id="topUserName">当前成员</strong><small id="topUserDepartment">未登录</small></span></button></div>';

    topbar.querySelectorAll('[data-nav]').forEach(function (link) {
      var publicPage = ['announcements.html', 'announcement-detail.html', 'data-dashboard.html'].includes(page);
      var productLead = window.PatchworkRoles.productWorkspace(window.PATCHWORK_PROFILE);
      var workspace = new URLSearchParams(window.location.search).get('workspace');
      var adminTestWorkspace = workspace === 'test';
      link.classList.toggle('active', ((!productLead || adminTestWorkspace) && !department && !publicPage && page !== 'user-management.html' && link.dataset.nav === 'home'));
    });
    topbar.querySelectorAll('[data-department]').forEach(function (link) {
      var profile = window.PATCHWORK_PROFILE;
      var workspace = new URLSearchParams(window.location.search).get('workspace');
      var productLeadHome = link.dataset.department === '产品' && page === 'index.html' && window.PatchworkRoles.productWorkspace(profile) && workspace !== 'test' && (profile.role !== 'admin' || workspace === 'product');
      link.classList.toggle('active', link.dataset.department === department || productLeadHome || (link.dataset.department === '产品' && page === 'index.html' && workspace === 'product'));
    });
    topbar.querySelectorAll('[data-admin-only]').forEach(function (link) {
      link.classList.toggle('active', page === 'user-management.html');
      link.classList.toggle('hidden', !window.PATCHWORK_PROFILE || window.PATCHWORK_PROFILE.role !== 'admin');
    });
    var noticeLink = topbar.querySelector('.nav-notice');
    if (noticeLink) noticeLink.classList.toggle('active', page === 'announcements.html' || page === 'announcement-detail.html');
    topbar.querySelector('.nav-data-board').classList.toggle('active', page === 'data-dashboard.html');
    document.getElementById('topUserCard').addEventListener('click', openProfileModal);
    document.getElementById('inboxButton').addEventListener('click', openInbox);
    var taskButton = document.createElement('button');
    taskButton.id = 'tasksButton'; taskButton.type = 'button'; taskButton.className = 'inbox-button';
    taskButton.innerHTML = '任务<span id="tasksBadge" class="inbox-badge hidden">0</span>';
    document.getElementById('inboxButton').before(taskButton);
    taskButton.onclick = openTasks;
    var taskStyles = document.createElement('link'); taskStyles.rel = 'stylesheet'; taskStyles.href = 'css/tasks.css?v=1.7.0'; document.head.appendChild(taskStyles);
    loadDailyQuote();
  }

  async function loadDailyQuote() {
    var quotes = [
      '愿每一份努力，都能汇成前进的力量。',
      '今天的进步，无论多小，都值得肯定。',
      '把复杂的事情做好，就是不平凡。',
      '持续前进的人，终会抵达想去的地方。',
      '认真做好眼前的事，时间会给出答案。',
      '每一次解决问题，都是团队向前的一步。',
      '开始行动，就是改变的开始。'
    ];
    var key = new Date().toISOString().slice(0, 10);
    var fallback = quotes[Math.floor(new Date(key).getTime() / 86400000) % quotes.length];
    var text = document.getElementById('dailyQuoteText');
    var author = document.getElementById('dailyQuoteAuthor');
    if (!text || !author) return;
    try {
      var controller = new AbortController();
      var timeout = window.setTimeout(function () { controller.abort(); }, 3500);
      var response = await fetch('https://v1.hitokoto.cn/?c=k', { signal: controller.signal, cache: 'no-store' });
      window.clearTimeout(timeout);
      if (!response.ok) throw new Error('quote API unavailable');
      var result = await response.json();
      if (!result || !result.hitokoto) throw new Error('invalid quote response');
      text.textContent = result.hitokoto;
      author.textContent = result.from_who || result.from ? '— ' + (result.from_who || result.from) : '';
    } catch (error) {
      text.textContent = fallback;
      author.textContent = '';
    }
  }

  function openProfileModal() {
    var profile = window.PATCHWORK_PROFILE;
    if (!profile) return;
    var modal = document.getElementById('profileModal');
    if (!modal) {
      modal = document.createElement('div'); modal.id = 'profileModal'; modal.className = 'modal-backdrop hidden';
      modal.innerHTML = '<section class="user-modal profile-modal"><div class="developer-modal-header"><div><h2>个人信息</h2><p id="profileIdentity" class="user-modal-identity"></p><p class="user-modal-help">可维护个人联系方式和可联系时间，仅本人可编辑。</p></div><button id="closeProfileModal" class="icon-button" type="button">×</button></div><form id="profileForm" class="user-form"><label class="field"><span>QQ</span><input name="qq" type="text"></label><label class="field"><span>微信</span><input name="wechat" type="text"></label><label class="field"><span>电话号码</span><input name="phone" type="text"></label><label class="field"><span>可联系时间</span><div class="contact-time-control"><input name="contact_time" type="text" placeholder="例如：18:00-21:00"><button id="openSchedule" type="button">按日划分</button></div></label><p id="profileError" class="login-error hidden"></p><div class="profile-footer-actions"><div class="profile-account-links"><button id="openAccountSettings" class="account-management-button" type="button">账户管理</button><button id="logoutFromProfile" class="logout-link-button" type="button">退出登录</button></div><div class="edit-user-actions"><button id="cancelProfile" class="user-cancel-button" type="button">取消</button><button class="case-action-button" type="submit">保存信息</button></div></div></form></section>';
      document.body.appendChild(modal);
      document.getElementById('closeProfileModal').onclick = closeProfileModal; document.getElementById('cancelProfile').onclick = closeProfileModal; modal.onclick = function (event) { if (event.target === modal) closeProfileModal(); }; document.getElementById('profileForm').onsubmit = saveProfile; document.getElementById('openSchedule').onclick = openScheduleModal; document.getElementById('openAccountSettings').onclick = openAccountSettings; document.getElementById('logoutFromProfile').onclick = openLogoutConfirm;
    }
    var form = document.getElementById('profileForm'); form.qq.value = profile.qq || ''; form.wechat.value = profile.wechat || ''; form.phone.value = profile.phone || ''; form.contact_time.value = formatContactSchedule(profile.contact_schedule, profile.contact_time); document.getElementById('profileIdentity').textContent = (profile.full_name || profile.username) + '｜' + (profile.department === '测试' ? '测试组' : profile.department); modal.classList.remove('hidden');
  }
  function formatContactSchedule(schedule, fallback) { var days = ['周一','周二','周三','周四','周五','周六','周日']; var values = schedule || {}; var lines = days.filter(function (day) { return values[day]; }).map(function (day) { return day + '：' + values[day]; }); return lines.length ? lines.join('；') : (fallback || ''); }
  function openScheduleModal() { var modal = document.getElementById('scheduleModal'); if (!modal) { modal = document.createElement('div'); modal.id = 'scheduleModal'; modal.className = 'modal-backdrop hidden'; modal.innerHTML = '<section class="user-modal schedule-modal"><div class="developer-modal-header"><div><button id="backToProfile" class="schedule-back" type="button">← 返回</button><h2>按日划分</h2><p class="user-modal-help">设置每天的可联系时间。</p></div><button id="closeSchedule" class="icon-button" type="button">×</button></div><div id="scheduleList" class="schedule-list"></div><div class="edit-user-actions schedule-actions"><button id="saveSchedule" class="case-action-button" type="button">保存时间</button></div></section>'; document.body.appendChild(modal); document.getElementById('backToProfile').onclick = closeScheduleModal; document.getElementById('closeSchedule').onclick = closeScheduleModal; document.getElementById('saveSchedule').onclick = saveSchedule; } var days = ['周一','周二','周三','周四','周五','周六','周日']; var schedule = window.PATCHWORK_PROFILE.contact_schedule || {}; document.getElementById('scheduleList').innerHTML = days.map(function (day) { return '<label class="schedule-row"><span>' + day + '</span><input data-day="' + day + '" type="text" value="' + (schedule[day] || '') + '" placeholder="例如：18:00-21:00"></label>'; }).join(''); document.getElementById('profileModal').classList.add('schedule-slide-out'); modal.classList.remove('hidden'); }
  function closeScheduleModal() { var modal = document.getElementById('scheduleModal'); if (modal) modal.classList.add('hidden'); var profile = document.getElementById('profileModal'); if (profile) profile.classList.remove('schedule-slide-out'); }
  async function saveSchedule() { var schedule = {}; document.querySelectorAll('#scheduleList input[data-day]').forEach(function (input) { schedule[input.dataset.day] = input.value.trim(); }); var summary = formatContactSchedule(schedule, ''); try { var result = await window.PATCHWORK_SUPABASE.rpc('update_my_contact_profile', { p_qq: window.PATCHWORK_PROFILE.qq || '', p_wechat: window.PATCHWORK_PROFILE.wechat || '', p_phone: window.PATCHWORK_PROFILE.phone || '', p_contact_time: summary, p_contact_schedule: schedule }); if (result.error) throw result.error; window.PATCHWORK_PROFILE = Object.assign({}, window.PATCHWORK_PROFILE, { contact_time: summary, contact_schedule: schedule }); localStorage.setItem('xiaoyuanbao-profile-cache', JSON.stringify(window.PATCHWORK_PROFILE)); var profileForm = document.getElementById('profileForm'); if (profileForm) profileForm.contact_time.value = summary; closeScheduleModal(); } catch (error) { alert(error.message || '保存时间失败。'); } }
  function closeProfileModal() { var modal = document.getElementById('profileModal'); if (modal) modal.classList.add('hidden'); }
  function openAccountSettings() { var modal = document.getElementById('accountSettingsModal'); if (!modal) { modal = document.createElement('div'); modal.id = 'accountSettingsModal'; modal.className = 'modal-backdrop hidden'; modal.innerHTML = '<section class="user-modal"><div class="developer-modal-header"><div><h2>账户管理</h2><p class="user-modal-help">修改登录密码。</p></div><button id="closeAccountSettings" class="icon-button" type="button">×</button></div><form id="passwordForm" class="user-form"><label class="field"><span>当前密码 *</span><input name="current_password" type="password" required></label><label class="field"><span>新密码 *</span><input name="new_password" type="password" required minlength="6"></label><label class="field"><span>确认新密码 *</span><input name="confirm_password" type="password" required minlength="6"></label><p id="passwordError" class="login-error hidden"></p><div class="account-actions"><button class="case-action-button" type="submit">修改密码</button></div></form></section>'; document.body.appendChild(modal); document.getElementById('closeAccountSettings').onclick = closeAccountSettings; modal.onclick = function (event) { if (event.target === modal) closeAccountSettings(); }; document.getElementById('passwordForm').onsubmit = changePassword; } modal.classList.remove('hidden'); }
  function closeAccountSettings() { var modal = document.getElementById('accountSettingsModal'); if (modal) modal.classList.add('hidden'); }
  async function changePassword(event) { event.preventDefault(); var form = event.currentTarget, error = document.getElementById('passwordError'), button = form.querySelector('button[type="submit"]'); var data = Object.fromEntries(new FormData(form).entries()); error.classList.add('hidden'); if (data.new_password !== data.confirm_password) { error.textContent = '两次输入的新密码不一致。'; error.classList.remove('hidden'); return; } button.disabled = true; button.textContent = '修改中…'; try { var user = (await window.PATCHWORK_SUPABASE.auth.getUser()).data.user; var email = user.email; var check = await window.PATCHWORK_SUPABASE.auth.signInWithPassword({ email: email, password: data.current_password }); if (check.error) throw new Error('当前密码不正确。'); var result = await window.PATCHWORK_SUPABASE.auth.updateUser({ password: data.new_password }); if (result.error) throw result.error; form.reset(); closeAccountSettings(); toast('密码修改成功。', 'success'); } catch (e) { error.textContent = e.message || '密码修改失败。'; error.classList.remove('hidden'); } finally { button.disabled = false; button.textContent = '修改密码'; } }
  function openLogoutConfirm() { var modal = document.getElementById('logoutConfirmModal'); if (!modal) { modal = document.createElement('div'); modal.id = 'logoutConfirmModal'; modal.className = 'modal-backdrop hidden'; modal.innerHTML = '<section class="user-modal logout-confirm-modal"><div class="developer-modal-header"><div><h2>确认退出登录？</h2><p class="user-modal-help">退出后需要重新输入账号和密码才能进入网站。</p></div><button id="closeLogoutConfirm" class="icon-button" type="button">×</button></div><div class="logout-confirm-actions"><button id="cancelLogoutConfirm" class="user-cancel-button" type="button">取消</button><button id="confirmLogoutConfirm" class="case-action-button" type="button">确认退出</button></div></section>'; document.body.appendChild(modal); document.getElementById('closeLogoutConfirm').onclick = closeLogoutConfirm; document.getElementById('cancelLogoutConfirm').onclick = closeLogoutConfirm; modal.onclick = function (event) { if (event.target === modal) closeLogoutConfirm(); }; document.getElementById('confirmLogoutConfirm').onclick = confirmLogout; } modal.classList.remove('hidden'); }
  function closeLogoutConfirm() { var modal = document.getElementById('logoutConfirmModal'); if (modal) modal.classList.add('hidden'); }
  async function confirmLogout() { closeLogoutConfirm(); closeAccountSettings(); closeProfileModal(); if (window.PATCHWORK_AUTH) await window.PATCHWORK_AUTH.signOut(); }
  async function saveProfile(event) { event.preventDefault(); var form = event.currentTarget, button = form.querySelector('button[type="submit"]'), error = document.getElementById('profileError'); button.disabled = true; button.textContent = '保存中…'; error.classList.add('hidden'); try { var schedule = window.PATCHWORK_PROFILE.contact_schedule || {}; var patch = { p_qq: form.qq.value.trim(), p_wechat: form.wechat.value.trim(), p_phone: form.phone.value.trim(), p_contact_time: form.contact_time.value.trim(), p_contact_schedule: schedule }; var result = await window.PATCHWORK_SUPABASE.rpc('update_my_contact_profile', patch); if (result.error) throw result.error; window.PATCHWORK_PROFILE = Object.assign({}, window.PATCHWORK_PROFILE, { qq: patch.p_qq, wechat: patch.p_wechat, phone: patch.p_phone, contact_time: patch.p_contact_time, contact_schedule: schedule }); localStorage.setItem('xiaoyuanbao-profile-cache', JSON.stringify(window.PATCHWORK_PROFILE)); closeProfileModal(); } catch (e) { error.textContent = e.message || '个人信息保存失败。'; error.classList.remove('hidden'); } finally { button.disabled = false; button.textContent = '保存信息'; } }

  function syncProfile(verified) {
    var profile = window.PATCHWORK_PROFILE;
    var avatar = document.getElementById('topUserAvatar');
    var name = document.getElementById('topUserName');
    var departmentNode = document.getElementById('topUserDepartment');
    if (!avatar || !name || !departmentNode) return;
    var label = profile ? (profile.full_name || profile.username) : '当前成员';
    avatar.textContent = label.slice(0, 1);
    name.textContent = label;
    departmentNode.textContent = profile ? (profile.role === 'admin' ? '超级管理员 · 已登录' : profile.department + ' · 已登录') : '未登录';
    document.querySelectorAll('[data-admin-only]').forEach(function (link) {
      link.classList.toggle('hidden', !profile || profile.role !== 'admin');
    });
    document.querySelectorAll('[data-review-only]').forEach(function (link) {
      link.classList.toggle('hidden', !profile || !(Number(profile.review_stage) > 0));
    });
    var productDepartmentLink = topbar.querySelector('[data-department="产品"]');
    var isProductLead = window.PatchworkRoles.productWorkspace(profile);
    var homeLink = topbar.querySelector('[data-nav="home"]');
    var workspace = new URLSearchParams(window.location.search).get('workspace');
    if (homeLink && isProductLead) homeLink.href = 'index.html?workspace=test';
    if (productDepartmentLink) productDepartmentLink.href = isProductLead ? 'index.html?workspace=product' : 'department-bugs.html?department=产品';
    // Cached identity can be shown immediately, but only verified permissions may redirect.
    if (verified && profile && profile.role !== 'admin') {
      var currentDepartment = new URLSearchParams(window.location.search).get('department');
      var productLead = isProductLead;
      var allowedHome = profile.department === '测试' ? !currentDepartment : currentDepartment === profile.department;
      document.querySelectorAll('.nav-menu-card a').forEach(function (link) {
        var isAllowed = link.dataset.nav === 'home' ? profile.department === '测试' : canAccessDepartment(profile, link.dataset.department);
        if (link.dataset.nav === 'home' && productLead) isAllowed = profile.department === '测试';
        if (link.hasAttribute('data-admin-only')) isAllowed = false;
        if (link.hasAttribute('data-review-only')) isAllowed = Number(profile.review_stage) > 0;
        link.classList.toggle('nav-disabled', !isAllowed);
        link.setAttribute('aria-disabled', String(!isAllowed));
        if (!isAllowed) link.removeAttribute('href');
      });
      var currentPage = window.location.pathname.split('/').pop() || 'index.html';
      var isProductUploadPage = currentPage === 'submit-bug.html' && new URLSearchParams(window.location.search).get('source') === 'product' && (profile.department === '产品' || profile.role === 'admin' || productLead);
      var isReviewerEditPage = currentPage === 'submit-bug.html' && Boolean(new URLSearchParams(window.location.search).get('bug')) && Number(profile.review_stage) > 0;
      var isReviewDetail = currentPage === 'bug-detail.html' && Number(profile.review_stage) > 0;
      var isDepartmentPage = currentPage === 'department-bugs.html' || (currentPage === 'bug-detail.html' && Boolean(currentDepartment)) || isProductUploadPage || isReviewerEditPage;
      var isPublicWorkspacePage = ['announcements.html', 'announcement-detail.html', 'review-bugs.html', 'data-dashboard.html', 'product-change-requests.html', 'product-change-detail.html'].includes(currentPage);
      var isProductLeadPage = productLead && ['index.html', 'product-change-requests.html', 'product-change-detail.html', 'submit-product-request.html'].includes(currentPage);
      if (productLead && ['bug-reports.html','bug-detail.html'].includes(currentPage) && new URLSearchParams(window.location.search).get('source') === 'product') return;
      if (window.PatchworkRoles.productDeputy(profile) && ['bug-reports.html','bug-detail.html'].includes(currentPage) && !currentDepartment) return;
      if (isPublicWorkspacePage || isReviewDetail || isProductLeadPage || isProductUploadPage || (productLead && currentDepartment === '产品')) {
        return;
      } else if (profile.department === '测试' && isDepartmentPage) {
        window.location.replace('index.html');
      } else if (profile.department !== '测试' && !isProductUploadPage && !isReviewerEditPage && (!isDepartmentPage || !canAccessDepartment(profile, currentDepartment))) {
        window.location.replace('department-bugs.html?department=' + encodeURIComponent(profile.department));
      }
    }
  }

  renderNavigation();
  syncProfile();
  if (window.PATCHWORK_READY) {
    window.PATCHWORK_READY.then(function () {
      syncProfile(true);
      scheduleInboxLoad();
    }).catch(function (error) { console.error('导航登录验证失败', error); });
  }
})();
