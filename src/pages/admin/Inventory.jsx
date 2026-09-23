import React, { useState, useMemo } from 'react';
import { Package, Plus, Edit, Trash2, ArrowDownCircle, ArrowUpCircle, AlertTriangle } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Badge, Button, EmptyState, Modal } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { formatPrice } from '@/lib/format';
import { estadoStock, produtosStockBaixo, produtosEsgotados } from '@/lib/domain/stock';

const MOTIVOS_ENTRADA = ['Compra ao fornecedor', 'Devolução', 'Inventário (acerto)'];
const MOTIVOS_SAIDA = ['Quebra/Perda', 'Uso interno', 'Inventário (acerto)'];

export default function Inventory() {
  const data = useStore();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState(false);
  const [adjModal, setAdjModal] = useState(false);
  const [delId, setDelId] = useState(null);
  const [form, setForm] = useState({ name: '', category: '', unit: 'un', stock: 0, minStock: 5, cost: 0, price: 0, supplier: '', supplierId: '' });
  const fornecedores = data.suppliers || [];
  const [editingId, setEditingId] = useState(null);
  const [novaCategoria, setNovaCategoria] = useState(false);
  const categoriasProduto = data.business?.productCategories || [];
  const [adj, setAdj] = useState({ id: '', delta: '', reason: MOTIVOS_ENTRADA[0], custo: '', comoDespesa: true, method: 'Transferência' });

  const products = useMemo(() => {
    const q = search.toLowerCase();
    return data.products.filter(p => !q || p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q));
  }, [data.products, search]);

  const lowStock = produtosStockBaixo(data.products);
  const esgotados = produtosEsgotados(data.products);
  const stockValue = data.products.reduce((sum, p) => sum + p.stock * (p.cost || 0), 0);

  const openNew = () => { setEditingId(null); setNovaCategoria(false); setForm({ name: '', category: categoriasProduto[0] || '', unit: 'un', stock: 0, minStock: 5, cost: 0, price: 0, supplier: '', supplierId: '' }); setEditModal(true); };
  const openEdit = (p) => { setEditingId(p.id); setNovaCategoria(false); setForm({ name: p.name, category: p.category, unit: p.unit, stock: p.stock, minStock: p.minStock, cost: p.cost, price: p.price || 0, supplier: p.supplier || '', supplierId: p.supplierId || (fornecedores.find(f => f.name === p.supplier)?.id || '') }); setEditModal(true); };
  const openAdj = (p) => { setAdj({ id: p.id, delta: '', reason: MOTIVOS_ENTRADA[0], custo: '', comoDespesa: true, method: 'Transferência' }); setAdjModal(true); };

  const save = async () => {
    if (!form.name) { toast.error('Nome obrigatório'); return; }
    // Uma categoria nova escrita aqui passa a estar na lista da barbearia,
    // para o proximo produto a poder escolher em vez de a reescrever.
    const cat = (form.category || '').trim();
    if (cat && !categoriasProduto.some(c => c.toLowerCase() === cat.toLowerCase())) {
      try { await dataService.updateBusiness({ productCategories: [...categoriasProduto, cat] }); } catch { /* o produto grava na mesma */ }
    }
    const forn = fornecedores.find(f => f.id === form.supplierId);
    const dados = { ...form, supplierId: forn?.id || null, supplier: forn?.name || '', stock: Number(form.stock), minStock: Number(form.minStock), cost: Number(form.cost), price: Number(form.price) };
    try {
      if (editingId) { await dataService.updateProduct(editingId, dados); toast.success('Produto atualizado'); }
      else { await dataService.createProduct(dados); toast.success('Produto criado'); }
      setEditModal(false);
    } catch (e) { toast.error('Não foi possível gravar', e.message); }
  };

  const doAdj = async () => {
    if (!adj.delta) { toast.error('Indica a quantidade'); return; }
    const entrada = Number(adj.delta) > 0;
    const custo = entrada && adj.comoDespesa ? Number(adj.custo) || 0 : 0;
    if (entrada && adj.comoDespesa && !(custo > 0)) { toast.error('Falta o custo', 'Escreve quanto pagaste, ou desliga «Registar a compra como despesa».'); return; }
    const motivos = entrada ? MOTIVOS_ENTRADA : MOTIVOS_SAIDA;
    const motivo = motivos.includes(adj.reason) ? adj.reason : motivos[0];
    try {
      await dataService.adjustStock(adj.id, Number(adj.delta), motivo, { custo, method: adj.method });
      toast.success('Stock ajustado', custo > 0 ? `Registado ${formatPrice(custo)} em despesas.` : undefined);
      setAdjModal(false);
    } catch (e) {
      toast.error('Não foi possível ajustar', e.message);
    }
  };

  const remove = async () => { await dataService.deleteProduct(delId); toast.info('Produto removido'); setDelId(null); };

  return (
    <AdminLayout>
      <div className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h1>Inventário</h1>
          <PageInfo
            description="Catálogo de todos os produtos à venda ou para uso interno: champôs, ceras, pomadas, consumíveis. Cada produto tem preço de venda, custo e quantidade em stock."
            impact="Vender produtos durante o serviço aumenta o ticket médio por visita sem ocupar mais agenda. Um produto sem stock é uma venda perdida. Gerir o inventário corretamente protege a margem do negócio."
            links={['Stock', 'Movimentos', 'Fornecedores', 'Comandas']}
          />
        </div>
        <p>Gestão de produtos e consumíveis</p>
      </div>
      <PageInfo page="produtos" />

      <div className="kpi-grid">
        <Card className="kpi"><Package className="icon" size={22} /><div className="label">Produtos</div><div className="value">{data.products.length}</div></Card>
        <Card className="kpi"><AlertTriangle className="icon" size={22} /><div className="label">Stock baixo</div><div className="value" style={{ color: lowStock.length ? 'var(--warning)' : 'inherit' }}>{lowStock.length}</div></Card>
        <Card className="kpi"><AlertTriangle className="icon" size={22} /><div className="label">Esgotados</div><div className="value" style={{ color: esgotados.length ? 'var(--error)' : 'inherit' }}>{esgotados.length}</div></Card>
        <Card className="kpi"><Package className="icon" size={22} /><div className="label">Valor de stock</div><div className="value gold">{formatPrice(stockValue)}</div></Card>
      </div>

      <Card className="card-pad">
        <div className="flex justify-between items-center mb-16" style={{ flexWrap: 'wrap', gap: 12 }}>
          <input className="input" style={{ maxWidth: 280 }} placeholder="Pesquisar produto…" value={search} onChange={e => setSearch(e.target.value)} />
          <Button variant="primary" onClick={openNew}><Plus size={16} /> Novo produto</Button>
        </div>

        {products.length === 0 ? (
          <EmptyState icon={() => <Package />} title="Sem produtos" description="Adiciona produtos para controlar stock e consumíveis." />
        ) : (
          <table className="table">
            <thead><tr><th>Produto</th><th>Categoria</th><th>Stock</th><th>Mín.</th><th>Custo</th><th>PVP</th><th>Valor stock</th><th>Fornecedor</th><th className="col-acoes"></th></tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td className="fw-600">{p.name}</td>
                  <td className="text-sec">{p.category}</td>
                  <td>{p.stock} <span className="text-sec text-xs">{p.unit}</span> {estadoStock(p) === 'esgotado' ? <Badge variant="danger">Esgotado</Badge> : estadoStock(p) === 'baixo' ? <Badge variant="warning">Baixo</Badge> : null}</td>
                  <td className="text-sec">{p.minStock}</td>
                  <td>{formatPrice(p.cost)}</td>
                  <td className="fw-600">{formatPrice(p.price || 0)}</td>
                  <td className="fw-600">{formatPrice(p.stock * (p.cost || 0))}</td>
                  <td className="text-sec text-xs">{p.supplier || '—'}</td>
                  <td className="col-acoes">
                    <div className="flex gap-8">
                      <button className="btn btn-ghost btn-icon" aria-label="Ajustar stock" onClick={() => openAdj(p)} title="Ajustar stock"><ArrowUpCircle size={16} /></button>
                      <button className="btn btn-ghost btn-icon" aria-label="Editar produto" onClick={() => openEdit(p)} title="Editar produto"><Edit size={16} /></button>
                      <button className="btn btn-ghost btn-icon" aria-label="Eliminar produto" onClick={() => setDelId(p.id)} title="Eliminar produto"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={editModal} onClose={() => setEditModal(false)} title={editingId ? 'Editar produto' : 'Novo produto'}>
        <div className="field"><label className="label">Nome</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
        <div className="grid-2">
          <div className="field">
            <label className="label">Categoria</label>
            {/* As categorias dos produtos ficam no settings da barbearia, como as
                dos servicos. Escreve-se uma nova aqui e ela passa a estar na lista
                — nao ha uma pagina so para isso. */}
            <div className="flex gap-8">
              <select className="select" style={{ flex: 1 }} value={categoriasProduto.includes(form.category) ? form.category : (form.category ? '__nova' : '')}
                onChange={e => { const v = e.target.value; if (v === '__nova') { setForm(f => ({ ...f, category: '' })); setNovaCategoria(true); } else { setNovaCategoria(false); setForm(f => ({ ...f, category: v })); } }}>
                <option value="">Sem categoria</option>
                {categoriasProduto.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="__nova">+ Nova categoria…</option>
              </select>
            </div>
            {(novaCategoria || (form.category && !categoriasProduto.includes(form.category))) && (
              <input className="input" style={{ marginTop: 8 }} autoFocus placeholder="Nome da categoria nova"
                value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
            )}
          </div>
          <div className="field"><label className="label">Unidade</label><select className="select" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}><option value="un">un</option><option value="cx">cx</option><option value="pct">pct</option><option value="L">L</option><option value="kg">kg</option></select></div>
        </div>
        <div className="grid-2">
          <div className="field"><label className="label">Stock atual</label><input type="number" min="0" step="1" className="input" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} /></div>
          <div className="field"><label className="label">Stock mínimo</label><input type="number" min="0" step="1" className="input" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} /></div>
        </div>
        <div className="grid-2">
          <div className="field"><label className="label">Custo (€)</label><input type="number" min="0" step="0.01" className="input" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} /></div>
          <div className="field"><label className="label">Preço de venda (€)</label><input type="number" className="input" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label className="label">Fornecedor</label>
            {/* Escolhido da lista de Fornecedores — era texto livre, e a
                contagem de produtos por fornecedor falhava com uma letra
                diferente. */}
            <select className="select" value={form.supplierId || ''} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}>
              <option value="">Sem fornecedor</option>
              {fornecedores.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            {!fornecedores.length && <p className="text-sec text-xs" style={{ marginTop: 6 }}>Cria os fornecedores em Produtos › Fornecedores.</p>}
            {form.supplier && !form.supplierId && <p className="text-sec text-xs" style={{ marginTop: 6 }}>Antes estava escrito «{form.supplier}». Escolhe-o da lista.</p>}
          </div>
        </div>
        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setEditModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={save}>{editingId ? 'Guardar' : 'Criar'}</Button>
        </div>
      </Modal>

      <Modal open={adjModal} onClose={() => setAdjModal(false)} title="Ajustar stock">
        <div className="ag-detail">
          <div className="ag-detail-row"><span className="l">Produto</span><span className="v">{data.products.find(p => p.id === adj.id)?.name}</span></div>
          <div className="ag-detail-row"><span className="l">Stock atual</span><span className="v">{data.products.find(p => p.id === adj.id)?.stock}</span></div>
          <div className="field mt-16">
            <label className="label">Quantidade (+ para entrada, - para saída)</label>
            <input type="number" step="1" className="input" value={adj.delta}
              onChange={e => {
                const v = e.target.value; const n = Number(v);
                const p = data.products.find(x => x.id === adj.id);
                setAdj(f => {
                  const motivos = n < 0 ? MOTIVOS_SAIDA : MOTIVOS_ENTRADA;
                  const sug = n > 0 ? (Number(p?.cost) || 0) * n : 0;
                  return { ...f, delta: v, reason: motivos.includes(f.reason) ? f.reason : motivos[0], custo: n > 0 && sug > 0 ? sug.toFixed(2) : f.custo };
                });
              }} />
            {Number(adj.delta) < 0 && Math.abs(Number(adj.delta)) > (data.products.find(p => p.id === adj.id)?.stock || 0) && (
              <p className="text-xs" style={{ color: 'var(--error)', marginTop: 6 }}>Não podes tirar mais do que há em stock.</p>
            )}
            <p className="text-sec text-xs" style={{ marginTop: 6 }}>As vendas não se registam aqui: usa «Venda de produto», que também põe o dinheiro na caixa.</p>
          </div>
          <div className="field">
            <label className="label">Motivo</label>
            <select className="select" value={adj.reason} onChange={e => setAdj(f => ({ ...f, reason: e.target.value }))}>
              {(Number(adj.delta) < 0 ? MOTIVOS_SAIDA : MOTIVOS_ENTRADA).map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          {/* Uma entrada de stock e uma compra: o dinheiro sai. Registada aqui
              como despesa, aparece nas contas do mes em vez de desaparecer. */}
          {Number(adj.delta) > 0 && (
            <div className="field">
              <label className="flex items-center gap-8 text-sm" style={{ marginBottom: 8 }}>
                <input type="checkbox" checked={adj.comoDespesa} onChange={e => setAdj(f => ({ ...f, comoDespesa: e.target.checked }))} />
                Registar a compra como despesa
              </label>
              {adj.comoDespesa && (
                <div className="grid-2">
                  <input type="number" step="0.01" min="0" className="input" placeholder="Custo total (€)"
                    value={adj.custo} onChange={e => setAdj(f => ({ ...f, custo: e.target.value }))} />
                  <select className="select" value={adj.method} onChange={e => setAdj(f => ({ ...f, method: e.target.value }))} aria-label="Como foi paga">
                    <option>Transferência</option><option>Cartão</option><option>Dinheiro</option><option>MB WAY</option><option>Débito direto</option>
                  </select>
                </div>
              )}
            </div>
          )}
          <div className="ag-detail-actions" style={{ justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setAdjModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={doAdj}>Aplicar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="Eliminar produto">
        <p className="text-sec">Confirma a eliminação deste produto? Esta ação não pode ser desfeita.</p>
        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setDelId(null)}>Cancelar</Button>
          <Button variant="danger" onClick={remove}>Eliminar</Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}