// authService.js — Fase 4: autenticação via Supabase Auth
import { supabase } from '@/lib/supabase';
import dataService from './dataService';

const listeners = new Set();
function notify() { listeners.forEach(fn => fn()); }

let _session = null;
let _authLoading = true; // true até Supabase confirmar estado de auth

// O ultimo motivo pelo qual uma conta valida nao entrou. O ecra de login
// mostra-o em vez de "credenciais invalidas", que seria mentira.
let _motivoSemSessao = '';

async function _linhaDoUtilizador(id) {
  const { data } = await supabase
    .from('users')
    .select('role, business_id, name')
    .eq('id', id)
    .maybeSingle();
  return data;
}

/*
 * A barbearia nasce aqui, na primeira entrada.
 *
 * Quem se regista no site cria so a conta; a barbearia so existe depois de
 * o email estar confirmado e a pessoa entrar. Este e o momento: ha sessao,
 * ha email confirmado, e ainda nao ha linha em `users`. Chama-se a funcao
 * `registar-barbearia`, que le o formulario guardado no registo e cria tudo
 * numa transaccao. E idempotente — chamar duas vezes devolve a mesma.
 *
 * Tem de ser AQUI e nao mais tarde (no dataService.init), porque sem linha
 * em `users` a sessao nunca chega a existir e o painel nunca arranca.
 */
async function _nascerSePreciso(user) {
  const { data, error } = await supabase.functions.invoke('registar-barbearia', { body: {} });
  if (error) {
    let motivo = '';
    try { motivo = (await error.context?.json())?.erro || ''; } catch { motivo = ''; }
    console.error('[auth] registar-barbearia:', motivo || error.message);
    return motivo || 'Não foi possível criar a tua barbearia. Tenta outra vez daqui a um minuto.';
  }
  if (data?.business_id) console.info('[auth] barbearia criada à primeira entrada:', data.slug);
  return '';
}

async function _enrichSession(user) {
  _motivoSemSessao = '';
  let userRow = await _linhaDoUtilizador(user.id);

  // Conta sem barbearia: ou acabou de se registar no site (a barbearia nasce
  // agora), ou e um cliente do site / conta orfa (nao nasce nada e diz-se
  // porque). Antes assumia-se 'admin' e a pessoa entrava num painel vazio a
  // pensar que estava avariado.
  if (!userRow || !userRow.business_id) {
    const motivo = await _nascerSePreciso(user);
    userRow = await _linhaDoUtilizador(user.id);
    if (!userRow || !userRow.business_id) {
      _session = null;
      _motivoSemSessao = motivo || 'Esta conta não tem nenhuma barbearia associada.';
      return;
    }
  }
  _session = {
    id: user.id,
    email: user.email,
    name: userRow.name || user.email,
    role: userRow.role,
    type: 'admin',
    businessId: userRow.business_id,
  };
}

// Supabase dispara INITIAL_SESSION no arranque (e LOGIN/LOGOUT depois)
// Nao se chama o Supabase dentro deste callback (a propria biblioteca avisa:
// pode bloquear-se a si mesma). Sai-se dele primeiro, e so depois se le a
// tabela users. E se e so o token a renovar para a mesma pessoa, nao se
// volta a ler nada: os dados sao os mesmos.
supabase.auth.onAuthStateChange((_event, session) => {
  setTimeout(async () => {
    if (session?.user) {
      if (_session?.id !== session.user.id) await _enrichSession(session.user);
    } else {
      _session = null;
    }
    _authLoading = false;
    notify();
  }, 0);
});

const authService = {
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  async login(email, password) {
    email = (email || '').trim().toLowerCase();

    // 1. Supabase Auth (admin / staff)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data?.user) {
      await _enrichSession(data.user);
      _authLoading = false;
      notify();
      // Entrou no Supabase mas nao ha painel para esta conta: diz-se o
      // motivo em vez de devolver null e deixar o ecra rebentar em `.role`.
      if (!_session) {
        await supabase.auth.signOut();
        throw new Error(_motivoSemSessao || 'Esta conta não tem nenhuma barbearia associada.');
      }
      return _session;
    }

    // 2. Fallback: login de cliente por passwordHash (não admin)
    const customer = await dataService.getCustomerByEmail(email);
    if (!customer || customer.passwordHash !== password) {
      throw new Error('Credenciais inválidas.');
    }
    _session = { type: 'customer', id: customer.id, email: customer.email, name: customer.name, role: 'customer' };
    _authLoading = false;
    notify();
    return _session;
  },

  async register(name, email, phone, password) {
    email = (email || '').trim().toLowerCase();
    const existing = await dataService.getCustomerByEmail(email);
    if (existing) throw new Error('Já existe uma conta com este email.');
    const customer = await dataService.createCustomer({ name, email, phone, passwordHash: password });
    _session = { type: 'customer', id: customer.id, email: customer.email, name: customer.name, role: 'customer' };
    notify();
    return _session;
  },

  async signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/admin' },
    });
    if (error) throw error;
  },

  async logout() {
    if (_session?.type !== 'customer') await supabase.auth.signOut();
    _session = null;
    notify();
  },

  getCurrentUser() { return _session; },
  isAdmin() { return !!_session && _session.type === 'admin'; },
  isCustomer() { return _session?.type === 'customer'; },
  isAuthenticated() { return !!_session; },
  isAuthLoading() { return _authLoading; },
};

export default authService;
