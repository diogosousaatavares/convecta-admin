import React, { useMemo, useState } from 'react';
import { TrendingUp, Award, Users, Percent } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Avatar, EmptyState } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatPrice, todayStr, addDays } from '@/lib/format';
import { resumoProfissional } from '@/lib/domain/finance';

export default function ProPerformance({ titulo = 'Desempenho dos Profissionais', subtitulo = 'Indicadores calculados a partir das marcações reais.' }) {
  const data = useStore();
  const [from, setFrom] = useState(addDays(todayStr(), -29));
  const [to, setTo] = useState(todayStr());

  const inRange = (d) => d >= from && d <= to;
  const appts = data.appointments.filter(a => inRange(a.date) && !a.blocked);

  // Receita, comissão, gorjetas e marcações pagas: as mesmas contas das
  // Comissões e da Conta do Profissional (resumoProfissional). As marcações
  // «na agenda» e as canceladas contam-se pela data da marcação.
  const rows = useMemo(() => data.professionals.map(p => {
    const r = resumoProfissional(data, p.id, { from, to });
    const pa = appts.filter(a => a.professionalId === p.id);
    return { p, total: pa.length, done: r.marcacoes, cancelled: pa.filter(a => a.status === 'cancelled').length, revenue: r.receita, commission: r.comissao, tips: r.gorjetas, clients: r.clientes, ticket: r.ticket };
  }), [data, appts, from, to]);

  return (
    <AdminPage title={titulo} subtitle={subtitulo}>
      <div className="flex gap-8 mb-24" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="date" className="input" style={{ width: 'auto' }} value={from} onChange={e => setFrom(e.target.value)} />
        <input type="date" className="input" style={{ width: 'auto' }} value={to} onChange={e => setTo(e.target.value)} />
      </div>
      {data.professionals.length === 0 ? (
        <Card className="card-pad"><EmptyState icon={() => <Award />} title="Sem profissionais" /></Card>
      ) : (
        <Card className="card-pad">
          <p className="text-sec text-xs mb-12">Receita sem gorjetas, pela data do pagamento. Os mesmos números das Comissões e da Conta do Profissional.</p>
          <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead><tr><th>Profissional</th><th>Na agenda</th><th>Pagas</th><th>Canceladas</th><th>Receita</th><th>Comissão</th><th>Gorjetas</th><th>Clientes</th><th>Ticket médio</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.p.id}>
                  <td><div className="flex items-center gap-8"><Avatar name={r.p.name} /><span className="fw-600 text-sm">{r.p.name}</span></div></td>
                  <td>{r.total}</td>
                  <td>{r.done}</td>
                  <td>{r.cancelled}</td>
                  <td className="fw-600">{formatPrice(r.revenue)}</td>
                  <td className="text-gold fw-600">{formatPrice(r.commission)}</td>
                  <td>{formatPrice(r.tips)}</td>
                  <td>{r.clients}</td>
                  <td>{formatPrice(r.ticket)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      )}
    </AdminPage>
  );
}