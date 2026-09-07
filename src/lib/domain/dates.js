// dates.js — utilitários de data seguros para o fuso Europe/Lisbon.
// Regra: uma "data de calendário local" (ex: '2026-09-01') é representada
// SEM conversão UTC. Nunca usar new Date(...).toISOString().slice(0,10) para
// obter a data local — esse padrão desloca o dia perto da meia-noite.
// Timestamps (openedAt, createdAt, payment.at) continuam como ISO UTC; são
// apenas PARA comparações de ordenação, não para extrair a data de calendário.

export function localDateStr(d) {
  const dd = d instanceof Date ? d : new Date(d);
  const y = dd.getFullYear();
  const m = String(dd.getMonth() + 1).padStart(2, '0');
  const day = String(dd.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayStr() { return localDateStr(new Date()); }

export function parseLocalDate(dateStr) {
  // Data de calendário -> Date à meia-noite LOCAL (sem desvio UTC).
  const [y, m, d] = String(dateStr).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(dateStr, n) {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + n);
  return localDateStr(d);
}

export function daysBetween(fromStr, toStr) {
  const a = parseLocalDate(fromStr).getTime();
  const b = parseLocalDate(toStr).getTime();
  return Math.round((b - a) / 86400000) + 1; // inclusivo
}

// Primeiro e último dia do mês da data indicada (inclusive).
export function monthBounds(dateStr) {
  const d = parseLocalDate(dateStr || todayStr());
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { from: localDateStr(first), to: localDateStr(last) };
}

// Segunda..Domingo da semana da data indicada (inclusive).
export function weekBounds(dateStr) {
  const d = parseLocalDate(dateStr || todayStr());
  const dow = d.getDay(); // 0=dom .. 6=sáb
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((dow + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: localDateStr(monday), to: localDateStr(sunday) };
}

const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
export function dayNameOf(dateStr) { return DAY_NAMES[parseLocalDate(dateStr).getDay()]; }

// Minutos desde meia-noite de uma string "HH:MM".
export function toMinutes(t) { const [h, m] = String(t).split(':').map(Number); return h * 60 + m; }
export function toTime(mins) {
  const h = Math.floor(mins / 60), m = mins % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

// String comparável (local) "YYYY-MM-DDTHH:MM" — só para ordenação/comparação
// de marcações dentro do mesmo dia. Não é um timestamp UTC.
export function localDateTimeStr(dateStr, timeStr) {
  return `${dateStr}T${String(timeStr || '00:00').slice(0, 5)}`;
}