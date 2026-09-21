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

const faltaSql = (e) => /packs|vender_pack|pedido/.test(e?.message || '') && /does not exist|not find|schema cache/i.test(e?.message || '');

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
    // Definições (PACK_PEDIDOS.sql). Sem o SQL, ficam os valores de sempre.
    descricao: r.descricao || '',
    validadeTipo: r.validade_tipo || 'mes',
    validadeDias: r.validade_dias || 30,
    intervaloDias: r.intervalo_dias || 0,
    pedidoNaApp: r.pedido_na_app !== false,
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
    intervaloDias: r.intervalo_dias || 0,
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
  const definicoes = {
    descricao: String(pack.descricao || '').trim() || null,
    validade_tipo: pack.validadeTipo === 'dias' ? 'dias' : 'mes',
    validade_dias: Math.round(Number(pack.validadeDias) || 30),
    intervalo_dias: Math.round(Number(pack.intervaloDias) || 0),
    pedido_na_app: pack.pedidoNaApp !== false,
  };
  if (!linha.nome) throw new Error('Dá um nome ao pack.');
  if (!(linha.cortes >= 1 && linha.cortes <= 60)) throw new Error('O número de cortes tem de estar entre 1 e 60.');
  if (!(definicoes.validade_dias >= 1 && definicoes.validade_dias <= 366)) throw new Error('A validade tem de estar entre 1 e 366 dias.');
  if (!(definicoes.intervalo_dias >= 0 && definicoes.intervalo_dias <= 60)) throw new Error('O intervalo tem de estar entre 0 e 60 dias.');

  const gravar = (l) => pack.id
    ? supabase.from('packs').update(l).eq('id', pack.id).select().single()
    : supabase.from('packs').insert(l).select().single();
  let { data, error } = await gravar({ ...linha, ...definicoes });
  if (error && /descricao|validade_tipo|validade_dias|intervalo_dias|pedido_na_app/.test(error.message || '')) {
    throw new Error('Falta correr o PACK_PEDIDOS.sql no Supabase para gravar estas definições.');
  }
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

// ── Pedidos de pack (PACK_PEDIDOS.sql) ──────────────────────────────────────
//
// O cliente pede o pack na app; o barbeiro confirma quando recebe o dinheiro.
// Só a confirmação cria o pack — um pedido nunca dá cortes a ninguém.

function pedidoDeLinha(r) {
  return {
    id: r.id,
    customerId: r.customer_id,
    packId: r.pack_id,
    nome: r.nome,
    cortes: r.cortes,
    preco: Number(r.preco) || 0,
    estado: r.estado,
    motivo: r.motivo || '',
    criadoEm: r.criado_em,
    resolvidoEm: r.resolvido_em,
  };
}

export async function listarPedidos(businessId) {
  const { data, error } = await supabase
    .from('pedidos_pack').select('*')
    .eq('business_id', businessId)
    .order('criado_em', { ascending: false })
    .limit(200);
  if (error) {
    // Ainda sem o PACK_PEDIDOS.sql: não há pedidos, e não se enche o ecrã de erros.
    if (/pedidos_pack/.test(error.message || '')) return [];
    throw erro(error);
  }
  return (data || []).map(pedidoDeLinha);
}

async function avisarCliente(businessId, customerId, titulo, mensagem, tag) {
  try {
    const { enviarPush } = await import('@/lib/push');
    await enviarPush({ businessId, para: 'customer', userId: customerId, titulo, mensagem, url: '/', tag });
  } catch (e) { console.warn('aviso ao cliente não enviado:', e.message); }
}

export async function confirmarPedido(pedido, metodo, preco, { businessId, nomeBarbearia } = {}) {
  const { data, error } = await supabase.rpc('confirmar_pedido_pack', {
    p_pedido_id: pedido.id,
    p_metodo: metodo || null,
    p_preco: preco === '' || preco == null ? null : Number(preco),
  });
  if (error) throw erro(error);
  const venda = vendaDeLinha(Array.isArray(data) ? data[0] : data);
  const [a, m, d] = String(venda.validoAte).split('-');
  avisarCliente(businessId, pedido.customerId,
    '\u{2705} O teu pack está ativo',
    `${nomeBarbearia || 'A barbearia'}\n${venda.nome}: ${venda.total} cortes até ${d}/${m}/${a}. Já podes marcar com ele.`,
    'pack-' + pedido.id);
  return venda;
}

export async function recusarPedido(pedido, motivo, { businessId, nomeBarbearia } = {}) {
  const { error } = await supabase.rpc('recusar_pedido_pack', {
    p_pedido_id: pedido.id,
    p_motivo: motivo || null,
  });
  if (error) throw erro(error);
  avisarCliente(businessId, pedido.customerId,
    'Pedido de pack não aceite',
    `${nomeBarbearia || 'A barbearia'}\n${motivo ? motivo : 'Fala com a barbearia para saberes mais.'}`,
    'pack-' + pedido.id);
}
