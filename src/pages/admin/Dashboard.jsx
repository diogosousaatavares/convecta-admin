import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CalendarDays, Users, UserPlus, CreditCard, TrendingUp, TrendingDown, Wallet, AlertTriangle, Package, Megaphone, Award, Star, ArrowUpRight, ArrowDownRight, Lock, Clock, Repeat, UserX, Filter, MoreHorizontal, ChevronRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useAuth, useStore } from '@/hooks/useStore';
import AdminLayout from '@/components/AdminLayout';
import BotaoAtualizar from '@/components/admin/BotaoAtualizar';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Badge, Avatar, EmptyState } from '@/components/ui';
import { formatPrice, formatDate, formatDateNum, todayStr, addDays, getDowShort } from '@/lib/format';
import { getRevenue, getOccupancy, paidAppointments, netOfPayment, getCancellationCount, getCancellationRate, getNoShowCount, getNoShowRate } from '@/lib/domain/finance';
import { monthBounds, weekBounds, daysBetween } from '@/lib/domain/dates';
import { round2 } from '@/lib/domain/money';
import { listConvectaNotifs, markConvectaNotifRead } from '@/lib/convectaNotifs';

const CHART_GOLD = '#E5E5E5';
const CHART_COLORS = ['#E5E5E5', '#b0b0b0', '#7a7a7a', '#4a4a4a', '#2a2a2a'];
const DOW_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function Dashboard() {
  const data = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = todayStr();
  const [period, setPeriod] = useState('month');
  const [custom, setCustom] = useState({ from: addDays(today, -6), to: today });
  const [convectaNotifs, setConvectaNotifs] = useState([]);
  useEffect(() => {
    listConvectaNotifs().then(setConvectaNotifs).catch(() => {});
  }, []);
  const unreadNotifs = convectaNotifs.filter(n => !n.read);
  async function handleDismissNotif(id) {
    await markConvectaNotifRead(id);
    setConvectaNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  }

  // As marcacoes por confirmar sao o aviso que interessa: chegou gente nova e
  // ainda ninguem respondeu. Nao ha tabela nenhuma a manter — a lista sai das
  // proprias marcacoes, por isso nunca fica dessincronizada.
  const porConfirmar = useMemo(() => (data.appointments || [])
    .filter(a => a.status === 'pending' && !a.blocked)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')), [data.appointments]);

  const range = useMemo(() => {
    if (period === 'today') return { from: today, to: today };
    if (period === 'week') { const w = weekBounds(today); return { from: w.from, to: w.to }; }
    if (period === 'month') { const m = monthBounds(today); return { from: m.from, to: m.to }; }
    return { from: custom.from, to: custom.to };
  }, [period, custom, today]);

  const inRange = (d) => d >= range.from && d <= range.to;
  const periodAppts = data.appointments.filter(a => inRange(a.date) && !a.blocked);
  const periodActive = periodAppts.filter(a => a.status !== 'cancelled' && a.status !== 'no_show');
  // RECEITA canónica: só marcações PAGAS (completed + payment), pelo snapshot histórico.
  const paidAppts = paidAppointments(data, range);
  const periodRevenue = getRevenue(data, range);
  const periodCancelled = getCancellationCount(data, range);
  const periodNoShow = getNoShowCount(data, range);
  const noShowRate = getNoShowRate(data, range);
  const cancelRate = getCancellationRate(data, range);

  // return rate (clientes com >=2 marcações pagas no período)
  const custCounts = {};
  paidAppts.forEach(a => { custCounts[a.customerId] = (custCounts[a.customerId] || 0) + 1; });
  const periodCustomers = Object.keys(custCounts).length;
  const returning = Object.values(custCounts).filter(c => c >= 2).length;
  const returnRate = periodCustomers ? (returning / periodCustomers) * 100 : 0;

  // OCUPAÇÃO: minutos ocupados / minutos disponíveis (não contagem de marcações).
  const occupancyData = useMemo(() => getOccupancy(data, range), [data, range]);
  const occupancy = occupancyData.rate;
  const ticketMedio = paidAppts.length ? periodRevenue / paidAppts.length : 0;

  // ticket médio do dia (receita paga hoje ÷ marcações pagas hoje)
  const todayPaid = paidAppointments(data, { from: today, to: today });
  const ticketDia = todayPaid.length ? getRevenue(data, { from: today, to: today }) / todayPaid.length : 0;

  // taxa de cancelamento hoje (canceladas ÷ marcações hoje)
  const todayAll = data.appointments.filter(a => a.date === today && !a.blocked);
  const cancelToday = todayAll.filter(a => a.status === 'cancelled').length;
  const cancelRateToday = todayAll.length ? (cancelToday / todayAll.length) * 100 : 0;

  // revenue per professional (ranking) — por receita PAGA
  const proRevenue = useMemo(() => {
    const m = {};
    paidAppts.forEach(a => { m[a.professionalId] = (m[a.professionalId] || 0) + netOfPayment(a); });
    return data.professionals.map(p => ({ ...p, revenue: round2(m[p.id] || 0), count: paidAppts.filter(a => a.professionalId === p.id).length })).sort((a, b) => b.revenue - a.revenue);
  }, [paidAppts, data.professionals]);
  const maxProRev = Math.max(...proRevenue.map(p => p.revenue), 1);

  // revenue last 7 days (sempre últimos 7, para tendência)
  const revenue7 = useMemo(() => {
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const dStr = addDays(today, -i);
      const rev = getRevenue(data, { from: dStr, to: dStr });
      arr.push({ day: getDowShort(new Date(dStr + 'T00:00:00')), rev });
    }
    return arr;
  }, [data, today]);
  const avgDaily = revenue7.reduce((s, d) => s + d.rev, 0) / 7;
  const rangeDays = Math.max(1, daysBetween(range.from, range.to));
  const forecast = avgDaily * rangeDays;

  // services distribution
  const svcDist = useMemo(() => {
    const m = {};
    periodActive.forEach(a => { m[a.serviceId] = (m[a.serviceId] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, count]) => ({ name: data.services.find(s => s.id === id)?.name || '—', count }));
  }, [periodActive, data.services]);

  // funnel
  const funnel = [
    { label: 'Pendentes', value: periodAppts.filter(a => a.status === 'pending').length, color: '#9a9a9a' },
    { label: 'Confirmadas', value: periodAppts.filter(a => a.status === 'confirmed').length, color: CHART_GOLD },
    { label: 'Concluídas', value: periodAppts.filter(a => a.status === 'completed').length, color: '#22C55E' },
    { label: 'Canceladas', value: periodCancelled, color: '#EF4444' }
  ];
  const maxFunnel = Math.max(...funnel.map(f => f.value), 1);

  // heatmap (dow x hour)
  const { heatHours, heatGrid } = useMemo(() => {
    const hours = ['09','10','11','12','13','14','15','16','17','18','19'];
    const grid = DOW_LABELS.map((_, dow) => hours.map(h => 0));
    periodActive.forEach(a => {
      const d = new Date(a.date + 'T00:00:00');
      const dow = d.getDay();
      const h = a.startTime.slice(0, 2);
      const hi = hours.indexOf(h);
      if (hi >= 0) grid[dow][hi] += 1;
    });
    return { heatHours: hours, heatGrid: grid };
  }, [periodActive]);
  const heatMax = Math.max(...heatGrid.flat(), 1);
  const heatColor = (v) => {
    if (v === 0) return 'transparent';
    const a = 0.18 + (v / heatMax) * 0.82;
    return `rgba(255,255,255,${a})`;
  };

  // deltas (vs previous equal-length period)
  const prevRange = { from: addDays(range.from, -rangeDays), to: addDays(range.to, -rangeDays) };
  const prevRevenue = getRevenue(data, prevRange);
  const revDelta = prevRevenue ? ((periodRevenue - prevRevenue) / prevRevenue) * 100 : 0;
  const previousAppts = data.appointments.filter(a => a.date >= prevRange.from && a.date <= prevRange.to && !a.blocked && !['cancelled', 'no_show'].includes(a.status));
  const newCustomers = data.customers.filter(c => c.joinedAt && inRange(c.joinedAt)).length;
  const previousNewCustomers = data.customers.filter(c => c.joinedAt && c.joinedAt >= prevRange.from && c.joinedAt <= prevRange.to).length;
  const previousOccupancy = getOccupancy(data, prevRange).rate;
  const apptsDelta = previousAppts.length ? ((periodActive.length - previousAppts.length) / previousAppts.length) * 100 : 0;
  const customersDelta = previousNewCustomers ? ((newCustomers - previousNewCustomers) / previousNewCustomers) * 100 : 0;
  const occupancyDelta = previousOccupancy ? ((occupancy - previousOccupancy) / previousOccupancy) * 100 : 0;
  const serviceTotal = svcDist.reduce((sum, service) => sum + service.count, 0);
  const comparisonLabel = period === 'today' ? 'vs. ontem' : period === 'week' ? 'vs. semana anterior' : period === 'month' ? 'vs. mês anterior' : 'vs. período anterior';

  // alerts
  const lowStock = data.products.filter(p => p.stock <= p.minStock);
  const pendingToday = data.appointments.filter(a => a.date === today && a.status === 'pending').length;
  const cashOpen = !!data.cashSessions.find(s => s.status === 'open');
  const endingPromos = data.promotions.filter(p => p.active && p.endsAt && p.endsAt >= today && p.endsAt <= addDays(today, 7));
  const alerts = [
    ...lowStock.map(p => ({ type: 'warn', icon: Package, title: `Stock baixo: ${p.name}`, sub: `${p.stock} ${p.unit} (mín. ${p.minStock})`, to: '/admin/inventario' })),
    ...endingPromos.map(p => ({ type: 'info', icon: Megaphone, title: `Promoção a terminar: ${p.name}`, sub: `Termina ${formatDate(p.endsAt)}`, to: '/admin/marketing' })),
    pendingToday > 0 ? { type: 'warn', icon: Clock, title: `${pendingToday} marcações pendentes`, sub: 'A aguardar confirmação hoje', to: '/admin/marcacoes' } : null,
    !cashOpen ? { type: 'info', icon: Lock, title: 'Caixa fechada', sub: 'Abre a caixa para registar vendas', to: '/admin/caixa' } : null
  ].filter(Boolean);

  const todayAppts = data.appointments.filter(a => a.date === today).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const recentCustomers = [...data.customers].sort((a, b) => (b.joinedAt || '').localeCompare(a.joinedAt || '')).slice(0, 4);

  return (
    <AdminLayout>
      <div className="page-head" style={{ paddingBottom: 0 }}>
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 6 }}>👋 Olá, {user?.name || user?.email || 'Administrador'}</div>
            <h1 style={{ marginBottom: 2 }}>Dashboard</h1>
            <p style={{ margin: 0 }}>{formatDateNum(range.from)}{range.from !== range.to ? ` → ${formatDateNum(range.to)}` : ''}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <BotaoAtualizar />
          <div className="period-tabs">
            <button className={period === 'today' ? 'active' : ''} onClick={() => setPeriod('today')}>Hoje</button>
            <button className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>Semana</button>
            <button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>Mês</button>
            <button className={period === 'custom' ? 'active' : ''} onClick={() => setPeriod('custom')}>Custom</button>
          </div>
          </div>
        </div>
        {period === 'custom' && <div className="flex gap-12 mb-16" style={{ flexWrap: 'wrap' }}><div className="field" style={{ marginBottom: 0 }}><label className="label">De</label><input type="date" className="input" value={custom.from} onChange={e => setCustom(f => ({ ...f, from: e.target.value }))} /></div><div className="field" style={{ marginBottom: 0 }}><label className="label">Até</label><input type="date" className="input" value={custom.to} onChange={e => setCustom(f => ({ ...f, to: e.target.value }))} /></div></div>}
      </div>

      {alerts.length > 0 && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '12px 0' }}>{alerts.map((a, i) => { const Ico = a.icon; return <button key={i} onClick={() => navigate(a.to)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: a.type === 'warn' ? 'rgba(234,179,8,0.1)' : 'rgba(59,130,246,0.08)', border: `1px solid ${a.type === 'warn' ? 'rgba(234,179,8,0.3)' : 'rgba(59,130,246,0.2)'}`, borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap' }}><Ico size={14} style={{ color: a.type === 'warn' ? '#C9A227' : '#60a5fa' }} /><span className="fw-600">{a.title}</span><span className="text-sec" style={{ fontSize: 11 }}>{a.sub}</span><ArrowUpRight size={13} className="text-sec" /></button>; })}</div>}

      {porConfirmar.length > 0 && (
        <Card className="mb-16" style={{ borderColor: 'rgba(201,162,39,0.45)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Bell size={17} style={{ color: '#C9A227' }} />
            <b style={{ fontSize: 14 }}>
              {porConfirmar.length === 1 ? '1 marcação por confirmar' : `${porConfirmar.length} marcações por confirmar`}
            </b>
            <button className="btn btn-ghost" style={{ marginLeft: 'auto', fontSize: 12 }}
              onClick={() => navigate('/admin/marcacoes')}>Ver todas <ChevronRight size={13} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {porConfirmar.slice(0, 6).map(a => {
              const cliente = data.customers.find(c => c.id === a.customerId);
              const servico = data.services.find(x => x.id === a.serviceId);
              const pro = data.professionals.find(x => x.id === a.professionalId);
              return (
                <button key={a.id} onClick={() => navigate('/admin/marcacoes')}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                    padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
                    background: 'rgba(201,162,39,0.06)', border: '1px solid rgba(201,162,39,0.22)' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#C9A227', flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {cliente?.name || a.customerNameSnapshot || 'Cliente'}
                    </span>
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--text-sec)' }}>
                      {servico?.name || a.serviceNameSnapshot || 'Serviço'}
                      {pro?.name ? ` · ${pro.name}` : ''}
                    </span>
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-sec)', whiteSpace: 'nowrap' }}>
                    {formatDateNum(a.date)} · {a.startTime}
                  </span>
                  <ChevronRight size={14} className="text-sec" />
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {unreadNotifs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '12px 0' }}>
          {unreadNotifs.map(n => {
            const borderColor = n.type === 'urgente' || n.type === 'pagamento' ? 'rgba(239,68,68,0.4)' : n.type === 'aviso' ? 'rgba(245,158,11,0.4)' : 'rgba(201,168,39,0.4)';
            const bg = n.type === 'urgente' || n.type === 'pagamento' ? 'rgba(239,68,68,0.06)' : n.type === 'aviso' ? 'rgba(245,158,11,0.06)' : 'rgba(201,168,39,0.06)';
            const dotColor = n.type === 'urgente' || n.type === 'pagamento' ? '#EF4444' : n.type === 'aviso' ? '#F59E0B' : '#C9A227';
            return (
              <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', border: `1px solid ${borderColor}`, borderRadius: 10, background: bg }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.5 }}>{n.body}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-ter)', marginTop: 4 }}>{new Date(n.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} · Convecta</div>
                </div>
                <button onClick={() => handleDismissNotif(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-ter)', fontSize: 16, padding: '0 4px', lineHeight: 1, flexShrink: 0 }}>×</button>
              </div>
            );
          })}
        </div>
      )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 14 }}>
        <Card className="card-pad" style={{ background: 'linear-gradient(135deg, rgba(201,168,39,0.12), rgba(201,168,39,0.03))', border: '1px solid rgba(201,168,39,0.25)' }}><div className="flex justify-between items-start mb-12"><span className="text-xs fw-600 text-gold">RECEITA</span><Wallet size={18} className="text-gold" /></div><div style={{ fontSize: 30, fontWeight: 700, color: '#C9A227', lineHeight: 1 }}>{formatPrice(periodRevenue)}</div>{prevRevenue > 0 && <div className="text-xs mt-10" style={{ color: revDelta >= 0 ? '#22C55E' : '#EF4444' }}>{revDelta >= 0 ? '+' : ''}{revDelta.toFixed(0)}% <span className="text-sec">vs período anterior</span></div>}</Card>
        <Card className="card-pad"><div className="flex justify-between items-start mb-12"><span className="text-xs fw-600 text-sec">MARCAÇÕES</span><CalendarDays size={18} className="text-sec" /></div><div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1 }}>{periodActive.length}</div><div className="flex gap-12 mt-10 text-xs"><span style={{ color: '#22C55E' }}>✓ {periodAppts.filter(a => a.status === 'completed').length} concluídas</span><span style={{ color: '#EF4444' }}>✗ {periodCancelled} canceladas</span></div></Card>
        <Card className="card-pad"><div className="flex justify-between items-start mb-12"><span className="text-xs fw-600 text-sec">OCUPAÇÃO</span><TrendingUp size={18} className="text-sec" /></div><div style={{ fontSize: 30, fontWeight: 700, color: occupancy >= 70 ? '#22C55E' : occupancy >= 40 ? '#C9A227' : '#EF4444', lineHeight: 1 }}>{occupancy}%</div><div style={{ marginTop: 10, height: 4, borderRadius: 2, background: 'var(--border)' }}><div style={{ height: '100%', width: `${Math.min(occupancy, 100)}%`, background: occupancy >= 70 ? '#22C55E' : occupancy >= 40 ? '#C9A227' : '#EF4444' }} /></div></Card>
        <Card className="card-pad"><div className="flex justify-between items-start mb-12"><span className="text-xs fw-600 text-sec">TICKET MÉDIO</span><Star size={18} className="text-sec" /></div><div style={{ fontSize: 30, fontWeight: 700, color: '#C9A227', lineHeight: 1 }}>{formatPrice(ticketMedio)}</div><div className="text-sec text-xs mt-10">Hoje: <span className="text-sm">{formatPrice(ticketDia)}</span></div></Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 20 }}>{[{ label: 'Taxa cancelamento', value: `${cancelRate.toFixed(0)}%`, warn: cancelRate > 15 }, { label: 'Taxa de retorno', value: `${returnRate.toFixed(0)}%`, gold: true }, { label: 'Clientes (período)', value: periodCustomers }, { label: 'Previsão período', value: formatPrice(forecast), gold: true }, { label: 'Cancel. hoje', value: `${cancelRateToday.toFixed(0)}%`, warn: cancelRateToday > 15 }, { label: 'No-shows', value: periodNoShow }].map((k, i) => <Card key={i} style={{ padding: '14px 16px' }}><div className="text-xs text-sec mb-8">{k.label}</div><div style={{ fontSize: 20, fontWeight: 700, color: k.warn ? '#EF4444' : k.gold ? '#C9A227' : 'var(--text)' }}>{k.value}</div></Card>)}</div>

      <div className="dash-two-col" style={{ marginBottom: 14 }}><Card className="card-pad dash-chart-panel"><div className="dash-panel-head"><h3 style={{ fontSize: 18 }}>Receita — últimos 7 dias</h3><Badge variant="gold">média {formatPrice(avgDaily)}/dia</Badge></div><ResponsiveContainer width="100%" height={220}><AreaChart data={revenue7} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}><defs><linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C9A227" stopOpacity={0.45} /><stop offset="100%" stopColor="#C9A227" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="day" stroke="#8A8272" fontSize={12} tickLine={false} axisLine={false} /><YAxis stroke="#8A8272" fontSize={12} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ background: '#1C1915', border: '1px solid #2a2520', borderRadius: 8 }} /><Area type="monotone" dataKey="rev" stroke="#C9A227" strokeWidth={2.5} fill="url(#dashboardRevenue)" /></AreaChart></ResponsiveContainer></Card><Card className="card-pad"><div className="dash-panel-head"><h3 style={{ fontSize: 18 }}>Agenda de hoje</h3><button className="link-gold text-sm" onClick={() => navigate('/admin/agenda')}>Ver tudo <ArrowUpRight size={14} /></button></div>{todayAppts.length === 0 ? <EmptyState icon={() => <CalendarDays />} title="Dia livre" description="Sem marcações hoje." /> : <div className="dash-list">{todayAppts.slice(0, 7).map(a => { const cust = data.customers.find(c => c.id === a.customerId); const svc = data.services.find(s => s.id === a.serviceId); return <div key={a.id} className="dash-list-row"><Avatar name={cust?.name} /><div className="dash-list-name">{cust?.name || '—'}<div className="text-sec text-xs">{svc?.name || '—'}</div></div><div className="dash-list-time">{a.startTime}</div></div>; })}</div>}</Card></div>

      <div className="dash-two-col dash-lower"><Card className="card-pad"><h3 style={{ fontSize: 18, marginBottom: 16 }}>Ranking barbeiros</h3>{proRevenue.length === 0 ? <EmptyState icon={() => <Award />} title="Sem dados" description="Sem marcações no período." /> : <div className="flex-col gap-14">{proRevenue.map((p, i) => <div key={p.id} className="flex items-center gap-10"><span style={{ width: 20, color: i === 0 ? '#C9A227' : 'var(--text-sec)' }}>#{i + 1}</span><Avatar name={p.name} /><div style={{ flex: 1 }}><div className="flex justify-between text-sm"><span className="fw-600">{p.name}</span><span className="text-gold">{formatPrice(p.revenue)}</span></div><div style={{ height: 4, background: 'var(--border)', marginTop: 5 }}><div style={{ height: '100%', width: `${(p.revenue / maxProRev) * 100}%`, background: i === 0 ? '#C9A227' : 'var(--text-sec)' }} /></div></div></div>)}</div>}</Card><Card className="card-pad"><h3 style={{ fontSize: 18, marginBottom: 16 }}>Serviços mais vendidos</h3>{svcDist.length === 0 ? <EmptyState icon={() => <Star />} title="Sem dados" /> : <div className="flex-col gap-12">{svcDist.map((s, i) => <div key={i} className="flex items-center gap-8"><span style={{ width: 9, height: 9, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length] }} /><span className="flex-1 text-sm">{s.name}</span><span className="fw-600 text-sm">{serviceTotal ? Math.round(s.count / serviceTotal * 100) : 0}%</span></div>)}</div>}</Card></div>
    </AdminLayout>
  );

  if (false) {
    return (
    <AdminLayout>
      <div className="page-head">
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1>Dashboard</h1>
              <PageInfo
                description="Centro de controlo que agrega os principais indicadores do negócio em tempo real: receita do período, marcações, ocupação e desempenho da equipa. É a primeira coisa que vês ao entrar e serve para tomares decisões rápidas sem precisares de abrir outras secções."
                impact="Um dashboard atualizado permite detetar problemas antes que se tornem prejuízo — uma taxa de ocupação baixa, uma queda de receita ou um aumento de cancelamentos são sinais que aparecem aqui primeiro."
                links={['Agenda', 'Clientes', 'Profissionais', 'Financeiro', 'Relatórios']}
              />
            </div>
            <p>{formatDateNum(range.from)} → {formatDateNum(range.to)}</p>
          </div>
          <div className="flex gap-8" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="period-tabs">
              <button className={period === 'today' ? 'active' : ''} onClick={() => setPeriod('today')}>Hoje</button>
              <button className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>Semana</button>
              <button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>Mês</button>
              <button className={period === 'custom' ? 'active' : ''} onClick={() => setPeriod('custom')}>Personalizado</button>
            </div>
          </div>
        </div>
        {period === 'custom' && (
          <div className="flex gap-12 mt-16" style={{ flexWrap: 'wrap' }}>
            <div className="field" style={{ marginBottom: 0 }}><label className="label">De</label><input type="date" className="input" value={custom.from} onChange={e => setCustom(f => ({ ...f, from: e.target.value }))} /></div>
            <div className="field" style={{ marginBottom: 0 }}><label className="label">Até</label><input type="date" className="input" value={custom.to} onChange={e => setCustom(f => ({ ...f, to: e.target.value }))} /></div>
          </div>
        )}
      </div>
      <PageInfo page="dashboard" />

      {/* KPIs */}
      <div className="dashboard-kpis dashboard-kpis-featured">
        <Card className="kpi kpi-featured">
          <button className="btn btn-ghost btn-icon btn-sm kpi-more" aria-label="Mais opções de receita" title="Mais opções"><MoreHorizontal size={18} /></button>
          <div className="kpi-icon-circle"><CreditCard size={22} /></div>
          <div className="label">Receita do período</div>
          <div className="value gold">{formatPrice(periodRevenue)}</div>
          <div className={`kpi-delta ${revDelta >= 0 ? 'up' : 'down'}`}><>{revDelta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}</><strong>{revDelta >= 0 ? '+' : ''}{revDelta.toFixed(0)}%</strong><span className="text-sec">{comparisonLabel}</span></div>
        </Card>
        <Card className="kpi kpi-featured">
          <button className="btn btn-ghost btn-icon btn-sm kpi-more" aria-label="Mais opções de marcações" title="Mais opções"><MoreHorizontal size={18} /></button>
          <div className="kpi-icon-circle"><CalendarDays size={22} /></div>
          <div className="label">Marcações</div>
          <div className="value">{periodActive.length}</div>
          <div className={`kpi-delta ${apptsDelta >= 0 ? 'up' : 'down'}`}><>{apptsDelta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}</><strong>{apptsDelta >= 0 ? '+' : ''}{apptsDelta.toFixed(0)}%</strong><span className="text-sec">{comparisonLabel}</span></div>
        </Card>
        <Card className="kpi kpi-featured">
          <button className="btn btn-ghost btn-icon btn-sm kpi-more" aria-label="Mais opções de novos clientes" title="Mais opções"><MoreHorizontal size={18} /></button>
          <div className="kpi-icon-circle"><UserPlus size={22} /></div>
          <div className="label">Novos clientes</div>
          <div className="value">{newCustomers}</div>
          <div className={`kpi-delta ${customersDelta >= 0 ? 'up' : 'down'}`}><>{customersDelta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}</><strong>{customersDelta >= 0 ? '+' : ''}{customersDelta.toFixed(0)}%</strong><span className="text-sec">{comparisonLabel}</span></div>
        </Card>
        <Card className="kpi kpi-featured" title={`${occupancyData.occupied} minutos ocupados de ${occupancyData.available} minutos disponíveis`}>
          <button className="btn btn-ghost btn-icon btn-sm kpi-more" aria-label="Mais opções de ocupação" title="Mais opções"><MoreHorizontal size={18} /></button>
          <div className="kpi-icon-circle"><TrendingUp size={22} /></div>
          <div className="label">Taxa de ocupação</div>
          <div className="value gold">{occupancy < 1 ? '< 1%' : `${occupancy}%`}</div>
          <div className={`kpi-delta ${occupancyDelta >= 0 ? 'up' : 'down'}`}><>{occupancyDelta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}</><strong>{occupancyDelta >= 0 ? '+' : ''}{occupancyDelta.toFixed(0)}%</strong><span className="text-sec">{comparisonLabel}</span></div>
        </Card>
      </div>

      <div className="dash-two-col">
        {/* Revenue trend */}
        <Card className="card-pad dash-chart-panel">
          <div className="dash-panel-head">
            <div><h3 style={{ fontSize: 18 }}>Receita ao longo do tempo</h3><p className="text-sec text-xs">Evolução da receita e marcações</p></div>
            <button className="period-pill active">Mês</button>
          </div>
          <div className="dash-chart-box chart-box">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenue7} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
                <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CHART_GOLD} stopOpacity={0.5} /><stop offset="100%" stopColor={CHART_GOLD} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#8A8272" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8A8272" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#1C1915', border: '1px solid #221E18', borderRadius: 8, fontSize: 13 }} labelStyle={{ color: '#EDE8DF' }} />
                <Area type="monotone" dataKey="rev" stroke={CHART_GOLD} strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Services distribution */}
        <Card className="card-pad dash-chart-panel">
          <div className="dash-panel-head">
            <div><h3 style={{ fontSize: 18 }}>Serviços mais vendidos</h3><p className="text-sec text-xs">Distribuição por serviço</p></div>
            <button className="period-pill">Todos</button>
          </div>
          {svcDist.length === 0 ? (
            <EmptyState icon={() => <Star />} title="Sem dados" />
          ) : (
            <div className="flex items-center gap-16" style={{ flexWrap: 'wrap' }}>
              <div className="service-donut" style={{ width: 170, height: 170 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={svcDist} dataKey="count" nameKey="name" innerRadius={42} outerRadius={75} paddingAngle={2}>
                      {svcDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" fill="#EDE8DF" fontSize="21" fontWeight="700">{serviceTotal}</text>
                    <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle" fill="#8A8272" fontSize="10">Marcações</text>
                    <Tooltip contentStyle={{ background: '#1C1915', border: '1px solid #221E18', borderRadius: 8, fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-col gap-8" style={{ flex: 1, minWidth: 130 }}>
                {svcDist.map((s, i) => (
                  <div key={i} className="flex items-center gap-8">
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-sm flex-1">{s.name}</span>
                    <span className="fw-600 text-sm">{serviceTotal ? Math.round(s.count / serviceTotal * 100) : 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

      </div>

      <div className="dash-two-col dash-lower">
        {/* Agenda do dia */}
        <Card className="card-pad">
          <div className="dash-panel-head">
            <div><h3 style={{ fontSize: 18 }}>Marcações de hoje</h3><p className="text-sec text-xs">{todayAppts.length} marcações agendadas</p></div>
            <button className="link-gold text-sm" onClick={() => navigate('/admin/agenda')}>Ver todas <ArrowUpRight size={14} /></button>
          </div>
          {todayAppts.length === 0 ? (
            <EmptyState icon={() => <CalendarDays />} title="Sem marcações hoje" description="O dia está livre." />
          ) : (
            <div className="dash-list">
              {todayAppts.slice(0, 6).map(a => {
                const svc = data.services.find(s => s.id === a.serviceId);
                const cust = data.customers.find(c => c.id === a.customerId);
                const statusLabel = a.status === 'confirmed' ? 'Confirmada' : a.status === 'completed' ? 'Concluída' : a.status === 'pending' ? 'Pendente' : a.status === 'cancelled' ? 'Cancelada' : 'Em espera';
                const statusVariant = a.status === 'confirmed' || a.status === 'completed' ? 'success' : a.status === 'pending' ? 'warning' : 'default';
                return (
                  <div key={a.id} className="dash-list-row">
                    <Avatar name={cust?.name} />
                    <div className="dash-list-name">{cust?.name || '—'}</div>
                    <div className="dash-list-time">{a.startTime}</div>
                    <div className="dash-list-service text-sec text-xs">{svc?.name || '—'}</div>
                    <Badge variant={statusVariant}>{statusLabel}</Badge>
                    <ChevronRight size={16} className="text-sec" />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="card-pad">
          <div className="dash-panel-head">
            <div><h3 style={{ fontSize: 18 }}>Clientes recentes</h3><p className="text-sec text-xs">Últimos clientes registados</p></div>
            <button className="link-gold text-sm" onClick={() => navigate('/admin/clientes')}>Ver todos <ArrowUpRight size={14} /></button>
          </div>
            {recentCustomers.length === 0 ? <EmptyState icon={() => <Users />} title="Sem clientes" description="Os clientes recentes aparecerão aqui." /> : (
              <div className="dash-list">
                {recentCustomers.map(c => (
                  <div key={c.id} className="dash-list-row">
                    <Avatar name={c.name} />
                    <div className="dash-list-name"><div className="text-sm">{c.name}</div><div className="text-sec text-xs">{c.email}</div></div>
                    <span className="text-sec text-xs dash-list-date">{c.joinedAt ? formatDateNum(c.joinedAt) : '—'}</span>
                    <ChevronRight size={16} className="text-sec" />
                  </div>
                ))}
              </div>
            )}
        </Card>
      </div>
    </AdminLayout>
    );
  }
}