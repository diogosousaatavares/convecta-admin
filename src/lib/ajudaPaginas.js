/*
 * A AJUDA DE CADA PÁGINA (15/10/2026).
 *
 * O painel explica-se em duas fases: o título diz o que é; o (i) ao lado
 * do título abre isto. Escrito para quem tem a tesoura na mão, não para
 * quem fez o painel: o que é, o que acontece quando se usa, e o que o
 * cliente vê do outro lado. Três ou quatro frases, nunca um manual.
 *
 * A chave é o endereço. Um endereço sem entrada não mostra (i) nenhum.
 */
const A = {
  '/admin/dashboard': ['Início', 'O resumo do dia: quantas marcações, quanto entrou, quem vem a seguir. Os avisos no topo (notificações, subscrição, pedidos) são coisas a resolver — tocar leva ao sítio certo.'],
  '/admin': ['Início', 'O resumo do dia: quantas marcações, quanto entrou, quem vem a seguir.'],

  '/admin/agenda': ['Agenda', 'O dia, por profissional. Tocar numa hora livre marca ou bloqueia; tocar numa marcação abre o detalhe para confirmar presença, re-agendar ou cancelar.\n\nO que o cliente marca na app aparece aqui sozinho. «Lista» mostra o dia em linhas; «Espera» mostra quem está à espera de vaga.'],
  '/admin/agenda/marcacoes': ['Marcações', 'Todas as marcações, por estado: por confirmar, confirmadas, feitas, canceladas. Serve para ver o que ficou para trás sem andar dia a dia na agenda.'],
  '/admin/orcamentos': ['Orçamentos', 'Para serviços sem preço fixo (umas rastas, uma coloração): em vez de marcar, o cliente pede um orçamento na app e escreve o que quer.\n\nO pedido chega aqui e toca-te no telemóvel. Ligas-lhe ou respondes, combinas o preço, e marcas daqui — a marcação vai para a agenda já com o preço combinado.\n\nUm serviço passa a «orçamento» na ficha do serviço, em Catálogo › Serviços.'],
  '/admin/agenda/lista-espera': ['Lista de espera', 'Quem quer vir num dia cheio. Quando se abre uma vaga (um cancelamento, por exemplo), ligas ao primeiro da lista e marcas. O cliente também se pode pôr na lista pela app.'],
  '/admin/agenda/encaixes': ['Encaixes', 'Marcar alguém entre duas marcações, num espaço que a agenda normal não dava. Útil para o cliente de confiança que aparece à porta.'],
  '/admin/agenda/bloqueios': ['Bloqueios', 'Horas em que não atendes: almoço, uma saída, uma tarde fora. Um bloqueio tira essas horas da app do cliente — ninguém consegue marcar nelas.'],
  '/admin/agenda/pack': ['Pack mensal', 'As marcações pagas com pack, à parte das outras: quem vem «de pack» não se cobra na hora. Em baixo, o cartão de cada cliente com pack — quantos já usou, quantos tem marcados, até quando vale.'],

  '/admin/financeiro/caixa': ['Caixa e pagamentos', 'O dia em dinheiro. «Por cobrar» são as marcações de hoje ainda por pagar: tocas, escolhes como pagou, e fica feita. «Despesa» regista o que saiu. «Fechar caixa» fecha o dia e guarda o resumo no histórico.'],
  '/admin/caixa': ['Caixa e pagamentos', 'O dia em dinheiro. «Por cobrar» são as marcações de hoje ainda por pagar: tocas, escolhes como pagou, e fica feita. «Despesa» regista o que saiu. «Fechar caixa» fecha o dia.'],
  '/admin/comandas': ['Comandas', 'Uma conta em aberto por cliente: juntas serviços e produtos à medida que vai consumindo e cobras tudo no fim. Serve para o cliente que faz corte, barba e leva uma cera.'],
  '/admin/pagamentos-online': ['Pagamentos online', 'O cliente paga ao marcar, com cartão, Apple Pay ou Google Pay. Escolhes se paga tudo, metade ou nada, e em que serviços. O dinheiro entra na tua conta Stripe e cai no banco em poucos dias.\n\nQuem paga antes falta menos.'],
  '/admin/mbway': ['MB WAY', 'O cliente paga a marcação por MB WAY para o teu número. Diz na app que pagou; tu confirmas aqui quando vires o dinheiro no telemóvel — só aí fica pago.'],
  '/admin/financeiro/entradas': ['Entradas', 'Tudo o que entrou: marcações pagas, produtos vendidos, packs. Por dia e por forma de pagamento.'],
  '/admin/financeiro/saidas': ['Saídas', 'Tudo o que saiu: despesas, compras de produtos, pagamentos à equipa.'],
  '/admin/financeiro/comissoes': ['Comissões', 'O que cada profissional tem a receber no período: a percentagem dele sobre o que fez, mais as gorjetas. A percentagem define-se na ficha do profissional.\n\nTocar num nome abre as contas por inteiro.'],
  '/admin/profissionais/comissoes': ['Comissões', 'O que cada profissional tem a receber no período: a percentagem dele sobre o que fez, mais as gorjetas. A percentagem define-se na ficha do profissional.'],
  '/admin/financeiro': ['Financeiro', 'As contas do mês: o que entrou, o que saiu, o que sobra. Com separadores para despesas, receitas, fluxo de caixa e o histórico de caixas fechadas.'],
  '/admin/financeiro/despesas': ['Despesas', 'O que gastas: renda, produtos, luz. Cada despesa entra nas contas do mês.'],
  '/admin/financeiro/receitas': ['Receitas', 'O que ganhaste, por dia e por origem.'],
  '/admin/financeiro/fluxo': ['Fluxo de caixa', 'Entradas e saídas ao longo do mês, para veres onde o dinheiro aperta.'],
  '/admin/financeiro/historico': ['Histórico de caixa', 'Cada caixa que fechaste: o dia, o total, as despesas e quem fechou.'],
  '/admin/financeiro/conta-cliente': ['Conta de cliente', 'O que um cliente já gastou contigo, visita a visita.'],
  '/admin/financeiro/conta-profissional': ['Conta de profissional', 'O que um profissional fez e o que tem a receber, marcação a marcação.'],

  '/admin/clientes': ['Clientes', 'A ficha de cada cliente: contactos, histórico de visitas, o que gastou, notas tuas. Quem marca pela app fica aqui sozinho; os outros, crias tu.'],
  '/admin/clientes/aniversarios': ['Aniversários', 'Quem faz anos esta semana e este mês. Uma mensagem de parabéns traz gente de volta.'],
  '/admin/avaliacoes': ['Avaliações', 'O que os clientes disseram de ti depois da visita. As avaliações aparecem na tua página de marcações.'],

  '/admin/servicos': ['Serviços', 'O que fazes, com preço e duração. É isto que o cliente vê e escolhe na app.\n\nUm serviço pode ser «orçamento» (sem preço fixo: o cliente pede e tu respondes), «extra» (junta-se a outro, como barba ao corte), ou ter foto.'],
  '/admin/servicos/categorias': ['Categorias', 'Como os serviços se agrupam na app: Cortes, Barba, Coloração… O cliente encontra mais depressa.'],
  '/admin/packs': ['Packs', 'Vários cortes pagos à cabeça, mais barato: por exemplo 4 cortes por 40 €. O cliente compra (ou pede na app) e vai marcando; cada marcação gasta um.\n\nAs regras — até quando vale, se os que sobram passam ao mês seguinte, quantos dias entre cortes — definem-se em cada pack.'],
  '/admin/packs/pedidos': ['Pedidos de pack', 'Clientes que pediram um pack na app. Quando receberes o dinheiro, confirmas — só aí o pack fica ativo e ele pode marcar com ele.'],
  '/admin/packs/clientes': ['Clientes com pack', 'Quem tem pack ativo, quantos cortes lhe restam e até quando valem.'],
  '/admin/produtos': ['Produtos', 'O que vendes ao balcão: ceras, champôs, pomadas. Cada produto tem preço, custo e stock. «Vender na app» mostra-o ao cliente quando marca, para o juntar à marcação.'],
  '/admin/inventario': ['Produtos', 'O que vendes ao balcão. Cada produto tem preço, custo e stock.'],
  '/admin/produtos/stock': ['Stock', 'Quanto há de cada produto. Avisa quando um está a acabar.'],
  '/admin/produtos/movimentos': ['Entradas e saídas', 'O histórico do stock: o que entrou (compras), o que saiu (vendas, quebras). Cada venda e cada acerto fica aqui.'],
  '/admin/produtos/fornecedores': ['Fornecedores', 'A quem compras os produtos, com contactos.'],

  '/admin/o-meu-site': ['O meu site', 'A tua página de marcações — o que o cliente abre para marcar. Aqui mudas o nome, o logo, as cores, as fotos e o texto. Publicar põe as alterações no ar na hora.'],
  '/admin/fidelizacao': ['Cartão de fidelidade', 'A cada X cortes, um grátis. O cliente vê o cartão na app com os carimbos a encher; quando chega ao fim, a marcação seguinte sai a 0 €. Os carimbos põem-se sozinhos quando cobras.'],
  '/admin/promocoes': ['Promoções e cupões', 'Descontos com prazo: uma percentagem num serviço durante uma semana, um código para quem traz um amigo. O cliente vê a promoção na app.'],
  '/admin/redes-sociais': ['Redes sociais', 'Posts e vídeos prontos para o Instagram e o TikTok, já com o teu nome e o link de marcações.'],
  '/admin/notificacoes': ['Notificações', 'Avisos que mandas para o telemóvel dos teus clientes: uma promoção, uma novidade, um feriado. Chegam a quem tem a app com as notificações ligadas.\n\n«Lembrar o cliente» manda, sozinho, um aviso umas horas antes de cada marcação — menos faltas.'],
  '/admin/definicoes/notificacoes': ['Notificações', 'Avisos que mandas para o telemóvel dos teus clientes. «Lembrar o cliente» avisa, sozinho, umas horas antes de cada marcação.'],

  '/admin/profissionais': ['Profissionais', 'Quem corta: nome, foto, função, comissão. O cliente escolhe o profissional na app, por isso a foto conta.'],
  '/admin/profissionais/equipa': ['Acessos', 'Quem entra no painel além de ti. Um profissional com acesso vê a agenda, os clientes e a conta dele — nada de dinheiro, produtos ou definições. Tocas no nome para dar ou tirar o acesso.'],
  '/admin/horarios': ['Horário', 'A que horas abres e fechas, dia a dia. Fora destas horas ninguém marca na app.'],
  '/admin/profissionais/horarios': ['Horários da equipa', 'O horário de cada profissional, quando é diferente do da casa. Define as horas em que ele aparece na app.'],
  '/admin/profissionais/ferias': ['Férias', 'Dias inteiros em que um profissional não trabalha. Esses dias desaparecem da app; se já tiver marcações, vês quais antes de confirmar e os clientes são avisados.'],
  '/admin/profissionais/desempenho': ['Desempenho', 'Quem fez o quê no período: marcações, receita, clientes, ticket médio. Tocar num nome abre os números todos.'],

  '/admin/relatorios': ['Relatórios', 'Os números por mês: marcações, clientes, dinheiro, serviços mais vendidos, produtos, fidelidade. Cada separador é um relatório.'],
  '/admin/relatorios/marcacoes': ['Marcações', 'Quantas marcações houve, quantas faltaram, quantas foram canceladas, e de onde vieram (app ou balcão).'],
  '/admin/relatorios/clientes': ['Clientes', 'Quantos clientes novos, quantos voltam, quem veio no período e quanto gastou.'],
  '/admin/relatorios/profissionais': ['Equipa', 'O desempenho de cada profissional no período.'],
  '/admin/relatorios/financeiro': ['Financeiro', 'Receitas, despesas e lucro no período, com a comparação com o período anterior.'],
  '/admin/relatorios/servicos': ['Serviços', 'Os serviços mais pedidos e os que rendem mais.'],
  '/admin/relatorios/produtos': ['Produtos e stock', 'O que vendeste de produtos e o valor do stock que tens parado.'],
  '/admin/relatorios/fidelizacao': ['Fidelização', 'Quantos cartões estão a encher, quantos prémios foram dados, quem está perto do prémio.'],

  '/admin/definicoes': ['Definições', 'A conta e o painel: os dados do negócio, as regras da agenda, as cores, os acessos. O que o cliente vê muda em «O meu site».'],
  '/admin/definicoes/negocio': ['Negócio', 'Nome, morada, contactos e NIF. Aparecem na tua página e nos emails ao cliente.'],
  '/admin/definicoes/parametros': ['Agenda', 'As regras das marcações pela app: se entram já confirmadas ou tu confirmas; se o cliente pode desmarcar, e até quantas horas antes.'],
  '/admin/definicoes/tema': ['Cores', 'As cores do painel (claro ou escuro). As cores da app do cliente mudam em «O meu site».'],
  '/admin/subscricao': ['Plano e faturação', 'O teu plano Convecta, os extras ligados, o cartão e as faturas. Mudar de plano faz-se aqui, na hora.'],
  '/admin/tipos': ['Tipos de negócio', 'Se o teu espaço faz mais do que uma coisa (barbearia e estética, por exemplo), cada tipo tem a sua app e o seu link, com o mesmo login.'],
};

/** A ajuda da página neste endereço, ou null. */
export function ajudaDe(pathname) {
  if (!pathname) return null;
  const p = pathname.replace(/\/+$/, '') || '/admin';
  if (A[p]) return { titulo: A[p][0], texto: A[p][1] };
  // /admin/definicoes/x, /admin/comandas/abertas…: a entrada do pai.
  const pai = p.split('/').slice(0, -1).join('/');
  if (A[pai]) return { titulo: A[pai][0], texto: A[pai][1] };
  return null;
}
