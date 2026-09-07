import React from 'react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import HistoricoCaixa from '@/components/financeiro/HistoricoCaixa';

export default function FinCashHistory() {
  return (
    <AdminPage title="Histórico de Caixa" subtitle="Sessões fechadas e respetivos fechos.">
      <HistoricoCaixa />
    </AdminPage>
  );
}