import { supabase } from '@/lib/supabase';

/*
 * Packs — o barbeiro vende um conjunto de cortes pagos à cabeça, e o
 * cliente vai-os marcando pela app quando quer.
 *
 * Isto fala directamente com a base de dados, e não pelo estado em memória
 * do dataService, de propósito. O módulo «Subscrições» que estava neste
 * lugar guardava tudo só na memória do browser: um barbeiro criava um plano,
 * recarregava a página, e o plano tinha desaparecido. Aqui o que se grava
 * fica gravado.
 *
 * O saldo (cortes usados) NUNCA se escreve daqui. Gasta-se e devolve-se na
 * base de dados, quando uma marcação com «usar o pack» é criada, cancelada
 * ou apagada (PACK_MENSAL.sql). Um saldo que o browser pudesse escrever era
 * um saldo que qualquer pessoa podia repor com a consola aberta.
 */

const faltaSql = (e) => /packs|vender_pack/.test(e?.message || '') && /does not exist|not find|schema cache/i.test(e?.message || '');

function erro(e) {
  if (faltaSql(e)) return new Error('Falta correr o PACK_MENSAL.sql no Supabase.');
  return new Error(e?.message || 'Não foi possível concluir.');
}

function packDeLinha(r) {
  return {
    id: r.id,
    nome: r.nome,
    cortes: r.cortes,
    preco: Number(r.preco) || 0,
    servicos: r.servicos || [],
    transitaMeses: r.transita_meses ?? 1,
    ativo: r.ativo !== false,
  };
}

function vendaDeLinha(r) {
  const total = r.cortes_total || 0;
  const usados = r.cortes_usados || 0;
  const hoje = new Date().toISOString().slice(0, 10);
  const expirado = r.valido_ate < hoje;
  return {
    id: r.id,
    customerId: r.customer_id,
    packId: r.pack_id,
    nome: r.nome,
    total,
    usados,
    restantes: Math.max(total - usados, 0),
    servicos: r.servicos || [],
    precoPago: Number(r.preco_pago) || 0,
    metodo: r.metodo || '',
    compradoEm: r.comprado_em,
    validoAte: r.valido_ate,
    anulado: !!r.anulado_em,
    expirado,
    // Pode ser usado hoje: nem anulado, nem fora de prazo, nem esgotado.
    activo: !r.anulado_em && !expirado && usados < total,
  };
}

export async function listarPacks(businessId) {
  const { data, error } = await supabase
    .from('packs').select('*')
    .eq('business_id', businessId)
    .order('criado_em', { ascending: true });
  if (error) throw erro(error);
  return (data || []).map(packDeLinha);
}

export async function guardarPack(businessId, pack) {
  const linha = {
    business_id: businessId,
    nome: String(pack.nome || '').trim(),
    cortes: Math.round(Number(pack.cortes) || 0),
    preco: Number(pack.preco) || 0,
    servicos: pack.servicos || [],
    transita_meses: Math.round(Number(pack.transitaMeses ?? 1)),
    ativo: pack.ativo !== false,
  };
  if (!linha.nome) throw new Error('Dá um nome ao pack.');
  if (!(linha.cortes >= 1 && linha.cortes <= 60)) throw new Error('O número de cortes tem de estar entre 1 e 60.');

  const pedido = pack.id
    ? supabase.from('packs').update(linha).eq('id', pack.id).select().single()
    : supabase.from('packs').insert(linha).select().single();
  const { data, error } = await pedido;
  if (error) throw erro(error);
  return packDeLinha(data);
}

export async function apagarPack(id) {
  // Quem já comprou fica com o que comprou: a venda guarda uma cópia do
  // pack, e a ligação passa a vazia.
  const { error } = await supabase.from('packs').delete().eq('id', id);
  if (error) throw erro(error);
}

export async function listarVendas(businessId) {
  const { data, error } = await supabase
    .from('packs_clientes').select('*')
    .eq('business_id', businessId)
    .order('comprado_em', { ascending: false });
  if (error) throw erro(error);
  return (data || []).map(vendaDeLinha);
}

// Os packs de um cliente que ainda se podem usar, o que acaba primeiro à frente.
export async function packsActivosDoCliente(customerId) {
  if (!customerId) return [];
  const { data, error } = await supabase
    .from('packs_clientes').select('*')
    .eq('customer_id', customerId)
    .is('anulado_em', null)
    .order('valido_ate', { ascending: true });
  if (error) {
    if (faltaSql(error)) return [];
    throw erro(error);
  }
  return (data || []).map(vendaDeLinha).filter(v => v.activo);
}

// Quantos cortes deste cliente cobrem este serviço, hoje.
export function saldoParaServico(packsActivos, serviceId) {
  return (packsActivos || [])
    .filter(p => !p.servicos.length || p.servicos.includes(serviceId))
    .reduce((s, p) => s + p.restantes, 0);
}

export async function venderPack(packId, customerId, metodo, preco) {
  const { data, error } = await supabase.rpc('vender_pack', {
    p_pack_id: packId,
    p_customer_id: customerId,
    p_metodo: metodo || null,
    p_preco: preco === '' || preco == null ? null : Number(preco),
  });
  if (error) throw erro(error);
  return vendaDeLinha(Array.isArray(data) ? data[0] : data);
}

// Anular uma venda feita por engano. Os cortes que restam deixam de valer;
// os que já foram marcados continuam marcados.
export async function anularVenda(id) {
  const { error } = await supabase
    .from('packs_clientes')
    .update({ anulado_em: new Date().toISOString() })
    .eq('id', id);
  if (error) throw erro(error);
}
