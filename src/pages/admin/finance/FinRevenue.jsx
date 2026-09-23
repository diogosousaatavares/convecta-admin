import React, { useMemo, useState } from 'react';
import { TrendingUp, ShoppingBag, Package, Repeat, Wallet, Scissors } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import { Card, EmptyState, Badge } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatPrice, todayStr, addDays } from '@/lib/format';
import { paidAppointments, vendasDeProdutos, vendasDePacks, netOfPayment, entradasAvulsas } from '@/lib/domain/finance';

export default function FinRevenue() {
  const data = useStore();
  const [from, setFrom] = useState(addDays(todayStr(), -29));
  const [to, setTo] = useState(todayStr());

  const inRange = (d) => d >= from && d <= to;

  // Pela data do PAGAMENTO, como a caixa e o painel — cobrar hoje um corte de
  // amanha e receita de hoje, que e quando o dinheiro entra.
  const sales = useMemo(() => paidAppointments(data, { from, to }), [data, from, to]);
  // As vendas de produtos sao receita e tinham-se perdido: viviam so na
  // memoria do browser e nenhuma pagina as lia.
  const vendas = useMemo(() => vendasDeProdutos(data, { from, to }), [data, from, to]);
  // As entradas de caixa que vieram de uma venda de produtos ja estao
  // contadas na linha dos produtos; contá-las outra vez em "outras" era
  // somar o mesmo dinheiro duas vezes.
  const idsDeVenda = useMemo(() => new Set(vendas.map(v => v.id)), [vendas]);
  // Os packs contam no dia em que foram pagos (os cortes com pack ficam a 0 €).
  const packs = useMemo(() => vendasDePacks(data, { from, to }), [data, from, to]);
  const movesIn = useMemo(() => entradasAvulsas(data, { from, to }).filter(m => !/^Venda de produtos/.test(m.descricao || '')), [data, from, to, idsDeVenda]);

  const servicesRev = sales.reduce((s, a) => s + netOfPayment(a), 0);
  const tipsRev = sales.reduce((s, a) => s + (a.payment.tip || 0), 0);
  const produtosRev = vendas.reduce((s, v) => s + Number(v.total || 0), 0);
  const otherRev = movesIn.reduce((s, m) => s + Number(m.valor || 0), 0);
  const packsRev = packs.reduce((s, v) => s + Number(v.total || 0), 0);
  // Receita da barbearia = serviços + produtos + packs — a mesma do painel e
  // dos relatórios. As gorjetas são do barbeiro e as entradas avulsas não são
  // vendas: aparecem, mas à parte.
  const total = servicesRev + produtosRev + packsRev;

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
        <Card className="kpi"><TrendingUp className="icon" size={22} /><div className="label">Receita (serviços + produtos + packs)</div><div className="value gold">{formatPrice(total)}</div></Card>
        <Card className="kpi"><ShoppingBag className="icon" size={22} /><div className="label">Serviços</div><div className="value">{formatPrice(servicesRev)}</div></Card>
        <Card className="kpi"><Wallet className="icon" size={22} /><div className="label">Gorjetas (dos barbeiros, à parte)</div><div className="value">{formatPrice(tipsRev)}</div></Card>
        <Card className="kpi"><Package className="icon" size={22} /><div className="label">Produtos</div><div className="value">{formatPrice(produtosRev)}</div></Card>
        <Card className="kpi"><Scissors className="icon" size={22} /><div className="label">Packs</div><div className="value">{formatPrice(packsRev)}</div></Card>
        <Card className="kpi"><Repeat className="icon" size={22} /><div className="label">Entradas avulsas de caixa (à parte)</div><div className="value">{formatPrice(otherRev)}</div></Card>
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
                  <td>{formatPrice(netOfPayment(a))}</td>
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
      {packs.length > 0 && (
        <Card className="card-pad" style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>Packs vendidos no período</h3>
          <table className="table">
            <thead><tr><th>Data</th><th>Cliente</th><th>Pack</th><th>Total</th><th>Método</th></tr></thead>
            <tbody>
              {packs.map(v => (
                <tr key={v.id}>
                  <td className="text-xs">{String(v.soldAt || '').slice(0, 10)}</td>
                  <td>{data.customers.find(c => c.id === v.customerId)?.name || '—'}</td>
                  <td className="text-sm">{v.nome} · {v.cortes} cortes</td>
                  <td className="fw-600">{formatPrice(v.total)}</td>
                  <td><Badge variant="default">{v.method || '—'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </AdminPage>
  );
}