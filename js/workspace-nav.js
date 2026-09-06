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
      '<a data-department="技术—前端" href="department-bugs.html?department=技术—前端">技术—前端</a>' +
      '<a data-department="技术—后端" href="department-bugs.html?department=技术—后端">技术—后端</a>' +
      '<a data-department="设计" href="department-bugs.html?department=设计">设计</a>' +
      '<a data-department="产品" href="department-bugs.html?department=产品">产品</a>' +
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
    document.getElementById('topUserCard').addEventListener('click', openProfileModal);
  }

  function openProfileModal() {
    var profile = window.PATCHWORK_PROFILE;
    if (!profile) return;
    var modal = document.getElementById('profileModal');
    if (!modal) {
      modal = document.createElement('div'); modal.id = 'profileModal'; modal.className = 'modal-backdrop hidden';
      modal.innerHTML = '<section class="user-modal profile-modal"><div class="developer-modal-header"><div><h2>个人信息</h2><p id="profileIdentity" class="user-modal-identity"></p><p class="user-modal-help">可维护个人联系方式和可联系时间，仅本人可编辑。</p></div><button id="closeProfileModal" class="icon-button" type="button">×</button></div><form id="profileForm" class="user-form"><label class="field"><span>QQ</span><input name="qq" type="text"></label><label class="field"><span>微信</span><input name="wechat" type="text"></label><label class="field"><span>电话号码</span><input name="phone" type="text"></label><label class="field"><span>可联系时间</span><input name="contact_time" type="text" placeholder="例如：18:00-21:00"></label><p id="profileError" class="login-error hidden"></p><div class="edit-user-actions"><button id="cancelProfile" class="user-cancel-button" type="button">取消</button><button class="case-action-button" type="submit">保存信息</button></div></form></section>';
      document.body.appendChild(modal);
      document.getElementById('closeProfileModal').onclick = closeProfileModal; document.getElementById('cancelProfile').onclick = closeProfileModal; modal.onclick = function (event) { if (event.target === modal) closeProfileModal(); }; document.getElementById('profileForm').onsubmit = saveProfile;
    }
    var form = document.getElementById('profileForm'); form.qq.value = profile.qq || ''; form.wechat.value = profile.wechat || ''; form.phone.value = profile.phone || ''; form.contact_time.value = profile.contact_time || ''; document.getElementById('profileIdentity').textContent = (profile.full_name || profile.username) + '｜' + (profile.department === '测试' ? '测试组' : profile.department); modal.classList.remove('hidden');
  }
  function closeProfileModal() { var modal = document.getElementById('profileModal'); if (modal) modal.classList.add('hidden'); }
  async function saveProfile(event) { event.preventDefault(); var form = event.currentTarget, button = form.querySelector('button[type="submit"]'), error = document.getElementById('profileError'); button.disabled = true; button.textContent = '保存中…'; error.classList.add('hidden'); try { var patch = { p_qq: form.qq.value.trim(), p_wechat: form.wechat.value.trim(), p_phone: form.phone.value.trim(), p_contact_time: form.contact_time.value.trim() }; var result = await window.PATCHWORK_SUPABASE.rpc('update_my_contact_profile', patch); if (result.error) throw result.error; window.PATCHWORK_PROFILE = Object.assign({}, window.PATCHWORK_PROFILE, { qq: patch.p_qq, wechat: patch.p_wechat, phone: patch.p_phone, contact_time: patch.p_contact_time }); localStorage.setItem('xiaoyuanbao-profile-cache', JSON.stringify(window.PATCHWORK_PROFILE)); closeProfileModal(); } catch (e) { error.textContent = e.message || '个人信息保存失败。'; error.classList.remove('hidden'); } finally { button.disabled = false; button.textContent = '保存信息'; } }

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
    if (profile && profile.role !== 'admin') {
      var currentDepartment = new URLSearchParams(window.location.search).get('department');
      var allowedHome = profile.department === '测试' ? !currentDepartment : currentDepartment === profile.department;
      document.querySelectorAll('.nav-menu-card a').forEach(function (link) {
        var isAllowed = link.dataset.nav === 'home' ? profile.department === '测试' : link.dataset.department === profile.department;
        if (link.hasAttribute('data-admin-only')) isAllowed = false;
        link.classList.toggle('nav-disabled', !isAllowed);
        link.setAttribute('aria-disabled', String(!isAllowed));
        if (!isAllowed) link.removeAttribute('href');
      });
      var currentPage = window.location.pathname.split('/').pop() || 'index.html';
      var isDepartmentPage = currentPage === 'department-bugs.html' || (currentPage === 'bug-detail.html' && Boolean(currentDepartment));
      var isTestPage = ['index.html', 'test-cases.html', 'bug-reports.html', 'submit-bug.html'].includes(currentPage);
      if (profile.department === '测试' && isDepartmentPage) {
        window.location.replace('index.html');
      } else if (profile.department !== '测试' && (!isDepartmentPage || currentDepartment !== profile.department)) {
        window.location.replace('department-bugs.html?department=' + encodeURIComponent(profile.department));
      }
    }
  }

  renderNavigation();
  syncProfile();
  if (window.PATCHWORK_READY) window.PATCHWORK_READY.then(syncProfile);
})();
