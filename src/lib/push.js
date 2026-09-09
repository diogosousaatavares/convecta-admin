// push.js — pedir, guardar e apagar a inscrição para notificações.
//
// O que é preciso saber antes de mexer aqui:
//
// • No iPhone, o push SÓ funciona se o site tiver sido adicionado ao ecrã
//   principal. Num separador normal do Safari não existe, e não há nada a
//   fazer quanto a isso — é uma decisão da Apple. Por isso o convite para
//   guardar no ecrã principal deixou de ser um extra e passou a ser o que
//   torna as notificações possíveis em metade dos telemóveis do país.
//
// • A permissão só pode ser pedida a partir de um gesto da pessoa (um toque).
//   Pedir sozinho ao abrir a página é recusado pelo browser, e num iPhone
//   gasta a única oportunidade: recusado uma vez, só se recupera nas
//   definições do sistema.

import { supabase } from '@/lib/supabase';

// Metade pública do par de chaves. A privada vive só no Supabase.
const CHAVE_PUBLICA = 'BG8Cs-WnwcI_nV15xY-DXMJNvM6pdvOwtRA_DZgITKVmEEzi-toJYFxwr_p2QjF5tkvom6n6VSBuSZHWeqPQ-So';

function base64ParaBytes(base64) {
  const norm = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(norm);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function bytesParaBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export function emModoAplicacao() {
  try {
    return window.matchMedia?.('(display-mode: standalone)').matches === true
        || window.navigator.standalone === true;
  } catch { return false; }
}

const ehIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/**
 * O que dá para fazer neste aparelho, agora.
 *   'indisponivel'   — o browser não suporta de todo
 *   'precisa-ecra'   — iPhone: só depois de guardar no ecrã principal
 *   'por-pedir'      — dá, ainda não perguntámos
 *   'concedido'      — já disse que sim
 *   'negado'         — disse que não; só se muda nas definições do sistema
 */
export function estadoPush() {
  if (typeof window === 'undefined') return 'indisponivel';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return ehIOS() && !emModoAplicacao() ? 'precisa-ecra' : 'indisponivel';
  }
  if (ehIOS() && !emModoAplicacao()) return 'precisa-ecra';
  if (Notification.permission === 'granted') return 'concedido';
  if (Notification.permission === 'denied') return 'negado';
  return 'por-pedir';
}

async function registarServiceWorker() {
  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  return reg;
}

/**
 * Pede a permissão e guarda a inscrição. Chamar SEMPRE a partir de um toque.
 * Devolve o estado final.
 */
export async function ativarPush({ businessId, userId, papel }) {
  const estado = estadoPush();
  if (estado !== 'por-pedir' && estado !== 'concedido') return estado;
  if (!businessId || !userId) return 'indisponivel';

  const permissao = await Notification.requestPermission();
  if (permissao !== 'granted') return permissao === 'denied' ? 'negado' : 'por-pedir';

  await inscrever({ businessId, userId, papel });
  return 'concedido';
}

/**
 * Dizer que sim à pergunta do browser não chega: sem esta inscrição gravada,
 * o servidor não sabe para onde mandar nada. E a permissão fica guardada no
 * aparelho para sempre, por isso quem já disse que sim uma vez nunca mais vê
 * a pergunta — e nunca mais se inscreveria. Daí correr isto sozinho ao abrir,
 * sempre que a permissão já existe. Não incomoda ninguém: não pergunta nada.
 */
export async function garantirPush({ businessId, userId, papel }) {
  try {
    if (estadoPush() !== 'concedido') return;
    if (!businessId || !userId) return;
    await inscrever({ businessId, userId, papel });
  } catch (e) {
    console.warn('push: não foi possível garantir a inscrição', e);
  }
}

async function inscrever({ businessId, userId, papel }) {
  const reg = await registarServiceWorker();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ParaBytes(CHAVE_PUBLICA),
    });
  }

  const j = sub.toJSON();
  const { error } = await supabase.from('push_subscriptions').upsert({
    business_id: businessId,
    user_id: userId,
    papel,
    endpoint: sub.endpoint,
    p256dh: j.keys?.p256dh || bytesParaBase64(sub.getKey('p256dh')),
    auth: j.keys?.auth || bytesParaBase64(sub.getKey('auth')),
    agente: navigator.userAgent.slice(0, 300),
    usado_em: new Date().toISOString(),
  }, { onConflict: 'endpoint' });
  if (error) throw new Error(error.message);
}

/** Deixar de receber neste aparelho. */
export async function desativarPush() {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      await sub.unsubscribe();
    }
  } catch { /* já não havia nada */ }
}

/** Pedir ao servidor que envie uma notificação. */
export async function enviarPush(payload) {
  const { data: { session } } = await supabase.auth.getSession();
  const { error } = await supabase.functions.invoke('enviar-push', {
    body: payload,
    headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
  });
  if (error) throw new Error(error.message);
}

/* ── Como se escreve uma notificação da Convecta ─────────────────────────────
 *
 * Igual ao da app de cliente, de propósito: as duas mandam notificações para o
 * mesmo telemóvel e têm de se ler como a mesma coisa.
 *
 *   TÍTULO   <emoji> <o que aconteceu>
 *   CORPO    Quem · O quê
 *            Quando, por extenso
 *
 * O iPhone acrescenta sozinho "from <nome da app>" por baixo do título. Não há
 * forma de tirar — é o sistema a dizer de onde vem. O título tem de valer por si.
 */
export const EMOJI = {
  novaMarcacao: '\u{1F4C5}',
  marcacaoAutomatica: '\u{2705}',
  confirmada: '\u{2705}',
  cancelada: '\u{274C}',
  lembrete: '\u{23F0}',
};

export function quandoPorExtenso(data, hora) {
  try {
    const d = new Date(`${data}T${hora}:00`);
    const t = d.toLocaleString('pt-PT', {
      weekday: 'long', day: 'numeric', month: 'long',
      hour: '2-digit', minute: '2-digit',
    });
    const limpo = t.replace(/,\s(\d{2}:\d{2})$/, ' às $1');
    return limpo.charAt(0).toUpperCase() + limpo.slice(1);
  } catch {
    return `${data} às ${hora}`;
  }
}

export function corpoDaMarcacao({ quem, servico, data, hora }) {
  const linha1 = [quem, servico].filter(Boolean).join(' \u00B7 ');
  return `${linha1}\n${quandoPorExtenso(data, hora)}`;
}
