import React, { useState } from 'react';
import { Ticket, Plus, Trash2, Power } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Button, EmptyState, Modal, Badge } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { formatDate } from '@/lib/format';

const blank = { name: '', type: 'percent', value: 10, code: '', startsAt: new Date().toISOString().slice(0, 10), endsAt: '', active: true, description: '' };

const normalizeCouponType = (type) => {
  if (type === 'discount') return 'percent';
  if (type === 'flash') return 'fixed';
  return type || 'percent';
};

export default function Coupons() {
  const data = useStore();
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blank);

  const coupons = data.promotions.filter(p => !!p.code);

  const couponType = (p) => normalizeCouponType(p?.type);

  const openNew = () => { setEditingId(null); setForm({ ...blank, code: 'CUPAO' + Math.floor(Math.random() * 9000 + 1000) }); setModal(true); };
  const openEdit = (p) => { setEditingId(p.id); setForm({ ...p }); setModal(true); };
  const save = async () => {
    if (!form.name || !form.code || !form.endsAt) { toast.error('Dados incompletos', 'Nome, código e fim são obrigatórios.'); return; }
    if (editingId) { await dataService.updatePromotion(editingId, { ...form, value: Number(form.value) }); toast.success('Cupão atualizado'); }
    else { await dataService.createPromotion({ ...form, value: Number(form.value) }); toast.success('Cupão criado'); }
    setModal(false);
  };

  return (
    <AdminPage title="Cupões" subtitle="Códigos promocionais para descontos em comanda."
      actions={<Button variant="primary" onClick={openNew}><Plus size={16} /> Novo cupão</Button>}>
      {coupons.length === 0 ? (
        <Card className="card-pad"><EmptyState icon={() => <Ticket />} title="Sem cupões" description="Cria códigos promocionais aplicáveis no checkout." /></Card>
      ) : (
        <div className="meg-grid">
          {coupons.map(p => (
            <Card key={p.id} className="meg-card card-hover">
              <div className="flex justify-between items-center mb-16"><span className="notif-ico"><Ticket size={18} /></span><Badge variant={p.active ? 'success' : 'default'}>{p.active ? 'Ativo' : 'Inativo'}</Badge></div>
              <h3 style={{ fontSize: 17 }}>{p.name}</h3>
              <div className="flex gap-8 mt-16" style={{ flexWrap: 'wrap' }}>
                <Badge variant="gold">{p.code}</Badge>
                <Badge variant="default">-{p.value}{couponType(p) === 'percent' ? '%' : '€'}</Badge>
              </div>
              <div className="text-sec text-xs mt-16">{formatDate(p.startsAt)} → {formatDate(p.endsAt)}</div>
              <div className="flex gap-8 mt-16">
                <Button size="sm" variant="secondary" onClick={() => dataService.togglePromotion(p.id)}><Power size={14} /> {p.active ? 'Desativar' : 'Ativar'}</Button>
                <button className="btn btn-ghost btn-icon" aria-label="Editar cupão" title="Editar cupão" onClick={() => openEdit(p)}><Ticket size={14} /></button>
                <button className="btn btn-ghost btn-icon" aria-label="Eliminar cupão" title="Eliminar cupão" onClick={() => dataService.deletePromotion(p.id)}><Trash2 size={15} /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editingId ? 'Editar cupão' : 'Novo cupão'}>
        <div className="field"><label className="label">Nome</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
        <div className="grid-2">
          <div className="field"><label className="label">Tipo</label><select className="select" value={normalizeCouponType(form.type)} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}><option value="percent">Percentagem</option><option value="fixed">Valor (€)</option></select></div>
          <div className="field"><label className="label">{normalizeCouponType(form.type) === 'percent' ? 'Desconto (%)' : 'Valor (€)'}</label><input type="number" className="input" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} /></div>
        </div>
        <div className="field"><label className="label">Código</label><input className="input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} /></div>
        <div className="grid-2">
          <div className="field"><label className="label">Início</label><input type="date" className="input" value={form.startsAt} onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))} /></div>
          <div className="field"><label className="label">Fim</label><input type="date" className="input" value={form.endsAt} onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))} /></div>
        </div>
        <div className="field"><label className="label">Descrição</label><textarea className="textarea" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}><Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button><Button variant="primary" onClick={save}>{editingId ? 'Guardar' : 'Criar'}</Button></div>
      </Modal>
    </AdminPage>
  );
}