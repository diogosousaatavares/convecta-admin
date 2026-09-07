import React, { useState } from 'react';
import { Clock, Plus, Trash2, UserCheck, UserX } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Button, EmptyState, Badge, Modal } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { formatDateNum, todayStr } from '@/lib/format';

const PRIOS = { normal: 'Normal', alta: 'Alta', urgente: 'Urgente' };
const STATUS = { waiting: 'Em espera', contacted: 'Contactado', scheduled: 'Agendado', closed: 'Fechado' };

export default function AgendaWaitlist() {
  const data = useStore();
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ customerId: '', serviceId: '', professionalId: 'any', preferredDate: '', priority: 'normal', notes: '' });

  const rows = data.waitlist || [];

  const add = async () => {
    if (!form.customerId || !form.serviceId) { toast.error('Dados incompletos', 'Cliente e serviço são obrigatórios.'); return; }
    await dataService.addWaitlist(form);
    toast.success('Adicionado à lista de espera');
    setModal(false); setForm({ customerId: '', serviceId: '', professionalId: 'any', preferredDate: '', priority: 'normal', notes: '' });
  };

  const setStatus = async (id, status) => { await dataService.updateWaitlist(id, { status }); toast.success('Estado atualizado'); };

  return (
    <AdminPage title="Lista de Espera" subtitle="Clientes que aguardam disponibilidade."
      info={{ description: 'Clientes que querem ser atendidos mas não encontraram disponibilidade imediata. Quando surge uma vaga por cancelamento ou encaixe, podes contactar o próximo da lista e recuperar essa receita.', impact: 'Sem lista de espera, um cancelamento de última hora é receita perdida. Com ela, o slot pode ser preenchido em minutos, mantendo a ocupação e a satisfação dos clientes que aguardavam.', links: ['Agenda', 'Encaixes', 'Clientes', 'Marcações'] }}
      actions={<Button variant="primary" onClick={() => setModal(true)}><Plus size={16} /> Adicionar</Button>}>
      {rows.length === 0 ? (
        <Card className="card-pad"><EmptyState icon={() => <Clock />} title="Lista vazia" description="Adiciona clientes à lista de espera." /></Card>
      ) : (
        <Card>
          <table className="table">
            <thead><tr><th>Cliente</th><th>Serviço</th><th>Profissional</th><th>Preferência</th><th>Prioridade</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {rows.map(w => (
                <tr key={w.id}>
                  <td className="fw-600">{data.customers.find(c => c.id === w.customerId)?.name || '—'}</td>
                  <td>{data.services.find(s => s.id === w.serviceId)?.name || '—'}</td>
                  <td>{w.professionalId === 'any' ? 'Qualquer' : data.professionals.find(p => p.id === w.professionalId)?.name || '—'}</td>
                  <td className="text-sm">{w.preferredDate ? formatDateNum(w.preferredDate) : '—'}</td>
                  <td><Badge variant={w.priority === 'urgente' ? 'danger' : w.priority === 'alta' ? 'warning' : 'default'}>{PRIOS[w.priority] || w.priority}</Badge></td>
                  <td>
                    <select className="select" style={{ width: 'auto', padding: '6px 10px' }} value={w.status} onChange={e => setStatus(w.id, e.target.value)}>
                      {Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                  </td>
                  <td><button className="btn btn-ghost btn-icon" aria-label="Remover da lista de espera" title="Remover da lista de espera" onClick={() => dataService.removeWaitlist(w.id)}><Trash2 size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Adicionar à lista de espera">
        <div className="field"><label className="label">Cliente</label>
          <select className="select" value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}>
            <option value="">Selecionar…</option>{data.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></div>
        <div className="field"><label className="label">Serviço</label>
          <select className="select" value={form.serviceId} onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))}>
            <option value="">Selecionar…</option>{data.services.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select></div>
        <div className="grid-2">
          <div className="field"><label className="label">Profissional</label>
            <select className="select" value={form.professionalId} onChange={e => setForm(f => ({ ...f, professionalId: e.target.value }))}>
              <option value="any">Qualquer</option>{data.professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></div>
          <div className="field"><label className="label">Preferência de data</label><input type="date" className="input" min={todayStr()} value={form.preferredDate} onChange={e => setForm(f => ({ ...f, preferredDate: e.target.value }))} /></div>
        </div>
        <div className="grid-2">
          <div className="field"><label className="label">Prioridade</label>
            <select className="select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>{Object.entries(PRIOS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          </div>
          <div className="field"><label className="label">Observações</label><input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
        </div>
        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}><Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button><Button variant="primary" onClick={add}>Adicionar</Button></div>
      </Modal>
    </AdminPage>
  );
}