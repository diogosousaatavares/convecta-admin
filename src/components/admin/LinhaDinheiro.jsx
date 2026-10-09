import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal, Button } from '@/components/ui';

/*
 * UMA LINHA DE DINHEIRO: hora, o que foi, quanto. Mais nada a vista.
 *
 * Tudo o resto — metodo, categoria, desconto, gorjeta, data, quem — fica na
 * ficha que abre ao tocar, como nos clientes. E uma linha so, e serve para
 * vendas, despesas, entradas e saidas: o que muda e a cor do valor e os
 * detalhes que cada uma traz.
 */
export default function LinhaDinheiro({ hora, titulo, valor, cor, detalhes = [], onApagar, apagarRotulo = 'Eliminar' }) {
  const [aberta, setAberta] = useState(false);
  return (
    <>
      <button type="button" className="ldin" onClick={() => setAberta(true)}>
        {hora && <span className="ldin-hora">{hora}</span>}
        <span className="ldin-t">{titulo}</span>
        <b className="ldin-v" style={cor ? { color: cor } : undefined}>{valor}</b>
      </button>
      {aberta && (
        <Modal open onClose={() => setAberta(false)} title="">
          <div className="ldin-ficha">
            <div className="ldin-ficha-t">{titulo}</div>
            <div className="ldin-ficha-v" style={cor ? { color: cor } : undefined}>{valor}</div>
            {detalhes.filter(d => d && d[1] != null && d[1] !== '' && d[1] !== '—').length > 0 && (
              <div className="ldin-dados">
                {detalhes.filter(d => d && d[1] != null && d[1] !== '' && d[1] !== '—').map(([k, v]) => (
                  <div key={k}><span>{k}</span><b>{v}</b></div>
                ))}
              </div>
            )}
            {onApagar && (
              <Button variant="ghost" onClick={() => { setAberta(false); onApagar(); }}><Trash2 size={15} /> {apagarRotulo}</Button>
            )}
          </div>
        </Modal>
      )}
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
    </>
  );
}

const CSS = `
.ldin {
  display: flex; align-items: center; gap: 12px; width: 100%; min-height: 50px; padding: 6px 2px;
  border: 0; border-bottom: 1px solid var(--border); background: transparent; color: var(--text); text-align: left; cursor: pointer; font: inherit;
}
.ldin:last-child { border-bottom: 0; }
.ldin-hora { width: 44px; flex-shrink: 0; font-weight: 700; color: var(--gold-tinta); font-variant-numeric: tabular-nums; font-size: 14.5px; }
.ldin-t { flex: 1; min-width: 0; font-size: 15px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ldin-v { flex-shrink: 0; font-size: 15.5px; font-weight: 700; white-space: nowrap; font-variant-numeric: tabular-nums; }
.ldin-ficha { display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
.ldin-ficha-t { font-size: 19px; font-weight: 700; }
.ldin-ficha-v { font-size: 30px; font-weight: 800; font-variant-numeric: tabular-nums; }
.ldin-dados { width: 100%; margin: 12px 0 10px; border-radius: 14px; background: var(--elevated); border: 1px solid var(--border); overflow: hidden; text-align: left; }
.ldin-dados > div { display: flex; justify-content: space-between; gap: 12px; align-items: center; min-height: 46px; padding: 0 14px; border-bottom: 1px solid var(--border); font-size: 15px; }
.ldin-dados > div:last-child { border-bottom: 0; }
.ldin-dados span { color: var(--text-sec); flex-shrink: 0; }
.ldin-dados b { font-weight: 600; text-align: right; min-width: 0; }
`;
