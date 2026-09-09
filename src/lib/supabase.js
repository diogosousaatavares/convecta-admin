import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente Supabase em falta. Verifica o .env.local')
}

export const CHAVE_SESSAO = 'convecta-admin-auth'
const CHAVE_LEMBRAR = 'convecta-admin-lembrar'

// "Manter sessão iniciada" decide onde a sessão fica guardada: no
// localStorage, que sobrevive a fechar o browser, ou no sessionStorage, que
// morre com o separador. Tem de ser decidido aqui, ao criar o cliente.
export const sessaoPersistente = (() => {
  try { return localStorage.getItem(CHAVE_LEMBRAR) !== 'nao' } catch { return true }
})()

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: CHAVE_SESSAO,
    storage: sessaoPersistente ? window.localStorage : window.sessionStorage,
  }
})

/** Grava a preferência e muda a sessão de sítio. Obriga a recarregar depois. */
export function aplicarPreferenciaSessao(lembrar) {
  try {
    localStorage.setItem(CHAVE_LEMBRAR, lembrar ? 'sim' : 'nao')
    const de   = lembrar ? window.sessionStorage : window.localStorage
    const para = lembrar ? window.localStorage   : window.sessionStorage
    const v = de.getItem(CHAVE_SESSAO)
    if (v !== null) { para.setItem(CHAVE_SESSAO, v); de.removeItem(CHAVE_SESSAO) }
  } catch { /* modo privado: fica como estiver */ }
}
