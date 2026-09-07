import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ReceiptText, Plus, Trash2, X } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Button, EmptyState, Badge, Modal, Avatar } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { formatPrice, formatDateShortNum } from '@/lib/format';

const STATUS_PATH = { abertas: 'open', pendentes: 'pending', pagas: 'paid', canceladas: 'cancelled', historico: 'all' };
const STATUS_LABEL = { open: 'Aberta', pending: 'Pendente', paid: 'Paga', cancelled: 'Cancelada' };
const STATUS_VARIANT = { open: 'warning', pending: 'default', paid: 'success', cancelled: 'danger' };

export default function Comandas() {
  const data = useStore();
  const toast = useToast();
  const location = useLocation();
  const seg = location.pathname.split('/').pop();
  const statusFilter = STATUS_PATH[seg] || 'open';

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ customerId: '', professionalId: '', items: [], discountAmount: 0, tip: 0, method: 'Dinheiro', status: 'open' });
  const [itemPick, setItemPick] = useState({ kind: 'service', refId: '' });

  const comandas = useMemo(() => {
    return (data.comandas || []).filter(c => statusFilter === 'all' || c.status === statusFilter)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [data.comandas, statusFilter]);

  const base = (it) => {
    if (it.kind === 'service') return data.services.find(s => s.id === it.refId)?.price || 0;
    const product = data.products.find(p => p.id === it.refId);
    return product?.price ?? product?.cost ?? 0;
  };
  const computeTotal = (items, discount, tip) => items.reduce((s, it) => s + base(it) * (it.qty || 1), 0) - (discount || 0) + (tip || 0);

  const openNew = () => { setEditing(null); setForm({ customerId: '', professionalId: '', items: [], discountAmount: 0, tip: 0, method: 'Dinheiro', status: 'open' }); setItemPick({ kind: 'service', refId: '' }); setModal(true); };
  const openEdit = (c) => { setEditing(c.id); setForm({ ...c }); setItemPick({ kind: 'service', refId: '' }); setModal(true); };

  const addItem = () => {
    if (!itemPick.refId) return;
    const name = itemPick.kind === 'service' ? data.services.find(s => s.id === itemPick.refId)?.name : data.products.find(p => p.id === itemPick.refId)?.name;
    setForm(f => ({ ...f, items: [...f.items, { kind: itemPick.kind, refId: itemPick.refId, name, qty: 1, price: base({ kind: itemPick.kind, refId: itemPick.refId }) }] }));
    setItemPick({ kind: itemPick.kind, refId: '' });
  };
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const total = computeTotal(form.items, Number(form.discountAmount) || 0, Number(form.tip) || 0);

  const save = async () => {
    if (!form.customerId || form.items.length === 0) { toast.error('Dados incompletos', 'Cliente e itens são obrigatórios.'); return; }
    const payload = { ...form, discountAmount: Number(form.discountAmount) || 0, tip: Number(form.tip) || 0, total, appointmentId: form.appointmentId || null };
    if (editing) { await dataService.updateComanda(editing, payload); toast.success('Comanda atualizada', formatPrice(total)); }
    else { await dataService.createComanda(payload); toast.success('Comanda criada', formatPrice(total)); }
    setModal(false);
  };
  const remove = async (id) => { await dataService.deleteComanda(id); toast.info('Comanda eliminada'); };

  const titles = { open: 'Comandas Abertas', pending: 'Comandas Pendentes', paid: 'Comandas Pagas', cancelled: 'Comandas Canceladas', all: 'Histórico de Comandas' };

  return (
    <AdminPage title={titles[statusFilter] || 'Comandas'} subtitle="Operação comercial: serviços + produtos + pagamento."
      actions={<Button variant="primary" onClick={openNew}><Plus size={16} /> Nova comanda</Button>}>
      {comandas.length === 0 ? (
        <Card className="card-pad"><EmptyState icon={() => <ReceiptText />} title="Sem comandas" description="Cria a primeira comanda para registar uma transação." /></Card>
      ) : (
        <Card>
          <table className="table">
            <thead><tr><th>Data</th><th>Cliente</th><th>Profissional</th><th>Itens</th><th>Total</th><th>Método</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {comandas.map(c => (
                <tr key={c.id}>
                  <td className="text-xs">{new Date(c.createdAt).toLocaleString('pt-PT').slice(0, 16)}</td>
                  <td><div className="flex items-center gap-8"><Avatar name={data.customers.find(x => x.id === c.customerId)?.name} /><span className="text-sm fw-600">{data.customers.find(x => x.id === c.customerId)?.name || '—'}</span></div></td>
                  <td className="text-sm">{data.professionals.find(p => p.id === c.professionalId)?.name || '—'}</td>
                  <td className="text-sm">{c.items?.length || 0}</td>
                  <td className="fw-600">{formatPrice(c.total || 0)}</td>
                  <td className="text-sm">{c.method || '—'}</td>
                  <td><Badge variant={STATUS_VARIANT[c.status] || 'default'}>{STATUS_LABEL[c.status] || c.status}</Badge></td>
                  <td>
                    <div className="flex gap-8">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>Abrir</Button>
                      <button className="btn btn-ghost btn-icon" aria-label="Eliminar comanda" title="Eliminar comanda" onClick={() => remove(c.id)}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar comanda' : 'Nova comanda'}>
        <div className="grid-2">
          <div className="field"><label className="label">Cliente</label>
            <select className="select" value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}><option value="">Selecionar…</option>{data.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="field"><label className="label">Profissional</label>
            <select className="select" value={form.professionalId} onChange={e => setForm(f => ({ ...f, professionalId: e.target.value }))}><option value="">Selecionar…</option>{data.professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        </div>

        <label className="label">Itens</label>
        <div className="flex gap-8 mb-16">
          <select className="select" style={{ width: 110 }} value={itemPick.kind} onChange={e => setItemPick(p => ({ kind: e.target.value, refId: '' }))}>
            <option value="service">Serviço</option><option value="product">Produto</option>
          </select>
          <select className="select" value={itemPick.refId} onChange={e => setItemPick(p => ({ ...p, refId: e.target.value }))}>
            <option value="">Selecionar…</option>
            {itemPick.kind === 'service' ? data.services.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name} — {formatPrice(s.price)}</option>)
              : data.products.map(p => <option key={p.id} value={p.id}>{p.name} — {formatPrice(p.price ?? p.cost ?? 0)}</option>)}
          </select>
          <Button variant="secondary" onClick={addItem}><Plus size={15} /></Button>
        </div>
        {form.items.length === 0 ? <p className="text-sec text-sm mb-16">Sem itens.</p> : (
          <div className="flex-col gap-8 mb-16">
            {form.items.map((it, i) => (
              <div key={i} className="flex items-center gap-12" style={{ padding: '8px 12px', background: 'var(--elevated)', borderRadius: 8 }}>
                <Badge variant="default">{it.kind === 'service' ? 'Serviço' : 'Produto'}</Badge>
                <span className="flex-1 text-sm">{it.name}</span>
                <span className="text-sec text-sm">{formatPrice(it.price)}</span>
                <button className="btn btn-ghost btn-icon" aria-label="Remover item" title="Remover item" onClick={() => removeItem(i)}><X size={14} /></button>
              </div>
            ))}
          </div>
        )}

        <div className="grid-3">
          <div className="field"><label className="label">Desconto (€)</label><input type="number" className="input" value={form.discountAmount} onChange={e => setForm(f => ({ ...f, discountAmount: e.target.value }))} /></div>
          <div className="field"><label className="label">Gorjeta (€)</label><input type="number" className="input" value={form.tip} onChange={e => setForm(f => ({ ...f, tip: e.target.value }))} /></div>
          <div className="field"><label className="label">Método</label>
            <select className="select" value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>{['Dinheiro','Cartão','MB WAY','Transferência','Voucher'].map(m => <option key={m}>{m}</option>)}</select></div>
        </div>
        <div className="field"><label className="label">Estado</label>
          <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>{Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>

        <div style={{ padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
          <div className="flex justify-between"><span className="text-sec text-sm">Total</span><span className="text-gold fw-600" style={{ fontFamily: 'var(--font-head)', fontSize: 20 }}>{formatPrice(total)}</span></div>
        </div>
        <div className="flex gap-12" style={{ justifyContent: 'flex-end', marginTop: 16 }}><Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button><Button variant="primary" onClick={save}>{editing ? 'Guardar' : 'Criar comanda'}</Button></div>
      </Modal>
    </AdminPage>
  );
}