import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarRange, CheckCircle2, XCircle, Trash2, Plus, Zap, Star } from 'lucide-react';
import { useStore, useAuth } from '@/hooks/useStore';
import AdminLayout from '@/components/AdminLayout';
import BotaoAtualizar from '@/components/admin/BotaoAtualizar';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Badge, Avatar, Button, EmptyState, Modal } from '@/components/ui';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { formatDateShortNum, formatPrice, localDateStr } from '@/lib/format';
import CheckoutModal from '@/components/admin/CheckoutModal';
import ConfirmDialog from '@/components/ConfirmDialog';

// A confirmacao automatica vivia enterrada em Parametros -> Agendamentos, onde
// ninguem ia. E uma decisao que se toma a olhar para as marcacoes — "estou
// farto de aceitar uma a uma" — por isso o interruptor fica aqui.
//
// Era um cartao inteiro no topo da pagina, antes do titulo: o primeiro que se
// via ao abrir as marcacoes era uma definicao, e nao as marcacoes. Agora e uma
// linha so, debaixo do titulo, do tamanho do que diz.
function InterruptorAutomatico() {
  const data = useStore();
  const toast = useToast();
  const [aGravar, setAGravar] = useState(false);
  const params = data.business?.config?.params || {};
  // Ligada por omissao: so fica desligada se o dono a desligar.
  const ligado = params.autoConfirm !== false;

  const trocar = async () => {
    setAGravar(true);
    try {
      await dataService.updateConfig('params', { ...params, autoConfirm: !ligado });
      toast.success(!ligado ? 'Marcações aceites automaticamente' : 'Voltou a confirmar uma a uma');
    } catch (e) {
      toast.error('Não foi possível guardar', e.message);
    } finally {
      setAGravar(false);
    }
  };

  return (
    <button type="button" className="linha-opcao" onClick={trocar} disabled={aGravar}
      role="switch" aria-checked={ligado}
      style={aGravar ? { opacity: 0.6, cursor: 'wait' } : undefined}>
      <Zap size={17} style={{ flexShrink: 0, color: ligado ? 'var(--gold-tinta)' : 'var(--text-sec)' }} />
      <span className="rotulo">Aceitar automaticamente</span>
      <span className="interruptor" aria-hidden="true"><i /></span>
    </button>
  );
}

const FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'confirmed', label: 'Confirmadas' },
  { key: 'cancelled', label: 'Canceladas' },
  { key: 'completed', label: 'Concluídas' }
];

const SCOPES = [
  { key: 'all', label: 'Tudo' },
  { key: 'today', label: 'Hoje' },
  { key: 'week', label: 'Esta semana' }
];

// Dia local, nao o dia em UTC: os filtros "Hoje" e "Esta semana"
// apanhavam o dia errado durante o horario de verao.
function iso(d) { return localDateStr(d); }

export default function AdminAppointments() {
  const data = useStore();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [scope, setScope] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [checkout, setCheckout] = useState(null);
  // A avaliação de um corte, se o cliente já a tiver deixado.
  const avaliacaoDe = (apptId) => (data.reviews || []).find(r => r.appointmentId === apptId) || null;

  const now = new Date();
  const todayStr = iso(now);
  const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const weekStart = iso(monday);
  const weekEnd = iso(sunday);

  const appts = data.appointments
    .filter(a => {
      if (scope === 'today' && a.date !== todayStr) return false;
      if (scope === 'week' && (a.date < weekStart || a.date > weekEnd)) return false;
      if (filter !== 'all' && a.status !== filter) return false;
      return true;
    })
    .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));

  const confirm = async (id) => {
    const a = await dataService.confirmAppointment(id);
    // O cliente e avisado por notificacao push (dataService.confirmAppointment).
    // Nao ha email de confirmacao — o aviso "Email enviado" era mentira.
    toast.success('Marcação confirmada');
  };
  const doCancel = async () => {
    await dataService.cancelAppointment(cancelTarget.id);
    toast.success('Marcação cancelada', `Referência ${cancelTarget.bookingRef}`);
    setCancelTarget(null);
  };
  const finishCheckout = async (payData) => {
    const a = data.appointments.find(x => x.id === checkout);
    if (a && a.status === 'confirmed') await dataService.markAttended(checkout);
    await dataService.checkoutAppointment(checkout, payData);

    toast.success('Marcação concluída', `${formatPrice(payData.total)} · ${payData.method} · venda registada na caixa`);
    setCheckout(null);
  };
  const remove = async () => {
    // Apagava so no ecra (e despejava o estado inteiro no localStorage). Ao
    // recarregar, a marcacao estava la outra vez. Agora apaga-se na base de
    // dados, e so depois se diz que foi.
    try {
      await dataService.deleteAppointment(deleteTarget.id);
      toast.success('Marcação eliminada');
    } catch (e) {
      toast.error('Não foi possível eliminar', e.message);
    }
    setDeleteTarget(null);
  };

  return (
    <AdminLayout>
      <div className="page-head">
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>Marcações</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <BotaoAtualizar />
            <Button variant="primary" onClick={() => navigate('/admin/agenda?nova=1')}><Plus size={16} /> Nova marcação</Button>
          </div>
        </div>
      </div>

      <InterruptorAutomatico />
      <PageInfo page="marcacoes" />

      <div className="chip-row">
        {SCOPES.map(s => (
          <button key={s.key} className={`chip ${scope === s.key ? 'active' : ''}`} onClick={() => setScope(s.key)}>{s.label}</button>
        ))}
        <span className="filtros-risco" aria-hidden="true" />
        {FILTERS.map(f => (
          <button key={f.key} className={`chip ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
      </div>

      {appts.length === 0 ? (
        <Card className="card-pad">
          <EmptyState icon={() => <CalendarRange />} title="Sem marcações" />
        </Card>
      ) : (
        <>
        {/* No telemovel uma tabela de oito colunas nao se le. Uma linha por
            marcacao: hora, nome, servico, estado, e os botoes. */}
        <div className="so-telemovel mrc-lista">
          {appts.map(a => {
            const cust = data.customers.find(c => c.id === a.customerId);
            const blocked = a.blocked || a.status === 'blocked';
            const cor = blocked ? 'var(--text-ter)' : a.status === 'pending' ? 'var(--warning)' : a.status === 'cancelled' ? 'var(--error)' : a.status === 'completed' ? 'var(--text-ter)' : 'var(--success)';
            return (
              <button type="button" key={a.id} className="mrc-linha" onClick={() => setDetalhe(a)}>
                <div className="mrc-quando"><b>{a.startTime}</b><span>{formatDateShortNum(a.date)}</span></div>
                <b className="mrc-nome">{blocked ? (a.label || 'Bloqueado') : (cust?.name || '—')}</b>
                <i className="mrc-estado" style={{ background: cor }} />
              </button>
            );
          })}
        </div>
        <Card className="so-pc">
          <table className="table">
            <thead>
              <tr><th className="ref">Ref.</th><th>Cliente</th><th>Serviço</th><th>Profissional</th><th>Data</th><th>Hora</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {appts.map(a => {
                const svc = data.services.find(s => s.id === a.serviceId);
                const cust = data.customers.find(c => c.id === a.customerId);
                const pro = data.professionals.find(p => p.id === a.professionalId);
                const blocked = a.blocked || a.status === 'blocked';
                const statusLabel = blocked ? 'Bloqueado' : a.status === 'confirmed' ? 'Confirmada' : a.status === 'completed' ? 'Concluída' : a.status === 'cancelled' ? 'Cancelada' : 'Pendente';
                const badgeVariant = blocked ? 'default' : a.status === 'pending' ? 'warning' : a.status === 'cancelled' ? 'danger' : a.status === 'completed' ? 'success' : 'success';
                return (
                  <tr key={a.id}>
                    <td className="ref text-gold fw-600 text-sm">{a.bookingRef || '—'}</td>
                    <td>
                      <div className="flex items-center gap-8">
                        <Avatar name={cust?.name} />
                        <span className="text-sm">{blocked ? (a.label || 'Bloqueado') : (cust?.name || '—')}</span>
                      </div>
                    </td>
                    <td className="text-sm">{blocked ? '—' : (svc?.name || '—')}</td>
                    <td className="text-sm">{pro?.name || '—'}</td>
                    <td className="text-sm">{formatDateShortNum(a.date)}</td>
                    <td className="text-sm">{a.startTime}</td>
                    <td>
                      <Badge variant={badgeVariant}>{statusLabel}</Badge>
                      {a.usaRecompensa && <Badge variant="gold" style={{ marginLeft: 6 }}>🎁 Grátis</Badge>}
                      {a.usaPack && <Badge variant="gold" style={{ marginLeft: 6 }}>Pack mensal</Badge>}
                      {(() => { const mb = dataService.mbwayDe?.(a.id); return mb ? <Badge variant={mb.estado === 'pago' ? 'success' : 'warning'} style={{ marginLeft: 6 }}>{mb.estado === 'pago' ? 'Pago MB WAY' : 'MB WAY por confirmar'}</Badge> : null; })()}
                      {/* A avaliação que o cliente deixou deste corte. */}
                      {avaliacaoDe(a.id) && (
                        <span title={avaliacaoDe(a.id).comment || 'Sem comentário'} style={{ marginLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 2, color: 'var(--gold-tinta)', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          <Star size={12} fill="currentColor" />{avaliacaoDe(a.id).rating}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-8">
                        {!blocked && a.status === 'pending' && <Button size="sm" variant="primary" onClick={() => confirm(a.id)} title="Confirmar marcação"><CheckCircle2 size={14} /></Button>}
                        {!blocked && a.status === 'confirmed' && <Button size="sm" variant="primary" onClick={() => setCheckout(a.id)} title="Concluir e cobrar"><CheckCircle2 size={14} /></Button>}
                        {!blocked && a.status !== 'cancelled' && a.status !== 'completed' && <Button size="sm" variant="secondary" onClick={() => setCancelTarget(a)} title="Cancelar"><XCircle size={14} /></Button>}
                        <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(a)} title="Eliminar"><Trash2 size={14} /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
        </>
      )}

      {/* A linha so diz a hora, o nome e uma cor. O resto esta aqui, ao tocar. */}
      {detalhe && (() => {
        const a = data.appointments.find(x => x.id === detalhe.id) || detalhe;
        const svc = data.services.find(s => s.id === a.serviceId);
        const cust = data.customers.find(c => c.id === a.customerId);
        const pro = data.professionals.find(p => p.id === a.professionalId);
        const blocked = a.blocked || a.status === 'blocked';
        const statusLabel = blocked ? 'Bloqueado' : a.status === 'confirmed' ? 'Confirmada' : a.status === 'completed' ? 'Concluída' : a.status === 'cancelled' ? 'Cancelada' : 'Pendente';
        const badgeVariant = blocked ? 'default' : a.status === 'pending' ? 'warning' : a.status === 'cancelled' ? 'danger' : 'success';
        const mb = dataService.mbwayDe?.(a.id);
        const av = avaliacaoDe(a.id);
        return (
          <Modal open onClose={() => setDetalhe(null)} title="">
            <div className="mrc-ficha">
              <div className="mrc-ficha-nome">{blocked ? (a.label || 'Bloqueado') : (cust?.name || '—')}</div>
              <div className="mrc-ficha-hora">{formatDateShortNum(a.date)} · {a.startTime}</div>
              <div className="mrc-ficha-etiq">
                <Badge variant={badgeVariant}>{statusLabel}</Badge>
                {a.usaRecompensa && <Badge variant="gold">🎁 Grátis</Badge>}
                {a.usaPack && <Badge variant="gold">Pack mensal</Badge>}
                {mb && <Badge variant={mb.estado === 'pago' ? 'success' : 'warning'}>{mb.estado === 'pago' ? 'Pago MB WAY' : 'MB WAY por confirmar'}</Badge>}
              </div>
              <div className="mrc-ficha-dados">
                {!blocked && <div><span>Serviço</span><b>{svc?.name || '—'}</b></div>}
                <div><span>Barbeiro</span><b>{pro?.name || '—'}</b></div>
                {a.bookingRef && <div><span>Ref.</span><b>{a.bookingRef}</b></div>}
                {av && <div><span>Avaliação</span><b style={{ color: 'var(--gold-tinta)' }}><Star size={13} fill="currentColor" /> {av.rating}{av.comment ? ` · «${av.comment}»` : ''}</b></div>}
              </div>
              <div className="mrc-ficha-botoes">
                {!blocked && a.status === 'pending' && <Button variant="primary" onClick={() => { confirm(a.id); setDetalhe(null); }}><CheckCircle2 size={15} /> Confirmar</Button>}
                {!blocked && a.status === 'confirmed' && <Button variant="primary" onClick={() => { setDetalhe(null); setCheckout(a.id); }}><CheckCircle2 size={15} /> Concluir e cobrar</Button>}
                {!blocked && a.status !== 'cancelled' && a.status !== 'completed' && <Button variant="secondary" onClick={() => { setDetalhe(null); setCancelTarget(a); }}><XCircle size={15} /> Cancelar</Button>}
                <Button variant="ghost" onClick={() => { setDetalhe(null); setDeleteTarget(a); }}><Trash2 size={15} /> Eliminar</Button>
              </div>
            </div>
          </Modal>
        );
      })()}

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Eliminar marcação"
        footer={<><Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button><Button variant="danger" onClick={remove}>Eliminar</Button></>}>
        <p className="text-sec">Eliminar permanentemente a marcação <span className="text-gold fw-600">{deleteTarget?.bookingRef}</span>?</p>
      </Modal>

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={doCancel}
        title="Cancelar marcação?"
        danger
        confirmLabel="Cancelar marcação"
        details={cancelTarget && (
          <>
            <div className="ag-detail-row"><span className="l">Cliente</span><span className="v">{data.customers.find(c => c.id === cancelTarget.customerId)?.name || '—'}</span></div>
            <div className="ag-detail-row"><span className="l">Serviço</span><span className="v">{data.services.find(s => s.id === cancelTarget.serviceId)?.name || '—'}</span></div>
            <div className="ag-detail-row"><span className="l">Profissional</span><span className="v">{data.professionals.find(p => p.id === cancelTarget.professionalId)?.name || '—'}</span></div>
            <div className="ag-detail-row"><span className="l">Data</span><span className="v">{formatDateShortNum(cancelTarget.date)} · {cancelTarget.startTime}</span></div>
          </>
        )}
        message="O cliente fica sem marcação nenhuma. Se o problema for só a hora, re-agenda na agenda em vez de cancelar."
        extra={cancelTarget && (
          <Button size="sm" variant="secondary"
            onClick={() => { const d = cancelTarget.date; setCancelTarget(null); navigate(`/admin/agenda?dia=${d}`); }}>
            Ir à agenda re-agendar
          </Button>
        )}
      />

      <CheckoutModal
        open={!!checkout}
        onClose={() => setCheckout(null)}
        appointment={checkout ? data.appointments.find(a => a.id === checkout) : null}
        customer={checkout ? data.customers.find(c => c.id === data.appointments.find(a => a.id === checkout)?.customerId) : null}
        service={checkout ? data.services.find(s => s.id === data.appointments.find(a => a.id === checkout)?.serviceId) : null}
        professional={checkout ? data.professionals.find(p => p.id === data.appointments.find(a => a.id === checkout)?.professionalId) : null}
        onConfirm={finishCheckout}
      />
    </AdminLayout>
  );
}

const CSS_MRC = `
.mrc-lista { display: flex; flex-direction: column; }
.mrc-linha {
  display: flex; align-items: center; gap: 12px; width: 100%; min-height: 56px; padding: 8px 4px;
  border: 0; border-bottom: 1px solid var(--border); background: transparent; color: var(--text); text-align: left; cursor: pointer;
}
.mrc-quando { display: flex; flex-direction: column; line-height: 1.2; width: 52px; flex-shrink: 0; }
.mrc-quando b { font-size: 15px; }
.mrc-quando span { font-size: 11.5px; color: var(--text-ter); }
.mrc-nome { flex: 1; min-width: 0; font-size: 15px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mrc-estado { width: 10px; height: 10px; border-radius: 999px; flex-shrink: 0; }
.mrc-ficha { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; }
.mrc-ficha-nome { font-size: 20px; font-weight: 700; }
.mrc-ficha-hora { font-size: 15px; color: var(--text-sec); }
.mrc-ficha-etiq { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
.mrc-ficha-dados { width: 100%; margin-top: 8px; border-radius: 14px; background: var(--elevated); border: 1px solid var(--border); overflow: hidden; text-align: left; }
.mrc-ficha-dados > div { display: flex; justify-content: space-between; gap: 12px; min-height: 46px; align-items: center; padding: 0 14px; border-bottom: 1px solid var(--border); font-size: 15px; }
.mrc-ficha-dados > div:last-child { border-bottom: 0; }
.mrc-ficha-dados span { color: var(--text-sec); flex-shrink: 0; }
.mrc-ficha-dados b { font-weight: 600; text-align: right; }
.mrc-ficha-botoes { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 10px; }
`;
if (typeof document !== 'undefined' && !document.getElementById('css-mrc')) {
  const st = document.createElement('style'); st.id = 'css-mrc'; st.textContent = CSS_MRC; document.head.appendChild(st);
}
