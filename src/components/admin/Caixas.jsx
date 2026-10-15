import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/*
 * AS CAIXAS DO MENU (15/10/2026, à Fresha).
 *
 * Cada página é uma caixa: ícone, título em duas palavras e uma frase. A
 * mesma caixa serve o ecrã «Mais» (as secções) e a página de cada secção
 * (as páginas dela). No telemóvel ficam em coluna; no computador, em grelha.
 *
 * `lista`: no telemóvel a página de uma secção é, como na Fresha, uma lista
 * dentro de um cartão — ícone, nome, seta — sem a frase. No computador fica
 * igual às outras caixas.
 */
export default function Caixas({ itens, colunas = 2, lista = false }) {
  return (
    <div className={`cx-grelha${lista ? ' cx-lista' : ''}`} style={{ '--cx-colunas': colunas }} data-grelha>
      {itens.map(it => {
        const Ic = it.icon;
        return (
          <Link key={it.to} to={it.to} className="cx">
            <span className="cx-icone">{Ic ? <Ic size={22} strokeWidth={1.8} /> : null}</span>
            <span className="cx-texto">
              <b>{it.label}</b>
              {it.d && <span>{it.d}</span>}
            </span>
            <ChevronRight size={18} className="cx-seta" />
          </Link>
        );
      })}
    </div>
  );
}

export const CSS_CAIXAS = `
.cx-grelha { display: grid; grid-template-columns: 1fr; gap: 10px; }
@media (min-width: 768px) { .cx-grelha { grid-template-columns: repeat(var(--cx-colunas, 2), minmax(0, 1fr)); gap: 14px; } }
.cx { display: flex; align-items: center; gap: 14px; padding: 16px; border-radius: 16px; text-decoration: none; color: var(--text);
  background: var(--surface); border: 1px solid var(--border); min-height: 72px; }
.cx:active { background: rgba(var(--gold-rgb), .10); }
@media (hover: hover) { .cx:hover { border-color: var(--text-ter); } }
.cx-icone { width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0; display: grid; place-items: center; background: rgba(var(--gold-rgb), .16); color: var(--gold-tinta, var(--gold)); }
.cx-texto { flex: 1; min-width: 0; display: grid; gap: 2px; }
.cx-texto b { font-size: 16px; font-weight: 700; }
.cx-texto span { font-size: 14px; color: var(--text-sec); line-height: 1.35; }
.cx-seta { color: var(--text-ter); flex-shrink: 0; }
@media (max-width: 767px) {
  .cx-lista { gap: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
  .cx-lista .cx { border: 0; border-bottom: 1px solid var(--border); border-radius: 0; min-height: 56px; padding: 14px 16px; background: none; }
  .cx-lista .cx:last-child { border-bottom: 0; }
  .cx-lista .cx-icone { width: 24px; height: 24px; border-radius: 0; background: none; color: var(--text); }
  .cx-lista .cx-icone svg { width: 20px; height: 20px; }
  .cx-lista .cx-texto b { font-size: 15.5px; font-weight: 600; }
  .cx-lista .cx-texto span { display: none; }
}
`;
