import React from 'react';
import AdminPage from '@/components/admin/AdminPage';
import Comissoes from '@/components/financeiro/Comissoes';
import PageInfo from '@/components/admin/PageInfo';

export default function ProCommissions() {
  return (
    <AdminPage title="Comissões" subtitle="Comissões por profissional (mesmo cálculo do Financeiro).">
      <Comissoes />
    </AdminPage>
  );
}