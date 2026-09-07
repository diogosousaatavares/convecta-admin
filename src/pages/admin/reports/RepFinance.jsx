import React, { useMemo, useState } from 'react';
import { Wallet, TrendingDown, TrendingUp, Receipt } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import { Card, EmptyState } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatPrice, todayStr, addDays } from '@/lib/format';

export default function RepFinance() {
  const data = useStore();
  const [from, setFrom] = useState(addDays(todayStr(), -29));
  const [to, setTo] = useState(todayStr());
  const inRange = (d) => d >= from && d <= to;

  const sales = useMemo(() => data.appointments.filter(a => a.status === 'completed' && a.payment && inRange(a.date)), [data.appointments, from, to]);
  const revenue = sales.reduce((s, a) => s + (a.payment.total || 0), 0);
  const expenses = (data.expenses || []).filter(e => inRange((e.createdAt || '').slice(0, 10))).reduce((s, e) => s + Number(e.amount || 0), 0);
  const movesIn = (data.cashMovements || []).filter(m => m.type === 'in' && inRange((m.createdAt || '').slice(0, 10))).reduce((s, m) => s + Number(m.amount || 0), 0);
  const movesOut = (data.cashMovements || []).filter(m => m.type === 'out' && inRange((m.createdAt || '').slice(0, 10))).reduce((s, m) => s + Number(m.amount || 0), 0);
  const result = revenue + movesIn - expenses - movesOut;

  return (
    <AdminPage title="Relatório Financeiro" subtitle="Receita, despesas e resultado.">
      <div className="flex gap-8 mb-24" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="date" className="input" style={{ width: 'auto' }} value={from} onChange={e => setFrom(e.target.value)} />
        <input type="date" className="input" style={{ width: 'auto' }} value={to} onChange={e => setTo(e.target.value)} />
      </div>
      <div className="kpi-grid">
        <Card className="kpi"><Wallet className="icon" size={22} /><div className="label">Receita (vendas)</div><div className="value gold">{formatPrice(revenue)}</div></Card>
        <Card className="kpi"><TrendingUp className="icon" size={22} /><div className="label">Outras entradas</div><div className="value">{formatPrice(movesIn)}</div></Card>
        <Card className="kpi"><TrendingDown className="icon" size={22} /><div className="label">Despesas</div><div className="value">{formatPrice(expenses)}</div></Card>
        <Card className="kpi"><Receipt className="icon" size={22} /><div className="label">Resultado</div><div className="value gold">{formatPrice(result)}</div></Card>
      </div>
      <Card className="card-pad mt-16">
        {sales.length === 0 ? <EmptyState title="Sem vendas no período" /> : (
          <table className="table">
            <thead><tr><th>Data</th><th>Cliente</th><th>Serviço</th><th>Total</th><th>Método</th></tr></thead>
            <tbody>{sales.map(a => (
              <tr key={a.id}><td className="text-xs">{a.date}</td><td>{data.customers.find(c => c.id === a.customerId)?.name || '—'}</td><td>{data.services.find(s => s.id === a.serviceId)?.name}</td><td className="fw-600">{formatPrice(a.payment.total)}</td><td>{a.payment.method}</td></tr>
            ))}</tbody>
          </table>
        )}
      </Card>
    </AdminPage>
  );
}