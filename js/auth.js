(function () {
  'use strict';

  var config = window.PATCHWORK_CONFIG || {};
  var supabase = window.supabase;
  var isLoginPage = /login\.html$/i.test(window.location.pathname);

  if (!supabase || !config.supabaseUrl || !config.supabaseAnonKey) {
    window.PATCHWORK_READY = Promise.resolve(null);
    return;
  }

  var client = supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  window.PATCHWORK_SUPABASE = client;
  window.PATCHWORK_AUTH_TOKEN = '';

  async function verifyProfile(session) {
    if (!session) return null;
    var result = await client.from('profiles').select('id,username,full_name,employee_no,department,role,active').eq('id', session.user.id).maybeSingle();
    if (result.error) throw result.error;
    if (!result.data || !result.data.active) {
      await client.auth.signOut();
      throw new Error('账号尚未登记或已被停用，请联系超级管理员。');
    }
    return result.data;
  }

  window.PATCHWORK_READY = client.auth.getSession().then(async function (result) {
    var session = result.data && result.data.session;
    window.PATCHWORK_AUTH_TOKEN = session ? session.access_token : '';
    if (session) await verifyProfile(session);
    if (!session && !isLoginPage) {
      window.location.replace('login.html?next=' + encodeURIComponent(window.location.pathname.split('/').pop()));
    }
    if (session && isLoginPage) window.location.replace('index.html');
    return session;
  });

  client.auth.onAuthStateChange(function (event, session) {
    window.PATCHWORK_AUTH_TOKEN = session ? session.access_token : '';
    if (event === 'SIGNED_OUT' && !isLoginPage) window.location.replace('login.html');
  });

  window.PATCHWORK_AUTH = {
    client: client,
    ready: window.PATCHWORK_READY,
    getSession: function () { return client.auth.getSession(); },
    signIn: async function (username, password) {
      var email = username.trim().toLowerCase() + '@' + config.authEmailDomain;
      var result = await client.auth.signInWithPassword({ email: email, password: password });
      if (!result.error) {
        try { await verifyProfile(result.data.session); } catch (error) { return { data: { session: null, user: null }, error: error }; }
      }
      return result;
    },
    signOut: function () { return client.auth.signOut(); }
  };
})();
