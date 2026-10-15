import React from 'react';
import { todayStr } from '@/lib/format';

/*
 * A VISTA MÊS (15/10/2026, à Fresha).
 *
 * Um quadrado por dia, com as primeiras marcações e «+N» quando há mais.
 * Tocar num dia abre esse dia na vista Dia. Não se marca daqui: o mês é
 * para ver o mês, o dia é para mexer.
 */
const SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const pad = n => String(n).padStart(2, '0');

export default function AgendaMes({ date, appts, customers, professionals, filtroPro, onDia }) {
  const base = new Date(date + 'T00:00:00');
  const ano = base.getFullYear(), mes = base.getMonth();
  const primeiro = new Date(ano, mes, 1);
  const inicio = new Date(primeiro); inicio.setDate(1 - ((primeiro.getDay() + 6) % 7)); // segunda
  const dias = [];
  for (let i = 0; i < 42; i++) { const d = new Date(inicio); d.setDate(inicio.getDate() + i); dias.push(d); }
  const hoje = todayStr();
  const porDia = {};
  for (const a of appts) {
    if (a.status === 'cancelled' || a.blocked) continue;
    if (filtroPro && a.professionalId !== filtroPro) continue;
    (porDia[a.date] = porDia[a.date] || []).push(a);
  }
  const nome = id => (customers.find(c => c.id === id)?.name || '—').split(' ')[0];
  return (
    <div className="ag-mes">
      <div className="ag-mes-cab">{SEMANA.map(s => <div key={s}>{s}</div>)}</div>
      <div className="ag-mes-grelha">
        {dias.map(d => {
          const ds = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
          const lista = (porDia[ds] || []).sort((x, y) => x.startTime.localeCompare(y.startTime));
          const fora = d.getMonth() !== mes;
          return (
            <button key={ds} type="button" className={`ag-mes-dia${fora ? ' fora' : ''}${ds === hoje ? ' hoje' : ''}${ds === date ? ' sel' : ''}`} onClick={() => onDia(ds)}>
              <span className="ag-mes-n">{d.getDate()}</span>
              {lista.slice(0, 3).map(a => (
                <span key={a.id} className={`ag-mes-m ${a.status}`}>{a.startTime} {nome(a.customerId)}</span>
              ))}
              {lista.length > 3 && <span className="ag-mes-mais">+{lista.length - 3}</span>}
              {lista.length > 0 && <span className="ag-mes-conta">{lista.length}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
