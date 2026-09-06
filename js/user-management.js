(function () {
  'use strict';
  var rows = [], list = document.getElementById('userList'), pageSize = 5, currentPage = 1;
  function esc(value) { return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function toast(text, type) { var node = document.getElementById('toast'); node.textContent = text; node.className = 'toast show ' + (type || ''); setTimeout(function () { node.className = 'toast'; }, 3500); }
  function render() {
    var query = document.getElementById('userSearch').value.trim().toLowerCase();
    var department = document.getElementById('userDepartment').value;
    var status = document.getElementById('userStatus').value;
    var visible = rows.filter(function (row) { var matchesDepartment = department === 'all' || (department === 'admin' ? row.role === 'admin' : row.department === department); return (!query || [row.username, row.full_name, row.employee_no].join(' ').toLowerCase().includes(query)) && matchesDepartment && (status === 'all' || String(row.active) === status); });
    var totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    var pageRows = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    list.innerHTML = pageRows.map(function (row) { var action = row.role === 'admin' ? '<span class="user-edit-disabled">不可编辑</span>' : '<button class="user-edit-link" type="button" data-user-id="' + esc(row.id) + '">编辑</button>'; action += '<button class="user-reset-link" type="button" data-reset-user-id="' + esc(row.id) + '">重置密码</button>'; return '<tr><td>' + esc(row.username) + '</td><td>' + esc(row.full_name) + '</td><td>' + esc(row.department) + '</td><td>' + esc(row.role === 'admin' ? '超级管理员' : row.role === 'leader' ? '组长' : '普通成员') + '</td><td><span class="user-status ' + (row.active ? 'enabled' : 'disabled') + '">' + (row.active ? '启用' : '停用') + '</span></td><td>' + action + '</td></tr>'; }).join('');
    list.querySelectorAll('.user-edit-link').forEach(function (button) { button.addEventListener('click', function () { openEditUser(button.dataset.userId); }); });
    list.querySelectorAll('.user-reset-link').forEach(function (button) { button.addEventListener('click', function () { openResetPassword(button.dataset.resetUserId); }); });
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
  var resetModal = document.getElementById('resetPasswordModal');
  var resetUserId = null;
  function openResetPassword(id) { var row = rows.find(function (item) { return item.id === id; }); if (!row) return; resetUserId = id; document.getElementById('resetPasswordIdentity').textContent = '账号：' + row.username + '｜' + row.full_name; document.getElementById('resetPasswordError').classList.add('hidden'); resetModal.classList.remove('hidden'); }
  function closeResetPassword() { resetModal.classList.add('hidden'); resetUserId = null; }
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
      payload.password = payload.employee_no;
      if (!/^\d{4,10}$/.test(payload.employee_no)) throw new Error('工号必须为 4-10 位数字。');
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
  document.getElementById('closeResetPassword').addEventListener('click', closeResetPassword);
  document.getElementById('cancelResetPassword').addEventListener('click', closeResetPassword);
  resetModal.addEventListener('click', function (event) { if (event.target === resetModal) closeResetPassword(); });
  document.getElementById('confirmResetPassword').addEventListener('click', async function () { var button = this, error = document.getElementById('resetPasswordError'); if (!resetUserId) return; button.disabled = true; button.textContent = '重置中…'; error.classList.add('hidden'); try { await window.PatchworkAPI.resetTeamUserPassword(resetUserId); closeResetPassword(); toast('密码已重置为工号。', 'success'); } catch (err) { error.textContent = err.message || '密码重置失败。'; error.classList.remove('hidden'); } finally { button.disabled = false; button.textContent = '确认重置'; } });
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
  var batchModal = document.getElementById('batchUserModal');
  var batchFile = document.getElementById('batchFile');
  var batchDropzone = document.getElementById('batchDropzone');
  document.getElementById('batchUserButton').addEventListener('click', function () { batchModal.classList.remove('hidden'); });
  document.getElementById('closeBatchUser').addEventListener('click', function () { batchModal.classList.add('hidden'); });
  document.getElementById('cancelBatchUser').addEventListener('click', function () { batchModal.classList.add('hidden'); });
  batchModal.addEventListener('click', function (event) { if (event.target === batchModal) batchModal.classList.add('hidden'); });
  batchFile.addEventListener('change', function () { document.getElementById('batchFileName').textContent = batchFile.files[0] ? batchFile.files[0].name : '未选择文件'; });
  ['dragenter', 'dragover'].forEach(function (name) { batchDropzone.addEventListener(name, function (event) { event.preventDefault(); batchDropzone.classList.add('dragging'); }); });
  ['dragleave', 'drop'].forEach(function (name) { batchDropzone.addEventListener(name, function (event) { event.preventDefault(); batchDropzone.classList.remove('dragging'); }); });
  batchDropzone.addEventListener('drop', function (event) { var file = event.dataTransfer.files[0]; if (file && /\.xlsx$/i.test(file.name)) { var transfer = new DataTransfer(); transfer.items.add(file); batchFile.files = transfer.files; document.getElementById('batchFileName').textContent = file.name; } });
  document.getElementById('importBatchUser').addEventListener('click', async function () {
    var file = batchFile.files[0], error = document.getElementById('batchUserError'), button = document.getElementById('importBatchUser');
    error.classList.add('hidden');
    if (!file || !/\.xlsx$/i.test(file.name)) { error.textContent = '请选择 .xlsx 格式文件。'; error.classList.remove('hidden'); return; }
    if (!window.XLSX) { error.textContent = 'Excel 解析组件加载失败，请刷新页面重试。'; error.classList.remove('hidden'); return; }
    button.disabled = true; button.textContent = '正在读取…';
    try {
      var workbook = window.XLSX.read(await file.arrayBuffer(), { type: 'array' });
      var rawData = window.XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
      var normalizeKey = function (key) { return String(key || '').replace(/^\uFEFF/, '').replace(/[\s\u3000]/g, ''); };
      var aliases = { '账号': '账号', '用户名': '账号', '帐号': '账号', '姓名': '姓名', '员工姓名': '姓名', '工号': '工号', '员工号': '工号', '所属部门': '所属部门', '部门': '所属部门' };
      var data = rawData.map(function (row) { var normalized = {}; Object.keys(row).forEach(function (key) { var mapped = aliases[normalizeKey(key)]; if (mapped) normalized[mapped] = row[key]; }); return normalized; });
      var required = ['账号', '姓名', '工号', '所属部门'];
      if (!data.length || required.some(function (key) { return !Object.prototype.hasOwnProperty.call(data[0], key); })) throw new Error('表头必须包含：账号、姓名、工号、所属部门。支持“用户名”“部门”等常用写法。');
      var departmentAliases = {
        '测试': '测试',
        '设计': '设计',
        '产品': '产品',
        '技术—前端': '技术—前端',
        '技术-前端': '技术—前端',
        '技术前端': '技术—前端',
        '前端': '技术—前端',
        '技术—后端': '技术—后端',
        '技术-后端': '技术—后端',
        '技术后端': '技术—后端',
        '后端': '技术—后端'
      };
      var value = function (item) { return item == null ? '' : String(item).trim(); };
      var payloads = data.map(function (row, index) { var line = index + 2; var rawDepartment = value(row['所属部门']).replace(/[\s\u3000]/g, ''); var payload = { username: value(row['账号']), full_name: value(row['姓名']), employee_no: value(row['工号']), department: departmentAliases[rawDepartment] || '' }; payload.password = payload.employee_no; if (!payload.username) throw new Error('第 ' + line + ' 行“账号”为空。'); if (!/^[A-Za-z0-9_-]{3,40}$/.test(payload.username)) throw new Error('第 ' + line + ' 行“账号”格式不正确。'); if (!payload.full_name) throw new Error('第 ' + line + ' 行“姓名”为空。'); if (!/^\d{4,10}$/.test(payload.employee_no)) throw new Error('第 ' + line + ' 行工号必须为 4-10 位数字。'); if (!payload.department) throw new Error('第 ' + line + ' 行部门“' + rawDepartment + '”不合法。可填写：测试、前端、后端、设计、产品。'); return payload; });
      button.textContent = '正在创建…';
      for (var i = 0; i < payloads.length; i += 1) await window.PatchworkAPI.createTeamUser(payloads[i]);
      toast('已成功新增 ' + payloads.length + ' 个普通用户。', 'success'); batchModal.classList.add('hidden'); batchFile.value = ''; document.getElementById('batchFileName').textContent = '未选择文件'; await load();
    } catch (err) { error.textContent = err.message || '批量导入失败。'; error.classList.remove('hidden'); }
    finally { button.disabled = false; button.textContent = '开始导入'; }
  });
  window.PATCHWORK_READY.then(load).catch(function (error) { toast(error.message || '用户列表加载失败。', 'error'); });
})();
