/*
 * Modulos que ainda nao guardam nada.
 *
 * O painel foi desenhado inteiro antes de ter base de dados por tras. Estes
 * ecras funcionam — escreve-se, aparece na lista — mas vivem so na memoria do
 * separador: um refresh e desapareceu tudo. Nao ha aqui `persist()` nenhum.
 *
 * Um modulo que aceita trabalho e o perde e pior do que um modulo que nao
 * existe: o barbeiro confia, escreve trinta produtos, volta no dia seguinte e
 * pensa que a culpa foi dele. Enquanto nao gravarem, ficam escondidos.
 *
 * Para voltar a ligar um, apaga a linha. Nao ha mais nada espalhado por lado
 * nenhum: o menu e as rotas leem daqui.
 */
export const MODULOS_POR_ACABAR = [
  // Comandas — data.comandas so existe em memoria
  '/admin/comandas',
  // Subscricoes — planos, subscritores e pagamentos so em memoria
  '/admin/subscricoes',
  // Promocoes e cupoes — data.promotions so em memoria
  '/admin/promocoes',
  '/admin/marketing',
  // Fidelizacao: o cartao e os carimbos funcionam (vao em customers.metadata).
  // Estes dois nao: os movimentos e as recompensas ficam em memoria.
  '/admin/fidelizacao/pontos',
  '/admin/fidelizacao/recompensas',
  // Categorias de servicos — data.typologies em memoria
  '/admin/servicos/categorias',
  '/admin/tipos',
];

// Um caminho esta indisponivel se for um dos de cima ou estiver por baixo de um.
export function moduloIndisponivel(caminho) {
  if (!caminho) return false;
  return MODULOS_POR_ACABAR.some(m => caminho === m || caminho.startsWith(m + '/'));
}
