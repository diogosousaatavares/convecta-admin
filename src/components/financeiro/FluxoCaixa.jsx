import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Card } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { todayStr, addDays, getDowShort, formatPrice } from '@/lib/format';

const CHART_GOLD = '#E5E5E5';

export default function FluxoCaixa() {
  const data = useStore();
  const chart = useMemo(() => {
    const arr = [];
    for (let i = 13; i >= 0; i--) {
      const d = addDays(todayStr(), -i);
      // Entradas: serviços cobrados, produtos vendidos ao balcão e entradas
      // avulsas. Os produtos faltavam — o dinheiro entrava e o gráfico não o
      // via. As despesas já não geram movimento de caixa, por isso deixam de
      // ser descontadas duas vezes.
      const sales = data.appointments.filter(a => a.date === d && a.status === 'completed' && a.payment).reduce((s, a) => s + a.payment.total, 0);
      const produtos = (data.sales || []).filter(v => (v.soldAt || '').slice(0, 10) === d || v.date === d).reduce((s, v) => s + Number(v.total || 0), 0)
        // Packs: entram no dia em que foram pagos.
        + (data.packSales || []).filter(v => !v.anulado && (v.soldAt || '').slice(0, 10) === d).reduce((s, v) => s + Number(v.total || 0), 0);
      const movesIn = (data.cashMovements || []).filter(m => (m.createdAt || '').slice(0, 10) === d && m.type === 'in').reduce((s, m) => s + Number(m.amount || 0), 0);
      const movesOut = (data.cashMovements || []).filter(m => (m.createdAt || '').slice(0, 10) === d && m.type === 'out').reduce((s, m) => s + Number(m.amount || 0), 0);
      const expenses = data.expenses.filter(e => (e.date || (e.createdAt || '').slice(0, 10)) === d).reduce((s, e) => s + Number(e.amount || 0), 0);
      arr.push({ day: getDowShort(new Date(d + 'T00:00:00')), entradas: sales + produtos + movesIn, saidas: expenses + movesOut });
    }
    return arr;
  }, [data]);

  const totalIn = chart.reduce((s, x) => s + x.entradas, 0);
  const totalOut = chart.reduce((s, x) => s + x.saidas, 0);

  return (
    <>
      <div className="kpi-grid">
        <Card className="kpi"><div className="label">Entradas (14 dias)</div><div className="value gold">{formatPrice(totalIn)}</div></Card>
        <Card className="kpi"><div className="label">Saídas (14 dias)</div><div className="value">{formatPrice(totalOut)}</div></Card>
        <Card className="kpi"><div className="label">Saldo líquido</div><div className="value gold">{formatPrice(totalIn - totalOut)}</div></Card>
      </div>

      <Card className="card-pad mt-24">
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Fluxo de caixa — últimos 14 dias</h3>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chart} margin={{ left: -12, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="#8A8272" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#8A8272" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1C1915', border: '1px solid #221E18', borderRadius: 8, fontSize: 13 }} labelStyle={{ color: '#EDE8DF' }} formatter={(v) => formatPrice(v)} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar dataKey="entradas" fill={CHART_GOLD} radius={[4, 4, 0, 0]} />
              <Bar dataKey="saidas" fill="#5a5a5a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );
}