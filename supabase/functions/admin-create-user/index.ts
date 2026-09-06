import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) throw new Error('缺少登录凭据。');
    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const callerClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: callerData, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !callerData.user) throw new Error('登录状态无效。');
    const adminClient = createClient(url, serviceKey);
    const { data: adminProfile, error: profileError } = await adminClient.from('profiles').select('role,active').eq('id', callerData.user.id).single();
    if (profileError || !adminProfile || adminProfile.role !== 'admin' || !adminProfile.active) throw new Error('只有超级管理员可以新增用户。');
    const body = await request.json();
    const username = String(body.username || '').trim();
    const fullName = String(body.full_name || '').trim();
    const employeeNo = String(body.employee_no || '').trim();
    const department = String(body.department || '').trim();
    const password = String(body.password || '');
    if (!/^[A-Za-z0-9_-]{3,40}$/.test(username)) throw new Error('账号只能使用 3-40 位字母、数字、下划线或短横线。');
    if (!fullName || !employeeNo || !['测试', '技术—前端', '技术—后端', '设计', '产品'].includes(department)) throw new Error('请完整填写用户信息。');
    if (password.length < 6) throw new Error('初始密码至少需要 6 位。');
    const email = username.toLowerCase() + '@' + (Deno.env.get('AUTH_EMAIL_DOMAIN') || 'team.xiaoyuanbao.internal');
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({ email, password, email_confirm: true });
    if (createError || !created.user) throw new Error(createError?.message || 'Auth 用户创建失败。');
    const { error: insertError } = await adminClient.from('profiles').insert({ id: created.user.id, username, full_name: fullName, employee_no: employeeNo, department, role: 'member', active: true });
    if (insertError) { await adminClient.auth.admin.deleteUser(created.user.id); throw new Error(insertError.message); }
    return new Response(JSON.stringify({ id: created.user.id, username, role: 'member' }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('admin-create-user failed:', message);
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
