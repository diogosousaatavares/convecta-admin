import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ExternalLink, CreditCard, X, Check } from 'lucide-react';
import dataService from '@/lib/dataService';
import { DOMINIO_BASE as APPS } from '@/lib/designService';

/*
 * A primeira entrada. Três ecrãs, o ecrã inteiro, uma ideia por ecrã.
 *
 * Um barbeiro acabou de confirmar o email e entrou. Não sabe onde está, não
 * sabe o que já tem, não sabe o que falta. Se o largarmos no dashboard com
 * vinte botões, faz o que toda a gente faz com vinte botões: fecha.
 *
 * Por isso, antes do painel, três frases grandes:
 *
 *   1. «A tua barbearia está no ar.»   — o que ele JÁ tem (e o endereço).
 *   2. «Falta uma coisa: o cartão.»    — o que falta, e o que custa (0 €).
 *   3. «Como queres começar?»          — a decisão, com as duas saídas.
 *
 * Aparece uma vez por barbearia, neste browser. Depois disso é a faixa
 * dourada, em todas as páginas, que lembra — sem voltar a ocupar o ecrã.
 *
 * O que não se faz aqui: prender. Há um «Saltar» no canto desde o primeiro
 * segundo, e o Escape fecha. Quem se sente preso não compra, foge.
 */

const chaveDeMemoria = (id) => `convecta_bemvindo_${id}`;


export default function BemVindo() {
  const navigate = useNavigate();
  const location = useLocation();
  const [negocio, setNegocio] = useState(null);
  const [aberto, setAberto] = useState(false);
  const [ecra, setEcra] = useState(0);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const [s, b] = await Promise.all([dataService.subscricao(), dataService.getBusiness()]);
        if (!vivo || !b?.id) return;
        if (s?.estado !== 'sem_cartao') return;
        let visto = false;
        try { visto = !!localStorage.getItem(chaveDeMemoria(b.id)); } catch { visto = false; }
        if (visto) return;
        setNegocio(b);
        setAberto(true);
      } catch {
        // Se não se conseguir ler, não se mostra. A faixa trata do resto.
      }
    })();
    return () => { vivo = false; };
  }, []);

  const fechar = (destino) => {
    try { if (negocio?.id) localStorage.setItem(chaveDeMemoria(negocio.id), new Date().toISOString()); } catch { /* sem memória, sem drama */ }
    setAberto(false);
    if (destino) navigate(destino);
  };

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e) => { if (e.key === 'Escape') fechar(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  // Na própria página da subscrição não há nada a anunciar: ele já lá está.
  if (!aberto || location.pathname === '/admin/subscricao') return null;

  const endereco = negocio?.slug ? `${negocio.slug}.${APPS}` : null;

  const ECRAS = [
    {
      olho: 'Bem-vindo',
      titulo: <>A tua barbearia<br />está no ar.</>,
      corpo: (
        <>
          <p className="bv-p">Já existe, com o teu nome, num endereço só teu.</p>
          {endereco && (
            <a className="bv-endereco" href={`https://${endereco}`} target="_blank" rel="noreferrer">
              <span>{endereco}</span> <ExternalLink size={16} />
            </a>
          )}
          <ul className="bv-lista">
            <li><Check size={16} /> Agenda, clientes, caixa e comissões — tudo já cá está.</li>
          </ul>
        </>
      ),
      botao: 'Continuar',
    },
    {
      olho: 'Só falta uma coisa',
      titulo: <>Para receber marcações,<br />precisas do cartão.</>,
      corpo: (
        <>
          <p className="bv-p">Com cartão, a agenda abre hoje. <strong>Os primeiros 7 dias são grátis.</strong></p>
          <div className="bv-tempo">
            <div className="bv-tempo-i"><b>Hoje</b><span>0 €</span></div>
            <div className="bv-tempo-i"><b>7 dias</b><span>0 €</span></div>
            <div className="bv-tempo-i"><b>Dia 8</b><span>Primeira cobrança, só se ficares</span></div>
          </div>
          <p className="bv-p bv-mini">Cancelas sozinho, aqui no painel.</p>
        </>
      ),
      botao: 'Percebi',
    },
    {
      olho: 'Como queres começar?',
      titulo: <>Abre a agenda hoje.<br />Decide daqui a 7 dias.</>,
      corpo: (
        <p className="bv-p">Se activares agora, os clientes já marcam esta noite.</p>
      ),
      botao: 'Activar com 7 dias grátis',
      icone: <CreditCard size={18} />,
      destino: '/admin/subscricao',
      secundario: 'Ver primeiro o painel',
    },
  ];

  const e = ECRAS[ecra];
  const ultimo = ecra === ECRAS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        className="bv"
        role="dialog"
        aria-modal="true"
        aria-label="Bem-vindo"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <button type="button" className="bv-saltar" onClick={() => fechar()} aria-label="Saltar a apresentação">
          Saltar <X size={16} />
        </button>

        <div className="bv-pontos" aria-hidden="true">
          {ECRAS.map((_, i) => <span key={i} className={i === ecra ? 'on' : i < ecra ? 'feito' : ''} />)}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={ecra}
            className="bv-conteudo"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
          >
            <div className="bv-olho">{e.olho}</div>
            <h1 className="bv-h1">{e.titulo}</h1>
            {e.corpo}

            <div className="bv-accoes">
              <button
                type="button"
                className="bv-btn"
                onClick={() => (ultimo ? fechar(e.destino) : setEcra(ecra + 1))}
                autoFocus
              >
                {e.icone}{e.botao} <ArrowRight size={18} />
              </button>
              {e.secundario && (
                <button type="button" className="bv-btn-2" onClick={() => fechar()}>
                  {e.secundario}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

const CSS = `
.bv {
  position: fixed; inset: 0; z-index: 9000;
  display: grid; place-items: center;
  padding: max(24px, env(safe-area-inset-top)) 24px max(24px, env(safe-area-inset-bottom));
  background:
    radial-gradient(1100px 600px at 80% -10%, rgba(201,162,39,.22), transparent 60%),
    radial-gradient(700px 500px at 0% 100%, rgba(201,162,39,.10), transparent 60%),
    var(--bg);
  color: var(--text);
  overflow-y: auto;
}
.bv-saltar {
  position: absolute; top: max(16px, env(safe-area-inset-top)); right: 16px;
  display: inline-flex; align-items: center; gap: 6px;
  background: transparent; border: 1px solid var(--border); border-radius: 999px;
  color: var(--text-sec); font: inherit; font-size: 13px; padding: 8px 12px; cursor: pointer;
}
.bv-pontos { position: absolute; top: max(24px, env(safe-area-inset-top)); left: 50%; transform: translateX(-50%); display: flex; gap: 8px; }
.bv-pontos span { width: 28px; height: 4px; border-radius: 4px; background: var(--border); transition: background .3s; }
.bv-pontos span.on { background: var(--gold); }
.bv-pontos span.feito { background: rgba(201,162,39,.45); }
.bv-conteudo { width: min(680px, 100%); }
.bv-olho { font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: var(--gold); font-weight: 600; }
.bv-h1 { font-family: var(--font-head); font-size: clamp(34px, 6vw, 60px); line-height: 1.04; letter-spacing: -.01em; margin: 14px 0 0; text-wrap: balance; }
.bv-p { font-size: clamp(16px, 2.2vw, 19px); line-height: 1.55; color: var(--text-sec); margin: 22px 0 0; max-width: 58ch; }
.bv-p strong { color: var(--text); }
.bv-mini { font-size: 14px; margin-top: 16px; }
.bv-endereco {
  display: inline-flex; align-items: center; gap: 10px; margin-top: 18px;
  padding: 12px 18px; border-radius: 999px; border: 1px solid var(--gold);
  background: rgba(201,162,39,.10); color: var(--text); text-decoration: none;
  font-weight: 600; font-size: clamp(15px, 2.4vw, 18px); word-break: break-all;
}
.bv-endereco svg { color: var(--gold); flex-shrink: 0; }
.bv-lista { list-style: none; padding: 0; margin: 22px 0 0; display: grid; gap: 10px; }
.bv-lista li { display: flex; gap: 10px; align-items: flex-start; font-size: 15px; color: var(--text-sec); }
.bv-lista svg { color: var(--gold); flex-shrink: 0; margin-top: 3px; }
.bv-tempo { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 22px; }
.bv-tempo-i { border: 1px solid var(--border); border-radius: 14px; padding: 14px; background: rgba(255,255,255,.03); }
.bv-tempo-i b { display: block; font-family: var(--font-head); font-size: 22px; color: var(--gold); }
.bv-tempo-i span { display: block; margin-top: 6px; font-size: 13px; line-height: 1.45; color: var(--text-sec); }
.bv-accoes { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; margin-top: 30px; }
.bv-btn {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 16px 26px; border-radius: 999px; border: 0; cursor: pointer;
  background: var(--gold); color: #111; font: inherit; font-weight: 700; font-size: 16px;
  box-shadow: var(--shadow-gold); animation: bvRespira 2.8s ease-in-out infinite;
}
.bv-btn:focus-visible { outline: 3px solid var(--text); outline-offset: 3px; }
.bv-btn-2 { background: transparent; border: 0; color: var(--text-sec); font: inherit; font-size: 15px; text-decoration: underline; cursor: pointer; padding: 10px 4px; }
@keyframes bvRespira {
  0%, 100% { box-shadow: 0 0 0 0 rgba(201,162,39,.35), var(--shadow-gold); }
  50%      { box-shadow: 0 0 0 12px rgba(201,162,39,0), var(--shadow-gold); }
}
@media (max-width: 640px) {
  .bv { place-items: start center; padding-top: 72px; }
  .bv-tempo { grid-template-columns: 1fr; }
  .bv-btn { width: 100%; justify-content: center; }
  .bv-pontos { top: max(22px, env(safe-area-inset-top)); left: 24px; transform: none; }
}
@media (prefers-reduced-motion: reduce) { .bv-btn { animation: none; } }
`;
