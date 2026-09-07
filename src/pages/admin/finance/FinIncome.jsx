import React from 'react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import Movimentos from '@/components/financeiro/Movimentos';

export default function FinIncome() {
  return (
    <AdminPage title="Entradas" subtitle="Entradas financeiras registadas (movimentos de entrada).">
      <Movimentos mode="in" />
    </AdminPage>
  );
}