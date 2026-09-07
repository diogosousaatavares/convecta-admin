import React from 'react';
import { Gift, Award } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import { Card, EmptyState } from '@/components/ui';
import { useStore } from '@/hooks/useStore';

export default function RepLoyalty() {
  const data = useStore();
  const movements = data.loyaltyMovements || [];
  const rewards = data.loyaltyRewards || [];
  const totalStamps = data.customers.reduce((s, c) => s + ((c.loyalty?.totalStamps) || 0), 0);
  const rewardsEarned = data.customers.reduce((s, c) => s + ((c.loyalty?.rewardsEarned) || 0), 0);

  return (
    <AdminPage title="Relatório de Fidelização" subtitle="Utilização do programa de fidelização.">
      <div className="kpi-grid">
        <Card className="kpi"><Gift className="icon" size={22} /><div className="label">Carimbos totais</div><div className="value">{totalStamps}</div></Card>
        <Card className="kpi"><Award className="icon" size={22} /><div className="label">Recompensas conquistadas</div><div className="value gold">{rewardsEarned}</div></Card>
        <Card className="kpi"><div className="label">Recompensas ativas</div><div className="value">{rewards.filter(r => r.active).length}</div></Card>
        <Card className="kpi"><div className="label">Movimentos</div><div className="value">{movements.length}</div></Card>
      </div>
      <Card className="card-pad mt-16">
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Movimentos de fidelização</h3>
        {movements.length === 0 ? <EmptyState title="Sem movimentos" description="Os carimbos e resgates aparecem aqui." /> : (
          <div className="flex-col gap-8">{movements.map(m => (
            <div key={m.id} className="flex justify-between text-sm" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span>{data.customers.find(c => c.id === m.customerId)?.name || '—'}</span>
              <span className="text-sec">{m.type} · {new Date(m.createdAt).toLocaleDateString('pt-PT')}</span>
            </div>
          ))}</div>
        )}
      </Card>
    </AdminPage>
  );
}