import React, { useState, useMemo, useEffect } from 'react';
import { Banknote, CreditCard, Smartphone, Receipt, Gift, Tag } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatPrice } from '@/lib/format';
import { precoDaMarcacao } from '@/lib/domain/appointments';

const METHODS = [
  { key: 'Dinheiro', icon: Banknote },
  { key: 'Cartão', icon: CreditCard },
  { key: 'MB WAY', icon: Smartphone },
  { key: 'Transferência', icon: Receipt },
  { key: 'Voucher', icon: Gift }
];

export default function CheckoutModal({ open, onClose, appointment, customer, service, professional, onConfirm }) {
  const data = useStore();
  const [method, setMethod] = useState('Dinheiro');
  const [discountType, setDiscountType] = useState('%');
  const [discountValue, setDiscountValue] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [tip, setTip] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setMethod('Dinheiro'); setDiscountType('%'); setDiscountValue(''); setDiscountReason('');
      setTip(''); setVoucherCode(''); setAmountPaid(''); setError('');
    }
  }, [open, appointment?.id]);

  // Era service?.price — o preco de HOJE. Se o servico mudou de preco desde a
  // marcacao, ou se o cliente vem gastar o corte gratis, o ecra mostrava um
  // valor e a caixa gravava outro.
  const base = precoDaMarcacao(appointment, service);
  const cortesGratis = appointment?.usaRecompensa === true;

  const voucher = useMemo(() => {
    if (!voucherCode) return null;
    return data.promotions.find(p => p.active && p.code && p.code.toUpperCase() === voucherCode.toUpperCase().trim()) || null;
  }, [voucherCode, data.promotions]);

  const manualDiscount = useMemo(() => {
    if (!discountValue) return 0;
    return discountType === '%' ? (Number(discountValue) * base / 100) : Number(discountValue);
  }, [discountType, discountValue, base]);

  const voucherDiscount = useMemo(() => {
    if (!voucher) return 0;
    const isPercentage = ['percent', 'percentage', 'discount'].includes(voucher.type);
    const discount = isPercentage ? (Number(voucher.value) / 100) * base : Number(voucher.value);
    return Math.min(Math.max(0, discount), base);
  }, [voucher, base]);

  const discountAmount = Math.min(manualDiscount + voucherDiscount, base);
  const tipVal = Number(tip) || 0;
  const total = Math.max(0, base - discountAmount) + tipVal;
  const change = method === 'Dinheiro' ? Math.max(0, (Number(amountPaid) || 0) - total) : 0;

  const submit = () => {
    if ((manualDiscount > 0) && !discountReason.trim()) { setError('Indica o motivo do desconto.'); return; }
    if (total < 0) { setError('Valor total inválido.'); return; }
    if (method === 'Dinheiro' && amountPaid && (Number(amountPaid) || 0) < total) { setError('Valor entregue inferior ao total.'); return; }
    onConfirm({
      method,
      baseAmount: base,
      discountType: manualDiscount > 0 ? discountType : null,
      discountValue: manualDiscount > 0 ? Number(discountValue) : 0,
      discountReason: manualDiscount > 0 ? discountReason.trim() : '',
      discountAmount,
      voucherCode: voucher ? voucher.code : '',
      tip: tipVal,
      total,
      amountPaid: method === 'Dinheiro' ? (Number(amountPaid) || total) : total,
      change
    });
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Checkout — pagamento">
      <div className="ag-detail">
        <div className="flex justify-between items-center mb-16" style={{ padding: '12px 14px', background: 'var(--elevated)', borderRadius: 10 }}>
          <div>
            <div className="fw-600">{customer?.name || '—'}</div>
            <div className="text-sec text-xs">{service?.name} · {professional?.name}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="text-gold fw-600" style={{ fontFamily: 'var(--font-head)', fontSize: 22 }}>{formatPrice(base)}</div>
            {cortesGratis && <div className="text-xs fw-600" style={{ color: 'var(--gold)' }}>🎁 Corte grátis do cartão</div>}
          </div>
        </div>

        <label className="label">Método de pagamento</label>
        <div className="grid-3" style={{ gap: 8, marginBottom: 16 }}>
          {METHODS.map(m => {
            const Ico = m.icon;
            return (
              <button key={m.key} className={`ag-side-btn ${method === m.key ? 'active' : ''}`} onClick={() => setMethod(m.key)} style={{ justifyContent: 'center' }}>
                <Ico size={15} /> {m.key}
              </button>
            );
          })}
        </div>

        <div className="grid-2" style={{ gap: 12 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Desconto</label>
            <div className="flex gap-8">
              <input type="number" className="input" placeholder="0" value={discountValue} onChange={e => setDiscountValue(e.target.value)} min="0" step="0.01" />
              <div className="ag-viewseg" style={{ height: 44 }}>
                <button className={discountType === '%' ? 'active' : ''} onClick={() => setDiscountType('%')} style={{ padding: '12px 12px' }}>%</button>
                <button className={discountType === '€' ? 'active' : ''} onClick={() => setDiscountType('€')} style={{ padding: '12px 12px' }}>€</button>
              </div>
            </div>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Motivo do desconto {discountValue ? '(obrigatório)' : ''}</label>
            <input className="input" placeholder="Ex: cliente VIP" value={discountReason} onChange={e => setDiscountReason(e.target.value)} />
          </div>
        </div>

        <div className="grid-2 mt-16" style={{ gap: 12 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Voucher / código promo</label>
            <input className="input" placeholder="Ex: COMBO10" value={voucherCode} onChange={e => setVoucherCode(e.target.value)} />
            {voucherCode && (voucher ? <div className="text-xs" style={{ color: 'var(--success)', marginTop: 4 }}><Tag size={11} /> Voucher aplicado: -{formatPrice(voucherDiscount)}</div> : <div className="text-xs" style={{ color: 'var(--error)', marginTop: 4 }}>Código inválido</div>)}
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Gorjeta para o barbeiro (€)</label>
            <input type="number" className="input" placeholder="0" value={tip} onChange={e => setTip(e.target.value)} min="0" step="0.01" />
          </div>
        </div>

        {method === 'Dinheiro' && (
          <div className="field mt-16">
            <label className="label">Valor entregue (€)</label>
            <input type="number" className="input" placeholder={total.toFixed(2)} value={amountPaid} onChange={e => setAmountPaid(e.target.value)} min="0" step="0.01" />
            {amountPaid && (Number(amountPaid) || 0) >= total && (
              <div className="text-sm mt-8" style={{ color: 'var(--gold)' }}>Troco: <span className="fw-600">{formatPrice(change)}</span></div>
            )}
          </div>
        )}

        <div style={{ padding: '14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, marginTop: 16 }}>
          <div className="flex justify-between text-sm"><span className="text-sec">Subtotal</span><span>{formatPrice(base)}</span></div>
          {discountAmount > 0 && <div className="flex justify-between text-sm mt-8"><span className="text-sec">Desconto</span><span style={{ color: 'var(--success)' }}>-{formatPrice(discountAmount)}</span></div>}
          {tipVal > 0 && <div className="flex justify-between text-sm mt-8"><span className="text-sec">Gorjeta</span><span>+{formatPrice(tipVal)}</span></div>}
          <hr className="divider" style={{ margin: '10px 0' }} />
          <div className="flex justify-between items-center"><span className="fw-600">Total a cobrar</span><span className="text-gold fw-600" style={{ fontFamily: 'var(--font-head)', fontSize: 22 }}>{formatPrice(total)}</span></div>
        </div>

        {error && <div className="text-sm mt-16" style={{ color: 'var(--error)' }}>{error}</div>}

        <div className="ag-detail-actions" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={submit}>Cobrar e fechar</Button>
        </div>
      </div>
    </Modal>
  );
}