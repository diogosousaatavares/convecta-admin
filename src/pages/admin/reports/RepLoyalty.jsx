import React, { useMemo, useState } from 'react';
import { Gift, Award } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { Card, EmptyState, Badge } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { todayStr, addDays, formatDateShortNum } from '@/lib/format';
import { paidAppointments } from '@/lib/domain/finance';

// Os movimentos vêm das marcações pagas — é aí que o carimbo é dado (ou o
// corte grátis é gasto). A lista antiga lia uma tabela que nunca era
// escrita: 4 carimbos e «0 movimentos».
export default function RepLoyalty() {
  const data = useStore();
  const [from, setFrom] = useState(addDays(todayStr(), -29));
  const [to, setTo] = useState(todayStr());
  const ligado = data.business?.loyalty?.ativo === true;

  const movimentos = useMemo(() => paidAppointments(data, { from, to })
    .filter(a => a.customerId && (!a.usaPack || data.business?.packs?.carimbos === true))
    .map(a => ({ id: a.id, data: a.date, cliente: data.customers.find(c => c.id === a.customerId)?.name || '—', tipo: a.usaRecompensa ? 'resgate' : 'carimbo' }))
    .sort((a, b) => b.data.localeCompare(a.data)), [data, from, to]);

  const carimbos = movimentos.filter(m => m.tipo === 'carimbo').length;
  const resgates = movimentos.filter(m => m.tipo === 'resgate').length;
  const totalStamps = data.customers.reduce((s, c) => s + ((c.loyalty?.totalStamps) || 0), 0);
  const rewardsEarned = data.customers.reduce((s, c) => s + ((c.loyalty?.rewardsEarned) || 0), 0);

  return (
    <AdminPage title="Relatório de Fidelização" subtitle="Carimbos dados e cortes grátis usados.">
      <div className="flex gap-8 mb-24" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="date" className="input" style={{ width: 'auto' }} value={from} onChange={e => setFrom(e.target.value)} />
        <input type="date" className="input" style={{ width: 'auto' }} value={to} onChange={e => setTo(e.target.value)} />
      </div>
      {!ligado && <p className="text-sec text-sm mb-16">O cartão de fidelidade está desligado para esta barbearia.</p>}
      <div className="kpi-grid">
        <Card className="kpi"><Gift className="icon" size={22} /><div className="label">Carimbos no período</div><div className="value">{carimbos}</div></Card>
        <Card className="kpi"><Award className="icon" size={22} /><div className="label">Cortes grátis usados</div><div className="value gold">{resgates}</div></Card>
        <Card className="kpi"><div className="label">Carimbos (desde sempre)</div><div className="value">{totalStamps}</div></Card>
        <Card className="kpi"><div className="label">Prémios ganhos (desde sempre)</div><div className="value">{rewardsEarned}</div></Card>
      </div>
      <Card className="card-pad mt-16">
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Movimentos no período</h3>
        {movimentos.length === 0 ? <EmptyState title="Sem movimentos" description="Cada corte pago dá um carimbo; os cortes grátis aparecem como resgate." /> : (
          <div className="flex-col gap-8">{movimentos.map(m => (
            <div key={m.id} className="flex justify-between items-center text-sm" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span>{m.cliente}</span>
              <span className="flex items-center gap-8"><Badge variant={m.tipo === 'resgate' ? 'gold' : 'default'}>{m.tipo === 'resgate' ? 'Corte grátis' : 'Carimbo'}</Badge><span className="text-sec">{formatDateShortNum(m.data)}</span></span>
            </div>
          ))}</div>
        )}
        <p className="text-sec text-xs mt-16">{data.business?.packs?.carimbos === true ? 'Os cortes do pack também dão carimbo.' : 'Cortes pagos com pack não dão carimbo.'}</p>
      </Card>
    </AdminPage>
  );
}
