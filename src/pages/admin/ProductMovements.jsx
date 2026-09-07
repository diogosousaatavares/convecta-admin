import React from 'react';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import { Card, EmptyState, Badge } from '@/components/ui';
import { useStore } from '@/hooks/useStore';

export default function ProductMovements() {
  const data = useStore();
  const moves = data.stockMovements || [];

  return (
    <AdminPage title="Movimentos de Stock" subtitle="Histórico de entradas, saídas e ajustes.">
      {moves.length === 0 ? (
        <Card className="card-pad"><EmptyState icon={() => <ArrowDownCircle />} title="Sem movimentos" description="Os ajustes de stock registados em Produtos aparecem aqui." /></Card>
      ) : (
        <Card className="card-pad">
          <table className="table">
            <thead><tr><th>Data</th><th>Produto</th><th>Tipo</th><th>Quantidade</th><th>Motivo</th></tr></thead>
            <tbody>
              {moves.map(m => {
                const p = data.products.find(x => x.id === m.productId);
                return (
                  <tr key={m.id}>
                    <td className="text-xs">{new Date(m.createdAt).toLocaleString('pt-PT').slice(0, 16)}</td>
                    <td className="fw-600">{p?.name || '—'}</td>
                    <td>{m.type === 'in' ? <Badge variant="success"><ArrowDownCircle size={12} /> Entrada</Badge> : <Badge variant="danger"><ArrowUpCircle size={12} /> Saída</Badge>}</td>
                    <td>{m.quantity}</td>
                    <td className="text-sec">{m.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </AdminPage>
  );
}