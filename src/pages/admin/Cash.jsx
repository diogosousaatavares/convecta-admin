import React, { useState, useMemo } from 'react';
import { Wallet, Plus, Trash2, Lock, Unlock, Banknote, CreditCard, Smartphone, Receipt, TrendingDown, Gift, Coins, ShoppingBag, Repeat } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Badge, Button, EmptyState, Modal } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { formatPrice, formatDate, todayStr } from '@/lib/format';
import { getExpectedCash, pagamentosDaSessao, vendasDaSessao, packsDaSessao } from '@/lib/domain/finance';
import CheckoutModal from '@/components/admin/CheckoutModal';

const METHODS = ['Dinheiro', 'Cartão', 'MB WAY', 'Transferência', 'Voucher'];
const METHOD_ICO = { 'Dinheiro': Banknote, 'Cartão': CreditCard, 'MB WAY': Smartphone, 'Transferência': Receipt, 'Voucher': Gift };
const EXPENSE_CATS = ['Fornecedores', 'Limpeza', 'Marketing', 'Outros'];

export default function Cash() {
  const data = useStore();
  const toast = useToast();
  const today = todayStr();
  const session = data.cashSessions.find(s => s.status === 'open') || null;
  const [openModal, setOpenModal] = useState(false);
  const [opening, setOpening] = useState('0');
  const [expModal, setExpModal] = useState(false);
  const [exp, setExp] = useState({ description: '', amount: '', category: 'Fornecedores', method: 'Dinheiro' });
  const [closeModal, setCloseModal] = useState(false);
  const [counted, setCounted] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [charge, setCharge] = useState(null);

  /*
   * Por cobrar sao as marcacoes DE HOJE ainda por pagar. Antes era "tudo o
   * que comeca depois de a caixa abrir" — e isso trazia para aqui a agenda
   * da semana inteira. Cobrava-se sem dar por isso um corte de amanha, o
   * dinheiro entrava na caixa de hoje e a receita de hoje continuava a zero.
   */
  const payable = useMemo(() => data.appointments
    .filter(a => a.date === today && a.status === 'confirmed' && !a.payment && !a.blocked)
    .sort((a, b) => a.startTime.localeCompare(b.startTime)), [data.appointments, today]);

  // O que foi COBRADO nesta sessao, pela hora do pagamento — e quando o
  // dinheiro muda de maos, nao a hora a que a marcacao estava marcada.
  const sales = useMemo(() => pagamentosDaSessao(data, session)
    .sort((a, b) => ((a.payment.at || '')).localeCompare(b.payment.at || '')), [data, session]);

  const expenses = useMemo(() => (session ? data.expenses.filter(e => e.sessionId === session.id) : []), [data.expenses, session]);

  // As vendas de produtos desta sessao. Faltavam aqui: vendia-se um champo em
  // dinheiro, o dinheiro entrava na gaveta e a caixa fazia de conta que nao
  // tinha acontecido nada — ao fechar, acusava uma diferenca que nao existia.
  const vendasProdutos = useMemo(() => vendasDaSessao(data, session)
    .sort((a, b) => (a.soldAt || '').localeCompare(b.soldAt || '')), [data, session]);

  // Os packs vendidos nesta sessao. O pack e receita no dia em que e pago;
  // os cortes feitos com ele ficam a 0 € e nao voltam a contar aqui.
  const vendasPacks = useMemo(() => packsDaSessao(data, session)
    .sort((a, b) => (a.soldAt || '').localeCompare(b.soldAt || '')), [data, session]);

  // Sangrias e reforcos — o que e mesmo avulso.
  const movimentos = useMemo(() => {
    if (!session) return [];
    return (data.cashMovements || []).filter(m => (m.createdAt || '') >= session.openedAt);
  }, [data.cashMovements, session]);

  const salesByMethod = useMemo(() => {
    const m = {}; METHODS.forEach(x => m[x] = 0);
    sales.forEach(a => { if (m[a.payment.method] != null) m[a.payment.method] += a.payment.total; });
    vendasProdutos.forEach(v => { if (m[v.method] != null) m[v.method] += v.total; });
    vendasPacks.forEach(v => { if (m[v.method] != null) m[v.method] += v.total; });
    return m;
  }, [sales, vendasProdutos, vendasPacks]);

  const totalServicos = sales.reduce((s, a) => s + a.payment.total, 0);
  const totalProdutos = vendasProdutos.reduce((s, v) => s + Number(v.total || 0), 0);
  const totalPacks = vendasPacks.reduce((s, v) => s + Number(v.total || 0), 0);
  const totalSales = totalServicos + totalProdutos + totalPacks;
  const totalTips = sales.reduce((s, a) => s + (a.payment.tip || 0), 0);
  const totalDiscounts = sales.reduce((s, a) => s + (a.payment.discountAmount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const netRevenue = totalSales - totalExpenses;
  // Uma conta so, a mesma que o painel e os relatorios usam.
  const expectedCash = getExpectedCash(data, session);

  const history = data.cashSessions.filter(s => s.status === 'closed').slice(0, 10);

  const doOpen = async () => {
    await dataService.openCashSession(opening, 'admin');
    toast.success('Caixa aberta', `Fundo inicial ${formatPrice(Number(opening) || 0)}`);
    setOpenModal(false); setOpening('0');
  };

  const addExpense = async () => {
    if (!exp.description || !exp.amount) { toast.error('Dados incompletos', 'Indica descrição e valor.'); return; }
    await dataService.addExpense(session.id, { description: exp.description, amount: Number(exp.amount), category: exp.category, method: exp.method });
    toast.success('Despesa registada', exp.method === 'Dinheiro' ? 'Saiu da caixa.' : 'Não mexe no numerário da caixa.');
    setExpModal(false); setExp({ description: '', amount: '', category: 'Fornecedores', method: 'Dinheiro' });
  };

  const finishCheckout = async (payData) => {
    const a = data.appointments.find(x => x.id === charge);
    if (a && a.status === 'confirmed') await dataService.markAttended(charge);
    await dataService.checkoutAppointment(charge, payData);

    if (payData.products && payData.products.length > 0) {
      for (const item of payData.products) {
        const prod = data.products.find(p => p.id === item.productId);
        if (prod && prod.stock != null) {
          await dataService.updateProduct(item.productId, { stock: Math.max(0, prod.stock - item.qty) });
        }
      }
      if (payData.method === 'Dinheiro' && payData.productsTotal > 0) {
        const custName = data.customers.find(c => c.id === a?.customerId)?.name || '';
        await dataService.addCashMovement({
          type: 'in',
          amount: payData.productsTotal,
          description: `Venda de produtos — ${custName}`,
          method: 'Dinheiro',
          category: 'Venda de produto'
        });
      }
    }

    toast.success('Cobrança concluída', `${formatPrice(payData.total)} · ${payData.method}`);
    setCharge(null);
  };

  const doClose = async () => {
    const diff = (Number(counted) || 0) - expectedCash;
    await dataService.closeCashSession(session.id, counted, closeNotes);
    toast.success('Caixa fechada', diff === 0 ? 'Sem diferença.' : `Diferença ${formatPrice(Math.abs(diff))} ${diff < 0 ? 'a menos' : 'a mais'}`);
    setCloseModal(false); setCounted(''); setCloseNotes('');
  };

  const chargeAppt = charge ? data.appointments.find(a => a.id === charge) : null;

  return (
    <AdminLayout>
      <div className="page-head" data-tour="caixa">
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div><h1>Caixa &amp; Pagamentos</h1><p>{formatDate(today)}</p></div>
          {session && <Badge variant="success">Caixa aberta · {new Date(session.openedAt).toLocaleTimeString('pt-PT').slice(0, 5)}</Badge>}
        </div>
      </div>
      <PageInfo page="caixa" />

      {!session ? (
        <Card className="card-pad">
          <EmptyState icon={() => <Lock />} title="Caixa fechada" description="Abre a caixa para registar vendas, despesas e pagamentos do dia." action={
            <Button variant="primary" onClick={() => setOpenModal(true)}><Unlock size={16} /> Abrir caixa</Button>
          } />
        </Card>
      ) : (
        <>
          <div className="kpi-grid">
            <Card className="kpi"><Wallet className="icon" size={22} /><div className="label">Fundo de abertura</div><div className="value">{formatPrice(session.openingBalance)}</div></Card>
            <Card className="kpi"><Receipt className="icon" size={22} /><div className="label">Vendas (total)</div><div className="value gold">{formatPrice(totalSales)}</div></Card>
            <Card className="kpi"><ShoppingBag className="icon" size={22} /><div className="label">Produtos</div><div className="value gold">{formatPrice(totalProdutos)}</div></Card>
            {(totalPacks > 0 || data.business?.packs?.ativo === true) && (
              <Card className="kpi"><Repeat className="icon" size={22} /><div className="label">Packs</div><div className="value gold">{formatPrice(totalPacks)}</div></Card>
            )}
            <Card className="kpi"><Coins className="icon" size={22} /><div className="label">Gorjetas</div><div className="value gold">{formatPrice(totalTips)}</div></Card>
            <Card className="kpi"><TrendingDown className="icon" size={22} /><div className="label">Descontos</div><div className="value">{formatPrice(totalDiscounts)}</div></Card>
            <Card className="kpi"><TrendingDown className="icon" size={22} /><div className="label">Despesas</div><div className="value">{formatPrice(totalExpenses)}</div></Card>
            <Card className="kpi"><Banknote className="icon" size={22} /><div className="label">Receita líquida</div><div className="value gold">{formatPrice(netRevenue)}</div></Card>
          </div>

          {payable.length > 0 && (
            <Card className="card-pad mt-24">
              <h3 style={{ fontSize: 18, marginBottom: 16 }}>Por cobrar ({payable.length})</h3>
              <div className="flex-col gap-8">
                {payable.map(a => {
                  const svc = data.services.find(s => s.id === a.serviceId);
                  const cust = data.customers.find(c => c.id === a.customerId);
                  const pro = data.professionals.find(p => p.id === a.professionalId);
                  return (
                    <div key={a.id} className="flex items-center gap-12" style={{ padding: '12px 14px', background: 'var(--elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <div className="fw-600 text-gold" style={{ width: 46 }}>{a.startTime}</div>
                      <div className="flex-1"><div className="fw-600 text-sm">{cust?.name}</div><div className="text-sec text-xs">{svc?.name} · {pro?.name}</div></div>
                      <span className="fw-600">{formatPrice(svc?.price || 0)}</span>
                      <Button size="sm" variant="primary" onClick={() => setCharge(a.id)}>Cobrar</Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <div className="dash-grid mt-24">
            <Card className="card-pad">
              <div className="flex justify-between items-center mb-16">
                <h3 style={{ fontSize: 18 }}>Vendas da sessão</h3>
                <div className="flex gap-8">
                  <Button size="sm" variant="secondary" onClick={() => setExpModal(true)}><Plus size={15} /> Despesa</Button>
                  <Button size="sm" variant="danger" onClick={() => setCloseModal(true)}><Lock size={15} /> Fechar caixa</Button>
                </div>
              </div>
              {sales.length === 0 && vendasProdutos.length === 0 && vendasPacks.length === 0 ? (
                <EmptyState icon={() => <Receipt />} title="Sem vendas" description="Cobra as marcações por cobrar acima para registar vendas." />
              ) : sales.length === 0 ? null : (
                <table className="table">
                  <thead><tr><th>Hora</th><th>Cliente</th><th>Serviço</th><th>Total</th><th>Método</th><th>Desc.</th><th>Gorjeta</th></tr></thead>
                  <tbody>
                    {sales.map(a => {
                      const svc = data.services.find(s => s.id === a.serviceId);
                      const cust = data.customers.find(c => c.id === a.customerId);
                      const p = a.payment;
                      return (
                        <tr key={a.id}>
                          <td className="fw-600 text-gold">{p.at ? new Date(p.at).toLocaleTimeString('pt-PT').slice(0, 5) : a.startTime}</td>
                          <td>{cust?.name || '—'}</td>
                          <td>{svc?.name}{a.date !== today ? <span className="text-sec text-xs"> · {formatDate(a.date)}</span> : null}</td>
                          <td className="fw-600">{formatPrice(p.total)}</td>
                          <td><Badge variant="default">{p.method}</Badge></td>
                          <td className="text-sec">{p.discountAmount ? `-${formatPrice(p.discountAmount)}` : '—'}</td>
                          <td className="text-sec">{p.tip ? formatPrice(p.tip) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {vendasProdutos.length > 0 && (
                <>
                  <h4 className="mt-24 mb-16" style={{ fontSize: 15 }}>Vendas de produtos</h4>
                  <table className="table">
                    <thead><tr><th>Hora</th><th>Cliente</th><th>Produtos</th><th>Total</th><th>Método</th></tr></thead>
                    <tbody>
                      {vendasProdutos.map(v => {
                        const cust = v.customerId ? data.customers.find(c => c.id === v.customerId) : null;
                        return (
                          <tr key={v.id}>
                            <td className="fw-600 text-gold">{new Date(v.soldAt).toLocaleTimeString('pt-PT').slice(0, 5)}</td>
                            <td>{cust?.name || '—'}</td>
                            <td className="text-sec text-xs">{(v.items || []).map(i => `${i.name} ×${i.qty}`).join(', ')}</td>
                            <td className="fw-600">{formatPrice(v.total)}</td>
                            <td><Badge variant="default">{v.method || '—'}</Badge></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              )}

              {vendasPacks.length > 0 && (
                <>
                  <h4 className="mt-24 mb-16" style={{ fontSize: 15 }}>Packs vendidos</h4>
                  <table className="table">
                    <thead><tr><th>Hora</th><th>Cliente</th><th>Pack</th><th>Total</th><th>Método</th></tr></thead>
                    <tbody>
                      {vendasPacks.map(v => {
                        const cust = v.customerId ? data.customers.find(c => c.id === v.customerId) : null;
                        return (
                          <tr key={v.id}>
                            <td className="fw-600 text-gold">{new Date(v.soldAt).toLocaleTimeString('pt-PT').slice(0, 5)}</td>
                            <td>{cust?.name || '—'}</td>
                            <td className="text-sm">{v.nome} · {v.cortes} cortes</td>
                            <td className="fw-600">{formatPrice(v.total)}</td>
                            <td><Badge variant="default">{v.method || '—'}</Badge></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              )}

              {expenses.length > 0 && (
                <>
                  <h4 className="mt-24 mb-16" style={{ fontSize: 15 }}>Despesas</h4>
                  <div className="flex-col gap-8">
                    {expenses.map(e => (
                      <div key={e.id} className="flex items-center gap-12" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                        <Badge variant="default">{e.category}</Badge>
                        <div className="flex-1"><div className="fw-600 text-sm">{e.description}</div><div className="text-sec text-xs">{new Date(e.createdAt).toLocaleTimeString('pt-PT').slice(0, 5)} · {e.method || 'Dinheiro'}{(!e.method || e.method === 'Dinheiro') ? '' : ' (não sai da caixa)'}</div></div>
                        <span className="fw-600 text-sm">-{formatPrice(e.amount)}</span>
                        <button className="btn btn-ghost btn-icon" aria-label="Eliminar despesa" title="Eliminar despesa" onClick={() => dataService.deleteExpense(e.id)}><Trash2 size={15} /></button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {movimentos.length > 0 && (
                <>
                  <h4 className="mt-24 mb-16" style={{ fontSize: 15 }}>Entradas e saídas avulsas</h4>
                  <div className="flex-col gap-8">
                    {movimentos.map(m => (
                      <div key={m.id} className="flex items-center gap-12" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                        <Badge variant="default">{m.category || (m.type === 'in' ? 'Entrada' : 'Saída')}</Badge>
                        <div className="flex-1"><div className="fw-600 text-sm">{m.description || m.notes || '—'}</div><div className="text-sec text-xs">{new Date(m.createdAt).toLocaleTimeString('pt-PT').slice(0, 5)}</div></div>
                        <span className="fw-600 text-sm" style={{ color: m.type === 'in' ? 'var(--success)' : 'var(--error)' }}>{m.type === 'in' ? '+' : '-'}{formatPrice(m.amount)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>

            <Card className="card-pad">
              <h3 style={{ fontSize: 18, marginBottom: 16 }}>Totais por método</h3>
              <div className="flex-col gap-12">
                {METHODS.map(m => {
                  const Ico = METHOD_ICO[m];
                  return (
                    <div key={m} className="flex items-center gap-12" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <span className="notif-ico" style={{ width: 34, height: 34 }}><Ico size={16} /></span>
                      <span className="flex-1 text-sm">{m}</span>
                      <span className="fw-600">{formatPrice(salesByMethod[m] || 0)}</span>
                    </div>
                  );
                })}
              </div>
              <hr className="divider" />
              <div className="flex justify-between items-center"><span className="text-sec text-sm">Caixa esperada (numerário)</span><span className="fw-600 text-gold">{formatPrice(expectedCash)}</span></div>
            </Card>
          </div>
        </>
      )}

      {history.length > 0 && (
        <Card className="card-pad mt-24">
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>Histórico de fechos</h3>
          <table className="table">
            <thead><tr><th>Aberta</th><th>Fechada</th><th>Fundo</th><th>Vendas</th><th>Despesas</th><th>Contado</th><th>Diferença</th></tr></thead>
            <tbody>
              {history.map(s => {
                const sSales = pagamentosDaSessao(data, s);
                const sProd = vendasDaSessao(data, s);
                const sTotal = sSales.reduce((sum, a) => sum + a.payment.total, 0) + sProd.reduce((sum, v) => sum + Number(v.total || 0), 0)
                  + packsDaSessao(data, s).reduce((sum, v) => sum + Number(v.total || 0), 0);
                const sExp = data.expenses.filter(e => e.sessionId === s.id).reduce((sum, e) => sum + Number(e.amount || 0), 0);
                const expCash = getExpectedCash(data, s);
                const diff = (s.countedCash || 0) - expCash;
                return (
                  <tr key={s.id}>
                    <td className="text-xs">{new Date(s.openedAt).toLocaleString('pt-PT').slice(0, 16)}</td>
                    <td className="text-xs">{new Date(s.closedAt).toLocaleString('pt-PT').slice(0, 16)}</td>
                    <td>{formatPrice(s.openingBalance)}</td>
                    <td>{formatPrice(sTotal)}</td>
                    <td>{formatPrice(sExp)}</td>
                    <td className="fw-600">{formatPrice(s.countedCash || 0)}</td>
                    <td><Badge variant={diff === 0 ? 'success' : 'warning'}>{diff === 0 ? 'OK' : formatPrice(Math.abs(diff))}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={openModal} onClose={() => setOpenModal(false)} title="Abrir caixa">
        <div className="field"><label className="label">Fundo de abertura (€)</label><input type="number" className="input" value={opening} onChange={e => setOpening(e.target.value)} min="0" step="0.01" /></div>
        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}><Button variant="secondary" onClick={() => setOpenModal(false)}>Cancelar</Button><Button variant="primary" onClick={doOpen}>Abrir caixa</Button></div>
      </Modal>

      <Modal open={expModal} onClose={() => setExpModal(false)} title="Nova despesa">
        <div className="field"><label className="label">Descrição</label><input className="input" value={exp.description} onChange={e => setExp(f => ({ ...f, description: e.target.value }))} /></div>
        <div className="field"><label className="label">Valor (€)</label><input type="number" className="input" value={exp.amount} onChange={e => setExp(f => ({ ...f, amount: e.target.value }))} min="0" step="0.01" /></div>
        <div className="field"><label className="label">Categoria</label><select className="select" value={exp.category} onChange={e => setExp(f => ({ ...f, category: e.target.value }))}>{EXPENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
        <div className="field">
          <label className="label">Como foi paga</label>
          <select className="select" value={exp.method} onChange={e => setExp(f => ({ ...f, method: e.target.value }))}>
            {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <p className="text-sec text-xs" style={{ marginTop: 6 }}>Só o que é pago em dinheiro sai do numerário da caixa.</p>
        </div>
        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}><Button variant="secondary" onClick={() => setExpModal(false)}>Cancelar</Button><Button variant="primary" onClick={addExpense}>Registar</Button></div>
      </Modal>

      <Modal open={closeModal} onClose={() => setCloseModal(false)} title="Fechar caixa">
        <div className="ag-detail">
          <div className="ag-detail-row"><span className="l">Vendas totais</span><span className="v">{formatPrice(totalSales)}</span></div>
          <div className="ag-detail-row"><span className="l">Gorjetas</span><span className="v">{formatPrice(totalTips)}</span></div>
          <div className="ag-detail-row"><span className="l">Descontos</span><span className="v">{formatPrice(totalDiscounts)}</span></div>
          <div className="ag-detail-row"><span className="l">Despesas</span><span className="v">{formatPrice(totalExpenses)}</span></div>
          <div className="ag-detail-row"><span className="l">Receita líquida</span><span className="v text-gold">{formatPrice(netRevenue)}</span></div>
          <div className="ag-detail-row"><span className="l">Numerário esperado</span><span className="v text-gold">{formatPrice(expectedCash)}</span></div>
          <div className="field mt-16"><label className="label">Valor contado em caixa (€)</label><input type="number" className="input" value={counted} onChange={e => setCounted(e.target.value)} min="0" step="0.01" /></div>
          <div className="field"><label className="label">Notas (opcional)</label><textarea className="textarea" rows={2} value={closeNotes} onChange={e => setCloseNotes(e.target.value)} /></div>
          <div className="ag-detail-actions" style={{ justifyContent: 'flex-end' }}><Button variant="secondary" onClick={() => setCloseModal(false)}>Cancelar</Button><Button variant="danger" onClick={doClose}>Fechar caixa</Button></div>
        </div>
      </Modal>

      <CheckoutModal
        open={!!charge}
        onClose={() => setCharge(null)}
        appointment={chargeAppt}
        customer={chargeAppt ? data.customers.find(c => c.id === chargeAppt.customerId) : null}
        service={chargeAppt ? data.services.find(s => s.id === chargeAppt.serviceId) : null}
        professional={chargeAppt ? data.professionals.find(p => p.id === chargeAppt.professionalId) : null}
        onConfirm={finishCheckout}
      />
    </AdminLayout>
  );
}