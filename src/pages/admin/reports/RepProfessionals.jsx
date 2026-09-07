import React from 'react';
import AdminPage from '@/components/admin/AdminPage';
import PageInfo from '@/components/admin/PageInfo';
import ProPerformance from '@/pages/admin/ProPerformance';

export default function RepProfessionals() {
  return (
    <AdminPage title="Relatório de Profissionais" subtitle="Desempenho por profissional.">
      <ProPerformance />
    </AdminPage>
  );
}