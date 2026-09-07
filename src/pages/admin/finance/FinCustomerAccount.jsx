import React from 'react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import ContaCliente from '@/components/financeiro/ContaCliente';

export default function FinCustomerAccount() {
  return (
    <AdminPage title="Conta de Cliente" subtitle="Créditos, débitos e saldos dos clientes.">
      <ContaCliente />
    </AdminPage>
  );
}