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
import { getRevenue, getProductRevenue, getPackRevenue, getTotalRevenue, getExpensesTotal, getExpectedCash, getOccupancy, paidAppointments, netOfPayment, getCancellationCount, getCancellationRate, getNoShowCount, getNoShowRate } from '@/lib/domain/finance';
import { monthBounds, weekBounds, daysBetween } from '@/lib/domain/dates';
import { round2 } from '@/lib/domain/money';
import { ticketMedio as ticketMedioFn, jaMarcadoPorCobrar } from '@/lib/domain/finance';
import { estadoStock, produtosStockBaixo, produtosEsgotados } from '@/lib/domain/stock';
import { listConvectaNotifs, markConvectaNotifRead } from '@/lib/convectaNotifs';

const CHART_GOLD = 'var(--graf-1)';
const CHART_COLORS = ['var(--graf-1)', 'var(--graf-2)', 'var(--graf-3)', 'var(--graf-4)', 'var(--graf-5)'];
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
  // A receita do negocio sao os servicos MAIS os produtos vendidos ao balcao.
  // Os produtos estavam fora de todas as contas do painel: vendiam-se, o
  // dinheiro entrava na caixa, e aqui nao aparecia nada.
  const receitaServicos = getRevenue(data, range);
  const receitaProdutos = getProductRevenue(data, range);
  const receitaPacks = getPackRevenue(data, range);
  const periodRevenue = getTotalRevenue(data, range);
  const periodExpenses = getExpensesTotal(data, range);
  const periodResult = round2(periodRevenue - periodExpenses);
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
  // Ticket médio de um corte: só serviços. Um frasco de 450 € vendido ao
  // balcão não faz de cada corte um corte de 142 €.
  const ticketMedio = ticketMedioFn(data, range);

  // ticket médio do dia (receita paga hoje ÷ marcações pagas hoje)
  const todayPaid = paidAppointments(data, { from: today, to: today });
  const ticketDia = todayPaid.length ? getRevenue(data, { from: today, to: today }) / todayPaid.length : 0;
  const receitaHoje = getTotalRevenue(data, { from: today, to: today });

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
      const rev = getTotalRevenue(data, { from: dStr, to: dStr });
      arr.push({ day: getDowShort(new Date(dStr + 'T00:00:00')), rev });
    }
    return arr;
  }, [data, today]);
  const avgDaily = revenue7.reduce((s, d) => s + d.rev, 0) / 7;
  // Já marcado e ainda por cobrar no período (preço da marcação). A antiga
  // «previsão» multiplicava a média dos últimos 7 dias pelos dias do período:
  // uma venda grande num dia prometia milhares.
  const forecast = round2(periodRevenue + jaMarcadoPorCobrar(data, range));
  // Dias do período — usado para comparar com o período anterior.
  const rangeDays = Math.max(1, daysBetween(range.from, range.to));

  // services distribution
  const svcDist = useMemo(() => {
    const m = {};
    periodActive.forEach(a => { m[a.serviceId] = (m[a.serviceId] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, count]) => ({ name: data.services.find(s => s.id === id)?.name || '—', count }));
  }, [periodActive, data.services]);

  // funnel
  const funnel = [
    { label: 'Pendentes', value: periodAppts.filter(a => a.status === 'pending').length, color: 'var(--graf-3)' },
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
  const prevRevenue = getTotalRevenue(data, prevRange);
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
  const lowStock = [...produtosEsgotados(data.products), ...produtosStockBaixo(data.products)];
  const pendingToday = data.appointments.filter(a => a.date === today && a.status === 'pending').length;
  const sessaoCaixa = data.cashSessions.find(s => s.status === 'open') || null;
  const cashOpen = !!sessaoCaixa;
  const numerarioEsperado = getExpectedCash(data, sessaoCaixa);
  const endingPromos = data.promotions.filter(p => p.active && p.endsAt && p.endsAt >= today && p.endsAt <= addDays(today, 7));
  const alerts = [
    ...lowStock.map(p => ({ type: 'warn', icon: Package, title: `${estadoStock(p) === 'esgotado' ? 'Esgotado' : 'Stock baixo'}: ${p.name}`, sub: `${p.stock} ${p.unit} (mín. ${p.minStock})`, to: '/admin/inventario' })),
    ...endingPromos.map(p => ({ type: 'info', icon: Megaphone, title: `Promoção a terminar: ${p.name}`, sub: `Termina ${formatDate(p.endsAt)}`, to: '/admin/marketing' })),
    pendingToday > 0 ? { type: 'warn', icon: Clock, title: `${pendingToday} marcações pendentes`, sub: 'A aguardar confirmação hoje', to: '/admin/marcacoes' } : null,
    !cashOpen ? { type: 'info', icon: Lock, title: 'Caixa fechada', sub: 'Abre a caixa para registar vendas', to: '/admin/caixa' } : null
  ].filter(Boolean);

  const todayAppts = data.appointments.filter(a => a.date === today).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const recentCustomers = [...data.customers].sort((a, b) => (b.joinedAt || '').localeCompare(a.joinedAt || '')).slice(0, 4);

  return (
    <AdminLayout>
      <style dangerouslySetInnerHTML={{ __html: CSS_RESUMO }} />
      <div className="page-head" style={{ paddingBottom: 0 }}>
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          {/* Saiu a saudacao («Ola, Diogo») e a linha das datas por baixo do
              titulo: a saudacao nao e informacao, e as datas ja estao nos
              botoes Hoje/Semana/Mes que estao ao lado. */}
          <h1 style={{ margin: 0 }}>Resumo</h1>
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


      {/* A tira de avisos de stock saiu daqui a 28/09/2026: sao quatro
          rectangulos amarelos antes do primeiro numero, e o stock tem
          pagina propria. O Resumo responde a "como vai o negocio". */}

      {porConfirmar.length > 0 && (
        <Card className="mb-16" style={{ borderColor: 'rgba(201,162,39,0.45)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Bell size={17} style={{ color: '#C9A227' }} />
            <b style={{ fontSize: 15.5 }}>
              {porConfirmar.length === 1 ? '1 marcação por confirmar' : `${porConfirmar.length} marcações por confirmar`}
            </b>
            <button className="btn btn-ghost" style={{ marginLeft: 'auto', fontSize: 14 }}
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
                    <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                      {cliente?.name || a.customerNameSnapshot || 'Cliente'}
                    </span>
                    <span style={{ display: 'block', fontSize: 14, color: 'var(--text-sec)' }}>
                      {servico?.name || a.serviceNameSnapshot || 'Serviço'}
                      {pro?.name ? ` · ${pro.name}` : ''}
                    </span>
                  </span>
                  <span style={{ fontSize: 14, color: 'var(--text-sec)', whiteSpace: 'nowrap' }}>
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
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{n.title}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.5 }}>{n.body}</div>
                  <div style={{ fontSize: 13.5, color: 'var(--text-ter)', marginTop: 4 }}>{new Date(n.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} · Convecta</div>
                </div>
                <button onClick={() => handleDismissNotif(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-ter)', fontSize: 16, padding: '0 4px', lineHeight: 1, flexShrink: 0 }}>×</button>
              </div>
            );
          })}
        </div>
      )}
      {/*
        * OS NUMEROS: UM POR CARTAO, e so o numero.
        *
        * Eram cinco cartoes grandes com uma linha de detalhe por baixo
        * («Servicos 120 € · Produtos 30 €», «+12% vs periodo anterior») e,
        * logo a seguir, oito cartoes pequenos com mais oito numeros. Treze
        * numeros e nove frases num ecra que serve para responder a uma
        * pergunta: como e que vai o negocio.
        *
        * Ficam seis, cada um com rotulo e valor. O detalhe de cada um tem
        * pagina propria — a Caixa, os Relatorios, o Desempenho — e e la que
        * se vai quando um numero levanta uma pergunta.
        */}
      <div className="res-numeros">
        {[
          { l: 'Receita', v: formatPrice(periodRevenue) },
          { l: 'Marcações', v: periodActive.length },
          { l: 'Ocupação', v: `${occupancy}%`,
            cor: occupancy >= 70 ? '#22C55E' : occupancy >= 40 ? 'var(--gold-tinta)' : '#EF4444' },
          { l: 'Ticket médio', v: formatPrice(ticketMedio) },
          { l: 'Despesas', v: formatPrice(periodExpenses) },
          { l: 'Resultado', v: formatPrice(periodResult),
            cor: periodResult < 0 ? '#EF4444' : undefined },
        ].map(k => (
          <div className="res-num" key={k.l}>
            <span>{k.l}</span>
            <b style={k.cor ? { color: k.cor } : undefined}>{k.v}</b>
          </div>
        ))}
      </div>

      {/* A «Agenda de hoje» saiu daqui: e o separador «Hoje», que esta a um
          toque na barra de baixo, e era a mesma lista duas vezes. */}
      <Card className="card-pad dash-chart-panel" style={{ marginBottom: 14 }}>
        <div className="dash-panel-head"><h3 style={{ fontSize: 17 }}>Receita — últimos 7 dias</h3></div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={revenue7} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
            <defs><linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--graf-2)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--graf-2)" stopOpacity={0} />
            </linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--linha-grafico)" />
            <XAxis dataKey="day" stroke="var(--text-ter)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-ter)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
            <Area type="monotone" dataKey="rev" stroke="var(--graf-2)" strokeWidth={2.5} fill="url(#dashboardRevenue)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* O «Ranking barbeiros» e os «Servicos mais vendidos» sairam: o
          primeiro e a pagina Desempenho da equipa, o segundo e o relatorio
          de Servicos. Estavam aqui em versao resumida, a dizer o mesmo com
          menos detalhe — e a fazer deste ecra o dobro do tamanho. */}
    </AdminLayout>
  );

}

const CSS_RESUMO = `
.res-numeros {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 10px; margin-bottom: 16px;
}
.res-num {
  display: flex; flex-direction: column; gap: 8px;
  padding: 16px 18px; border-radius: var(--radius-card);
  background: var(--surface); border: 1px solid var(--border);
}
.res-num span { font-size: 14px; color: var(--text-sec); }
.res-num b { font-size: 24px; font-weight: 700; line-height: 1; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
/* Ao telemovel um por linha, como os da concorrencia: dois numeros grandes
   lado a lado num ecra de 390px ficam ambos espremidos. */
@media (max-width: 560px) {
  .res-numeros { grid-template-columns: 1fr; gap: 8px; }
  .res-num { flex-direction: row; align-items: baseline; justify-content: space-between; padding: 14px 16px; }
  .res-num b { font-size: 24px; }
}
`;
