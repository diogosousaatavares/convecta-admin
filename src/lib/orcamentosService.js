import { supabase } from '@/lib/supabase';

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
    .select('*, customers(name, phone)')
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

/* Marcado: guarda-se o que o barbeiro decidiu e a marcação que criou. O
   pedido não desaparece — fica como histórico do que foi combinado. */
export async function marcarPedido(id, { minutos, preco, appointmentId }) {
  const { error } = await supabase.from('pedidos_orcamento').update({
    estado: 'marcado',
    minutos: Math.round(Number(minutos) || 0) || null,
    preco: preco === '' || preco == null ? null : Number(preco),
    appointment_id: appointmentId || null,
    resolvido_em: new Date().toISOString(),
  }).eq('id', id);
  if (error) throw erro(error);
}

export async function recusarPedido(id, motivo) {
  const { error } = await supabase.from('pedidos_orcamento').update({
    estado: 'recusado',
    motivo: String(motivo || '').trim() || null,
    resolvido_em: new Date().toISOString(),
  }).eq('id', id);
  if (error) throw erro(error);
}
