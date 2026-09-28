import React from 'react';

/*
 * As caixas amarelas de explicacao — tiradas a 28/09/2026, a pedido do Diogo.
 *
 * Apareciam no topo de quase todas as paginas, com tres linhas a explicar
 * para que servia aquele ecra e um "Ligado a: ..." com os modulos
 * relacionados. Eram texto escrito para quem construiu o painel, nao para
 * quem o usa: um barbeiro que abre a Caixa quer abrir a caixa, nao ler um
 * paragrafo sobre fundo de maneio.
 *
 * O componente fica — com o nome e a assinatura de sempre — porque e
 * chamado em dezenas de paginas. Passa a nao desenhar nada. Assim nao ha
 * dezenas de ficheiros a mexer nem imports a partir, e se um dia se quiser
 * uma ajuda a serio (uma so frase, atras de um "?"), e aqui que se faz.
 *
 * O texto antigo esta no historico do git, no commit que o tirou.
 */
export default function PageInfo() {
  return null;
}
