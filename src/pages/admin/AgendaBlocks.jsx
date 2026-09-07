import React, { useState } from 'react';
import { Ban, Plus, Trash2 } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Button, EmptyState, Badge, Modal } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { todayStr, formatDateShortNum } from '@/lib/format';

function toMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function toTime(mins) { const h = Math.floor(mins / 60), m = mins % 60; return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); }

export default function AgendaBlocks() {
  const data = useStore();
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ professionalId: '', date: todayStr(), startTime: '09:00', endTime: '10:00', label: 'Bloqueado' });

  const blocks = (data.appointments || []).filter(a => a.blocked || a.status === 'blocked').sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));

  const add = async () => {
    if (!form.professionalId || !form.date || !form.startTime || !form.endTime) { toast.error('Dados incompletos'); return; }
    if (toMin(form.endTime) <= toMin(form.startTime)) { toast.error('Horário inválido', 'O fim tem de ser depois do início.'); return; }
    await dataService.createAppointment({ blocked: true, status: 'blocked', professionalId: form.professionalId, date: form.date, startTime: form.startTime, endTime: form.endTime, label: form.label || 'Bloqueado' });
    toast.success('Bloqueio criado');
    setModal(false); setForm({ professionalId: '', date: todayStr(), startTime: '09:00', endTime: '10:00', label: 'Bloqueado' });
  };

  return (
    <AdminPage title="Bloqueios" subtitle="Períodos bloqueados na agenda."
      info={{ description: 'Marca períodos em que um profissional não está disponível: formação, pausa, férias, manutenção ou qualquer motivo operacional. Impede que marcações sejam criadas nesses slots.', impact: 'Bloqueios incorretos ou esquecidos causam marcações em conflito, clientes insatisfeitos e uma agenda caótica. Manter os bloqueios atualizados é essencial para a fiabilidade da agenda.', links: ['Agenda', 'Profissionais', 'Horários'] }}
      actions={<Button variant="primary" onClick={() => setModal(true)}><Plus size={16} /> Novo bloqueio</Button>}>
      {blocks.length === 0 ? (
        <Card className="card-pad"><EmptyState icon={() => <Ban />} title="Sem bloqueios" description="Cria bloqueios para férias, pausas ou indisponibilidades." /></Card>
      ) : (
        <Card>
          <table className="table">
            <thead><tr><th>Profissional</th><th>Data</th><th>Hora</th><th>Motivo</th><th></th></tr></thead>
            <tbody>
              {blocks.map(b => (
                <tr key={b.id}>
                  <td className="fw-600">{data.professionals.find(p => p.id === b.professionalId)?.name || '—'}</td>
                  <td>{formatDateShortNum(b.date)}</td>
                  <td>{b.startTime} – {b.endTime}</td>
                  <td className="text-sec">{b.label}</td>
                  <td><button className="btn btn-ghost btn-icon" aria-label="Eliminar bloqueio" title="Eliminar bloqueio" onClick={() => { dataService.deleteAppointment(b.id); toast.success('Bloqueio removido'); }}><Trash2 size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Novo bloqueio">
        <div className="field"><label className="label">Profissional</label>
          <select className="select" value={form.professionalId} onChange={e => setForm(f => ({ ...f, professionalId: e.target.value }))}><option value="">Selecionar…</option>{data.professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <div className="field"><label className="label">Data</label><input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
        <div className="grid-2">
          <div className="field"><label className="label">Início</label><input type="time" className="input" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} /></div>
          <div className="field"><label className="label">Fim</label><input type="time" className="input" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} /></div>
        </div>
        <div className="field"><label className="label">Motivo</label><input className="input" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Ex: Férias, almoço, formação" /></div>
        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}><Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button><Button variant="primary" onClick={add}>Criar bloqueio</Button></div>
      </Modal>
    </AdminPage>
  );
}