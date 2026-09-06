(function () {
  'use strict';

  var config = window.PATCHWORK_CONFIG || {};
  var supabase = window.supabase;
  var isLoginPage = /login\.html$/i.test(window.location.pathname);
  var profileStorageKey = 'xiaoyuanbao-profile-cache';

  function readCachedProfile() {
    try { return JSON.parse(localStorage.getItem(profileStorageKey) || 'null'); } catch (error) { localStorage.removeItem(profileStorageKey); return null; }
  }

  function cacheProfile(profile) {
    if (profile) localStorage.setItem(profileStorageKey, JSON.stringify({ id: profile.id, username: profile.username, full_name: profile.full_name, employee_no: profile.employee_no, department: profile.department, role: profile.role, active: profile.active }));
    else localStorage.removeItem(profileStorageKey);
  }

  if (!supabase || !config.supabaseUrl || !config.supabaseAnonKey) {
    window.PATCHWORK_READY = Promise.resolve(null);
    return;
  }

  var client = supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  window.PATCHWORK_SUPABASE = client;
  window.PATCHWORK_AUTH_TOKEN = '';
  window.PATCHWORK_PROFILE = readCachedProfile();

  async function verifyProfile(session) {
    if (!session) return null;
    var result = await client.from('profiles').select('id,username,full_name,employee_no,department,role,active,qq,wechat,phone,contact_time,contact_schedule').eq('id', session.user.id).maybeSingle();
    if (result.error) throw result.error;
    if (!result.data || !result.data.active) {
      window.PATCHWORK_PROFILE = null;
      cacheProfile(null);
      await client.auth.signOut();
      throw new Error('账号尚未登记或已被停用，请联系超级管理员。');
    }
    window.PATCHWORK_PROFILE = result.data;
    cacheProfile(result.data);
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
    if (!session) { window.PATCHWORK_PROFILE = null; cacheProfile(null); }
    if (event === 'SIGNED_OUT' && !isLoginPage) window.location.replace('login.html');
  });

  window.PATCHWORK_AUTH = {
    client: client,
    ready: window.PATCHWORK_READY,
    getSession: function () { return client.auth.getSession(); },
    signIn: async function (username, password) {
      var identity = username.trim();
      var email = identity.toLowerCase() + '@' + config.authEmailDomain;
      if (!/^[A-Za-z0-9_-]{3,40}$/.test(identity)) {
        var resolver = await fetch(config.supabaseUrl.replace(/\/$/, '') + '/functions/v1/resolve-login-identity', {
          method: 'POST',
          headers: { apikey: config.supabaseAnonKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ identity: identity })
        });
        var resolved = await resolver.json().catch(function () { return {}; });
        if (!resolver.ok) return { data: { session: null, user: null }, error: new Error(resolved.error || '姓名不存在或姓名不唯一，请使用账号登录。') };
        email = resolved.email;
      }
      var result = await client.auth.signInWithPassword({ email: email, password: password });
      if (!result.error) {
        try { await verifyProfile(result.data.session); } catch (error) { return { data: { session: null, user: null }, error: error }; }
      }
      return result;
    },
    signOut: function () { return client.auth.signOut(); }
  };
})();
