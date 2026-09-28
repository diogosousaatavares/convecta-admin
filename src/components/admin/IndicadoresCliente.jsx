import React from 'react';

/*
 * Os sinais que aparecem ao lado do nome do cliente, na agenda.
 *
 * Viviam dentro do AgendaCalendar e em mais lado nenhum — por isso a agenda
 * do telemovel nunca os teve. E no computador ficavam numa linha propria, por
 * baixo do nome: num bloco de 30 minutos (48px) a linha caia fora do bloco,
 * que tem overflow:hidden, e nas marcacoes curtas estavam escondidos de
 * proposito. Resultado: o barbeiro quase nunca os via.
 *
 * Agora sao um so componente, vao ao lado do nome (nao por baixo) e servem as
 * duas agendas. 28/09/2026.
 */

export function indicadoresDoCliente(a, cust, data) {
  if (!cust || a?.blocked) return [];
  const hojeMD = new Date().toISOString().slice(5, 10);
  const marcacoes = (data.appointments || []).filter(
    c => c.customerId === cust.id && c.status !== 'cancelled'
  );
  const sinais = [];
  if (cust.birthDate && cust.birthDate.slice(5, 10) === hojeMD) sinais.push({ k: 'aniv', e: '🎂', t: 'Aniversariante' });
  if (marcacoes.length === 1) sinais.push({ k: 'primeira', e: '⭐', t: '1.ª marcação' });
  if (a.couponCode || a.payment?.coupon) sinais.push({ k: 'cupao', e: '🏷️', t: 'Cupão aplicado' });
  if ((data.subscriptions || []).some(s => s.customerId === cust.id && s.status === 'active')) sinais.push({ k: 'assinatura', e: '📦', t: 'Assinatura ativa' });
  if ((cust.loyalty?.totalStamps || 0) > 0) sinais.push({ k: 'fidelidade', e: '💳', t: 'Fidelidade' });
  return sinais;
}

export default function IndicadoresCliente({ appt, cliente, data }) {
  const sinais = indicadoresDoCliente(appt, cliente, data);
  if (sinais.length === 0) return null;
  return (
    <span className="ag-b-indicators">
      {sinais.map(s => <span key={s.k} className="ag-ind" title={s.t}>{s.e}</span>)}
    </span>
  );
}
