import React, { useState } from 'react';
import { Plus, Trash2, TrendingDown } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Button, EmptyState, Badge, Modal } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { formatPrice } from '@/lib/format';

const CATS = ['Fornecedores', 'Limpeza', 'Marketing', 'Rendas', 'Salários', 'Outros'];

export default function FinExpenses() {
  const data = useStore();
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', category: 'Fornecedores' });

  const session = data.cashSessions.find(s => s.status === 'open');
  const expenses = [...(data.expenses || [])].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const total = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  const add = async () => {
    if (!form.description || !form.amount) { toast.error('Dados incompletos'); return; }
    if (!session) { toast.error('Caixa fechada', 'Abre a caixa para registar despesas com sessão.'); return; }
    await dataService.addExpense(session.id, { description: form.description, amount: Number(form.amount), category: form.category });
    toast.success('Despesa registada');
    setModal(false); setForm({ description: '', amount: '', category: 'Fornecedores' });
  };

  return (
    <AdminPage title="Despesas" subtitle="Gestão de despesas (associadas à sessão de caixa aberta)."
      actions={<Button variant="primary" disabled={!session} onClick={() => setModal(true)}><Plus size={16} /> Nova despesa</Button>}>
      {!session && <div className="badge badge-warning mb-24" style={{ display: 'inline-block' }}>Caixa fechada — abre a caixa para registar despesas.</div>}
      <div className="kpi-grid mb-24">
        <Card className="kpi"><TrendingDown className="icon" size={22} /><div className="label">Total despesas</div><div className="value">{formatPrice(total)}</div></Card>
      </div>
      <Card className="card-pad">
        {expenses.length === 0 ? <EmptyState icon={() => <TrendingDown />} title="Sem despesas" description="As despesas registadas aparecem aqui." /> : (
          <table className="table">
            <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th></th></tr></thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.id}>
                  <td className="text-xs">{new Date(e.createdAt).toLocaleString('pt-PT').slice(0, 16)}</td>
                  <td className="fw-600">{e.description}</td>
                  <td><Badge variant="default">{e.category}</Badge></td>
                  <td className="fw-600">-{formatPrice(e.amount)}</td>
                  <td><button className="btn btn-ghost btn-icon" aria-label="Eliminar despesa" title="Eliminar despesa" onClick={() => dataService.deleteExpense(e.id)}><Trash2 size={15} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Nova despesa">
        <div className="field"><label className="label">Descrição</label><input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
        <div className="grid-2">
          <div className="field"><label className="label">Valor (€)</label><input type="number" className="input" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
          <div className="field"><label className="label">Categoria</label><select className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{CATS.map(c => <option key={c}>{c}</option>)}</select></div>
        </div>
        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}><Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button><Button variant="primary" onClick={add}>Registar</Button></div>
      </Modal>
    </AdminPage>
  );
}