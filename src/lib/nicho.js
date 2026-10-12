/*
 * O TIPO DE NEGÓCIO (09/10/2026).
 *
 * A Convecta nasceu para barbearias e as frases dizem «barbearia»,
 * «barbeiro» e «corte». Um salão de beleza, um estúdio de unhas ou um salão
 * de estética usam exatamente o mesmo sistema — só as palavras mudam.
 *
 * O tipo vive em businesses.settings.tipoNegocio. Sem nada, é barbearia
 * (todas as contas antigas continuam a ler-se como sempre).
 *
 * As frases não se constroem à mão com «a» ou «o»: o português tem género
 * («a barbearia confirma», «o salão confirma») e é aqui que isso se resolve.
 * Quem escreve uma frase usa n().A, n().da, n().na… e a palavra certa vem
 * com o artigo certo.
 *
 * O ESPAÇO MISTO (12/10/2026). Uma barbearia com estética na mesma loja é o
 * tipo «misto», com dois LADOS em settings.lados (ex.: ['barbearia',
 * 'estetica']). Cada serviço e cada profissional diz de que lado é
 * (metadata.lado; vazio = dos dois). O painel e o site do cliente escolhem
 * um lado de cada vez, e as palavras passam a ser as desse lado — no
 * painel, pelo seletor do topo; no site, pela frente que o cliente abriu.
 * Sem lado escolhido, as palavras são as neutras do «espaço».
 *
 * ESTE FICHEIRO EXISTE IGUAL NO ADMIN, NO SITE DO CLIENTE E NO SUPER ADMIN.
 * Mudar num é mudar nos três.
 */

// Palavras de um negócio cujo nome é feminino (a barbearia).
const fem = (casa, Casa) => ({
  casa, Casa,
  a: `a ${casa}`, A: `A ${casa}`,
  da: `da ${casa}`, na: `na ${casa}`, pela: `pela ${casa}`, aa: `à ${casa}`,
  desta: `desta ${casa}`, esta: `esta ${casa}`, Esta: `Esta ${casa}`,
  sua: `a sua ${casa}`, tua: `a tua ${casa}`, Tua: `A tua ${casa}`,
  ela: 'ela', f: 'a',
})
// E masculino (o salão, o estúdio).
const masc = (casa, Casa) => ({
  casa, Casa,
  a: `o ${casa}`, A: `O ${casa}`,
  da: `do ${casa}`, na: `no ${casa}`, pela: `pelo ${casa}`, aa: `ao ${casa}`,
  desta: `deste ${casa}`, esta: `este ${casa}`, Esta: `Este ${casa}`,
  sua: `o seu ${casa}`, tua: `o teu ${casa}`, Tua: `O teu ${casa}`,
  ela: 'ele', f: 'o',
})

// Cada visita/serviço que conta para o cartão e para os packs.
const CORTE = {
  un: 'corte', uns: 'cortes', Un: 'Corte', Uns: 'Cortes',
  umUn: 'um corte', oUn: 'o corte', oTeuUn: 'o teu corte', esteUn: 'Este corte',
  primeiroUn: 'primeiro corte', proximoUn: 'próximo corte', OProximoUn: 'O próximo corte',
  premio: 'Corte grátis', feitoUn: 'Corte feito',
}
const SESSAO = {
  un: 'sessão', uns: 'sessões', Un: 'Sessão', Uns: 'Sessões',
  umUn: 'uma sessão', oUn: 'a sessão', oTeuUn: 'a tua sessão', esteUn: 'Esta sessão',
  primeiroUn: 'primeira sessão', proximoUn: 'próxima sessão', OProximoUn: 'A próxima sessão',
  premio: 'Sessão grátis', feitoUn: 'Sessão feita',
}
// No cabeleireiro e no espaço misto diz-se «serviço»: «a cada 10 serviços».
const SERVICO = {
  un: 'serviço', uns: 'serviços', Un: 'Serviço', Uns: 'Serviços',
  umUn: 'um serviço', oUn: 'o serviço', oTeuUn: 'o teu serviço', esteUn: 'Este serviço',
  primeiroUn: 'primeiro serviço', proximoUn: 'próximo serviço', OProximoUn: 'O próximo serviço',
  premio: 'Serviço grátis', feitoUn: 'Serviço feito',
}

export const TIPOS = {
  barbearia: {
    id: 'barbearia', nome: 'Barbearia', curto: 'Barbearia',
    ...fem('barbearia', 'Barbearia'),
    pro: 'barbeiro', pros: 'barbeiros', Pro: 'Barbeiro', Pros: 'Barbeiros',
    oPro: 'o barbeiro', OPro: 'O barbeiro', doPro: 'do barbeiro', aoPro: 'ao barbeiro',
    ...CORTE,
  },
  cabeleireiro: {
    id: 'cabeleireiro', nome: 'Cabeleireiro', curto: 'Cabeleireiro',
    ...masc('salão', 'Salão'),
    pro: 'profissional', pros: 'profissionais', Pro: 'Profissional', Pros: 'Profissionais',
    oPro: 'o salão', OPro: 'O salão', doPro: 'do salão', aoPro: 'ao salão',
    ...SERVICO,
  },
  unhas: {
    id: 'unhas', nome: 'Unhas, sobrancelhas e pestanas', curto: 'Unhas',
    ...masc('estúdio', 'Estúdio'),
    pro: 'profissional', pros: 'profissionais', Pro: 'Profissional', Pros: 'Profissionais',
    oPro: 'o estúdio', OPro: 'O estúdio', doPro: 'do estúdio', aoPro: 'ao estúdio',
    ...SESSAO,
  },
  estetica: {
    id: 'estetica', nome: 'Estética', curto: 'Estética',
    ...masc('salão', 'Salão'),
    pro: 'esteticista', pros: 'esteticistas', Pro: 'Esteticista', Pros: 'Esteticistas',
    oPro: 'o salão', OPro: 'O salão', doPro: 'do salão', aoPro: 'ao salão',
    ...SESSAO,
  },
  // Dois tipos no mesmo espaço. As palavras neutras, para quando ainda não
  // se escolheu um lado (o resumo, as definições, a subscrição).
  misto: {
    id: 'misto', nome: 'Dois tipos no mesmo espaço', curto: 'Misto',
    ...masc('espaço', 'Espaço'),
    pro: 'profissional', pros: 'profissionais', Pro: 'Profissional', Pros: 'Profissionais',
    oPro: 'o espaço', OPro: 'O espaço', doPro: 'do espaço', aoPro: 'ao espaço',
    ...SERVICO,
  },
}

/** Os tipos puros — os que podem ser um lado de um espaço misto. */
export const LISTA_TIPOS = ['barbearia', 'cabeleireiro', 'unhas', 'estetica']
/** Os tipos todos, para escolher (super admin, /comecar, definições). */
export const LISTA_TIPOS_TODOS = [...LISTA_TIPOS, 'misto']

let _tipo = 'barbearia'
let _lados = []
let _lado = null

/** Chamado quando se lê a conta. Um tipo desconhecido vale barbearia. */
export function definirNicho(tipo, lados) {
  _tipo = TIPOS[tipo] ? tipo : 'barbearia'
  _lados = _tipo === 'misto' && Array.isArray(lados) ? lados.filter(t => LISTA_TIPOS.includes(t)) : []
  if (_lado && !_lados.includes(_lado)) _lado = null
}

/** As palavras do negócio que está aberto — ou do lado escolhido, num misto. */
export function n() { return (_tipo === 'misto' && _lado) ? TIPOS[_lado] : TIPOS[_tipo] }

/** As palavras de um tipo concreto (super admin, ou antes de gravar). */
export function nDe(tipo) { return TIPOS[tipo] || TIPOS.barbearia }

export const tipoActual = () => _tipo
export const eMisto = () => _tipo === 'misto' && _lados.length > 1

/** Os lados do espaço misto (ids de tipos); vazio quando não é misto. */
export const lados = () => _lados
/** O lado aberto agora, ou null (ainda não se escolheu / não é misto). */
export const ladoActual = () => _lado
/** Escolher o lado. Um lado que não existe limpa a escolha. */
export function definirLado(lado) { _lado = _lados.includes(lado) ? lado : null }

/**
 * Este serviço ou profissional é do lado aberto? Sem lado marcado é dos
 * dois; sem lado aberto (ou num negócio que não é misto) é de todos.
 */
export const doLado = (item, lado = _lado) =>
  !lado || !item || !item.lado || item.lado === 'ambos' || item.lado === lado

/** O nome curto de um lado para botões: «Barbearia», «Estética». */
export const nomeDoLado = lado => (TIPOS[lado] ? TIPOS[lado].curto : '')
