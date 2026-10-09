import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronLeft, RotateCw, MoreHorizontal, Share, PlusSquare, Download, X, AlignLeft } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { emModoAplicacao } from '@/lib/push';
import { DOMINIO_BASE } from '@/lib/designService';

/*
 * «Guarda o painel no ecrã principal» — o tutorial.
 *
 * Porque é que importa: no iPhone as notificações SÓ funcionam com o painel
 * guardado no ecrã principal e aberto a partir do ícone. No Android funcionam
 * no browser, mas instalado é o que o barbeiro abre todos os dias. Sem isto,
 * uma marcação nova não toca no telemóvel — e o barbeiro acha que a app não
 * funciona.
 *
 * ── Porque é que deixou de ser uma lista de frases ───────────────────────
 *
 * Eram quatro passos escritos: «toca no botão Partilhar — o quadrado com a
 * seta para cima, em baixo no Safari». Quem sabe o que é esse botão não
 * precisa da frase; quem não sabe, não o encontra com ela. O que resolve é
 * MOSTRAR: um desenho da barra do Safari com o botão aceso, e outro da linha
 * que ele tem de escolher na lista. Duas imagens e duas frases curtas.
 *
 * Os desenhos são feitos aqui, com caixas e ícones — nenhuma captura de ecrã.
 * Uma captura envelhece com o iOS e fica a mentir; isto acompanha o tema do
 * painel e nunca fica desactualizado de cor.
 *
 * Abre sozinho ao entrar no painel, no telemóvel, depois do «Bem-vindo» — e
 * abre também pela faixa preta do topo, que lhe manda o aviso
 * `convecta-guardar-ecra`. «Depois» esconde-o até ao dia seguinte; com o
 * painel já instalado, nunca aparece.
 */

const ehIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const ehAndroid = () => /Android/i.test(navigator.userAgent);
const CHAVE = 'convecta_guardar_ecra_adiado';
const hoje = () => new Date().toISOString().slice(0, 10);

// O Chrome do Android oferece a instalação num evento que só chega uma vez:
// guarda-se logo ao carregar a página, para o botão «Instalar agora».
let pedidoInstalar = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); pedidoInstalar = e; });
}

export default function GuardarNoEcra() {
  const data = useStore();
  const location = useLocation();
  const negocio = data?.business;
  const id = negocio?.id;
  const [aberto, setAberto] = useState(false);
  const [podeInstalar, setPodeInstalar] = useState(false);

  /* Aberto à mão, pela faixa do topo: aqui não se pergunta nada — se ele
     tocou, é porque quer ver. */
  useEffect(() => {
    const abrir = () => { setPodeInstalar(!!pedidoInstalar); setAberto(true); };
    window.addEventListener('convecta-guardar-ecra', abrir);
    return () => window.removeEventListener('convecta-guardar-ecra', abrir);
  }, []);

  useEffect(() => {
    if (!id || location.pathname !== '/admin') return;
    if (emModoAplicacao() || !(ehIOS() || ehAndroid())) return;
    try { if (localStorage.getItem(CHAVE) === hoje()) return; } catch { /* segue */ }
    // Espera que o «Bem-vindo» tenha sido visto, para não abrir por cima dele.
    const t = setInterval(() => {
      let visto = true;
      try { visto = !!localStorage.getItem(`convecta_bemvindo_${id}`); } catch { visto = true; }
      if (visto) { clearInterval(t); setPodeInstalar(!!pedidoInstalar); setAberto(true); }
    }, 800);
    return () => clearInterval(t);
  }, [id, location.pathname]);

  /* Enquanto está aberto, a página por trás fica parada. A condição é a
     mesma que decide se ele se desenha — um efeito corre antes do return, e
     trancar o scroll sem nada por cima deixa a página presa sem explicação. */
  useEffect(() => {
    if (!aberto) return;
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = antes; };
  }, [aberto]);

  if (!aberto) return null;

  const adiar = () => { try { localStorage.setItem(CHAVE, hoje()); } catch { /* segue */ } setAberto(false); };
  const instalar = async () => {
    if (!pedidoInstalar) return;
    pedidoInstalar.prompt();
    const r = await pedidoInstalar.userChoice.catch(() => null);
    pedidoInstalar = null;
    if (r?.outcome === 'accepted') setAberto(false);
  };

  const iOS = ehIOS();
  const endereco = negocio?.domain || (negocio?.slug ? `${negocio.slug}.${DOMINIO_BASE}` : 'marcacoes.app');
  const naoEhSafari = iOS && !/Safari/i.test(navigator.userAgent.replace(/CriOS|FxiOS|EdgiOS/g, ''));

  return (
    <div className="gne-fundo" role="dialog" aria-modal="true" aria-labelledby="gne-titulo">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="gne">
        <button className="gne-x" onClick={adiar} aria-label="Fechar"><X size={20} /></button>

        <h2 id="gne-titulo" className="gne-h">Adicionar ao ecrã principal</h2>

        {iOS ? (
          <>
            <p className="gne-p">Abre o menu de partilha, na barra de baixo do Safari.</p>

            {/* A barra do Safari, desenhada. O botão que ele tem de tocar
                fica aceso; o resto fica esbatido, para o olho ir lá direito. */}
            <div className="gne-desenho">
              <div className="gne-barra">
                <span className="gne-redondo"><ChevronLeft size={18} /></span>
                <span className="gne-redondo"><AlignLeft size={16} /></span>
                <span className="gne-url">{endereco}</span>
                <span className="gne-redondo"><RotateCw size={16} /></span>
                <span className="gne-redondo gne-aceso"><MoreHorizontal size={18} /></span>
              </div>
              <div className="gne-folha">
                <div className="gne-opcao gne-aceso-linha"><Share size={18} /> Partilhar</div>
                <div className="gne-opcao gne-meia" aria-hidden="true">Adicionar aos favoritos</div>
              </div>
            </div>

            <p className="gne-p">Desce a lista e escolhe «Adicionar ao ecrã principal».</p>

            <div className="gne-desenho">
              <div className="gne-lista">
                <div className="gne-opcao gne-aceso-linha gne-entre">
                  Adicionar ao ecrã principal
                  <span className="gne-mais"><PlusSquare size={18} /></span>
                </div>
              </div>
            </div>

            <p className="gne-p gne-fim">
              Depois abre o painel <b>pelo ícone novo</b> — é por aí que as notificações tocam.
            </p>
          </>
        ) : (
          <>
            {podeInstalar && (
              <button onClick={instalar} className="gne-btn gne-btn-forte">
                <Download size={17} /> Instalar agora
              </button>
            )}
            <p className="gne-p">{podeInstalar ? 'Ou à mão: toca' : 'Toca'} nos três pontos, em cima à direita no Chrome.</p>

            <div className="gne-desenho">
              <div className="gne-barra">
                <span className="gne-url">{endereco}</span>
                <span className="gne-redondo gne-aceso"><MoreHorizontal size={18} /></span>
              </div>
            </div>

            <p className="gne-p">Escolhe «Instalar aplicação».</p>

            <div className="gne-desenho">
              <div className="gne-lista">
                <div className="gne-opcao gne-aceso-linha gne-entre">
                  Instalar aplicação
                  <span className="gne-mais"><Download size={18} /></span>
                </div>
              </div>
            </div>

            <p className="gne-p gne-fim">
              Depois abre o painel <b>pelo ícone novo</b> — é o que vais abrir todos os dias.
            </p>
          </>
        )}

        {naoEhSafari && (
          <p className="gne-aviso">
            Isto só funciona no <b>Safari</b>. Noutro browser, copia o endereço e abre-o lá.
          </p>
        )}

        <div className="gne-rodape">{endereco}</div>

        <div className="gne-botoes">
          <button onClick={() => setAberto(false)} className="gne-btn gne-btn-forte">Já está</button>
          <button onClick={adiar} className="gne-btn">Depois</button>
        </div>
      </div>
    </div>
  );
}

const CSS = `
.gne-fundo {
  position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,.6);
  display: flex; align-items: flex-end; justify-content: center;
}
.gne {
  position: relative; width: 100%; max-width: 460px; max-height: 92vh; overflow-y: auto;
  background: var(--surface); border: 1px solid var(--border); border-bottom: 0;
  border-radius: 22px 22px 0 0;
  padding: 26px 20px calc(20px + env(safe-area-inset-bottom, 0px));
}
.gne-x {
  position: absolute; top: 14px; right: 14px; width: 34px; height: 34px; border-radius: 999px;
  display: grid; place-items: center; cursor: pointer;
  background: var(--elevated); border: 1px solid var(--border); color: var(--text-sec);
}
.gne-h {
  margin: 0 0 18px; text-align: center; font-size: 21px; font-weight: 700;
  color: var(--gold-tinta); padding: 0 34px;
}
.gne-p { margin: 0 0 14px; font-size: 16.5px; line-height: 1.45; color: var(--text); }
.gne-fim { margin-top: 2px; }
.gne-fim b { font-weight: 700; }

/* ── Os desenhos ────────────────────────────────────────────────────────── */
.gne-desenho {
  margin: 0 0 18px; padding: 14px 12px; border-radius: 14px;
  background: var(--bg); border: 1px solid var(--border); overflow: hidden;
}
.gne-barra {
  display: flex; align-items: center; gap: 7px;
  padding: 7px 8px; border-radius: 999px;
  background: var(--surface); box-shadow: 0 2px 10px rgba(0,0,0,.14);
}
.gne-redondo {
  width: 32px; height: 32px; border-radius: 999px; flex-shrink: 0;
  display: grid; place-items: center; color: var(--text-sec);
}
.gne-url {
  flex: 1; min-width: 0; text-align: center; font-size: 14.5px; font-weight: 700;
  color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
/* O que ele tem de tocar. Igual ao realce do BUK, com a cor desta casa. */
.gne-aceso {
  background: rgba(var(--gold-rgb), .30); color: var(--text);
  box-shadow: 0 0 0 4px rgba(var(--gold-rgb), .16);
}
.gne-folha, .gne-lista {
  margin-top: 12px; padding: 10px; border-radius: 14px 14px 0 0;
  background: var(--surface); box-shadow: 0 -2px 12px rgba(0,0,0,.10);
}
.gne-lista { border-radius: 14px; }
.gne-opcao {
  display: flex; align-items: center; gap: 11px; padding: 11px 12px; border-radius: 9px;
  font-size: 16px; color: var(--text);
}
.gne-entre { justify-content: space-between; }
.gne-aceso-linha { background: rgba(var(--gold-rgb), .22); font-weight: 600; }
.gne-mais {
  width: 34px; height: 34px; border-radius: 999px; flex-shrink: 0;
  display: grid; place-items: center; background: var(--surface);
  box-shadow: 0 0 0 4px rgba(var(--gold-rgb), .16);
}
/* A linha seguinte aparece cortada, como numa folha que continua: diz «ha
   mais lista por baixo» sem precisar de o escrever. */
.gne-meia { opacity: .35; height: 20px; overflow: hidden; padding-top: 0; padding-bottom: 0; }

.gne-aviso {
  margin: 0 0 14px; padding: 11px 13px; border-radius: 11px;
  background: rgba(245,158,11,.12); border: 1px solid rgba(245,158,11,.4);
  font-size: 14.5px; line-height: 1.45; color: var(--text);
}
.gne-rodape {
  margin: 4px 0 16px; padding-top: 14px; border-top: 1px solid var(--border);
  text-align: center; font-size: 14.5px; font-weight: 700; color: var(--text-sec);
  word-break: break-all;
}
.gne-botoes { display: flex; gap: 10px; }
.gne-btn {
  flex: 1; min-height: 50px; border-radius: 999px; cursor: pointer; font: inherit;
  font-size: 16px; font-weight: 700; display: flex; align-items: center;
  justify-content: center; gap: 8px;
  border: 1px solid var(--border); background: transparent; color: var(--text);
}
.gne-btn-forte { background: var(--gold); border-color: var(--gold); color: #100E0B; }
.gne-btn-forte:only-child { width: 100%; margin-bottom: 14px; }
`;
