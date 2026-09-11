import React, { useEffect, useLayoutEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/*
 * O tutorial da demonstracao.
 *
 * Uma sequencia de passos. Cada passo leva a uma pagina, aponta para um
 * elemento (por data-tour="...") e diz uma frase. Quem experimenta um produto
 * sozinho nao sabe para onde olhar; isto e o dedo de quem esta ao lado a dizer
 * "ve aqui".
 *
 * Nao e uma biblioteca: e um rectangulo com uma sombra a volta e um cartao em
 * baixo. Fica assim de proposito — e o que ha de mais simples que ainda faz o
 * trabalho, e nao traz 60 KB de dependencia para uma coisa que se ve uma vez.
 *
 * passos: [{ rota, alvo, titulo, texto }]
 * chave:  nome da entrada em localStorage que diz "ja viu"
 */
export default function TourDemo({ passos = [], chave = 'convecta_tour', ativo = true, aoTerminar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [i, setI] = useState(() => {
    try { return localStorage.getItem(chave) === 'feito' ? -1 : 0; } catch { return 0; }
  });
  const [rect, setRect] = useState(null);
  const passo = i >= 0 ? passos[i] : null;

  // Ir para a pagina do passo, se nao estivermos la.
  useEffect(() => {
    if (!ativo || !passo) return;
    if (passo.rota && location.pathname !== passo.rota) navigate(passo.rota);
  }, [ativo, passo, location.pathname, navigate]);

  // Medir o elemento apontado. O scroll ate ele faz-se UMA vez, ao entrar no
  // passo; depois so se volta a medir sem mexer na pagina. Fazer scroll dentro
  // da medicao e medir a cada scroll era um ciclo que encravava o guia.
  useLayoutEffect(() => {
    if (!ativo || !passo) { setRect(null); return; }
    let vivo = true;
    let tentativas = 0;
    let raf = 0;
    let t = 0;
    const alvo = () => (passo.alvo ? document.querySelector(`[data-tour="${passo.alvo}"]`) : null);
    const medirSemMexer = () => {
      if (!vivo) return;
      const el = alvo();
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top - 6, left: r.left - 6, width: r.width + 12, height: r.height + 12 });
    };
    const entrar = () => {
      if (!vivo) return;
      const el = alvo();
      if (!el) {
        setRect(null);
        if (tentativas++ < 25) t = setTimeout(entrar, 150);   // a pagina ainda esta a desenhar-se
        return;
      }
      const r = el.getBoundingClientRect();
      const foraDoEcra = r.top < 70 || r.bottom > window.innerHeight - 220;
      if (foraDoEcra) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        t = setTimeout(medirSemMexer, 450);   // espera o scroll acabar e mede uma vez
      } else {
        medirSemMexer();
      }
    };
    entrar();
    const re = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(medirSemMexer); };
    window.addEventListener('resize', re);
    window.addEventListener('scroll', re, true);
    return () => { vivo = false; clearTimeout(t); cancelAnimationFrame(raf); window.removeEventListener('resize', re); window.removeEventListener('scroll', re, true); };
  }, [ativo, passo, location.pathname]);

  if (!ativo || !passo) return null;

  const terminar = () => {
    try { localStorage.setItem(chave, 'feito'); } catch {}
    setI(-1);
    aoTerminar?.();
  };
  const seguinte = () => (i + 1 < passos.length ? setI(i + 1) : terminar());
  const anterior = () => setI(Math.max(0, i - 1));
  const ultimo = i + 1 === passos.length;

  return (
    <>
      {/* Enquanto o guia esta aberto, a pagina por baixo nao recebe toques.
          O guia e para ver; a unica coisa que se carrega e Seguinte, Anterior
          ou Saltar. Um toque fora do cartao abria coisas a meio do passo. */}
      <div aria-hidden="true" onClick={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}
        style={{ position: 'fixed', inset: 0, zIndex: 1099, background: 'transparent', touchAction: 'none' }} />

      {/* O foco: um rectangulo transparente com uma sombra enorme a volta.
          Sem elemento, fica so a sombra a escurecer a pagina. */}
      <div aria-hidden="true" style={{
        position: 'fixed', zIndex: 1100, pointerEvents: 'none', borderRadius: 12,
        boxShadow: '0 0 0 9999px rgba(0,0,0,.62), 0 0 0 2px var(--gold, #C9A227)',
        transition: 'top .25s ease, left .25s ease, width .25s ease, height .25s ease',
        ...(rect ? rect : { top: '50%', left: '50%', width: 0, height: 0, boxShadow: '0 0 0 9999px rgba(0,0,0,.62)' }),
      }} />

      <div role="dialog" aria-live="polite" style={{
        position: 'fixed', zIndex: 1101, left: 16, right: 16, bottom: 'max(16px, env(safe-area-inset-bottom))',
        margin: '0 auto', maxWidth: 440,
        background: 'var(--surface, #16130F)', border: '1px solid var(--border, #2A2620)',
        borderRadius: 16, padding: '18px 20px', boxShadow: '0 18px 50px rgba(0,0,0,.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--gold, #C9A227)' }}>
            Passo {i + 1} de {passos.length}
          </span>
          <button type="button" onClick={terminar}
            style={{ background: 'none', border: 0, color: 'var(--text-ter, #5E584B)', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', padding: 4 }}>
            Saltar
          </button>
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text, #EDE8DF)', marginBottom: 6, fontFamily: 'var(--font-head, inherit)' }}>{passo.titulo}</div>
        <div style={{ fontSize: 14, color: 'var(--text-sec, #8A8272)', lineHeight: 1.55 }}>{passo.texto}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          {i > 0 && (
            <button type="button" onClick={anterior}
              style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border, #2A2620)', background: 'transparent',
                color: 'var(--text-sec, #8A8272)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Anterior
            </button>
          )}
          <button type="button" onClick={seguinte}
            style={{ padding: '10px 18px', borderRadius: 10, border: 0, background: 'var(--gold, #C9A227)',
              color: '#0A0804', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {ultimo ? 'Concluir' : 'Seguinte'}
          </button>
        </div>
      </div>
    </>
  );
}
