(function () {
  'use strict';
  var bugId = new URLSearchParams(location.search).get('bug'), viewDepartment = new URLSearchParams(location.search).get('department'), bug, members = [], reviewEvents = [], departmentChanges = [];
  var statusText = { pending_review_1: '待一审', pending_review_2: '待二审', rejected: '已打回', postponed: '已暂缓', open: '待处理', in_progress: '处理中', resolved: '已解决' };
  var importanceText = { heavy: '严重', medium: '一般', light: '轻微' };
  var DISTRIBUTED = ['open', 'in_progress', 'resolved'];
  function isDistributed(status) { return DISTRIBUTED.indexOf(status) !== -1; }
  function ensureAssigneeModal() {
    if (!document.getElementById('assigneeModal')) {
      var modal = document.createElement('div'); modal.id = 'assigneeModal'; modal.className = 'modal-backdrop hidden'; modal.innerHTML = '<section class="user-modal assignee-modal"><div class="developer-modal-header"><div><h2>指定跟进人</h2><p id="assigneeBugInfo" class="user-modal-identity"></p><p class="user-modal-help">本部门所有成员均可指定或修改跟进人。</p></div><button id="closeAssigneeModal" class="icon-button" type="button">×</button></div><div class="assignee-form"><label class="field"><span>跟进人</span><select id="assigneeSelect"><option value="">请选择本部门成员</option></select></label><p id="currentAssigneeHint" class="user-modal-help"></p><p id="assigneeError" class="login-error hidden"></p><div class="edit-user-actions"><button id="cancelAssignee" class="user-cancel-button" type="button">取消</button><button id="confirmAssignee" class="case-action-button" type="button">确认指定</button></div></div></section>'; document.body.appendChild(modal);
    }
    if (!document.getElementById('statusModal')) { var statusModal = document.createElement('div'); statusModal.id = 'statusModal'; statusModal.className = 'modal-backdrop hidden'; statusModal.innerHTML = '<section class="user-modal assignee-modal"><div class="developer-modal-header"><div><h2>更改当前状态</h2><p id="statusBugInfo" class="user-modal-identity"></p><p class="user-modal-help">仅当前指定跟进人可提交状态变更。</p></div><button id="closeStatusModal" class="icon-button" type="button">×</button></div><div class="assignee-form"><label class="field"><span>当前状态</span><select id="statusSelect"><option value="open">待处理</option><option value="in_progress">处理中</option><option value="resolved">已完成</option></select></label><p class="user-modal-help">可选：待处理 / 处理中 / 已完成</p><p id="statusError" class="login-error hidden"></p><div class="edit-user-actions"><button id="cancelStatus" class="user-cancel-button" type="button">取消</button><button id="confirmStatus" class="case-action-button" type="button">确认更改</button></div></div></section>'; document.body.appendChild(statusModal); }
    if (!document.getElementById('transferModal')) { var transferModal = document.createElement('div'); transferModal.id = 'transferModal'; transferModal.className = 'modal-backdrop hidden'; transferModal.innerHTML = '<section class="user-modal assignee-modal"><div class="developer-modal-header"><div><h2>转组</h2><p id="transferBugInfo" class="user-modal-identity"></p><p class="user-modal-help">仅当前所属部门组长或超级管理员可发起转组；系统将记录原部门、目标部门、转组人、时间和原因。</p></div><button id="closeTransferModal" class="icon-button" type="button">×</button></div><div class="assignee-form"><label class="field"><span>新归属部门 <i>*</i></span><select id="transferDepartment"><option value="">请选择新部门</option></select></label><label class="field"><span>转组原因（选填）</span><textarea id="transferReason" rows="4" placeholder="请说明转组原因"></textarea></label><p id="transferError" class="login-error hidden"></p><div class="edit-user-actions"><button id="cancelTransfer" class="user-cancel-button" type="button">取消</button><button id="confirmTransfer" class="case-action-button" type="button">确认转组</button></div></div></section>'; document.body.appendChild(transferModal); }
    if (!document.getElementById('reviewModal')) {
      var reviewModal = document.createElement('div'); reviewModal.id = 'reviewModal'; reviewModal.className = 'modal-backdrop hidden'; reviewModal.innerHTML = '<section class="user-modal assignee-modal"><div class="developer-modal-header"><div><h2 id="reviewModalTitle">缺陷审核</h2><p id="reviewBugInfo" class="user-modal-identity"></p><p class="user-modal-help">通过后将进入下一环节；打回后提交人可修改、暂缓或取消上传。备注对所有成员可见。</p></div><button id="closeReviewModal" class="icon-button" type="button">×</button></div><div class="assignee-form"><label class="field"><span>审核结果</span><select id="reviewAction"><option value="approve">通过</option><option value="reject">打回</option></select></label><label class="field"><span>审核备注（打回建议填写）</span><textarea id="reviewNote" rows="4" maxlength="1000" placeholder="填写审核意见，备注对所有成员可见。"></textarea></label><p id="reviewError" class="login-error hidden"></p><div class="edit-user-actions"><button id="cancelReview" class="user-cancel-button" type="button">取消</button><button id="confirmReview" class="case-action-button" type="button">确认审核</button></div></div></section>'; document.body.appendChild(reviewModal);
    }
    if (!document.getElementById('reviewEditModal')) {
      var editModal = document.createElement('div'); editModal.id = 'reviewEditModal'; editModal.className = 'modal-backdrop hidden'; editModal.innerHTML = '<section class="user-modal assignee-modal"><div class="developer-modal-header"><div><h2>审核时修改报告</h2><p id="reviewEditBugInfo" class="user-modal-identity"></p><p class="user-modal-help">修改会立即保存；保存后仍停留在当前审核环节。</p></div><button id="closeReviewEdit" class="icon-button" type="button">×</button></div><form id="reviewEditForm" class="assignee-form"><label class="field"><span>问题标题 *</span><input name="title" maxlength="120" required></label><label class="field"><span>发现模块/功能 *</span><input name="module" maxlength="60" required></label><label class="field"><span>问题描述 *</span><textarea name="description" maxlength="3000" rows="4" required></textarea></label><label class="field"><span>操作步骤 *</span><textarea name="repro_steps" maxlength="3000" rows="4" required></textarea></label><label class="field"><span>预期结果 *</span><textarea name="expected_result" maxlength="1500" rows="2" required></textarea></label><label class="field"><span>实际结果 *</span><textarea name="actual_result" maxlength="1500" rows="2" required></textarea></label><label class="field"><span>严重程度 *</span><select name="importance" required><option value="heavy">严重</option><option value="medium">一般</option><option value="light">轻微</option></select></label><fieldset class="field department-check-field"><legend>归属部门 *</legend><div id="reviewEditDepartments" class="department-checkbox-group"></div></fieldset><p id="reviewEditError" class="login-error hidden"></p><div class="edit-user-actions"><button id="cancelReviewEdit" class="user-cancel-button" type="button">取消</button><button id="saveReviewEdit" class="case-action-button" type="submit">保存报告</button></div></form></section>'; document.body.appendChild(editModal);
    }
    if (!document.getElementById('cancelBugModal')) {
      var cancelModal = document.createElement('div'); cancelModal.id = 'cancelBugModal'; cancelModal.className = 'modal-backdrop hidden'; cancelModal.innerHTML = '<section class="user-modal reset-password-modal"><div class="developer-modal-header"><div><h2>确认取消上传？</h2><p id="cancelBugInfo" class="user-modal-identity"></p><p class="user-modal-help">取消上传会删除这份缺陷报告及其附件，删除后无法恢复。</p></div><button id="closeCancelBug" class="icon-button" type="button">×</button></div><div class="reset-password-actions"><button id="cancelUpload" class="user-cancel-button" type="button">返回</button><button id="confirmCancelBug" class="case-action-button" type="button">确认删除</button></div><p id="cancelBugError" class="login-error hidden"></p></section>'; document.body.appendChild(cancelModal);
    }
  }
  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function date(v) { return v ? new Date(v).toLocaleString('zh-CN') : '—'; }
  function extension(url) { var clean = String(url || '').split('?')[0].split('#')[0]; var name = clean.slice(clean.lastIndexOf('/') + 1); var match = name.match(/(\.[a-z0-9]+)$/i); return match ? match[1].toLowerCase() : ''; }
  function category(url) { var ext = extension(url); if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.avif', '.svg'].includes(ext)) return 'image'; if (['.doc', '.docx', '.pdf', '.md', '.txt', '.rtf', '.ppt', '.pptx'].includes(ext)) return 'document'; if (['.xls', '.xlsx', '.csv', '.ods'].includes(ext)) return 'sheet'; return 'other'; }
  function attachmentSummary(urls, code) { if (!urls.length) return '无附件'; var kind = urls.length === 1 ? category(urls[0]) : 'other'; var label = urls.length === 1 && kind === 'image' ? '1 张图片' : urls.length === 1 && kind === 'document' ? '1 份文档' : urls.length === 1 && kind === 'sheet' ? '1 份表格' : urls.length + ' 个附件'; var links = urls.map(function (url, index) { var filename = code + '-' + String(index + 1).padStart(2, '0') + extension(url); return '<a class="detail-attachment-download" href="' + esc(url) + '" download="' + filename + '" target="_blank" rel="noopener">下载附件 ' + String(index + 1).padStart(2, '0') + '</a>'; }).join(''); return '<span>' + label + '</span><span class="detail-attachment-links">' + links + '</span>'; }
  function toast(t, type) { var n = document.getElementById('toast'); n.textContent = t; n.className = 'toast show ' + (type || ''); setTimeout(function () { n.className = 'toast'; }, 3000); }
  function bugLabel() { return window.PatchworkAPI.reportCode(bug) + '｜' + bug.title; }
  function currentStage() { return bug.status === 'pending_review_1' ? 1 : bug.status === 'pending_review_2' ? 2 : 0; }
  function canReview() { var p = window.PATCHWORK_PROFILE, stage = currentStage(); if (!p || !stage) return false; return Number(p.review_stage) === stage; }
  function isSubmitter() { var p = window.PATCHWORK_PROFILE; return Boolean(p && (bug.submitter_id === p.id || p.role === 'admin')); }
  function isReversible() { return bug.status === 'rejected' || bug.status === 'postponed'; }
  function bugDepartments() { return String(bug.assignee_department || '').split(',').map(function (item) { return item.trim(); }).filter(Boolean); }
  function processingDepartment() {
    var p = window.PATCHWORK_PROFILE || {};
    var dep = viewDepartment || p.department;
    return bugDepartments().indexOf(dep) !== -1 ? dep : (p.role === 'admin' ? bugDepartments()[0] : null);
  }
  function processingState() { return window.PatchworkAPI.departmentState(bug, processingDepartment()); }
  async function saveDepartmentPatch(patch) {
    var department = processingDepartment();
    if (!department) throw new Error('请从对应部门列表进入此任务。');
    var rows = await window.PatchworkAPI.updateDepartmentProgress(bug.id, department, patch);
    if (!rows || !rows[0]) throw new Error('部门处理信息未保存。');
    bug = rows[0];
  }

  function ensureReviewCard() {
    var card = document.getElementById('reviewCard');
    if (!card) { card = document.createElement('section'); card.id = 'reviewCard'; card.className = 'detail-card review-card'; var grid = document.querySelector('.bug-detail-grid'); if (grid) grid.appendChild(card); }
    return card;
  }
  function renderReviewCard() {
    var card = ensureReviewCard();
    if (!card) return;
    var stage = currentStage();
    var stateLine = '';
    if (stage === 1) stateLine = '当前环节：<b>待第一审核</b>（审核人由超级管理员设置）';
    else if (stage === 2) stateLine = '当前环节：<b>待第二审核</b>（第一审核已通过，审核人由超级管理员设置）';
    else if (bug.status === 'rejected') stateLine = '当前环节：<b>已打回</b>，等待提交人修改后重新提交。';
    else if (bug.status === 'postponed') stateLine = '当前环节：<b>已暂缓</b>，暂不分发，可稍后重新提交审核。';
    else stateLine = '审核已完成，报告已分发至' + (bugDepartments().join('、') || '对应部门') + '。';
    var history = reviewEvents.length ? reviewEvents.map(function (event) {
      var stageLabel = Number(event.stage) === 1 ? '一审' : '二审';
      var actionLabel = event.action === 'approve' ? '通过' : '打回';
      var actionClass = event.action === 'approve' ? 'review-approve' : 'review-reject';
      return '<div class="review-event"><div class="review-event-head"><span class="' + actionClass + '">' + stageLabel + ' · ' + actionLabel + '</span><span>' + esc(event.reviewer_name || '审核人') + ' · ' + date(event.created_at) + '</span></div>' + (event.note ? '<p>' + esc(event.note) + '</p>' : '<p class="review-event-empty">（未填写备注）</p>') + '</div>';
    }).join('') : '<p class="review-event-empty">暂无审核记录。</p>';
    var actions = '';
    if (canReview()) actions += '<button id="reviewEditButton" class="detail-muted-button" type="button">修改报告</button><button id="reviewButton" class="case-action-button" type="button">进入' + (stage === 1 ? '一审' : '二审') + '</button>';
    if (isReversible() && isSubmitter()) actions += '<a class="case-action-button" href="submit-bug.html?bug=' + encodeURIComponent(bug.id) + '">修改并重新提交</a>' + '<button id="resubmitButton" class="case-action-button" type="button">直接重新提交</button>' + (bug.status === 'rejected' ? '<button id="postponeButton" class="detail-muted-button" type="button">暂缓上传</button>' : '') + '<button id="cancelBugButton" class="detail-muted-button" type="button">取消上传</button>';
    card.innerHTML = '<h2>审核流程</h2><p class="review-state">' + stateLine + '</p><div class="review-history">' + history + '</div><div class="detail-actions review-actions">' + actions + '</div>';
    var reviewButton = document.getElementById('reviewButton'); if (reviewButton) reviewButton.onclick = openReviewModal;
    var reviewEditButton = document.getElementById('reviewEditButton'); if (reviewEditButton) reviewEditButton.onclick = openReviewEditModal;
    var resubmitButton = document.getElementById('resubmitButton'); if (resubmitButton) resubmitButton.onclick = resubmitBug;
    var postponeButton = document.getElementById('postponeButton'); if (postponeButton) postponeButton.onclick = postponeBug;
    var cancelBugButton = document.getElementById('cancelBugButton'); if (cancelBugButton) cancelBugButton.onclick = openCancelBug;
  }
  function render() {
    var p = window.PATCHWORK_PROFILE, current = viewDepartment || (p && p.department) || bugDepartments()[0] || '';
    document.title = '校缘宝内测管理网站 · ' + window.PatchworkAPI.reportCode(bug);
    document.getElementById('detailCode').textContent = window.PatchworkAPI.reportCode(bug); document.getElementById('detailTitle').textContent = bug.title;
    document.getElementById('detailReporter').textContent = bug.reporter || '—'; document.getElementById('detailCreated').textContent = date(bug.created_at); document.getElementById('detailDepartment').textContent = bugDepartments().join('、') || '—';
    document.getElementById('detailModule').textContent = bug.module || '—'; document.getElementById('detailDescription').textContent = bug.request_type === 'product_change' ? bug.change_reason || bug.description || '—' : bug.description || '—'; document.getElementById('detailSteps').textContent = bug.request_type === 'product_change' ? bug.before_logic || '—' : bug.repro_steps || '—'; document.getElementById('detailExpected').textContent = bug.request_type === 'product_change' ? bug.after_logic || '—' : bug.expected_result || '—'; document.getElementById('detailActual').textContent = bug.request_type === 'product_change' ? bug.exception_handling || '—' : bug.actual_result || '—'; document.getElementById('detailImportance').textContent = importanceText[bug.importance] || bug.importance || '—'; var code = window.PatchworkAPI.reportCode(bug); document.getElementById('detailAttachments').innerHTML = attachmentSummary(bug.attachment_urls || [], code);
    var department = processingDepartment(), state = processingState();
    document.getElementById('detailAssignee').textContent = department ? state.assignee || '—' : '请查看各部门处理信息'; document.getElementById('detailContact').textContent = '联系提交人'; document.getElementById('detailStatus').textContent = (isDistributed(bug.status) && department ? department + '：' + (statusText[state.status] || state.status) : statusText[bug.status]) || '—'; document.getElementById('detailNote').textContent = department && isDistributed(bug.status) ? state.note || '暂无本部门备注' : bug.review_note || '暂无备注';
    var note;
    if (bug.status === 'pending_review_1') note = '报告处于待第一审核状态，由超级管理员指定的第一审核人审核；审核人可填写备注，备注对所有成员可见。';
    else if (bug.status === 'pending_review_2') note = '第一审核已通过，等待超级管理员指定的第二审核人审核；通过后将分发至对应部门。';
    else if (bug.status === 'rejected') note = '审核未通过，提交人可修改后重新提交、暂缓上传或取消上传。';
    else if (bug.status === 'postponed') note = '已暂缓上传，暂不分发，报告保留在测试组列表，可稍后重新提交审核。';
    else note = current === '测试' ? '测试普通成员可查看；指定跟进人和转组仅测试组长、超级管理员可操作。' : current + '成员可指定跟进人与处理；转组仅本部门组长、超级管理员可操作。';
    document.getElementById('permissionNote').textContent = note;
    if (isDistributed(bug.status)) document.getElementById('permissionNote').textContent = department ? '当前处理部门：' + department + '。状态、跟进人和备注仅作用于本部门；处理部门组长或超级管理员可更新处理部门。' : '这里显示报告总体状态。各处理部门独立处理，详情见下方各部门处理情况。';
    var distributed = isDistributed(bug.status);
    var admin = p && p.role === 'admin', leader = p && p.role === 'leader' && p.department === department, assignee = p && state.assignee_id === p.id, testView = !department;
    var assigneeButton = document.getElementById('assigneeButton'); var transferButton = document.getElementById('transferButton'); var statusButton = document.getElementById('statusButton'); var noteButton = document.getElementById('noteButton');
    var canOperate = Boolean(admin || leader || assignee);
    assigneeButton.classList.toggle('hidden', !distributed || testView || !(admin || leader));
    transferButton.classList.toggle('hidden', !distributed || !(admin || leader));
    transferButton.textContent = '更新处理部门';
    statusButton.classList.toggle('hidden', !distributed || testView || !canOperate);
    noteButton.classList.toggle('hidden', !distributed || testView || !canOperate);
    assigneeButton.disabled = !(admin || leader);
    assigneeButton.title = department ? '指定' + department + '的跟进人' : '';
    transferButton.disabled = !(admin || leader);
    statusButton.disabled = !canOperate;
    document.getElementById('detailActionPanel').classList.add('hidden');
    renderReviewCard();
    var progress = document.getElementById('departmentProgressCard');
    if (!progress) { progress = document.createElement('section'); progress.id = 'departmentProgressCard'; progress.className = 'detail-card review-card'; document.querySelector('.bug-detail-grid').appendChild(progress); }
    progress.innerHTML = '<h2>各部门处理情况</h2>' + bugDepartments().map(function (dep) { var item = window.PatchworkAPI.departmentState(bug, dep); return '<div class="department-progress-row"><strong>' + esc(dep) + '</strong><span>' + esc(distributed ? statusText[item.status] : '未分发') + '</span><span>跟进人：' + esc(item.assignee || '未指定') + '</span><small>' + esc(item.note || '') + '</small></div>'; }).join('');
    var changesCard = document.getElementById('departmentChangeHistory');
    if (!changesCard) { changesCard = document.createElement('section'); changesCard.id = 'departmentChangeHistory'; changesCard.className = 'detail-card review-card'; document.querySelector('.bug-detail-grid').appendChild(changesCard); }
    changesCard.innerHTML = '<h2>处理部门更新记录</h2>' + (departmentChanges.length ? departmentChanges.map(function (change) { return '<p><strong>' + date(change.created_at) + '</strong> · ' + esc(change.changed_by_name || '成员') + ' · ' + esc(change.previous_departments || '无') + ' → ' + esc(change.next_departments || '无') + (change.note ? '<br>' + esc(change.note) : '') + '</p>'; }).join('') : '<p class="review-event-empty">暂无处理部门更新记录。</p>');
  }
  function actionPanel(type) { var panel = document.getElementById('detailActionPanel'); var input = document.getElementById('actionInput'); var note = document.getElementById('detailNote'); if (type === 'note') { note.innerHTML = '<textarea id="inlineNoteInput" class="inline-note-input" rows="5" maxlength="3000">' + esc(processingState().note || '') + '</textarea><div class="inline-note-actions"><button id="cancelInlineNote" class="user-cancel-button" type="button">取消</button><button id="saveInlineNote" class="case-action-button" type="button">保存备注</button></div>'; document.getElementById('cancelInlineNote').onclick = function () { render(); }; document.getElementById('saveInlineNote').onclick = saveInlineNote; return; } panel.dataset.type = type; input.value = ''; input.placeholder = '请输入新的处理信息'; panel.classList.remove('hidden'); input.focus(); }
  async function saveInlineNote() { var input = document.getElementById('inlineNoteInput'), button = document.getElementById('saveInlineNote'); if (!input) return; button.disabled = true; button.textContent = '保存中…'; try { await saveDepartmentPatch({ note: input.value.trim() }); render(); toast('本部门处理备注已更新。', 'success'); } catch (e) { toast(e.message || '保存备注失败。', 'error'); } finally { button.disabled = false; button.textContent = '保存备注'; } }
  function openStatusModal() { document.getElementById('statusBugInfo').textContent = bugLabel() + ' · ' + processingDepartment(); document.getElementById('statusSelect').value = processingState().status; document.getElementById('statusError').classList.add('hidden'); document.getElementById('statusModal').classList.remove('hidden'); }
  function closeStatusModal() { document.getElementById('statusModal').classList.add('hidden'); }
  async function confirmStatus() { var button = document.getElementById('confirmStatus'), value = document.getElementById('statusSelect').value; button.disabled = true; button.textContent = '保存中…'; try { await saveDepartmentPatch({ status: value }); closeStatusModal(); render(); toast('本部门状态已更新，其他部门不受影响。', 'success'); } catch (e) { document.getElementById('statusError').textContent = e.message || '状态更新失败。'; document.getElementById('statusError').classList.remove('hidden'); } finally { button.disabled = false; button.textContent = '确认更改'; } }
  function openTransferModal() {
    var modal = document.getElementById('transferModal');
    modal.querySelector('h2').textContent = '更新处理部门';
    modal.querySelector('.user-modal-help').textContent = '支持多选。原处理部门默认勾选；保留部门的处理状态不变，新增部门从待处理开始，取消勾选的部门退出当前任务。';
    var select = document.getElementById('transferDepartment');
    if (select.tagName === 'SELECT') { var group = document.createElement('div'); group.id = 'transferDepartment'; group.className = 'department-checkbox-group'; select.parentNode.replaceChild(group, select); }
    document.getElementById('transferDepartment').innerHTML = ['技术—前端', '技术—后端', '设计', '产品'].map(function (dep) { var state = window.PatchworkAPI.departmentState(bug, dep); var assigned = bugDepartments().includes(dep); var statusLabel = { open: '未处理', in_progress: '处理中', resolved: '已完成' }[state.status] || '未分配'; return '<label class="department-transfer-option"><input type="checkbox" value="' + esc(dep) + '"' + (assigned ? ' checked' : '') + '><span><strong>' + esc(dep) + '</strong><small>' + (assigned ? '当前：' + statusLabel : '当前：未分配') + '</small></span></label>'; }).join('');
    modal.querySelector('.field > span').textContent = '处理部门（可多选）';
    document.getElementById('transferReason').placeholder = '处理部门调整说明（选填）';
    document.getElementById('transferBugInfo').textContent = bugLabel();
    document.getElementById('transferReason').value = '';
    document.getElementById('transferError').classList.add('hidden');
    document.getElementById('confirmTransfer').textContent = '保存处理部门';
    modal.classList.remove('hidden');
  }
  function closeTransferModal() { document.getElementById('transferModal').classList.add('hidden'); }
  async function confirmTransfer() {
    var targets = Array.from(document.querySelectorAll('#transferDepartment input:checked')).map(function (input) { return input.value; });
    var error = document.getElementById('transferError'), button = document.getElementById('confirmTransfer');
    var note = document.getElementById('transferReason').value.trim();
    if (!targets.length) { error.textContent = '请至少选择一个处理部门。'; error.classList.remove('hidden'); return; }
    button.disabled = true;
    try {
      var session = (await window.PATCHWORK_AUTH.getSession()).data.session;
      var rows = await window.PATCHWORK_SUPABASE.rpc('update_bug_departments', { p_bug_id: bug.id, p_departments: targets, p_note: note });
      if (rows.error) throw rows.error;
      await window.PatchworkAPI.createAssignmentEvent({ bug_id: bug.id, from_department: bug.assignee_department || '', to_department: targets.join(','), from_user_id: bug.follow_up_id || null, to_user_id: null, note: note, created_by: session.user.id });
      var refreshed = await window.PatchworkAPI.listBugs(); bug = refreshed.find(function (item) { return item.id === bug.id; }) || bug;
      closeTransferModal(); render(); toast('处理部门已更新。', 'success');
    } catch (e) { error.textContent = e.message; error.classList.remove('hidden'); }
    finally { button.disabled = false; button.textContent = '保存处理部门'; }
  }
  async function saveAction() { var type = document.getElementById('detailActionPanel').dataset.type, value = document.getElementById('actionInput').value.trim(), patch = {}; if (type === 'note') patch.transfer_note = value; else if (type === 'status') patch.status = value || bug.status; else if (type === 'assignee') patch.assignee = value; else patch.transfer_note = value; try { var updated = await window.PatchworkAPI.updateBug(bug.id, patch); bug = updated[0] || Object.assign({}, bug, patch); render(); document.getElementById('detailActionPanel').classList.add('hidden'); toast('缺陷信息已更新。', 'success'); } catch (e) { toast(e.message || '更新失败。', 'error'); } }
  function openAssigneeModal() { var select = document.getElementById('assigneeSelect'); if (!select) return; var department = processingDepartment(); select.innerHTML = '<option value="">请选择本部门成员</option>' + members.filter(function (item) { return item.department === department; }).map(function (item) { return '<option value="' + esc(item.id) + '">' + esc(item.full_name || item.username) + '</option>'; }).join(''); select.value = processingState().assignee_id || ''; document.getElementById('assigneeBugInfo').textContent = bugLabel(); document.getElementById('currentAssigneeHint').textContent = '当前跟进人：' + (processingState().assignee || '—') + '（' + department + '部门）'; document.getElementById('assigneeModal').classList.remove('hidden'); }
  function closeAssigneeModal() { document.getElementById('assigneeModal').classList.add('hidden'); }
  async function confirmAssignee() { var selectedId = document.getElementById('assigneeSelect').value, selected = members.find(function (item) { return item.id === selectedId; }), error = document.getElementById('assigneeError'), button = document.getElementById('confirmAssignee'); if (!selected) { error.textContent = '请选择本部门成员。'; error.classList.remove('hidden'); return; } button.disabled = true; button.textContent = '保存中…'; try { await saveDepartmentPatch({ assignee_id: selected.id }); closeAssigneeModal(); render(); toast('本部门跟进人已更新。', 'success'); } catch (e) { error.textContent = e.message || '指定跟进人失败。'; error.classList.remove('hidden'); } finally { button.disabled = false; button.textContent = '确认指定'; } }

  function openReviewModal() { document.getElementById('reviewModalTitle').textContent = (currentStage() === 1 ? '一审' : '二审') + '：' + bugLabel(); document.getElementById('reviewBugInfo').textContent = bugLabel(); document.getElementById('reviewAction').value = 'approve'; document.getElementById('reviewNote').value = ''; document.getElementById('reviewError').classList.add('hidden'); document.getElementById('reviewModal').classList.remove('hidden'); }
  function closeReviewModal() { document.getElementById('reviewModal').classList.add('hidden'); }
  function openReviewEditModal() {
    var form = document.getElementById('reviewEditForm');
    var fields = ['title', 'module', 'description', 'repro_steps', 'expected_result', 'actual_result', 'importance'];
    fields.forEach(function (name) { if (form.elements[name]) form.elements[name].value = bug[name] || ''; });
    document.getElementById('reviewEditBugInfo').textContent = bugLabel();
    document.getElementById('reviewEditDepartments').innerHTML = ['技术—前端', '技术—后端', '设计', '产品'].map(function (department) {
      var checked = bugDepartments().indexOf(department) !== -1 ? ' checked' : '';
      return '<label><input type="checkbox" name="assignee_departments" value="' + esc(department) + '"' + checked + '><span>' + esc(department) + '</span></label>';
    }).join('');
    document.getElementById('reviewEditError').classList.add('hidden');
    document.getElementById('reviewEditModal').classList.remove('hidden');
  }
  function closeReviewEditModal() { document.getElementById('reviewEditModal').classList.add('hidden'); }
  async function saveReviewEdit(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var departments = Array.from(form.querySelectorAll('input[name="assignee_departments"]:checked')).map(function (input) { return input.value; });
    var error = document.getElementById('reviewEditError');
    var button = document.getElementById('saveReviewEdit');
    if (!departments.length) { error.textContent = '请至少选择一个归属部门。'; error.classList.remove('hidden'); return; }
    var patch = { assignee_department: departments.join(','), updated_at: new Date().toISOString() };
    ['title', 'module', 'description', 'repro_steps', 'expected_result', 'actual_result', 'importance'].forEach(function (name) { patch[name] = form.elements[name].value.trim(); });
    button.disabled = true; button.textContent = '保存中…'; error.classList.add('hidden');
    try {
      var rows = await window.PatchworkAPI.updateBug(bug.id, patch);
      bug = rows && rows[0] ? rows[0] : Object.assign({}, bug, patch);
      closeReviewEditModal(); render(); toast('审核中的报告内容已保存。', 'success');
    } catch (e) { error.textContent = e.message || '报告修改失败。'; error.classList.remove('hidden'); }
    finally { button.disabled = false; button.textContent = '保存报告'; }
  }
  async function confirmReview() {
    var action = document.getElementById('reviewAction').value, note = document.getElementById('reviewNote').value.trim();
    var error = document.getElementById('reviewError'), button = document.getElementById('confirmReview');
    if (action === 'reject' && !note) { error.textContent = '打回时请填写审核备注。'; error.classList.remove('hidden'); return; }
    var stage = currentStage();
    if (!stage) { closeReviewModal(); return; }
    var session = (await window.PATCHWORK_AUTH.getSession()).data.session;
    var profile = window.PATCHWORK_PROFILE || {};
    var nextStatus = action === 'approve' ? (stage === 1 ? 'pending_review_2' : 'open') : 'rejected';
    button.disabled = true; button.textContent = '提交中…';
    try {
      var updated = await window.PatchworkAPI.updateBug(bug.id, { status: nextStatus, review_note: note, reviewer_id: session.user.id, updated_at: new Date().toISOString() });
      bug = updated[0] || Object.assign({}, bug, { status: nextStatus, review_note: note });
      await window.PatchworkAPI.createReviewEvent({ bug_id: bug.id, stage: stage, action: action, note: note, reviewer_id: session.user.id, reviewer_name: profile.full_name || profile.username || '' });
      closeReviewModal();
      await loadReviewEvents();
      render();
      toast(action === 'approve' ? (stage === 1 ? '第一审核已通过，进入第二审核。' : '第二审核已通过，报告已分发至对应部门。') : '报告已打回，提交人可修改后重新提交。', 'success');
    } catch (e) { error.textContent = e.message || '审核提交失败。'; error.classList.remove('hidden'); }
    finally { button.disabled = false; button.textContent = '确认审核'; }
  }
  async function resubmitBug() { if (!window.confirm('确认直接重新提交这份缺陷报告吗？')) return; try { var updated = await window.PatchworkAPI.updateBug(bug.id, { status: 'pending_review_1', review_note: '', updated_at: new Date().toISOString() }); bug = updated[0] || Object.assign({}, bug, { status: 'pending_review_1', review_note: '' }); render(); toast('报告已重新提交，等待一审。', 'success'); } catch (e) { toast(e.message || '重新提交失败。', 'error'); } }
  async function postponeBug() { try { var updated = await window.PatchworkAPI.updateBug(bug.id, { status: 'postponed', updated_at: new Date().toISOString() }); bug = updated[0] || Object.assign({}, bug, { status: 'postponed' }); render(); toast('报告已暂缓上传，暂不分发。', 'success'); } catch (e) { toast(e.message || '暂缓失败。', 'error'); } }
  function openCancelBug() { document.getElementById('cancelBugInfo').textContent = bugLabel(); document.getElementById('cancelBugError').classList.add('hidden'); document.getElementById('cancelBugModal').classList.remove('hidden'); }
  function closeCancelBug() { document.getElementById('cancelBugModal').classList.add('hidden'); }
  async function confirmCancelBug() {
    var button = document.getElementById('confirmCancelBug'), error = document.getElementById('cancelBugError');
    button.disabled = true; button.textContent = '正在删除…';
    try {
      var urls = bug.attachment_urls || [];
      for (var i = 0; i < urls.length; i += 1) { try { await window.PatchworkAPI.deleteAttachment(urls[i]); } catch (ignore) {} }
      await window.PatchworkAPI.deleteBug(bug.id);
      toast('缺陷报告已删除。', 'success');
      window.setTimeout(function () { window.location.href = 'bug-reports.html'; }, 900);
    } catch (e) { error.textContent = e.message || '删除失败。'; error.classList.remove('hidden'); button.disabled = false; button.textContent = '确认删除'; }
  }
  async function loadReviewEvents() { try { reviewEvents = await window.PatchworkAPI.listReviewEvents(bugId) || []; } catch (e) { reviewEvents = []; } }
  async function loadDepartmentChanges() { try { departmentChanges = await window.PatchworkAPI.listDepartmentChanges(bugId) || []; } catch (e) { departmentChanges = []; } }
  async function load() { try { await window.PATCHWORK_READY; var result = await Promise.all([window.PatchworkAPI.listBugs(), window.PatchworkAPI.listProfiles()]); bug = result[0].find(function (item) { return item.id === bugId; }); members = result[1] || []; if (!bug) throw new Error('找不到该缺陷。'); await Promise.all([loadReviewEvents(), loadDepartmentChanges()]); render(); } catch (e) { toast(e.message, 'error'); } }
  ensureAssigneeModal(); document.getElementById('noteButton').onclick = function () { actionPanel('note'); }; document.getElementById('assigneeButton').onclick = openAssigneeModal; document.getElementById('statusButton').onclick = openStatusModal; document.getElementById('transferButton').onclick = openTransferModal; document.getElementById('cancelAction').onclick = function () { document.getElementById('detailActionPanel').classList.add('hidden'); }; document.getElementById('saveAction').onclick = saveAction; document.getElementById('closeAssigneeModal').onclick = closeAssigneeModal; document.getElementById('cancelAssignee').onclick = closeAssigneeModal; document.getElementById('confirmAssignee').onclick = confirmAssignee; document.getElementById('assigneeModal').onclick = function (event) { if (event.target === event.currentTarget) closeAssigneeModal(); }; document.getElementById('closeStatusModal').onclick = closeStatusModal; document.getElementById('cancelStatus').onclick = closeStatusModal; document.getElementById('confirmStatus').onclick = confirmStatus; document.getElementById('closeTransferModal').onclick = closeTransferModal; document.getElementById('cancelTransfer').onclick = closeTransferModal; document.getElementById('confirmTransfer').onclick = confirmTransfer; document.getElementById('closeReviewModal').onclick = closeReviewModal; document.getElementById('cancelReview').onclick = closeReviewModal; document.getElementById('confirmReview').onclick = confirmReview; document.getElementById('reviewModal').onclick = function (event) { if (event.target === event.currentTarget) closeReviewModal(); }; document.getElementById('closeReviewEdit').onclick = closeReviewEditModal; document.getElementById('cancelReviewEdit').onclick = closeReviewEditModal; document.getElementById('reviewEditForm').addEventListener('submit', saveReviewEdit); document.getElementById('reviewEditModal').onclick = function (event) { if (event.target === event.currentTarget) closeReviewEditModal(); }; document.getElementById('closeCancelBug').onclick = closeCancelBug; document.getElementById('cancelUpload').onclick = closeCancelBug; document.getElementById('confirmCancelBug').onclick = confirmCancelBug; document.getElementById('cancelBugModal').onclick = function (event) { if (event.target === event.currentTarget) closeCancelBug(); }; load();
})();
