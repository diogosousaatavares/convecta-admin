import React from 'react';
import { Package, AlertTriangle } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import { Card, EmptyState } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatPrice } from '@/lib/format';

export default function RepProducts() {
  const data = useStore();
  const moves = data.stockMovements || [];
  const stockValue = data.products.reduce((s, p) => s + p.stock * (p.cost || 0), 0);
  const lowStock = data.products.filter(p => p.stock <= p.minStock);

  return (
    <AdminPage title="Relatório de Produtos & Stock" subtitle="Stock, movimentos e valor.">
      <div className="kpi-grid">
        <Card className="kpi"><Package className="icon" size={22} /><div className="label">Produtos</div><div className="value">{data.products.length}</div></Card>
        <Card className="kpi"><AlertTriangle className="icon" size={22} /><div className="label">Stock baixo</div><div className="value" style={{ color: lowStock.length ? 'var(--warning)' : 'inherit' }}>{lowStock.length}</div></Card>
        <Card className="kpi"><div className="label">Valor de stock</div><div className="value gold">{formatPrice(stockValue)}</div></Card>
        <Card className="kpi"><div className="label">Movimentos</div><div className="value">{moves.length}</div></Card>
      </div>
      <Card className="card-pad mt-16">
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Movimentos recentes</h3>
        {moves.length === 0 ? <EmptyState title="Sem movimentos" /> : (
          <table className="table">
            <thead><tr><th>Data</th><th>Produto</th><th>Tipo</th><th>Qtd</th><th>Motivo</th></tr></thead>
            <tbody>{moves.slice().reverse().map(m => (
              <tr key={m.id}><td className="text-xs">{new Date(m.createdAt).toLocaleString('pt-PT').slice(0, 16)}</td><td>{data.products.find(p => p.id === m.productId)?.name || '—'}</td><td>{m.type === 'in' ? 'Entrada' : 'Saída'}</td><td>{m.quantity}</td><td className="text-sec">{m.reason}</td></tr>
            ))}</tbody>
          </table>
        )}
      </Card>
    </AdminPage>
  );
}