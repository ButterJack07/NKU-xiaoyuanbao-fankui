const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parseHTML } = require(process.env.DOM_MODULE || 'linkedom');
const source=fs.readFileSync(path.join(__dirname,'../js/page-bootstrap.js'),'utf8');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
async function scenario(mode){
  const {document,window}=parseHTML('<html><head></head><body><h1>页面内容</h1><script data-page-script="js/config.js"></script><script data-page-script="js/auth.js"></script><script data-page-script="js/workspace-nav.js"></script></body></html>');
  const timers=new Map(),urls=[],exec=[];let id=0;
  delete window.supabase;
  window.setTimeout=(fn,ms)=>{timers.set(++id,{fn,ms});return id;};window.clearTimeout=id=>timers.delete(id);
  window.PATCHWORK_READY=Promise.resolve();
  const append=document.head.appendChild.bind(document.head);
  document.head.appendChild=node=>{
    append(node);urls.push(node.src);
    queueMicrotask(()=>{
      if(node.src.includes('jsdelivr')){if(mode==='timeout')return;node.onerror();return;}
      if(node.src.includes('unpkg')){if(mode==='both-fail'){node.onerror();return;}window.supabase={createClient(){}};}
      else exec.push(node.src);
      node.onload();
    });return node;
  };
  vm.runInNewContext(source,{window,document,console:{error(){}},Array,Promise});await flush();
  if(mode==='timeout'){const timer=Array.from(timers.values()).find(t=>t.ms===8000);assert.ok(timer);timer.fn();await flush();}
  assert.equal(document.querySelector('h1').textContent,'页面内容');
  if(mode==='both-fail'){assert.match(document.getElementById('pageLoadNotice').textContent,/页面初始化失败/);assert.ok(document.querySelector('#pageLoadNotice button'));assert.equal(exec.length,0);}
  else{assert.deepEqual(exec,['js/config.js','js/auth.js','js/workspace-nav.js']);assert.equal(document.getElementById('pageLoadNotice').hidden,true);}
  assert.ok(urls.some(url=>url.includes('unpkg')));
}
(async()=>{await scenario('fallback');await scenario('timeout');await scenario('both-fail');console.log('PASS: SDK failure/timeout fallback, ordered page initialization, visible retry on complete outage');})().catch(error=>{console.error(error);process.exitCode=1;});
