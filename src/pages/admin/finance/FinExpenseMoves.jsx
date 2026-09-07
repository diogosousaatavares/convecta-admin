import React from 'react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import Movimentos from '@/components/financeiro/Movimentos';

export default function FinExpenseMoves() {
  return (
    <AdminPage title="Saídas" subtitle="Saídas financeiras registadas (movimentos de saída).">
      <Movimentos mode="out" />
    </AdminPage>
  );
}