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
  var existingAttachments = [];
  var editBugId = new URLSearchParams(window.location.search).get('bug');

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
      if (profile && bug.submitter_id && bug.submitter_id !== profile.id && profile.role !== 'admin') throw new Error('只能修改自己提交的缺陷报告。');
      if (profile && profile.role !== 'admin' && ['open', 'in_progress', 'resolved', 'pending_review_2'].includes(bug.status)) throw new Error('该报告当前状态不可修改。');
      editingBug = bug;
      existingAttachments = (bug.attachment_urls || []).slice();
      form.title.value = bug.title || '';
      form.module.value = bug.module || '';
      form.description.value = bug.description || '';
      form.repro_steps.value = bug.repro_steps || '';
      form.expected_result.value = bug.expected_result || '';
      form.actual_result.value = bug.actual_result || '';
      form.importance.value = bug.importance || '';
      form.assignee_department.value = bug.assignee_department || '';
      if (reporterField) reporterField.value = bug.reporter || reporterField.value;
      document.getElementById('bugSubmitTitle').textContent = '修改软件缺陷报告';
      document.getElementById('bugSubmitDescription').textContent = '修改后点击“重新提交”，报告将重新进入审核流程。';
      submitButton.querySelector('span').textContent = '重新提交缺陷报告';
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
      delete data.attachments;
      data.attachment_urls = attachmentUrls;
      data.status = 'pending_review_1';
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
          status: 'pending_review_1',
          review_note: '',
          updated_at: new Date().toISOString()
        });
        bug = rows && rows[0];
        document.getElementById('successTitle').textContent = '缺陷报告已重新提交';
        document.getElementById('successMessage').innerHTML = '问题编号 <strong id="successCode">' + formatBugCode(bug) + '</strong>，已重新进入审核流程。';
      } else {
        data.assignee = '';
        var created = await window.PatchworkAPI.createBug(data);
        bug = created && created[0];
        document.getElementById('successTitle').textContent = '缺陷报告已提交';
        document.getElementById('successMessage').innerHTML = '问题编号 <strong id="successCode">' + formatBugCode(bug) + '</strong>，已进入审核流程，等待测试组长审核。';
      }
      successModal.classList.remove('hidden');
    } catch (error) {
      showToast(error.message || '提交失败，请稍后重试。', 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.querySelector('span').textContent = editingBug ? '重新提交缺陷报告' : '提交缺陷报告';
    }
  });

  document.getElementById('submitAnother').addEventListener('click', function () {
    successModal.classList.add('hidden');
    if (editingBug) { window.location.href = 'bug-reports.html'; return; }
    form.reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  loadEditingBug();
})();
