import React, { useMemo, useState } from 'react';
import { Users, UserPlus, Repeat } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { Card, EmptyState } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatPrice, todayStr, addDays } from '@/lib/format';
import { paidAppointments, resumoCliente } from '@/lib/domain/finance';
import { round2 } from '@/lib/domain/money';

// Ativo no período = teve uma visita paga no período.
// Recorrente = cliente ativo que já tem 2 ou mais visitas pagas (no total).
// Total gasto = serviços sem gorjeta + produtos + packs (resumoCliente).
export default function RepClients() {
  const data = useStore();
  const [from, setFrom] = useState(addDays(todayStr(), -29));
  const [to, setTo] = useState(todayStr());

  const newClients = data.customers.filter(c => (c.joinedAt || '') >= from && (c.joinedAt || '') <= to);
  const ativos = useMemo(() => {
    const ids = new Set(paidAppointments(data, { from, to }).map(a => a.customerId).filter(Boolean));
    return data.customers.filter(c => ids.has(c.id)).map(c => ({ c, r: resumoCliente(data, c.id) }))
      .sort((a, b) => b.r.totalGasto - a.r.totalGasto);
  }, [data, from, to]);
  const recorrentes = ativos.filter(x => x.r.visitas >= 2);
  const totalGasto = round2(data.customers.reduce((s, c) => s + resumoCliente(data, c.id).totalGasto, 0));

  return (
    <AdminPage title="Relatório de Clientes" subtitle="Novos, ativos, recorrentes e gastos.">
      <div className="flex gap-8 mb-24" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="date" className="input" style={{ width: 'auto' }} value={from} onChange={e => setFrom(e.target.value)} />
        <input type="date" className="input" style={{ width: 'auto' }} value={to} onChange={e => setTo(e.target.value)} />
      </div>
      <div className="kpi-grid">
        <Card className="kpi"><Users className="icon" size={22} /><div className="label">Total clientes</div><div className="value">{data.customers.length}</div></Card>
        <Card className="kpi"><UserPlus className="icon" size={22} /><div className="label">Novos (período)</div><div className="value">{newClients.length}</div></Card>
        <Card className="kpi"><Repeat className="icon" size={22} /><div className="label">Recorrentes (2+ visitas)</div><div className="value">{recorrentes.length}</div></Card>
        <Card className="kpi"><div className="label">Total gasto (acumulado)</div><div className="value gold">{formatPrice(totalGasto)}</div></Card>
      </div>
      <Card className="card-pad mt-16">
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Clientes com visita paga no período ({ativos.length})</h3>
        {ativos.length === 0 ? <EmptyState title="Sem clientes ativos" /> : (
          <div className="flex-col gap-8">{ativos.map(({ c, r }) => (
            <div key={c.id} className="flex justify-between text-sm" style={{ gap: 12 }}>
              <span>{c.name}</span>
              <span className="text-sec">{r.visitas} {r.visitas === 1 ? 'visita' : 'visitas'} · {formatPrice(r.totalGasto)}{r.produtos > 0 ? ` (produtos ${formatPrice(r.produtos)})` : ''}</span>
            </div>
          ))}</div>
        )}
        <p className="text-sec text-xs mt-16">Total gasto: serviços (sem gorjetas) + produtos + packs.</p>
      </Card>
    </AdminPage>
  );
}
