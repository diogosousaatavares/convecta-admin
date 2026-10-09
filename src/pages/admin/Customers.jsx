import React, { useEffect, useMemo, useState } from 'react';
import { Users, Search, Plus } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import AdminLayout from '@/components/AdminLayout';
import { Card, Avatar, EmptyState, Button, Modal } from '@/components/ui';
import CustomerProfileModal from '@/components/admin/CustomerProfileModal';
import { emailTorto, telefoneTorto } from '@/lib/validar';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';

const empty = { name: '', email: '', phone: '', birthDate: '' };

export default function Customers() {
  const data = useStore();
  const toast = useToast();
  const [customerList, setCustomerList] = useState(data.customers);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [form, setForm] = useState(empty);

  useEffect(() => { setCustomerList(data.customers); }, [data.customers]);

  const [aApagar, setAApagar] = useState(null);
  const openNew = () => { setForm(empty); setEditing('new'); };
  const openEdit = (c) => { setForm({ name: c.name, email: c.email || '', phone: c.phone || '', birthDate: c.birthDate || '' }); setEditing(c.id); };
  const close = () => setEditing(null);

  /*
   * Ate 28/09/2026 so o nome era verificado: um email escrito como
   * "naoeemail" e um telefone escrito como "abc" entravam na ficha. Um
   * email torto e uma marcacao que nunca chega ao cliente, e ninguem
   * descobre porque o painel nao da sinal de nada.
   */
  const save = async () => {
    if (!form.name.trim()) { toast.error('Nome obrigatório'); return; }
    if (emailTorto(form.email || '')) { toast.error('Email inválido', 'Falta o @ ou o ponto. Deixa vazio se não souberes.'); return; }
    if (telefoneTorto(form.phone || '')) { toast.error('Telefone inválido', 'Só números, pelo menos nove. Deixa vazio se não souberes.'); return; }
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

  /*
   * A LISTA E UMA LISTA DE CONTACTOS.
   *
   * Era uma tabela de sete colunas — visitas, total gasto, ultima visita,
   * carimbos, VIP — com quatro filtros por cima. Tudo isso existe e esta na
   * ficha de cada um; aqui, no telemovel, a pergunta e so «onde esta o
   * Joao». Nome e telefone, por ordem alfabetica, agrupados pela letra —
   * como a lista de contactos do telemovel, que e a que ele ja sabe usar.
   */
  const customers = useMemo(() => {
    const t = q.trim().toLowerCase();
    const lista = customerList.filter(c => !t
      || c.name.toLowerCase().includes(t)
      || (c.email || '').toLowerCase().includes(t)
      || (c.phone || '').includes(t));
    return [...lista].sort((a, b) => a.name.localeCompare(b.name, 'pt'));
  }, [customerList, q]);

  const grupos = useMemo(() => {
    const g = [];
    for (const c of customers) {
      const letra = (c.name.trim()[0] || '#').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const l = /[A-Z]/.test(letra) ? letra : '#';
      if (!g.length || g[g.length - 1].letra !== l) g.push({ letra: l, itens: [] });
      g[g.length - 1].itens.push(c);
    }
    return g;
  }, [customers]);

  return (
    <AdminLayout>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cli-topo" data-tour="clientes">
        <div className="cli-procura">
          <Search size={17} />
          <input className="cli-input" placeholder="Procurar" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <button type="button" className="cli-novo" onClick={openNew} aria-label="Novo cliente"><Plus size={20} /></button>
      </div>

      {customers.length === 0 ? (
        <Card className="card-pad">
          <EmptyState icon={() => <Users />} title={q ? 'Sem resultados' : 'Sem clientes'}
            action={!q && <Button variant="primary" onClick={openNew}><Plus size={16} /> Novo cliente</Button>} />
        </Card>
      ) : (
        <div className="cli-lista">
          {grupos.map(g => (
            <section key={g.letra}>
              <div className="cli-letra">{g.letra}</div>
              <div className="cli-caixa">
                {g.itens.map(c => (
                  <button type="button" key={c.id} className="cli-linha" onClick={() => setSelected(c)}>
                    <Avatar name={c.name} />
                    <span className="cli-nome">{c.name}</span>
                    <span className="cli-tel">{c.phone || '—'}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
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

      {/* Apagar uma ficha criada por engano. So vai avante se ninguem a usou
          — o dataService verifica e diz porque nao, quando nao da. */}
      <Modal open={!!aApagar} onClose={() => setAApagar(null)} title="Apagar este cliente?"
        footer={<>
          <Button variant="secondary" onClick={() => setAApagar(null)}>Cancelar</Button>
          <Button variant="danger" onClick={async () => {
            try {
              await dataService.deleteCustomer(aApagar.id);
              toast.success('Cliente apagado', aApagar.name);
              setCustomerList([...(await dataService.listCustomers())]);
              setAApagar(null);
            } catch (err) {
              toast.error(err.temHistorico ? 'Não dá para apagar' : 'Erro ao apagar', err.message || String(err));
              if (err.temHistorico) setAApagar(null);
            }
          }}>Apagar</Button>
        </>}>
        <p>A ficha de <strong>{aApagar?.name}</strong> desaparece do painel. Não há volta a dar.</p>
      </Modal>

      <CustomerProfileModal customer={selected} onClose={() => setSelected(null)} onEditar={c => { setSelected(null); openEdit(c); }} />
    </AdminLayout>
  );
}

const CSS = `
.cli-topo { display: flex; gap: 10px; align-items: center; margin-bottom: 18px; }
.cli-procura {
  flex: 1; display: flex; align-items: center; gap: 9px; min-height: 46px;
  padding: 0 14px; border-radius: 12px;
  background: var(--elevated); border: 1px solid var(--border); color: var(--text-sec);
}
.cli-input {
  flex: 1; min-width: 0; border: 0; background: transparent; color: var(--text);
  font: inherit; font-size: 16px; outline: none;
}
.cli-novo {
  width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0; cursor: pointer;
  display: grid; place-items: center; border: 0;
  background: var(--gold); color: #100E0B;
}
.cli-lista { display: flex; flex-direction: column; gap: 16px; max-width: 640px; }
.cli-letra {
  font-size: 12px; font-weight: 700; letter-spacing: .08em; color: var(--text-ter);
  margin: 0 0 6px 14px;
}
.cli-caixa {
  border-radius: 14px; background: var(--elevated); border: 1px solid var(--border);
  overflow: hidden;
}
.cli-linha {
  display: flex; align-items: center; gap: 12px; width: 100%; min-height: 58px;
  padding: 8px 14px; border: 0; border-bottom: 1px solid var(--border);
  background: transparent; cursor: pointer; text-align: left; font: inherit; color: var(--text);
}
.cli-linha:last-child { border-bottom: 0; }
.cli-linha:active { background: rgba(var(--gold-rgb), .10); }
.cli-nome { flex: 1; min-width: 0; font-size: 16px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cli-tel { font-size: 14px; color: var(--text-sec); flex-shrink: 0; font-variant-numeric: tabular-nums; }
`;
