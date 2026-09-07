import React, { useState } from 'react';
import { Plus, Trash2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Card, Button, EmptyState, Modal } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { formatPrice } from '@/lib/format';

export default function Movimentos({ mode = 'all' }) {
  const data = useStore();
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ type: mode === 'in' ? 'in' : 'out', amount: '', category: 'Outros', notes: '' });
  const moves = (data.cashMovements || []).filter(m => mode === 'all' || m.type === mode);
  const totalIn = (data.cashMovements || []).filter(m => m.type === 'in').reduce((s, m) => s + Number(m.amount || 0), 0);
  const totalOut = (data.cashMovements || []).filter(m => m.type === 'out').reduce((s, m) => s + Number(m.amount || 0), 0);

  const add = async () => {
    if (!form.amount) { toast.error('Valor', 'Indica o valor.'); return; }
    await dataService.addCashMovement({ type: form.type, amount: Number(form.amount), category: form.category, notes: form.notes });
    toast.success('Movimento registado');
    setModal(false); setForm({ type: 'out', amount: '', category: 'Outros', notes: '' });
  };

  return (
    <>
      <div className="kpi-grid">
        <Card className="kpi"><ArrowDownCircle className="icon" size={22} /><div className="label">Entradas</div><div className="value gold">{formatPrice(totalIn)}</div></Card>
        <Card className="kpi"><ArrowUpCircle className="icon" size={22} /><div className="label">Saídas</div><div className="value">{formatPrice(totalOut)}</div></Card>
        <Card className="kpi"><div className="label">Saldo</div><div className="value gold">{formatPrice(totalIn - totalOut)}</div></Card>
      </div>

      <Card className="card-pad mt-24">
        <div className="flex justify-between items-center mb-16">
          <h3 style={{ fontSize: 18 }}>Entradas / Saídas</h3>
          <Button variant="primary" size="sm" onClick={() => setModal(true)}><Plus size={15} /> Novo movimento</Button>
        </div>
        {moves.length === 0 ? (
          <EmptyState title="Sem movimentos" description="Regista entradas ou saídas avulsas (fora das marcações)." />
        ) : (
          <div className="flex-col gap-8">
            {moves.map(m => (
              <div key={m.id} className="flex items-center gap-12" style={{ padding: '11px 14px', background: 'var(--elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: m.type === 'in' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: m.type === 'in' ? 'var(--success)' : 'var(--error)', flexShrink: 0 }}>
                  {m.type === 'in' ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                </span>
                <div className="flex-1">
                  <div className="fw-600 text-sm">{m.category}</div>
                  <div className="text-sec text-xs">{m.notes || '—'} · {new Date(m.createdAt).toLocaleString('pt-PT').slice(0, 16)}</div>
                </div>
                <span className="fw-600" style={{ color: m.type === 'in' ? 'var(--success)' : 'var(--error)' }}>{m.type === 'in' ? '+' : '-'}{formatPrice(m.amount)}</span>
                <button className="btn btn-ghost btn-icon" onClick={() => dataService.deleteCashMovement(m.id)}><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Novo movimento">
        <div className="field"><label className="label">Tipo</label>
          <div className="ag-viewseg">
            <button className={form.type === 'in' ? 'active' : ''} onClick={() => setForm(f => ({ ...f, type: 'in' }))} style={{ padding: '10px 18px' }}>Entrada</button>
            <button className={form.type === 'out' ? 'active' : ''} onClick={() => setForm(f => ({ ...f, type: 'out' }))} style={{ padding: '10px 18px' }}>Saída</button>
          </div>
        </div>
        <div className="field"><label className="label">Valor (€)</label><input type="number" className="input" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} min="0" step="0.01" /></div>
        <div className="field"><label className="label">Categoria</label><input className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
        <div className="field"><label className="label">Notas</label><input className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}><Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button><Button variant="primary" onClick={add}>Registar</Button></div>
      </Modal>
    </>
  );
}