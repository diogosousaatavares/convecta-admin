import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarRange, CheckCircle2, XCircle, Trash2, Plus, Zap } from 'lucide-react';
import { useStore, useAuth } from '@/hooks/useStore';
import AvisoPush from '@/components/AvisoPush';
import AdminLayout from '@/components/AdminLayout';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Badge, Avatar, Button, EmptyState, Modal } from '@/components/ui';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { sendConfirmationEmail } from '@/lib/bookingEmail';
import { formatDateShortNum, formatPrice } from '@/lib/format';
import CheckoutModal from '@/components/admin/CheckoutModal';
import ConfirmDialog from '@/components/ConfirmDialog';

// A confirmacao automatica vivia enterrada em Parametros → Agendamentos, onde
// ninguem ia. E uma decisao que se toma a olhar para as marcacoes — "estou
// farto de aceitar uma a uma" — por isso o interruptor fica aqui.
function InterruptorAutomatico() {
  const data = useStore();
  const toast = useToast();
  const [aGravar, setAGravar] = useState(false);
  const params = data.business?.config?.params || {};
  const ligado = params.autoConfirm === true;

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
    <Card className="mb-16" style={{ borderColor: ligado ? 'rgba(201,162,39,0.45)' : undefined }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span style={{
          width: 38, height: 38, borderRadius: 11, display: 'grid', placeItems: 'center', flexShrink: 0,
          background: ligado ? 'rgba(201,162,39,0.14)' : 'var(--elevated)',
          color: ligado ? '#C9A227' : 'var(--text-sec)',
        }}>
          <Zap size={18} />
        </span>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div className="fw-600 text-sm">Aceitar marcações automaticamente</div>
          <div className="text-sec" style={{ fontSize: 12, marginTop: 2, lineHeight: 1.5 }}>
            {ligado
              ? 'As marcações entram já confirmadas. Continua a receber o aviso no telemóvel — só não tem de aceitar.'
              : 'Cada marcação fica pendente até a confirmar. Ligue se não quiser aceitar uma a uma.'}
          </div>
        </div>
        <button type="button" onClick={trocar} disabled={aGravar}
          role="switch" aria-checked={ligado}
          aria-label="Aceitar marcações automaticamente"
          style={{
            position: 'relative', width: 46, height: 26, borderRadius: 13, border: 'none',
            cursor: aGravar ? 'wait' : 'pointer', flexShrink: 0, padding: 0,
            background: ligado ? '#C9A227' : 'var(--border)',
            opacity: aGravar ? 0.6 : 1, transition: 'background 180ms ease',
          }}>
          <span style={{
            position: 'absolute', top: 3, left: ligado ? 23 : 3, width: 20, height: 20,
            borderRadius: '50%', background: '#fff', transition: 'left 180ms ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
          }} />
        </button>
      </div>
    </Card>
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

function iso(d) { return d.toISOString().slice(0, 10); }

export default function AdminAppointments() {
  const data = useStore();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [scope, setScope] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [checkout, setCheckout] = useState(null);

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
    toast.success('Marcação confirmada');
    const cust = data.customers.find(c => c.id === a.customerId);
    const svc = data.services.find(s => s.id === a.serviceId);
    const pro = data.professionals.find(p => p.id === a.professionalId);
    const res = await sendConfirmationEmail({ appointment: a, customer: cust, service: svc, professional: pro, business: data.business });
    if (res.ok) toast.info('Email enviado', `Confirmação enviada para ${cust?.email || ''}`);
    else if (!res.skipped) toast.error('Email não enviado', res.error);
  };
  const doCancel = async () => {
    await dataService.cancelAppointment(cancelTarget.id);
    toast.success('Marcação cancelada', `Referência ${cancelTarget.bookingRef}`);
    setCancelTarget(null);
  };
  const finishCheckout = async (payData) => {
    const a = data.appointments.find(x => x.id === checkout);
    if (a && a.date > todayStr) {
      toast.error('Ação não permitida', 'Não é possível concluir uma marcação futura.');
      return;
    }
    if (a && a.status === 'confirmed') await dataService.markAttended(checkout);
    await dataService.checkoutAppointment(checkout, payData);

    if (payData.products && payData.products.length > 0) {
      for (const item of payData.products) {
        const prod = data.products.find(p => p.id === item.productId);
        if (prod && prod.stock != null) {
          await dataService.updateProduct(item.productId, { stock: Math.max(0, prod.stock - item.qty) });
        }
      }
      if (payData.method === 'Dinheiro' && payData.productsTotal > 0) {
        const custName = data.customers.find(c => c.id === a?.customerId)?.name || '';
        await dataService.addCashMovement({
          type: 'in',
          amount: payData.productsTotal,
          description: `Venda de produtos — ${custName}`,
          method: 'Dinheiro',
          category: 'Venda de produto'
        });
      }
    }

    toast.success('Marcação concluída', `${formatPrice(payData.total)} · ${payData.method} · venda registada na caixa`);
    setCheckout(null);
  };
  const remove = async () => {
    data.appointments = data.appointments.filter(a => a.id !== deleteTarget.id);
    localStorage.setItem('convecta_data', JSON.stringify(data));
    toast.success('Marcação eliminada');
    setDeleteTarget(null);
  };

  return (
    <AdminLayout>
      <AvisoPush businessId={data.business?.id} userId={user?.id} papel="admin"
        texto={{ titulo: 'Ligue as notificações',
                 corpo: 'Assim que entrar uma marcação, recebe um aviso no telemóvel para a confirmar. Sem isto, só a vê quando abrir o painel.' }}/>
      <InterruptorAutomatico />
      <div className="page-head">
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1>Todas as marcações</h1>
              <PageInfo
                description="Lista completa de todas as marcações — passadas, presentes e futuras — com filtros por estado, profissional, serviço e período. Permite confirmar, concluir, cancelar e auditar o histórico completo."
                impact="Ter visibilidade total sobre as marcações permite identificar padrões de cancelamento, profissionais sobrecarregados e serviços mais procurados, orientando decisões operacionais e comerciais."
                links={['Agenda', 'Clientes', 'Profissionais', 'Financeiro', 'Relatórios']}
              />
            </div>
            <p>{appts.length} {appts.length === 1 ? 'marcação' : 'marcações'} a apresentar.</p>
          </div>
          <Button variant="primary" onClick={() => navigate('/admin/agenda')}><Plus size={16} /> Nova marcação</Button>
        </div>
      </div>
      <PageInfo page="marcacoes" />

      <div className="flex items-center gap-8 mb-16" style={{ marginBottom: 16 }}>
        <span className="text-sec text-sm">Período:</span>
        {SCOPES.map(s => (
          <button key={s.key} className={`chip ${scope === s.key ? 'active' : ''}`} onClick={() => setScope(s.key)}>{s.label}</button>
        ))}
      </div>
      <div className="flex items-center gap-8 mb-16" style={{ marginBottom: 16 }}>
        <span className="text-sec text-sm">Estado:</span>
        {FILTERS.map(f => (
          <button key={f.key} className={`chip ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
      </div>

      {appts.length === 0 ? (
        <Card className="card-pad">
          <EmptyState icon={() => <CalendarRange />} title="Sem marcações" description="Não há marcações neste filtro." />
        </Card>
      ) : (
        <Card>
          <table className="table">
            <thead>
              <tr><th>Ref.</th><th>Cliente</th><th>Serviço</th><th>Profissional</th><th>Data</th><th>Hora</th><th>Estado</th><th></th></tr>
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
                    <td className="text-gold fw-600 text-sm">{a.bookingRef || '—'}</td>
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
      )}

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
        message="Esta ação irá alterar o estado da marcação para Cancelada."
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