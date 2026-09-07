import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Repeat, Plus, Edit, Trash2, CheckCircle2, CreditCard, Calendar, AlertTriangle } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Button, EmptyState, Modal, Badge, Avatar } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { formatPrice, formatDateShortNum, todayStr } from '@/lib/format';

const TAB_PATH = { planos: 'planos', subscritores: 'subscritores', pagamentos: 'pagamentos', utilizacao: 'utilizacao', atraso: 'atraso' };
const PLAN_BLANK = { name: '', price: 0, period: 'Mensal', servicesIncluded: '', benefits: '', active: true };
const SUB_BLANK = { customerId: '', planId: '', startedAt: todayStr(), nextPaymentAt: '', status: 'active' };

export default function Subscricoes() {
  const data = useStore();
  const toast = useToast();
  const location = useLocation();
  const seg = location.pathname.split('/').pop();
  const tab = TAB_PATH[seg] || 'planos';

  const [planModal, setPlanModal] = useState(false);
  const [planEdit, setPlanEdit] = useState(null);
  const [plan, setPlan] = useState(PLAN_BLANK);
  const [subModal, setSubModal] = useState(false);
  const [sub, setSub] = useState(SUB_BLANK);
  const [payModal, setPayModal] = useState(false);
  const [pay, setPay] = useState({ subscriptionId: '', amount: '', method: 'Dinheiro' });

  const plans = data.subscriptionPlans || [];
  const subs = data.subscriptions || [];
  const payments = data.subscriptionPayments || [];

  const savePlan = async () => {
    if (!plan.name) { toast.error('Nome obrigatório'); return; }
    if (planEdit) { await dataService.updateSubscriptionPlan(planEdit, { ...plan, price: Number(plan.price) }); toast.success('Plano atualizado'); }
    else { await dataService.createSubscriptionPlan({ ...plan, price: Number(plan.price) }); toast.success('Plano criado'); }
    setPlanModal(false);
  };
  const saveSub = async () => {
    if (!sub.customerId || !sub.planId) { toast.error('Cliente e plano obrigatórios'); return; }
    await dataService.createSubscription({ ...sub });
    toast.success('Subscritor adicionado');
    setSubModal(false); setSub(SUB_BLANK);
  };
  const savePay = async () => {
    if (!pay.subscriptionId || !pay.amount) { toast.error('Dados incompletos'); return; }
    await dataService.addSubscriptionPayment({ ...pay, amount: Number(pay.amount) });
    toast.success('Pagamento registado');
    setPayModal(false); setPay({ subscriptionId: '', amount: '', method: 'Dinheiro' });
  };

  const title = { planos: 'Planos', subscritores: 'Subscritores', pagamentos: 'Pagamentos', utilizacao: 'Utilização', atraso: 'Em Atraso' }[tab];

  let actionsEl = null;
  if (tab === 'planos') actionsEl = <Button variant="primary" onClick={() => { setPlanEdit(null); setPlan(PLAN_BLANK); setPlanModal(true); }}><Plus size={16} /> Novo plano</Button>;
  else if (tab === 'subscritores') actionsEl = <Button variant="primary" onClick={() => setSubModal(true)}><Plus size={16} /> Novo subscritor</Button>;
  else if (tab === 'pagamentos') actionsEl = <Button variant="primary" onClick={() => setPayModal(true)}><Plus size={16} /> Registar pagamento</Button>;

  return (
    <AdminPage title={title} subtitle="Gestão de planos e subscritores." actions={actionsEl}>
      {tab === 'planos' && (
        plans.length === 0 ? <Card className="card-pad"><EmptyState icon={() => <Repeat />} title="Sem planos" description="Cria o primeiro plano de subscrição." /></Card> : (
          <div className="grid-3">
            {plans.map(p => (
              <Card key={p.id} className="card-pad card-hover">
                <div className="flex justify-between items-center mb-16"><span className="notif-ico"><Repeat size={18} /></span><Badge variant={p.active ? 'success' : 'default'}>{p.active ? 'Ativo' : 'Inativo'}</Badge></div>
                <h3 style={{ fontSize: 17 }}>{p.name}</h3>
                <div className="text-gold fw-600 mt-8" style={{ fontFamily: 'var(--font-head)', fontSize: 22 }}>{formatPrice(p.price)} <span className="text-sec text-sm" style={{ fontFamily: 'var(--font-body)' }}>/ {p.period}</span></div>
                {p.benefits && <p className="text-sec text-sm mt-8">{p.benefits}</p>}
                <div className="flex gap-8 mt-16"><Button size="sm" variant="secondary" block onClick={() => { setPlanEdit(p.id); setPlan({ ...p }); setPlanModal(true); }}><Edit size={14} /> Editar</Button><button className="btn btn-ghost btn-icon" aria-label="Eliminar plano" title="Eliminar plano" onClick={() => dataService.deleteSubscriptionPlan(p.id)}><Trash2 size={15} /></button></div>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === 'subscritores' && (
        subs.length === 0 ? <Card className="card-pad"><EmptyState icon={() => <CheckCircle2 />} title="Sem subscritores" /></Card> : (
          <Card className="card-pad"><table className="table">
            <thead><tr><th>Cliente</th><th>Plano</th><th>Início</th><th>Próx. pagamento</th><th>Estado</th><th></th></tr></thead>
            <tbody>{subs.map(s => (
              <tr key={s.id}>
                <td><div className="flex items-center gap-8"><Avatar name={data.customers.find(c => c.id === s.customerId)?.name} /><span className="text-sm fw-600">{data.customers.find(c => c.id === s.customerId)?.name || '—'}</span></div></td>
                <td>{plans.find(p => p.id === s.planId)?.name || '—'}</td>
                <td className="text-sm">{formatDateShortNum(s.startedAt)}</td>
                <td className="text-sm">{s.nextPaymentAt ? formatDateShortNum(s.nextPaymentAt) : '—'}</td>
                <td><Badge variant={s.status === 'active' ? 'success' : s.status === 'overdue' ? 'danger' : 'default'}>{s.status === 'active' ? 'Ativo' : s.status === 'overdue' ? 'Em atraso' : s.status}</Badge></td>
                <td><button className="btn btn-ghost btn-icon" aria-label="Eliminar subscritor" title="Eliminar subscritor" onClick={() => dataService.deleteSubscription(s.id)}><Trash2 size={15} /></button></td>
              </tr>
            ))}</tbody>
          </table></Card>
        )
      )}

      {tab === 'pagamentos' && (
        payments.length === 0 ? <Card className="card-pad"><EmptyState icon={() => <CreditCard />} title="Sem pagamentos" description="Regista pagamentos de subscrições." /></Card> : (
          <Card className="card-pad"><table className="table">
            <thead><tr><th>Data</th><th>Subscritor</th><th>Plano</th><th>Valor</th><th>Método</th><th>Estado</th></tr></thead>
            <tbody>{payments.map(p => {
              const sub = subs.find(s => s.id === p.subscriptionId);
              return (
                <tr key={p.id}>
                  <td className="text-sm">{formatDateShortNum(p.paidAt)}</td>
                  <td>{data.customers.find(c => c.id === sub?.customerId)?.name || '—'}</td>
                  <td className="text-sec">{plans.find(pl => pl.id === sub?.planId)?.name || '—'}</td>
                  <td className="fw-600">{formatPrice(p.amount)}</td>
                  <td>{p.method}</td>
                  <td><Badge variant="success">{p.status}</Badge></td>
                </tr>
              );
            })}</tbody>
          </table></Card>
        )
      )}

      {tab === 'utilizacao' && (
        <Card className="card-pad"><EmptyState icon={() => <Calendar />} title="Utilização de benefícios" description="A utilização de benefícios será registada à medida que os subscritores consomem os planos." /></Card>
      )}

      {tab === 'atraso' && (
        subs.filter(s => s.status === 'overdue').length === 0 ? <Card className="card-pad"><EmptyState icon={() => <AlertTriangle />} title="Sem subscrições em atraso" /></Card> : (
          <Card className="card-pad"><table className="table">
            <thead><tr><th>Cliente</th><th>Plano</th><th>Próx. pagamento</th></tr></thead>
            <tbody>{subs.filter(s => s.status === 'overdue').map(s => (
              <tr key={s.id}><td>{data.customers.find(c => c.id === s.customerId)?.name || '—'}</td><td>{plans.find(p => p.id === s.planId)?.name}</td><td>{s.nextPaymentAt ? formatDateShortNum(s.nextPaymentAt) : '—'}</td></tr>
            ))}</tbody>
          </table></Card>
        )
      )}

      <Modal open={planModal} onClose={() => setPlanModal(false)} title={planEdit ? 'Editar plano' : 'Novo plano'}>
        <div className="field"><label className="label">Nome</label><input className="input" value={plan.name} onChange={e => setPlan(f => ({ ...f, name: e.target.value }))} /></div>
        <div className="grid-2">
          <div className="field"><label className="label">Preço (€)</label><input type="number" className="input" value={plan.price} onChange={e => setPlan(f => ({ ...f, price: e.target.value }))} /></div>
          <div className="field"><label className="label">Periodicidade</label><select className="select" value={plan.period} onChange={e => setPlan(f => ({ ...f, period: e.target.value }))}>{['Mensal','Trimestral','Semestral','Anual'].map(p => <option key={p}>{p}</option>)}</select></div>
        </div>
        <div className="field"><label className="label">Serviços incluídos</label><input className="input" value={plan.servicesIncluded} onChange={e => setPlan(f => ({ ...f, servicesIncluded: e.target.value }))} placeholder="Ex: 2 cortes + 1 barba" /></div>
        <div className="field"><label className="label">Benefícios</label><textarea className="textarea" rows={2} value={plan.benefits} onChange={e => setPlan(f => ({ ...f, benefits: e.target.value }))} /></div>
        <div className="field"><label className="label">Estado</label><select className="select" value={plan.active ? 'true' : 'false'} onChange={e => setPlan(f => ({ ...f, active: e.target.value === 'true' }))}><option value="true">Ativo</option><option value="false">Inativo</option></select></div>
        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}><Button variant="secondary" onClick={() => setPlanModal(false)}>Cancelar</Button><Button variant="primary" onClick={savePlan}>{planEdit ? 'Guardar' : 'Criar'}</Button></div>
      </Modal>

      <Modal open={subModal} onClose={() => setSubModal(false)} title="Novo subscritor">
        <div className="field"><label className="label">Cliente</label><select className="select" value={sub.customerId} onChange={e => setSub(f => ({ ...f, customerId: e.target.value }))}><option value="">Selecionar…</option>{data.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div className="field"><label className="label">Plano</label><select className="select" value={sub.planId} onChange={e => setSub(f => ({ ...f, planId: e.target.value }))}><option value="">Selecionar…</option>{plans.filter(p => p.active).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <div className="grid-2">
          <div className="field"><label className="label">Início</label><input type="date" className="input" value={sub.startedAt} onChange={e => setSub(f => ({ ...f, startedAt: e.target.value }))} /></div>
          <div className="field"><label className="label">Próximo pagamento</label><input type="date" className="input" value={sub.nextPaymentAt} onChange={e => setSub(f => ({ ...f, nextPaymentAt: e.target.value }))} /></div>
        </div>
        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}><Button variant="secondary" onClick={() => setSubModal(false)}>Cancelar</Button><Button variant="primary" onClick={saveSub}>Adicionar</Button></div>
      </Modal>

      <Modal open={payModal} onClose={() => setPayModal(false)} title="Registar pagamento">
        <div className="field"><label className="label">Subscritor</label><select className="select" value={pay.subscriptionId} onChange={e => setPay(f => ({ ...f, subscriptionId: e.target.value }))}><option value="">Selecionar…</option>{subs.map(s => <option key={s.id} value={s.id}>{data.customers.find(c => c.id === s.customerId)?.name || '—'}</option>)}</select></div>
        <div className="grid-2">
          <div className="field"><label className="label">Valor (€)</label><input type="number" className="input" value={pay.amount} onChange={e => setPay(f => ({ ...f, amount: e.target.value }))} /></div>
          <div className="field"><label className="label">Método</label><select className="select" value={pay.method} onChange={e => setPay(f => ({ ...f, method: e.target.value }))}>{['Dinheiro','Cartão','MB WAY','Transferência'].map(m => <option key={m}>{m}</option>)}</select></div>
        </div>
        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}><Button variant="secondary" onClick={() => setPayModal(false)}>Cancelar</Button><Button variant="primary" onClick={savePay}>Registar</Button></div>
      </Modal>
    </AdminPage>
  );
}