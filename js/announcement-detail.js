(function () {
  'use strict';
  function load() { window.PATCHWORK_READY.then(async function () { var node = document.getElementById('announcementDetail'); try { var id = new URLSearchParams(window.location.search).get('id'); var rows = await window.PatchworkAPI.listAnnouncements(); var item = rows.find(function (row) { return String(row.id) === String(id); }); if (!item) throw new Error('找不到公告。'); node.querySelector('.announcement-detail-tag').textContent = item.type === 'system' ? '系统公告' : '管理员公告'; node.querySelector('h2').textContent = item.title; node.querySelector('.announcement-detail-meta').textContent = '发布人：' + (item.author_name || '系统') + ' ｜ 发布时间：' + new Date(item.created_at).toLocaleString('zh-CN') + ' ｜ 阅读状态：已读'; node.querySelector('.announcement-detail-body').textContent = item.content; document.title = '校缘宝内测管理网站 · ' + item.title; } catch (error) { node.querySelector('.announcement-detail-body').textContent = error.message || '公告加载失败。'; } }); }
  load();
})();
