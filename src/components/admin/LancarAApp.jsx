import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Rocket } from 'lucide-react';
import { usePassos } from '@/components/PrimeirosPassos';

/*
 * «Lançar a app», no topo do menu.
 *
 * A lista dos primeiros passos vive no painel e na agenda. O problema é que
 * quem está a mexer nos serviços, nos horários ou no logótipo não está em
 * nenhuma dessas duas páginas — faz o trabalho e nunca mais vê quanto falta.
 * Uma linha no menu, que ele tem à frente em todas as páginas, resolve isso:
 * diz a conta, e leva lá.
 *
 * Desaparece quando estiver tudo feito e ele tiver fechado a caixa do fim —
 * a mesma regra da lista, e pela mesma razão: isto é para arrancar, não para
 * ficar.
 */
export default function LancarAApp({ onIr }) {
  const navigate = useNavigate();
  const { pronto, prontos, total, falta, escondido } = usePassos();

  if (!pronto || escondido) return null;

  const feito = prontos === total;

  const ir = () => {
    /* A lista lê isto ao abrir, traz-se ao ecrã e pisca uma vez. Sem isto,
       num painel comprido, ele chegava lá e não via nada diferente. */
    try { sessionStorage.setItem('convecta_ir_passos', '1'); } catch { /* sem sessionStorage */ }
    navigate('/admin/dashboard');
    onIr?.();
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <button type="button" className={`laa${feito ? ' laa-feito' : ''}`} onClick={ir}>
        <span className="laa-conta" aria-hidden="true">
          {feito ? <Rocket size={15} /> : `${prontos}/${total}`}
        </span>
        <span className="laa-texto">
          {feito ? 'A tua app está pronta' : 'Lança a tua app'}
          <small>{feito ? 'Partilha o link' : falta === 1 ? 'Falta um passo' : `Faltam ${falta} passos`}</small>
        </span>
        <ChevronRight size={16} className="laa-seta" />
      </button>
    </>
  );
}

const CSS = `
.laa {
  display: flex; align-items: center; gap: 11px; width: calc(100% - 24px);
  margin: 0 12px 10px; padding: 11px 12px; border-radius: 12px; cursor: pointer;
  border: 1px solid rgba(var(--gold-rgb), .45);
  background: rgba(var(--gold-rgb), .10);
  color: var(--text); font: inherit; text-align: left;
}
.laa:hover { background: rgba(var(--gold-rgb), .17); }
.laa-conta {
  flex-shrink: 0; min-width: 34px; height: 34px; padding: 0 7px; border-radius: 999px;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--gold); color: #111; font-size: 12.5px; font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.laa-texto { flex: 1; min-width: 0; font-size: 14.5px; font-weight: 700; line-height: 1.25; }
.laa-texto small {
  display: block; font-size: 12.5px; font-weight: 500; color: var(--text-sec); margin-top: 2px;
}
.laa-seta { flex-shrink: 0; color: var(--text-ter); }
.laa-feito { border-color: var(--gold); background: rgba(var(--gold-rgb), .18); }
`;
