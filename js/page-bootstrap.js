(function () {
  'use strict';
  var sdkUrls = ['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2', 'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js'];
  var running = false, failedScript = null, completed = [];
  var panel = document.createElement('aside');
  panel.id = 'pageLoadNotice';
  panel.setAttribute('role', 'status');
  panel.style.cssText = 'position:fixed;z-index:10000;left:16px;right:16px;bottom:16px;padding:16px;background:#fff8e8;color:#30291e;border:1px solid #d7c7a5;border-radius:10px;font:14px/1.6 sans-serif;box-shadow:0 4px 24px #0002;';
  document.body.appendChild(panel);
  function notice(message, retry) {
    panel.hidden = false; panel.textContent = message;
    if (retry) { var button = document.createElement('button'); button.type = 'button'; button.textContent = '重新加载'; button.style.cssText = 'margin-left:12px;padding:5px 12px;cursor:pointer'; button.onclick = function () { window.location.reload(); }; panel.appendChild(button); }
  }
  function loadScript(src, timeout, validate) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script'), settled = false;
      function onRuntimeError(event) {
        if (event.filename && event.filename.split('?')[0].endsWith(src.split('?')[0])) finish(new Error(event.message || '脚本执行失败：' + src));
      }
      window.addEventListener('error', onRuntimeError);
      var timer = window.setTimeout(function () { finish(new Error('加载超时：' + src)); }, timeout);
      function finish(error) {
        if (settled) return; settled = true; window.clearTimeout(timer);
        script.onload = script.onerror = null;
        window.removeEventListener('error', onRuntimeError);
        if (error) { script.remove(); reject(error); } else resolve();
      }
      script.src = src; script.async = true;
      script.onload = function () { finish(validate && !validate() ? new Error('组件初始化失败：' + src) : null); };
      script.onerror = function () { finish(new Error('无法加载：' + src)); };
      document.head.appendChild(script);
    });
  }
  function sdkReady() { return Boolean(window.supabase && window.supabase.createClient); }
  async function start() {
    if (running) return; running = true;
    notice('正在连接登录组件；页面内容已可显示，请稍候…');
    try {
      if (!sdkReady()) {
        for (var i = 0; i < sdkUrls.length; i += 1) {
          try { await loadScript(sdkUrls[i], 8000, sdkReady); break; }
          catch (error) { if (i === sdkUrls.length - 1) throw error; notice('主线路连接失败，正在尝试备用线路…'); }
        }
      }
      var scripts = Array.from(document.querySelectorAll('script[data-page-script]'));
      for (var j = 0; j < scripts.length; j += 1) {
        var src = scripts[j].getAttribute('data-page-script');
        if (completed.indexOf(src) !== -1) continue;
        failedScript = src;
        await loadScript(src, 12000);
        completed.push(src);
        if (/js\/auth\.js/.test(src) && window.PATCHWORK_READY) window.PATCHWORK_READY.catch(function () {});
      }
      failedScript = null;
      window.dispatchEvent(new window.Event('patchwork:page-ready'));
      if (window.PATCHWORK_READY) {
        notice('正在验证登录状态…');
        var authTimer = window.setTimeout(function () { notice('登录验证耗时较长，请检查网络连接后重新加载。', true); }, 15000);
        try { await window.PATCHWORK_READY; } finally { window.clearTimeout(authTimer); }
      }
      panel.hidden = true;
    } catch (error) {
      console.error('[页面初始化]', failedScript || 'Supabase SDK', error);
      notice('页面初始化失败：' + (error.message || '网络连接异常') + '。请检查网络后重新加载。', true);
    } finally { running = false; }
  }
  start();
})();
