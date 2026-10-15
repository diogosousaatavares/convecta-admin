import React, { useState, useMemo } from 'react';
import { Package, Plus, Trash2, ArrowUpCircle, AlertTriangle, ChevronRight, ImagePlus, X } from 'lucide-react';
import { uploadBusinessAsset } from '@/lib/designService';
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
const FORM_VAZIO = { name: '', category: '', unit: 'un', stock: 0, minStock: 5, cost: 0, price: 0, supplier: '', supplierId: '', vendaOnline: false, fotoUrl: '' };

/*
 * A LISTA E A FICHA DO PRODUTO (15/10/2026).
 *
 * Como na Fresha: uma linha por produto — foto, nome, quanto ha em stock,
 * preco — e tocar abre a ficha. A ficha esta em quatro blocos (fotografia,
 * informacoes basicas, precos, stock) e os botoes de ajustar stock e de
 * eliminar vivem la dentro, em vez de tres icones por linha na tabela.
 * A foto fica no metadata, como a do servico, e o site ja a le.
 */
function FotoDoProduto({ valor, onMudar }) {
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState('');
  const escolher = async (e) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    setAEnviar(true); setErro('');
    try { onMudar(await uploadBusinessAsset(null, f, `produto-${Date.now()}`)); }
    catch (err) { setErro(err.message || 'Não foi possível enviar a foto.'); }
    finally { setAEnviar(false); }
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <label style={{ width: 84, height: 84, borderRadius: 14, border: '1px dashed var(--border)', background: valor ? `center/cover no-repeat url('${valor}')` : 'var(--elevated)', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0, color: 'var(--text-sec)' }}>
        {!valor && (aEnviar ? '…' : <ImagePlus size={22} />)}
        <input type="file" accept="image/*" onChange={escolher} style={{ display: 'none' }} />
      </label>
      {valor && <Button variant="ghost" size="sm" onClick={() => onMudar('')}><X size={14} /> Tirar</Button>}
      {aEnviar && valor && <span className="text-sec text-sm">A enviar…</span>}
      {erro && <span className="text-sm" style={{ color: 'var(--error)' }}>{erro}</span>}
    </div>
  );
}

export default function Inventory() {
  const data = useStore();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState(false);
  const [adjModal, setAdjModal] = useState(false);
  const [delId, setDelId] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
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

  const openNew = () => { setEditingId(null); setNovaCategoria(false); setForm({ ...FORM_VAZIO, category: categoriasProduto[0] || '' }); setEditModal(true); };
  const openEdit = (p) => { setEditingId(p.id); setNovaCategoria(false); setForm({ name: p.name, category: p.category, unit: p.unit, stock: p.stock, minStock: p.minStock, cost: p.cost, price: p.price || 0, supplier: p.supplier || '', supplierId: p.supplierId || (fornecedores.find(f => f.name === p.supplier)?.id || ''), vendaOnline: !!p.vendaOnline, fotoUrl: p.fotoUrl || '' }); setEditModal(true); };
  const openAdj = (p) => { setAdj({ id: p.id, delta: '', reason: MOTIVOS_ENTRADA[0], custo: '', comoDespesa: true, method: 'Transferência' }); setAdjModal(true); };

  const [avisoPreco, setAvisoPreco] = useState(false);
  const save = async () => {
    if (!form.name) { toast.error('Nome obrigatório'); return; }
    // Uma categoria nova escrita aqui passa a estar na lista da barbearia,
    // para o proximo produto a poder escolher em vez de a reescrever.
    const cat = (form.category || '').trim();
    if (cat && !categoriasProduto.some(c => c.toLowerCase() === cat.toLowerCase())) {
      try { await dataService.updateBusiness({ productCategories: [...categoriasProduto, cat] }); } catch { /* o produto grava na mesma */ }
    }
    // Vender abaixo do que custou e quase sempre um engano de quem trocou
    // os dois campos. Avisa-se dentro da janela, e o segundo toque grava.
    if (Number(form.price) > 0 && Number(form.cost) > 0 && Number(form.price) < Number(form.cost) && !avisoPreco) {
      setAvisoPreco(true); return;
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

  const remove = async () => {
    const r = await dataService.deleteProduct(delId);
    if (r === 'inativado') toast.success('Produto desativado', 'Já teve movimentos, por isso a ficha fica guardada para o histórico. Deixa de aparecer nas vendas.');
    else toast.info('Produto removido');
    setDelId(null);
  };

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

      <div className="kpi-grid so-pc">
        <Card className="kpi"><Package className="icon" size={22} /><div className="label">Produtos</div><div className="value">{data.products.length}</div></Card>
        <Card className="kpi"><AlertTriangle className="icon" size={22} /><div className="label">Stock baixo</div><div className="value" style={{ color: lowStock.length ? 'var(--warning)' : 'inherit' }}>{lowStock.length}</div></Card>
        <Card className="kpi"><AlertTriangle className="icon" size={22} /><div className="label">Esgotados</div><div className="value" style={{ color: esgotados.length ? 'var(--error)' : 'inherit' }}>{esgotados.length}</div></Card>
        <Card className="kpi"><Package className="icon" size={22} /><div className="label">Valor de stock</div><div className="value gold">{formatPrice(stockValue)}</div></Card>
      </div>

      <div className="prod-topo">
        <input className="input" placeholder="Pesquisar produto…" value={search} onChange={e => setSearch(e.target.value)} />
        <Button variant="primary" onClick={openNew}><Plus size={16} /> Adicionar</Button>
      </div>

      {products.length === 0 ? (
        <Card className="card-pad"><EmptyState icon={() => <Package />} title="Sem produtos" /></Card>
      ) : (
        <div className="prod-lista">
          {products.map(p => {
            const est = estadoStock(p);
            return (
              <button key={p.id} type="button" className="prod-row" onClick={() => openEdit(p)}>
                <span className="prod-foto" style={p.fotoUrl ? { backgroundImage: `url('${p.fotoUrl}')` } : undefined}>{!p.fotoUrl && <Package size={22} />}</span>
                <span className="prod-nome">
                  <b>{p.name}</b>
                  <span className={est === 'esgotado' ? 'esgotado' : est === 'baixo' ? 'baixo' : ''}>
                    {est === 'esgotado' ? 'Esgotado' : `${p.stock} em stock`}{p.vendaOnline ? ' · Na app' : ''}
                  </span>
                </span>
                <span className="prod-preco">{formatPrice(p.price || 0)}</span>
                <ChevronRight size={18} className="seta" />
              </button>
            );
          })}
        </div>
      )}

      <Modal open={editModal} onClose={() => setEditModal(false)} title={editingId ? 'Editar produto' : 'Novo produto'}>
        <div className="prod-sec">Fotografia</div>
        <FotoDoProduto valor={form.fotoUrl || ''} onMudar={url => setForm(f => ({ ...f, fotoUrl: url }))} />

        <div className="prod-sec">Informações básicas</div>
        <div className="field"><label className="label">Nome</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
        <div className="grid-2">
          <div className="field">
            <label className="label">Categoria</label>
            {/* As categorias dos produtos ficam no settings da barbearia, como as
                dos servicos. Escreve-se uma nova aqui e ela passa a estar na lista
                — nao ha uma pagina so para isso. */}
            <select className="select" value={categoriasProduto.includes(form.category) ? form.category : (form.category ? '__nova' : '')}
              onChange={e => { const v = e.target.value; if (v === '__nova') { setForm(f => ({ ...f, category: '' })); setNovaCategoria(true); } else { setNovaCategoria(false); setForm(f => ({ ...f, category: v })); } }}>
              <option value="">Sem categoria</option>
              {categoriasProduto.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="__nova">+ Nova categoria…</option>
            </select>
            {(novaCategoria || (form.category && !categoriasProduto.includes(form.category))) && (
              <input className="input" style={{ marginTop: 8 }} autoFocus placeholder="Nome da categoria nova"
                value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
            )}
          </div>
          <div className="field"><label className="label">Unidade</label><select className="select" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}><option value="un">un</option><option value="cx">cx</option><option value="pct">pct</option><option value="L">L</option><option value="kg">kg</option></select></div>
        </div>
        <div className="field">
          <label className="label">Fornecedor</label>
          {/* Escolhido da lista de Fornecedores — era texto livre, e a
              contagem de produtos por fornecedor falhava com uma letra
              diferente. */}
          <select className="select" value={form.supplierId || ''} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}>
            <option value="">Sem fornecedor</option>
            {fornecedores.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          {form.supplier && !form.supplierId && <p className="text-sec text-xs" style={{ marginTop: 6 }}>Antes estava escrito «{form.supplier}». Escolhe-o da lista.</p>}
        </div>

        <div className="prod-sec">Preços</div>
        <div className="grid-2">
          <div className="field"><label className="label">Custo (€)</label><input type="number" min="0" step="0.01" className="input" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} /></div>
          <div className="field"><label className="label">Preço de venda (€)</label><input type="number" className="input" min="0" step="0.01" value={form.price} onChange={e => { setForm(f => ({ ...f, price: e.target.value })); setAvisoPreco(false); }} /></div>
        </div>
        {/* Vender na app (10/10/2026): o cliente vê-o ao marcar, em «Queres
            juntar?», e leva-o na hora. Esgotado deixa de aparecer sozinho. */}
        <div className="field">
          <div className="tipo-opcoes duas" role="radiogroup" aria-label="Onde se vende">
            {[
              { v: false, t: 'Só na loja', d: 'Vendes ao balcão' },
              { v: true, t: 'Vender na app', d: 'Juntam à marcação' },
            ].map(o => (
              <button key={String(o.v)} type="button" role="radio" aria-checked={!!form.vendaOnline === o.v}
                className={`tipo-opcao ${!!form.vendaOnline === o.v ? 'on' : ''}`}
                onClick={() => setForm(f => ({ ...f, vendaOnline: o.v }))}>
                <span className="tipo-opcao-t">{o.t}</span>
                <span className="tipo-opcao-d">{o.d}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="prod-sec">Stock</div>
        <div className="grid-2">
          <div className="field"><label className="label">Em stock</label><input type="number" min="0" step="1" className="input" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} /></div>
          <div className="field"><label className="label">Avisar abaixo de</label><input type="number" min="0" step="1" className="input" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} /></div>
        </div>
        {avisoPreco && (
          <div className="text-sm" style={{ color: 'var(--error)', margin: '0 0 12px' }}>
            O preço de venda ({Number(form.price || 0).toFixed(2)} €) é menor do que o custo ({Number(form.cost || 0).toFixed(2)} €). Cada venda dá prejuízo.
          </div>
        )}
        <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setEditModal(false)}>Cancelar</Button>
          <Button variant={avisoPreco ? 'danger' : 'primary'} onClick={save}>
            {avisoPreco ? 'Gravar assim mesmo' : (editingId ? 'Guardar' : 'Criar')}
          </Button>
        </div>
        {editingId && (
          <div className="prod-ficha-acoes">
            <Button variant="ghost" onClick={() => { const p = data.products.find(x => x.id === editingId); setEditModal(false); if (p) openAdj(p); }}><ArrowUpCircle size={16} /> Ajustar stock</Button>
            <Button variant="ghost" style={{ color: 'var(--error)' }} onClick={() => { setEditModal(false); setDelId(editingId); }}><Trash2 size={16} /> Eliminar</Button>
          </div>
        )}
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