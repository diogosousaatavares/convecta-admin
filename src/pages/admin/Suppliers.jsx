import React, { useState } from 'react';
import { Truck, Plus, Edit, Trash2 } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Button, EmptyState, Modal, Badge } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';

const blank = { name: '', contact: '', email: '', phone: '' };

export default function Suppliers() {
  const data = useStore();
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blank);
  const [delId, setDelId] = useState(null);

  const suppliers = data.suppliers || [];

  const openNew = () => { setEditingId(null); setForm(blank); setModal(true); };
  const openEdit = (s) => { setEditingId(s.id); setForm({ name: s.name, contact: s.contact, email: s.email, phone: s.phone }); setModal(true); };

  const save = async () => {
    if (!form.name) { toast.error('Nome obrigatório'); return; }
    if (editingId) { await dataService.updateSupplier(editingId, form); toast.success('Fornecedor atualizado'); }
    else { await dataService.createSupplier(form); toast.success('Fornecedor criado'); }
    setModal(false);
  };
  const remove = async () => { await dataService.deleteSupplier(delId); toast.info('Fornecedor removido'); setDelId(null); };

  return (
    <AdminPage title="Fornecedores" subtitle="Gestão de fornecedores e produtos associados."
      actions={<Button variant="primary" onClick={openNew}><Plus size={16} /> Novo fornecedor</Button>}>
      {suppliers.length === 0 ? (
        <Card className="card-pad"><EmptyState icon={() => <Truck />} title="Sem fornecedores" description="Adiciona o primeiro fornecedor." /></Card>
      ) : (
        <div className="grid-3">
          {suppliers.map(s => {
            const products = data.products.filter(p => (p.supplier || '') === s.name);
            return (
              <Card key={s.id} className="card-pad card-hover">
                <div className="flex justify-between items-center mb-16">
                  <span className="notif-ico"><Truck size={18} /></span>
                  <Badge variant="default">{products.length} produtos</Badge>
                </div>
                <h3 style={{ fontSize: 17 }}>{s.name}</h3>
                <div className="text-sec text-sm mt-8">{s.contact || s.email || s.phone || 'Sem contactos'}</div>
                <div className="text-xs text-sec mt-8">{s.email && <div>{s.email}</div>}{s.phone && <div>{s.phone}</div>}</div>
                <div className="flex gap-8 mt-16">
                  <Button size="sm" variant="secondary" block onClick={() => openEdit(s)}><Edit size={14} /> Editar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setDelId(s.id)}><Trash2 size={14} /></Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editingId ? 'Editar fornecedor' : 'Novo fornecedor'}>
        <div className="field"><label className="label">Nome</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
        <div className="field"><label className="label">Contacto</label><input className="input" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} /></div>
        <div className="grid-2">
          <div className="field"><label className="label">Email</label><input className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          <div className="field"><label className="label">Telefone</label><input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
        </div>
        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}><Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button><Button variant="primary" onClick={save}>{editingId ? 'Guardar' : 'Criar'}</Button></div>
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="Eliminar fornecedor">
        <p className="text-sec">Confirmas a eliminação deste fornecedor?</p>
        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}><Button variant="secondary" onClick={() => setDelId(null)}>Cancelar</Button><Button variant="danger" onClick={remove}>Eliminar</Button></div>
      </Modal>
    </AdminPage>
  );
}