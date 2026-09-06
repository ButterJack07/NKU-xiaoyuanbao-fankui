(function () {
  'use strict';
  var form = document.getElementById('uploadCaseForm');
  var input = document.getElementById('caseFile');
  var dropzone = document.getElementById('caseDropzone');
  var fileName = document.getElementById('caseFileName');
  var errorNode = document.getElementById('uploadCaseError');
  var maxSize = 20 * 1024 * 1024;

  function toast(text, type) { var node = document.getElementById('toast'); node.textContent = text; node.className = 'toast show ' + (type || ''); setTimeout(function () { node.className = 'toast'; }, 3500); }
  function showFile(file) { if (file) fileName.textContent = file.name; }
  input.addEventListener('change', function () { showFile(input.files[0]); });
  ['dragenter', 'dragover'].forEach(function (eventName) { dropzone.addEventListener(eventName, function (event) { event.preventDefault(); dropzone.classList.add('dragging'); }); });
  ['dragleave', 'drop'].forEach(function (eventName) { dropzone.addEventListener(eventName, function (event) { event.preventDefault(); dropzone.classList.remove('dragging'); }); });
  dropzone.addEventListener('drop', function (event) { var file = event.dataTransfer.files[0]; if (file) { try { var transfer = new DataTransfer(); transfer.items.add(file); input.files = transfer.files; } catch (error) {} showFile(file); } });
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    var file = input.files[0], button = form.querySelector('button');
    errorNode.classList.add('hidden');
    if (!file) return;
    if (file.size > maxSize) { errorNode.textContent = '文件不能超过 20 MB。'; errorNode.classList.remove('hidden'); return; }
    button.disabled = true; button.textContent = '正在上传…';
    try {
      await window.PATCHWORK_READY;
      var session = (await window.PATCHWORK_AUTH.getSession()).data.session;
      if (!session) throw new Error('请先登录后再上传测试用例。');
      var fileUrl = await window.PatchworkAPI.uploadFile(file, window.PATCHWORK_CONFIG.testCaseStorageBucket);
      var fileType = /\.docx?$/i.test(file.name) ? 'Word' : /\.(xlsx?|csv)$/i.test(file.name) ? 'Excel' : file.name.split('.').pop().toUpperCase();
      var payload = { title: file.name, module: document.querySelector('[name="note"]').value.trim() || '未分类', preconditions: '', steps: '详见上传文件', expected_result: '详见上传文件', priority: 'medium', submitter_id: session.user.id, file_name: file.name, file_url: fileUrl, file_type: fileType, note: document.querySelector('[name="note"]').value.trim() };
      await window.PatchworkAPI.createTestCase(payload);
      toast('测试用例上传成功。', 'success');
      setTimeout(function () { window.location.href = 'test-cases.html'; }, 700);
    } catch (error) { errorNode.textContent = error.message || '上传失败，请稍后重试。'; errorNode.classList.remove('hidden'); button.disabled = false; button.textContent = '提交上传'; }
  });
})();
