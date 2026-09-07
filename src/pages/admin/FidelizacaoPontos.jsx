import React, { useState } from 'react';
import { Coins, Plus, Trash2 } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Button, EmptyState, Modal, Badge } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';

const TYPES = { stamp: 'Carimbo', reward: 'Recompensa', redeem: 'Resgate', adjust: 'Ajuste' };

export default function FidelizacaoPontos() {
  const data = useStore();
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ customerId: '', type: 'stamp', amount: 1, reason: '' });

  const moves = data.loyaltyMovements || [];

  const add = async () => {
    if (!form.customerId) { toast.error('Seleciona um cliente'); return; }
    await dataService.addLoyaltyMovement(form);
    // aplica no saldo do cliente
    const c = data.customers.find(x => x.id === form.customerId);
    if (c) {
      const delta = form.type === 'stamp' || form.type === 'adjust' ? Number(form.amount) : (form.type === 'redeem' ? -Number(form.amount) : 0);
      if (delta) { const stamps = Math.max(0, (c.loyalty?.stamps || 0) + delta); await dataService.updateCustomer(c.id, { loyalty: { ...(c.loyalty || {}), stamps } }); }
    }
    toast.success('Movimento registado');
    setModal(false); setForm({ customerId: '', type: 'stamp', amount: 1, reason: '' });
  };

  return (
    <AdminPage title="Pontos / Carimbos" subtitle="Histórico e gestão de movimentos de fidelização."
      actions={<Button variant="primary" onClick={() => setModal(true)}><Plus size={16} /> Novo movimento</Button>}>
      {moves.length === 0 ? (
        <Card className="card-pad"><EmptyState icon={() => <Coins />} title="Sem movimentos" description="Os carimbos atribuídos nas marcações e movimentos manuais aparecem aqui." /></Card>
      ) : (
        <Card>
          <table className="table">
            <thead><tr><th>Data</th><th>Cliente</th><th>Tipo</th><th>Quantidade</th><th>Motivo</th></tr></thead>
            <tbody>{moves.map(m => (
              <tr key={m.id}>
                <td className="text-xs">{new Date(m.createdAt).toLocaleString('pt-PT').slice(0, 16)}</td>
                <td className="fw-600">{data.customers.find(c => c.id === m.customerId)?.name || '—'}</td>
                <td><Badge variant="gold">{TYPES[m.type] || m.type}</Badge></td>
                <td>{m.amount}</td>
                <td className="text-sec">{m.reason || '—'}</td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="Novo movimento de fidelização">
        <div className="field"><label className="label">Cliente</label>
          <select className="select" value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}><option value="">Selecionar…</option>{data.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div className="grid-2">
          <div className="field"><label className="label">Tipo</label><select className="select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>{Object.entries(TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
          <div className="field"><label className="label">Quantidade</label><input type="number" className="input" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
        </div>
        <div className="field"><label className="label">Motivo</label><input className="input" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} /></div>
        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}><Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button><Button variant="primary" onClick={add}>Registar</Button></div>
      </Modal>
    </AdminPage>
  );
}