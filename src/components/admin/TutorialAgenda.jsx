import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/*
 * O TUTORIAL DA AGENDA (15/10/2026, à Fresha).
 *
 * Três gestos, cada um mostrado numa agenda de brincar com uma mão a fazer
 * o gesto: tocar numa hora livre, tocar numa marcação, mudar de dia. Só diz
 * o que a agenda faz mesmo. Aparece uma vez, na primeira abertura da
 * agenda; «Saltar» ou «Concluído» guardam que já se viu.
 */
const CHAVE = 'convecta_tutorial_agenda';
export const jaViuTutorialAgenda = () => { try { return localStorage.getItem(CHAVE) === 'feito'; } catch { return true; } };

const PASSOS = [
  { id: 'tocar', titulo: 'Marcar numa hora livre',
    texto: <><b>Toca numa hora livre</b> da agenda para criar uma marcação ou bloquear esse tempo.</> },
  { id: 'abrir', titulo: 'Abrir uma marcação',
    texto: <><b>Toca numa marcação</b> para confirmar, ver o cliente ou fechar a conta.</> },
  { id: 'dia', titulo: 'Mudar de dia',
    texto: <><b>Toca nos dias</b> da faixa de cima, ou nas setas, para ver outro dia.</> },
  { id: 'defs', titulo: 'A tua agenda, à tua maneira',
    texto: <><b>Toca na engrenagem</b> para escolher se as horas abrem certas (09:00, 10:00) ou encostadas umas às outras, e até quando o cliente pode marcar.</> },
];

function Mao({ className }) {
  return (
    <svg className={`tt-mao ${className || ''}`} viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">
      <path d="M18 44c-5 0-9-3-11-8l-4-9c-1-2 1-4 3-3l5 4V10a3 3 0 0 1 6 0v12h2v-8a3 3 0 0 1 6 0v8h2v-5a3 3 0 0 1 6 0v5h2v-2a3 3 0 0 1 6 0v12c0 7-5 12-12 12h-11z" fill="#fff" stroke="#1a1a1a" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function Cena({ passo }) {
  return (
    <div className={`tt-cena tt-${passo}`} aria-hidden="true">
      <div className="tt-topo"><span className="tt-eng" aria-hidden="true">⚙</span></div>
      <div className="tt-dias">
        {['seg 13', 'ter 14', 'qua 15', 'qui 16', 'sex 17'].map((d, i) => (
          <span key={d} className={i === 2 ? 'on' : ''}>{d}</span>
        ))}
      </div>
      <div className="tt-grelha">
        {['09:00', '10:00', '11:00', '12:00'].map(h => <div key={h} className="tt-linha"><span>{h}</span></div>)}
        <div className="tt-card tt-laranja" style={{ top: 8 }}><small>09:00 – 10:00</small><b>Rui Costa</b><span>Corte</span></div>
        <div className="tt-card tt-azul tt-nova" style={{ top: 92 }}><small>10:00 – 10:30</small><b>Nova marcação</b></div>
        <div className="tt-card tt-cinza" style={{ top: 176 }}><small>11:00 – 12:00</small><b>Almoço</b></div>
      </div>
      <Mao />
    </div>
  );
}

export default function TutorialAgenda({ aoTerminar }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = antes; };
  }, []);
  const terminar = () => { try { localStorage.setItem(CHAVE, 'feito'); } catch {} aoTerminar?.(); };
  const p = PASSOS[i];
  const ultimo = i === PASSOS.length - 1;

  return createPortal(
    <div className="tt" role="dialog" aria-modal="true" aria-label="Como usar a agenda">
      <style>{CSS}</style>
      <div className="tt-caixa">
      <button type="button" className="tt-saltar" onClick={terminar}>Saltar</button>
      <Cena passo={p.id} key={p.id} />
      <div className="tt-texto">
        <div className="tt-pontos">{PASSOS.map((x, k) => <span key={x.id} className={k === i ? 'on' : ''} />)}</div>
        <h2>{p.titulo}</h2>
        <p>{p.texto}</p>
        <button type="button" className="tt-btn" onClick={() => (ultimo ? terminar() : setI(i + 1))}>
          {ultimo ? 'Concluído' : 'Seguinte'}
        </button>
      </div>
      </div>
    </div>,
    document.body,
  );
}

const CSS = `
/* No telemóvel ocupa o ecrã; no computador é uma caixa no meio, com a
   agenda a sério escurecida por trás. */
.tt { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,.55); color: #fff; display: flex; align-items: center; justify-content: center; padding: 0; box-sizing: border-box; }
.tt-caixa { position: relative; width: 100%; height: 100%; background: #141414; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 20px calc(24px + env(safe-area-inset-bottom, 0px)); box-sizing: border-box; }
@media (min-width: 768px) { .tt-caixa { width: 440px; height: auto; border-radius: 22px; padding: 56px 28px 32px; box-shadow: 0 30px 80px rgba(0,0,0,.6); } }
.tt-saltar { position: absolute; top: calc(14px + env(safe-area-inset-top, 0px)); right: 16px; background: none; border: 0; color: #bbb; font: inherit; font-size: 15px; font-weight: 600; cursor: pointer; padding: 8px; }
.tt-cena { position: relative; width: 340px; max-width: 100%; height: 300px; flex-shrink: 0; border-radius: 16px; background: #1f1f1f; overflow: hidden; border: 1px solid #2c2c2c; }
.tt-dias { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; padding: 10px 10px 6px; }
.tt-dias span { font-size: 11px; color: #999; text-align: center; padding: 6px 0; border-radius: 8px; }
.tt-dias span.on { background: #FEE96D; color: #1a1a1a; font-weight: 700; }
.tt-grelha { position: relative; margin: 4px 10px 0 10px; }
.tt-linha { height: 84px; border-top: 1px solid #2e2e2e; position: relative; }
.tt-linha span { position: absolute; left: 0; top: 4px; font-size: 10px; color: #777; }
.tt-card { position: absolute; left: 44px; right: 6px; border-radius: 8px; padding: 6px 8px; display: flex; flex-direction: column; gap: 1px; color: #1a1a1a; }
.tt-card small { font-size: 9.5px; opacity: .8; } .tt-card b { font-size: 12px; } .tt-card span { font-size: 10.5px; opacity: .85; }
.tt-laranja { background: #F6B26B; height: 72px; }
.tt-azul { background: #9FD6F2; height: 30px; opacity: 0; }
.tt-cinza { background: #d9d9d9; height: 72px; }
.tt-mao { position: absolute; left: 44%; top: 50%; filter: drop-shadow(0 4px 8px rgba(0,0,0,.5)); }
.tt-texto { width: min(100%, 360px); text-align: center; margin-top: 26px; }
.tt-pontos { display: flex; justify-content: center; gap: 6px; margin-bottom: 14px; }
.tt-pontos span { width: 6px; height: 6px; border-radius: 6px; background: #444; } .tt-pontos span.on { background: #fff; width: 18px; }
.tt-texto h2 { font-size: 22px; font-weight: 700; margin: 0 0 8px; }
.tt-texto p { font-size: 15px; line-height: 1.5; color: #cfcfcf; margin: 0 0 22px; }
.tt-btn { min-width: 140px; padding: 13px 28px; border-radius: 999px; border: 0; background: #fff; color: #1a1a1a; font: inherit; font-size: 15px; font-weight: 700; cursor: pointer; }
/* 1. tocar numa hora livre: a mão desce, toca, aparece a marcação azul */
.tt-tocar .tt-mao { animation: tt-toca 2.6s ease-in-out infinite; left: 44%; top: 50%; }
.tt-tocar .tt-nova { animation: tt-aparece 2.6s ease-in-out infinite; }
@keyframes tt-toca { 0%,15% { transform: translateY(40px) scale(1); opacity: 0 } 30% { transform: translateY(0) scale(1); opacity: 1 } 40% { transform: translateY(0) scale(.85) } 50% { transform: translateY(0) scale(1) } 85% { opacity: 1 } 100% { opacity: 0 } }
@keyframes tt-aparece { 0%,42% { opacity: 0; transform: scale(.9) } 50%,100% { opacity: 1; transform: scale(1) } }
/* 2. abrir uma marcação: toca no cartão laranja, que pisca */
.tt-abrir .tt-mao { animation: tt-toca 2.6s ease-in-out infinite; left: 42%; top: 21%; }
.tt-abrir .tt-laranja { animation: tt-pisca 2.6s ease-in-out infinite; }
@keyframes tt-pisca { 0%,40% { box-shadow: none } 48% { box-shadow: 0 0 0 3px #fff } 60%,100% { box-shadow: none } }
/* 3. mudar de dia: toca na quinta e a faixa muda */
.tt-dia .tt-mao { animation: tt-toca 2.6s ease-in-out infinite; left: 60%; top: 3%; }
.tt-dia .tt-dias span:nth-child(3) { animation: tt-sai 2.6s ease-in-out infinite; }
.tt-dia .tt-dias span:nth-child(4) { animation: tt-entra 2.6s ease-in-out infinite; }
@keyframes tt-sai { 0%,45% { background: #FEE96D; color: #1a1a1a } 55%,100% { background: transparent; color: #999 } }
@keyframes tt-entra { 0%,45% { background: transparent; color: #999 } 55%,100% { background: #FEE96D; color: #1a1a1a; font-weight: 700 } }
.tt-topo { display: flex; justify-content: flex-end; padding: 8px 10px 0; }
.tt-eng { width: 26px; height: 26px; border-radius: 8px; border: 1px solid #ccc; display: grid; place-items: center; font-size: 15px; color: #444; background: #fff; }
/* 4. a engrenagem: toca nela e ela pisca */
.tt-defs .tt-mao { animation: tt-toca 2.6s ease-in-out infinite; left: 78%; top: -2%; }
.tt-defs .tt-eng { animation: tt-pisca 2.6s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .tt * { animation: none !important } .tt-azul { opacity: 1 } }
`;
