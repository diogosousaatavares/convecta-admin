import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

/*
 * Os separadores de uma familia de paginas.
 *
 * As Definicoes, as Comandas, os Relatorios e as Promocoes sao, cada uma,
 * um conjunto de paginas irmas — mas cada irma e um componente proprio,
 * alcancavel so pelo endereco. Nao havia forma de ir de uma para a outra
 * sem voltar ao menu, e era por isso que o menu tinha de as listar todas:
 * trinta e duas linhas na gaveta "Mais".
 *
 * Isto resolve as duas coisas de uma vez. Cada pagina da familia passa a
 * mostrar as irmas em cima, e o menu passa a precisar de uma linha so por
 * familia.
 *
 * Nao tem estado nem sabe nada das paginas: le o endereco, encontra a
 * familia, desenha os links. Uma pagina que nao pertenca a familia nenhuma
 * nao desenha nada.
 */

const FAMILIAS = [
  {
    prefixo: '/admin/relatorios',
    abas: [
      { to: '/admin/relatorios', label: 'Resumo', exacto: true },
      { to: '/admin/relatorios/marcacoes', label: 'Marcações' },
      { to: '/admin/relatorios/clientes', label: 'Clientes' },
      { to: '/admin/relatorios/profissionais', label: 'Equipa' },
      { to: '/admin/relatorios/financeiro', label: 'Financeiro' },
      { to: '/admin/relatorios/servicos', label: 'Serviços' },
      { to: '/admin/relatorios/produtos', label: 'Produtos e stock' },
      { to: '/admin/relatorios/fidelizacao', label: 'Fidelização' },
    ],
  },
  {
    prefixo: '/admin/comandas',
    // /admin/comandas sem nada a seguir mostra as abertas: por isso a
    // primeira aba fica acesa tambem nesse caso.
    abas: [
      { to: '/admin/comandas/abertas', label: 'Abertas', tambem: ['/admin/comandas'] },
      { to: '/admin/comandas/pendentes', label: 'Pendentes' },
      { to: '/admin/comandas/pagas', label: 'Pagas' },
      { to: '/admin/comandas/canceladas', label: 'Canceladas' },
      { to: '/admin/comandas/historico', label: 'Histórico' },
    ],
  },
  {
    prefixo: '/admin/definicoes',
    abas: [
      { to: '/admin/definicoes/negocio', label: 'Negócio', tambem: ['/admin/definicoes'] },
      { to: '/admin/definicoes/agenda', label: 'Agenda' },
      { to: '/admin/definicoes/profissionais', label: 'Profissionais' },
      { to: '/admin/definicoes/pagamentos', label: 'Pagamentos' },
      { to: '/admin/definicoes/notificacoes', label: 'Notificações' },
      { to: '/admin/definicoes/clientes', label: 'Clientes' },
      { to: '/admin/definicoes/documentos', label: 'Documentos' },
      { to: '/admin/definicoes/tema', label: 'Cores deste painel' },
      { to: '/admin/definicoes/utilizadores', label: 'Utilizadores' },
      { to: '/admin/definicoes/seguranca', label: 'Segurança' },
      { to: '/admin/definicoes/parametros', label: 'Mais opções' },
    ],
  },
  {
    prefixo: '/admin/promocoes',
    abas: [
      { to: '/admin/promocoes', label: 'Promoções', exacto: true },
      { to: '/admin/promocoes/cupoes', label: 'Cupões' },
    ],
  },
];

const semBarra = (c) => (c.length > 1 && c.endsWith('/') ? c.slice(0, -1) : c);

export default function SeparadoresDaFamilia() {
  const { pathname } = useLocation();
  const caminho = semBarra(pathname);

  const familia = FAMILIAS.find(f => caminho === f.prefixo || caminho.startsWith(f.prefixo + '/'));
  if (!familia) return null;

  const aceso = (aba) =>
    caminho === aba.to || (aba.tambem || []).includes(caminho);

  return (
    <div className="bp-tabs" role="tablist" aria-label="Secções desta área">
      {familia.abas.map(aba => (
        <NavLink
          key={aba.to}
          to={aba.to}
          role="tab"
          aria-selected={aceso(aba)}
          className={`bp-tab ${aceso(aba) ? 'active' : ''}`}
          style={{ textDecoration: 'none', display: 'inline-block' }}
        >
          {aba.label}
        </NavLink>
      ))}
    </div>
  );
}
