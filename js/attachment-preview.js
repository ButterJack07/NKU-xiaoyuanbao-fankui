(function () {
  'use strict';
  var IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'avif', 'svg'];
  var previewImages = [];
  var previewIndex = 0;

  function esc(value) { return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function extension(url) { var clean = String(url || '').split('?')[0].split('#')[0]; var name = clean.slice(clean.lastIndexOf('/') + 1); var match = name.match(/(\.[a-z0-9]+)$/i); return match ? match[1].toLowerCase() : ''; }

  function isImage(url) {
    try {
      var pathname = new URL(url, window.location.href).pathname.toLowerCase();
      return /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/.test(pathname);
    } catch (error) {
      return new RegExp('\\.(' + IMAGE_EXTENSIONS.join('|') + ')(?:\\?|#|$)', 'i').test(String(url || ''));
    }
  }

  function fileName(url, index) {
    try {
      var name = decodeURIComponent(new URL(url, window.location.href).pathname.split('/').pop() || '');
      name = name.replace(/^[0-9a-f-]{36}-/i, '');
      return name || '附件 ' + (index + 1);
    } catch (error) {
      return '附件 ' + (index + 1);
    }
  }

  function ensureModal() {
    if (document.getElementById('attachmentPreviewModal')) return;
    var modal = document.createElement('div');
    modal.id = 'attachmentPreviewModal';
    modal.className = 'image-preview-modal hidden';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'attachmentPreviewTitle');
    modal.innerHTML = '<div class="image-preview-toolbar"><div><p class="eyebrow">IMAGE PREVIEW</p><strong id="attachmentPreviewTitle">附件图片</strong><small id="attachmentPreviewCounter">1 / 1</small></div><div class="image-preview-actions"><a id="attachmentPreviewOriginal" class="button button-ghost button-small" href="#" target="_blank" rel="noopener">打开原图 ↗</a><button id="attachmentPreviewClose" class="icon-button" type="button" aria-label="关闭图片预览">×</button></div></div><div id="attachmentPreviewStage" class="image-preview-stage"><button id="attachmentPreviewPrevious" class="image-preview-nav image-preview-previous" type="button" aria-label="上一张图片">←</button><div id="attachmentPreviewLoading" class="image-preview-loading"><span class="loader"></span><small>正在加载图片…</small></div><img id="attachmentPreviewContent" src="" alt="附件大图预览"><div id="attachmentPreviewError" class="image-preview-error hidden"><strong>图片加载失败</strong><small>可以尝试点击右上角“打开原图”。</small></div><button id="attachmentPreviewNext" class="image-preview-nav image-preview-next" type="button" aria-label="下一张图片">→</button></div><div id="attachmentPreviewStrip" class="image-preview-strip"></div>';
    document.body.appendChild(modal);

    document.getElementById('attachmentPreviewClose').onclick = closePreview;
    document.getElementById('attachmentPreviewPrevious').onclick = function () { movePreview(-1); };
    document.getElementById('attachmentPreviewNext').onclick = function () { movePreview(1); };
    document.getElementById('attachmentPreviewContent').addEventListener('load', function (event) {
      event.currentTarget.classList.remove('is-loading');
      document.getElementById('attachmentPreviewLoading').classList.add('hidden');
    });
    document.getElementById('attachmentPreviewContent').addEventListener('error', function (event) {
      event.currentTarget.classList.add('is-loading');
      document.getElementById('attachmentPreviewLoading').classList.add('hidden');
      document.getElementById('attachmentPreviewError').classList.remove('hidden');
    });
    modal.addEventListener('click', function (event) {
      if (event.target === modal || event.target.id === 'attachmentPreviewStage') closePreview();
    });
    document.addEventListener('keydown', function (event) {
      if (modal.classList.contains('hidden')) return;
      if (event.key === 'Escape') closePreview();
      if (event.key === 'ArrowLeft') movePreview(-1);
      if (event.key === 'ArrowRight') movePreview(1);
    });
    document.addEventListener('click', function (event) {
      var button = event.target.closest && event.target.closest('[data-attachment-preview-index]');
      if (!button) return;
      event.preventDefault();
      openPreview(Number(button.dataset.attachmentPreviewIndex));
    });
    document.addEventListener('error', function (event) {
      var image = event.target;
      if (image && image.tagName === 'IMG' && image.closest('.attachment-thumbnail')) image.closest('.attachment-thumbnail').classList.add('image-load-failed');
    }, true);
  }

  function render(urls, options) {
    options = options || {};
    urls = Array.isArray(urls) ? urls.filter(Boolean) : [];
    ensureModal();
    previewImages = urls.filter(isImage).map(function (url, index) { return { url: url, name: fileName(url, index) }; });
    if (!urls.length) return '无附件';
    var imageIndex = 0;
    var fileIndex = 0;
    var images = [];
    var files = [];
    urls.forEach(function (url, index) {
      var name = fileName(url, index);
      if (isImage(url)) {
        images.push('<button class="attachment-thumbnail" type="button" data-attachment-preview-index="' + imageIndex + '" aria-label="预览图片 ' + esc(name) + '"><span class="thumbnail-image-wrap"><img src="' + esc(url) + '" alt="' + esc(name) + ' 缩略图" loading="lazy"><i>图片无法加载</i></span><span><strong>' + esc(name) + '</strong><small>点击查看大图</small></span></button>');
        imageIndex += 1;
      } else {
        var filename = options.code ? options.code + '-' + String(fileIndex + 1).padStart(2, '0') + extension(url) : name;
        files.push('<a class="detail-attachment-download" href="' + esc(url) + '" download="' + esc(filename) + '" target="_blank" rel="noopener">下载附件 ' + String(fileIndex + 1).padStart(2, '0') + '</a>');
        fileIndex += 1;
      }
    });
    return (images.length ? '<div class="attachment-gallery">' + images.join('') + '</div>' : '') + (files.length ? '<span class="detail-attachment-links">' + files.join('') + '</span>' : '');
  }

  function renderPreview() {
    var image = previewImages[previewIndex];
    if (!image) return;
    var content = document.getElementById('attachmentPreviewContent');
    document.getElementById('attachmentPreviewTitle').textContent = image.name;
    document.getElementById('attachmentPreviewCounter').textContent = (previewIndex + 1) + ' / ' + previewImages.length;
    document.getElementById('attachmentPreviewOriginal').href = image.url;
    document.getElementById('attachmentPreviewPrevious').disabled = previewImages.length < 2;
    document.getElementById('attachmentPreviewNext').disabled = previewImages.length < 2;
    document.getElementById('attachmentPreviewLoading').classList.remove('hidden');
    document.getElementById('attachmentPreviewError').classList.add('hidden');
    content.classList.add('is-loading');
    content.src = image.url;
    document.querySelectorAll('#attachmentPreviewStrip button').forEach(function (button, index) {
      button.classList.toggle('active', index === previewIndex);
    });
  }

  function renderStrip() {
    var strip = document.getElementById('attachmentPreviewStrip');
    strip.classList.toggle('hidden', previewImages.length < 2);
    strip.innerHTML = previewImages.map(function (image, index) {
      return '<button type="button" data-attachment-strip-index="' + index + '" aria-label="查看第 ' + (index + 1) + ' 张图片"><img src="' + esc(image.url) + '" alt=""></button>';
    }).join('');
    strip.querySelectorAll('button').forEach(function (button) {
      button.onclick = function () { previewIndex = Number(button.dataset.attachmentStripIndex); renderPreview(); };
    });
  }

  function openPreview(index) {
    ensureModal();
    if (!previewImages.length) return;
    previewIndex = Math.max(0, Math.min(Number(index) || 0, previewImages.length - 1));
    renderStrip();
    renderPreview();
    document.getElementById('attachmentPreviewModal').classList.remove('hidden');
    document.body.classList.add('drawer-open');
  }

  function movePreview(step) {
    if (previewImages.length < 2) return;
    previewIndex = (previewIndex + step + previewImages.length) % previewImages.length;
    renderPreview();
  }

  function closePreview() {
    var modal = document.getElementById('attachmentPreviewModal');
    if (!modal || modal.classList.contains('hidden')) return;
    modal.classList.add('hidden');
    document.getElementById('attachmentPreviewContent').src = '';
    document.body.classList.remove('drawer-open');
  }

  window.PatchworkAttachments = { render: render, openPreview: openPreview };
})();
