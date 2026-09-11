// appointments.js — máquina de estados, snapshot histórico e validação de conflitos.
// Fonte única de verdade para transições de marcação.

import { toMinutes, toTime } from './dates';

// Estados canónicos de uma marcação.
export const APPT_STATES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show'
};

// Transições válidas (origem -> destinos permitidos).
const TRANSITIONS = {
  pending: ['confirmed', 'cancelled', 'no_show'],
  confirmed: ['completed', 'cancelled', 'no_show'],
  completed: ['cancelled'], // só via fluxo administrativo controlado (reversão)
  cancelled: [],
  no_show: ['confirmed', 'cancelled']
};

export function canTransition(from, to) {
  return Array.isArray(TRANSITIONS[from]) && TRANSITIONS[from].includes(to);
}

// Snapshot histórico do serviço/profissional no momento da criação.
// Garante que alterar o catálogo NÃO altera o histórico financeiro.
export function buildSnapshot(state, serviceId, professionalId) {
  const svc = state.services.find(s => s.id === serviceId);
  const pro = state.professionals.find(p => p.id === professionalId);
  return {
    serviceId: serviceId || null,
    serviceNameSnapshot: svc?.name || null,
    unitPriceSnapshot: typeof svc?.price === 'number' ? svc.price : null,
    durationSnapshot: typeof svc?.durationMinutes === 'number' ? svc.durationMinutes : null,
    professionalId: professionalId || null,
    professionalNameSnapshot: pro?.name || null
  };
}

// Sobreposição de dois intervalos (mesmo dia, minutos).
function overlaps(aStart, aEnd, bStart, bEnd) {
  return !(aEnd <= bStart || bEnd <= aStart);
}

// Verifica conflito de double-booking para um profissional/dia/intervalo.
// Ignora canceladas, no_show e a própria marcação (excludeId).
// Considera também bloqueios (appointments marcados como bloqueio).
export function hasConflict(state, { professionalId, date, startTime, endTime, excludeId }) {
  const sMin = toMinutes(startTime);
  const eMin = toMinutes(endTime);
  return state.appointments.some(a => {
    if (a.id === excludeId) return false;
    if (a.professionalId !== professionalId) return false;
    if (a.date !== date) return false;
    if (a.status === APPT_STATES.CANCELLED || a.status === APPT_STATES.NO_SHOW) return false;
    return overlaps(sMin, eMin, toMinutes(a.startTime), toMinutes(a.endTime));
  });
}

// Validação canónica antes de persistir qualquer criação/reagendamento.
// Lança erro descritivo se houver conflito (duplo agendamento ou bloqueio).
export function assertNoConflict(state, data, excludeId = null) {
  const conflict = hasConflict(state, data, excludeId);
  if (conflict) {
    throw new Error(`Conflito de horário: ${data.professionalId} já ocupado em ${data.date} ${data.startTime}-${data.endTime}.`);
  }
}

// Duração efetiva de uma marcação: usa snapshot se existir, senão catálogo.
export function appointmentDuration(state, a) {
  if (a.durationSnapshot != null) return a.durationSnapshot;
  const svc = state.services.find(s => s.id === a.serviceId);
  return svc?.durationMinutes || toMinutes(a.endTime) - toMinutes(a.startTime) || 30;
}

// Preco a cobrar por uma marcacao. Uma regra so, usada pelo ecra de pagamento
// e por quem grava — se cada lado decidir por si, o barbeiro ve um valor no
// ecra e a caixa fica com outro, que foi exactamente o que acontecia:
//
//   • corte gratis do cartao -> zero, nao ha nada a cobrar
//   • ha preco guardado na marcacao -> e esse, mesmo que o servico tenha
//     mudado de preco entretanto. O que foi combinado com o cliente e o que
//     estava na altura em que ele marcou
//   • nao ha -> o preco actual do servico
export function precoDaMarcacao(a, servico) {
  if (a?.usaRecompensa) return 0;
  const guardado = a?.unitPriceSnapshot;
  if (guardado != null) return Number(guardado) || 0;
  return Number(servico?.price || 0);
}

export { toMinutes, toTime };