/*
 * OS EXTRAS PAGOS DA SUBSCRIÇÃO (13/10/2026, decisão do Diogo).
 *
 * Funcionalidades que o dono liga e desliga em «A minha subscrição», com o
 * preço ao lado. Ligar junta uma linha à subscrição do Stripe (função
 * extras-subscricao); fica em businesses.extras.
 */
import { supabase } from '@/lib/supabase';

export const EXTRAS = [
  {
    id: 'pagamentos',
    nome: 'Pagamentos online',
    texto: 'O cliente paga o sinal ou o serviço ao marcar: cartão, Apple Pay, Google Pay ou MB WAY. Acabam as faltas.',
    precos: { mensal: 4.99, quinzenal: 2.49, anual: 50.90 },
    incluidoEm: ['profissional', 'business'],
    rota: '/admin/pagamentos-online',
  },
  {
    id: 'faturas',
    nome: 'Faturas',
    texto: 'Emite a fatura com NIF ao fechar a conta, ligada ao teu programa de faturação certificado.',
    precos: { mensal: 4.99, quinzenal: 2.49, anual: 50.90 },
    incluidoEm: [],
    emBreve: true,
  },
];

export const extraDe = id => EXTRAS.find(e => e.id === id) || null;

/** O plano já inclui este extra? */
export const extraIncluido = (biz, id) =>
  !!extraDe(id)?.incluidoEm.includes(String(biz?.plan || '').toLowerCase());

/** O negócio pode usar este extra (incluído, ligado, ou não paga). */
export const extraAtivo = (biz, id) => !!biz && (
  extraIncluido(biz, id) || biz.extras?.[id] === true || biz.isenta || biz.isTest || biz.founder
);

/** Liga ou desliga um extra (cobra/deixa de cobrar no Stripe). */
export async function mudarExtra(id, ligar) {
  const { data, error } = await supabase.functions.invoke('extras-subscricao', { body: { extra: id, ligar } });
  let msg = data?.erro;
  if (error) { try { msg = (await error.context?.json())?.erro || error.message; } catch { msg = error.message; } }
  if (msg) throw new Error(msg);
  return data;
}

export const sufixoPeriodo = p => (p === 'anual' ? '/ano' : p === 'quinzenal' ? '/15 dias' : '/mês');
