import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { status: 200, headers: cors });
  try {
    const body = await request.json();
    const identity = String(body.identity || '').trim();
    if (!identity || identity.length > 40) throw new Error('请输入账号或姓名。');
    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(url, serviceKey);
    const { data: usernameRows, error: usernameError } = await adminClient.from('profiles').select('username,full_name').eq('active', true).eq('username', identity);
    if (!usernameError && usernameRows && usernameRows.length === 1) {
      return new Response(JSON.stringify({ email: usernameRows[0].username.toLowerCase() + '@' + (Deno.env.get('AUTH_EMAIL_DOMAIN') || 'team.xiaoyuanbao.internal') }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
    }
    const { data: nameRows, error: nameError } = await adminClient.from('profiles').select('username,full_name').eq('active', true).eq('full_name', identity);
    if (nameError || !nameRows || nameRows.length !== 1) throw new Error(nameRows && nameRows.length > 1 ? '姓名重复，请使用账号登录。' : '姓名不存在，请检查姓名或使用账号登录。');
    return new Response(JSON.stringify({ email: nameRows[0].username.toLowerCase() + '@' + (Deno.env.get('AUTH_EMAIL_DOMAIN') || 'team.xiaoyuanbao.internal') }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : '无法识别登录账号。' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
