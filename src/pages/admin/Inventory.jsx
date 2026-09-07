import React, { useState, useMemo } from 'react';
import { Package, Plus, Edit, Trash2, ArrowDownCircle, ArrowUpCircle, AlertTriangle } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Badge, Button, EmptyState, Modal } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { formatPrice } from '@/lib/format';

export default function Inventory() {
  const data = useStore();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState(false);
  const [adjModal, setAdjModal] = useState(false);
  const [delId, setDelId] = useState(null);
  const [form, setForm] = useState({ name: '', category: '', unit: 'un', stock: 0, minStock: 5, cost: 0, price: 0, supplier: '' });
  const [editingId, setEditingId] = useState(null);
  const [adj, setAdj] = useState({ id: '', delta: '', reason: 'Entrada de stock' });

  const products = useMemo(() => {
    const q = search.toLowerCase();
    return data.products.filter(p => !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [data.products, search]);

  const lowStock = data.products.filter(p => p.stock <= p.minStock);
  const stockValue = data.products.reduce((sum, p) => sum + p.stock * (p.cost || 0), 0);

  const openNew = () => { setEditingId(null); setForm({ name: '', category: '', unit: 'un', stock: 0, minStock: 5, cost: 0, price: 0, supplier: '' }); setEditModal(true); };
  const openEdit = (p) => { setEditingId(p.id); setForm({ name: p.name, category: p.category, unit: p.unit, stock: p.stock, minStock: p.minStock, cost: p.cost, price: p.price || 0, supplier: p.supplier || '' }); setEditModal(true); };
  const openAdj = (p) => { setAdj({ id: p.id, delta: '', reason: 'Entrada de stock' }); setAdjModal(true); };

  const save = async () => {
    if (!form.name) { toast.error('Nome obrigatório'); return; }
    if (editingId) { await dataService.updateProduct(editingId, { ...form, stock: Number(form.stock), minStock: Number(form.minStock), cost: Number(form.cost), price: Number(form.price) }); toast.success('Produto atualizado'); }
    else { await dataService.createProduct({ ...form, stock: Number(form.stock), minStock: Number(form.minStock), cost: Number(form.cost), price: Number(form.price) }); toast.success('Produto criado'); }
    setEditModal(false);
  };

  const doAdj = async () => {
    if (!adj.delta) { toast.error('Indica a quantidade'); return; }
    await dataService.adjustStock(adj.id, Number(adj.delta), adj.reason);
    toast.success('Stock ajustado');
    setAdjModal(false);
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
            <thead><tr><th>Produto</th><th>Categoria</th><th>Stock</th><th>Mín.</th><th>Custo</th><th>PVP</th><th>Valor stock</th><th>Fornecedor</th><th></th></tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td className="fw-600">{p.name}</td>
                  <td className="text-sec">{p.category}</td>
                  <td>{p.stock} <span className="text-sec text-xs">{p.unit}</span> {p.stock <= p.minStock && <Badge variant="warning">Baixo</Badge>}</td>
                  <td className="text-sec">{p.minStock}</td>
                  <td>{formatPrice(p.cost)}</td>
                  <td className="fw-600">{formatPrice(p.price || 0)}</td>
                  <td className="fw-600">{formatPrice(p.stock * (p.cost || 0))}</td>
                  <td className="text-sec text-xs">{p.supplier || '—'}</td>
                  <td>
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
          <div className="field"><label className="label">Categoria</label><input className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
          <div className="field"><label className="label">Unidade</label><select className="select" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}><option value="un">un</option><option value="cx">cx</option><option value="pct">pct</option><option value="L">L</option><option value="kg">kg</option></select></div>
        </div>
        <div className="grid-2">
          <div className="field"><label className="label">Stock atual</label><input type="number" className="input" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} /></div>
          <div className="field"><label className="label">Stock mínimo</label><input type="number" className="input" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} /></div>
        </div>
        <div className="grid-2">
          <div className="field"><label className="label">Custo (€)</label><input type="number" className="input" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} /></div>
          <div className="field"><label className="label">Preço de venda (€)</label><input type="number" className="input" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
        </div>
        <div className="grid-2">
          <div className="field"><label className="label">Fornecedor</label><input className="input" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} /></div>
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
            <input type="number" className="input" value={adj.delta} onChange={e => setAdj(f => ({ ...f, delta: e.target.value }))} />
          </div>
          <div className="field">
            <label className="label">Motivo</label>
            <select className="select" value={adj.reason} onChange={e => setAdj(f => ({ ...f, reason: e.target.value }))}>
              <option>Entrada de stock</option><option>Venda</option><option>Quebra/Perda</option><option>Uso interno</option><option>Inventário</option>
            </select>
          </div>
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