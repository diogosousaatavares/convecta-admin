import React, { useMemo, useState } from 'react';
import { TrendingUp, ShoppingBag, Package, Repeat, Wallet } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import { Card, EmptyState, Badge } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatPrice, todayStr, addDays } from '@/lib/format';

export default function FinRevenue() {
  const data = useStore();
  const [from, setFrom] = useState(addDays(todayStr(), -29));
  const [to, setTo] = useState(todayStr());

  const inRange = (d) => d >= from && d <= to;

  const sales = useMemo(() => data.appointments.filter(a => a.status === 'completed' && a.payment && inRange(a.date)), [data.appointments, from, to]);
  // As vendas de produtos sao receita e tinham-se perdido: viviam so na
  // memoria do browser e nenhuma pagina as lia.
  const vendas = useMemo(() => (data.sales || []).filter(v => inRange(v.date || (v.soldAt || '').slice(0, 10))), [data.sales, from, to]);
  // As entradas de caixa que vieram de uma venda de produtos ja estao
  // contadas na linha dos produtos; contá-las outra vez em "outras" era
  // somar o mesmo dinheiro duas vezes.
  const idsDeVenda = useMemo(() => new Set(vendas.map(v => v.id)), [vendas]);
  const movesIn = useMemo(() => (data.cashMovements || []).filter(m => m.type === 'in'
    && inRange((m.createdAt || '').slice(0, 10))
    && !/^Venda de produtos/.test(m.description || '')), [data.cashMovements, from, to, idsDeVenda]);

  const servicesRev = sales.reduce((s, a) => s + (a.payment.baseAmount - (a.payment.discountAmount || 0)), 0);
  const tipsRev = sales.reduce((s, a) => s + (a.payment.tip || 0), 0);
  const produtosRev = vendas.reduce((s, v) => s + Number(v.total || 0), 0);
  const otherRev = movesIn.reduce((s, m) => s + Number(m.amount || 0), 0);
  const total = servicesRev + tipsRev + produtosRev + otherRev;

  const rows = [
    { icon: ShoppingBag, label: 'Serviços', value: servicesRev },
    { icon: Wallet, label: 'Gorjetas', value: tipsRev },
    { icon: Package, label: 'Produtos', value: produtosRev },
    { icon: Repeat, label: 'Outras entradas', value: otherRev }
  ];

  return (
    <AdminPage title="Receitas" subtitle="Receitas do período, por origem.">
      <div className="flex gap-8 mb-24" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="date" className="input" style={{ width: 'auto' }} value={from} onChange={e => setFrom(e.target.value)} />
        <input type="date" className="input" style={{ width: 'auto' }} value={to} onChange={e => setTo(e.target.value)} />
      </div>
      <div className="kpi-grid">
        <Card className="kpi"><TrendingUp className="icon" size={22} /><div className="label">Receita total</div><div className="value gold">{formatPrice(total)}</div></Card>
        <Card className="kpi"><ShoppingBag className="icon" size={22} /><div className="label">Serviços</div><div className="value">{formatPrice(servicesRev)}</div></Card>
        <Card className="kpi"><Wallet className="icon" size={22} /><div className="label">Gorjetas</div><div className="value">{formatPrice(tipsRev)}</div></Card>
        <Card className="kpi"><Package className="icon" size={22} /><div className="label">Produtos</div><div className="value">{formatPrice(produtosRev)}</div></Card>
        <Card className="kpi"><Repeat className="icon" size={22} /><div className="label">Outras</div><div className="value">{formatPrice(otherRev)}</div></Card>
      </div>
      <Card className="card-pad">
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Vendas concluídas no período</h3>
        {sales.length === 0 ? <EmptyState icon={() => <TrendingUp />} title="Sem vendas" description="Sem marcações concluídas com pagamento no período." /> : (
          <table className="table">
            <thead><tr><th>Data</th><th>Cliente</th><th>Serviço</th><th>Líquido</th><th>Gorjeta</th><th>Total</th><th>Método</th></tr></thead>
            <tbody>
              {sales.map(a => (
                <tr key={a.id}>
                  <td className="text-xs">{a.date}</td>
                  <td>{data.customers.find(c => c.id === a.customerId)?.name || '—'}</td>
                  <td>{data.services.find(s => s.id === a.serviceId)?.name}</td>
                  <td>{formatPrice((a.payment.baseAmount || 0) - (a.payment.discountAmount || 0))}</td>
                  <td className="text-sec">{formatPrice(a.payment.tip || 0)}</td>
                  <td className="fw-600">{formatPrice(a.payment.total)}</td>
                  <td><Badge variant="default">{a.payment.method}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="card-pad" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Vendas de produtos no período</h3>
        {vendas.length === 0 ? <EmptyState icon={() => <Package />} title="Sem vendas de produtos" description="As vendas registadas em Venda avulso aparecem aqui." /> : (
          <table className="table">
            <thead><tr><th>Data</th><th>Cliente</th><th>Produtos</th><th>Total</th><th>Método</th></tr></thead>
            <tbody>
              {vendas.map(v => (
                <tr key={v.id}>
                  <td className="text-xs">{v.date}</td>
                  <td>{data.customers.find(c => c.id === v.customerId)?.name || '—'}</td>
                  <td className="text-sec text-sm">{(v.items || []).map(i => `${i.qty}× ${i.name}`).join(', ')}</td>
                  <td className="fw-600">{formatPrice(v.total)}</td>
                  <td><Badge variant="default">{v.method || '—'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </AdminPage>
  );
}