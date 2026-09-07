import React, { useState, useMemo } from 'react';
import { Cake, Search } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Avatar, EmptyState, Badge } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatDateShortNum } from '@/lib/format';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function ClientBirthdays() {
  const data = useStore();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    return data.customers.filter(c => {
      if (!c.birthDate) return false;
      const m = Number(c.birthDate.split('-')[1]);
      if (month !== 'all' && m !== Number(month)) return false;
      if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    }).sort((a, b) => (a.birthDate || '').slice(5).localeCompare((b.birthDate || '').slice(5)));
  }, [data.customers, month, q]);

  const withBirthday = data.customers.filter(c => c.birthDate).length;

  return (
    <AdminPage title="Aniversários" subtitle="Clientes por mês de aniversário."
      info={{ description: 'Lista de clientes com aniversário próximo, organizada por mês. Serve para enviar mensagens personalizadas, criar promoções especiais ou simplesmente demonstrar atenção — transformando a data num motivo de visita.', impact: 'Um simples contacto de aniversário tem uma taxa de conversão muito superior a qualquer campanha genérica. Clientes que se sentem lembrados voltam mais vezes e recomendam mais.', links: ['Clientes', 'Promoções', 'Cupões'] }}
    >
      <div className="flex items-center gap-12 mb-24" style={{ flexWrap: 'wrap' }}>
        <div className="flex items-center gap-8">
          <Search size={16} style={{ color: 'var(--text-sec)' }} />
          <input className="input" style={{ maxWidth: 240 }} placeholder="Procurar cliente…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className="select" style={{ width: 'auto' }} value={month} onChange={e => setMonth(e.target.value)}>
          <option value="all">Todos os meses</option>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
      </div>

      {withBirthday === 0 ? (
        <Card className="card-pad"><EmptyState icon={() => <Cake />} title="Sem datas de nascimento" description="Preenche a data de nascimento nos perfis dos clientes para ver os aniversários." /></Card>
      ) : list.length === 0 ? (
        <Card className="card-pad"><EmptyState icon={() => <Cake />} title="Nenhum aniversário" description="Não há aniversários no período selecionado." /></Card>
      ) : (
        <Card className="card-pad">
          <table className="table">
            <thead><tr><th>Cliente</th><th>Contacto</th><th>Aniversário</th><th>Idade</th></tr></thead>
            <tbody>
              {list.map(c => {
                const d = new Date(c.birthDate + 'T00:00:00');
                const today = new Date();
                let age = today.getFullYear() - d.getFullYear();
                return (
                  <tr key={c.id}>
                    <td><div className="flex items-center gap-12"><Avatar name={c.name} /><span className="fw-600 text-sm">{c.name}</span></div></td>
                    <td className="text-sm">{c.email}</td>
                    <td><Badge variant="gold">{formatDateShortNum(c.birthDate)}</Badge></td>
                    <td className="text-sec text-sm">{age >= 0 ? `${age} anos` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </AdminPage>
  );
}