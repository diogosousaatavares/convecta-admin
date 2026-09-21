import React from 'react';

/*
 * O símbolo MB (MULTIBANCO / MB WAY), na cor do texto à volta.
 *
 * É uma imagem usada como máscara: a forma vem de /mb-icon.png e a cor de
 * `currentColor`, por isso fica branca no menu escuro, escura num fundo
 * claro, e dourada se o item estiver ativo — sem desenhar o logótipo à mão.
 */
export default function MbIcon({ size = 18, style, className = '' }) {
  const mascara = 'url(/mb-icon.png) center / contain no-repeat';
  return (
    <span aria-hidden="true" className={className}
      style={{
        display: 'inline-block', width: size, height: size, flexShrink: 0,
        background: 'currentColor', WebkitMask: mascara, mask: mascara,
        verticalAlign: 'middle',
        ...style,
      }} />
  );
}
