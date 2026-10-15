import React, { useMemo, useState } from 'react';
import { Users, UserPlus, Repeat } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { Card, EmptyState } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatPrice, todayStr, addDays } from '@/lib/format';
import { paidAppointments, resumoCliente } from '@/lib/domain/finance';
import { round2 } from '@/lib/domain/money';
import ListaPessoas, { Periodo } from '@/components/admin/ListaPessoas';
import Ajuda from '@/components/admin/Ajuda';

// Ativo no período = teve uma visita paga no período.
// Recorrente = cliente ativo que já tem 2 ou mais visitas pagas (no total).
// Total gasto = serviços sem gorjeta + produtos + packs (resumoCliente).
export default function RepClients() {
  const data = useStore();
  const [from, setFrom] = useState(addDays(todayStr(), -29));
  const [to, setTo] = useState(todayStr());

  const newClients = data.customers.filter(c => (c.joinedAt || '') >= from && (c.joinedAt || '') <= to);
  const ativos = useMemo(() => {
    const ids = new Set(paidAppointments(data, { from, to }).map(a => a.customerId).filter(Boolean));
    return data.customers.filter(c => ids.has(c.id)).map(c => ({ c, r: resumoCliente(data, c.id) }))
      .sort((a, b) => b.r.totalGasto - a.r.totalGasto);
  }, [data, from, to]);
  const recorrentes = ativos.filter(x => x.r.visitas >= 2);
  const totalGasto = round2(data.customers.reduce((s, c) => s + resumoCliente(data, c.id).totalGasto, 0));

  return (
    <AdminPage title="Relatório de Clientes" subtitle="Novos, ativos, recorrentes e gastos.">
      <Periodo from={from} to={to} setFrom={setFrom} setTo={setTo} />
      <div className="kpi-grid">
        <Card className="kpi"><Users className="icon" size={22} /><div className="label">Total clientes</div><div className="value">{data.customers.length}</div></Card>
        <Card className="kpi"><UserPlus className="icon" size={22} /><div className="label">Novos (período)</div><div className="value">{newClients.length}</div></Card>
        <Card className="kpi"><Repeat className="icon" size={22} /><div className="label">Recorrentes (2+ visitas)</div><div className="value">{recorrentes.length}</div></Card>
        <Card className="kpi"><div className="label">Total gasto (acumulado)</div><div className="value gold">{formatPrice(totalGasto)}</div></Card>
      </div>
      {/* Uma linha por cliente (15/10/2026): nome, visitas por baixo, o gasto
          à direita; tocar abre o detalhe. */}
      <div className="nt-titulo">Vieram neste período ({ativos.length}) <Ajuda titulo="Quem vieram" texto={<p>Clientes com pelo menos uma visita paga entre as duas datas. O gasto é tudo o que já pagaram: serviços (sem gorjetas), produtos e packs.</p>} /></div>
      {ativos.length === 0 ? <Card className="card-pad"><EmptyState title="Ninguém veio neste período" /></Card> : (
        <ListaPessoas linhas={ativos.map(({ c, r }) => ({
          id: c.id, nome: c.name,
          sub: `${r.visitas} ${r.visitas === 1 ? 'visita' : 'visitas'}`,
          valor: formatPrice(r.totalGasto),
          detalhe: [['Visitas', r.visitas], ['Serviços', formatPrice(r.servicos || 0)], ['Produtos', formatPrice(r.produtos || 0)], ['Packs', formatPrice(r.packs || 0)], ['Total', formatPrice(r.totalGasto)]],
        }))} />
      )}
    </AdminPage>
  );
}
