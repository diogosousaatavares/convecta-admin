/*
 * REGISTO DE ERROS (19/10/2026) — quando algo rebenta, cai na base de dados,
 * em vez de ficar só no telemóvel de quem o viu. Vê-se em Super Admin ›
 * Definições › Erros.
 *
 * Três fontes: erros soltos (window.onerror), promessas falhadas
 * (unhandledrejection) e os crashes do React (a Blindagem chama registarErro).
 *
 * Regras para não encher a tabela nem gastar pedidos à toa:
 *  · o mesmo erro só vai uma vez a cada 30s (daqui), e no servidor junta-se
 *    aos iguais (uma linha, um contador);
 *  · ruído conhecido do browser (ResizeObserver, «Script error.») não conta;
 *  · o próprio registo nunca pode rebentar — tudo em try/catch silencioso.
 */
import { supabase } from '@/lib/supabase';

let APP = '?';
let versao = '';
try { versao = String(import.meta.env?.VITE_COMMIT || import.meta.env?.VITE_VERSAO || '').slice(0, 12); } catch { /* sem env */ }

const RUIDO = /ResizeObserver loop|^Script error\.?$|Load failed$|Importing a module script failed|Failed to fetch dynamically|valid JavaScript MIME type/i;
const ultimas = new Map();
function cedoDemais(chave) {
  const agora = Date.now();
  const antes = ultimas.get(chave) || 0;
  if (agora - antes < 30000) return true;
  ultimas.set(chave, agora);
  if (ultimas.size > 200) ultimas.clear();
  return false;
}

function contexto() {
  try { return window.__convectaErroCtx || {}; } catch { return {}; }
}

export function definirContextoErro(ctx) {
  try { window.__convectaErroCtx = ctx || {}; } catch { /* nada */ }
}

export function registarErro(mensagem, stack) {
  try {
    const msg = String(mensagem || '').trim().slice(0, 500);
    if (!msg || RUIDO.test(msg)) return;
    if (cedoDemais(msg.slice(0, 120))) return;
    const c = contexto();
    supabase.rpc('registar_erro', {
      p_app: APP,
      p_mensagem: msg,
      p_stack: String(stack || '').slice(0, 4000),
      p_url: (location.pathname + location.search).slice(0, 500),
      p_user_agent: navigator.userAgent,
      p_business_id: c.businessId || null,
      p_papel: c.papel || null,
      p_versao: versao || null,
    }).then(() => {}, () => {});
  } catch { /* o registo de erros nunca rebenta */ }
}

export function iniciarRegistoErros(app) {
  APP = app || '?';
  window.addEventListener('error', (e) => {
    if (e && e.message) registarErro(e.message, e.error?.stack || `${e.filename || ''}:${e.lineno || ''}`);
  });
  window.addEventListener('unhandledrejection', (e) => {
    const r = e && e.reason;
    if (r) registarErro(r.message || String(r), r.stack);
  });
}
