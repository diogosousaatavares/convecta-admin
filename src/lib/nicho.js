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

export const TIPOS = {
  barbearia: {
    id: 'barbearia', nome: 'Barbearia',
    ...fem('barbearia', 'Barbearia'),
    pro: 'barbeiro', pros: 'barbeiros', Pro: 'Barbeiro', Pros: 'Barbeiros',
    oPro: 'o barbeiro', OPro: 'O barbeiro', doPro: 'do barbeiro', aoPro: 'ao barbeiro',
    ...CORTE,
  },
  cabeleireiro: {
    id: 'cabeleireiro', nome: 'Cabeleireiro',
    ...masc('salão', 'Salão'),
    pro: 'profissional', pros: 'profissionais', Pro: 'Profissional', Pros: 'Profissionais',
    oPro: 'o salão', OPro: 'O salão', doPro: 'do salão', aoPro: 'ao salão',
    ...SESSAO,
    // No cabeleireiro diz-se «serviço»: «a cada 10 serviços».
    un: 'serviço', uns: 'serviços', Un: 'Serviço', Uns: 'Serviços',
    umUn: 'um serviço', oUn: 'o serviço', oTeuUn: 'o teu serviço', esteUn: 'Este serviço',
    primeiroUn: 'primeiro serviço', proximoUn: 'próximo serviço', OProximoUn: 'O próximo serviço',
    premio: 'Serviço grátis', feitoUn: 'Serviço feito',
  },
  unhas: {
    id: 'unhas', nome: 'Unhas, sobrancelhas e pestanas',
    ...masc('estúdio', 'Estúdio'),
    pro: 'profissional', pros: 'profissionais', Pro: 'Profissional', Pros: 'Profissionais',
    oPro: 'o estúdio', OPro: 'O estúdio', doPro: 'do estúdio', aoPro: 'ao estúdio',
    ...SESSAO,
  },
  estetica: {
    id: 'estetica', nome: 'Estética',
    ...masc('salão', 'Salão'),
    pro: 'esteticista', pros: 'esteticistas', Pro: 'Esteticista', Pros: 'Esteticistas',
    oPro: 'o salão', OPro: 'O salão', doPro: 'do salão', aoPro: 'ao salão',
    ...SESSAO,
  },
}

export const LISTA_TIPOS = ['barbearia', 'cabeleireiro', 'unhas', 'estetica']

let _tipo = 'barbearia'

/** Chamado quando se lê a conta. Um tipo desconhecido vale barbearia. */
export function definirNicho(tipo) { _tipo = TIPOS[tipo] ? tipo : 'barbearia' }

/** As palavras do negócio que está aberto. */
export function n() { return TIPOS[_tipo] }

/** As palavras de um tipo concreto (super admin, ou antes de gravar). */
export function nDe(tipo) { return TIPOS[tipo] || TIPOS.barbearia }

export const tipoActual = () => _tipo
