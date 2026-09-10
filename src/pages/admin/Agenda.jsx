import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Printer, RefreshCw, X, Clock, ShoppingBag } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import AdminLayout from '@/components/AdminLayout';
import PageInfo from '@/components/admin/PageInfo';
import AgendaCalendar from '@/components/admin/AgendaCalendar';
import AgendaSidebar from '@/components/admin/AgendaSidebar';
import { Card, Badge, Avatar, Button, EmptyState, Modal } from '@/components/ui';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { sendConfirmationEmail } from '@/lib/bookingEmail';
import { formatDate, dateToStr, todayStr, formatPrice } from '@/lib/format';
import CheckoutModal from '@/components/admin/CheckoutModal';
import VendaAvulsoModal from '@/components/admin/VendaAvulsoModal';
import ConfirmDialog from '@/components/ConfirmDialog';

function toMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function toTime(mins) { const h = Math.floor(mins / 60), m = mins % 60; return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); }

// Uma marcação cancelada pelo cliente e uma cancelada pela barbearia contam-se
// de maneiras diferentes no fim do mês, e tratam-se de maneiras diferentes no
// momento. Dizer só "Cancelada" obriga o barbeiro a adivinhar.
function rotuloEstado(a) {
  if (a.status === 'confirmed') return 'Confirmada';
  if (a.status === 'completed') return 'Concluída';
  if (a.status === 'cancelled') {
    if (a.cancelledBy === 'cliente') return 'Cancelada pelo cliente';
    if (a.cancelledBy === 'barbearia') return 'Cancelada pela barbearia';
    return 'Cancelada';
  }
  return 'Pendente';
}

export default function Agenda() {
  const data = useStore();
  const toast = useToast();
  const [date, setDate] = useState(todayStr());
  const [mode, setMode] = useState('grid');
  const [blockMode, setBlockMode] = useState(false);
  const [selected, setSelected] = useState(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quick, setQuick] = useState({ customerId: '', serviceId: '', professionalId: '', startTime: '' });
  const [quickError, setQuickError] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [vendaOpen, setVendaOpen] = useState(false);

  const shift = (n) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + n);
    setDate(dateToStr(d));
  };

  // As canceladas continuam na lista de baixo, com a etiqueta a dizer quem
  // desmarcou, mas saem da grelha das horas: o lugar esta livre e tem de se
  // ver que esta livre.
  const dayAppts = data.appointments.filter(a => a.date === date);
  const dayAppstNaGrelha = dayAppts.filter(a => a.status !== 'cancelled');
  const apptsByDate = useMemo(() => {
    const map = {};
    data.appointments.forEach(a => { if (a.blocked || a.status !== 'cancelled') map[a.date] = (map[a.date] || 0) + 1; });
    return map;
  }, [data.appointments]);

  const confirm = async (id) => {
    const a = await dataService.confirmAppointment(id);
    toast.success('Marcação confirmada');
    const cust = data.customers.find(c => c.id === a.customerId);
    const svc = data.services.find(s => s.id === a.serviceId);
    const pro = data.professionals.find(p => p.id === a.professionalId);
    const res = await sendConfirmationEmail({ appointment: a, customer: cust, service: svc, professional: pro, business: data.business });
    if (res.ok) toast.info('Email enviado', `Confirmação enviada para ${cust?.email || ''}`);
    else if (!res.skipped) toast.error('Email não enviado', res.error);
    setSelected(null);
  };
  const [checkout, setCheckout] = useState(null);
  const attend = (id) => { setCheckout(id); setSelected(null); };
  const finishCheckout = async (payData) => {
    const a = data.appointments.find(x => x.id === checkout);
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

    toast.success('Cobrança concluída', `${formatPrice(payData.total)} · ${payData.method}`);
    setCheckout(null);
  };
  const doCancel = async () => {
    if (cancelTarget.blocked || cancelTarget.status === 'blocked') {
      await dataService.deleteAppointment(cancelTarget.id);
      toast.success('Bloqueio removido');
    } else {
      await dataService.cancelAppointment(cancelTarget.id);
      toast.success('Marcação cancelada', `Referência ${cancelTarget.bookingRef || ''}`);
    }
    setCancelTarget(null);
    setSelected(null);
  };
  const askCancel = (a) => { setCancelTarget(a); setSelected(null); };

  const handleBlock = async (proId, startTime) => {
    const label = window.prompt('Motivo do bloqueio (opcional):', 'Bloqueado') || 'Bloqueado';
    const dur = 30;
    await dataService.createAppointment({
      blocked: true,
      label,
      professionalId: proId,
      date,
      startTime,
      endTime: toTime(toMin(startTime) + dur),
      status: 'blocked'
    });
    toast.success('Horário bloqueado', `${startTime} · ${data.professionals.find(p => p.id === proId)?.name}`);
    setBlockMode(false);
  };

  const submitQuick = async () => {
    setQuickError('');
    if (!quick.serviceId) {
      setQuickError('Seleciona um serviço');
      return;
    }
    if (!quick.customerId || !quick.serviceId || !quick.professionalId || !quick.startTime) {
      toast.error('Preenche tudo', 'Cliente, serviço, barbeiro e hora são obrigatórios.');
      return;
    }
    const svc = data.services.find(s => s.id === quick.serviceId);
    await dataService.createAppointment({
      customerId: quick.customerId,
      serviceId: quick.serviceId,
      professionalId: quick.professionalId,
      date,
      startTime: quick.startTime,
      endTime: toTime(toMin(quick.startTime) + svc.durationMinutes),
      status: 'confirmed'
    });
    toast.success('Encaixe criado', 'Marcação confirmada na agenda.');
    setQuickOpen(false);
    setQuick({ customerId: '', serviceId: '', professionalId: '', startTime: '' });
  };

  const selAppt = selected ? data.appointments.find(a => a.id === selected) : null;
  const selSvc = selAppt && data.services.find(s => s.id === selAppt.serviceId);
  const selCust = selAppt && data.customers.find(c => c.id === selAppt.customerId);
  const selPro = selAppt && data.professionals.find(p => p.id === selAppt.professionalId);

  const sortedList = [...dayAppts].filter(a => !a.blocked).sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <AdminLayout>
      <div className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h1>Agenda</h1>
          <PageInfo
            description="Vista diária de todas as marcações organizadas por hora e profissional. Permite confirmar marcações, fazer checkout, criar bloqueios, registar encaixes e gerir o fluxo operacional do dia em tempo real."
            impact="A agenda é o coração operacional do negócio. Cada slot vazio é receita perdida. Gerir bem a agenda significa maximizar a ocupação e garantir que nenhum cliente fica esquecido."
            links={['Marcações', 'Clientes', 'Profissionais', 'Caixa', 'Encaixes', 'Bloqueios']}
          />
        </div>
        <p>Gere marcações, disponibilidade e encaixes.</p>
      </div>
      <PageInfo page="agenda" />
      <div className="agenda-toolbar">
        <div className="ag-tb-left">
          <button className="ag-nav-btn" aria-label="Dia anterior" onClick={() => shift(-1)} title="Dia anterior"><ChevronLeft size={18} /></button>
          <button className="ag-nav-btn" aria-label="Dia seguinte" onClick={() => shift(1)} title="Dia seguinte"><ChevronRight size={18} /></button>
          <Button size="sm" variant="secondary" onClick={() => setDate(todayStr())}>Hoje</Button>
          <Button size="sm" variant="primary" onClick={() => setQuickOpen(true)}><Plus size={15} /> Encaixe</Button>
          <button className="btn-gold-pill btn-sm" onClick={() => setVendaOpen(true)}><ShoppingBag size={15} /> Venda</button>
        </div>
        <h2 className="ag-date">{formatDate(date)}</h2>
        <div className="ag-tb-right">
          <div className="ag-viewseg">
            <button className={mode === 'grid' ? 'active' : ''} onClick={() => setMode('grid')}>Dia</button>
            <button onClick={() => { setMode('grid'); toast.info('Vista de semana em breve'); }}>Semana</button>
            <button onClick={() => { setMode('grid'); toast.info('Vista de mês em breve'); }}>Mês</button>
          </div>
          <button className="ag-ico-btn" aria-label="Imprimir agenda" onClick={() => window.print()} title="Imprimir agenda"><Printer size={16} /></button>
        </div>
      </div>

      <div className="agenda-wrap">
        <div>
          {mode === 'grid' && (
            <AgendaCalendar
              date={date}
              appts={dayAppstNaGrelha}
              professionals={data.professionals}
              services={data.services}
              customers={data.customers}
              blockMode={blockMode}
              onBlock={handleBlock}
              onSelect={(a) => setSelected(a.id)}
            />
          )}
          {mode === 'list' && (
            <Card className="card-pad">
              {sortedList.length === 0 ? (
                <EmptyState icon={() => <Clock />} title="Sem marcações" description="Não há marcações neste dia." />
              ) : (
                <table className="table">
                  <thead><tr><th>Hora</th><th>Cliente</th><th>Serviço</th><th>Barbeiro</th><th>Estado</th><th></th></tr></thead>
                  <tbody>
                    {sortedList.map(a => {
                      const svc = data.services.find(s => s.id === a.serviceId);
                      const cust = data.customers.find(c => c.id === a.customerId);
                      const pro = data.professionals.find(p => p.id === a.professionalId);
                      return (
                        <tr key={a.id}>
                          <td className="fw-600 text-gold">{a.startTime}</td>
                          <td><div className="flex items-center gap-8"><Avatar name={cust?.name} /><div><div className="fw-600 text-sm">{cust?.name}</div><div className="text-sec text-xs">{a.bookingRef}</div></div></div></td>
                          <td>{svc?.name}</td>
                          <td>{pro?.name}</td>
                          <td>
                            <Badge variant={a.status === 'pending' ? 'warning' : a.status === 'cancelled' ? 'danger' : 'success'}>{rotuloEstado(a)}</Badge>
                            {a.usaRecompensa && <Badge variant="gold" style={{ marginLeft: 6 }}>🎁 Grátis</Badge>}
                          </td>
                          <td>{a.status === 'pending' && <Button size="sm" variant="primary" onClick={() => confirm(a.id)}>Confirmar</Button>}{a.status === 'confirmed' && <Button size="sm" variant="secondary" onClick={() => attend(a.id)}>Presença</Button>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </Card>
          )}
          {mode === 'waitlist' && (
            <Card className="card-pad">
              <EmptyState icon={() => <Clock />} title="Lista de espera vazia" description="Quando houver clientes em espera por vagas, aparecem aqui." />
            </Card>
          )}
        </div>

        <AgendaSidebar
          date={date}
          setDate={setDate}
          apptsByDate={apptsByDate}
          mode={mode}
          setMode={setMode}
          blockMode={blockMode}
          setBlockMode={setBlockMode}
        />
      </div>

      {/* Detail modal */}
      <Modal open={!!selAppt} onClose={() => setSelected(null)} title={selAppt?.blocked ? 'Horário bloqueado' : 'Detalhe da marcação'}>
        {selAppt && (
          <div className="ag-detail">
            {selAppt.blocked ? (
              <>
                <div className="ag-detail-row"><span className="l">Barbeiro</span><span className="v">{selPro?.name}</span></div>
                <div className="ag-detail-row"><span className="l">Horário</span><span className="v">{selAppt.startTime} – {selAppt.endTime}</span></div>
                <div className="ag-detail-row"><span className="l">Motivo</span><span className="v">{selAppt.label}</span></div>
                <div className="ag-detail-actions">
                  <Button size="sm" variant="danger" onClick={() => askCancel(selAppt)}>Remover bloqueio</Button>
                </div>
              </>
            ) : (
              <>
                <div className="ag-detail-row"><span className="l">Cliente</span><span className="v">{selCust?.name || '—'}</span></div>
                <div className="ag-detail-row"><span className="l">Serviço</span><span className="v">{selSvc?.name}</span></div>
                <div className="ag-detail-row"><span className="l">Barbeiro</span><span className="v">{selPro?.name}</span></div>
                <div className="ag-detail-row"><span className="l">Horário</span><span className="v">{selAppt.startTime} – {selAppt.endTime}</span></div>
                <div className="ag-detail-row"><span className="l">Referência</span><span className="v">{selAppt.bookingRef}</span></div>
                <div className="ag-detail-row"><span className="l">Estado</span><span className="v"><Badge variant={selAppt.status === 'pending' ? 'warning' : selAppt.status === 'cancelled' ? 'danger' : 'success'}>{rotuloEstado(selAppt)}</Badge></span></div>
                {selAppt.usaRecompensa && (
                  <div className="ag-detail-row">
                    <span className="l">Pagamento</span>
                    <span className="v"><Badge variant="gold">🎁 Corte grátis do cartão</Badge></span>
                  </div>
                )}
                <div className="ag-detail-actions">
                  {selAppt.status === 'pending' && <Button size="sm" variant="primary" onClick={() => confirm(selAppt.id)}>Confirmar</Button>}
                  {selAppt.status === 'confirmed' && <Button size="sm" variant="secondary" onClick={() => attend(selAppt.id)}>Confirmar presença</Button>}
                  {selAppt.status !== 'cancelled' && selAppt.status !== 'completed' && <Button size="sm" variant="danger" onClick={() => askCancel(selAppt)}>Cancelar</Button>}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Quick booking modal */}
      <Modal open={quickOpen} onClose={() => setQuickOpen(false)} title="Novo encaixe">
        <div className="ag-detail">
          <div className="field">
            <label className="label">Cliente</label>
            <select className="select" value={quick.customerId} onChange={e => setQuick(f => ({ ...f, customerId: e.target.value }))}>
              <option value="">Selecionar…</option>
              {data.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label">Serviço</label>
            <select className="select" value={quick.serviceId} onChange={e => { setQuick(f => ({ ...f, serviceId: e.target.value })); setQuickError(''); }}>
              <option value="">Selecionar…</option>
              {data.services.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {quickError && <div className="text-sm mt-8" style={{ color: 'var(--error)' }}>{quickError}</div>}
          </div>
          <div className="field">
            <label className="label">Barbeiro</label>
            <select className="select" value={quick.professionalId} onChange={e => setQuick(f => ({ ...f, professionalId: e.target.value }))}>
              <option value="">Selecionar…</option>
              {data.professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label">Hora de início</label>
            <input type="time" className="input" value={quick.startTime} onChange={e => setQuick(f => ({ ...f, startTime: e.target.value }))} />
          </div>
          <div className="ag-detail-actions" style={{ justifyContent: 'flex-end' }}>
            <Button size="sm" variant="secondary" onClick={() => setQuickOpen(false)}>Cancelar</Button>
            <Button size="sm" variant="primary" onClick={submitQuick}>Criar encaixe</Button>
          </div>
        </div>
      </Modal>

      <CheckoutModal
        open={!!checkout}
        onClose={() => setCheckout(null)}
        appointment={checkout ? data.appointments.find(a => a.id === checkout) : null}
        customer={checkout ? data.customers.find(c => c.id === data.appointments.find(a => a.id === checkout)?.customerId) : null}
        service={checkout ? data.services.find(s => s.id === data.appointments.find(a => a.id === checkout)?.serviceId) : null}
        professional={checkout ? data.professionals.find(p => p.id === data.appointments.find(a => a.id === checkout)?.professionalId) : null}
        onConfirm={finishCheckout}
      />

      <VendaAvulsoModal
        open={vendaOpen}
        onClose={(result) => {
          setVendaOpen(false);
          if (result?.success) toast.success('Venda registada', `${formatPrice(result.total)} · ${result.method}`);
        }}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={doCancel}
        title={cancelTarget && (cancelTarget.blocked || cancelTarget.status === 'blocked') ? 'Remover bloqueio?' : 'Cancelar marcação?'}
        danger
        confirmLabel={cancelTarget && (cancelTarget.blocked || cancelTarget.status === 'blocked') ? 'Remover' : 'Cancelar marcação'}
        details={cancelTarget && !cancelTarget.blocked && cancelTarget.status !== 'blocked' && (
          <>
            <div className="ag-detail-row"><span className="l">Cliente</span><span className="v">{data.customers.find(c => c.id === cancelTarget.customerId)?.name || '—'}</span></div>
            <div className="ag-detail-row"><span className="l">Serviço</span><span className="v">{data.services.find(s => s.id === cancelTarget.serviceId)?.name || '—'}</span></div>
            <div className="ag-detail-row"><span className="l">Data</span><span className="v">{cancelTarget.startTime} · {cancelTarget.date}</span></div>
          </>
        )}
        message={cancelTarget && (cancelTarget.blocked || cancelTarget.status === 'blocked') ? 'O bloqueio será removido da agenda.' : 'Esta ação irá alterar o estado da marcação para Cancelada.'}
      />
    </AdminLayout>
  );
}