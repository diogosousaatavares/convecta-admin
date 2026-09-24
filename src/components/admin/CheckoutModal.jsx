import React, { useState, useMemo, useEffect } from 'react';
import { Banknote, CreditCard, Smartphone, Receipt, Gift, Tag, Plus, X } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import { formatPrice } from '@/lib/format';
import { precoDaMarcacao } from '@/lib/domain/appointments';
import dataService from '@/lib/dataService';
import { packsActivosDoCliente, saldoParaServico } from '@/lib/packsService';

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
  const [aGravar, setAGravar] = useState(false);
  // O pack do cliente, quando a marcação foi feita sem ele (ao balcão, por
  // telefone). O teste real cobrou 13,50 € a quem tinha 4 cortes por usar.
  const [packs, setPacks] = useState([]);
  const [aUsarPack, setAUsarPack] = useState(false);
  // Produtos levados junto com o corte (uma cera, um champô). Vão para a
  // mesma conta e ficam registados como venda de produtos, com o stock a
  // descer — o barbeiro não tem de abrir outro ecrã.
  const [produtos, setProdutos] = useState([]);   // [{productId, name, unitPrice, qty}]
  const [prodSel, setProdSel] = useState('');

  // Já pago por MB WAY (confirmado pelo barbeiro): o método vem escolhido e
  // o ecrã avisa para não cobrar outra vez.
  const mbway = appointment ? dataService.mbwayDe?.(appointment.id) : null;

  useEffect(() => {
    if (open) {
      setMethod(mbway?.estado === 'pago' ? 'MB WAY' : 'Dinheiro'); setDiscountType('%'); setDiscountValue(''); setDiscountReason('');
      setTip(''); setVoucherCode(''); setAmountPaid(''); setError(''); setAGravar(false); setPacks([]); setProdutos([]); setProdSel('');
    }
  }, [open, appointment?.id]);

  const packsLigados = data.business?.packs?.ativo === true;
  useEffect(() => {
    if (!open || !packsLigados || !appointment?.customerId || appointment?.usaPack || appointment?.usaRecompensa) return;
    let vivo = true;
    packsActivosDoCliente(appointment.customerId).then(p => { if (vivo) setPacks(p || []); }).catch(() => {});
    return () => { vivo = false; };
  }, [open, packsLigados, appointment?.id, appointment?.customerId, appointment?.usaPack]);
  const saldoPack = appointment && !appointment.usaPack ? saldoParaServico(packs, appointment.serviceId) : 0;
  const packDoCliente = saldoPack > 0 ? packs.find(p => !p.servicos.length || p.servicos.includes(appointment.serviceId)) : null;

  const usarPack = async () => {
    setAUsarPack(true); setError('');
    try { await dataService.usarPackNaMarcacao(appointment.id); setPacks([]); }
    catch (e) { setError(e.message); }
    finally { setAUsarPack(false); }
  };

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
  const totalServico = Math.max(0, base - discountAmount) + tipVal;
  const totalProdutos = produtos.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  // O que o cliente paga: o serviço (com desconto e gorjeta) mais os produtos.
  const total = totalServico + totalProdutos;
  const produtosDisponiveis = (data.products || []).filter(p => p.isActive !== false && (p.stock == null || Number(p.stock) > 0));
  const juntarProduto = () => {
    const p = produtosDisponiveis.find(x => x.id === prodSel); if (!p) return;
    setProdutos(l => {
      const ja = l.find(i => i.productId === p.id);
      if (ja) return l.map(i => i.productId === p.id ? { ...i, qty: p.stock == null ? i.qty + 1 : Math.min(i.qty + 1, Number(p.stock)) } : i);
      return [...l, { productId: p.id, name: p.name, unitPrice: Number(p.price) || 0, qty: 1 }];
    });
    setProdSel('');
  };
  const mudarQtd = (id, d) => setProdutos(l => l.map(i => i.productId === id ? { ...i, qty: i.qty + d } : i).filter(i => i.qty > 0));
  const change = method === 'Dinheiro' ? Math.max(0, (Number(amountPaid) || 0) - total) : 0;

  // Marcação futura, ou dinheiro com a caixa fechada: diz-se já, antes de
  // carregar em «Cobrar» (a mesma regra está na gravação).
  const bloqueio = dataService.porqueNaoSePodeCobrar?.(appointment, method) || null;

  const submit = async () => {
    if (bloqueio) { setError(bloqueio); return; }
    if ((manualDiscount > 0) && !discountReason.trim()) { setError('Indica o motivo do desconto.'); return; }
    if (total < 0) { setError('Valor total inválido.'); return; }
    if (method === 'Dinheiro' && amountPaid && (Number(amountPaid) || 0) < total) { setError('Valor entregue inferior ao total.'); return; }
    setAGravar(true);
    try { await onConfirm({
      method,
      baseAmount: base,
      discountType: manualDiscount > 0 ? discountType : null,
      discountValue: manualDiscount > 0 ? Number(discountValue) : 0,
      discountReason: manualDiscount > 0 ? discountReason.trim() : '',
      discountAmount,
      voucherCode: voucher ? voucher.code : '',
      tip: tipVal,
      total: totalServico,
      amountPaid: method === 'Dinheiro' ? (Number(amountPaid) || total) - totalProdutos : totalServico,
      change,
      // Os produtos vão à parte: viram uma venda de produtos com o mesmo
      // método, o mesmo cliente e o mesmo barbeiro.
      produtos: produtos.map(i => ({ ...i, subtotal: i.unitPrice * i.qty })),
      totalProdutos,
      totalConta: total,
    }); } catch (e) { setError(e?.message || 'Não foi possível cobrar.'); }
    finally { setAGravar(false); }
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
            {appointment?.usaPack && <div className="text-xs fw-600" style={{ color: 'var(--gold)' }}>Pago com o pack</div>}
            {mbway?.estado === 'pago' && <div className="text-xs fw-600" style={{ color: 'var(--success)' }}>Já pago por MB WAY</div>}
          </div>
        </div>
        {mbway?.estado === 'pago' && (
          <div className="text-sm mb-16" style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.35)' }}>
            O cliente já pagou {formatPrice(mbway.valor)} por MB WAY. Não cobres outra vez — só fechas para ficar registado na caixa.
          </div>
        )}
        {mbway?.estado === 'por-confirmar' && (
          <div className="text-sm mb-16" style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)' }}>
            O cliente diz que pagou {formatPrice(mbway.valor)} por MB WAY, mas ainda não confirmaste. Vê o teu MB WAY antes de cobrar.
          </div>
        )}

        {packDoCliente && (
          <div className="mb-16" style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(var(--gold-rgb),0.10)', border: '1px solid rgba(var(--gold-rgb),0.4)' }}>
            <div className="text-sm"><b>{customer?.name || 'Este cliente'} tem um pack que cobre este serviço</b> — {packDoCliente.nome}, {saldoPack} {saldoPack === 1 ? 'corte' : 'cortes'} por usar.</div>
            <Button size="sm" variant="primary" style={{ marginTop: 10 }} onClick={usarPack} disabled={aUsarPack}>
              {aUsarPack ? 'A usar…' : 'Usar o pack (fica a 0 €)'}
            </Button>
          </div>
        )}

        {produtosDisponiveis.length > 0 && (
          <div className="field">
            <label className="label">Levou algum produto?</label>
            <div className="flex gap-8">
              <select className="select" value={prodSel} onChange={e => setProdSel(e.target.value)}>
                <option value="">Juntar produto à conta…</option>
                {produtosDisponiveis.map(p => <option key={p.id} value={p.id}>{p.name} · {formatPrice(Number(p.price) || 0)}</option>)}
              </select>
              <Button size="sm" variant="secondary" onClick={juntarProduto} disabled={!prodSel} aria-label="Juntar produto"><Plus size={14} /></Button>
            </div>
            {produtos.length > 0 && (
              <div className="flex-col gap-8 mt-8">
                {produtos.map(i => (
                  <div key={i.productId} className="flex items-center gap-8 text-sm" style={{ padding: '8px 10px', background: 'var(--elevated)', borderRadius: 8 }}>
                    <span className="flex-1">{i.name}</span>
                    <button className="ag-ico-btn" aria-label="Menos um" onClick={() => mudarQtd(i.productId, -1)} style={{ width: 28, height: 28 }}>−</button>
                    <span className="fw-600" style={{ minWidth: 18, textAlign: 'center' }}>{i.qty}</span>
                    <button className="ag-ico-btn" aria-label="Mais um" onClick={() => mudarQtd(i.productId, +1)} style={{ width: 28, height: 28 }}>+</button>
                    <span className="fw-600" style={{ minWidth: 64, textAlign: 'right' }}>{formatPrice(i.unitPrice * i.qty)}</span>
                    <button className="ag-ico-btn" aria-label="Tirar" onClick={() => setProdutos(l => l.filter(x => x.productId !== i.productId))} style={{ width: 28, height: 28 }}><X size={13} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
          <div className="flex justify-between text-sm"><span className="text-sec">{service?.name || 'Serviço'}</span><span>{formatPrice(base)}</span></div>
          {produtos.map(i => <div key={i.productId} className="flex justify-between text-sm mt-8"><span className="text-sec">{i.qty}× {i.name}</span><span>{formatPrice(i.unitPrice * i.qty)}</span></div>)}
          {discountAmount > 0 && <div className="flex justify-between text-sm mt-8"><span className="text-sec">Desconto</span><span style={{ color: 'var(--success)' }}>-{formatPrice(discountAmount)}</span></div>}
          {tipVal > 0 && <div className="flex justify-between text-sm mt-8"><span className="text-sec">Gorjeta</span><span>+{formatPrice(tipVal)}</span></div>}
          <hr className="divider" style={{ margin: '10px 0' }} />
          <div className="flex justify-between items-center"><span className="fw-600">Total a cobrar</span><span className="text-gold fw-600" style={{ fontFamily: 'var(--font-head)', fontSize: 22 }}>{formatPrice(total)}</span></div>
        </div>

        {(error || bloqueio) && <div className="text-sm mt-16" style={{ color: 'var(--error)' }}>{error || bloqueio}</div>}

        <div className="ag-detail-actions" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={submit} disabled={!!bloqueio || aGravar}>{aGravar ? 'A cobrar…' : 'Cobrar e fechar'}</Button>
        </div>
      </div>
    </Modal>
  );
}