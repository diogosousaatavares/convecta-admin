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

// ── Link de confirmação com o NOSSO domínio ─────────────────────────────────
// O email de confirmação passou a levar um link para este site (com
// ?token_hash=…&type=…) em vez de um link para o endereço técnico do
// Supabase — que parecia suspeito aos filtros de spam e a quem o lia.
// Aqui troca-se esse código pela sessão. A recuperação da palavra-passe
// continua pelo caminho antigo e não passa por aqui.
export const confirmacaoPorLink = (async () => {
  try {
    const p = new URLSearchParams(window.location.search)
    const token_hash = p.get("token_hash")
    const type = p.get("type")
    if (!token_hash || !["email", "signup", "magiclink", "invite", "email_change"].includes(type || "")) return null
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    p.delete("token_hash"); p.delete("type")
    const resto = p.toString()
    window.history.replaceState(null, "", window.location.pathname + (resto ? "?" + resto : "") + window.location.hash)
    if (error) { console.warn("link de confirmação:", error.message); return { erro: error.message } }
    return { ok: true }
  } catch (e) { return { erro: String(e && e.message || e) } }
})()

