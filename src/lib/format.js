// Formatação PT-PT
const MONTHS = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const DOWS = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
const DOWS_SHORT = ['dom','seg','ter','qua','qui','sex','sáb'];

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return `${DOWS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}
export function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}
export function formatDateNum(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
export function formatDateShortNum(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}
export function formatDowShortNum(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const cap = DOWS_SHORT[d.getDay()].charAt(0).toUpperCase() + DOWS_SHORT[d.getDay()].slice(1);
  return `${cap} ${formatDateNum(dateStr)}`;
}
import { formatMoney } from '@/lib/domain/money';

export function formatPrice(value) {
  return formatMoney(value);
}
export function formatTime(t) {
  return t;
}
export function getDowShort(date) {
  return DOWS_SHORT[date.getDay()];
}
export function getMonthShort(date) {
  return MONTHS_SHORT[date.getMonth()];
}
function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function todayStr() {
  return localDateStr(new Date());
}
export function dateToStr(d) {
  return localDateStr(d);
}
export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return dateToStr(d);
}
export function isMoreThan2HoursFuture(dateStr, timeStr) {
  const dt = new Date(dateStr + 'T' + timeStr + ':00');
  return dt.getTime() - Date.now() > 2 * 3600 * 1000;
}
export { DOWS, DOWS_SHORT, MONTHS, MONTHS_SHORT };