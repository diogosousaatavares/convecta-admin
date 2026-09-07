// finance.js — fonte única de verdade para todos os cálculos financeiros.
// Dashboard, Reports, Caixa, Comissões e Clientes DEVE consumir estas funções.
// Nenhuma página deve redefinir receita/comissão/LTV/ocupação localmente.

import { round2 } from './money';
import { toMinutes, dayNameOf, parseLocalDate, localDateStr } from './dates';
import { APPT_STATES, appointmentDuration } from './appointments';

// --- Seleção de marcações pagas (fonte da receita) -------------------------
// Receita reconhecida = marcações COMPLETED com pagamento válido.
// NOTA: uma marcação confirmed (ainda não paga) NÃO conta como receita.
export function paidAppointments(state, range) {
  return state.appointments.filter(a =>
    a.status === APPT_STATES.COMPLETED &&
    a.payment &&
    inRange(a.date, range)
  );
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
  const base = netOfPayment(a);
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
  const paid = state.appointments.filter(a => a.customerId === customerId && a.status === APPT_STATES.COMPLETED && a.payment);
  const totalSpent = round2(paid.reduce((s, a) => s + totalOfPayment(a), 0));
  const visits = paid.length;
  const lastVisit = paid.length ? paid.map(a => a.date).sort().reverse()[0] : null;
  return { visits, totalSpent, lastVisit };
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

// Numerário esperado = fundo abertura + vendas em dinheiro + entradas em
// dinheiro - despesas em dinheiro - levantamentos em dinheiro.
// Pagamentos por cartão/MB WAY NÃO aumentam o numerário físico.
export function getExpectedCash(state, session) {
  if (!session) return 0;
  const since = session.openedAt;
  const cashSales = state.appointments
    .filter(a => a.status === APPT_STATES.COMPLETED && a.payment && isCashMethod(a.payment.method) && (a.payment.at || a.completedAt || '') >= since)
    .reduce((s, a) => s + totalOfPayment(a), 0);
  const cashExpenses = (state.expenses || [])
    .filter(e => e.sessionId === session.id && expenseImpactsCash(e))
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const cashMovesIn = (state.cashMovements || [])
    .filter(m => m.type === 'in' && isCashMethod(m.method || 'Dinheiro') && (m.createdAt || '') >= since)
    .reduce((s, m) => s + Number(m.amount || 0), 0);
  const cashMovesOut = (state.cashMovements || [])
    .filter(m => m.type === 'out' && isCashMethod(m.method || 'Dinheiro') && (m.createdAt || '') >= since)
    .reduce((s, m) => s + Number(m.amount || 0), 0);
  return round2((session.openingBalance || 0) + cashSales + cashMovesIn - cashExpenses - cashMovesOut);
}