import React, { useMemo, useState } from 'react';
import { Card, Button, EmptyState } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatPrice, todayStr, addDays } from '@/lib/format';
import { exportCSV } from '@/lib/csv';
import { paidAppointments, netOfPayment, commissionForAppointment } from '@/lib/domain/finance';
import { round2 } from '@/lib/domain/money';

export default function Comissoes() {
  const data = useStore();
  const [from, setFrom] = useState(addDays(todayStr(), -29));
  const [to, setTo] = useState(todayStr());

  const inRange = (d) => d >= from && d <= to;
  // Fonte única: marcações pagas no período.
  const sales = useMemo(() => paidAppointments(data, { from, to }), [data, from, to]);

  // Comissão lida do registo PERSISTIDO (snapshot da % no pagamento).
  // Vendas legadas sem registo são estimadas com a % atual (commissionForAppointment).
  const rows = useMemo(() => data.professionals.map(p => {
    const psales = sales.filter(a => a.professionalId === p.id);
    const netRev = round2(psales.reduce((s, a) => s + netOfPayment(a), 0));
    const commission = round2(psales.reduce((s, a) => s + commissionForAppointment(data, a).commissionAmount, 0));
    const tips = round2(psales.reduce((s, a) => s + (a.payment.tip || 0), 0));
    return { pro: p, count: psales.length, netRev, commission, tips, total: round2(commission + tips) };
  }), [sales, data.professionals, data.commissions]);

  const totalCommission = rows.reduce((s, r) => s + r.commission, 0);
  const totalTips = rows.reduce((s, r) => s + r.tips, 0);

  const doExport = () => exportCSV(`comissoes_${from}_${to}.csv`, rows.map(r => ({
    Profissional: r.pro.name,
    'Comissão %': r.pro.commission || 0,
    'Marcações': r.count,
    'Receita líquida': r.netRev.toFixed(2),
    'Comissão €': r.commission.toFixed(2),
    'Gorjetas': r.tips.toFixed(2),
    'Total a pagar': r.total.toFixed(2)
  })));

  return (
    <Card className="card-pad">
      <div className="flex justify-between items-center mb-16" style={{ flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ fontSize: 18 }}>Comissões por profissional</h3>
        <div className="flex gap-8" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="date" className="input" style={{ width: 'auto' }} value={from} onChange={e => setFrom(e.target.value)} />
          <input type="date" className="input" style={{ width: 'auto' }} value={to} onChange={e => setTo(e.target.value)} />
          <Button size="sm" variant="secondary" onClick={doExport}>Exportar CSV</Button>
        </div>
      </div>

      {rows.length === 0 || rows.every(r => r.count === 0) ? (
        <EmptyState title="Sem dados" description="Sem marcações concluídas no período." />
      ) : (
        <table className="table">
          <thead><tr><th>Profissional</th><th>Comissão</th><th>Marcações</th><th>Receita líquida</th><th>Comissão €</th><th>Gorjetas</th><th>Total a pagar</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.pro.id}>
                <td className="fw-600">{r.pro.name}</td>
                <td className="text-sec">{r.pro.commission || 0}%</td>
                <td>{r.count}</td>
                <td>{formatPrice(r.netRev)}</td>
                <td className="fw-600 text-gold">{formatPrice(r.commission)}</td>
                <td>{formatPrice(r.tips)}</td>
                <td className="fw-600">{formatPrice(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="flex gap-16 mt-16" style={{ justifyContent: 'flex-end' }}>
        <span className="text-sec text-sm">Total comissões: <span className="fw-600 text-gold">{formatPrice(totalCommission)}</span></span>
        <span className="text-sec text-sm">Total gorjetas: <span className="fw-600">{formatPrice(totalTips)}</span></span>
      </div>
    </Card>
  );
}