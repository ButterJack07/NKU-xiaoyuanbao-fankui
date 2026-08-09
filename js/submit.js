(function () {
  'use strict';

  var form = document.getElementById('bugForm');
  var fileInput = document.getElementById('attachments');
  var fileList = document.getElementById('fileList');
  var submitButton = document.getElementById('submitButton');
  var configNotice = document.getElementById('configNotice');
  var successModal = document.getElementById('successModal');
  var selectedFiles = [];

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

  function acceptFiles(files) {
    var incoming = Array.from(files);
    if (selectedFiles.length + incoming.length > 3) {
      showToast('最多只能上传 3 个附件。', 'error');
      return;
    }
    var oversized = incoming.find(function (file) { return file.size > 5 * 1024 * 1024; });
    if (oversized) {
      showToast(oversized.name + ' 超过 5 MB 限制。', 'error');
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

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!window.PatchworkAPI.isConfigured()) {
      showToast('请先配置 Supabase 数据库连接。', 'error');
      return;
    }

    submitButton.disabled = true;
    submitButton.querySelector('span').textContent = selectedFiles.length ? '正在上传附件…' : '正在提交…';

    try {
      var attachmentUrls = [];
      for (var i = 0; i < selectedFiles.length; i += 1) {
        attachmentUrls.push(await window.PatchworkAPI.uploadFile(selectedFiles[i]));
      }

      submitButton.querySelector('span').textContent = '正在写入数据库…';
      var data = Object.fromEntries(new FormData(form).entries());
      delete data.attachments;
      data.attachment_urls = attachmentUrls;
      data.status = 'open';
      var rows = await window.PatchworkAPI.createBug(data);
      var bug = rows && rows[0];
      document.getElementById('successCode').textContent = bug ? '#' + bug.id.slice(0, 8).toUpperCase() : '已创建';
      successModal.classList.remove('hidden');
    } catch (error) {
      showToast(error.message || '提交失败，请稍后重试。', 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.querySelector('span').textContent = '提交 Bug 反馈';
    }
  });

  document.getElementById('submitAnother').addEventListener('click', function () {
    successModal.classList.add('hidden');
    form.reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
