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

  window.PATCHWORK_READY = client.auth.getSession().then(function (result) {
    var session = result.data && result.data.session;
    window.PATCHWORK_AUTH_TOKEN = session ? session.access_token : '';
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
      return client.auth.signInWithPassword({ email: email, password: password });
    },
    signOut: function () { return client.auth.signOut(); }
  };
})();
