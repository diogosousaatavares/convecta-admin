import React, { useState, useMemo } from 'react';
import { Megaphone, Plus, Edit, Trash2, Power, Ticket, Percent, Gift } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Badge, Button, EmptyState, Modal } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { formatDate } from '@/lib/format';

const TYPES = [
  { key: 'discount', label: 'Desconto', icon: Percent },
  { key: 'flash', label: 'Flash', icon: Ticket },
  { key: 'loyalty', label: 'Fidelidade', icon: Gift }
];

export default function Marketing() {
  const data = useStore();
  const toast = useToast();
  const [filter, setFilter] = useState('all');
  const [editModal, setEditModal] = useState(false);
  const [delId, setDelId] = useState(null);
  const blank = { name: '', type: 'discount', value: 10, code: '', startsAt: new Date().toISOString().slice(0,10), endsAt: '', active: true, description: '' };
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);

  const promos = useMemo(() => {
    if (filter === 'active') return data.promotions.filter(p => p.active);
    if (filter === 'inactive') return data.promotions.filter(p => !p.active);
    return data.promotions;
  }, [data.promotions, filter]);

  const openNew = () => { setEditingId(null); setForm(blank); setEditModal(true); };
  const openEdit = (p) => { setEditingId(p.id); setForm({ ...p }); setEditModal(true); };

  const save = async () => {
    if (!form.name || !form.endsAt) { toast.error('Dados incompletos', 'Nome e fim são obrigatórios.'); return; }
    if (editingId) { await dataService.updatePromotion(editingId, { ...form, value: Number(form.value) }); toast.success('Promoção atualizada'); }
    else { await dataService.createPromotion({ ...form, value: Number(form.value) }); toast.success('Promoção criada'); }
    setEditModal(false);
  };

  const remove = async () => { await dataService.deletePromotion(delId); toast.info('Promoção eliminada'); setDelId(null); };

  return (
    <AdminLayout>
      <div className="page-head">
        <h1>Marketing &amp; Promoções</h1>
        <p>Campanhas, descontos e programa de fidelidade</p>
      </div>
      <PageInfo page="promocoes" />

      <div className="kpi-grid">
        <Card className="kpi"><Megaphone className="icon" size={22} /><div className="label">Campanhas ativas</div><div className="value">{data.promotions.filter(p => p.active).length}</div></Card>
        <Card className="kpi"><Ticket className="icon" size={22} /><div className="label">Total</div><div className="value">{data.promotions.length}</div></Card>
        <Card className="kpi"><Gift className="icon" size={22} /><div className="label">Recompensas fidelidade</div><div className="value gold">{data.customers.reduce((s,c)=>s+(c.loyalty?.rewardsEarned||0),0)}</div></Card>
      </div>

      <Card className="card-pad">
        <div className="flex justify-between items-center mb-16" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="chip-row" style={{ marginBottom: 0 }}>
            <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todas</button>
            <button className={`chip ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>Ativas</button>
            <button className={`chip ${filter === 'inactive' ? 'active' : ''}`} onClick={() => setFilter('inactive')}>Inativas</button>
          </div>
          <Button variant="primary" onClick={openNew}><Plus size={16} /> Nova promoção</Button>
        </div>

        {promos.length === 0 ? (
          <EmptyState icon={() => <Megaphone />} title="Sem promoções" description="Cria campanhas de desconto ou fidelidade para os teus clientes." />
        ) : (
          <div className="meg-grid">
            {promos.map(p => {
              const T = TYPES.find(t => t.key === p.type) || TYPES[0];
              const Ico = T.icon;
              const ended = p.endsAt && p.endsAt < new Date().toISOString().slice(0,10);
              return (
                <Card key={p.id} className="meg-card card-hover">
                  <div className="flex justify-between items-center mb-16">
                    <span className="notif-ico"><Ico size={18} /></span>
                    <Badge variant={p.active ? 'success' : 'default'}>{p.active ? 'Ativa' : 'Inativa'}</Badge>
                  </div>
                  <h3 style={{ fontSize: 17 }}>{p.name}</h3>
                  <div className="text-sec text-sm mt-8">{p.description}</div>
                  <div className="flex gap-8 mt-16" style={{ flexWrap: 'wrap' }}>
                    {p.code && <Badge variant="gold">{p.code}</Badge>}
                    {p.type === 'discount' && <Badge variant="default">-{p.value}%</Badge>}
                    {p.type === 'flash' && <Badge variant="warning">Flash</Badge>}
                    {p.type === 'loyalty' && <Badge variant="gold">Fidelidade</Badge>}
                    {ended && <Badge variant="danger">Terminada</Badge>}
                  </div>
                  <div className="text-sec text-xs mt-16">{formatDate(p.startsAt)} → {formatDate(p.endsAt)}</div>
                  <div className="flex gap-8 mt-16">
                    <Button size="sm" variant="secondary" onClick={() => dataService.togglePromotion(p.id)}><Power size={14} /> {p.active ? 'Desativar' : 'Ativar'}</Button>
                    <button className="btn btn-ghost btn-icon" aria-label="Editar promoção" title="Editar promoção" onClick={() => openEdit(p)}><Edit size={16} /></button>
                    <button className="btn btn-ghost btn-icon" aria-label="Eliminar promoção" title="Eliminar promoção" onClick={() => setDelId(p.id)}><Trash2 size={16} /></button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      <Modal open={editModal} onClose={() => setEditModal(false)} title={editingId ? 'Editar promoção' : 'Nova promoção'}>
        <div className="field"><label className="label">Nome</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
        <div className="grid-2">
          <div className="field">
            <label className="label">Tipo</label>
            <select className="select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
          <div className="field"><label className="label">{form.type === 'discount' ? 'Desconto (%)' : 'Valor'}</label><input type="number" className="input" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} /></div>
        </div>
        <div className="field"><label className="label">Código promocional</label><input className="input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="Ex: COMBO10" /></div>
        <div className="grid-2">
          <div className="field"><label className="label">Início</label><input type="date" className="input" value={form.startsAt} onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))} /></div>
          <div className="field"><label className="label">Fim</label><input type="date" className="input" value={form.endsAt} onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))} /></div>
        </div>
        <div className="field"><label className="label">Descrição</label><textarea className="textarea" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setEditModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={save}>{editingId ? 'Guardar' : 'Criar'}</Button>
        </div>
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="Eliminar promoção">
        <p className="text-sec">Confirmas a eliminação desta promoção?</p>
        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setDelId(null)}>Cancelar</Button>
          <Button variant="danger" onClick={remove}>Eliminar</Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}