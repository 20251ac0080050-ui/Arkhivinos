// =====================================================
// CONEXÃO COM O SUPABASE
// Cole aqui os dados do seu projeto (Supabase > Project Settings > API):
//   - Project URL
//   - anon public key  (NUNCA use a service_role key aqui!)
// =====================================================
const SUPABASE_URL = 'https://sybyibkiwoeyrivjpixm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KWAl-WB5kGuyjpq4tco1ow_yG4Ba6YI';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Retorna o usuário logado (ou null se ninguém estiver logado)
async function usuarioAtual() {
  const { data } = await db.auth.getSession();
  return data.session ? data.session.user : null;
}

// Retorna true se o usuário logado for o administrador
async function ehAdmin() {
  const usuario = await usuarioAtual();
  if (!usuario) return false;

  const { data, error } = await db
    .from('usuarios')
    .select('tipo_conta')
    .eq('id_usuario', usuario.id)
    .maybeSingle();

  if (error || !data || !data.tipo_conta) return false;
  const tipo = data.tipo_conta.trim().toLowerCase();
  return tipo === 'admin' || tipo === 'adm';
}

// Sai da conta e volta para a tela de login
async function sair() {
  await db.auth.signOut();
  window.location.href = 'login.html';
}

// Evita que textos do banco quebrem o HTML da página
function escaparHTML(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
