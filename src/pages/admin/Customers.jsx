import React, { useEffect, useMemo, useState } from 'react';
import { Users, Search, ArrowUpDown, ArrowUp, ArrowDown, Mail, Phone, Plus, Pencil } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import AdminLayout from '@/components/AdminLayout';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Avatar, EmptyState, Badge, Button, Modal } from '@/components/ui';
import { formatPrice, formatDateShortNum } from '@/lib/format';
import CustomerProfileModal from '@/components/admin/CustomerProfileModal';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';

const empty = { name: '', email: '', phone: '', birthDate: '' };

export default function Customers() {
  const data = useStore();
  const toast = useToast();
  const [customerList, setCustomerList] = useState(data.customers);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [filterTag, setFilterTag] = useState('all');
  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [form, setForm] = useState(empty);

  useEffect(() => { setCustomerList(data.customers); }, [data.customers]);

  const openNew = () => { setForm(empty); setEditing('new'); };
  const openEdit = (c) => { setForm({ name: c.name, email: c.email || '', phone: c.phone || '', birthDate: c.birthDate || '' }); setEditing(c.id); };
  const close = () => setEditing(null);

  const save = async () => {
    if (!form.name.trim()) { toast.error('Nome obrigatório'); return; }
    try {
      if (editing === 'new') {
        await dataService.createCustomer({ ...form, name: form.name.trim() });
        toast.success('Cliente criado');
      } else {
        await dataService.updateCustomer(editing, { ...form, name: form.name.trim() });
        toast.success('Cliente atualizado');
      }
      setCustomerList([...(await dataService.listCustomers())]);
      close();
    } catch (err) {
      toast.error('Erro ao guardar: ' + (err.message || err));
    }
  };

  const customers = useMemo(() => {
    const filtered = customerList.filter(c => {
      if (q && !c.name.toLowerCase().includes(q.toLowerCase()) && !(c.email || '').toLowerCase().includes(q.toLowerCase()) && !(c.phone || '').includes(q)) return false;
      if (filterTag === 'loyal') return (c.loyalty?.stamps || 0) > 0;
      if (filterTag === 'vip') return (c.totalSpent || 0) >= 100;
      if (filterTag === 'inactive') return !c.lastVisit || (new Date() - new Date(c.lastVisit)) / (1000 * 60 * 60 * 24) > 60;
      return true;
    });
    return [...filtered].sort((a, b) => {
      const valueA = sortBy === 'name' ? a.name : sortBy === 'lastVisit' ? (a.lastVisit || '') : (a[sortBy] || 0);
      const valueB = sortBy === 'name' ? b.name : sortBy === 'lastVisit' ? (b.lastVisit || '') : (b[sortBy] || 0);
      const comparison = typeof valueA === 'string' ? valueA.localeCompare(valueB) : valueA - valueB;
      return sortDir === 'asc' ? comparison : -comparison;
    });
  }, [customerList, q, sortBy, sortDir, filterTag]);

  const handleSort = (column) => {
    if (sortBy === column) setSortDir(direction => direction === 'asc' ? 'desc' : 'asc');
    else { setSortBy(column); setSortDir('desc'); }
  };
  const SortIcon = ({ field }) => sortBy !== field
    ? <ArrowUpDown size={13} style={{ opacity: 0.35, marginLeft: 4 }} />
    : sortDir === 'asc' ? <ArrowUp size={13} style={{ color: '#C9A227', marginLeft: 4 }} /> : <ArrowDown size={13} style={{ color: '#C9A227', marginLeft: 4 }} />;
  const sortLabel = (column, label) => <button className="table-sort-btn" onClick={() => handleSort(column)}>{label}<SortIcon field={column} /></button>;

  const vipCount = customerList.filter(c => (c.totalSpent || 0) >= 100).length;
  const loyalCount = customerList.filter(c => (c.loyalty?.stamps || 0) > 0).length;
  const inactiveCount = customerList.filter(c => !c.lastVisit || (new Date() - new Date(c.lastVisit)) / (1000 * 60 * 60 * 24) > 60).length;
  const filters = [
    { key: 'all', label: `Todos (${customerList.length})` },
    { key: 'vip', label: `VIP (${vipCount})` },
    { key: 'loyal', label: `Com carimbos (${loyalCount})` },
    { key: 'inactive', label: `Inativos 60d (${inactiveCount})` }
  ];

  return (
    <AdminLayout>
      <div className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h1>Clientes</h1>
          <PageInfo
            description="Base de dados completa de todos os clientes registados: histórico de visitas, total gasto, última visita, pontos de fidelização, notas e informações de contacto. Cada perfil é um registo completo da relação com aquele cliente."
            impact="Conhecer os clientes permite personalizar o serviço, identificar os mais valiosos, recuperar os inativos e aumentar a taxa de retenção — que é sempre mais barata do que angariar clientes novos."
            links={['Marcações', 'Fidelização', 'Financeiro', 'Relatórios', 'Aniversários']}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <p style={{ margin: 0 }}>{customerList.length} clientes registados.</p>
          <Button variant="primary" onClick={openNew}><Plus size={16} /> Novo cliente</Button>
        </div>
      </div>
      <PageInfo page="clientes" />

      <div className="flex gap-12 mb-16" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="flex items-center gap-8" style={{ flex: '1 1 260px', maxWidth: 340 }}>
          <Search size={16} style={{ color: 'var(--text-sec)' }} />
          <input className="input" placeholder="Procurar por nome, email ou telefone…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
          {filters.map(filter => <button key={filter.key} onClick={() => setFilterTag(filter.key)} className={`btn btn-sm ${filterTag === filter.key ? 'btn-primary' : 'btn-ghost'}`}>{filter.label}</button>)}
        </div>
      </div>

      {customers.length === 0 ? (
        <Card className="card-pad">
          <EmptyState icon={() => <Users />} title="Sem clientes" description={q ? 'Nenhum resultado para a pesquisa.' : 'Ainda não há clientes registados.'} action={!q && <Button variant="primary" onClick={openNew}><Plus size={16} /> Novo cliente</Button>} />
        </Card>
      ) : (
        <div style={{ position: 'relative' }}>
          <div style={{ overflowX: 'auto' }}>
            <Card className="card-pad">
              <table className="table">
                <thead><tr><th>{sortLabel('name', 'Cliente')}</th><th>Contacto</th><th>{sortLabel('totalAppointments', 'Visitas')}</th><th>{sortLabel('totalSpent', 'Total gasto')}</th><th>{sortLabel('lastVisit', 'Última visita')}</th><th>Fidelização</th><th></th></tr></thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id} className="table-row-hover" onClick={() => setSelected(c)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div className="flex items-center gap-12">
                          <Avatar name={c.name} />
                          <div><div className="fw-600 text-sm">{c.name} {c.loyalty?.points >= 500 ? <Badge variant="gold">VIP</Badge> : c.loyalty?.points >= 200 ? <Badge variant="warning">Fiel</Badge> : null}</div><div className="text-sec text-xs">Desde {formatDateShortNum(c.joinedAt)}</div></div>
                        </div>
                      </td>
                      <td className="text-sm"><span className="flex items-center gap-4"><Mail size={12} className="text-sec" />{c.email}</span><span className="text-sec text-xs flex items-center gap-4"><Phone size={11} />{c.phone || '—'}</span></td>
                      <td className="text-sm">{c.totalAppointments}</td>
                      <td className="text-sm text-gold fw-600">{formatPrice(c.totalSpent)}</td>
                      <td className="text-sm">{c.lastVisit ? formatDateShortNum(c.lastVisit) : '—'}</td>
                      <td>{(c.loyalty?.stamps || 0) > 0 ? <span className="text-sm">{'★'.repeat(Math.min(c.loyalty.stamps, 5))}<span className="text-sec text-xs"> {c.loyalty.stamps}/10</span></span> : <span className="text-sec text-xs">—</span>}</td>
                      <td onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
                        <Button size="sm" variant="ghost" onClick={e => { e.preventDefault(); e.stopPropagation(); openEdit(c); }}><Pencil size={13} /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
          <div className="customers-scroll-hint" aria-hidden="true" />
        </div>
      )}

      {/* Modal criar / editar cliente */}
      <Modal
        open={!!editing}
        onClose={close}
        title={editing === 'new' ? 'Novo cliente' : 'Editar cliente'}
        footer={<><Button variant="ghost" onClick={close}>Cancelar</Button><Button variant="primary" onClick={save}>Guardar</Button></>}
      >
        <div className="field"><label className="label">Nome *</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" /></div>
        <div className="field"><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" /></div>
        <div className="field"><label className="label">Telefone</label><input className="input" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+351 9XX XXX XXX" /></div>
        <div className="field"><label className="label">Data de nascimento</label><input className="input" type="date" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} /></div>
      </Modal>

      <CustomerProfileModal customer={selected} onClose={() => setSelected(null)} />
    </AdminLayout>
  );
}
