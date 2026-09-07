import React, { useState, useMemo } from 'react';
import { Phone, Mail, MessageCircle, Save, CalendarDays } from 'lucide-react';
import { Modal, Button, Avatar, Badge, EmptyState } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { formatDateNum, formatDateShortNum, formatPrice } from '@/lib/format';

export default function CustomerProfileModal({ customer, onClose }) {
  const data = useStore();
  const toast = useToast();
  const [notes, setNotes] = useState(customer?.notes || '');

  const history = useMemo(() =>
    (data.appointments || []).filter(a => a.customerId === customer?.id).sort((a, b) => (b.date + b.startTime).localeCompare(a.date + b.startTime)),
    [data.appointments, customer?.id]);

  const proCount = useMemo(() => {
    const m = {};
    history.forEach(a => { if (a.professionalId) m[a.professionalId] = (m[a.professionalId] || 0) + 1; });
    return m;
  }, [history]);
  const preferredPro = Object.entries(proCount).sort((a, b) => b[1] - a[1])[0];
  const prefProObj = preferredPro ? data.professionals.find(p => p.id === preferredPro[0]) : null;

  const svcCount = useMemo(() => {
    const m = {};
    history.forEach(a => { if (a.serviceId) m[a.serviceId] = (m[a.serviceId] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, n]) => ({ name: data.services.find(s => s.id === id)?.name || '—', n }));
  }, [history, data.services]);

  const upcoming = history.find(a => a.status !== 'cancelled' && (a.date + a.startTime) >= (new Date().toISOString().slice(0, 10) + new Date().toTimeString().slice(0, 5)));

  if (!customer) return null;

  const saveNotes = async () => {
    await dataService.updateCustomer(customer.id, { notes });
    toast.success('Notas guardadas');
  };

  return (
    <Modal open={!!customer} onClose={onClose} title="Perfil do cliente" >
      <div className="flex items-center gap-16 mb-24">
        <Avatar name={customer.name} size="lg" />
        <div className="flex-1">
          <div className="fw-600" style={{ fontSize: 18 }}>{customer.name}</div>
          <div className="text-sec text-sm mt-8">{customer.email}</div>
          {customer.phone && <div className="text-sec text-sm">{customer.phone}</div>}
        </div>
      </div>

      <div className="grid-3 mb-24" style={{ gap: 10 }}>
        <div className="kpi" style={{ padding: 14 }}><div className="label">Visitas</div><div className="value" style={{ fontSize: 22 }}>{customer.totalAppointments || 0}</div></div>
        <div className="kpi" style={{ padding: 14 }}><div className="label">Total gasto</div><div className="value gold" style={{ fontSize: 22 }}>{formatPrice(customer.totalSpent || 0)}</div></div>
        <div className="kpi" style={{ padding: 14 }}><div className="label">Última visita</div><div className="value" style={{ fontSize: 16 }}>{customer.lastVisit ? formatDateShortNum(customer.lastVisit) : '—'}</div></div>
      </div>

      {upcoming && (
        <div className="card card-pad mb-24" style={{ borderColor: 'rgba(201,162,39,0.4)' }}>
          <div className="flex items-center gap-12">
            <CalendarDays size={18} className="text-gold" />
            <div className="flex-1">
              <div className="fw-600 text-sm">Próxima marcação</div>
              <div className="text-sec text-xs">{formatDateNum(upcoming.date)} · {upcoming.startTime} · {data.services.find(s => s.id === upcoming.serviceId)?.name}</div>
            </div>
          </div>
        </div>
      )}

      {prefProObj && (
        <div className="mb-16 text-sm text-sec">Profissional preferido: <span className="fw-600 text-gold">{prefProObj.name}</span></div>
      )}
      {svcCount.length > 0 && (
        <div className="mb-24">
          <div className="text-sec text-xs mb-8" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Serviços mais utilizados</div>
          <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>{svcCount.map(s => <Badge key={s.name} variant="default">{s.name} · {s.n}</Badge>)}</div>
        </div>
      )}

      <div className="flex gap-8 mb-24">
        {customer.phone && <a href={`tel:${customer.phone}`} className="btn btn-secondary btn-sm"><Phone size={14} /> Ligar</a>}
        {customer.email && <a href={`mailto:${customer.email}`} className="btn btn-secondary btn-sm"><Mail size={14} /> Email</a>}
        {customer.phone && <a href={`https://wa.me/${(customer.phone || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm"><MessageCircle size={14} /> WhatsApp</a>}
      </div>

      <div className="mb-24">
        <label className="label">Notas internas</label>
        <textarea className="textarea" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: prefere degradé baixo; usa máquina nº 2…" />
        <div className="mt-8"><Button size="sm" variant="primary" onClick={saveNotes}><Save size={14} /> Guardar notas</Button></div>
      </div>

      <h4 className="mb-16" style={{ fontSize: 15 }}>Histórico de marcações</h4>
      {history.length === 0 ? (
        <EmptyState icon={() => <CalendarDays />} title="Sem histórico" description="Este cliente ainda não tem marcações." />
      ) : (
        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
          <table className="table">
            <thead><tr><th>Data</th><th>Serviço</th><th>Barbeiro</th><th>Valor</th><th>Estado</th></tr></thead>
            <tbody>
              {history.map(a => {
                const svc = data.services.find(s => s.id === a.serviceId);
                const pro = data.professionals.find(p => p.id === a.professionalId);
                return (
                  <tr key={a.id}>
                    <td className="text-sm">{formatDateShortNum(a.date)}</td>
                    <td className="text-sm">{svc?.name || '—'}</td>
                    <td className="text-sm">{pro?.name || '—'}</td>
                    <td className="text-sm">{svc ? formatPrice(svc.price) : '—'}</td>
                    <td><Badge variant={a.status === 'cancelled' ? 'danger' : a.status === 'completed' ? 'success' : a.status === 'pending' ? 'warning' : 'default'}>{a.status === 'confirmed' ? 'Confirmada' : a.status === 'completed' ? 'Concluída' : a.status === 'cancelled' ? 'Cancelada' : a.status === 'pending' ? 'Pendente' : a.status === 'blocked' ? 'Bloqueado' : '—'}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}