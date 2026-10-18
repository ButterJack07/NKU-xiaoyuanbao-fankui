(function () {
  'use strict';

  var form = document.getElementById('bugForm');
  var fileInput = document.getElementById('attachments');
  var fileList = document.getElementById('fileList');
  var submitButton = document.getElementById('submitButton');
  var configNotice = document.getElementById('configNotice');
  var successModal = document.getElementById('successModal');
  var selectedFiles = [];
  var editingBug = null;
  var editingAsReviewer = false;
  var existingAttachments = [];
  var editBugId = new URLSearchParams(window.location.search).get('bug');
  var productUploadMode = new URLSearchParams(window.location.search).get('source') === 'product' && !editBugId;
  var productUploadReady = Promise.resolve();

  if (!form || !fileInput || !fileList || !submitButton) return;
  var reporterField = document.getElementById('reporterField');
  if (reporterField && window.PATCHWORK_PROFILE) reporterField.value = window.PATCHWORK_PROFILE.full_name || window.PATCHWORK_PROFILE.username || '';

  if (!window.PatchworkAPI.isConfigured()) {
    configNotice.textContent = '数据库尚未连接。请先按照 README.md 配置 js/config.js 并执行 supabase.sql。';
    configNotice.classList.remove('hidden');
  }

  function showToast(message, type) {
    var toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show ' + (type || '');
    window.setTimeout(function () { toast.className = 'toast'; }, 3800);
  }

  function formatSize(bytes) {
    if (bytes < 1024 * 1024) return Math.ceil(bytes / 1024) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }

  function formatBugCode(bug) {
    return bug && bug.bug_no ? 'BUG-' + String(bug.bug_no).padStart(4, '0') : 'BUG-0001';
  }

  async function initializeProductUpload() {
    if (!productUploadMode) return;
    try {
      await window.PATCHWORK_READY;
      var profile = window.PATCHWORK_PROFILE;
      if (!profile || profile.department !== '产品') throw new Error('仅产品部门成员可以从产品端直接上传缺陷报告。');
      document.getElementById('bugSubmitTitle').textContent = '产品端上传缺陷报告';
      document.getElementById('bugSubmitDescription').textContent = '选择归属部门后直接分发至对应部门，默认完成第一审核和第二审核。';
      document.querySelector('.bug-submit-note').textContent = '产品端上传后直接分发至所选部门，默认完成第一审核和第二审核。';
      var breadcrumb = document.querySelector('.workspace-breadcrumb');
      if (breadcrumb) breadcrumb.innerHTML = '<a href="department-bugs.html?department=%E4%BA%A7%E5%93%81">产品</a><b>/</b><strong>上传缺陷报告</strong>';
      document.getElementById('submitButton').querySelector('span').textContent = '提交并直接分发';
      document.title = '校缘宝内测管理网站 · 产品端上传缺陷报告';
    } catch (error) {
      showToast(error.message || '无法启用产品端上传。', 'error');
      submitButton.disabled = true;
    }
  }

  function renderFiles() {
    fileList.innerHTML = '';
    selectedFiles.forEach(function (file, index) {
      var item = document.createElement('div');
      item.className = 'file-item';
      item.innerHTML = '<span class="file-type">' + (file.type.startsWith('image/') ? 'IMG' : 'FILE') + '</span>' +
        '<span><strong></strong><small>' + formatSize(file.size) + '</small></span>' +
        '<button type="button" aria-label="移除文件">×</button>';
      item.querySelector('strong').textContent = file.name;
      item.querySelector('button').addEventListener('click', function () {
        selectedFiles.splice(index, 1);
        renderFiles();
      });
      fileList.appendChild(item);
    });
  }

  function renderExistingAttachments() {
    var container = document.getElementById('existingAttachments');
    if (!container) return;
    if (!editingBug || !existingAttachments.length) {
      if (container) container.innerHTML = '';
      return;
    }
    container.innerHTML = '<p class="existing-attachments-title">已有附件</p>' + existingAttachments.map(function (url, index) {
      return '<div class="file-item" data-existing-index="' + index + '"><span class="file-type">FILE</span><span><strong>' + url.split('/').pop() + '</strong><small>点击右侧移除</small></span><button type="button" aria-label="移除已有附件">×</button></div>';
    }).join('');
    container.querySelectorAll('button').forEach(function (button) {
      button.addEventListener('click', function () {
        var item = button.closest('[data-existing-index]');
        existingAttachments.splice(Number(item.dataset.existingIndex), 1);
        renderExistingAttachments();
      });
    });
  }

  function acceptFiles(files) {
    var incoming = Array.from(files);
    var room = 8 - existingAttachments.length;
    if (selectedFiles.length + incoming.length > room) {
      showToast('附件总数最多 8 个。', 'error');
      return;
    }
    var invalid = incoming.find(function (file) {
      return !['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp', 'image/avif'].includes(file.type);
    });
    if (invalid) {
      showToast(invalid.name + ' 不是支持的图片格式。', 'error');
      return;
    }
    var oversized = incoming.find(function (file) { return file.size > 10 * 1024 * 1024; });
    if (oversized) {
      showToast(oversized.name + ' 超过 10 MB 限制。', 'error');
      return;
    }
    selectedFiles = selectedFiles.concat(incoming);
    renderFiles();
  }

  fileInput.addEventListener('change', function () {
    acceptFiles(fileInput.files);
    fileInput.value = '';
  });

  ['dragenter', 'dragover'].forEach(function (eventName) {
    document.getElementById('dropzone').addEventListener(eventName, function (event) {
      event.preventDefault();
      event.currentTarget.classList.add('dragging');
    });
  });

  ['dragleave', 'drop'].forEach(function (eventName) {
    document.getElementById('dropzone').addEventListener(eventName, function (event) {
      event.preventDefault();
      event.currentTarget.classList.remove('dragging');
      if (eventName === 'drop') acceptFiles(event.dataTransfer.files);
    });
  });

  form.addEventListener('reset', function () {
    window.setTimeout(function () {
      selectedFiles = [];
      renderFiles();
    }, 0);
  });

  async function loadEditingBug() {
    if (!editBugId) return;
    try {
      await window.PATCHWORK_READY;
      var profile = window.PATCHWORK_PROFILE;
      var bugs = await window.PatchworkAPI.listBugs();
      var bug = bugs.find(function (item) { return item.id === editBugId; });
      if (!bug) throw new Error('找不到该缺陷报告。');
      var isAssignedReviewer = profile && ((bug.status === 'pending_review_1' && Number(profile.review_stage) === 1) || (bug.status === 'pending_review_2' && Number(profile.review_stage) === 2));
      var mayEdit = profile && ((bug.submitter_id === profile.id && ['rejected', 'postponed'].includes(bug.status)) || isAssignedReviewer);
      if (!mayEdit) throw new Error('当前账号无权修改这份报告。');
      editingBug = bug;
      editingAsReviewer = Boolean(isAssignedReviewer);
      existingAttachments = (bug.attachment_urls || []).slice();
      var fields = ['title', 'module', 'description', 'repro_steps', 'expected_result', 'actual_result', 'importance'];
      fields.forEach(function (name) { if (form.elements[name]) form.elements[name].value = bug[name] || ''; });
      var savedDepartments = String(bug.assignee_department || '').split(',').map(function (item) { return item.trim(); });
      form.querySelectorAll('input[name="assignee_departments"]').forEach(function (input) { input.checked = savedDepartments.indexOf(input.value) !== -1; });
      if (reporterField) reporterField.value = bug.reporter || reporterField.value;
      if (isAssignedReviewer) {
        form.querySelectorAll('input, textarea, select').forEach(function (field) {
          if (field.name !== 'attachments' && field.name !== 'reporter') field.required = false;
        });
        var attachmentLabel = document.querySelector('#bugForm .field-full:has(#dropzone) > span');
        if (attachmentLabel) attachmentLabel.innerHTML = '附件';
      }
      document.getElementById('bugSubmitTitle').textContent = isAssignedReviewer ? '审核时修改报告' : '修改软件缺陷报告';
      document.getElementById('bugSubmitDescription').textContent = isAssignedReviewer ? '修改后保存会立即更新报告，审核仍停留在当前环节。' : '修改后点击“重新提交”，报告将重新进入审核流程。';
      submitButton.querySelector('span').textContent = isAssignedReviewer ? '保存审核修改' : '重新提交缺陷报告';
      document.title = '校缘宝内测管理网站 · 修改软件缺陷报告';
      var zone = document.getElementById('dropzone');
      var container = document.createElement('div');
      container.id = 'existingAttachments';
      zone.parentNode.insertBefore(container, zone);
      renderExistingAttachments();
    } catch (error) {
      showToast(error.message || '无法加载要修改的报告。', 'error');
      window.setTimeout(function () { window.location.href = 'bug-reports.html'; }, 1600);
    }
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    await productUploadReady;
    if (productUploadMode && (!window.PATCHWORK_PROFILE || window.PATCHWORK_PROFILE.department !== '产品')) return;
    if (!window.PatchworkAPI.isConfigured()) {
      showToast('请先配置 Supabase 数据库连接。', 'error');
      return;
    }

    submitButton.disabled = true;
    submitButton.querySelector('span').textContent = selectedFiles.length ? '正在上传附件…' : (editingBug ? '正在提交…' : '正在提交…');

    try {
      var attachmentUrls = existingAttachments.slice();
      for (var i = 0; i < selectedFiles.length; i += 1) {
        attachmentUrls.push(await window.PatchworkAPI.uploadFile(selectedFiles[i]));
      }

      submitButton.querySelector('span').textContent = '正在写入数据库…';
      var data = Object.fromEntries(new FormData(form).entries());
      var departments = Array.from(form.querySelectorAll('input[name="assignee_departments"]:checked')).map(function (input) { return input.value; });
      delete data.attachments;
      delete data.assignee_departments;
      if (!departments.length) throw new Error('请至少选择一个归属部门。');
      data.assignee_department = departments.join(',');
      data.attachment_urls = attachmentUrls;
      data.status = productUploadMode ? 'open' : 'pending_review_1';
      data.submission_source = productUploadMode ? 'product' : 'test';
      var session = (await window.PATCHWORK_AUTH.getSession()).data.session;
      data.submitter_id = session.user.id;

      var bug;
      if (editingBug) {
        var rows = await window.PatchworkAPI.updateBug(editingBug.id, {
          title: data.title,
          module: data.module,
          description: data.description,
          repro_steps: data.repro_steps,
          expected_result: data.expected_result,
          actual_result: data.actual_result,
          importance: data.importance,
          assignee_department: data.assignee_department,
          attachment_urls: data.attachment_urls,
          status: editingAsReviewer ? editingBug.status : 'pending_review_1',
          review_note: editingAsReviewer ? editingBug.review_note : '',
          updated_at: new Date().toISOString()
        });
        bug = rows && rows[0];
        document.getElementById('successTitle').textContent = editingAsReviewer ? '审核修改已保存' : '缺陷报告已重新提交';
        document.getElementById('successMessage').innerHTML = editingAsReviewer
          ? '问题编号 <strong id="successCode">' + formatBugCode(bug) + '</strong>，报告内容已保存，审核仍在当前环节。'
          : '问题编号 <strong id="successCode">' + formatBugCode(bug) + '</strong>，已重新进入审核流程。';
      } else {
        data.assignee = '';
        var created = await window.PatchworkAPI.createBug(data);
        bug = created && created[0];
        document.getElementById('successTitle').textContent = '缺陷报告已提交';
        if (productUploadMode) {
          var productListLink = document.querySelector('#successModal a[href="bug-reports.html"]');
          if (productListLink) productListLink.href = 'department-bugs.html?department=' + encodeURIComponent(departments[0]);
          if (productListLink) productListLink.textContent = '查看所选部门缺陷列表';
        }
        document.getElementById('successMessage').innerHTML = productUploadMode
          ? '问题编号 <strong id="successCode">' + formatBugCode(bug) + '</strong>，已直接分发至所选部门，默认完成第一审核和第二审核。'
          : '问题编号 <strong id="successCode">' + formatBugCode(bug) + '</strong>，已进入审核流程，等待第一审核。';
      }
      successModal.classList.remove('hidden');
    } catch (error) {
      showToast(error.message || '提交失败，请稍后重试。', 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.querySelector('span').textContent = editingBug ? (editingAsReviewer ? '保存审核修改' : '重新提交缺陷报告') : productUploadMode ? '提交并直接分发' : '提交缺陷报告';
    }
  });

  document.getElementById('submitAnother').addEventListener('click', function () {
    successModal.classList.add('hidden');
    if (editingBug) { window.location.href = editingAsReviewer ? 'review-bugs.html' : 'bug-reports.html'; return; }
    form.reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  loadEditingBug();
  productUploadReady = initializeProductUpload();
})();
