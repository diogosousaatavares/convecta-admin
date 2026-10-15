import React, { useMemo, useState } from 'react';
import { Award } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { Card, EmptyState } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatPrice, todayStr, addDays } from '@/lib/format';
import { resumoProfissional } from '@/lib/domain/finance';
import ListaPessoas, { Periodo } from '@/components/admin/ListaPessoas';

export default function ProPerformance({ titulo = 'Desempenho', subtitulo = 'Indicadores calculados a partir das marcações reais.' }) {
  const data = useStore();
  const [from, setFrom] = useState(addDays(todayStr(), -29));
  const [to, setTo] = useState(todayStr());

  const inRange = (d) => d >= from && d <= to;
  const appts = data.appointments.filter(a => inRange(a.date) && !a.blocked);

  // Receita, comissão, gorjetas e marcações pagas: as mesmas contas das
  // Comissões e da Conta do Profissional (resumoProfissional). As marcações
  // «na agenda» e as canceladas contam-se pela data da marcação.
  const rows = useMemo(() => data.professionals.map(p => {
    const r = resumoProfissional(data, p.id, { from, to });
    const pa = appts.filter(a => a.professionalId === p.id);
    return { p, total: pa.length, done: r.marcacoes, cancelled: pa.filter(a => a.status === 'cancelled').length, revenue: r.receita, commission: r.comissao, tips: r.gorjetas, clients: r.clientes, ticket: r.ticket };
  }), [data, appts, from, to]);

  // Uma linha por pessoa, a receita à direita; a ficha tem o resto.
  const linhas = rows.map(r => ({
    id: r.p.id, nome: r.p.name,
    sub: `${r.done} ${r.done === 1 ? 'paga' : 'pagas'} · ${r.clients} ${r.clients === 1 ? 'cliente' : 'clientes'}`,
    valor: formatPrice(r.revenue),
    detalhe: [
      ['Na agenda', r.total], ['Pagas', r.done], ['Canceladas', r.cancelled], ['Receita', formatPrice(r.revenue)],
      ['Comissão', formatPrice(r.commission)], ['Gorjetas', formatPrice(r.tips)], ['Clientes', r.clients], ['Ticket médio', formatPrice(r.ticket)],
    ],
  }));

  return (
    <AdminPage title={titulo} subtitle={subtitulo}>
      <Periodo from={from} to={to} setFrom={setFrom} setTo={setTo} />
      {data.professionals.length === 0 ? (
        <Card className="card-pad"><EmptyState icon={() => <Award />} title="Sem profissionais" /></Card>
      ) : (
        <ListaPessoas linhas={linhas} />
      )}
    </AdminPage>
  );
}
