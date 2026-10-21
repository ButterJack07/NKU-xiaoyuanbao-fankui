(function () {
  'use strict';

  var STORAGE_PREFIX = 'patchwork:table-widths:v1:';
  var MIN_WIDTH = 36;
  var MAX_MIN_WIDTH = 64;
  var initialized = new WeakSet();
  var observed = new WeakSet();
  var pending = [];
  var observer = null;
  var widthObserver = null;
  var visibilityObserver = null;
  var visibilityWatchReady = false;
  var attemptScheduled = false;

  function pageName() {
    return (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  }

  function tableIndex(table) {
    return Array.prototype.indexOf.call(document.querySelectorAll('table'), table);
  }

  function visibleHeaders(table) {
    if (!table.tHead || !table.tHead.rows.length) return [];
    return Array.prototype.filter.call(table.tHead.rows[0].cells, function (th) {
      return window.getComputedStyle(th).display !== 'none' && th.getBoundingClientRect().width > 0;
    });
  }

  function headerLabel(th) {
    return (th.textContent || '').replace(/\s+/g, ' ').trim() || 'column';
  }

  function storageKey(table, headers) {
    var id = table.id || ('table-' + tableIndex(table));
    var labels = headers.map(headerLabel).join('|');
    return STORAGE_PREFIX + pageName() + ':' + id + ':' + labels;
  }

  function normalizeRatios(values, length) {
    if (!Array.isArray(values) || values.length !== length) return null;
    var total = 0;
    for (var index = 0; index < values.length; index += 1) {
      var value = Number(values[index]);
      if (!isFinite(value) || value <= 0) return null;
      total += value;
    }
    if (total <= 0) return null;
    return values.map(function (value) { return Number(value) / total; });
  }

  function loadRatios(key, headers) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? normalizeRatios(JSON.parse(raw), headers.length) : null;
    } catch (error) {
      return null;
    }
  }

  function saveRatios(key, ratios) {
    try {
      window.localStorage.setItem(key, JSON.stringify(ratios));
    } catch (error) {
      return;
    }
  }

  function clearRatios(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      return;
    }
  }

  function applyRatios(table, meta, ratios, keepPreferred) {
    if (!keepPreferred) meta.preferred = ratios.slice();
    var tableWidth = table.getBoundingClientRect().width;
    if (!tableWidth) return;
    var constrained = ratios.map(function (ratio, index) {
      return Math.max(ratio * tableWidth, meta.minWidths[index]);
    });
    var total = constrained.reduce(function (sum, width) { return sum + width; }, 0);
    var excess = total - tableWidth;
    if (excess > 0) {
      var shrinkable = constrained.map(function (width, index) {
        return width - meta.minWidths[index];
      });
      var totalShrinkable = shrinkable.reduce(function (sum, width) { return sum + width; }, 0);
      var factor = totalShrinkable > 0 ? Math.max(0, (totalShrinkable - excess) / totalShrinkable) : 1;
      constrained = constrained.map(function (width, index) {
        return meta.minWidths[index] + shrinkable[index] * factor;
      });
      total = constrained.reduce(function (sum, width) { return sum + width; }, 0);
    }
    if (!total) return;
    meta.current = constrained.map(function (width) { return width / total; });
    meta.headers.forEach(function (th, index) {
      th.style.width = (meta.current[index] * 100).toFixed(4) + '%';
    });
  }

  function minimumWidths(headers) {
    return headers.map(function (th) {
      var width = th.getBoundingClientRect().width;
      return Math.max(MIN_WIDTH, Math.min(MAX_MIN_WIDTH, width));
    });
  }

  function resetTable(meta) {
    clearRatios(meta.key);
    applyRatios(meta.table, meta, meta.defaults.slice());
  }

  function startResize(event, meta, index) {
    if (event.button !== 0) return;
    var left = meta.headers[index];
    var right = meta.headers[index + 1];
    if (!left || !right) return;

    event.preventDefault();
    event.stopPropagation();

    var leftWidth = left.getBoundingClientRect().width;
    var rightWidth = right.getBoundingClientRect().width;
    var pairWidth = leftWidth + rightWidth;
    var tableWidth = meta.table.getBoundingClientRect().width;
    if (!tableWidth || !pairWidth) return;

    var baseRatios = meta.headers.map(function (th) {
      return th.getBoundingClientRect().width / tableWidth;
    });
    var leftMin = meta.minWidths[index] || MIN_WIDTH;
    var rightMin = meta.minWidths[index + 1] || MIN_WIDTH;
    var maxLeft = pairWidth - rightMin;
    if (maxLeft <= leftMin) return;

    var startX = event.clientX;
    var pointerId = event.pointerId;
    var body = document.body;

    function onMove(moveEvent) {
      if (pointerId !== undefined && moveEvent.pointerId !== pointerId) return;
      if (moveEvent.cancelable) moveEvent.preventDefault();
      var newLeft = Math.max(leftMin, Math.min(maxLeft, leftWidth + moveEvent.clientX - startX));
      var ratios = baseRatios.slice();
      ratios[index] = newLeft / tableWidth;
      ratios[index + 1] = (pairWidth - newLeft) / tableWidth;
      applyRatios(meta.table, meta, ratios);
    }

    function cleanup() {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      body.classList.remove('table-col-resizing');
      meta.table.classList.remove('table-col-resizing');
    }

    function onUp(upEvent) {
      if (pointerId !== undefined && upEvent.pointerId !== pointerId) return;
      saveRatios(meta.key, meta.preferred);
      cleanup();
    }

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    body.classList.add('table-col-resizing');
    meta.table.classList.add('table-col-resizing');
  }

  function addHandle(meta, index) {
    var th = meta.headers[index];
    var handle = document.createElement('span');
    handle.className = 'table-col-resizer';
    handle.setAttribute('aria-hidden', 'true');
    handle.title = '拖动调整列宽，双击恢复默认';
    handle.addEventListener('click', function (event) { event.stopPropagation(); });
    handle.addEventListener('dblclick', function (event) {
      event.preventDefault();
      event.stopPropagation();
      resetTable(meta);
    });
    handle.addEventListener('pointerdown', function (event) {
      startResize(event, meta, index);
    });
    th.appendChild(handle);
  }

  function initTable(table) {
    if (initialized.has(table)) return true;
    if (!table.tHead || !table.tHead.rows.length) return false;
    if (table.getBoundingClientRect().width < 32) return false;

    var headers = visibleHeaders(table);
    if (headers.length < 2) return false;

    var widths = headers.map(function (th) { return th.getBoundingClientRect().width; });
    var total = widths.reduce(function (sum, width) { return sum + width; }, 0);
    if (!total) return false;

    var naturalRatios = widths.map(function (width) { return width / total; });
    var key = storageKey(table, headers);
    var ratios = loadRatios(key, headers) || naturalRatios.slice();
    var meta = {
      table: table,
      headers: headers,
      key: key,
      defaults: naturalRatios,
      minWidths: minimumWidths(headers),
      preferred: ratios.slice(),
      current: ratios.slice()
    };

    table.__tableResize = meta;
    table.classList.add('table-resizable');
    meta.headers.forEach(function (th) {
      th.style.minWidth = '';
    });
    headers.forEach(function (th, index) {
      if (index < headers.length - 1) addHandle(meta, index);
    });
    applyRatios(table, meta, ratios);
    watchTableWidth(meta);
    initialized.add(table);
    return true;
  }

  function watchTableWidth(meta) {
    if (typeof window.ResizeObserver === 'undefined') return;
    if (!widthObserver) {
      widthObserver = new window.ResizeObserver(function (entries) {
        entries.forEach(function (entry) {
          var tableMeta = entry.target.__tableResize;
          if (tableMeta && entry.target.getBoundingClientRect().width > 0) {
            applyRatios(entry.target, tableMeta, tableMeta.preferred, true);
          }
        });
      });
    }
    widthObserver.observe(meta.table);
  }

  function attemptPending() {
    pending = pending.filter(function (table) { return !initTable(table); });
  }

  function scheduleAttempt() {
    if (attemptScheduled) return;
    attemptScheduled = true;
    window.setTimeout(function () {
      attemptScheduled = false;
      attemptPending();
    }, 0);
  }

  function watchVisibility() {
    if (visibilityWatchReady) return;
    visibilityWatchReady = true;
    if (typeof window.MutationObserver !== 'undefined') {
      visibilityObserver = new window.MutationObserver(scheduleAttempt);
      visibilityObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['class', 'style', 'hidden'],
        subtree: true
      });
    }
    window.addEventListener('resize', scheduleAttempt);
    window.addEventListener('load', scheduleAttempt);
  }

  function watchSize(table) {
    if (typeof window.ResizeObserver === 'undefined' || observed.has(table)) return;
    if (!observer) {
      observer = new window.ResizeObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.target.getBoundingClientRect().width < 32) return;
          observer.unobserve(entry.target);
          observed.delete(entry.target);
          if (initTable(entry.target)) {
            pending = pending.filter(function (table) { return table !== entry.target; });
          }
        });
      });
    }
    observed.add(table);
    observer.observe(table);
  }

  function watchTable(table) {
    if (initTable(table)) return;
    if (!table.tHead || !table.tHead.rows.length || table.tHead.rows[0].cells.length < 2) return;
    if (pending.indexOf(table) === -1) pending.push(table);
    watchVisibility();
    watchSize(table);
  }

  function initAll() {
    Array.prototype.forEach.call(document.querySelectorAll('table'), watchTable);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
