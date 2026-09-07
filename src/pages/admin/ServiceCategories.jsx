import React, { useState } from 'react';
import { Tag, Plus, Trash2 } from 'lucide-react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import { Card, Button, EmptyState } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';

export default function ServiceCategories() {
  const data = useStore();
  const toast = useToast();
  const [name, setName] = useState('');
  const items = (data.typologies && data.typologies.categorias) || [];

  const add = async () => {
    if (!name.trim()) { toast.error('Indica o nome'); return; }
    await dataService.addTypology('categorias', name.trim());
    setName(''); toast.success('Categoria criada');
  };
  const remove = async (id) => { await dataService.removeTypology('categorias', id); toast.info('Removida'); };

  return (
    <AdminPage title="Categorias de Serviços" subtitle="Categorias usadas na marcação e nos relatórios."
      actions={null}>
      <Card className="card-pad">
        <div className="flex gap-8 mb-24">
          <input className="input" placeholder="Nova categoria…" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
          <Button variant="primary" onClick={add}><Plus size={15} /> Adicionar</Button>
        </div>
        {items.length === 0 ? (
          <EmptyState icon={() => <Tag />} title="Sem categorias" description="Adiciona a primeira categoria acima." />
        ) : (
          <div className="flex-col gap-8">
            {items.map(it => (
              <div key={it.id} className="flex items-center gap-12" style={{ padding: '11px 14px', background: 'var(--elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid var(--gold)' }} />
                <span className="flex-1 text-sm fw-600">{it.name}</span>
                <span className="text-sec text-xs">{data.services.filter(s => s.category === it.name).length} serviços</span>
                <button className="btn btn-ghost btn-icon" aria-label={`Eliminar ${it.name}`} title={`Eliminar ${it.name}`} onClick={() => remove(it.id)}><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </AdminPage>
  );
}