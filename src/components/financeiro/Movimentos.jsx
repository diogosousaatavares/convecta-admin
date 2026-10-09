import LinhaDinheiro from '@/components/admin/LinhaDinheiro';
import React, { useState } from 'react';
import { Plus, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Card, Button, EmptyState, Modal } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { formatPrice, formatDataHora } from '@/lib/format';
import { saidasDoPeriodo, entradasAvulsas } from '@/lib/domain/finance';

export default function Movimentos({ mode = 'all' }) {
  const data = useStore();
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ type: mode === 'in' ? 'in' : 'out', amount: '', category: 'Outros', notes: '' });
  // Saídas = despesas (em qualquer método) + saídas avulsas de caixa. Antes
  // só mostrava os movimentos avulsos: uma despesa paga em dinheiro saía da
  // caixa e não aparecia aqui.
  const entradas = entradasAvulsas(data).map(m => ({ ...m, tipo: 'in', origem: 'caixa', movimentoId: m.id }));
  const saidas = saidasDoPeriodo(data).map(x => ({ ...x, tipo: 'out' }));
  const moves = [...(mode === 'out' ? [] : entradas), ...(mode === 'in' ? [] : saidas)]
    .sort((a, b) => (b.quando || b.data || '').localeCompare(a.quando || a.data || ''));
  const totalIn = entradas.reduce((s, m) => s + m.valor, 0);
  const totalOut = saidas.reduce((s, m) => s + m.valor, 0);

  const add = async () => {
    if (!(Number(form.amount) > 0)) { toast.error('Valor', 'Indica um valor maior que zero.'); return; }
    try {
      await dataService.addCashMovement({ type: form.type, amount: Number(form.amount), category: form.category, notes: form.notes });
      toast.success('Movimento registado');
      setModal(false); setForm({ type: 'out', amount: '', category: 'Outros', notes: '' });
    } catch (e) { toast.error('Não foi possível registar', e.message); }
  };

  return (
    <>
      <div className="kpi-grid">
        {mode !== 'out' && <Card className="kpi"><ArrowDownCircle className="icon" size={22} /><div className="label">Entradas avulsas</div><div className="value gold">{formatPrice(totalIn)}</div></Card>}
        {mode !== 'in' && <Card className="kpi"><ArrowUpCircle className="icon" size={22} /><div className="label">Saídas</div><div className="value">{formatPrice(totalOut)}</div></Card>}
        {mode === 'all' && <Card className="kpi"><div className="label">Saldo</div><div className={`value ${totalIn - totalOut < 0 ? 'neg' : 'gold'}`}>{formatPrice(totalIn - totalOut)}</div></Card>}
      </div>

      <Card className="card-pad mt-24">
        <div className="flex justify-between items-center mb-16">
          <h3 style={{ fontSize: 18 }}>{mode === 'in' ? 'Entradas' : mode === 'out' ? 'Saídas' : 'Entradas / Saídas'}</h3>
          <Button variant="primary" size="sm" onClick={() => setModal(true)}><Plus size={15} /> Novo movimento</Button>
        </div>
        {moves.length === 0 ? (
          <EmptyState title="Sem movimentos" />
        ) : (
          <div>
            {moves.map(m => (
              <LinhaDinheiro key={m.id}
                hora={m.quando ? formatDataHora(m.quando).slice(-5) : ''}
                titulo={m.descricao || (m.tipo === 'in' ? 'Entrada' : 'Saída')}
                valor={`${m.tipo === 'in' ? '+' : '-'}${formatPrice(m.valor)}`} cor={m.tipo === 'in' ? 'var(--success)' : 'var(--error)'}
                detalhes={[['Tipo', m.origem === 'despesa' ? 'Despesa' : 'Caixa'], ['Categoria', m.categoria], ['Método', m.metodo], ['Quando', m.quando ? formatDataHora(m.quando) : m.data]]}
                onApagar={m.movimentoId ? () => dataService.deleteCashMovement(m.movimentoId).catch(e => toast.error('Não foi possível apagar', e.message)) : undefined} />
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