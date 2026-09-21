import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Repeat, Check, CalendarDays } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import { Card, Badge, Avatar, EmptyState, Button } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatDateShortNum, localDateStr } from '@/lib/format';
import { listarVendas } from '@/lib/packsService';

/*
 * Agenda › Pack mensal — as marcações pagas com o pack, à parte das outras.
 *
 * Em cima, as próximas marcações de pack por ordem de dia: o barbeiro vê de
 * relance quem vem «de pack» (não se cobra) e em que corte do pack vai.
 * Em baixo, um cartão por cliente com pack ativo, igual ao que o cliente vê
 * na app: ✓ verde feito, riscado marcado (com a data), vazio por marcar.
 */

const ESTADO = {
  pending: { texto: 'Por confirmar', variante: 'warning' },
  confirmed: { texto: 'Confirmada', variante: 'success' },
  completed: { texto: 'Feito', variante: 'success' },
  no_show: { texto: 'Faltou', variante: 'danger' },
};

const riscado = {
  background: 'linear-gradient(to top right, transparent calc(50% - 1.5px), #C9A227 calc(50% - 1.5px), #C9A227 calc(50% + 1.5px), transparent calc(50% + 1.5px))',
};

export default function PackMarcacoes() {
  const data = useStore();
  const navigate = useNavigate();
  const businessId = data.business?.id;
  const [vendas, setVendas] = useState([]);
  const [erro, setErro] = useState('');
  const [verPassadas, setVerPassadas] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    listarVendas(businessId).then(setVendas).catch(e => setErro(e.message));
  }, [businessId, data.appointments.length]);

  const hoje = localDateStr(new Date());
  const nome = (id) => data.customers.find(c => c.id === id)?.name || 'Cliente';
  const servico = (id) => data.services.find(s => s.id === id)?.name || 'Serviço';
  const barbeiro = (id) => data.professionals.find(p => p.id === id)?.name || '—';

  // As marcações de cada pack, pela ordem do dia — é daí que sai «corte 2 de 4».
  const porPack = useMemo(() => {
    const m = {};
    data.appointments
      .filter(a => a.usaPack && a.pacoteId && a.status !== 'cancelled' && !a.packDevolvido)
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
      .forEach(a => { (m[a.pacoteId] = m[a.pacoteId] || []).push(a); });
    return m;
  }, [data.appointments]);

  const lista = data.appointments
    .filter(a => a.usaPack && a.status !== 'cancelled')
    .filter(a => verPassadas ? a.date < hoje : a.date >= hoje)
    .sort((a, b) => verPassadas
      ? (b.date + b.startTime).localeCompare(a.date + a.startTime)
      : (a.date + a.startTime).localeCompare(b.date + b.startTime));

  const qualCorte = (a) => {
    const v = vendas.find(x => x.id === a.pacoteId);
    const i = (porPack[a.pacoteId] || []).findIndex(x => x.id === a.id);
    return v && i >= 0 ? `${i + 1} de ${v.total}` : '';
  };

  const ativos = vendas.filter(v => v.activo || (!v.anulado && !v.expirado && (porPack[v.id] || []).some(a => a.status !== 'completed' && a.status !== 'no_show')));
  const ligado = data.business?.packs?.ativo === true;

  return (
    <AdminPage
      title="Marcações do pack mensal"
      subtitle="Só as marcações pagas com o pack — não se cobram no balcão."
      actions={<Button variant="secondary" onClick={() => navigate('/admin/packs/clientes')}><Repeat size={16} /> Packs dos clientes</Button>}
    >
      {!ligado && (
        <Card className="card-pad mb-16">O programa de packs está desligado. Liga-o em Packs para os clientes poderem marcar com o pack.</Card>
      )}
      {erro && <Card className="card-pad mb-16" style={{ borderColor: 'var(--error)' }}>{erro}</Card>}

      <div className="chip-row" style={{ marginBottom: 12 }}>
        <button className={`chip ${!verPassadas ? 'active' : ''}`} onClick={() => setVerPassadas(false)}>Próximas</button>
        <button className={`chip ${verPassadas ? 'active' : ''}`} onClick={() => setVerPassadas(true)}>Já passaram</button>
      </div>

      {lista.length === 0 ? (
        <Card className="card-pad mb-24">
          <EmptyState icon={() => <CalendarDays />}
            title={verPassadas ? 'Ainda não houve cortes de pack' : 'Nenhum corte de pack marcado'}
            description="Quando um cliente marcar com o pack, a marcação aparece aqui e na agenda com a etiqueta PACK." />
        </Card>
      ) : (
        <Card className="card-pad mb-24" style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead><tr><th>Dia</th><th>Hora</th><th>Cliente</th><th>Serviço</th><th>Barbeiro</th><th>Corte</th><th>Estado</th></tr></thead>
            <tbody>
              {lista.map(a => {
                const est = ESTADO[a.status] || { texto: a.status, variante: 'default' };
                return (
                  <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => {
                    // A agenda abre no dia desta marcação.
                    try { sessionStorage.setItem('convecta_agenda_dia', a.date); } catch { /* abre em hoje */ }
                    navigate('/admin/agenda');
                  }}>
                    <td className="text-sm fw-600" style={{ whiteSpace: 'nowrap' }}>{formatDateShortNum(a.date)}</td>
                    <td className="text-sm text-gold fw-600">{a.startTime}</td>
                    <td><div className="flex items-center gap-8"><Avatar name={nome(a.customerId)} /><span className="text-sm fw-600">{nome(a.customerId)}</span></div></td>
                    <td className="text-sm">{servico(a.serviceId)}</td>
                    <td className="text-sm">{barbeiro(a.professionalId)}</td>
                    <td className="text-sm" style={{ whiteSpace: 'nowrap' }}>{qualCorte(a)}</td>
                    <td><Badge variant={est.variante}>{est.texto}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <h3 className="text-sm fw-600" style={{ margin: '0 0 10px' }}>Cartões dos clientes com pack</h3>
      {ativos.length === 0 ? (
        <Card className="card-pad"><p className="text-sec text-sm" style={{ margin: 0 }}>Ninguém tem um pack a decorrer.</p></Card>
      ) : (
        <div className="grid-3">
          {ativos.map(v => {
            const ms = porPack[v.id] || [];
            const feitos = ms.filter(a => a.status === 'completed').length;
            const marcadas = ms.filter(a => a.status !== 'completed' && a.status !== 'no_show');
            return (
              <Card key={v.id} className="card-pad">
                <div className="flex items-center gap-8 mb-16">
                  <Avatar name={nome(v.customerId)} />
                  <div>
                    <div className="fw-600 text-sm">{nome(v.customerId)}</div>
                    <div className="text-sec text-xs">{v.nome} · até {formatDateShortNum(v.validoAte)}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(v.total, 8)}, 1fr)`, gap: 8 }}>
                  {Array.from({ length: v.total }).map((_, i) => {
                    const feito = i < feitos;
                    const m = !feito ? marcadas[i - feitos] : null;
                    return (
                      <div key={i} style={{ display: 'grid', justifyItems: 'center', gap: 3 }}>
                        <div style={{
                          width: '100%', aspectRatio: '1', borderRadius: '50%', display: 'grid', placeItems: 'center',
                          border: `2px ${feito || m ? 'solid' : 'dashed'} ${feito ? '#16a34a' : 'var(--border-strong, var(--border))'}`,
                          ...(feito ? { background: '#16a34a', color: '#fff' } : m ? riscado : null),
                        }} title={feito ? 'Feito' : m ? `Marcado · ${formatDateShortNum(m.date)} ${m.startTime}` : 'Por marcar'}>
                          {feito && <Check size={14} strokeWidth={3} />}
                        </div>
                        <span className="text-sec" style={{ fontSize: 10 }}>{m ? formatDateShortNum(m.date) : ' '}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-sec text-xs mt-8">
                  {feitos} feito{feitos === 1 ? '' : 's'} · {marcadas.length} marcado{marcadas.length === 1 ? '' : 's'} · {v.restantes} por marcar
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}
