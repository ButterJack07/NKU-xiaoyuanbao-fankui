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
    var result = text ? JSON.parse(text) : null;
    if (options && options.method && options.method !== 'GET' && window.dispatchEvent && window.Event) window.dispatchEvent(new window.Event('patchwork:reports-changed'));
    return result;
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
    var baseFields = 'id,bug_no,title,description,reporter,module,environment,importance,repro_steps,expected_result,actual_result,attachment_urls,status,fix_plan,assignee,assignee_department,assignee_id,target_date,resolved_at,created_at,updated_at,submitter_id,transfer_from,transfer_note,follow_up_id,assigned_at';
    var extend = function (fields) {
      return request('/rest/v1/' + config.tableName + '?select=' + fields + '&order=created_at.desc', {
        method: 'GET',
        headers: headers()
      });
    };
    try {
      return await extend(baseFields + ',review_note,reviewer_id,submission_source,department_progress,request_type,product_request_no,request_code,change_reason,before_logic,after_logic,exception_handling,impact_scope,desired_date');
    } catch (error) {
      if (/request_code/i.test(error.message || '')) {
        try { return await extend(baseFields + ',review_note,reviewer_id,submission_source,department_progress,request_type,product_request_no,change_reason,before_logic,after_logic,exception_handling,impact_scope,desired_date'); }
        catch (nested) { if (/product_request_no|request_type|change_reason|before_logic|after_logic|exception_handling|impact_scope|desired_date/i.test(nested.message || '')) throw new Error('请先执行产品修改需求数据库迁移。'); throw nested; }
      }
      if (/product_request_no|request_type|change_reason|before_logic|after_logic|exception_handling|impact_scope|desired_date/i.test(error.message || '')) {
        try { return await extend(baseFields + ',review_note,reviewer_id,submission_source,department_progress'); }
        catch (nested) { if (/department_progress/i.test(nested.message || '')) throw new Error('请先执行 supabase-department-progress.sql，启用部门独立处理状态。'); throw nested; }
      }
      if (/department_progress/i.test(error.message || '')) throw new Error('请先执行 supabase-department-progress.sql，启用部门独立处理状态。');
      if (/review_note|reviewer_id|submission_source/i.test(error.message || '')) return extend(baseFields);
      throw error;
    }
  }

  async function updateBug(id, patch) {
    return request('/rest/v1/' + config.tableName + '?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: headers({ Prefer: 'return=representation' }),
      body: JSON.stringify(patch)
    });
  }

  function departmentState(bug, department) {
    return (bug.department_progress || {})[department] || { status: bug.status, assignee: bug.assignee || '', assignee_id: bug.assignee_id, note: bug.transfer_note || '' };
  }

  function departmentView(bug, department) {
    if (!department || !['open', 'in_progress', 'resolved'].includes(bug.status)) return bug;
    var state = departmentState(bug, department);
    return Object.assign({}, bug, { status: state.status, assignee: state.assignee || '', assignee_id: state.assignee_id || null, follow_up_id: state.assignee_id || null });
  }

  async function updateDepartmentProgress(id, department, patch) {
    return request('/rest/v1/rpc/update_bug_department_progress', {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ p_bug_id: id, p_department: department, p_patch: patch })
    });
  }

  async function listDepartmentChanges(bugId) {
    return request('/rest/v1/bug_department_changes?select=*&bug_id=eq.' + encodeURIComponent(bugId) + '&order=created_at.desc', { method: 'GET', headers: headers() });
  }

  function reportCode(bug) {
    if (bug && bug.request_type === 'product_change') return bug.request_code || 'PRO-' + String(bug.product_request_no || bug.bug_no || '').padStart(4, '0');
    return 'BUG-' + String(bug && bug.bug_no || 0).padStart(4, '0');
  }

  async function deleteBug(id) {
    return request('/rest/v1/' + config.tableName + '?id=eq.' + encodeURIComponent(id), {
      method: 'DELETE',
      headers: headers({ Prefer: 'return=representation' })
    });
  }

  async function listReviewEvents(bugId) {
    try {
      return await request('/rest/v1/bug_review_events?select=*&bug_id=eq.' + encodeURIComponent(bugId) + '&order=created_at.asc', { method: 'GET', headers: headers() });
    } catch (error) {
      if (/bug_review_events|does not exist|relation/i.test(error.message || '')) return [];
      throw error;
    }
  }

  async function createReviewEvent(payload) {
    return request('/rest/v1/bug_review_events', {
      method: 'POST',
      headers: headers({ Prefer: 'return=representation' }),
      body: JSON.stringify(payload)
    });
  }

  async function deleteAttachment(url, bucketName) {
    if (!url) return null;
    var bucket = bucketName || config.storageBucket;
    var marker = '/storage/v1/object/public/' + bucket + '/';
    var index = String(url).indexOf(marker);
    if (index === -1) return null;
    var path = String(url).slice(index + marker.length);
    return request('/storage/v1/object/' + bucket + '/' + path, {
      method: 'DELETE',
      headers: { apikey: config.supabaseAnonKey, Authorization: 'Bearer ' + (window.PATCHWORK_AUTH_TOKEN || config.supabaseAnonKey) }
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

  async function listProfiles() {
    var baseFields = 'id,username,full_name,employee_no,department,role,active,qq,wechat,phone,contact_time';
    try {
      return await request('/rest/v1/profiles?select=' + baseFields + ',review_stage,is_product_lead,is_product_deputy&active=eq.true', { method: 'GET', headers: headers() });
    } catch (error) {
      if (/is_product_deputy/i.test(error.message || '')) return request('/rest/v1/profiles?select=' + baseFields + ',review_stage,is_product_lead&active=eq.true', { method: 'GET', headers: headers() });
      if (/is_product_lead/i.test(error.message || '')) return request('/rest/v1/profiles?select=' + baseFields + ',review_stage&active=eq.true', { method: 'GET', headers: headers() });
      if (/review_stage/i.test(error.message || '')) return request('/rest/v1/profiles?select=' + baseFields + '&active=eq.true', { method: 'GET', headers: headers() });
      throw error;
    }
  }

  async function listAnnouncements() {
    return request('/rest/v1/announcements?select=*&order=created_at.desc', { method: 'GET', headers: headers() });
  }

  async function createAnnouncement(payload) {
    return request('/rest/v1/announcements', { method: 'POST', headers: headers({ Prefer: 'return=representation' }), body: JSON.stringify(payload) });
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
    if (!response.ok) throw new Error(body.error || body.message || '新增用户失败，请稍后重试。');
    return body;
  }

  async function resetTeamUserPassword(userId) {
    var response = await fetch(config.supabaseUrl.replace(/\/$/, '') + '/functions/v1/admin-reset-password', { method: 'POST', headers: { apikey: config.supabaseAnonKey, Authorization: 'Bearer ' + window.PATCHWORK_AUTH_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId }) });
    var body = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(body.error || body.message || '密码重置失败。');
    return body;
  }

  async function updateProfile(id, patch) {
    var result = await window.PATCHWORK_SUPABASE.from('profiles').update(patch).eq('id', id).select('id,username,full_name,employee_no,department,role,active,review_stage,is_product_lead,is_product_deputy,created_at').single();
    if (result.error) throw result.error;
    return result.data;
  }

  async function downloadFile(url) {
    var response = await fetch(url, { headers: { Authorization: 'Bearer ' + (window.PATCHWORK_AUTH_TOKEN || config.supabaseAnonKey) } });
    if (!response.ok) throw new Error('文件下载失败');
    return response.blob();
  }

  window.PatchworkAPI = {
    isConfigured: isConfigured,
    uploadFile: uploadFile,
    createBug: createBug,
    listBugs: listBugs,
    updateBug: updateBug,
    departmentState: departmentState,
    departmentView: departmentView,
    updateDepartmentProgress: updateDepartmentProgress,
    listDepartmentChanges: listDepartmentChanges,
    reportCode: reportCode,
    deleteBug: deleteBug,
    listReviewEvents: listReviewEvents,
    createReviewEvent: createReviewEvent,
    deleteAttachment: deleteAttachment,
    listDevelopers: listDevelopers,
    createDeveloper: createDeveloper
    ,getProfile: getProfile,
    listTestCases: listTestCases,
    createTestCase: createTestCase,
    updateTestCase: updateTestCase,
    listNotifications: listNotifications,
    createAssignmentEvent: createAssignmentEvent,
    createTeamUser: createTeamUser,
    resetTeamUserPassword: resetTeamUserPassword,
    updateProfile: updateProfile
    ,listProfiles: listProfiles,
    downloadFile: downloadFile,
    listAnnouncements: listAnnouncements,
    createAnnouncement: createAnnouncement
  };
})();
