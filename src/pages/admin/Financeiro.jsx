import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import HistoricoCaixa from '@/components/financeiro/HistoricoCaixa';
import Movimentos from '@/components/financeiro/Movimentos';
import Comissoes from '@/components/financeiro/Comissoes';
import ContaCliente from '@/components/financeiro/ContaCliente';
import FluxoCaixa from '@/components/financeiro/FluxoCaixa';
import ContaProfissional from '@/components/financeiro/ContaProfissional';
import ModulePlaceholder from '@/components/admin/ModulePlaceholder';
import { TrendingUp, TrendingDown, ShoppingBag, Package as PackageIcon, Repeat, Wallet } from 'lucide-react';
import PageInfo from '@/components/admin/PageInfo';

const TABS = [
  { key: 'historico', label: 'Histórico de Caixa' },
  { key: 'movimentos', label: 'Entrada / Saída' },
  { key: 'receitas', label: 'Receitas' },
  { key: 'despesas', label: 'Despesas' },
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
        <p>Gestão financeira completa da barbearia.</p>
      </div>
      <div className="bp-tabs" style={{ marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.key} className={`bp-tab ${tab === t.key ? 'active' : ''}`} onClick={() => navigate(`/admin/financeiro?tab=${t.key}`)}>{t.label}</button>
        ))}
      </div>

      {tab === 'historico' && <HistoricoCaixa />}
      {tab === 'movimentos' && <Movimentos />}
      {tab === 'receitas' && (
        <ModulePlaceholder embedded icon={TrendingUp} title="Receitas"
          subtitle="Receitas provenientes de serviços, produtos, assinaturas e outras."
          sections={[
            { key: 'servicos', title: 'Serviços', description: 'Receita de marcações concluídas.', icon: ShoppingBag },
            { key: 'produtos', title: 'Produtos', description: 'Vendas de balcão e em comandas.', icon: PackageIcon },
            { key: 'assinaturas', title: 'Assinaturas', description: 'Receitas recorrentes de planos.', icon: Repeat },
            { key: 'outras', title: 'Outras Receitas', description: 'Movimentos de entrada avulsos.', icon: Wallet }
          ]}
        />
      )}
      {tab === 'despesas' && (
        <ModulePlaceholder embedded icon={TrendingDown} title="Despesas"
          subtitle="Gestão de despesas, categorias, fornecedores e métodos de pagamento."
          sections={[
            { key: 'lista', title: 'Despesas', description: 'Registo com data, valor, categoria e método.', icon: Wallet },
            { key: 'categorias', title: 'Categorias', description: 'Categorias de despesa (em Tipos).', icon: TrendingDown }
          ]}
        />
      )}
      {tab === 'comissoes' && <Comissoes />}
      {tab === 'conta-cliente' && <ContaCliente />}
      {tab === 'fluxo' && <FluxoCaixa />}
      {tab === 'conta-pro' && <ContaProfissional />}
    </AdminLayout>
  );
}