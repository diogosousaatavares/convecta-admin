import React from 'react';
import AdminLayout from '@/components/AdminLayout';
import PageInfo from '@/components/admin/PageInfo';
import BotaoAtualizar from '@/components/admin/BotaoAtualizar';
import SeparadoresDaFamilia from '@/components/admin/SeparadoresDaFamilia';

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
            {/*
                O subtitulo deixou de se desenhar a 28/09/2026.
                Eram 45 paginas com uma frase cinzenta por baixo do titulo a
                dizer, por outras palavras, o que o titulo ja dizia. Ninguem
                a le, e era a primeira coisa a empurrar o conteudo para baixo
                no telemovel. A propriedade continua a ser aceite para nao
                partir as 45 chamadas.
            */}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <BotaoAtualizar />
            {actions}
          </div>
        </div>
      </div>
      <PageInfo page={page || PAGE_BY_TITLE[title]} />
      {/* As paginas irmas desta area, quando as ha. Ver o componente. */}
      <SeparadoresDaFamilia />
      {children}
    </AdminLayout>
  );
}