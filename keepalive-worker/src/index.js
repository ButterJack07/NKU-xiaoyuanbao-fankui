const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json'
};

async function pingSupabase(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY secret');
  }

  const endpoint = `${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/healthcheck?select=id&limit=1`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error(`Supabase healthcheck returned HTTP ${response.status}`);
  }

  return { ok: true, checkedAt: new Date().toISOString() };
}

export default {
  async scheduled(_event, env, _ctx) {
    try {
      console.log(JSON.stringify(await pingSupabase(env)));
    } catch (error) {
      console.error(`Supabase keepalive failed: ${error.message}`);
      throw error;
    }
  },

  async fetch(request, env) {
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'GET only' }), { status: 405, headers: corsHeaders });
    }

    try {
      return new Response(JSON.stringify(await pingSupabase(env)), { status: 200, headers: corsHeaders });
    } catch (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 503, headers: corsHeaders });
    }
  }
};
