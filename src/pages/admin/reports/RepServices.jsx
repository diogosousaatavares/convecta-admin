import React, { useMemo, useState } from 'react';
import { Scissors } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import { Card, EmptyState } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatPrice, todayStr, addDays } from '@/lib/format';

export default function RepServices() {
  const data = useStore();
  const [from, setFrom] = useState(addDays(todayStr(), -29));
  const [to, setTo] = useState(todayStr());
  const inRange = (d) => d >= from && d <= to;

  const rows = useMemo(() => {
    const appts = data.appointments.filter(a => inRange(a.date) && a.status !== 'cancelled' && !a.blocked);
    return data.services.map(s => {
      const pa = appts.filter(a => a.serviceId === s.id);
      const revenue = pa.reduce((sum, a) => sum + (a.payment?.total || s.price || 0), 0);
      return { s, count: pa.length, revenue };
    }).sort((a, b) => b.count - a.count);
  }, [data.appointments, data.services, from, to]);

  return (
    <AdminPage title="Relatório de Serviços" subtitle="Mais e menos vendidos, faturação por serviço.">
      <div className="flex gap-8 mb-24" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="date" className="input" style={{ width: 'auto' }} value={from} onChange={e => setFrom(e.target.value)} />
        <input type="date" className="input" style={{ width: 'auto' }} value={to} onChange={e => setTo(e.target.value)} />
      </div>
      {rows.length === 0 ? <Card className="card-pad"><EmptyState icon={() => <Scissors />} title="Sem serviços" /></Card> : (
        <Card className="card-pad">
          <table className="table">
            <thead><tr><th>Serviço</th><th>Categoria</th><th>Marcações</th><th>Faturação</th><th>Preço</th></tr></thead>
            <tbody>{rows.map(r => (
              <tr key={r.s.id}><td className="fw-600">{r.s.name}</td><td className="text-sec">{r.s.category}</td><td>{r.count}</td><td className="fw-600">{formatPrice(r.revenue)}</td><td>{formatPrice(r.s.price)}</td></tr>
            ))}</tbody>
          </table>
        </Card>
      )}
    </AdminPage>
  );
}