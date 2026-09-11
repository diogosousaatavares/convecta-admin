// authService.js — Fase 4: autenticação via Supabase Auth
import { supabase } from '@/lib/supabase';
import dataService from './dataService';

const listeners = new Set();
function notify() { listeners.forEach(fn => fn()); }

let _session = null;
let _authLoading = true; // true até Supabase confirmar estado de auth

async function _enrichSession(user) {
  const { data: userRow } = await supabase
    .from('users')
    .select('role, business_id, name')
    .eq('id', user.id)
    .maybeSingle();

  _session = {
    id: user.id,
    email: user.email,
    name: userRow?.name || user.email,
    role: userRow?.role || 'admin',
    type: 'admin',
    businessId: userRow?.business_id,
  };
}

// Supabase dispara INITIAL_SESSION no arranque (e LOGIN/LOGOUT depois)
supabase.auth.onAuthStateChange(async (_event, session) => {
  if (session?.user) {
    await _enrichSession(session.user);
  } else {
    _session = null;
  }
  _authLoading = false;
  notify();
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
