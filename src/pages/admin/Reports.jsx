import React, { useMemo, useState } from 'react';
import { BarChart3, Download, TrendingUp, Users, Percent, Wallet } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import AdminLayout from '@/components/AdminLayout';
import PageInfo from '@/components/admin/PageInfo';
import RelatorioContabilista from '@/components/admin/RelatorioContabilista';
import { useStore } from '@/hooks/useStore';
import { formatPrice } from '@/lib/format';
import { Card, Button, EmptyState } from '@/components/ui';

const GOLD = '#C9A227';
const GOLD_SOFT = '#E6C65A';
const PALETTE = ['#C9A227', '#E6C65A', '#8A6A18', '#F7E078', '#B8901F', '#6E5512'];

const PERIODS = [
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: '90d', label: '90 dias' },
  { key: 'month', label: 'Este mês' }
];

function daysAgo(n) { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - n); return d; }
function dateStr(d) { return d.toISOString().slice(0,10); }
function shortLabel(iso) { const d = new Date(iso); return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }); }

export default function Reports() {
  const data = useStore();
  const [period, setPeriod] = useState('30d');

  const range = useMemo(() => {
    const end = new Date(); end.setHours(23,59,59,999);
    let start;
    if (period === 'month') { start = new Date(); start.setDate(1); start.setHours(0,0,0,0); }
    else { const n = parseInt(period); start = daysAgo(n - 1); }
    return { start, end, startStr: dateStr(start), endStr: dateStr(end) };
  }, [period]);

  const paidStatuses = ['completed'];
  const apptsInRange = data.appointments.filter(a => a.date >= range.startStr && a.date <= range.endStr);
  const revenueAppts = apptsInRange.filter(a => paidStatuses.includes(a.status));

  const revenueOf = (a) => data.services.find(s => s.id === a.serviceId)?.price || 0;

  const totalRevenue = revenueAppts.reduce((s, a) => s + revenueOf(a), 0);
  const ticketMedio = revenueAppts.length ? totalRevenue / revenueAppts.length : 0;
  const newCustomers = data.customers.filter(c => (c.joinedAt || '') >= range.startStr && (c.joinedAt || '') <= range.endStr).length;
  const noShowRate = apptsInRange.length ? (apptsInRange.filter(a => a.status === 'cancelled').length / apptsInRange.length) * 100 : 0;

  // Revenue by day
  const byDay = useMemo(() => {
    const days = [];
    const cur = new Date(range.start);
    while (cur <= range.end) {
      const ds = dateStr(cur);
      const rev = apptsInRange.filter(a => a.date === ds && paidStatuses.includes(a.status)).reduce((s, a) => s + revenueOf(a), 0);
      days.push({ date: ds, label: shortLabel(ds), receita: rev });
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }, [range, apptsInRange, data.services]);

  // Revenue by barber
  const byBarber = useMemo(() => {
    const map = {};
    revenueAppts.forEach(a => { map[a.professionalId] = (map[a.professionalId] || 0) + revenueOf(a); });
    return data.professionals.map(p => ({ name: p.name.split(' ')[0], receita: map[p.id] || 0 })).filter(x => x.receita > 0).sort((a,b) => b.receita - a.receita);
  }, [revenueAppts, data.professionals, data.services]);

  // Top services
  const byService = useMemo(() => {
    const map = {};
    revenueAppts.forEach(a => { map[a.serviceId] = (map[a.serviceId] || 0) + revenueOf(a); });
    return Object.entries(map).map(([id, rev]) => ({ name: data.services.find(s => s.id === id)?.name || id, receita: rev })).sort((a,b) => b.receita - a.receita).slice(0, 5);
  }, [revenueAppts, data.services]);

  // Status distribution
  const statusDist = useMemo(() => {
    const counts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    apptsInRange.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });
    return [
      { name: 'Pendentes', value: counts.pending, color: '#F59E0B' },
      { name: 'Confirmadas', value: counts.confirmed, color: GOLD },
      { name: 'Concluídas', value: counts.completed, color: '#22C55E' },
      { name: 'Canceladas', value: counts.cancelled, color: '#EF4444' }
    ].filter(x => x.value > 0);
  }, [apptsInRange]);

  const exportCSV = () => {
    const rows = [['Data', 'Cliente', 'Servico', 'Barbeiro', 'Estado', 'Valor']];
    apptsInRange.slice().sort((a,b) => (a.date+a.startTime).localeCompare(b.date+b.startTime)).forEach(a => {
      const cust = data.customers.find(c => c.id === a.customerId)?.name || '';
      const svc = data.services.find(s => s.id === a.serviceId)?.name || '';
      const pro = data.professionals.find(p => p.id === a.professionalId)?.name || '';
      const st = { pending: 'Pendente', confirmed: 'Confirmada', completed: 'Concluida', cancelled: 'Cancelada' }[a.status] || a.status;
      rows.push([a.date, cust, svc, pro, st, String(revenueOf(a).toFixed(2))]);
    });
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `relatorio-convecta-${range.startStr}-a-${range.endStr}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between" style={{ marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div className="page-head" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1>Relatórios & Analytics</h1>
            <PageInfo
              description="Resumo executivo do negócio com os principais KPIs do período selecionado: receita total, número de marcações, novos clientes, ticket médio e taxa de cancelamento."
              impact="Este é o único relatório que responde a 'como correu o mês?'. É o ponto de partida para qualquer análise mais aprofundada e deve ser consultado regularmente para acompanhar a evolução do negócio."
              links={['Relatório Financeiro', 'Relatório de Clientes', 'Relatório de Profissionais', 'Relatório de Serviços']}
            />
          </div>
          <p>Análise de desempenho do negócio.</p>
        </div>
        <Button size="sm" variant="secondary" onClick={exportCSV}><Download size={15} /> Exportar CSV</Button>
      </div>

      {/* Period selector */}
      <div className="chip-row" style={{ marginBottom: 20 }}>
        {PERIODS.map(p => (
          <button key={p.key} className={`chip ${period === p.key ? 'active' : ''}`} onClick={() => setPeriod(p.key)}>{p.label}</button>
        ))}
      </div>
      <PageInfo page="relatorios" />

      <div style={{ marginBottom: 20 }}>
        <RelatorioContabilista />
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <Card className="kpi card-pad">
          <Wallet className="icon" size={20} />
          <div className="label">Receita do período</div>
          <div className="value gold">{formatPrice(totalRevenue)}</div>
        </Card>
        <Card className="kpi card-pad">
          <TrendingUp className="icon" size={20} />
          <div className="label">Ticket médio</div>
          <div className="value">{formatPrice(ticketMedio)}</div>
        </Card>
        <Card className="kpi card-pad">
          <Users className="icon" size={20} />
          <div className="label">Novos clientes</div>
          <div className="value">{newCustomers}</div>
        </Card>
        <Card className="kpi card-pad">
          <Percent className="icon" size={20} />
          <div className="label">No-show rate</div>
          <div className="value" style={{ color: noShowRate > 15 ? 'var(--error)' : 'inherit' }}>{noShowRate.toFixed(1)}%</div>
        </Card>
      </div>

      {/* Revenue by day */}
      <Card className="card-pad" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 17, marginBottom: 16 }}>Receita por dia</h3>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={byDay} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GOLD} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fill: '#8A8272', fontSize: 11 }} interval="preserveStartEnd" minTickGap={20} />
              <YAxis tick={{ fill: '#8A8272', fontSize: 11 }} tickFormatter={(v) => `${v}€`} />
              <Tooltip contentStyle={{ background: '#1C1915', border: '1px solid #221E18', borderRadius: 8, color: '#EDE8DF' }} formatter={(v) => formatPrice(v)} />
              <Area type="monotone" dataKey="receita" stroke={GOLD} strokeWidth={2} fill="url(#goldGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Revenue by barber */}
        <Card className="card-pad">
          <h3 style={{ fontSize: 17, marginBottom: 16 }}>Receita por barbeiro</h3>
          {byBarber.length === 0 ? (
            <EmptyState title="Sem dados" description="Não há receita por barbeiro neste período." />
          ) : (
            <div className="chart-box">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={byBarber} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#8A8272', fontSize: 11 }} tickFormatter={(v) => `${v}€`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#8A8272', fontSize: 12 }} width={70} />
                  <Tooltip contentStyle={{ background: '#1C1915', border: '1px solid #221E18', borderRadius: 8, color: '#EDE8DF' }} formatter={(v) => formatPrice(v)} />
                  <Bar dataKey="receita" fill={GOLD} radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Status distribution */}
        <Card className="card-pad">
          <h3 style={{ fontSize: 17, marginBottom: 16 }}>Estado das marcações</h3>
          {statusDist.length === 0 ? (
            <EmptyState title="Sem dados" description="Não há estados de marcação neste período." />
          ) : (
            <div className="chart-box">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {statusDist.map((e, i) => <Cell key={i} fill={e.color} stroke="#141210" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1C1915', border: '1px solid #221E18', borderRadius: 8, color: '#EDE8DF' }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#8A8272' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Top services */}
      <Card className="card-pad">
        <h3 style={{ fontSize: 17, marginBottom: 16 }}>Top 5 serviços (por receita)</h3>
        {byService.length === 0 ? (
            <EmptyState title="Sem dados" description="Não há receita por serviço neste período." />
        ) : (
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byService} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fill: '#8A8272', fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={50} />
                <YAxis tick={{ fill: '#8A8272', fontSize: 11 }} tickFormatter={(v) => `${v}€`} />
                <Tooltip contentStyle={{ background: '#1C1915', border: '1px solid #221E18', borderRadius: 8, color: '#EDE8DF' }} formatter={(v) => formatPrice(v)} />
                {byService.map((_, i) => <Bar key={i} dataKey="receita" fill={PALETTE[i % PALETTE.length]} radius={[6,6,0,0]} barSize={36} />)}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}