import React, { useState, useEffect } from 'react';
import { Zap, Plus } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Button, EmptyState, Badge, Modal } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { todayStr, formatDate } from '@/lib/format';

function toMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function toTime(mins) { const h = Math.floor(mins / 60), m = mins % 60; return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); }

export default function AgendaFitIns() {
  const data = useStore();
  const toast = useToast();
  const [date, setDate] = useState(todayStr());
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ customerId: '', serviceId: '', professionalId: 'any', startTime: '' });

  useEffect(() => {
    setLoading(true);
    dataService.getAvailableSlots(date, 'any', 30).then(s => { setSlots(s.filter(x => !x.isPast)); setLoading(false); });
  }, [date]);

  const openCreate = (slot) => {
    setForm({ customerId: '', serviceId: '', professionalId: slot?.availablePros?.[0] || 'any', startTime: slot?.startTime || '' });
    setModal({});
  };

  const submit = async () => {
    if (!form.customerId || !form.serviceId || !form.startTime) { toast.error('Dados incompletos'); return; }
    const svc = data.services.find(s => s.id === form.serviceId);
    let profId = form.professionalId;
    if (profId === 'any') { const a = await dataService.assignProfessionalForSlot(date, form.startTime, svc.durationMinutes); profId = a.id; }
    await dataService.createAppointment({ customerId: form.customerId, serviceId: form.serviceId, professionalId: profId, date, startTime: form.startTime, endTime: toTime(toMin(form.startTime) + svc.durationMinutes), status: 'confirmed' });
    toast.success('Encaixe criado', `${form.startTime} · ${formatDate(date)}`);
    setModal(null);
    setLoading(true); dataService.getAvailableSlots(date, 'any', 30).then(s => { setSlots(s.filter(x => !x.isPast)); setLoading(false); });
  };

  const free = slots.filter(s => !s.isBooked);

  return (
    <AdminPage title="Encaixes" subtitle="Disponibilidade imediata e marcações fora do fluxo normal."
      info={{ description: 'Permite inserir marcações de urgência nos espaços disponíveis da agenda do dia, mesmo fora do horário normal de marcação. O sistema identifica automaticamente os slots livres por profissional.', impact: 'Encaixes bem geridos podem representar 10 a 20% de receita adicional diária sem qualquer custo extra — é aproveitar a capacidade instalada que já estás a pagar.', links: ['Agenda', 'Profissionais', 'Serviços', 'Lista de Espera'] }}
      actions={<Button variant="primary" onClick={() => openCreate(null)}><Plus size={16} /> Novo encaixe</Button>}>
      <div className="field" style={{ maxWidth: 220 }}><label className="label">Data</label><input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} min={todayStr()} /></div>
      <Card className="card-pad">
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Slots disponíveis — {formatDate(date)}</h3>
        {loading ? <p className="text-sec text-sm">A calcular…</p> : free.length === 0 ? (
          <EmptyState icon={() => <Zap />} title="Sem disponibilidade" description="Não há slots livres neste dia." />
        ) : (
          <div className="slot-grid">
            {free.map(s => (
              <button key={s.id} className="slot" onClick={() => openCreate(s)}>{s.startTime}</button>
            ))}
          </div>
        )}
      </Card>

      <Modal open={!!modal} onClose={() => setModal(null)} title="Novo encaixe">
        <div className="field"><label className="label">Cliente</label>
          <select className="select" value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}><option value="">Selecionar…</option>{data.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div className="field"><label className="label">Serviço</label>
          <select className="select" value={form.serviceId} onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))}><option value="">Selecionar…</option>{data.services.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        <div className="grid-2">
          <div className="field"><label className="label">Profissional</label>
            <select className="select" value={form.professionalId} onChange={e => setForm(f => ({ ...f, professionalId: e.target.value }))}><option value="any">Qualquer (auto)</option>{data.professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div className="field"><label className="label">Hora de início</label><input type="time" className="input" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} /></div>
        </div>
        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}><Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button><Button variant="primary" onClick={submit}>Criar encaixe</Button></div>
      </Modal>
    </AdminPage>
  );
}