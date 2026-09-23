import React from 'react';
import { Card, Badge, EmptyState } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatPrice, formatDataHora } from '@/lib/format';
import { resumoSessao, textoDiferenca } from '@/lib/domain/finance';

// As contas desta tabela são as mesmas da página Caixa (resumoSessao). Antes
// fazia as suas: só contava marcações pela hora MARCADA (não a do pagamento),
// esquecia produtos e packs, e o fecho aparecia com 0 € de vendas.
export default function HistoricoCaixa() {
  const data = useStore();
  const closed = data.cashSessions.filter(s => s.status === 'closed').sort((a, b) => (b.closedAt || '').localeCompare(a.closedAt || ''));

  if (!closed.length) {
    return <Card className="card-pad"><EmptyState title="Sem fechos" description="Ainda não fechaste nenhuma caixa." /></Card>;
  }

  return (
    <Card className="card-pad">
      <h3 style={{ fontSize: 18, marginBottom: 16 }}>Histórico de fechos de caixa</h3>
      <TabelaFechos sessoes={closed} data={data} />
    </Card>
  );
}

export function TabelaFechos({ sessoes, data }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead><tr><th>Aberta</th><th>Fechada</th><th>Fundo</th><th>Vendas</th><th>Despesas (dinheiro)</th><th>Esperado</th><th>Contado</th><th>Diferença</th></tr></thead>
        <tbody>
          {sessoes.map(s => {
            const r = resumoSessao(data, s);
            const d = r.diferenca;
            const certo = d != null && Math.abs(d) < 0.005;
            return (
              <tr key={s.id}>
                <td className="text-xs">{formatDataHora(s.openedAt)}</td>
                <td className="text-xs">{formatDataHora(s.closedAt)}</td>
                <td>{formatPrice(s.openingBalance)}</td>
                <td>{formatPrice(r.vendas)}</td>
                <td>{formatPrice(r.despesas)}</td>
                <td>{formatPrice(r.esperado)}</td>
                <td className="fw-600">{formatPrice(r.contado || 0)}</td>
                <td><Badge variant={certo ? 'success' : d < 0 ? 'danger' : 'warning'}>{textoDiferenca(d, formatPrice)}</Badge></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
