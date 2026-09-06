(function () {
  'use strict';
  var rows = [], list = document.getElementById('userList');
  function esc(value) { return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function toast(text, type) { var node = document.getElementById('toast'); node.textContent = text; node.className = 'toast show ' + (type || ''); setTimeout(function () { node.className = 'toast'; }, 3500); }
  function render() {
    var query = document.getElementById('userSearch').value.trim().toLowerCase();
    var department = document.getElementById('userDepartment').value;
    var status = document.getElementById('userStatus').value;
    var visible = rows.filter(function (row) { return (!query || [row.username, row.full_name, row.employee_no].join(' ').toLowerCase().includes(query)) && (department === 'all' || row.department === department) && (status === 'all' || String(row.active) === status); });
    list.innerHTML = visible.map(function (row) { return '<tr><td>' + esc(row.username) + '</td><td>' + esc(row.full_name) + '</td><td>' + esc(row.department) + '</td><td>' + esc(row.role === 'admin' ? '超级管理员' : row.role === 'leader' ? '组长' : '普通成员') + '</td><td><span class="user-status ' + (row.active ? 'enabled' : 'disabled') + '">' + (row.active ? '启用' : '停用') + '</span></td><td><button class="user-edit-link" type="button" data-user-id="' + esc(row.id) + '">编辑</button></td></tr>'; }).join('');
    document.getElementById('userEmpty').classList.toggle('hidden', visible.length !== 0);
  }
  async function load() {
    await window.PATCHWORK_READY;
    if (!window.PATCHWORK_PROFILE || window.PATCHWORK_PROFILE.role !== 'admin') { window.location.replace('index.html'); return; }
    var result = await window.PATCHWORK_SUPABASE.from('profiles').select('id,username,full_name,employee_no,department,role,active,created_at').order('created_at', { ascending: true });
    if (result.error) throw result.error;
    rows = result.data || []; render();
  }
  ['userSearch', 'userDepartment', 'userStatus'].forEach(function (id) { document.getElementById(id).addEventListener('input', render); document.getElementById(id).addEventListener('change', render); });
  document.getElementById('addUserButton').addEventListener('click', function () { toast('新增账号需要通过安全的 Supabase Auth 管理接口创建。', ''); });
  window.PATCHWORK_READY.then(load).catch(function (error) { toast(error.message || '用户列表加载失败。', 'error'); });
})();
