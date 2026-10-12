import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/*
 * ENTRAR COM GOOGLE OU APPLE (12/10/2026, pedido do Diogo).
 *
 * Os botões só aparecem quando o fornecedor está LIGADO no Supabase
 * (Authentication › Sign In / Providers). Pergunta-se ao próprio Supabase
 * (/auth/v1/settings, público) — assim, no dia em que se liga o Apple, o
 * botão aparece sozinho, sem publicar nada; e nunca há um botão que dá erro.
 */
let _activos = null;
function lerActivos() {
  if (!_activos) {
    _activos = fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
    })
      .then(r => (r.ok ? r.json() : {}))
      .then(d => ({ google: !!d?.external?.google, apple: !!d?.external?.apple }))
      .catch(() => ({ google: false, apple: false }));
  }
  return _activos;
}

/** { google, apple } — true quando está ligado no Supabase. */
export function useEntrarCom() {
  const [activos, setActivos] = useState({ google: false, apple: false });
  useEffect(() => {
    let vivo = true;
    lerActivos().then(a => { if (vivo) setActivos(a); });
    return () => { vivo = false; };
  }, []);
  return activos;
}

/** Vai ao Google/Apple e volta a `voltarPara` (endereço completo) já com sessão. */
export async function entrarCom(provider, voltarPara) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: voltarPara },
  });
  if (error) {
    if (/not enabled|unsupported provider/i.test(error.message)) {
      throw new Error(`Entrar com ${provider === 'apple' ? 'Apple' : 'Google'} ainda não está disponível.`);
    }
    throw new Error(error.message);
  }
}

export const IconeGoogle = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }} aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export const IconeApple = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }} aria-hidden="true" fill="currentColor">
    <path d="M16.37 12.73c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.87-.76-1.47.02-2.83.86-3.59 2.18-1.53 2.66-.39 6.6 1.1 8.75.73 1.05 1.6 2.24 2.73 2.2 1.1-.04 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.22 1.18-2.4 1.2-2.46-.03-.01-2.3-.88-2.32-3.5zM14.2 6.27c.6-.73 1.01-1.75.9-2.77-.87.04-1.92.58-2.54 1.31-.56.65-1.05 1.69-.92 2.69.97.08 1.96-.49 2.56-1.23z"/>
  </svg>
);
