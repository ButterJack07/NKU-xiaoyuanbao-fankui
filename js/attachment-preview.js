(function () {
  'use strict';
  var IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'avif', 'svg'];

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

  function render(urls, options) {
    options = options || {};
    urls = Array.isArray(urls) ? urls.filter(Boolean) : [];
    if (!urls.length) return '无附件';
    var fileIndex = 0;
    var images = [];
    var files = [];
    urls.forEach(function (url, index) {
      var name = fileName(url, index);
      if (isImage(url)) {
        images.push('<a class="attachment-thumbnail" href="' + esc(url) + '" target="_blank" rel="noopener" aria-label="打开原图 ' + esc(name) + '"><span class="thumbnail-image-wrap"><img src="' + esc(url) + '" alt="' + esc(name) + '" loading="lazy"><i>图片无法加载</i></span><span><strong>' + esc(name) + '</strong><small>点击打开原图</small></span></a>');
      } else {
        var filename = options.code ? options.code + '-' + String(fileIndex + 1).padStart(2, '0') + extension(url) : name;
        files.push('<a class="detail-attachment-download" href="' + esc(url) + '" download="' + esc(filename) + '" target="_blank" rel="noopener">下载附件 ' + String(fileIndex + 1).padStart(2, '0') + '</a>');
        fileIndex += 1;
      }
    });
    return (images.length ? '<div class="attachment-gallery">' + images.join('') + '</div>' : '') + (files.length ? '<span class="detail-attachment-links">' + files.join('') + '</span>' : '');
  }

  document.addEventListener('error', function (event) {
    var image = event.target;
    if (image && image.tagName === 'IMG' && image.closest('.attachment-thumbnail')) image.closest('.attachment-thumbnail').classList.add('image-load-failed');
  }, true);

  window.PatchworkAttachments = { render: render };
})();
