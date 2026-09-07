import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Tag } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { Card, Button, EmptyState } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';

const TABS = [
  { key: 'categorias', label: 'Categorias', desc: 'Categorias de serviços' },
  { key: 'pagamento', label: 'Pagamento', desc: 'Métodos de pagamento' },
  { key: 'despesas', label: 'Despesas', desc: 'Categorias de despesa' },
  { key: 'receitas', label: 'Receitas', desc: 'Categorias de receita' },
  { key: 'contas', label: 'Contas', desc: 'Contas bancárias' },
  { key: 'equipamentos', label: 'Equipamentos', desc: 'Equipamentos da barbearia' },
  { key: 'fornecedores', label: 'Fornecedores', desc: 'Fornecedores' },
  { key: 'bandeiras', label: 'Bandeiras', desc: 'Bandeiras de cartão' },
  { key: 'remuneracoes', label: 'Remunerações', desc: 'Tipos de remuneração' },
  { key: 'deducoes', label: 'Deduções', desc: 'Tipos de dedução' }
];

export default function Tipos() {
  const data = useStore();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const tab = useMemo(() => new URLSearchParams(location.search).get('tab') || 'categorias', [location.search]);
  const [newName, setNewName] = useState('');

  const items = (data.typologies && data.typologies[tab]) || [];
  const current = TABS.find(t => t.key === tab);

  const add = async () => {
    if (!newName.trim()) { toast.error('Vazio', 'Indica um nome.'); return; }
    await dataService.addTypology(tab, newName.trim());
    setNewName('');
    toast.success('Adicionado', `${current?.label}`);
  };
  const remove = async (id) => { await dataService.removeTypology(tab, id); toast.info('Removido'); };

  return (
    <AdminLayout>
      <div className="page-head">
        <h1>Tipos — Definições</h1>
        <p>Gestão de tipologias utilizadas em todo o painel.</p>
      </div>

      <div className="bp-tabs" style={{ marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.key} className={`bp-tab ${tab === t.key ? 'active' : ''}`} onClick={() => navigate(`/admin/tipos?tab=${t.key}`)}>{t.label}</button>
        ))}
      </div>

      <Card className="card-pad">
        <div className="mb-16">
          <h3 style={{ fontSize: 18 }}>{current?.label}</h3>
          <p className="text-sec text-sm">{current?.desc}</p>
        </div>
        <div className="flex gap-8 mb-24">
          <input className="input" placeholder={`Novo registo em ${current?.label}...`} value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
          <Button variant="primary" onClick={add}><Plus size={15} /> Adicionar</Button>
        </div>
        {items.length === 0 ? (
          <EmptyState icon={() => <Tag />} title="Sem registos" description="Adiciona o primeiro item acima." />
        ) : (
          <div className="flex-col gap-8">
            {items.map(it => (
              <div key={it.id} className="flex items-center gap-12" style={{ padding: '11px 14px', background: 'var(--elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid var(--gold)', flexShrink: 0 }} />
                <span className="flex-1 text-sm fw-600">{it.name}</span>
                <button className="btn btn-ghost btn-icon" aria-label={`Eliminar ${it.name}`} title={`Eliminar ${it.name}`} onClick={() => remove(it.id)}><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}