// finance.js — fonte única de verdade para todos os cálculos financeiros.
// Dashboard, Reports, Caixa, Comissões e Clientes DEVE consumir estas funções.
// Nenhuma página deve redefinir receita/comissão/LTV/ocupação localmente.

import { round2 } from './money';
import { toMinutes, dayNameOf, parseLocalDate, localDateStr } from './dates';
import { APPT_STATES, appointmentDuration } from './appointments';

// --- Seleção de marcações pagas (fonte da receita) -------------------------
// Receita reconhecida = marcações COMPLETED com pagamento válido.
// NOTA: uma marcação confirmed (ainda não paga) NÃO conta como receita.
//
// A receita conta no dia em que o DINHEIRO ENTROU, não no dia da marcação.
// Cobrar hoje um corte de amanhã punha o dinheiro na caixa de hoje e a
// receita em lado nenhum: o painel dizia zero enquanto a gaveta tinha lá o
// dinheiro. É esta data que a caixa, o painel e o relatório passam a usar.
export function dataDoPagamento(a) {
  const t = a?.payment?.at || a?.completedAt;
  if (t) {
    const d = new Date(t);
    if (!isNaN(d.getTime())) return localDateStr(d);
  }
  return a?.date;
}

export function paidAppointments(state, range) {
  const hoje = localDateStr(new Date());
  return state.appointments.filter(a => {
    if (a.status !== APPT_STATES.COMPLETED || !a.payment) return false;
    const d = dataDoPagamento(a);
    return d && d <= hoje && inRange(d, range);
  });
}

export function inRange(dateStr, range) {
  if (!range) return true;
  if (range.from && dateStr < range.from) return false;
  if (range.to && dateStr > range.to) return false;
  return true;
}

// Receita de serviços = baseAmount - discountAmount (exclui gorjeta).
export function getRevenue(state, range) {
  return round2(paidAppointments(state, range).reduce((s, a) => s + netOfPayment(a), 0));
}

// --- Vendas de produtos ----------------------------------------------------
// Um champô vendido ao balcão é receita como um corte é receita. Estava fora
// de todas as contas: entrava na caixa e desaparecia do painel.
export function vendasDeProdutos(state, range) {
  const hoje = localDateStr(new Date());
  return (state.sales || []).filter(v => {
    const d = v.soldAt ? localDateStr(new Date(v.soldAt)) : v.date;
    return d && d <= hoje && inRange(d, range);
  });
}

export function getProductRevenue(state, range) {
  return round2(vendasDeProdutos(state, range).reduce((s, v) => s + (Number(v.total) || 0), 0));
}

// --- Vendas de packs -------------------------------------------------------
// O pack entra como receita no dia em que é pago (decisão de 21/09). Os
// cortes feitos com ele ficam a 0 € — o dinheiro já foi contado na venda,
// contá-lo outra vez a cada corte era receita a dobrar. Uma venda anulada
// (engano, ou dinheiro devolvido) deixa de contar.
export function vendasDePacks(state, range) {
  const hoje = localDateStr(new Date());
  return (state.packSales || []).filter(v => {
    if (v.anulado) return false;
    const d = v.soldAt ? localDateStr(new Date(v.soldAt)) : null;
    return d && d <= hoje && inRange(d, range);
  });
}

export function getPackRevenue(state, range) {
  return round2(vendasDePacks(state, range).reduce((s, v) => s + (Number(v.total) || 0), 0));
}

// Quanto vale um corte de um pack: o que o cliente pagou a dividir pelos
// cortes. É a base da comissão do barbeiro nesse corte.
export function valorDoCortePack(state, a) {
  if (!a?.usaPack || !a.pacoteId) return 0;
  const v = (state.packSales || []).find(x => x.id === a.pacoteId);
  if (!v || !(Number(v.cortes) > 0)) return 0;
  return round2((Number(v.total) || 0) / Number(v.cortes));
}

// Receita do negócio: serviços + produtos + packs. É este o número do painel.
export function getTotalRevenue(state, range) {
  return round2(getRevenue(state, range) + getProductRevenue(state, range) + getPackRevenue(state, range));
}

// Despesas do período, pela data em que foram feitas.
export function getExpensesTotal(state, range) {
  return round2((state.expenses || [])
    .filter(e => inRange(e.date || (e.createdAt || '').slice(0, 10), range))
    .reduce((s, e) => s + (Number(e.amount) || 0), 0));
}

// Gorjetas (tratamento separado).
export function getTips(state, range) {
  return round2(paidAppointments(state, range).reduce((s, a) => s + (a.payment.tip || 0), 0));
}

// Total cobrado = receita serviços + gorjetas.
export function getTotalPaid(state, range) {
  return round2(getRevenue(state, range) + getTips(state, range));
}

// Receita líquida de uma venda individual (base - desconto).
export function netOfPayment(a) {
  if (!a || !a.payment) return 0;
  const base = Number(a.payment.baseAmount) || 0;
  const disc = Number(a.payment.discountAmount) || 0;
  return round2(Math.max(0, base - disc));
}

export function totalOfPayment(a) {
  if (!a || !a.payment) return 0;
  return round2(Number(a.payment.total) || 0);
}

// --- Comissões -------------------------------------------------------------
// A comissão é persistida no checkout (snapshot da %). Esta função lê o
// registo persistido; para vendas legadas sem registo, estima com a % atual
// e marca como estimada (não inventa histórico).
export function commissionForAppointment(state, a) {
  if (a.payment?.commission) {
    return { ...a.payment.commission, estimated: false };
  }
  const rec = state.commissions?.find(c => c.appointmentId === a.id);
  if (rec) return { ...rec, estimated: false };
  // Legacy: sem registo persistido — estimativa honesta.
  const pro = state.professionals.find(p => p.id === a.professionalId);
  const pct = pro?.commission || 0;
  // Corte de pack: a comissão é sobre o valor do corte no pack, não sobre 0 €.
  const base = a.usaPack ? valorDoCortePack(state, a) : netOfPayment(a);
  return {
    professionalId: a.professionalId,
    percentage: pct,
    baseAmount: base,
    commissionAmount: round2(base * pct / 100),
    estimated: true
  };
}

export function getCommissionsTotal(state, range) {
  return round2(paidAppointments(state, range).reduce((s, a) => s + commissionForAppointment(state, a).commissionAmount, 0));
}

// --- Cliente (Lifetime Value, visitas, última visita) ---------------------
// Derivados das marcações pagas — NUNCA atualizados na confirmação.
export function getCustomerStats(state, customerId) {
  // A mesma regra de resumoCliente (mais abaixo): pagas até hoje, sem gorjeta,
  // com produtos e packs.
  const r = resumoCliente(state, customerId);
  return { visits: r.visitas, totalSpent: r.totalGasto, lastVisit: r.ultimaVisita };
}

// --- Ocupação do profissional (minutos / minutos disponíveis) --------------
// NÃO usa contagem de marcações. Usa duração real (snapshot) vs horário.
export function getProfessionalOccupancy(state, professionalId, range) {
  let occupied = 0;
  let available = 0;
  const pro = state.professionals.find(p => p.id === professionalId);
  if (!pro || !range) return { occupied: 0, available: 0, rate: 0 };

  const cursor = parseLocalDate(range.from);
  const end = parseLocalDate(range.to);
  while (cursor <= end) {
    const ds = localDateStr(cursor);
    const hours = state.business.openingHours.find(h => h.day === dayNameOf(ds));
    if (hours && hours.isOpen) {
      const open = toMinutes(hours.open);
      const close = toMinutes(hours.close);
      available += (close - open); // minutos disponíveis no dia
      const dayAppts = state.appointments.filter(a =>
        a.professionalId === professionalId &&
        a.date === ds &&
        a.status !== APPT_STATES.CANCELLED &&
        a.status !== APPT_STATES.NO_SHOW &&
        !a.blocked
      );
      dayAppts.forEach(a => { occupied += appointmentDuration(state, a); });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  const rate = available > 0 ? round2((occupied / available) * 100) : 0;
  return { occupied, available, rate };
}

// Ocupação agregada de todos os profissionais (minutos ocupados / disponíveis).
export function getOccupancy(state, range) {
  let occupied = 0, available = 0;
  state.professionals.forEach(p => {
    const o = getProfessionalOccupancy(state, p.id, range);
    occupied += o.occupied; available += o.available;
  });
  return { occupied, available, rate: available > 0 ? round2((occupied / available) * 100) : 0 };
}

// --- No-show vs Cancelamento ----------------------------------------------
// Conceitos distintos. no_show tem estado próprio; cancelled é cancelamento.
export function getNoShowCount(state, range) {
  return state.appointments.filter(a => a.status === APPT_STATES.NO_SHOW && inRange(a.date, range)).length;
}
export function getCancellationCount(state, range) {
  return state.appointments.filter(a => a.status === APPT_STATES.CANCELLED && inRange(a.date, range)).length;
}
export function getNoShowRate(state, range) {
  const total = state.appointments.filter(a => inRange(a.date, range) && !a.blocked).length;
  return total ? round2((getNoShowCount(state, range) / total) * 100) : 0;
}
export function getCancellationRate(state, range) {
  const total = state.appointments.filter(a => inRange(a.date, range) && !a.blocked).length;
  return total ? round2((getCancellationCount(state, range) / total) * 100) : 0;
}

// --- Caixa: impacto físico por método --------------------------------------
// Só "Dinheiro" (numerário) impacta o caixa físico. Restantes métodos não.
export function isCashMethod(method) { return method === 'Dinheiro'; }

// Despesa impacta o caixa físico apenas se paga em numerário.
export function expenseImpactsCash(e) { return !e.method || isCashMethod(e.method); }

// As marcações pagas dentro desta sessão de caixa — pela hora do pagamento,
// que é quando o dinheiro muda de mãos.
export function pagamentosDaSessao(state, session) {
  if (!session) return [];
  const de = session.openedAt;
  const ate = session.closedAt || null;
  return state.appointments.filter(a => {
    if (a.status !== APPT_STATES.COMPLETED || !a.payment) return false;
    const t = a.payment.at || a.completedAt || '';
    return t && t >= de && (!ate || t <= ate);
  });
}

// As vendas de produtos desta sessão. As em dinheiro trazem a sessão consigo;
// as outras conta-se pela hora.
export function vendasDaSessao(state, session) {
  if (!session) return [];
  const de = session.openedAt;
  const ate = session.closedAt || null;
  return (state.sales || []).filter(v => {
    if (v.sessionId === session.id) return true;
    const t = v.soldAt || '';
    return t && t >= de && (!ate || t <= ate);
  });
}

// Os packs vendidos durante esta sessão (pela hora da venda). Anulados não.
export function packsDaSessao(state, session) {
  if (!session) return [];
  const de = session.openedAt;
  const ate = session.closedAt || null;
  return (state.packSales || []).filter(v => {
    if (v.anulado) return false;
    const t = v.soldAt || '';
    return t && t >= de && (!ate || t <= ate);
  });
}

// Numerário esperado = fundo de abertura + tudo o que entrou EM DINHEIRO
// (serviços, produtos, entradas avulsas) - o que saiu em dinheiro (despesas
// pagas em numerário e levantamentos). Cartão e MB WAY não mexem na gaveta.
//
// Os movimentos de caixa são apenas os avulsos — sangrias e reforços. As
// despesas e as vendas de produtos deixaram de gerar movimento automático:
// geravam, e a mesma despesa era descontada duas vezes, uma pela tabela das
// despesas e outra pelo movimento que ela própria tinha criado.
export function getExpectedCash(state, session) {
  if (!session) return 0;
  const de = session.openedAt;
  const ate = session.closedAt || null;
  const dentro = (t) => t && t >= de && (!ate || t <= ate);

  const servicosDinheiro = pagamentosDaSessao(state, session)
    .filter(a => isCashMethod(a.payment.method))
    .reduce((s, a) => s + totalOfPayment(a), 0);
  const produtosDinheiro = vendasDaSessao(state, session)
    .filter(v => isCashMethod(v.method))
    .reduce((s, v) => s + Number(v.total || 0), 0);
  const packsDinheiro = packsDaSessao(state, session)
    .filter(v => isCashMethod(v.method))
    .reduce((s, v) => s + Number(v.total || 0), 0);
  const despesasDinheiro = (state.expenses || [])
    .filter(e => e.sessionId === session.id && expenseImpactsCash(e))
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const entradas = (state.cashMovements || [])
    .filter(m => m.type === 'in' && dentro(m.createdAt || ''))
    .reduce((s, m) => s + Number(m.amount || 0), 0);
  const saidas = (state.cashMovements || [])
    .filter(m => m.type === 'out' && dentro(m.createdAt || ''))
    .reduce((s, m) => s + Number(m.amount || 0), 0);

  return round2((session.openingBalance || 0) + servicosDinheiro + produtosDinheiro + packsDinheiro + entradas - despesasDinheiro - saidas);
}

// ═══════════════════════════════════════════════════════════════════════════
// AS MESMAS CONTAS EM TODO O PAINEL (23/09)
//
// Um teste real encontrou cada ecrã a calcular à sua maneira: comissões com
// marcações futuras, desempenho com gorjetas dentro da receita, conta do
// profissional com a % de hoje. A partir daqui, as definições são estas:
//
//   RECEITA        = serviços (preço − desconto) + produtos + packs.
//                    Pela data do PAGAMENTO, nunca no futuro.
//   GORJETAS       = à parte. São do barbeiro, não da barbearia.
//   MARCAÇÕES      = marcações PAGAS no período (as mesmas que dão receita).
//   COMISSÃO       = a gravada no momento da cobrança (snapshot da %).
// ═══════════════════════════════════════════════════════════════════════════

// Tudo o que um profissional fez no período — é o que os ecrãs de Comissões,
// Desempenho, Relatório de Profissionais e Conta do Profissional mostram.
export function resumoProfissional(state, professionalId, range) {
  const pagas = paidAppointments(state, range).filter(a => a.professionalId === professionalId);
  const receita = round2(pagas.reduce((s, a) => s + netOfPayment(a), 0));
  const comissao = round2(pagas.reduce((s, a) => s + (commissionForAppointment(state, a).commissionAmount || 0), 0));
  const gorjetas = round2(pagas.reduce((s, a) => s + (Number(a.payment?.tip) || 0), 0));
  const clientes = new Set(pagas.map(a => a.customerId).filter(Boolean)).size;
  return {
    marcacoes: pagas.length,
    pagas,
    receita,
    comissao,
    gorjetas,
    aReceber: round2(comissao + gorjetas),
    clientes,
    ticket: pagas.length ? round2(receita / pagas.length) : 0,
  };
}

// Ticket médio de um corte: receita de serviços ÷ marcações pagas. Produtos
// e packs ficam de fora — um frasco de 450 € não é um corte mais caro.
export function ticketMedio(state, range) {
  const pagas = paidAppointments(state, range);
  return pagas.length ? round2(getRevenue(state, range) / pagas.length) : 0;
}

// O que já está marcado no período e ainda não foi cobrado (de hoje em
// diante), ao preço gravado na marcação. Substitui a «previsão» que
// multiplicava a média de 7 dias pelos dias do período — com uma venda
// grande num dia, prometia milhares.
export function jaMarcadoPorCobrar(state, range) {
  const hoje = localDateStr(new Date());
  return round2((state.appointments || [])
    .filter(a => !a.blocked && ['pending', 'confirmed'].includes(a.status) && a.date >= hoje && inRange(a.date, range))
    .reduce((s, a) => {
      if (a.usaPack || a.usaRecompensa) return s;
      const svc = (state.services || []).find(x => x.id === a.serviceId);
      const p = a.unitPriceSnapshot != null ? Number(a.unitPriceSnapshot) : Number(svc?.price || 0);
      return s + (p || 0);
    }, 0));
}

// Um cliente: visitas pagas, total gasto (serviços líquidos + produtos +
// packs, sem gorjetas) e última visita — nunca no futuro.
export function resumoCliente(state, customerId) {
  const hoje = localDateStr(new Date());
  const pagas = (state.appointments || []).filter(a => a.customerId === customerId
    && a.status === APPT_STATES.COMPLETED && a.payment && a.date <= hoje);
  const servicos = pagas.reduce((s, a) => s + netOfPayment(a), 0);
  const produtos = (state.sales || []).filter(v => v.customerId === customerId).reduce((s, v) => s + (Number(v.total) || 0), 0);
  const packs = (state.packSales || []).filter(v => v.customerId === customerId && !v.anulado).reduce((s, v) => s + (Number(v.total) || 0), 0);
  const ultima = pagas.map(a => a.date).sort().reverse()[0] || null;
  return { visitas: pagas.length, totalGasto: round2(servicos + produtos + packs), servicos: round2(servicos), produtos: round2(produtos), packs: round2(packs), ultimaVisita: ultima };
}

// Uma sessão de caixa, com as mesmas contas na página Caixa e no Histórico.
// diferenca < 0 → falta dinheiro; > 0 → sobra.
export function resumoSessao(state, session) {
  if (!session) return null;
  const servicos = pagamentosDaSessao(state, session).reduce((s, a) => s + totalOfPayment(a), 0);
  const produtos = vendasDaSessao(state, session).reduce((s, v) => s + (Number(v.total) || 0), 0);
  const packs = packsDaSessao(state, session).reduce((s, v) => s + (Number(v.total) || 0), 0);
  const despesas = (state.expenses || []).filter(e => e.sessionId === session.id && expenseImpactsCash(e))
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const esperado = getExpectedCash(state, session);
  const contado = session.status === 'closed' ? round2(Number(session.countedCash) || 0) : null;
  return {
    vendas: round2(servicos + produtos + packs),
    despesas: round2(despesas),
    esperado,
    contado,
    diferenca: contado == null ? null : round2(contado - esperado),
  };
}

// "−6,80 € (falta)" / "+2,00 € (sobra)" / "Certo".
export function textoDiferenca(diff, fmt) {
  if (diff == null) return '—';
  if (Math.abs(diff) < 0.005) return 'Certo';
  return `${diff < 0 ? '−' : '+'}${fmt(Math.abs(diff))} ${diff < 0 ? '(falta)' : '(sobra)'}`;
}

// Saídas do período: despesas (pela data delas) + saídas avulsas de caixa.
export function saidasDoPeriodo(state, range) {
  const despesas = (state.expenses || []).filter(e => inRange(e.date || (e.createdAt || '').slice(0, 10), range))
    .map(e => ({ id: 'd-' + e.id, origem: 'despesa', data: e.date || (e.createdAt || '').slice(0, 10), quando: e.createdAt, descricao: e.description, categoria: e.category, metodo: e.method, valor: Number(e.amount) || 0 }));
  const avulsas = (state.cashMovements || []).filter(m => m.type === 'out' && inRange((m.createdAt || '').slice(0, 10), range))
    .map(m => ({ id: 'm-' + m.id, origem: 'caixa', data: (m.createdAt || '').slice(0, 10), quando: m.createdAt, descricao: m.description || 'Saída de caixa', categoria: 'Saída de caixa', metodo: 'Dinheiro', valor: Number(m.amount) || 0, movimentoId: m.id }));
  return [...despesas, ...avulsas].sort((a, b) => (b.quando || b.data || '').localeCompare(a.quando || a.data || ''));
}

export function entradasAvulsas(state, range) {
  return (state.cashMovements || []).filter(m => m.type === 'in' && inRange((m.createdAt || '').slice(0, 10), range))
    .map(m => ({ id: m.id, data: (m.createdAt || '').slice(0, 10), quando: m.createdAt, descricao: m.description || 'Entrada de caixa', valor: Number(m.amount) || 0 }));
}
