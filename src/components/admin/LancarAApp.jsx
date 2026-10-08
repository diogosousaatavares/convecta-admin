import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { usePassos } from '@/components/PrimeirosPassos';

/*
 * «Lança a tua app», no topo do menu.
 *
 * A lista dos primeiros passos vive no painel e na agenda. O problema é que
 * quem está a mexer nos serviços, nos horários ou no logótipo não está em
 * nenhuma dessas duas páginas — faz o trabalho e nunca mais vê quanto falta.
 * Uma linha no menu, que ele tem à frente em todas as páginas, resolve isso.
 *
 * E diz duas coisas, não três: o nome, e quanto já fez. A frase «Faltam 3
 * passos» que aqui esteve dizia por palavras o que a barra diz por desenho,
 * e duas maneiras de dizer o mesmo na mesma caixa é ruído.
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
      <button type="button" className={`laa${feito ? ' laa-feito' : ''}`} onClick={ir}
        title={feito ? 'Partilha o link' : falta === 1 ? 'Falta um passo' : `Faltam ${falta} passos`}>
        <span className="laa-foguete" aria-hidden="true">🚀</span>
        <span className="laa-meio">
          <span className="laa-nome">{feito ? 'A tua app está pronta' : 'Lança a tua app'}</span>
          <span className="laa-barra-linha">
            <span className="laa-barra">
              <i style={{ width: `${Math.round((prontos / total) * 100)}%` }} />
            </span>
            <span className="laa-conta">{prontos}/{total}</span>
          </span>
        </span>
        <ChevronRight size={18} className="laa-seta" />
      </button>
    </>
  );
}

const CSS = `
.laa {
  display: grid; grid-template-columns: 46px 1fr 18px; align-items: center; gap: 13px;
  width: calc(100% - 24px); margin: 4px 12px 18px; padding: 13px 14px;
  border-radius: 16px; cursor: pointer; text-align: left; font: inherit;
  border: 1px solid var(--border); background: var(--elevated); color: var(--text);
}
.laa:hover { border-color: rgba(var(--gold-rgb), .55); }
.laa-foguete {
  width: 46px; height: 46px; border-radius: 999px; background: var(--gold);
  display: grid; place-items: center; font-size: 22px; line-height: 1;
}
.laa-meio { min-width: 0; display: block; }
.laa-nome {
  display: block; font-size: 16px; font-weight: 700; line-height: 1.2;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.laa-barra-linha { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
.laa-barra {
  flex: 1; min-width: 0; height: 7px; border-radius: 999px;
  background: var(--border); overflow: hidden;
}
.laa-barra i {
  display: block; height: 100%; border-radius: 999px; background: var(--gold);
  transition: width .35s ease;
}
.laa-conta {
  flex-shrink: 0; font-size: 13.5px; font-weight: 600; color: var(--text-sec);
  font-variant-numeric: tabular-nums;
}
.laa-seta { flex-shrink: 0; color: var(--text-ter); }
.laa-feito { border-color: var(--gold); }
`;
