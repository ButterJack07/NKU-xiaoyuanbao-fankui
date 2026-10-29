const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');

test('缓存角色不能在登录资料确认前触发权限跳转', () => {
  const source = fs.readFileSync(path.join(root,'js/workspace-nav.js'),'utf8');
  const sync = source.slice(source.indexOf('  function syncProfile('),source.indexOf('\n  renderNavigation();'));
  const redirects = [];
  const node = () => ({classList:{toggle(){}},dataset:{},setAttribute(){},removeAttribute(){}});
  const window = {PATCHWORK_PROFILE:{id:'one',username:'member',department:'产品',role:'member'},location:{search:'?source=product',pathname:'/bug-reports.html',replace:url=>redirects.push(url)}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'js/config.js'),'utf8'),{window});
  const context = vm.createContext({window,URLSearchParams,document:{getElementById:node,querySelectorAll:()=>[]},topbar:{querySelector:node},canAccessDepartment:(p,d)=>p.department===d});
  vm.runInContext(sync+';syncProfile();',context);
  assert.equal(redirects.length,0);
  window.PATCHWORK_PROFILE.is_product_lead=true;
  vm.runInContext('syncProfile(true);',context);
  assert.equal(redirects.length,0);
  window.PATCHWORK_PROFILE.is_product_lead=false;
  vm.runInContext('syncProfile(true);',context);
  assert.equal(redirects.length,1);
});

test('页面本地链接及脚本、样式路径均存在', () => {
  for (const file of fs.readdirSync(root).filter(f=>f.endsWith('.html'))) {
    for (const match of fs.readFileSync(path.join(root,file),'utf8').matchAll(/(?:href|src|data-page-script)="([^"]+)"/g)) {
      const target = match[1].split(/[?#]/)[0];
      if (!target || /^(https?:|data:|mailto:|tel:|javascript:)/.test(target)) continue;
      assert.ok(fs.existsSync(path.join(root,decodeURIComponent(target))),file+' -> '+target);
    }
  }
});

test('业务页面采用非阻塞加载并保留按依赖顺序的公共脚本', () => {
  for (const file of fs.readdirSync(root).filter(f=>f.endsWith('.html')&&f!=='login.html')) {
    const html=fs.readFileSync(path.join(root,file),'utf8');
    assert.ok(html.includes('src="js/page-bootstrap.js" defer'),file);
    assert.ok(!html.includes('<script src="https://cdn.jsdelivr.net/npm/@supabase'),file);
    const scripts=Array.from(html.matchAll(/data-page-script="([^"]+)"/g)).map(m=>m[1].split('?')[0]);
    assert.deepEqual(scripts.slice(0,4),['js/config.js','js/auth.js','js/workspace-nav.js','js/api.js'],file);
  }
});
