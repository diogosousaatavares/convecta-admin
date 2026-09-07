import React from 'react';
import { Package, AlertTriangle, TrendingDown, Boxes } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Badge, EmptyState } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatPrice } from '@/lib/format';

export default function ProductStock() {
  const data = useStore();
  const lowStock = data.products.filter(p => p.stock > 0 && p.stock <= p.minStock);
  const outStock = data.products.filter(p => p.stock <= 0);
  const stockValue = data.products.reduce((s, p) => s + p.stock * (p.cost || 0), 0);
  const retailValue = data.products.reduce((s, p) => s + p.stock * (p.price || 0), 0);

  return (
    <AdminPage title="Stock" subtitle="Visão geral do inventário.">
      <div className="kpi-grid">
        <Card className="kpi"><Package className="icon" size={22} /><div className="label">Produtos</div><div className="value">{data.products.length}</div></Card>
        <Card className="kpi"><AlertTriangle className="icon" size={22} /><div className="label">Stock baixo</div><div className="value" style={{ color: lowStock.length ? 'var(--warning)' : 'inherit' }}>{lowStock.length}</div></Card>
        <Card className="kpi"><TrendingDown className="icon" size={22} /><div className="label">Esgotados</div><div className="value" style={{ color: outStock.length ? 'var(--error)' : 'inherit' }}>{outStock.length}</div></Card>
        <Card className="kpi"><Boxes className="icon" size={22} /><div className="label">Valor de stock (custo)</div><div className="value gold">{formatPrice(stockValue)}</div></Card>
      </div>

      <Card className="card-pad">
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Estado do stock</h3>
        {data.products.length === 0 ? <EmptyState icon={() => <Package />} title="Sem produtos" description="Adiciona produtos para controlar stock e consumíveis." /> : (
          <table className="table">
            <thead><tr><th>Produto</th><th>Stock</th><th>Mínimo</th><th>Estado</th><th>Valor (custo)</th></tr></thead>
            <tbody>
              {data.products.map(p => {
                const state = p.stock <= 0 ? 'out' : p.stock <= p.minStock ? 'low' : 'ok';
                return (
                  <tr key={p.id}>
                    <td className="fw-600">{p.name}</td>
                    <td>{p.stock} <span className="text-sec text-xs">{p.unit}</span></td>
                    <td className="text-sec">{p.minStock}</td>
                    <td>{state === 'out' ? <Badge variant="danger">Esgotado</Badge> : state === 'low' ? <Badge variant="warning">Baixo</Badge> : <Badge variant="success">OK</Badge>}</td>
                    <td>{formatPrice(p.stock * (p.cost || 0))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </AdminPage>
  );
}