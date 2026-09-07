import React, { useState } from 'react';
import { Scissors, Plus, Pencil, Trash2 } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import AdminLayout from '@/components/AdminLayout';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Badge, Button, EmptyState, Modal } from '@/components/ui';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { formatPrice } from '@/lib/format';

const empty = { name: '', description: '', durationMinutes: 30, price: 15, category: 'Corte', isActive: true, isPopular: false };

export default function Services() {
  const data = useStore();
  const toast = useToast();
  const [editing, setEditing] = useState(null); // null | 'new' | service
  const [form, setForm] = useState(empty);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openNew = () => { setForm(empty); setEditing('new'); };
  const openEdit = (s) => { setForm({ ...s }); setEditing(s.id); };
  const close = () => setEditing(null);

  const save = async () => {
    if (!form.name) { toast.error('Nome obrigatório'); return; }
    if (editing === 'new') {
      await dataService.createService(form);
      toast.success('Serviço criado');
    } else {
      await dataService.updateService(editing, form);
      toast.success('Serviço atualizado');
    }
    close();
  };

  const remove = async () => {
    await dataService.deleteService(deleteTarget.id);
    toast.success('Serviço eliminado');
    setDeleteTarget(null);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-24">
        <div className="page-head" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1>Serviços</h1>
            <PageInfo
              description="Catálogo completo de todos os serviços disponíveis: nome, duração, preço, categoria e visibilidade na app do cliente. O preço e a duração de cada serviço determinam a rentabilidade da agenda."
              impact="Um serviço mal precificado ou com duração errada pode ocupar um slot durante 60 minutos a ganhar o que devia ganhar em 30. Os serviços são a base de toda a estrutura financeira do negócio."
              links={['Agenda', 'Marcações', 'Categorias', 'Relatórios', 'Comandas']}
            />
          </div>
          <p>{data.services.length} serviços configurados.</p>
        </div>
        <Button variant="primary" onClick={openNew}><Plus size={16} /> Novo serviço</Button>
      </div>
      <PageInfo page="servicos" />

      {data.services.length === 0 ? (
        <Card className="card-pad"><EmptyState icon={() => <Scissors />} title="Sem serviços" description="Cria o primeiro serviço." action={<Button variant="primary" onClick={openNew}>Criar serviço</Button>} /></Card>
      ) : (
        <div className="grid-2">
          {data.services.map(s => (
            <Card key={s.id} className="card-pad card-hover">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-8">
                  <h3 style={{ fontSize: 18 }}>{s.name}</h3>
                  {s.isPopular && <Badge variant="gold">Popular</Badge>}
                  {!s.isActive && <Badge variant="default">Inativo</Badge>}
                </div>
                <span style={{ fontFamily: 'var(--font-head)', fontSize: 22, color: 'var(--gold)' }}>{formatPrice(s.price)}</span>
              </div>
              <p className="text-sec text-sm mt-8">{s.description}</p>
              <div className="flex items-center justify-between mt-16">
                <div className="flex gap-12 text-sec text-xs">
                  <span>{s.durationMinutes} min</span><span>·</span><span>{s.category}</span>
                </div>
                <div className="flex gap-8">
                  <Button size="sm" variant="secondary" aria-label="Editar serviço" title="Editar serviço" onClick={() => openEdit(s)}><Pencil size={14} /></Button>
                  <Button size="sm" variant="ghost" aria-label="Eliminar serviço" title="Eliminar serviço" onClick={() => setDeleteTarget(s)}><Trash2 size={14} /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={close} title={editing === 'new' ? 'Novo serviço' : 'Editar serviço'}
        footer={<><Button variant="ghost" onClick={close}>Cancelar</Button><Button variant="primary" onClick={save}>Guardar</Button></>}>
        <div className="field"><label className="label">Nome</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
        <div className="field"><label className="label">Descrição</label><textarea className="textarea" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        <div className="grid-2">
          <div className="field"><label className="label">Duração (min)</label><input className="input" type="number" value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 0 })} /></div>
          <div className="field"><label className="label">Preço (€)</label><input className="input" type="number" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} /></div>
        </div>
        <div className="field"><label className="label">Categoria</label><input className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
        <div className="flex gap-24 mt-16">
          <label className="flex items-center gap-8 text-sm"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Ativo</label>
          <label className="flex items-center gap-8 text-sm"><input type="checkbox" checked={form.isPopular} onChange={e => setForm({ ...form, isPopular: e.target.checked })} /> Popular</label>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Eliminar serviço"
        footer={<><Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button><Button variant="danger" onClick={remove}>Eliminar</Button></>}>
        <p className="text-sec">Eliminar o serviço <span className="text-gold fw-600">{deleteTarget?.name}</span>?</p>
      </Modal>
    </AdminLayout>
  );
}