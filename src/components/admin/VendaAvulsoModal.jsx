import React, { useState, useMemo, useEffect } from 'react';
import { Plus, X, ShoppingBag, Banknote, CreditCard, Smartphone, Receipt, Gift } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatPrice } from '@/lib/format';
import dataService from '@/lib/dataService';

const METHODS = [
  { key: 'Dinheiro', icon: Banknote },
  { key: 'Cartão', icon: CreditCard },
  { key: 'MB WAY', icon: Smartphone },
  { key: 'Transferência', icon: Receipt },
  { key: 'Voucher', icon: Gift },
];

export default function VendaAvulsoModal({ open, onClose }) {
  const data = useStore();
  const [method, setMethod] = useState('Dinheiro');
  const [customerId, setCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [items, setItems] = useState([]);
  const [selProductId, setSelProductId] = useState('');
  const [selQty, setSelQty] = useState(1);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setMethod('Dinheiro');
      setCustomerId('');
      setCustomerSearch('');
      setItems([]);
      setSelProductId('');
      setSelQty(1);
      setError('');
    }
  }, [open]);

  const availableProducts = useMemo(() =>
    (data.products || []).filter(p => p.isActive !== false && (p.stock == null || p.stock > 0)),
    [data.products]
  );
  const customerResults = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return [];
    return (data.customers || []).filter(c => (c.name || '').toLowerCase().includes(query)).slice(0, 8);
  }, [customerSearch, data.customers]);

  const addItem = () => {
    if (!selProductId) return;
    const prod = availableProducts.find(p => p.id === selProductId);
    if (!prod) return;
    const qty = Math.max(1, parseInt(selQty, 10) || 1);
    setItems(prev => {
      const existing = prev.find(i => i.productId === selProductId);
      if (existing) {
        return prev.map(i => i.productId === selProductId
          ? { ...i, qty: i.qty + qty, subtotal: (i.qty + qty) * i.unitPrice }
          : i
        );
      }
      return [...prev, { productId: prod.id, name: prod.name, unitPrice: prod.price || 0, qty, subtotal: qty * (prod.price || 0) }];
    });
    setSelProductId('');
    setSelQty(1);
  };

  const removeItem = productId => setItems(prev => prev.filter(i => i.productId !== productId));
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  const submit = async () => {
    setError('');
    if (items.length === 0) { setError('Adiciona pelo menos um produto.'); return; }

    if (method === 'Dinheiro') {
      const session = await dataService.getOpenCashSession();
      if (!session) {
        setError('Caixa não aberta. Abre a caixa antes de registar vendas em dinheiro.');
        return;
      }
    }

    setSaving(true);
    try {
      for (const item of items) {
        const prod = data.products.find(p => p.id === item.productId);
        if (prod && prod.stock != null) {
          await dataService.updateProduct(item.productId, { stock: Math.max(0, prod.stock - item.qty) });
        }
      }

      if (method === 'Dinheiro' && total > 0) {
        const custName = customerId ? data.customers.find(c => c.id === customerId)?.name || '' : '';
        await dataService.addCashMovement({
          type: 'in',
          amount: total,
          description: `Venda de produtos${custName ? ` — ${custName}` : ''}`,
          method: 'Dinheiro',
          category: 'Venda de produto',
        });
      }

      await dataService.createSale({
        customerId: customerId || null,
        items,
        total,
        method,
        date: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
      });

      onClose({ success: true, total, method });
    } catch (e) {
      setError('Erro ao registar venda. Tenta novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={() => onClose(null)} title="Venda de produto">
      <div className="ag-detail">
        <div className="field">
          <label className="label" htmlFor="venda-avulsa-customer">Cliente (opcional)</label>
          <div style={{ position: 'relative' }}>
            <input
              id="venda-avulsa-customer"
              className="input"
              placeholder="Pesquisar cliente por nome..."
              value={customerSearch}
              onChange={e => { setCustomerSearch(e.target.value); setCustomerId(''); }}
              autoComplete="off"
            />
            {customerId && (
              <button
                type="button"
                onClick={() => { setCustomerId(''); setCustomerSearch(''); }}
                aria-label="Remover cliente selecionado"
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 0, color: 'var(--text-sec)', cursor: 'pointer', display: 'flex' }}
              >
                <X size={14} />
              </button>
            )}
            {!customerId && customerSearch.trim() && (
              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 8px 20px rgba(0,0,0,.35)', overflow: 'hidden' }}>
                {customerResults.length > 0 ? customerResults.map(customer => (
                  <button
                    type="button"
                    key={customer.id}
                    onClick={() => { setCustomerId(customer.id); setCustomerSearch(customer.name); }}
                    style={{ display: 'block', width: '100%', padding: '10px 12px', border: 0, borderBottom: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ display: 'block', fontWeight: 600 }}>{customer.name}</span>
                    {customer.email && <span className="text-sec text-xs">{customer.email}</span>}
                  </button>
                )) : <div className="text-sec text-sm" style={{ padding: '10px 12px' }}>Nenhum cliente encontrado.</div>}
              </div>
            )}
          </div>
        </div>

        <label className="label" htmlFor="venda-avulsa-product" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ShoppingBag size={13} /> Produtos</label>
        <div className="flex gap-8 mb-8">
          <select id="venda-avulsa-product" className="select" style={{ flex: 1 }} value={selProductId} onChange={e => setSelProductId(e.target.value)}>
            <option value="">Selecionar produto...</option>
            {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name}{p.stock != null ? ` (stock: ${p.stock})` : ''} — {formatPrice(p.price || 0)}</option>)}
          </select>
          <input type="number" className="input" style={{ width: 64 }} min="1" value={selQty} onChange={e => setSelQty(e.target.value)} aria-label="Quantidade" />
          <Button size="sm" variant="secondary" onClick={addItem} aria-label="Adicionar produto"><Plus size={14} /></Button>
        </div>

        {items.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
          {items.map(item => <div key={item.productId} className="flex justify-between items-center" style={{ padding: '6px 10px', background: 'var(--elevated)', borderRadius: 8, fontSize: 13 }}>
            <span className="fw-600">{item.name}</span><span className="text-sec" style={{ marginLeft: 8 }}>×{item.qty}</span><span style={{ marginLeft: 'auto', marginRight: 8 }}>{formatPrice(item.subtotal)}</span>
            <button onClick={() => removeItem(item.productId)} aria-label={`Remover ${item.name}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sec)', display: 'flex', padding: 2 }}><X size={13} /></button>
          </div>)}
        </div>}

        <label className="label">Método de pagamento</label>
        <div className="grid-3" style={{ gap: 8, marginBottom: 16 }}>
          {METHODS.map(m => { const Ico = m.icon; return <button key={m.key} className={`ag-side-btn ${method === m.key ? 'active' : ''}`} onClick={() => setMethod(m.key)} style={{ justifyContent: 'center' }}><Ico size={15} /> {m.key}</button>; })}
        </div>

        {items.length > 0 && <div style={{ padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 12 }}><div className="flex justify-between items-center"><span className="fw-600">Total</span><span className="text-gold fw-600" style={{ fontFamily: 'var(--font-head)', fontSize: 22 }}>{formatPrice(total)}</span></div></div>}
        {error && <div className="text-sm mb-12" style={{ color: 'var(--error)' }}>{error}</div>}
        <div className="ag-detail-actions" style={{ justifyContent: 'flex-end' }}><Button variant="secondary" onClick={() => onClose(null)}>Cancelar</Button><Button variant="primary" onClick={submit} disabled={saving}>{saving ? 'A registar...' : 'Registar venda'}</Button></div>
      </div>
    </Modal>
  );
}
