(function () {
  'use strict';

  window.PATCHWORK_CONFIG = {
    supabaseUrl: 'https://gujqnegsqghxbivlhrce.supabase.co',
    supabaseAnonKey: 'sb_publishable_xBjHJaEbGCAEGUweIhbgdw_ttEIka0r',
    tableName: 'bug_reports',
    storageBucket: 'bug-attachments',
    testCaseStorageBucket: 'test-case-files',
    authEmailDomain: 'team.xiaoyuanbao.internal',
    version: '1.5.2'
  };
  window.PatchworkRoles = {
    productLead: function (p) { return Boolean(p && p.active !== false && p.is_product_lead && (p.department === '产品' || p.role === 'admin')); },
    productDeputy: function (p) { return Boolean(p && p.active !== false && p.department === '产品' && p.is_product_deputy && !p.is_product_lead); },
    productWorkspace: function (p) { return this.productLead(p) || this.productDeputy(p); }
  };
})();
