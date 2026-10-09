import { supabase } from '@/lib/supabase';
import { enviarPush } from '@/lib/push';
import { n as nicho } from '@/lib/nicho';

/*
 * OS PEDIDOS DE ORÇAMENTO.
 *
 * Um serviço marcado como «sob orçamento» não se marca pela agenda: o
 * cliente faz um pedido e escreve o que quer. Isto é a lista desses pedidos
 * e o que acontece a cada um.
 *
 * Ver supabase/ORCAMENTOS_2026-10-06.sql.
 */

const erro = (e) => new Error(e?.message || 'Não foi possível falar com o servidor.');

/* Enquanto o SQL não tiver corrido, a tabela não existe. Devolve-se lista
   vazia em vez de rebentar o painel inteiro por causa de um ecrã. */
const faltaSql = (e) => {
  const m = String(e?.message || '');
  return /pedidos_orcamento/.test(m) || /schema cache/i.test(m)
    || e?.code === 'PGRST205' || e?.code === '42P01';
};

export async function listarPedidos(businessId) {
  const { data, error } = await supabase
    .from('pedidos_orcamento')
    .select('*, customers(name, phone), professionals(name)')
    .eq('business_id', businessId)
    .order('criado_em', { ascending: false });
  if (error) {
    if (faltaSql(error)) return [];
    throw erro(error);
  }
  return (data || []).map((r) => ({
    id: r.id,
    customerId: r.customer_id,
    cliente: r.customers?.name || 'Cliente',
    telefone: r.customers?.phone || '',
    serviceId: r.service_id,
    servico: r.nome_servico,
    descricao: r.descricao || '',
    preferencia: r.preferencia || '',
    /* A hora que o cliente escolheu no calendário. NÃO é uma vaga tomada —
       é o que lhe dá jeito. Quem marca é o barbeiro. */
    quandoPedido: r.quando_pedido || null,
    professionalId: r.professional_id || null,
    profissional: r.professionals?.name || '',
    estado: r.estado,
    minutos: r.minutos,
    preco: r.preco,
    appointmentId: r.appointment_id,
    criadoEm: r.criado_em,
  }));
}

export async function pedidosPendentes(businessId) {
  return (await listarPedidos(businessId)).filter((p) => p.estado === 'pendente');
}

/*
 * Marcado: guarda-se o que o barbeiro decidiu e a marcação que criou. O
 * pedido não desaparece — fica como histórico do que foi combinado.
 *
 * E o cliente é avisado. Ele pediu uma coisa e ficou à espera: deixá-lo
 * descobrir sozinho que já está combinado era fazê-lo abrir a app todos os
 * dias para ver. O push não trava a gravação — se o telemóvel dele não
 * tocar, o que ficou combinado fica combinado na mesma.
 */
export async function marcarPedido(id, { minutos, preco, appointmentId, businessId, customerId, servico, barbearia }) {
  const m = Math.round(Number(minutos) || 0) || null;
  const p = preco === '' || preco == null ? null : Number(preco);
  const { error } = await supabase.from('pedidos_orcamento').update({
    estado: 'marcado',
    minutos: m,
    preco: p,
    appointment_id: appointmentId || null,
    resolvido_em: new Date().toISOString(),
  }).eq('id', id);
  if (error) throw erro(error);

  if (businessId && customerId) {
    /* O corpo diz o que foi combinado, com números. «O teu pedido foi
       aceite» não diz nada a ninguém; «2h30 · 45 €» diz tudo. */
    const partes = [];
    if (m) partes.push(m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}` : `${m} min`);
    if (p != null) partes.push(`${String(p.toFixed(2)).replace('.', ',')} €`);
    await enviarPush({
      businessId,
      para: 'customer',
      userId: customerId,
      titulo: '\u{2705} Ficou combinado',
      mensagem: `${barbearia || nicho().A}\n${servico || 'O teu pedido'}${partes.length ? ' · ' + partes.join(' · ') : ''}`,
      url: '/marcacoes',
      tag: 'orcamento-' + id,
    }).catch((e) => console.warn('o cliente não foi avisado:', e.message));
  }
}

/*
 * Recusado: e o cliente TEM de saber.
 *
 * Alguém que pediu e nunca mais ouve nada fica à espera — e passado uma
 * semana não acha que o pedido falhou, acha que a barbearia não liga. Um
 * não dito a tempo custa menos do que um silêncio.
 */
export async function recusarPedido(id, motivo, { businessId, customerId, servico, barbearia } = {}) {
  const { error } = await supabase.from('pedidos_orcamento').update({
    estado: 'recusado',
    motivo: String(motivo || '').trim() || null,
    resolvido_em: new Date().toISOString(),
  }).eq('id', id);
  if (error) throw erro(error);

  if (businessId && customerId) {
    await enviarPush({
      businessId,
      para: 'customer',
      userId: customerId,
      titulo: 'Sobre o teu pedido',
      mensagem: `${barbearia || nicho().A}\n${String(motivo || '').trim()
        || `Não é possível fazer ${servico || 'esse trabalho'} de momento. Fala connosco.`}`,
      url: '/marcacoes',
      tag: 'orcamento-' + id,
    }).catch((e) => console.warn('o cliente não foi avisado:', e.message));
  }
}
