import React, { useMemo, useState } from 'react';
import { Card, Button, EmptyState } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatPrice, todayStr, addDays } from '@/lib/format';
import { exportCSV } from '@/lib/csv';
import { resumoProfissional, netOfPayment, commissionForAppointment } from '@/lib/domain/finance';

// As mesmas contas das Comissões e do Desempenho (resumoProfissional). A
// comissão é a gravada no momento da cobrança — não a % que o barbeiro tem hoje.
export default function ContaProfissional() {
  const data = useStore();
  const [from, setFrom] = useState(addDays(todayStr(), -29));
  const [to, setTo] = useState(todayStr());
  const [selPro, setSelPro] = useState(data.professionals[0]?.id || '');

  const pro = data.professionals.find(p => p.id === selPro);
  const r = useMemo(() => resumoProfissional(data, selPro, { from, to }), [data, selPro, from, to]);
  const nomeCliente = (id) => data.customers.find(c => c.id === id)?.name || '';
  const nomeServico = (a) => a.serviceNameSnapshot || data.services.find(s => s.id === a.serviceId)?.name || '';

  const doExport = () => exportCSV(`conta_${pro?.name || ''}_${from}_${to}.csv`, r.pagas.map(a => ({
    Data: a.date,
    Hora: a.startTime,
    Cliente: nomeCliente(a.customerId),
    Serviço: nomeServico(a),
    Líquido: netOfPayment(a).toFixed(2),
    Comissão: (commissionForAppointment(data, a).commissionAmount || 0).toFixed(2),
    Gorjeta: (Number(a.payment.tip) || 0).toFixed(2),
  })));

  return (
    <Card className="card-pad">
      <div className="flex justify-between items-center mb-16" style={{ flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ fontSize: 18 }}>Conta do Profissional</h3>
        <div className="flex gap-8" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="select" style={{ width: 'auto' }} value={selPro} onChange={e => setSelPro(e.target.value)}>
            {data.professionals.map(p => <option key={p.id} value={p.id}>{p.name}{p.role ? ` · ${p.role}` : ''}</option>)}
          </select>
          <input type="date" className="input" style={{ width: 'auto' }} value={from} onChange={e => setFrom(e.target.value)} />
          <input type="date" className="input" style={{ width: 'auto' }} value={to} onChange={e => setTo(e.target.value)} />
          <Button size="sm" variant="secondary" onClick={doExport}>Exportar CSV</Button>
        </div>
      </div>

      <div className="kpi-grid">
        <Card className="kpi"><div className="label">Receita (sem gorjetas)</div><div className="value">{formatPrice(r.receita)}</div></Card>
        <Card className="kpi"><div className="label">Comissão</div><div className="value gold">{formatPrice(r.comissao)}</div></Card>
        <Card className="kpi"><div className="label">Gorjetas</div><div className="value gold">{formatPrice(r.gorjetas)}</div></Card>
        <Card className="kpi"><div className="label">Total a receber</div><div className="value gold">{formatPrice(r.aReceber)}</div></Card>
      </div>

      <h4 className="mt-24 mb-16" style={{ fontSize: 15 }}>Marcações pagas ({r.marcacoes})</h4>
      {r.marcacoes === 0 ? (
        <EmptyState title="Sem transações" description="Sem marcações pagas no período para este profissional." />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead><tr><th>Data</th><th>Cliente</th><th>Serviço</th><th>Líquido</th><th>Comissão</th><th>Gorjeta</th></tr></thead>
            <tbody>
              {r.pagas.map(a => (
                <tr key={a.id}>
                  <td className="text-xs">{a.date} {a.startTime}</td>
                  <td>{nomeCliente(a.customerId) || '—'}</td>
                  <td>{nomeServico(a)}{a.usaPack ? ' · pack' : ''}</td>
                  <td>{formatPrice(netOfPayment(a))}</td>
                  <td className="fw-600 text-gold">{formatPrice(commissionForAppointment(data, a).commissionAmount || 0)}</td>
                  <td>{formatPrice(a.payment.tip || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
