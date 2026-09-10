import React from 'react';

/*
 * Rede de segurança à volta da app inteira.
 *
 * O React, quando um componente rebenta a desenhar, desmonta a árvore toda.
 * Sem ninguém a apanhar o erro o que fica é um ecrã em branco — e a app só
 * volta com um refresh. Era isto que estava a acontecer ao mudar de aba: a
 * página não travava, morria em silêncio.
 *
 * Há dois casos distintos aqui dentro:
 *
 * 1. Um pedaço da app que já não existe. Cada publicação gera ficheiros com
 *    nomes novos; quem tinha a app aberta ficou com a lista antiga na mão e,
 *    ao abrir uma secção que ainda não tinha carregado, pede um ficheiro que
 *    já foi apagado. Não é um defeito: é ter a app aberta durante uma
 *    actualização. Recarrega-se sozinho, uma vez.
 *
 * 2. Um erro a sério. Aí recarregar não resolve nada e voltaria a partir no
 *    mesmo sítio, num ciclo. Mostra-se o que se sabe e deixa-se a decisão a
 *    quem está a ver.
 */

const CHAVE_RECARGA = 'convecta_recarga_versao';

function eVersaoAntiga(erro) {
  const m = `${erro?.name || ''} ${erro?.message || ''}`;
  return /ChunkLoadError|Loading chunk|dynamically imported module|Importing a module script failed|Failed to fetch/i.test(m);
}

export default class Blindagem extends React.Component {
  constructor(props) {
    super(props);
    this.state = { erro: null };
  }

  static getDerivedStateFromError(erro) { return { erro }; }

  componentDidCatch(erro, info) {
    console.error('[convecta] a app parou:', erro, info?.componentStack);

    if (eVersaoAntiga(erro)) {
      // Uma vez e só uma. Se recarregar não chegou, o problema é outro e um
      // ciclo de recargas é pior do que o ecrã de erro.
      let jaTentou = false;
      try { jaTentou = sessionStorage.getItem(CHAVE_RECARGA) === '1'; } catch { /* sem storage */ }
      if (!jaTentou) {
        try { sessionStorage.setItem(CHAVE_RECARGA, '1'); } catch { /* sem storage */ }
        window.location.reload();
      }
    }
  }

  componentDidMount() {
    // Chegou aqui inteiro: a próxima falha de versão pode voltar a recarregar.
    try { sessionStorage.removeItem(CHAVE_RECARGA); } catch { /* sem storage */ }
  }

  render() {
    if (!this.state.erro) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, background: 'var(--bg, #0A0807)', color: 'var(--text, #EDE8DF)',
        fontFamily: 'system-ui, -apple-system, sans-serif', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 380 }}>
          <div style={{ fontSize: 19, fontWeight: 600, marginBottom: 10 }}>
            Alguma coisa correu mal aqui
          </div>
          <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--text-sec, #8A8272)', margin: '0 0 20px' }}>
            Não foi por sua causa. Volte a carregar a página — normalmente é
            quanto basta.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '13px 22px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'var(--gold, #C9A227)', color: '#100E0B',
              fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
            }}>
            Voltar a carregar
          </button>
          <div style={{ marginTop: 18, fontSize: 11.5, color: 'var(--text-ter, #524F49)', wordBreak: 'break-word' }}>
            {String(this.state.erro?.message || this.state.erro).slice(0, 160)}
          </div>
        </div>
      </div>
    );
  }
}
