import React, { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, XCircle, Clock } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import { Card, EmptyState, Badge } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { todayStr, addDays, formatDateShortNum } from '@/lib/format';

export default function RepAppointments() {
  const data = useStore();
  const [from, setFrom] = useState(addDays(todayStr(), -29));
  const [to, setTo] = useState(todayStr());
  const inRange = (d) => d >= from && d <= to;
  const appts = useMemo(() => data.appointments.filter(a => inRange(a.date) && !a.blocked), [data.appointments, from, to]);

  const byStatus = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
  appts.forEach(a => { byStatus[a.status] = (byStatus[a.status] || 0) + 1; });
  const byPro = {}; appts.forEach(a => { byPro[a.professionalId] = (byPro[a.professionalId] || 0) + 1; });
  const bySvc = {}; appts.forEach(a => { bySvc[a.serviceId] = (bySvc[a.serviceId] || 0) + 1; });

  return (
    <AdminPage title="Relatório de Marcações" subtitle="Estados, profissionais e serviços.">
      <div className="flex gap-8 mb-24" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="date" className="input" style={{ width: 'auto' }} value={from} onChange={e => setFrom(e.target.value)} />
        <input type="date" className="input" style={{ width: 'auto' }} value={to} onChange={e => setTo(e.target.value)} />
      </div>
      <div className="kpi-grid">
        <Card className="kpi"><CalendarDays className="icon" size={22} /><div className="label">Total</div><div className="value">{appts.length}</div></Card>
        <Card className="kpi"><Clock className="icon" size={22} /><div className="label">Pendentes</div><div className="value">{byStatus.pending}</div></Card>
        <Card className="kpi"><CheckCircle2 className="icon" size={22} /><div className="label">Concluídas</div><div className="value">{byStatus.completed}</div></Card>
        <Card className="kpi"><XCircle className="icon" size={22} /><div className="label">Canceladas</div><div className="value">{byStatus.cancelled}</div></Card>
      </div>
      <div className="grid-2 mt-16">
        <Card className="card-pad">
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>Por profissional</h3>
          {Object.keys(byPro).length === 0 ? <EmptyState icon={() => <CalendarDays />} title="Sem dados" description="Não há marcações por profissional neste período." /> : (
            <div className="flex-col gap-8">{Object.entries(byPro).map(([id, n]) => (
              <div key={id} className="flex justify-between text-sm"><span>{data.professionals.find(p => p.id === id)?.name || '—'}</span><span className="fw-600">{n}</span></div>
            ))}</div>
          )}
        </Card>
        <Card className="card-pad">
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>Por serviço</h3>
          {Object.keys(bySvc).length === 0 ? <EmptyState icon={() => <CalendarDays />} title="Sem dados" description="Não há marcações por serviço neste período." /> : (
            <div className="flex-col gap-8">{Object.entries(bySvc).sort((a, b) => b[1] - a[1]).map(([id, n]) => (
              <div key={id} className="flex justify-between text-sm"><span>{data.services.find(s => s.id === id)?.name || '—'}</span><span className="fw-600">{n}</span></div>
            ))}</div>
          )}
        </Card>
      </div>
    </AdminPage>
  );
}