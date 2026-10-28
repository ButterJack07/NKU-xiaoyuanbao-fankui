const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const window = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/config.js'),'utf8'),{window});
const roles = window.PatchworkRoles;

test('产品身份独立于所属部门且停用后不获得产品权限', () => {
  for (const department of ['测试','技术—前端','技术—后端','设计','产品','管理']) {
    const member = { department, role:'member', active:true };
    assert.equal(roles.productWorkspace(member),false);
    const lead = { ...member,is_product_lead:true };
    const deputy = { ...member,is_product_deputy:true };
    assert.equal(roles.productLead(lead),true);
    assert.equal(roles.productWorkspace(lead),true);
    assert.equal(roles.productDeputy(deputy),true);
    assert.equal(roles.productWorkspace(deputy),true);
    assert.equal(roles.productWorkspace({...lead,active:false}),false);
    assert.equal(roles.productWorkspace({...deputy,active:false}),false);
  }
});
