import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { gruposPara } from '@/components/AdminLayout';
import AdminPage from '@/components/admin/AdminPage';
import Caixas, { CSS_CAIXAS } from '@/components/admin/Caixas';
import { useStore } from '@/hooks/useStore';

/*
 * A PÁGINA DE UMA SECÇÃO (15/10/2026, à Fresha): Vendas, Catálogo,
 * Marketing, Equipa… As páginas da secção, em caixas. O menu é o mesmo do
 * AdminLayout (gruposPara), com os mesmos filtros.
 */
export default function Seccao() {
  const { id } = useParams();
  const data = useStore();
  const emDemo = data.business?._settings?.demo?.ativo === true;
  const g = gruposPara(emDemo, data.isProfissional).find(x => x.type === 'group' && x.id === id);
  if (!g) return <Navigate to="/admin/mais" replace />;
  return (
    <AdminPage title={g.label} subtitle={g.d}>
      <style dangerouslySetInnerHTML={{ __html: CSS_CAIXAS }} />
      <div style={{ maxWidth: 900 }}><Caixas itens={g.items} lista /></div>
    </AdminPage>
  );
}
