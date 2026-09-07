import React from 'react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import FluxoCaixa from '@/components/financeiro/FluxoCaixa';

export default function FinCashFlow() {
  return (
    <AdminPage title="Fluxo de Caixa" subtitle="Entradas e saídas ao longo do tempo.">
      <FluxoCaixa />
    </AdminPage>
  );
}