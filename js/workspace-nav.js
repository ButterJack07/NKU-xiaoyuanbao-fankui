(function () {
  'use strict';

  var topbar = document.querySelector('.topbar');
  var department = new URLSearchParams(window.location.search).get('department');
  var page = window.location.pathname.split('/').pop() || 'index.html';

  function renderNavigation() {
    if (!topbar) return;
    var version = window.PATCHWORK_CONFIG && window.PATCHWORK_CONFIG.version ? window.PATCHWORK_CONFIG.version : '1.1.2';
    topbar.innerHTML = '<a class="brand" href="index.html" aria-label="校缘宝内测管理网站首页"><span><strong>校缘宝内测管理网站</strong><small class="brand-version">' + version + '</small></span></a>' +
      '<nav class="topnav" aria-label="主导航"><div class="nav-menu-card">' +
      '<a data-nav="home" class="nav-test-root" href="index.html">测试</a>' +
      '<a data-department="技术—前端" href="department-bugs.html?department=技术—前端">技术—前端</a>' +
      '<a data-department="技术—后端" href="department-bugs.html?department=技术—后端">技术—后端</a>' +
      '<a data-department="设计" href="department-bugs.html?department=设计">设计</a>' +
      '<a data-department="产品" href="department-bugs.html?department=产品">产品</a>' +
      '<a data-admin-only class="admin-nav-link hidden" href="user-management.html">超级管理员</a>' +
      '</div><a class="nav-notice" href="announcements.html">公告信息</a></nav>' +
      '<button id="topUserCard" class="top-user-card" type="button"><span id="topUserAvatar" class="top-user-avatar">?</span><span><strong id="topUserName">当前成员</strong><small id="topUserDepartment">未登录</small></span></button>';

    topbar.querySelectorAll('[data-nav]').forEach(function (link) {
      var publicPage = page === 'announcements.html' || page === 'announcement-detail.html';
      link.classList.toggle('active', !department && !publicPage && page !== 'user-management.html' && link.dataset.nav === 'home');
    });
    topbar.querySelectorAll('[data-department]').forEach(function (link) {
      link.classList.toggle('active', link.dataset.department === department);
    });
    topbar.querySelectorAll('[data-admin-only]').forEach(function (link) {
      link.classList.toggle('active', page === 'user-management.html');
      link.classList.toggle('hidden', !window.PATCHWORK_PROFILE || window.PATCHWORK_PROFILE.role !== 'admin');
    });
    var noticeLink = topbar.querySelector('.nav-notice');
    if (noticeLink) noticeLink.classList.toggle('active', page === 'announcements.html' || page === 'announcement-detail.html');
    document.getElementById('topUserCard').addEventListener('click', openProfileModal);
  }

  function openProfileModal() {
    var profile = window.PATCHWORK_PROFILE;
    if (!profile) return;
    var modal = document.getElementById('profileModal');
    if (!modal) {
      modal = document.createElement('div'); modal.id = 'profileModal'; modal.className = 'modal-backdrop hidden';
      modal.innerHTML = '<section class="user-modal profile-modal"><div class="developer-modal-header"><div><h2>个人信息</h2><p id="profileIdentity" class="user-modal-identity"></p><p class="user-modal-help">可维护个人联系方式和可联系时间，仅本人可编辑。</p></div><button id="closeProfileModal" class="icon-button" type="button">×</button></div><form id="profileForm" class="user-form"><label class="field"><span>QQ</span><input name="qq" type="text"></label><label class="field"><span>微信</span><input name="wechat" type="text"></label><label class="field"><span>电话号码</span><input name="phone" type="text"></label><label class="field"><span>可联系时间</span><div class="contact-time-control"><input name="contact_time" type="text" placeholder="例如：18:00-21:00"><button id="openSchedule" type="button">按日划分</button></div></label><p id="profileError" class="login-error hidden"></p><div class="profile-footer-actions"><div class="profile-account-links"><button id="openAccountSettings" class="account-management-button" type="button">账户管理</button><button id="logoutFromProfile" class="logout-link-button" type="button">退出登录</button></div><div class="edit-user-actions"><button id="cancelProfile" class="user-cancel-button" type="button">取消</button><button class="case-action-button" type="submit">保存信息</button></div></div></form></section>';
      document.body.appendChild(modal);
      document.getElementById('closeProfileModal').onclick = closeProfileModal; document.getElementById('cancelProfile').onclick = closeProfileModal; modal.onclick = function (event) { if (event.target === modal) closeProfileModal(); }; document.getElementById('profileForm').onsubmit = saveProfile; document.getElementById('openSchedule').onclick = openScheduleModal; document.getElementById('openAccountSettings').onclick = openAccountSettings; document.getElementById('logoutFromProfile').onclick = logoutFromAccount;
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
  function logoutFromAccount() { var modal = document.getElementById('logoutConfirmModal'); if (!modal) { modal = document.createElement('div'); modal.id = 'logoutConfirmModal'; modal.className = 'modal-backdrop hidden'; modal.innerHTML = '<section class="user-modal logout-confirm-modal"><div class="developer-modal-header"><div><h2>确认退出登录？</h2><p class="user-modal-help">退出后需要重新输入账号和密码才能进入网站。</p></div><button id="closeLogoutConfirm" class="icon-button" type="button">×</button></div><div class="logout-confirm-actions"><button id="cancelLogoutConfirm" class="user-cancel-button" type="button">取消</button><button id="confirmLogoutConfirm" class="case-action-button" type="button">确认退出</button></div></section>'; document.body.appendChild(modal); document.getElementById('closeLogoutConfirm').onclick = closeLogoutConfirm; document.getElementById('cancelLogoutConfirm').onclick = closeLogoutConfirm; modal.onclick = function (event) { if (event.target === modal) closeLogoutConfirm(); }; document.getElementById('confirmLogoutConfirm').onclick = confirmLogout; } modal.classList.remove('hidden'); }
  function closeLogoutConfirm() { var modal = document.getElementById('logoutConfirmModal'); if (modal) modal.classList.add('hidden'); }
  async function confirmLogout() { closeLogoutConfirm(); closeAccountSettings(); closeProfileModal(); if (window.PATCHWORK_AUTH) await window.PATCHWORK_AUTH.signOut(); }
  async function saveProfile(event) { event.preventDefault(); var form = event.currentTarget, button = form.querySelector('button[type="submit"]'), error = document.getElementById('profileError'); button.disabled = true; button.textContent = '保存中…'; error.classList.add('hidden'); try { var schedule = window.PATCHWORK_PROFILE.contact_schedule || {}; var patch = { p_qq: form.qq.value.trim(), p_wechat: form.wechat.value.trim(), p_phone: form.phone.value.trim(), p_contact_time: form.contact_time.value.trim(), p_contact_schedule: schedule }; var result = await window.PATCHWORK_SUPABASE.rpc('update_my_contact_profile', patch); if (result.error) throw result.error; window.PATCHWORK_PROFILE = Object.assign({}, window.PATCHWORK_PROFILE, { qq: patch.p_qq, wechat: patch.p_wechat, phone: patch.p_phone, contact_time: patch.p_contact_time, contact_schedule: schedule }); localStorage.setItem('xiaoyuanbao-profile-cache', JSON.stringify(window.PATCHWORK_PROFILE)); closeProfileModal(); } catch (e) { error.textContent = e.message || '个人信息保存失败。'; error.classList.remove('hidden'); } finally { button.disabled = false; button.textContent = '保存信息'; } }

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
      var isPublicWorkspacePage = ['announcements.html', 'announcement-detail.html'].includes(currentPage);
      if (isPublicWorkspacePage) {
        return;
      } else if (profile.department === '测试' && isDepartmentPage) {
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
