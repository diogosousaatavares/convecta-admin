import React, { useMemo, useState } from 'react';
import { Users, UserPlus, Repeat } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import { Card, EmptyState } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatPrice, todayStr, addDays } from '@/lib/format';

export default function RepClients() {
  const data = useStore();
  const [from, setFrom] = useState(addDays(todayStr(), -29));
  const [to, setTo] = useState(todayStr());
  const inRange = (d) => d >= from && d <= to;

  const newClients = data.customers.filter(c => (c.joinedAt || '') >= from && (c.joinedAt || '') <= to);
  const activeIds = useMemo(() => new Set(data.appointments.filter(a => inRange(a.date) && a.status !== 'cancelled').map(a => a.customerId)), [data.appointments, from, to]);
  const recurring = data.customers.filter(c => {
    const cnt = data.appointments.filter(a => a.customerId === c.id && inRange(a.date) && a.status !== 'cancelled').length;
    return cnt >= 2;
  });
  const totalSpent = data.customers.reduce((s, c) => s + (c.totalSpent || 0), 0);

  return (
    <AdminPage title="Relatório de Clientes" subtitle="Novos, ativos, recorrentes e gastos.">
      <div className="flex gap-8 mb-24" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="date" className="input" style={{ width: 'auto' }} value={from} onChange={e => setFrom(e.target.value)} />
        <input type="date" className="input" style={{ width: 'auto' }} value={to} onChange={e => setTo(e.target.value)} />
      </div>
      <div className="kpi-grid">
        <Card className="kpi"><Users className="icon" size={22} /><div className="label">Total clientes</div><div className="value">{data.customers.length}</div></Card>
        <Card className="kpi"><UserPlus className="icon" size={22} /><div className="label">Novos (período)</div><div className="value">{newClients.length}</div></Card>
        <Card className="kpi"><Repeat className="icon" size={22} /><div className="label">Recorrentes (período)</div><div className="value">{recurring.length}</div></Card>
        <Card className="kpi"><div className="label">Total gasto (acumulado)</div><div className="value gold">{formatPrice(totalSpent)}</div></Card>
      </div>
      <Card className="card-pad mt-16">
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Clientes ativos no período ({activeIds.size})</h3>
        {activeIds.size === 0 ? <EmptyState title="Sem clientes ativos" /> : (
          <div className="flex-col gap-8">{data.customers.filter(c => activeIds.has(c.id)).map(c => (
            <div key={c.id} className="flex justify-between text-sm"><span>{c.name}</span><span className="text-sec">{c.totalAppointments} visitas · {formatPrice(c.totalSpent)}</span></div>
          ))}</div>
        )}
      </Card>
    </AdminPage>
  );
}