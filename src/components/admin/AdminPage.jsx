import React from 'react';
import AdminLayout from '@/components/AdminLayout';
import PageInfo from '@/components/admin/PageInfo';
import BotaoAtualizar from '@/components/admin/BotaoAtualizar';

const PAGE_BY_TITLE = {
  'Bloqueios': 'bloqueios', 'Encaixes': 'encaixes', 'Lista de Espera': 'listaEspera', 'Aniversários': 'aniversarios',
  'Comandas': 'comandas', 'Pontos / Carimbos': 'fidelizacaoPontos', 'Programa de Fidelização': 'fidelizacaoPrograma',
  'Recompensas': 'fidelizacaoRecompensas', 'Desempenho dos Profissionais': 'desempenho', 'Horários dos Profissionais': 'horariosPro',
  'Movimentos de Stock': 'movimentos', 'Stock': 'stock', 'Comissões': 'comissoesPro', 'Categorias de Serviços': 'categorias',
  'Fornecedores': 'fornecedores', 'Relatório de Marcações': 'relatorioMarcacoes', 'Relatório de Clientes': 'relatorioClientes',
  'Relatório de Profissionais': 'relatorioProfissionais', 'Relatório Financeiro': 'relatorioFinanceiro', 'Relatório de Serviços': 'relatorioServicos',
  'Relatório de Produtos & Stock': 'relatorioProdutos', 'Relatório de Fidelização': 'relatorioFidelizacao', 'Relatório de Subscrições': 'relatorioSubscricoes',
  'Fluxo de Caixa': 'fluxoCaixa', 'Histórico de Caixa': 'historicoCaixa', 'Entradas': 'entradas', 'Saídas': 'saidas', 'Receitas': 'receitas',
  'Despesas': 'despesas', 'Conta de Cliente': 'contaCliente', 'Conta de Profissional': 'contaProfissional', 'Produtos': 'produtos',
  'Cupões': 'cupoes', 'Subscrições': 'subscricoes'
};

export default function AdminPage({ title, subtitle, actions, children, info, page }) {
  return (
    <AdminLayout>
      <div className="page-head">
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1>{title}</h1>
              {info && <PageInfo {...info} />}
            </div>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <BotaoAtualizar />
            {actions}
          </div>
        </div>
      </div>
      <PageInfo page={page || PAGE_BY_TITLE[title]} />
      {children}
    </AdminLayout>
  );
}