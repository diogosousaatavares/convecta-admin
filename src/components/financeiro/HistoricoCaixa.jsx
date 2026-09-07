import React from 'react';
import { Card, Badge, EmptyState } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatPrice } from '@/lib/format';

export default function HistoricoCaixa() {
  const data = useStore();
  const closed = data.cashSessions.filter(s => s.status === 'closed').sort((a, b) => (b.closedAt || '').localeCompare(a.closedAt || ''));

  if (!closed.length) {
    return <Card className="card-pad"><EmptyState title="Sem fechos" description="Ainda não fechaste nenhuma caixa." /></Card>;
  }

  return (
    <Card className="card-pad">
      <h3 style={{ fontSize: 18, marginBottom: 16 }}>Histórico de fechos de caixa</h3>
      <table className="table">
        <thead><tr><th>Aberta</th><th>Fechada</th><th>Fundo</th><th>Vendas</th><th>Despesas</th><th>Contado</th><th>Diferença</th></tr></thead>
        <tbody>
          {closed.map(s => {
            const sSales = data.appointments.filter(a => a.status === 'completed' && a.payment && new Date(a.date + 'T' + a.startTime).toISOString() >= s.openedAt && new Date(a.date + 'T' + a.startTime).toISOString() <= s.closedAt);
            const sTotal = sSales.reduce((sum, a) => sum + a.payment.total, 0);
            const sExp = data.expenses.filter(e => e.sessionId === s.id).reduce((sum, e) => sum + Number(e.amount || 0), 0);
            const expCash = s.openingBalance + sSales.filter(a => a.payment.method === 'Dinheiro').reduce((sum, a) => sum + a.payment.total, 0) - sExp;
            const diff = (s.countedCash || 0) - expCash;
            return (
              <tr key={s.id}>
                <td className="text-xs">{new Date(s.openedAt).toLocaleString('pt-PT').slice(0, 16)}</td>
                <td className="text-xs">{new Date(s.closedAt).toLocaleString('pt-PT').slice(0, 16)}</td>
                <td>{formatPrice(s.openingBalance)}</td>
                <td>{formatPrice(sTotal)}</td>
                <td>{formatPrice(sExp)}</td>
                <td className="fw-600">{formatPrice(s.countedCash || 0)}</td>
                <td><Badge variant={diff === 0 ? 'success' : 'warning'}>{diff === 0 ? 'OK' : formatPrice(Math.abs(diff))}</Badge></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}