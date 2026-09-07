import React from 'react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import ContaProfissional from '@/components/financeiro/ContaProfissional';

export default function FinProAccount() {
  return (
    <AdminPage title="Conta de Profissional" subtitle="Comissões e valores a receber por profissional.">
      <ContaProfissional />
    </AdminPage>
  );
}