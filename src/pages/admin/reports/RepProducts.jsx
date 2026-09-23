import React, { useMemo, useState } from 'react';
import { Package, AlertTriangle, TrendingUp, Percent } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { Card, EmptyState } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatPrice, formatDataHora, todayStr, addDays } from '@/lib/format';
import { vendasDeProdutos } from '@/lib/domain/finance';
import { produtosStockBaixo, produtosEsgotados } from '@/lib/domain/stock';
import { round2 } from '@/lib/domain/money';

// O que a descrição prometia e não mostrava: o que se vendeu, quanto rendeu
// e quanto ficou de margem (venda − custo), por produto e no período.
export default function RepProducts() {
  const data = useStore();
  const [from, setFrom] = useState(addDays(todayStr(), -29));
  const [to, setTo] = useState(todayStr());

  const vendas = useMemo(() => vendasDeProdutos(data, { from, to }), [data, from, to]);
  const porProduto = useMemo(() => {
    const m = {};
    vendas.forEach(v => (v.items || []).forEach(i => {
      const k = i.productId || i.name;
      const prod = data.products.find(p => p.id === i.productId);
      const custoUn = Number(prod?.cost) || 0;
      const r = m[k] || (m[k] = { nome: prod?.name || i.name || '—', qtd: 0, receita: 0, custo: 0 });
      r.qtd += Number(i.qty) || 0;
      r.receita += Number(i.subtotal) || 0;
      r.custo += custoUn * (Number(i.qty) || 0);
    }));
    return Object.values(m).map(r => ({ ...r, receita: round2(r.receita), custo: round2(r.custo), margem: round2(r.receita - r.custo) }))
      .sort((a, b) => b.receita - a.receita);
  }, [vendas, data.products]);

  const receita = round2(porProduto.reduce((s, r) => s + r.receita, 0));
  const margem = round2(porProduto.reduce((s, r) => s + r.margem, 0));
  const stockValue = data.products.reduce((s, p) => s + (Number(p.stock) || 0) * (Number(p.cost) || 0), 0);
  const baixo = produtosStockBaixo(data.products);
  const esgotados = produtosEsgotados(data.products);
  const moves = [...(data.stockMovements || [])].filter(m => { const d = (m.createdAt || '').slice(0, 10); return d >= from && d <= to; })
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  return (
    <AdminPage title="Relatório de Produtos & Stock" subtitle="Vendas, margem e stock no período.">
      <div className="flex gap-8 mb-24" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="date" className="input" style={{ width: 'auto' }} value={from} onChange={e => setFrom(e.target.value)} />
        <input type="date" className="input" style={{ width: 'auto' }} value={to} onChange={e => setTo(e.target.value)} />
      </div>
      <div className="kpi-grid">
        <Card className="kpi"><TrendingUp className="icon" size={22} /><div className="label">Vendas de produtos</div><div className="value gold">{formatPrice(receita)}</div></Card>
        <Card className="kpi"><Percent className="icon" size={22} /><div className="label">Margem (venda − custo)</div><div className="value">{formatPrice(margem)}</div></Card>
        <Card className="kpi"><AlertTriangle className="icon" size={22} /><div className="label">Stock baixo · esgotados</div><div className="value" style={{ color: (baixo.length + esgotados.length) ? 'var(--warning)' : 'inherit' }}>{baixo.length} · {esgotados.length}</div></Card>
        <Card className="kpi"><Package className="icon" size={22} /><div className="label">Valor de stock (custo)</div><div className="value">{formatPrice(stockValue)}</div></Card>
      </div>
      <Card className="card-pad mt-16">
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Vendas por produto</h3>
        {porProduto.length === 0 ? <EmptyState title="Sem vendas de produtos no período" /> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead><tr><th>Produto</th><th>Qtd</th><th>Vendas</th><th>Custo</th><th>Margem</th><th>Margem %</th></tr></thead>
              <tbody>{porProduto.map(r => (
                <tr key={r.nome}><td className="fw-600">{r.nome}</td><td>{r.qtd}</td><td>{formatPrice(r.receita)}</td><td className="text-sec">{formatPrice(r.custo)}</td><td className="fw-600">{formatPrice(r.margem)}</td><td>{r.receita ? Math.round(r.margem / r.receita * 100) : 0}%</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
        {porProduto.some(r => r.custo === 0) && <p className="text-sec text-xs mt-8">Produtos sem custo na ficha aparecem com margem de 100 %.</p>}
      </Card>
      <Card className="card-pad mt-16">
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Movimentos de stock no período</h3>
        {moves.length === 0 ? <EmptyState title="Sem movimentos" /> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead><tr><th>Data</th><th>Produto</th><th>Tipo</th><th>Qtd</th><th>Motivo</th></tr></thead>
              <tbody>{moves.map(m => (
                <tr key={m.id}><td className="text-xs">{formatDataHora(m.createdAt)}</td><td>{data.products.find(p => p.id === m.productId)?.name || '—'}</td><td>{m.type === 'in' ? 'Entrada' : 'Saída'}</td><td>{m.quantity}</td><td className="text-sec">{m.reason}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminPage>
  );
}
