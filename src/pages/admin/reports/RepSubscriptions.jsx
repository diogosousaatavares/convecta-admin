import React from 'react';
import { Repeat } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import { Card, EmptyState } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatPrice } from '@/lib/format';

export default function RepSubscriptions() {
  const data = useStore();
  const plans = data.subscriptionPlans || [];
  const subs = data.subscriptions || [];
  const payments = data.subscriptionPayments || [];
  const active = subs.filter(s => s.status === 'active').length;
  const overdue = subs.filter(s => s.status === 'overdue').length;
  const revenue = payments.reduce((s, p) => s + Number(p.amount || 0), 0);

  return (
    <AdminPage title="Relatório de Subscrições" subtitle="Desempenho dos planos e subscritores.">
      <div className="kpi-grid">
        <Card className="kpi"><Repeat className="icon" size={22} /><div className="label">Planos</div><div className="value">{plans.length}</div></Card>
        <Card className="kpi"><div className="label">Subscritores</div><div className="value">{subs.length}</div></Card>
        <Card className="kpi"><div className="label">Ativos</div><div className="value">{active}</div></Card>
        <Card className="kpi"><div className="label">Receita subscrições</div><div className="value gold">{formatPrice(revenue)}</div></Card>
      </div>
      <Card className="card-pad mt-16">
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Planos</h3>
        {plans.length === 0 ? <EmptyState icon={() => <Repeat />} title="Sem planos" description="Cria planos em Subscrições." /> : (
          <table className="table">
            <thead><tr><th>Plano</th><th>Preço</th><th>Periodicidade</th><th>Subscritores</th></tr></thead>
            <tbody>{plans.map(p => (
              <tr key={p.id}><td className="fw-600">{p.name}</td><td>{formatPrice(p.price)}</td><td className="text-sec">{p.period || '—'}</td><td>{subs.filter(s => s.planId === p.id).length}</td></tr>
            ))}</tbody>
          </table>
        )}
      </Card>
    </AdminPage>
  );
}