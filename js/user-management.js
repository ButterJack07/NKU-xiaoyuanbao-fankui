(function () {
  'use strict';
  var rows = [], list = document.getElementById('userList'), pageSize = 5, currentPage = 1;
  function esc(value) { return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function toast(text, type) { var node = document.getElementById('toast'); node.textContent = text; node.className = 'toast show ' + (type || ''); setTimeout(function () { node.className = 'toast'; }, 3500); }
  function render() {
    var query = document.getElementById('userSearch').value.trim().toLowerCase();
    var department = document.getElementById('userDepartment').value;
    var status = document.getElementById('userStatus').value;
    var visible = rows.filter(function (row) { return (!query || [row.username, row.full_name, row.employee_no].join(' ').toLowerCase().includes(query)) && (department === 'all' || row.department === department) && (status === 'all' || String(row.active) === status); });
    var totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    var pageRows = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    list.innerHTML = pageRows.map(function (row) { var action = row.role === 'admin' ? '<span class="user-edit-disabled">不可编辑</span>' : '<button class="user-edit-link" type="button" data-user-id="' + esc(row.id) + '">编辑</button>'; return '<tr><td>' + esc(row.username) + '</td><td>' + esc(row.full_name) + '</td><td>' + esc(row.department) + '</td><td>' + esc(row.role === 'admin' ? '超级管理员' : row.role === 'leader' ? '组长' : '普通成员') + '</td><td><span class="user-status ' + (row.active ? 'enabled' : 'disabled') + '">' + (row.active ? '启用' : '停用') + '</span></td><td>' + action + '</td></tr>'; }).join('');
    list.querySelectorAll('.user-edit-link').forEach(function (button) { button.addEventListener('click', function () { openEditUser(button.dataset.userId); }); });
    document.getElementById('userEmpty').classList.toggle('hidden', visible.length !== 0);
    document.getElementById('userPagination').classList.toggle('hidden', visible.length <= pageSize);
    document.getElementById('userPageInfo').textContent = '第 ' + currentPage + ' / ' + totalPages + ' 页 · 共 ' + visible.length + ' 条';
    document.getElementById('userPrevPage').disabled = currentPage <= 1;
    document.getElementById('userNextPage').disabled = currentPage >= totalPages;
  }
  async function load() {
    await window.PATCHWORK_READY;
    if (!window.PATCHWORK_PROFILE || window.PATCHWORK_PROFILE.role !== 'admin') { window.location.replace('index.html'); return; }
    var result = await window.PATCHWORK_SUPABASE.from('profiles').select('id,username,full_name,employee_no,department,role,active,created_at').order('created_at', { ascending: true });
    if (result.error) throw result.error;
    rows = result.data || []; render();
  }
  var editModal = document.getElementById('editUserModal');
  function openEditUser(id) {
    var row = rows.find(function (item) { return item.id === id; });
    if (!row || row.role === 'admin') { toast('超级管理员不可编辑。', ''); return; }
    var form = document.getElementById('editUserForm');
    form.department.value = row.department;
    form.role.value = row.role;
    form.active.value = String(row.active);
    form.role.disabled = false;
    document.getElementById('editUserIdentity').textContent = '账号：' + row.username + '｜' + row.full_name;
    document.getElementById('editUserError').classList.add('hidden');
    editModal.dataset.userId = row.id;
    editModal.classList.remove('hidden');
  }
  var modal = document.getElementById('addUserModal');
  document.getElementById('addUserButton').addEventListener('click', function () { modal.classList.remove('hidden'); });
  document.getElementById('closeAddUser').addEventListener('click', function () { modal.classList.add('hidden'); });
  modal.addEventListener('click', function (event) { if (event.target === modal) modal.classList.add('hidden'); });
  document.getElementById('addUserForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    var form = event.currentTarget, button = form.querySelector('button[type="submit"]'), error = document.getElementById('addUserError');
    error.classList.add('hidden'); button.disabled = true; button.textContent = '正在创建…';
    try {
      var payload = Object.fromEntries(new FormData(form).entries());
      if (!/^[A-Za-z0-9_-]{3,40}$/.test(payload.username)) throw new Error('账号只能使用 3-40 位字母、数字、下划线或短横线。');
      await window.PatchworkAPI.createTeamUser(payload);
      toast('普通用户创建成功。', 'success'); form.reset(); modal.classList.add('hidden'); await load();
    } catch (err) { error.textContent = err.message || '创建失败，请检查 Edge Function 是否已部署。'; error.classList.remove('hidden'); }
    finally { button.disabled = false; button.textContent = '创建普通用户'; }
  });
  function closeEditUser() { editModal.classList.add('hidden'); }
  document.getElementById('closeEditUser').addEventListener('click', closeEditUser);
  document.getElementById('cancelEditUser').addEventListener('click', closeEditUser);
  editModal.addEventListener('click', function (event) { if (event.target === editModal) closeEditUser(); });
  document.getElementById('editUserForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    var form = event.currentTarget, button = form.querySelector('button[type="submit"]'), error = document.getElementById('editUserError');
    var row = rows.find(function (item) { return item.id === editModal.dataset.userId; });
    if (!row) return;
    var payload = { department: form.department.value, active: form.active.value === 'true' };
    payload.role = form.role.value;
    error.classList.add('hidden'); button.disabled = true; button.textContent = '保存中…';
    try { var updated = await window.PatchworkAPI.updateProfile(row.id, payload); rows = rows.map(function (item) { return item.id === updated.id ? updated : item; }); render(); closeEditUser(); toast('用户信息已更新。', 'success'); }
    catch (err) { error.textContent = err.message || '保存失败。'; error.classList.remove('hidden'); }
    finally { button.disabled = false; button.textContent = '保存修改'; }
  });
  ['userSearch', 'userDepartment', 'userStatus'].forEach(function (id) { document.getElementById(id).addEventListener('input', function () { currentPage = 1; render(); }); document.getElementById(id).addEventListener('change', function () { currentPage = 1; render(); }); });
  document.getElementById('userPrevPage').addEventListener('click', function () { if (currentPage > 1) { currentPage -= 1; render(); } });
  document.getElementById('userNextPage').addEventListener('click', function () { currentPage += 1; render(); });
  document.getElementById('addUserButton').addEventListener('click', function () { toast('新增账号需要通过安全的 Supabase Auth 管理接口创建。', ''); });
  window.PATCHWORK_READY.then(load).catch(function (error) { toast(error.message || '用户列表加载失败。', 'error'); });
})();
