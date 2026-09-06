(function () {
  'use strict';

  var config = window.PATCHWORK_CONFIG || {};

  function isConfigured() {
    return Boolean(
      config.supabaseUrl &&
      config.supabaseAnonKey &&
      !config.supabaseUrl.includes('your-project') &&
      !config.supabaseAnonKey.includes('your-anon')
    );
  }

  function headers(extra) {
    return Object.assign({
      apikey: config.supabaseAnonKey,
      Authorization: 'Bearer ' + (window.PATCHWORK_AUTH_TOKEN || config.supabaseAnonKey),
      'Content-Type': 'application/json'
    }, extra || {});
  }

  async function request(path, options) {
    if (window.PATCHWORK_READY) await window.PATCHWORK_READY;
    if (!isConfigured()) {
      throw new Error('请先在 js/config.js 中配置 Supabase URL 和公开 Key。');
    }

    var response = await fetch(config.supabaseUrl.replace(/\/$/, '') + path, options);
    if (!response.ok) {
      var detail = '';
      var errorText = await response.text();
      try {
        var body = JSON.parse(errorText);
        detail = body.message || body.error_description || body.hint || '';
      } catch (error) {
        detail = errorText;
      }
      throw new Error(detail || '数据库请求失败（HTTP ' + response.status + '）');
    }

    if (response.status === 204) return null;
    var text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  function cleanFileName(name) {
    var dot = name.lastIndexOf('.');
    var extension = dot >= 0 ? name.slice(dot).toLowerCase() : '';
    var base = dot >= 0 ? name.slice(0, dot) : name;
    base = base.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').slice(0, 60) || 'attachment';
    return base + extension.replace(/[^a-z0-9.]/g, '');
  }

  async function uploadFile(file, bucketName) {
    if (!isConfigured()) throw new Error('Supabase 尚未配置。');
    var bucket = bucketName || config.storageBucket;
    var mimeType = file.type || 'application/octet-stream';
    var path = new Date().toISOString().slice(0, 10) + '/' + crypto.randomUUID() + '-' + cleanFileName(file.name);
    var url = config.supabaseUrl.replace(/\/$/, '') + '/storage/v1/object/' + bucket + '/' + path;
    var response = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: 'Bearer ' + (window.PATCHWORK_AUTH_TOKEN || config.supabaseAnonKey),
        'Content-Type': mimeType,
        'x-upsert': 'false'
      },
      body: file
    });

    if (!response.ok) {
      var body = await response.json().catch(function () { return {}; });
      throw new Error(body.message || '附件上传失败：' + file.name);
    }

    return config.supabaseUrl.replace(/\/$/, '') + '/storage/v1/object/public/' + bucket + '/' + path;
  }

  async function createBug(payload) {
    return request('/rest/v1/' + config.tableName, {
      method: 'POST',
      headers: headers({ Prefer: 'return=representation' }),
      body: JSON.stringify(payload)
    });
  }

  async function listBugs() {
    var fields = 'id,title,description,reporter,module,environment,importance,repro_steps,expected_result,actual_result,attachment_urls,status,fix_plan,assignee,assignee_department,assignee_id,target_date,resolved_at,created_at,updated_at,submitter_id,transfer_from,transfer_note,follow_up_id,assigned_at';
    return request('/rest/v1/' + config.tableName + '?select=' + fields + '&order=created_at.desc', {
      method: 'GET',
      headers: headers()
    });
  }

  async function updateBug(id, patch) {
    return request('/rest/v1/' + config.tableName + '?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: headers({ Prefer: 'return=representation' }),
      body: JSON.stringify(patch)
    });
  }

  async function listDevelopers() {
    var fields = 'id,name,department,active,created_at,updated_at';
    return request('/rest/v1/developers?select=' + fields + '&active=eq.true&order=department.asc,name.asc', {
      method: 'GET',
      headers: headers()
    });
  }

  async function getProfile() {
    var result = await window.PATCHWORK_SUPABASE.auth.getUser();
    var user = result.data && result.data.user;
    if (!user) return [];
    return request('/rest/v1/profiles?select=*&id=eq.' + encodeURIComponent(user.id), { method: 'GET', headers: headers() });
  }

  async function listTestCases() {
    return request('/rest/v1/test_cases?select=*&order=created_at.desc', { method: 'GET', headers: headers() });
  }

  async function createTestCase(payload) {
    return request('/rest/v1/test_cases', { method: 'POST', headers: headers({ Prefer: 'return=representation' }), body: JSON.stringify(payload) });
  }

  async function updateTestCase(id, patch) {
    return request('/rest/v1/test_cases?id=eq.' + encodeURIComponent(id), { method: 'PATCH', headers: headers({ Prefer: 'return=representation' }), body: JSON.stringify(patch) });
  }

  async function listNotifications() {
    return request('/rest/v1/notifications?select=*&is_read=eq.false&order=created_at.desc', { method: 'GET', headers: headers() });
  }

  async function createAssignmentEvent(payload) {
    return request('/rest/v1/assignment_events', { method: 'POST', headers: headers({ Prefer: 'return=representation' }), body: JSON.stringify(payload) });
  }

  async function createDeveloper(payload) {
    return request('/rest/v1/developers', {
      method: 'POST',
      headers: headers({ Prefer: 'return=representation' }),
      body: JSON.stringify(payload)
    });
  }

  async function createTeamUser(payload) {
    if (!window.PATCHWORK_AUTH_TOKEN) throw new Error('登录状态已失效，请重新登录。');
    var response = await fetch(config.supabaseUrl.replace(/\/$/, '') + '/functions/v1/admin-create-user', {
      method: 'POST',
      headers: { apikey: config.supabaseAnonKey, Authorization: 'Bearer ' + window.PATCHWORK_AUTH_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    var body = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error('新增用户失败（HTTP ' + response.status + '）： ' + (body.error || body.message || 'Edge Function 未返回具体原因。'));
    return body;
  }

  window.PatchworkAPI = {
    isConfigured: isConfigured,
    uploadFile: uploadFile,
    createBug: createBug,
    listBugs: listBugs,
    updateBug: updateBug,
    listDevelopers: listDevelopers,
    createDeveloper: createDeveloper
    ,getProfile: getProfile,
    listTestCases: listTestCases,
    createTestCase: createTestCase,
    updateTestCase: updateTestCase,
    listNotifications: listNotifications,
    createAssignmentEvent: createAssignmentEvent,
    createTeamUser: createTeamUser
  };
})();
