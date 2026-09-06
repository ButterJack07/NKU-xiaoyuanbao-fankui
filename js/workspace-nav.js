(function () {
  'use strict';

  var topbar = document.querySelector('.topbar');
  var department = new URLSearchParams(window.location.search).get('department');
  var page = window.location.pathname.split('/').pop() || 'index.html';

  function renderNavigation() {
    if (!topbar) return;
    var version = window.PATCHWORK_CONFIG && window.PATCHWORK_CONFIG.version ? window.PATCHWORK_CONFIG.version : '1.1.2';
    topbar.innerHTML = '<a class="brand" href="index.html" aria-label="校缘宝内测管理网站首页"><span><strong>校缘宝内测管理网站</strong><small class="brand-version">版本 ' + version + '</small></span></a>' +
      '<nav class="topnav" aria-label="主导航"><div class="nav-menu-card">' +
      '<a data-nav="home" class="nav-test-root" href="index.html">测试</a>' +
      '<a data-department="技术—前端" href="index.html?department=技术—前端">技术—前端</a>' +
      '<a data-department="技术—后端" href="index.html?department=技术—后端">技术—后端</a>' +
      '<a data-department="设计" href="index.html?department=设计">设计</a>' +
      '<a data-department="产品" href="index.html?department=产品">产品</a>' +
      '<a data-admin-only class="admin-nav-link hidden" href="user-management.html">超级管理员</a>' +
      '</div><a class="nav-notice" href="index.html#myTasksPanel">公告信息</a></nav>' +
      '<button id="topUserCard" class="top-user-card" type="button"><span id="topUserAvatar" class="top-user-avatar">?</span><span><strong id="topUserName">当前成员</strong><small id="topUserDepartment">未登录</small></span></button>';

    topbar.querySelectorAll('[data-nav]').forEach(function (link) {
      link.classList.toggle('active', !department && page !== 'user-management.html' && link.dataset.nav === 'home');
    });
    topbar.querySelectorAll('[data-department]').forEach(function (link) {
      link.classList.toggle('active', link.dataset.department === department);
    });
    topbar.querySelectorAll('[data-admin-only]').forEach(function (link) {
      link.classList.toggle('active', page === 'user-management.html');
      link.classList.toggle('hidden', !window.PATCHWORK_PROFILE || window.PATCHWORK_PROFILE.role !== 'admin');
    });
    document.getElementById('topUserCard').addEventListener('click', function () { window.location.href = 'index.html'; });
  }

  function syncProfile() {
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
  }

  renderNavigation();
  syncProfile();
  if (window.PATCHWORK_READY) window.PATCHWORK_READY.then(syncProfile);
})();
