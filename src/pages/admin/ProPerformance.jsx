import React, { useMemo, useState } from 'react';
import { TrendingUp, Award, Users, Percent } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Avatar, EmptyState } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatPrice, todayStr, addDays } from '@/lib/format';

export default function ProPerformance() {
  const data = useStore();
  const [from, setFrom] = useState(addDays(todayStr(), -29));
  const [to, setTo] = useState(todayStr());

  const inRange = (d) => d >= from && d <= to;
  const appts = data.appointments.filter(a => inRange(a.date) && !a.blocked);

  const rows = useMemo(() => data.professionals.map(p => {
    const pa = appts.filter(a => a.professionalId === p.id);
    const done = pa.filter(a => a.status === 'completed');
    const cancelled = pa.filter(a => a.status === 'cancelled');
    const revenue = done.reduce((s, a) => s + (a.payment?.total || data.services.find(x => x.id === a.serviceId)?.price || 0), 0);
    const commission = done.reduce((s, a) => {
      const base = a.payment?.baseAmount || data.services.find(x => x.id === a.serviceId)?.price || 0;
      const disc = a.payment?.discountAmount || 0;
      return s + (base - disc) * (p.commission || 0) / 100;
    }, 0);
    const clients = new Set(pa.map(a => a.customerId)).size;
    const ticket = done.length ? revenue / done.length : 0;
    return { p, total: pa.length, done: done.length, cancelled: cancelled.length, revenue, commission, clients, ticket };
  }), [appts, data.services, data.professionals]);

  return (
    <AdminPage title="Desempenho dos Profissionais" subtitle="Indicadores calculados a partir das marcações reais.">
      <div className="flex gap-8 mb-24" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="date" className="input" style={{ width: 'auto' }} value={from} onChange={e => setFrom(e.target.value)} />
        <input type="date" className="input" style={{ width: 'auto' }} value={to} onChange={e => setTo(e.target.value)} />
      </div>
      {data.professionals.length === 0 ? (
        <Card className="card-pad"><EmptyState icon={() => <Award />} title="Sem profissionais" /></Card>
      ) : (
        <Card className="card-pad">
          <table className="table">
            <thead><tr><th>Profissional</th><th>Marcações</th><th>Concluídas</th><th>Canceladas</th><th>Receita</th><th>Comissão</th><th>Clientes</th><th>Ticket médio</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.p.id}>
                  <td><div className="flex items-center gap-8"><Avatar name={r.p.name} /><span className="fw-600 text-sm">{r.p.name}</span></div></td>
                  <td>{r.total}</td>
                  <td>{r.done}</td>
                  <td>{r.cancelled}</td>
                  <td className="fw-600">{formatPrice(r.revenue)}</td>
                  <td className="text-gold fw-600">{formatPrice(r.commission)}</td>
                  <td>{r.clients}</td>
                  <td>{formatPrice(r.ticket)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </AdminPage>
  );
}