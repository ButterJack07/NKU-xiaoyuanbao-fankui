// DOM_MODULE may point to an external linkedom installation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parseHTML } = require(process.env.DOM_MODULE || 'linkedom');
const root = path.join(__dirname,'..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));
function context(page,profile,search,api) {
  const { document } = parseHTML(read(page));
  document.querySelectorAll('select').forEach(select=>{
    Object.defineProperty(select,'value',{writable:true,configurable:true,value:select.querySelector('option')?.getAttribute('value')||''});
  });
  const location = { search,pathname:'/'+page,href:'',replace(url){this.href=url;} };
  const window = { document,location,PATCHWORK_PROFILE:profile,PATCHWORK_READY:Promise.resolve(),PatchworkAPI:api,confirm:()=>true };
  const ctx = { window,document,location,URLSearchParams,setTimeout:()=>0,console };
  vm.runInNewContext(read('js/config.js'),ctx);
  return ctx;
}
(async()=>{
  const deputy={id:'deputy',department:'技术—后端',role:'member',is_product_deputy:true};
  const bug={id:'request',submitter_id:'deputy',request_type:'product_change',status:'rejected',title:'已驳回需求',assignee_department:'技术—前端',attachment_urls:[],department_progress:{'技术—前端':{status:'open'}}};
  let deleted='',patch;
  const api={listBugs:async()=>[bug],listProfiles:async()=>[],reportCode:()=> 'PRO-0001',departmentState:(b,d)=>b.department_progress[d]||{},deleteBug:async id=>{deleted=id;return [{id}];},updateBug:async(id,p)=>{patch=p;return [{...bug,...p}];}};
  const ctx=context('product-change-detail.html',deputy,'?bug=request',api);
  vm.runInNewContext(read('js/product-change-detail.js'),ctx);
  await flush();
  const doc=ctx.document;
  assert.equal(doc.getElementById('requestEditAction').classList.contains('hidden'),false);
  assert.equal(doc.getElementById('editProductRequest').textContent,'修改并重新提交');
  assert.equal(doc.getElementById('deleteProductRequest').classList.contains('hidden'),false);
  const form=doc.getElementById('editProductRequestForm');
  // linkedom does not expose HTMLFormControlsCollection.
  form.elements=Object.fromEntries(Array.from(form.querySelectorAll('[name]')).map(n=>[n.name,n]));
  for(const n of Object.values(form.elements))n.value=n.name==='desired_date'?'2026-11-01':'修改后的内容';
  form.dispatchEvent(new doc.defaultView.Event('submit',{cancelable:true}));
  await flush();
  assert.equal(patch.status,'pending_review_1');
  assert.equal(patch.title,'修改后的内容');
  assert.equal(doc.getElementById('deleteProductRequest').classList.contains('hidden'),true);
  const deleting=context('product-change-detail.html',deputy,'?bug=request',api);
  vm.runInNewContext(read('js/product-change-detail.js'),deleting);await flush();
  await deleting.document.getElementById('deleteProductRequest').onclick();
  assert.equal(deleted,'request');
  assert.equal(deleting.location.href,'product-change-requests.html');
  for(const [profile,visible] of [[deputy,true],[{...deputy,is_product_deputy:false,is_product_lead:true},true],[{id:'ordinary',department:'产品',role:'member'},false],[{id:'admin',department:'管理',role:'admin'},false]]){
    const ctx=context('department-bugs.html',profile,'?department=产品',{listBugs:async()=>[],listProfiles:async()=>[]});
    vm.runInNewContext(read('js/bug-reports.js'),ctx);await flush();
    assert.equal(!ctx.document.getElementById('productUploadBug').classList.contains('hidden'),visible);
    assert.equal(Boolean(ctx.document.getElementById('productSubmittedBugs')),visible);
    if(visible){ctx.document.getElementById('productSubmittedBugs').onclick();assert.equal(ctx.location.href,'bug-reports.html?source=product');}
  }
  const submittedBugs=[
    {id:'pending',title:'产品待二审',submission_source:'product',status:'pending_review_2',submitter_id:'another',assignee_department:'设计'},
    {id:'rejected',title:'产品已驳回',submission_source:'product',status:'rejected',assignee_department:'技术—后端'},
    {id:'test',title:'测试上传',submission_source:'test',status:'open',assignee_department:'产品'},
    {id:'request',title:'修改需求',request_type:'product_change',submission_source:'product_change',status:'open',assignee_department:'产品'}
  ];
  const submitted=context('bug-reports.html',deputy,'?source=product',{listBugs:async()=>submittedBugs,listProfiles:async()=>[],departmentView:b=>b,reportCode:b=>b.id});
  vm.runInNewContext(read('js/bug-reports.js'),submitted);await flush();
  const table=submitted.document.getElementById('bugReportList').innerHTML;
  assert.match(table,/产品待二审/);assert.match(table,/产品已驳回/);assert.doesNotMatch(table,/测试上传|修改需求/);
  const dashboard=context('data-dashboard.html',deputy,'',{listBugs:async()=>[{...bug,status:'open'}],departmentState:()=>({status:'open'}),reportCode:()=> 'PRO-0001'});
  vm.runInNewContext(read('js/data-dashboard.js'),dashboard);await flush();
  assert.match(dashboard.document.getElementById('overviewRows').innerHTML,/<small>产品<\/small>/);
  assert.doesNotMatch(dashboard.document.getElementById('overviewRows').innerHTML,/产品修改需求/);
  const home=parseHTML(read('index.html')).document;
  assert.equal(home.querySelector('#productLeadServices a[href="submit-bug.html?source=product"]'),null);
  console.log('PASS: rejected request operations, product list entry and source filtering, dashboard short label');
})().catch(error=>{console.error(error);process.exitCode=1;});
