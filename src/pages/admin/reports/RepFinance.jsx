import React, { useMemo, useState } from 'react';
import { Wallet, TrendingDown, TrendingUp, Receipt } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { Card, EmptyState, Badge } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatPrice, todayStr, addDays } from '@/lib/format';
import { paidAppointments, vendasDeProdutos, vendasDePacks, getTotalRevenue, getTips, getExpensesTotal, netOfPayment, entradasAvulsas, saidasDoPeriodo } from '@/lib/domain/finance';
import { round2 } from '@/lib/domain/money';

// Receita = serviços (sem gorjeta) + produtos + packs, pela data do
// pagamento — o mesmo número do painel e das Receitas. A tabela lista as três
// fontes; antes o total incluía produtos e packs e a tabela só os serviços.
export default function RepFinance() {
  const data = useStore();
  const [from, setFrom] = useState(addDays(todayStr(), -29));
  const [to, setTo] = useState(todayStr());
  const range = { from, to };

  const linhas = useMemo(() => {
    const cli = (id) => data.customers.find(c => c.id === id)?.name || '—';
    const serv = paidAppointments(data, range).map(a => ({
      id: 'a' + a.id, quando: a.payment?.at || a.date, data: (a.payment?.at || a.date || '').slice(0, 10), tipo: 'Serviço',
      cliente: cli(a.customerId), o: (a.serviceNameSnapshot || data.services.find(s => s.id === a.serviceId)?.name || '') + (a.usaPack ? ' · pack' : ''),
      valor: netOfPayment(a), metodo: a.payment?.method,
    }));
    const prod = vendasDeProdutos(data, range).map(v => ({
      id: 'v' + v.id, quando: v.soldAt, data: (v.soldAt || v.date || '').slice(0, 10), tipo: 'Produtos',
      cliente: cli(v.customerId), o: (v.items || []).map(i => `${i.qty}× ${i.name}`).join(', '), valor: Number(v.total) || 0, metodo: v.method,
    }));
    const packs = vendasDePacks(data, range).map(v => ({
      id: 'p' + v.id, quando: v.soldAt, data: (v.soldAt || '').slice(0, 10), tipo: 'Pack',
      cliente: cli(v.customerId), o: `${v.nome} · ${v.cortes} cortes`, valor: Number(v.total) || 0, metodo: v.method,
    }));
    return [...serv, ...prod, ...packs].sort((a, b) => String(b.quando || '').localeCompare(String(a.quando || '')));
  }, [data, from, to]);

  const revenue = getTotalRevenue(data, range);
  const tips = getTips(data, range);
  const expenses = getExpensesTotal(data, range);
  const movesIn = round2(entradasAvulsas(data, range).reduce((s, m) => s + m.valor, 0));
  const movesOut = round2(saidasDoPeriodo(data, range).filter(x => x.origem === 'caixa').reduce((s, x) => s + x.valor, 0));
  const result = round2(revenue + movesIn - expenses - movesOut);

  return (
    <AdminPage title="Relatório Financeiro" subtitle="Receita, despesas e resultado.">
      <div className="flex gap-8 mb-24" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="date" className="input" style={{ width: 'auto' }} value={from} onChange={e => setFrom(e.target.value)} />
        <input type="date" className="input" style={{ width: 'auto' }} value={to} onChange={e => setTo(e.target.value)} />
      </div>
      <div className="kpi-grid">
        <Card className="kpi"><Wallet className="icon" size={22} /><div className="label">Receita (vendas)</div><div className="value gold">{formatPrice(revenue)}</div></Card>
        <Card className="kpi"><TrendingUp className="icon" size={22} /><div className="label">Entradas avulsas</div><div className="value">{formatPrice(movesIn)}</div></Card>
        <Card className="kpi"><TrendingDown className="icon" size={22} /><div className="label">Despesas + saídas</div><div className="value">{formatPrice(expenses + movesOut)}</div></Card>
        <Card className="kpi"><Receipt className="icon" size={22} /><div className="label">Resultado</div><div className="value gold">{formatPrice(result)}</div></Card>
      </div>
      <p className="text-sec text-xs mt-8">Gorjetas no período: {formatPrice(tips)} — são dos barbeiros e não entram na receita nem no resultado.</p>
      <Card className="card-pad mt-16">
        {linhas.length === 0 ? <EmptyState title="Sem vendas no período" /> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead><tr><th>Data</th><th>Tipo</th><th>Cliente</th><th>O quê</th><th>Valor</th><th>Método</th></tr></thead>
              <tbody>{linhas.map(l => (
                <tr key={l.id}><td className="text-xs">{l.data}</td><td><Badge variant="default">{l.tipo}</Badge></td><td>{l.cliente}</td><td className="text-sm">{l.o}</td><td className="fw-600">{formatPrice(l.valor)}</td><td>{l.metodo || '—'}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminPage>
  );
}
