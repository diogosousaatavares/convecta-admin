/**
 * Etiquetas das tabelas no telemovel.
 *
 * No telemovel cada linha da tabela vira um cartao (ver index.css). Para o
 * cartao fazer sentido, cada celula precisa de saber a que coluna pertence.
 * Este ficheiro copia o texto do cabecalho (<th>) para data-label de cada
 * <td>, respeitando colspan. Nao mexe no HTML das paginas: corre sozinho.
 */

function textoDoCabecalho(th) {
  const t = (th.textContent || '').replace(/\s+/g, ' ').trim();
  // cabecalhos ordenaveis trazem setas/simbolos colados ao texto
  return t.replace(/[↑↓▲▼↕]/g, '').trim();
}

function rotularTabela(tabela) {
  const cabecalho = tabela.tHead && tabela.tHead.rows.length
    ? tabela.tHead.rows[tabela.tHead.rows.length - 1]
    : null;
  if (!cabecalho) return;

  const titulos = [];
  for (const th of cabecalho.cells) {
    const texto = textoDoCabecalho(th);
    const largura = th.colSpan || 1;
    for (let i = 0; i < largura; i += 1) titulos.push(texto);
  }

  const corpos = [tabela.tBodies[0], tabela.tFoot].filter(Boolean);
  for (const corpo of corpos) {
    for (const linha of corpo.rows) {
      let coluna = 0;
      for (const celula of linha.cells) {
        if (celula.tagName === 'TD') {
          const titulo = titulos[coluna] || '';
          if (celula.getAttribute('data-label') !== titulo) {
            celula.setAttribute('data-label', titulo);
          }
        }
        coluna += celula.colSpan || 1;
      }
    }
  }
}

export function rotularTabelas(raiz) {
  const alvo = raiz || document;
  if (!alvo.querySelectorAll) return;
  alvo.querySelectorAll('table.table').forEach(rotularTabela);
}

/**
 * Fica a vigiar a zona do painel e volta a rotular sempre que o React
 * desenha tabelas novas. Devolve uma funcao para parar.
 */
export function vigiarTabelas(alvo) {
  if (!alvo || typeof MutationObserver === 'undefined') return () => {};

  let agendado = false;
  const correr = () => {
    agendado = false;
    rotularTabelas(alvo);
  };
  const agendar = () => {
    if (agendado) return;
    agendado = true;
    if (typeof window !== 'undefined' && window.requestAnimationFrame) {
      window.requestAnimationFrame(correr);
    } else {
      setTimeout(correr, 0);
    }
  };

  agendar();
  const observador = new MutationObserver(agendar);
  observador.observe(alvo, { childList: true, subtree: true });
  return () => observador.disconnect();
}
