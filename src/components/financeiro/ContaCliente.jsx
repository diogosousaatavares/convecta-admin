import React, { useState } from 'react';
import { Plus, Minus, Wallet } from 'lucide-react';
import { Card, Button, EmptyState, Modal, Avatar } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { formatPrice } from '@/lib/format';

export default function ContaCliente() {
  const data = useStore();
  const toast = useToast();
  const [target, setTarget] = useState(null);
  const [mode, setMode] = useState('in');
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');

  const totalCredit = data.customers.reduce((s, c) => s + (c.balance || 0), 0);

  const open = (id, m) => { setTarget(id); setMode(m); setDelta(''); setReason(''); };
  const apply = async () => {
    if (!delta) { toast.error('Valor', 'Indica o valor.'); return; }
    const val = Math.abs(Number(delta));
    await dataService.adjustCustomerBalance(target, mode === 'out' ? -val : val, reason);
    toast.success(mode === 'out' ? 'Débito registado' : 'Crédito registado');
    setTarget(null); setDelta(''); setReason('');
  };

  return (
    <>
      <Card className="kpi"><Wallet className="icon" size={22} /><div className="label">Crédito total em carteira</div><div className="value gold">{formatPrice(totalCredit)}</div></Card>

      <Card className="card-pad mt-24">
        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Conta do Cliente</h3>
        {data.customers.length === 0 ? (
          <EmptyState title="Sem clientes" />
        ) : (
          <table className="table">
            <thead><tr><th>Cliente</th><th>Visitas</th><th>Total gasto</th><th>Saldo</th><th>Ações</th></tr></thead>
            <tbody>
              {data.customers.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-8">
                      <Avatar name={c.name} />
                      <div><div className="fw-600 text-sm">{c.name}</div><div className="text-sec text-xs">{c.email}</div></div>
                    </div>
                  </td>
                  <td>{c.totalAppointments || 0}</td>
                  <td>{formatPrice(c.totalSpent || 0)}</td>
                  <td className="fw-600" style={{ color: (c.balance || 0) < 0 ? 'var(--error)' : 'var(--gold)' }}>{formatPrice(c.balance || 0)}</td>
                  <td>
                    <div className="flex gap-8">
                      <button className="btn btn-ghost btn-icon" title="Adicionar crédito" onClick={() => open(c.id, 'in')}><Plus size={15} /></button>
                      <button className="btn btn-ghost btn-icon" title="Debitar" onClick={() => open(c.id, 'out')}><Minus size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={!!target} onClose={() => setTarget(null)} title={mode === 'out' ? 'Debitar saldo' : 'Adicionar crédito'}>
        <div className="ag-detail">
          <div className="field"><label className="label">Valor (€)</label><input type="number" className="input" value={delta} onChange={e => setDelta(e.target.value)} min="0" step="0.01" /></div>
          <div className="field"><label className="label">Motivo</label><input className="input" value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex: carga de cartão, ajuste..." /></div>
          <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}><Button variant="secondary" onClick={() => setTarget(null)}>Cancelar</Button><Button variant="primary" onClick={apply}>Aplicar</Button></div>
        </div>
      </Modal>
    </>
  );
}