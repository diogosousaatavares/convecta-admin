import React from 'react';
import AdminLayout from '@/components/AdminLayout';
import PageInfo from '@/components/admin/PageInfo';
import Comissoes from '@/components/financeiro/Comissoes';

export default function ProCommissions() {
  return (
    <AdminLayout>
      <div className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h1>Comissões</h1>
          <PageInfo
            description="Comissões por profissional calculadas a partir das marcações pagas no período selecionado."
            impact="A percentagem de comissão afeta diretamente o custo de cada serviço e a motivação da equipa. A comissão é guardada como snapshot no momento do checkout."
            links={['Profissionais', 'Financeiro', 'Relatórios', 'Agenda']}
          />
        </div>
        <p>Comissões por profissional (mesmo cálculo do Financeiro).</p>
      </div>
      <PageInfo page="comissoesPro" />
      <Comissoes />
    </AdminLayout>
  );
}
