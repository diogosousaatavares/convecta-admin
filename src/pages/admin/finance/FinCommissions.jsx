import React from 'react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import Comissoes from '@/components/financeiro/Comissoes';

export default function FinCommissions() {
  return (
    <AdminPage title="Comissões" subtitle="Comissões financeiras dos profissionais." page="comissoesFinanceiro">
      <Comissoes />
    </AdminPage>
  );
}