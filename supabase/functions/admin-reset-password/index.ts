import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { status: 200, headers: cors });
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) throw new Error('缺少登录凭据。');
    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const caller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: callerData } = await caller.auth.getUser();
    if (!callerData.user) throw new Error('登录状态无效。');
    const admin = createClient(url, serviceKey);
    const { data: profile } = await admin.from('profiles').select('role,active').eq('id', callerData.user.id).single();
    if (!profile || profile.role !== 'admin' || !profile.active) throw new Error('只有超级管理员可以重置密码。');
    const body = await request.json();
    const { data: target, error: targetError } = await admin.from('profiles').select('id,employee_no').eq('id', body.user_id).single();
    if (targetError || !target || !target.employee_no) throw new Error('找不到用户工号。');
    const { error } = await admin.auth.admin.updateUserById(target.id, { password: String(target.employee_no) });
    if (error) throw new Error(error.message);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (error) { return new Response(JSON.stringify({ error: error instanceof Error ? error.message : '密码重置失败。' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }); }
});
