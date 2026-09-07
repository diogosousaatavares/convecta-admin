import React, { useState } from 'react';
import { Award, Plus, Edit, Trash2 } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Button, EmptyState, Modal, Badge } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';

const blank = { name: '', stampsRequired: 10, description: '', active: true };

export default function FidelizacaoRecompensas() {
  const data = useStore();
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blank);

  const rewards = data.loyaltyRewards || [];

  const openNew = () => { setEditingId(null); setForm(blank); setModal(true); };
  const openEdit = (r) => { setEditingId(r.id); setForm({ name: r.name, stampsRequired: r.stampsRequired, description: r.description, active: r.active }); setModal(true); };
  const save = async () => {
    if (!form.name) { toast.error('Nome obrigatório'); return; }
    if (editingId) { await dataService.updateLoyaltyReward(editingId, { ...form, stampsRequired: Number(form.stampsRequired) }); toast.success('Recompensa atualizada'); }
    else { await dataService.createLoyaltyReward({ ...form, stampsRequired: Number(form.stampsRequired) }); toast.success('Recompensa criada'); }
    setModal(false);
  };
  const remove = async (id) => { await dataService.deleteLoyaltyReward(id); toast.info('Removida'); };

  return (
    <AdminPage title="Recompensas" subtitle="Catálogo de recompensas do programa de fidelização."
      actions={<Button variant="primary" onClick={openNew}><Plus size={16} /> Nova recompensa</Button>}>
      {rewards.length === 0 ? (
        <Card className="card-pad"><EmptyState icon={() => <Award />} title="Sem recompensas" description="Cria recompensas resgatáveis com carimbos." /></Card>
      ) : (
        <div className="grid-3">
          {rewards.map(r => (
            <Card key={r.id} className="card-pad card-hover">
              <div className="flex justify-between items-center mb-16">
                <span className="notif-ico"><Award size={18} /></span>
                <Badge variant={r.active ? 'success' : 'default'}>{r.active ? 'Ativa' : 'Inativa'}</Badge>
              </div>
              <h3 style={{ fontSize: 17 }}>{r.name}</h3>
              <p className="text-sec text-sm mt-8">{r.description || '—'}</p>
              <div className="flex justify-between items-center mt-16">
                <span className="badge badge-gold">{r.stampsRequired} carimbos</span>
                <div className="flex gap-8"><Button size="sm" variant="secondary" aria-label="Editar recompensa" title="Editar recompensa" onClick={() => openEdit(r)}><Edit size={14} /></Button><button className="btn btn-ghost btn-icon" aria-label="Eliminar recompensa" title="Eliminar recompensa" onClick={() => remove(r.id)}><Trash2 size={15} /></button></div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editingId ? 'Editar recompensa' : 'Nova recompensa'}>
        <div className="field"><label className="label">Nome</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
        <div className="grid-2">
          <div className="field"><label className="label">Carimbos necessários</label><input type="number" className="input" value={form.stampsRequired} onChange={e => setForm(f => ({ ...f, stampsRequired: e.target.value }))} /></div>
          <div className="field"><label className="label">Estado</label><select className="select" value={form.active ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, active: e.target.value === 'true' }))}><option value="true">Ativa</option><option value="false">Inativa</option></select></div>
        </div>
        <div className="field"><label className="label">Descrição</label><textarea className="textarea" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}><Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button><Button variant="primary" onClick={save}>{editingId ? 'Guardar' : 'Criar'}</Button></div>
      </Modal>
    </AdminPage>
  );
}