import React, { useMemo } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import HistoricoCaixa from '@/components/financeiro/HistoricoCaixa';
import Movimentos from '@/components/financeiro/Movimentos';
import Comissoes from '@/components/financeiro/Comissoes';
import ContaCliente from '@/components/financeiro/ContaCliente';
import FluxoCaixa from '@/components/financeiro/FluxoCaixa';
import ContaProfissional from '@/components/financeiro/ContaProfissional';
import PageInfo from '@/components/admin/PageInfo';

const TABS = [
  { key: 'historico', label: 'Histórico de Caixa' },
  { key: 'movimentos', label: 'Entrada / Saída' },
  // Receitas e Despesas eram cartões «em estruturação» com links partidos.
  // As páginas verdadeiras já existem: o separador abre-as.
  { key: 'receitas', label: 'Receitas', to: '/admin/financeiro/receitas' },
  { key: 'despesas', label: 'Despesas', to: '/admin/financeiro/despesas' },
  { key: 'comissoes', label: 'Comissões' },
  { key: 'conta-cliente', label: 'Conta do Cliente' },
  { key: 'fluxo', label: 'Fluxo de Caixa' },
  { key: 'conta-pro', label: 'Conta do Profissional' }
];

export default function Financeiro() {
  const location = useLocation();
  const navigate = useNavigate();
  const tab = useMemo(() => new URLSearchParams(location.search).get('tab') || 'historico', [location.search]);

  return (
    <AdminLayout>
      <div className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h1>Financeiro</h1>
          <PageInfo
            description="Agregação de todas as fontes de receita do negócio num único lugar: marcações pagas, produtos vendidos e receitas de subscrições. Mostra de onde vem o dinheiro e em que proporção."
            impact="Saber qual a fonte de receita dominante permite tomar decisões estratégicas: se 80% da receita vem de marcações e 0% de produtos, há uma oportunidade de crescimento que está a ser ignorada."
            links={['Caixa', 'Comandas', 'Subscrições', 'Relatório Financeiro']}
          />
        </div>
      </div>
      <div className="bp-tabs" style={{ marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.key} className={`bp-tab ${tab === t.key ? 'active' : ''}`} onClick={() => navigate(t.to || `/admin/financeiro?tab=${t.key}`)}>{t.label}</button>
        ))}
      </div>

      {tab === 'historico' && <HistoricoCaixa />}
      {tab === 'movimentos' && <Movimentos />}
      {tab === 'receitas' && <Navigate to="/admin/financeiro/receitas" replace />}
      {tab === 'despesas' && <Navigate to="/admin/financeiro/despesas" replace />}
      {tab === 'comissoes' && <Comissoes />}
      {tab === 'conta-cliente' && <ContaCliente />}
      {tab === 'fluxo' && <FluxoCaixa />}
      {tab === 'conta-pro' && <ContaProfissional />}
    </AdminLayout>
  );
}