import React, { useMemo, useState } from 'react';
import { Card, Button, EmptyState } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatPrice, todayStr, addDays } from '@/lib/format';
import { exportCSV } from '@/lib/csv';

export default function ContaProfissional() {
  const data = useStore();
  const [from, setFrom] = useState(addDays(todayStr(), -29));
  const [to, setTo] = useState(todayStr());
  const [selPro, setSelPro] = useState(data.professionals[0]?.id || '');

  const inRange = (d) => d >= from && d <= to;
  const sales = useMemo(() => data.appointments.filter(a => a.status === 'completed' && a.payment && inRange(a.date)), [data.appointments, from, to]);
  const proSales = sales.filter(a => a.professionalId === selPro);
  const pro = data.professionals.find(p => p.id === selPro);
  const netRev = proSales.reduce((s, a) => s + (a.payment.baseAmount - a.payment.discountAmount), 0);
  const commission = netRev * (pro?.commission || 0) / 100;
  const tips = proSales.reduce((s, a) => s + (a.payment.tip || 0), 0);

  const doExport = () => exportCSV(`conta_${pro?.name || ''}_${from}_${to}.csv`, proSales.map(a => ({
    Data: a.date,
    Hora: a.startTime,
    Cliente: data.customers.find(c => c.id === a.customerId)?.name || '',
    Serviço: data.services.find(s => s.id === a.serviceId)?.name || '',
    Líquido: (a.payment.baseAmount - a.payment.discountAmount).toFixed(2),
    Comissão: ((a.payment.baseAmount - a.payment.discountAmount) * (pro?.commission || 0) / 100).toFixed(2),
    Gorjeta: (a.payment.tip || 0).toFixed(2)
  })));

  return (
    <Card className="card-pad">
      <div className="flex justify-between items-center mb-16" style={{ flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ fontSize: 18 }}>Conta do Profissional</h3>
        <div className="flex gap-8" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="select" style={{ width: 'auto' }} value={selPro} onChange={e => setSelPro(e.target.value)}>
            {data.professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="date" className="input" style={{ width: 'auto' }} value={from} onChange={e => setFrom(e.target.value)} />
          <input type="date" className="input" style={{ width: 'auto' }} value={to} onChange={e => setTo(e.target.value)} />
          <Button size="sm" variant="secondary" onClick={doExport}>Exportar CSV</Button>
        </div>
      </div>

      <div className="kpi-grid">
        <Card className="kpi"><div className="label">Receita líquida</div><div className="value">{formatPrice(netRev)}</div></Card>
        <Card className="kpi"><div className="label">Comissão ({pro?.commission || 0}%)</div><div className="value gold">{formatPrice(commission)}</div></Card>
        <Card className="kpi"><div className="label">Gorjetas</div><div className="value gold">{formatPrice(tips)}</div></Card>
        <Card className="kpi"><div className="label">Total a receber</div><div className="value gold">{formatPrice(commission + tips)}</div></Card>
      </div>

      <h4 className="mt-24 mb-16" style={{ fontSize: 15 }}>Transações ({proSales.length})</h4>
      {proSales.length === 0 ? (
        <EmptyState title="Sem transações" description="Sem marcações concluídas no período para este profissional." />
      ) : (
        <table className="table">
          <thead><tr><th>Data</th><th>Cliente</th><th>Serviço</th><th>Líquido</th><th>Comissão</th><th>Gorjeta</th></tr></thead>
          <tbody>
            {proSales.map(a => {
              const liq = a.payment.baseAmount - a.payment.discountAmount;
              return (
                <tr key={a.id}>
                  <td className="text-xs">{a.date} {a.startTime}</td>
                  <td>{data.customers.find(c => c.id === a.customerId)?.name || '—'}</td>
                  <td>{data.services.find(s => s.id === a.serviceId)?.name}</td>
                  <td>{formatPrice(liq)}</td>
                  <td className="fw-600 text-gold">{formatPrice(liq * (pro?.commission || 0) / 100)}</td>
                  <td>{formatPrice(a.payment.tip || 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Card>
  );
}