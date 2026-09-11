/*
 * Relatorio mensal para o contabilista da barbearia.
 *
 * O barbeiro carrega num botao e manda o ficheiro. E o que ele hoje faz com um
 * saco de talhes e uma tarde perdida.
 *
 * Duas folhas de proposito, e nao dez:
 *
 *   Resumo    — os totais que o contabilista lanca
 *   Servicos  — cada servico feito, linha a linha, para ele conferir
 *
 * Nao ha IVA aqui. Ninguem definiu taxas no sistema e um numero de IVA
 * inventado num documento que vai para contabilidade e pior do que numero
 * nenhum. Da-se o que foi cobrado; as contas de IVA sao dele.
 *
 * A receita sai das mesmas funcoes que o resto do painel (domain/finance): se
 * o relatorio tivesse conta propria, mais tarde ou mais cedo dizia um numero
 * diferente do dashboard, e a partir dai ninguem confia em nenhum dos dois.
 */
import { descarregarXlsx, dinheiro, data as dataExcel, titulo } from '@/lib/excel';
import { paidAppointments, netOfPayment } from '@/lib/domain/finance';
import { round2 } from '@/lib/domain/money';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export function limitesDoMes(ano, mes) {
  const dois = n => String(n).padStart(2, '0');
  const ultimo = new Date(ano, mes + 1, 0).getDate();
  return { from: `${ano}-${dois(mes + 1)}-01`, to: `${ano}-${dois(mes + 1)}-${dois(ultimo)}` };
}

export function nomeDoMes(ano, mes) { return `${MESES[mes]} ${ano}`; }

export function dadosDoRelatorio(state, ano, mes) {
  const range = limitesDoMes(ano, mes);
  const vendas = paidAppointments(state, range)
    .slice()
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

  const nomeDe = (lista, id, campo = 'name') => lista.find(x => x.id === id)?.[campo] || '';

  const linhas = vendas.map(a => {
    const p = a.payment || {};
    return {
      data: a.date,
      hora: a.startTime,
      referencia: a.bookingRef || '',
      cliente: a.customerNameSnapshot || nomeDe(state.customers, a.customerId) || 'Cliente de passagem',
      servico: a.serviceNameSnapshot || nomeDe(state.services, a.serviceId),
      profissional: a.professionalNameSnapshot || nomeDe(state.professionals, a.professionalId),
      base: Number(p.baseAmount) || 0,
      desconto: Number(p.discountAmount) || 0,
      liquido: netOfPayment(a),
      gorjeta: Number(p.tip) || 0,
      total: round2(netOfPayment(a) + (Number(p.tip) || 0)),
      metodo: p.method || '',
      // Um corte grátis do cartão é um serviço prestado que não foi cobrado. O
      // contabilista precisa de o ver: aparece na lista, com zero.
      gratis: a.usaRecompensa === true,
    };
  });

  const soma = (f) => round2(linhas.reduce((s, l) => s + f(l), 0));
  const porChave = (campo, valor = l => l.total) => {
    const m = new Map();
    for (const l of linhas) m.set(l[campo] || '—', round2((m.get(l[campo] || '—') || 0) + valor(l)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };

  return {
    range,
    linhas,
    totais: {
      servicos: linhas.length,
      gratis: linhas.filter(l => l.gratis).length,
      base: soma(l => l.base),
      descontos: soma(l => l.desconto),
      liquido: soma(l => l.liquido),
      gorjetas: soma(l => l.gorjeta),
      total: soma(l => l.total),
    },
    porMetodo: porChave('metodo'),
    porProfissional: porChave('profissional'),
    porServico: porChave('servico'),
  };
}

export function exportarRelatorioMensal(state, ano, mes) {
  const r = dadosDoRelatorio(state, ano, mes);
  const nomeBarbearia = state.business?.name || 'Barbearia';
  const periodo = nomeDoMes(ano, mes);
  const t = r.totais;

  const resumo = [
    [titulo(nomeBarbearia)],
    [titulo('Relatório mensal'), periodo],
    [titulo('Gerado em'), dataExcel(new Date())],
    [],
    [titulo('TOTAIS')],
    ['Serviços prestados', t.servicos],
    ['Dos quais grátis (cartão de fidelidade)', t.gratis],
    ['Valor dos serviços', dinheiro(t.base)],
    ['Descontos', dinheiro(-t.descontos)],
    ['Receita de serviços', dinheiro(t.liquido)],
    ['Gorjetas', dinheiro(t.gorjetas)],
    [titulo('Total cobrado'), dinheiro(t.total)],
    [],
    [titulo('POR MÉTODO DE PAGAMENTO')],
    ...r.porMetodo.map(([k, v]) => [k, dinheiro(v)]),
    [],
    [titulo('POR PROFISSIONAL')],
    ...r.porProfissional.map(([k, v]) => [k, dinheiro(v)]),
    [],
    [titulo('POR SERVIÇO')],
    ...r.porServico.map(([k, v]) => [k, dinheiro(v)]),
    [],
    ['Valores em euros. Não inclui IVA — os preços são os cobrados ao cliente.'],
  ];

  const servicos = [
    ['Data', 'Hora', 'Referência', 'Cliente', 'Serviço', 'Profissional',
     'Valor', 'Desconto', 'Receita', 'Gorjeta', 'Total', 'Pagamento', 'Grátis']
      .map(titulo),
    ...r.linhas.map(l => [
      dataExcel(l.data), l.hora, l.referencia, l.cliente, l.servico, l.profissional,
      dinheiro(l.base), dinheiro(l.desconto), dinheiro(l.liquido),
      dinheiro(l.gorjeta), dinheiro(l.total), l.metodo, l.gratis ? 'Sim' : '',
    ]),
  ];

  if (r.linhas.length) {
    servicos.push([]);
    servicos.push([titulo('TOTAL'), '', '', '', '', '',
      dinheiro(t.base), dinheiro(t.descontos), dinheiro(t.liquido),
      dinheiro(t.gorjetas), dinheiro(t.total), '', '']);
  }

  const semAcentos = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
  const nomeFicheiro = `${semAcentos(nomeBarbearia)}-${ano}-${String(mes + 1).padStart(2, '0')}.xlsx`;

  descarregarXlsx(nomeFicheiro, [
    { nome: 'Resumo', larguras: [38, 18], linhas: resumo },
    { nome: 'Serviços', larguras: [11, 7, 13, 22, 22, 18, 11, 11, 11, 10, 11, 14, 8], linhas: servicos },
  ]);

  return r;
}
