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
  const [form, setForm] = useState({ description: '', amount: '', category: 'Fornecedores', method: 'Dinheiro' });
  const [aGravar, setAGravar] = useState(false);

  // Uma factura de fornecedor e uma despesa a qualquer hora: deixou de ser
  // preciso ter a caixa aberta. Quando esta aberta e o pagamento e em
  // dinheiro, a despesa sai tambem da caixa do dia.
  const session = data.cashSessions.find(s => s.status === 'open');
  const expenses = [...(data.expenses || [])].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const total = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  const add = async () => {
    if (!form.description || !form.amount) { toast.error('Dados incompletos'); return; }
    setAGravar(true);
    try {
      const emDinheiro = form.method === 'Dinheiro';
      await dataService.addExpense(emDinheiro && session ? session.id : null, {
        description: form.description, amount: Number(form.amount), category: form.category, method: form.method,
      });
      toast.success('Despesa registada', emDinheiro && session ? 'Saiu também da caixa de hoje.' : undefined);
      setModal(false); setForm({ description: '', amount: '', category: 'Fornecedores', method: 'Dinheiro' });
    } catch (e) {
      toast.error('Não foi possível registar', e.message);
    } finally { setAGravar(false); }
  };

  const remover = async (id) => {
    try { await dataService.deleteExpense(id); toast.info('Despesa eliminada'); }
    catch (e) { toast.error('Não foi possível eliminar', e.message); }
  };

  return (
    <AdminPage title="Despesas" subtitle="O que sai — fornecedores, rendas, o que for. Em dinheiro e com a caixa aberta, sai também da caixa."
      actions={<Button variant="primary" onClick={() => setModal(true)}><Plus size={16} /> Nova despesa</Button>}>
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
                  <td className="text-xs">{e.date || (e.createdAt || '').slice(0, 10)}</td>
                  <td className="fw-600">{e.description}</td>
                  <td><Badge variant="default">{e.category}</Badge></td>
                  <td className="fw-600">-{formatPrice(e.amount)}</td>
                  <td><button className="btn btn-ghost btn-icon" aria-label="Eliminar despesa" title="Eliminar despesa" onClick={() => remover(e.id)}><Trash2 size={15} /></button></td>
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
        <div className="field">
          <label className="label">Como foi paga</label>
          <select className="select" value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
            <option>Dinheiro</option><option>Cartão</option><option>MB WAY</option><option>Transferência</option><option>Débito direto</option>
          </select>
          {form.method === 'Dinheiro' && !session && (
            <p className="text-sec text-xs" style={{ marginTop: 6 }}>A caixa está fechada — a despesa fica registada, mas não sai da caixa de hoje.</p>
          )}
        </div>
        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}><Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button><Button variant="primary" onClick={add} disabled={aGravar}>Registar</Button></div>
      </Modal>
    </AdminPage>
  );
}